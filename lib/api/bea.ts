import type { RegionalPriceParity, BEAAPIResponse } from "@/types";
import { APISource, APIError, APIErrorCode, RPPLineCode } from "@/types";
import { generateCacheKey, withCache } from "./cache";

// BEA API configuration
const BEA_API_BASE = "https://apps.bea.gov/api/data";
const BEA_API_KEY = process.env.BEA_API_KEY;

// State FIPS to abbreviation mapping
const STATE_FIPS_TO_CODE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

/**
 * Build BEA API URL with parameters
 */
function buildBEAUrl(params: Record<string, string>): string {
  if (!BEA_API_KEY) {
    throw new APIError(
      APIErrorCode.INTERNAL_ERROR,
      "BEA API key not configured",
      500
    );
  }

  const searchParams = new URLSearchParams({
    UserID: BEA_API_KEY,
    method: "GetData",
    DataSetName: "Regional",
    ResultFormat: "JSON",
    ...params,
  });

  return `${BEA_API_BASE}?${searchParams.toString()}`;
}

/**
 * Parse BEA API response into RPP data grouped by geography
 */
function parseBEAResponse(
  response: BEAAPIResponse,
  year: string
): Map<string, Partial<RegionalPriceParity>> {
  const rppMap = new Map<string, Partial<RegionalPriceParity>>();

  if (!response.BEAAPI?.Results?.Data) {
    return rppMap;
  }

  for (const item of response.BEAAPI.Results.Data) {
    if (item.TimePeriod !== year) continue;

    const geoFips = item.GeoFips;
    const value = parseFloat(item.DataValue);

    if (isNaN(value)) continue;

    if (!rppMap.has(geoFips)) {
      rppMap.set(geoFips, {
        geoFips,
        geoName: item.GeoName,
        stateCode: STATE_FIPS_TO_CODE[geoFips.substring(0, 2)],
        year: parseInt(year),
      });
    }

    const rpp = rppMap.get(geoFips)!;

    switch (item.LineCode) {
      case RPPLineCode.ALL_ITEMS:
        rpp.overall = value;
        rpp.percentAboveNational = value - 100;
        break;
      case RPPLineCode.GOODS:
        rpp.goods = value;
        break;
      case RPPLineCode.SERVICES_RENTS:
        rpp.servicesRents = value;
        rpp.housing = value; // Rents are primary housing indicator
        break;
      case RPPLineCode.SERVICES_OTHER:
        rpp.servicesOther = value;
        break;
    }
  }

  return rppMap;
}

/**
 * Get the most recent available year for RPP data
 */
export async function getLatestRPPYear(): Promise<number> {
  // RPP data typically lags by 1-2 years
  const currentYear = new Date().getFullYear();
  return currentYear - 2;
}

/**
 * Fetch Regional Price Parities for all states
 */
export async function getRPPAllStates(
  year?: number
): Promise<{ data: RegionalPriceParity[]; cached: boolean; cacheAge?: number }> {
  const dataYear = year || (await getLatestRPPYear());
  const cacheKey = generateCacheKey(APISource.BEA, "rpp-states", { year: dataYear });

  const url = buildBEAUrl({
    TableName: "SARPP",
    LineCode: "1,2,3,4", // All items, goods, rents, other services
    GeoFips: "STATE",
    Year: String(dataYear),
  });

  return withCache<RegionalPriceParity[]>(
    cacheKey,
    { source: APISource.BEA, ttlSeconds: 86400 * 30 },
    async () => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new APIError(
          APIErrorCode.UPSTREAM_ERROR,
          `BEA API returned ${response.status}`,
          502
        );
      }

      const data: BEAAPIResponse = await response.json();
      const rppMap = parseBEAResponse(data, String(dataYear));

      // Convert to array and filter complete records
      const results: RegionalPriceParity[] = [];
      rppMap.forEach((rpp) => {
        if (rpp.overall !== undefined) {
          results.push(rpp as RegionalPriceParity);
        }
      });

      // Sort by overall RPP descending and add ranks
      results.sort((a, b) => b.overall - a.overall);
      results.forEach((rpp, index) => {
        rpp.rank = index + 1;
      });

      return results;
    },
    url,
    { year: dataYear }
  );
}

/**
 * Fetch Regional Price Parities for all metro areas
 */
