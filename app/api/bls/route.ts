import { NextRequest, NextResponse } from "next/server";
import {
  getCPIByState,
  getCPIByRegion,
  getNationalCPI,
  getCPITimeSeries,
  BLS_REGIONS,
} from "@/lib/api/bls";
import { APIError, APIErrorCode, APISource, CPICategory } from "@/types";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/api/rate-limit";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`bls:${clientId}`, RATE_LIMITS.heavy);

  if (!rateLimitResult.allowed) {
    const headers = createRateLimitHeaders(rateLimitResult);
    Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));

    return NextResponse.json(
      {
        success: false,
        error: {
          code: APIErrorCode.RATE_LIMITED,
          message: "Too many requests. Please try again later.",
        },
      },
      { status: 429, headers }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "national"; // national, state, region, timeseries, regions
  const stateCode = searchParams.get("state");
  const region = searchParams.get("region");
  const category = searchParams.get("category") as CPICategory | null;
  const years = searchParams.get("years");

  try {
    let result;

    switch (type) {
      case "national":
        result = await getNationalCPI();
        break;

      case "state":
        if (!stateCode) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: APIErrorCode.INVALID_PARAMS,
                message: "state parameter required for type=state",
              },
            },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await getCPIByState(stateCode);
        break;

      case "region":
        if (!region) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: APIErrorCode.INVALID_PARAMS,
                message:
                  "region parameter required. Valid values: national, northeast, midwest, south, west",
              },
            },
            { status: 400, headers: corsHeaders }
          );
        }
        const validRegions = ["national", "northeast", "midwest", "south", "west"];
        if (!validRegions.includes(region.toLowerCase())) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: APIErrorCode.INVALID_PARAMS,
                message: `Invalid region. Valid values: ${validRegions.join(", ")}`,
              },
            },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await getCPIByRegion(
          region.toLowerCase() as "national" | "northeast" | "midwest" | "south" | "west"
        );
        break;

      case "timeseries":
        const cat = category || CPICategory.ALL_ITEMS;
        const regionKey = (region?.toLowerCase() || "national") as
          | "national"
          | "northeast"
          | "midwest"
          | "south"
          | "west";
        const yearsNum = years ? parseInt(years) : 5;
        result = await getCPITimeSeries(cat, regionKey, yearsNum);
        break;

      case "regions":
        // Return list of BLS regions and their state mappings
        const headers = createRateLimitHeaders(rateLimitResult);
        Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));

        return NextResponse.json(
          {
            success: true,
            data: BLS_REGIONS,
            meta: {
              cached: false,
              source: APISource.BLS,
            },
          },
          { headers }
        );

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: APIErrorCode.INVALID_PARAMS,
              message:
                "Invalid type. Must be one of: national, state, region, timeseries, regions",
            },
          },
          { status: 400, headers: corsHeaders }
        );
    }

    const headers = createRateLimitHeaders(rateLimitResult);
    Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        meta: {
          cached: result.cached,
          cacheAge: result.cacheAge,
          source: APISource.BLS,
        },
      },
      { headers }
    );
  } catch (error) {
    console.error("BLS API error:", error);

    if (error instanceof APIError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.statusCode, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: APIErrorCode.INTERNAL_ERROR,
          message: "An unexpected error occurred",
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
