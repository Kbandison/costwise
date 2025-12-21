/**
 * HUD Fair Market Rent API Integration - ENHANCED VERSION
 * File: lib/api/hud.ts
 * 
 * Features:
 * - ZIP to CBSA crosswalk with fallback handling
 * - Detailed metro information in responses
 * - Graceful error handling for edge cases
 * - Smart caching with TTL
 * - Batch processing optimization
 */

import { getCachedData, setCachedData } from '../cache';
import type { HUDFairMarketRent } from '@/types';
import { APISource } from '@/types';
import { createClient } from '@supabase/supabase-js';

const HUD_API_CONFIG = {
  baseUrl: "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services",
  service: "Fair_Market_Rents/FeatureServer/0",
  timeout: 10000,
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days (FMR data updates quarterly)
} as const;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Extended type for crosswalk lookup results
 */
interface CBSACrosswalkResult {
  cbsaCode: string;
  cbsaName: string;
  cityName: string;
  stateCode: string;
  residentialRatio: number;
  isSplitZip: boolean;
}

/**
 * Look up CBSA code for a given ZIP code using the crosswalk table
 * Returns detailed metro information
 */
async function getMetroCodeForZip(zipCode: string): Promise<CBSACrosswalkResult | null> {
  try {
    // Get all CBSA mappings for this ZIP, ordered by residential ratio
    const { data, error } = await supabase
      .from('zip_to_cbsa')
      .select('cbsa_code, cbsa_name, residential_ratio')
      .eq('zip_code', zipCode)
      .order('residential_ratio', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`No CBSA mapping found for ZIP ${zipCode}`);
      return null;
    }

    // Get the primary CBSA (highest residential ratio)
    const primary = data[0];
    
    // Parse city and state from CBSA name (format: "City Name, ST")
    const nameParts = primary.cbsa_name.split(',');
    const cityName = nameParts[0]?.trim() || 'Unknown';
    const stateCode = nameParts[1]?.trim() || '';

    return {
      cbsaCode: primary.cbsa_code,
      cbsaName: primary.cbsa_name,
      cityName,
      stateCode,
      residentialRatio: primary.residential_ratio,
      isSplitZip: data.length > 1, // ZIP spans multiple metro areas
    };
  } catch (error) {
    console.error('Error looking up CBSA for ZIP:', error);
    return null;
  }
}

/**
 * Fetch Fair Market Rent data by CBSA code
 */
