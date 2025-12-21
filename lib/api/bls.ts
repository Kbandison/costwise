import type { CPIData, CPIIndexes, BLSAPIResponse, BLSRegion } from "@/types";
import { APISource, APIError, APIErrorCode, CPICategory } from "@/types";
import { generateCacheKey, withCache } from "./cache";

// BLS API configuration
const BLS_API_BASE = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
const BLS_API_KEY = process.env.BLS_API_KEY;

// CPI Series IDs
// Format: CUUR[region][item]
// Region codes: 0000 = US City Average
// Item codes: SAF = Food, SAT = Transportation, SAM = Medical Care, SA0 = All Items

const CPI_SERIES = {
  // National averages
  national: {
    food: "CUUR0000SAF",
    transportation: "CUUR0000SAT",
    medical: "CUUR0000SAM",
    housing: "CUUR0000SAH",
    all: "CUUR0000SA0",
  },
  // Regional series (by BLS region)
  // Region A: Northeast urban
  northeast: {
    food: "CUUR0100SAF",
    transportation: "CUUR0100SAT",
    medical: "CUUR0100SAM",
    housing: "CUUR0100SAH",
    all: "CUUR0100SA0",
  },
  // Region B: Midwest urban
  midwest: {
    food: "CUUR0200SAF",
    transportation: "CUUR0200SAT",
    medical: "CUUR0200SAM",
    housing: "CUUR0200SAH",
    all: "CUUR0200SA0",
  },
  // Region C: South urban
  south: {
    food: "CUUR0300SAF",
    transportation: "CUUR0300SAT",
    medical: "CUUR0300SAM",
    housing: "CUUR0300SAH",
    all: "CUUR0300SA0",
  },
  // Region D: West urban
  west: {
    food: "CUUR0400SAF",
    transportation: "CUUR0400SAT",
    medical: "CUUR0400SAM",
    housing: "CUUR0400SAH",
    all: "CUUR0400SA0",
  },
};

// BLS Regions with state mappings
export const BLS_REGIONS: BLSRegion[] = [
  {
    code: "0100",
    name: "Northeast",
    states: ["CT", "ME", "MA", "NH", "NJ", "NY", "PA", "RI", "VT"],
  },
  {
    code: "0200",
    name: "Midwest",
    states: ["IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"],
  },
  {
    code: "0300",
    name: "South",
    states: [
      "AL", "AR", "DE", "DC", "FL", "GA", "KY", "LA", "MD", "MS",
      "NC", "OK", "SC", "TN", "TX", "VA", "WV",
    ],
  },
  {
    code: "0400",
    name: "West",
    states: ["AK", "AZ", "CA", "CO", "HI", "ID", "MT", "NV", "NM", "OR", "UT", "WA", "WY"],
  },
];

/**
 * Get BLS region for a state code
 */
export function getRegionForState(stateCode: string): BLSRegion | null {
  const upper = stateCode.toUpperCase();
  return BLS_REGIONS.find((region) => region.states.includes(upper)) || null;
}

/**
 * Get region key from state code
 */
function getRegionKey(stateCode: string): keyof typeof CPI_SERIES {
  const region = getRegionForState(stateCode);
  if (!region) return "national";

  switch (region.code) {
    case "0100":
      return "northeast";
    case "0200":
      return "midwest";
    case "0300":
      return "south";
    case "0400":
      return "west";
    default:
      return "national";
  }
}

/**
 * Fetch CPI data from BLS API
 */
async function fetchBLSData(
  seriesIds: string[],
  startYear: number,
  endYear: number
): Promise<BLSAPIResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const body: Record<string, unknown> = {
    seriesid: seriesIds,
    startyear: String(startYear),
    endyear: String(endYear),
  };

  if (BLS_API_KEY) {
    body.registrationkey = BLS_API_KEY;
  }

  const response = await fetch(BLS_API_BASE, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new APIError(
      APIErrorCode.UPSTREAM_ERROR,
      `BLS API returned ${response.status}`,
      502
    );
  }

  const data: BLSAPIResponse = await response.json();

  if (data.status !== "REQUEST_SUCCEEDED") {
    throw new APIError(
      APIErrorCode.UPSTREAM_ERROR,
      data.message?.join(", ") || "BLS API request failed",
      502
    );
  }

  return data;
}

/**
 * Parse BLS response into CPIData array
 */
function parseBLSResponse(
  response: BLSAPIResponse,
  category: CPICategory,
  regionCode: string,
  regionName: string
): CPIData[] {
  const results: CPIData[] = [];

  for (const series of response.Results.series) {
    for (const dataPoint of series.data) {
      // Only include monthly data (M01-M12), skip annual (M13)
      if (!dataPoint.period.startsWith("M") || dataPoint.period === "M13") {
        continue;
      }

      results.push({
        seriesId: series.seriesID,
        category,
        regionCode,
        regionName,
        year: parseInt(dataPoint.year),
        month: parseInt(dataPoint.period.substring(1)),
        period: dataPoint.period,
        value: parseFloat(dataPoint.value),
        footnotes: dataPoint.footnotes
          ?.filter((f) => f.text)
          .map((f) => f.text),
      });
    }
  }

  return results;
}

/**
 * Get the latest CPI value from a series
 */
function getLatestCPIValue(data: CPIData[]): number | null {
  if (data.length === 0) return null;

  // Sort by year and month descending
  const sorted = [...data].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return sorted[0].value;
}

