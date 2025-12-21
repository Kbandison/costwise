import { NextRequest, NextResponse } from "next/server";
import {
  getRPPAllStates,
  getRPPAllMetros,
  getRPPByStateFips,
  getRPPByMetroCode,
} from "@/lib/api/bea";
import { APIError, APIErrorCode, APISource } from "@/types";
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
  const rateLimitResult = checkRateLimit(`bea:${clientId}`, RATE_LIMITS.heavy);

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
  const type = searchParams.get("type") || "states"; // states, metros, state, metro
  const stateFips = searchParams.get("stateFips");
  const metroCode = searchParams.get("metroCode");
  const year = searchParams.get("year");

  try {
    let result;
    const yearNum = year ? parseInt(year) : undefined;

    switch (type) {
      case "states":
        result = await getRPPAllStates(yearNum);
        break;
      case "metros":
        result = await getRPPAllMetros(yearNum);
        break;
      case "state":
        if (!stateFips) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: APIErrorCode.INVALID_PARAMS,
                message: "stateFips parameter required for type=state",
              },
            },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await getRPPByStateFips(stateFips, yearNum);
        break;
      case "metro":
        if (!metroCode) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: APIErrorCode.INVALID_PARAMS,
                message: "metroCode parameter required for type=metro",
              },
            },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await getRPPByMetroCode(metroCode, yearNum);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: APIErrorCode.INVALID_PARAMS,
              message: "Invalid type. Must be one of: states, metros, state, metro",
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
          source: APISource.BEA,
          dataYear: yearNum,
        },
      },
      { headers }
    );
  } catch (error) {
    console.error("BEA API error:", error);

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