async function fetchFMRByCBSA(cbsaCode: string): Promise<any | null> {
  const endpoint = `${HUD_API_CONFIG.baseUrl}/${HUD_API_CONFIG.service}/query`;
  
  const params = new URLSearchParams({
    where: `FMR_CODE LIKE '%${cbsaCode}%'`,
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
    resultRecordCount: '1',
  });

  const url = `${endpoint}?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HUD_API_CONFIG.timeout);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HUD API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    return data.features[0].attributes;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('HUD API request timeout');
    }
    console.error('Error fetching FMR data:', error);
    throw error;
  }
}

/**
 * Main function: Fetch Fair Market Rent data for a ZIP code
 * 
 * ENHANCED with:
 * - Detailed metro information
 * - Better error messages
 * - Split ZIP handling
 * - Fallback strategies
 */
export async function fetchFairMarketRents(
  zipCode: string
): Promise<HUDFairMarketRent | null> {
  if (!validateZipCode(zipCode)) {
    throw new Error(`Invalid ZIP code format: ${zipCode}. ZIP codes must be 5 digits.`);
  }

  // Check cache first
  const cacheKey = `zip:${zipCode}`;
  const cached = await getCachedData<HUDFairMarketRent>(APISource.HUD, cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Step 1: Look up CBSA code for this ZIP
    const crosswalk = await getMetroCodeForZip(zipCode);
    
    if (!crosswalk) {
      // Enhanced error: ZIP not found in crosswalk
      throw new Error(
        `ZIP code ${zipCode} not found in our database. ` +
        `This may be a very new ZIP code or a special-use code. ` +
        `Try a nearby ZIP code or contact support.`
      );
    }

    // Step 2: Fetch FMR data for this CBSA
    const attrs = await fetchFMRByCBSA(crosswalk.cbsaCode);
    
    if (!attrs) {
      // Enhanced error: CBSA exists but no FMR data
      throw new Error(
        `No Fair Market Rent data available for ${crosswalk.cityName}. ` +
        `This metro area may not be covered by HUD's FMR program.`
      );
    }

    // Step 3: Format the response with enhanced metro information
    const fmrData: HUDFairMarketRent = {
      zipCode,
      countyName: attrs.FMR_AREANAME?.split(',')[0] || crosswalk.cityName,
      stateName: attrs.FMR_AREANAME?.split(',')[1]?.trim() || crosswalk.stateCode,
      stateCode: crosswalk.stateCode,
      metroName: attrs.FMR_AREANAME || crosswalk.cbsaName,
      metroCode: attrs.FMR_CODE,
      year: 2024,
      areaName: attrs.FMR_AREANAME || crosswalk.cbsaName,
      efficiency: attrs.FMR_0BDR || 0,
      oneBedroom: attrs.FMR_1BDR || 0,
      twoBedroom: attrs.FMR_2BDR || 0,
      threeBedroom: attrs.FMR_3BDR || 0,
      fourBedroom: attrs.FMR_4BDR || 0,
      isSmallAreaFMR: false,
    };

    // Cache the result with TTL
    await setCachedData(APISource.HUD, cacheKey, fmrData);

    return fmrData;
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw our custom errors with context
      throw error;
    }
    throw new Error(`Failed to fetch Fair Market Rent data for ZIP ${zipCode}`);
  }
}

/**
 * Fetch Fair Market Rent data by state code
 */