export async function getRPPAllMetros(
  year?: number
): Promise<{ data: RegionalPriceParity[]; cached: boolean; cacheAge?: number }> {
  const dataYear = year || (await getLatestRPPYear());
  const cacheKey = generateCacheKey(APISource.BEA, "rpp-metros", { year: dataYear });

  const url = buildBEAUrl({
    TableName: "MARPP",
    LineCode: "1,2,3,4",
    GeoFips: "MSA",
    Year: String(dataYear),
  });

  return withCache<RegionalPriceParity[]>(
    cacheKey,
    { source: APISource.BEA, ttlSeconds: 86400 * 30 },
    async () => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new APIError(
          APIErrorCode.UPSTREAM_ERROR,
          `BEA API returned ${response.status}`,
          502
        );
      }

      const data: BEAAPIResponse = await response.json();
      const rppMap = parseBEAResponse(data, String(dataYear));

      const results: RegionalPriceParity[] = [];
      rppMap.forEach((rpp) => {
        if (rpp.overall !== undefined) {
          results.push(rpp as RegionalPriceParity);
        }
      });

      results.sort((a, b) => b.overall - a.overall);
      results.forEach((rpp, index) => {
        rpp.rank = index + 1;
      });

      return results;
    },
    url,
    { year: dataYear }
  );
}

/**
 * Fetch RPP for a specific state by FIPS code
 */
export async function getRPPByStateFips(
  stateFips: string,
  year?: number
): Promise<{ data: RegionalPriceParity | null; cached: boolean; cacheAge?: number }> {
  const dataYear = year || (await getLatestRPPYear());
  const cacheKey = generateCacheKey(APISource.BEA, "rpp-state", {
    stateFips,
    year: dataYear,
  });

  const url = buildBEAUrl({
    TableName: "SARPP",
    LineCode: "1,2,3,4",
    GeoFips: stateFips,
    Year: String(dataYear),
  });

  return withCache<RegionalPriceParity | null>(
    cacheKey,
    { source: APISource.BEA, ttlSeconds: 86400 * 30 },
    async () => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new APIError(
          APIErrorCode.UPSTREAM_ERROR,
          `BEA API returned ${response.status}`,
          502
        );
      }

      const data: BEAAPIResponse = await response.json();
      const rppMap = parseBEAResponse(data, String(dataYear));

      const rpp = rppMap.get(stateFips);
      return rpp?.overall !== undefined ? (rpp as RegionalPriceParity) : null;
    },
    url,
    { stateFips, year: dataYear }
  );
}

/**
 * Fetch RPP for a specific metro by CBSA code
 */
export async function getRPPByMetroCode(
  metroCode: string,
  year?: number
): Promise<{ data: RegionalPriceParity | null; cached: boolean; cacheAge?: number }> {
  const dataYear = year || (await getLatestRPPYear());
  const cacheKey = generateCacheKey(APISource.BEA, "rpp-metro", {
    metroCode,
    year: dataYear,
  });

  const url = buildBEAUrl({
    TableName: "MARPP",
    LineCode: "1,2,3,4",
    GeoFips: metroCode,
    Year: String(dataYear),
  });

  return withCache<RegionalPriceParity | null>(
    cacheKey,
    { source: APISource.BEA, ttlSeconds: 86400 * 30 },
    async () => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new APIError(
          APIErrorCode.UPSTREAM_ERROR,
          `BEA API returned ${response.status}`,
          502
        );
      }

      const data: BEAAPIResponse = await response.json();
      const rppMap = parseBEAResponse(data, String(dataYear));

      const rpp = rppMap.get(metroCode);
      return rpp?.overall !== undefined ? (rpp as RegionalPriceParity) : null;
    },
    url,
    { metroCode, year: dataYear }
  );
}

/**
 * Calculate percentage difference from national average
 */
export function calculatePercentDifference(rppValue: number): number {
  return rppValue - 100;
}

/**
 * Format RPP value for display
 */
export function formatRPPDisplay(rppValue: number): string {
  const diff = calculatePercentDifference(rppValue);
  if (diff > 0) {
    return `${diff.toFixed(1)}% above average`;
  } else if (diff < 0) {
    return `${Math.abs(diff).toFixed(1)}% below average`;
  }
  return "At national average";
}

/**
 * Get rank label for display
 */
export function getRankLabel(rank: number, total: number): string {
  const suffix = getOrdinalSuffix(rank);
  if (rank <= 5) {
    return `${rank}${suffix} most expensive`;
  } else if (rank > total - 5) {
    return `${rank}${suffix} most affordable`;
  }
  return `Ranked ${rank}${suffix} of ${total}`;
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