/**
 * Fetch CPI data for all categories for a region
 */
export async function getCPIByRegion(
  regionKey: keyof typeof CPI_SERIES
): Promise<{ data: CPIIndexes; cached: boolean; cacheAge?: number }> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 1;

  const cacheKey = generateCacheKey(APISource.BLS, "cpi-region", {
    region: regionKey,
    year: currentYear,
  });

  const series = CPI_SERIES[regionKey];
  const nationalSeries = CPI_SERIES.national;

  return withCache<CPIIndexes>(
    cacheKey,
    { source: APISource.BLS, ttlSeconds: 86400 * 7 },
    async () => {
      // Fetch regional and national data
      const seriesIds = [
        series.food,
        series.transportation,
        series.medical,
        series.all,
        nationalSeries.food,
        nationalSeries.transportation,
        nationalSeries.medical,
        nationalSeries.all,
      ];

      const response = await fetchBLSData(seriesIds, startYear, currentYear);

      // Parse response and organize by series
      const dataBySeriesId = new Map<string, CPIData[]>();

      for (const seriesResult of response.Results.series) {
        const cpiData = parseBLSResponse(
          { ...response, Results: { series: [seriesResult] } },
          CPICategory.ALL_ITEMS,
          regionKey,
          regionKey
        );
        dataBySeriesId.set(seriesResult.seriesID, cpiData);
      }

      // Get latest values
      const regionalFood = getLatestCPIValue(dataBySeriesId.get(series.food) || []);
      const regionalTransport = getLatestCPIValue(
        dataBySeriesId.get(series.transportation) || []
      );
      const regionalMedical = getLatestCPIValue(dataBySeriesId.get(series.medical) || []);
      const regionalAll = getLatestCPIValue(dataBySeriesId.get(series.all) || []);

      const nationalFood = getLatestCPIValue(
        dataBySeriesId.get(nationalSeries.food) || []
      );
      const nationalTransport = getLatestCPIValue(
        dataBySeriesId.get(nationalSeries.transportation) || []
      );
      const nationalMedical = getLatestCPIValue(
        dataBySeriesId.get(nationalSeries.medical) || []
      );
      const nationalAll = getLatestCPIValue(
        dataBySeriesId.get(nationalSeries.all) || []
      );

      // Calculate indexes (regional / national * 100)
      return {
        food: regionalFood || 0,
        transportation: regionalTransport || 0,
        medical: regionalMedical || 0,
        overall: regionalAll || 0,
        foodIndex:
          nationalFood && regionalFood
            ? (regionalFood / nationalFood) * 100
            : 100,
        transportationIndex:
          nationalTransport && regionalTransport
            ? (regionalTransport / nationalTransport) * 100
            : 100,
        medicalIndex:
          nationalMedical && regionalMedical
            ? (regionalMedical / nationalMedical) * 100
            : 100,
      };
    }
  );
}

/**
 * Fetch CPI data for a state (mapped to region)
 */
export async function getCPIByState(
  stateCode: string
): Promise<{ data: CPIIndexes; cached: boolean; cacheAge?: number }> {
  const regionKey = getRegionKey(stateCode);
  return getCPIByRegion(regionKey);
}

/**
 * Fetch national CPI averages
 */
export async function getNationalCPI(): Promise<{
  data: CPIIndexes;
  cached: boolean;
  cacheAge?: number;
}> {
  return getCPIByRegion("national");
}

/**
 * Fetch CPI time series for a specific category and region
 */
export async function getCPITimeSeries(
  category: CPICategory,
  regionKey: keyof typeof CPI_SERIES = "national",
  years: number = 5
): Promise<{ data: CPIData[]; cached: boolean; cacheAge?: number }> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - years;

  const cacheKey = generateCacheKey(APISource.BLS, "cpi-timeseries", {
    category,
    region: regionKey,
    startYear,
    endYear: currentYear,
  });

  const series = CPI_SERIES[regionKey];
  let seriesId: string;

  switch (category) {
    case CPICategory.FOOD:
      seriesId = series.food;
      break;
    case CPICategory.TRANSPORTATION:
      seriesId = series.transportation;
      break;
    case CPICategory.MEDICAL_CARE:
      seriesId = series.medical;
      break;
    case CPICategory.HOUSING:
      seriesId = series.housing;
      break;
    default:
      seriesId = series.all;
  }

  return withCache<CPIData[]>(
    cacheKey,
    { source: APISource.BLS, ttlSeconds: 86400 * 7 },
    async () => {
      const response = await fetchBLSData([seriesId], startYear, currentYear);

      const regionInfo = BLS_REGIONS.find(
        (r) =>
          r.code === (regionKey === "national" ? "0000" : CPI_SERIES[regionKey].all.substring(4, 8))
      );

      return parseBLSResponse(
        response,
        category,
        regionKey,
        regionInfo?.name || "National"
      );
    }
  );
}

/**
 * Calculate year-over-year inflation rate
 */
export function calculateInflationRate(
  currentValue: number,
  previousValue: number
): number {
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Format CPI index for display
 */
export function formatCPIIndexDisplay(index: number): string {
  const diff = index - 100;
  if (Math.abs(diff) < 0.5) {
    return "At national average";
  } else if (diff > 0) {
    return `${diff.toFixed(1)}% above average`;
  }
  return `${Math.abs(diff).toFixed(1)}% below average`;
}