export async function fetchFairMarketRentsByState(
  stateCode: string
): Promise<HUDFairMarketRent[]> {
  const normalizedState = stateCode.toUpperCase();
  const cacheKey = `state:${normalizedState}`;
  
  const cached = await getCachedData<HUDFairMarketRent[]>(APISource.HUD, cacheKey);
  if (cached) {
    return cached;
  }

  const endpoint = `${HUD_API_CONFIG.baseUrl}/${HUD_API_CONFIG.service}/query`;
  const params = new URLSearchParams({
    where: `FMR_AREANAME LIKE '%${normalizedState}%'`,
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
    resultRecordCount: '100',
  });

  const url = `${endpoint}?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HUD_API_CONFIG.timeout);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HUD API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error(`No Fair Market Rent data found for state: ${normalizedState}`);
    }

    const fmrData: HUDFairMarketRent[] = data.features.map((feature: any) => {
      const attrs = feature.attributes;
      return {
        zipCode: '',
        countyName: attrs.FMR_AREANAME?.split(',')[0] || 'Unknown County',
        stateName: attrs.FMR_AREANAME?.split(',')[1]?.trim() || 'Unknown State',
        stateCode: attrs.FMR_AREANAME?.match(/,\s*([A-Z]{2})/)?.[1] || normalizedState,
        metroName: attrs.FMR_AREANAME,
        metroCode: attrs.FMR_CODE,
        year: 2024,
        areaName: attrs.FMR_AREANAME || 'Unknown Area',
        efficiency: attrs.FMR_0BDR || 0,
        oneBedroom: attrs.FMR_1BDR || 0,
        twoBedroom: attrs.FMR_2BDR || 0,
        threeBedroom: attrs.FMR_3BDR || 0,
        fourBedroom: attrs.FMR_4BDR || 0,
        isSmallAreaFMR: false,
      };
    });

    await setCachedData(APISource.HUD, cacheKey, fmrData);

    return fmrData;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('HUD API request timeout');
    }
    throw error;
  }
}

/**
 * Validate ZIP code format
 */
export function validateZipCode(zipCode: string): boolean {
  return /^\d{5}$/.test(zipCode);
}

/**
 * ENHANCED: Fetch multiple ZIP codes with better error handling
 * Returns results with individual error tracking
 */
export async function fetchMultipleFairMarketRents(
  zipCodes: string[]
): Promise<Array<{ zipCode: string; data: HUDFairMarketRent | null; error?: string }>> {
  const promises = zipCodes.map(async (zip) => {
    try {
      const data = await fetchFairMarketRents(zip);
      return { zipCode: zip, data };
    } catch (error) {
      return { 
        zipCode: zip, 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });
  
  return Promise.all(promises);
}

/**
 * Calculate average FMR across multiple data points
 */
export function calculateAverageFMR(
  fmrData: HUDFairMarketRent[]
): Omit<HUDFairMarketRent, 'zipCode' | 'areaName' | 'countyName' | 'stateName' | 'stateCode' | 'metroName' | 'metroCode' | 'year' | 'isSmallAreaFMR' | 'medianRent'> {
  if (fmrData.length === 0) {
    return {
      efficiency: 0,
      oneBedroom: 0,
      twoBedroom: 0,
      threeBedroom: 0,
      fourBedroom: 0,
    };
  }

  const sum = fmrData.reduce(
    (acc, data) => ({
      efficiency: acc.efficiency + data.efficiency,
      oneBedroom: acc.oneBedroom + data.oneBedroom,
      twoBedroom: acc.twoBedroom + data.twoBedroom,
      threeBedroom: acc.threeBedroom + data.threeBedroom,
      fourBedroom: acc.fourBedroom + data.fourBedroom,
    }),
    {
      efficiency: 0,
      oneBedroom: 0,
      twoBedroom: 0,
      threeBedroom: 0,
      fourBedroom: 0,
    }
  );

  const count = fmrData.length;

  return {
    efficiency: Math.round(sum.efficiency / count),
    oneBedroom: Math.round(sum.oneBedroom / count),
    twoBedroom: Math.round(sum.twoBedroom / count),
    threeBedroom: Math.round(sum.threeBedroom / count),
    fourBedroom: Math.round(sum.fourBedroom / count),
  };
}

/**
 * ENHANCEMENT: Get metro area details for a ZIP without full FMR data
 * Useful for showing users which metro area their ZIP belongs to
 */
export async function getMetroInfoForZip(zipCode: string): Promise<CBSACrosswalkResult | null> {
  if (!validateZipCode(zipCode)) {
    throw new Error(`Invalid ZIP code format: ${zipCode}`);
  }

  return await getMetroCodeForZip(zipCode);
}

/**
 * ENHANCEMENT: Find nearby metro areas for comparison
 * Returns top N metro areas in the same state
 */
export async function getNearbyMetros(
  zipCode: string,
  limit: number = 5
): Promise<CBSACrosswalkResult[]> {
  try {
    const crosswalk = await getMetroCodeForZip(zipCode);
    if (!crosswalk) {
      return [];
    }

    // Get other ZIPs in the same state
    const { data, error } = await supabase
      .from('zip_to_cbsa')
      .select('cbsa_code, cbsa_name, residential_ratio')
      .like('cbsa_name', `%${crosswalk.stateCode}%`)
      .neq('cbsa_code', crosswalk.cbsaCode)
      .order('residential_ratio', { ascending: false })
      .limit(limit * 3); // Get more to dedupe CBSAs

    if (error || !data) {
      return [];
    }

    // Deduplicate by CBSA code and return unique metros
    const seen = new Set<string>();
    const unique: CBSACrosswalkResult[] = [];

    for (const item of data) {
      if (!seen.has(item.cbsa_code) && unique.length < limit) {
        seen.add(item.cbsa_code);
        const nameParts = item.cbsa_name.split(',');
        unique.push({
          cbsaCode: item.cbsa_code,
          cbsaName: item.cbsa_name,
          cityName: nameParts[0]?.trim() || 'Unknown',
          stateCode: nameParts[1]?.trim() || '',
          residentialRatio: item.residential_ratio,
          isSplitZip: false,
        });
      }
    }

    return unique;
  } catch (error) {
    console.error('Error getting nearby metros:', error);
    return [];
  }
}