/**
 * Enhanced HUD Fair Market Rent API Route
 * File: app/api/hud/route.ts
 * 
 * Endpoints:
 * - GET /api/hud?zip=90210
 * - GET /api/hud?zip=90210,10001,60601 (batch)
 * - GET /api/hud?state=CA
 * - GET /api/hud/metro?zip=90210 (metro info only)
 * - GET /api/hud/nearby?zip=90210 (nearby metros)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchFairMarketRents,
  fetchFairMarketRentsByState,
  fetchMultipleFairMarketRents,
  getMetroInfoForZip,
  getNearbyMetros,
  validateZipCode,
} from '@/lib/api/hud';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/hud
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zipParam = searchParams.get('zip');
    const stateParam = searchParams.get('state');
    const metroOnly = searchParams.get('metroOnly') === 'true';
    const includeNearby = searchParams.get('includeNearby') === 'true';

    // Validate request parameters
    if (!zipParam && !stateParam) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Please provide either a ZIP code (?zip=90210) or state code (?state=CA)',
          },
        },
        { status: 400 }
      );
    }

    // Handle state-level request
    if (stateParam) {
      if (!/^[A-Z]{2}$/i.test(stateParam)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_STATE',
              message: 'State code must be 2 letters (e.g., CA, TX, NY)',
            },
          },
          { status: 400 }
        );
      }

      const data = await fetchFairMarketRentsByState(stateParam);

      return NextResponse.json({
        success: true,
        data,
        meta: {
          count: data.length,
          state: stateParam.toUpperCase(),
          source: 'HUD Fair Market Rent Program',
          year: 2024,
        },
      });
    }

    // Handle ZIP code request(s)
    if (zipParam) {
      const zipCodes = zipParam.split(',').map(z => z.trim());

      // Validate all ZIP codes first
      const invalidZips = zipCodes.filter(zip => !validateZipCode(zip));
      if (invalidZips.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ZIP',
              message: `Invalid ZIP code(s): ${invalidZips.join(', ')}. ZIP codes must be 5 digits.`,
              invalidZips,
            },
          },
          { status: 400 }
        );
      }

      // Single ZIP code request
      if (zipCodes.length === 1) {
        const zip = zipCodes[0];

        try {
          // Metro info only (no FMR data)
          if (metroOnly) {
            const metroInfo = await getMetroInfoForZip(zip);
            
            if (!metroInfo) {
              return NextResponse.json(
                {
                  success: false,
                  error: {
                    code: 'ZIP_NOT_FOUND',
                    message: `ZIP code ${zip} not found in our database.`,
                  },
                },
                { status: 404 }
              );
            }

            return NextResponse.json({
              success: true,
              data: {
                zipCode: zip,
                metro: {
                  cbsaCode: metroInfo.cbsaCode,
                  name: metroInfo.cbsaName,
                  city: metroInfo.cityName,
                  state: metroInfo.stateCode,
                  isSplitZip: metroInfo.isSplitZip,
                  residentialRatio: metroInfo.residentialRatio,
                },
              },
            });
          }

          // Full FMR data
          const data = await fetchFairMarketRents(zip);

          if (!data) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: `No Fair Market Rent data found for ZIP code: ${zip}`,
                },
              },
              { status: 404 }
            );
          }

          // Optionally include nearby metros for comparison
          let nearbyMetros = null;
          if (includeNearby) {
            nearbyMetros = await getNearbyMetros(zip, 5);
          }

          return NextResponse.json({
            success: true,
            data,
            meta: {
              zipCode: zip,
              metroArea: data.metroName,
              source: 'HUD Fair Market Rent Program',
              year: data.year,
              isSmallAreaFMR: data.isSmallAreaFMR,
            },
            ...(nearbyMetros && { nearbyMetros }),
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FETCH_ERROR',
                message: errorMessage,
              },
            },
            { status: 500 }
          );
        }
      }

      // Multiple ZIP codes (batch request)
      if (zipCodes.length > 20) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TOO_MANY_ZIPS',
              message: 'Maximum 20 ZIP codes per request. For larger datasets, use our bulk API.',
            },
          },
          { status: 400 }
        );
      }

      const results = await fetchMultipleFairMarketRents(zipCodes);

      // Separate successful and failed results
      const successful = results.filter(r => r.data !== null);
      const failed = results.filter(r => r.data === null);

      return NextResponse.json({
        success: true,
        data: successful.map(r => r.data),
        meta: {
          requested: zipCodes.length,
          successful: successful.length,
          failed: failed.length,
          source: 'HUD Fair Market Rent Program',
          year: 2024,
        },
        ...(failed.length > 0 && {
          errors: failed.map(f => ({
            zipCode: f.zipCode,
            error: f.error,
          })),
        }),
      });
    }

    // Should never reach here
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request parameters',
        },
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('HUD API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}