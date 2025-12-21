import { NextRequest, NextResponse } from "next/server";
import {
  getEnergyPricesByState,
  getAllStateEnergyPrices,
  getAllStateUtilityCosts,
  calculateUtilityCost,
} from "@/lib/api/eia";
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
  const rateLimitResult = checkRateLimit(`eia:${clientId}`, RATE_LIMITS.heavy);

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
  const type = searchParams.get("type") || "all"; // all, state, utility
  const stateCode = searchParams.get("state");
  const electricityKwh = searchParams.get("electricityKwh");
  const naturalGasMcf = searchParams.get("naturalGasMcf");

  try {
    let result;

    switch (type) {
      case "all":
        result = await getAllStateEnergyPrices();
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
        result = await getEnergyPricesByState(stateCode);
        break;

      case "utility":
        // Calculate utility costs for all states
        const utilityCostsResult = await getAllStateUtilityCosts();

        // If custom consumption provided, recalculate
        if (electricityKwh || naturalGasMcf) {
          const kwhPerMonth = electricityKwh ? parseFloat(electricityKwh) : undefined;
          const mcfPerMonth = naturalGasMcf ? parseFloat(naturalGasMcf) : undefined;

          const energyResult = await getAllStateEnergyPrices();
          const customCosts = energyResult.data.map((energy) =>
            calculateUtilityCost(energy, kwhPerMonth, mcfPerMonth)
          );

          const headers = createRateLimitHeaders(rateLimitResult);
          Object.entries(corsHeaders).forEach(([key, value]) =>
            headers.set(key, value)
          );

          return NextResponse.json(
            {
              success: true,
              data: customCosts,
              meta: {
                cached: energyResult.cached,
                cacheAge: energyResult.cacheAge,
                source: APISource.EIA,
                assumptions: {
                  electricityKwhPerMonth: kwhPerMonth,
                  naturalGasMcfPerMonth: mcfPerMonth,
                },
              },
            },
            { headers }
          );
        }

        result = utilityCostsResult;
        break;

      case "utility-state":
        if (!stateCode) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: APIErrorCode.INVALID_PARAMS,
                message: "state parameter required for type=utility-state",
              },
            },
            { status: 400, headers: corsHeaders }
          );
        }

        const stateEnergyResult = await getEnergyPricesByState(stateCode);
        if (!stateEnergyResult.data) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: APIErrorCode.NOT_FOUND,
                message: `No energy data found for state: ${stateCode}`,
              },
            },
            { status: 404, headers: corsHeaders }
          );
        }

        const kwhMonth = electricityKwh ? parseFloat(electricityKwh) : undefined;
        const mcfMonth = naturalGasMcf ? parseFloat(naturalGasMcf) : undefined;
        const utilityCost = calculateUtilityCost(
          stateEnergyResult.data,
          kwhMonth,
          mcfMonth
        );

        const headers2 = createRateLimitHeaders(rateLimitResult);
        Object.entries(corsHeaders).forEach(([key, value]) =>
          headers2.set(key, value)
        );

        return NextResponse.json(
          {
            success: true,
            data: {
              energy: stateEnergyResult.data,
              utility: utilityCost,
            },
            meta: {
              cached: stateEnergyResult.cached,
              cacheAge: stateEnergyResult.cacheAge,
              source: APISource.EIA,
            },
          },
          { headers: headers2 }
        );

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: APIErrorCode.INVALID_PARAMS,
              message:
                "Invalid type. Must be one of: all, state, utility, utility-state",
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
          source: APISource.EIA,
        },
      },
      { headers }
    );
  } catch (error) {
    console.error("EIA API error:", error);

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
