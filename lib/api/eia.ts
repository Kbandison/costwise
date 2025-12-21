import type { EnergyPrices, UtilityCostEstimate, EIAAPIResponse } from "@/types";
import { APISource, APIError, APIErrorCode } from "@/types";
import { generateCacheKey, withCache } from "./cache";

// EIA API configuration
const EIA_API_BASE = "https://api.eia.gov/v2";
const EIA_API_KEY = process.env.EIA_API_KEY;

// Average monthly consumption assumptions
const AVG_MONTHLY_ELECTRICITY_KWH = 886; // US average
const AVG_MONTHLY_NATURAL_GAS_MCF = 5.5; // US average (varies by season)

// State name to code mapping
const STATE_NAME_TO_CODE: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI",
  Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
  Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
  "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY",
};

const STATE_CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAME_TO_CODE).map(([name, code]) => [code, name])
);

/**
 * Build EIA API URL
 */
function buildEIAUrl(endpoint: string, params: Record<string, string>): string {
  if (!EIA_API_KEY) {
    throw new APIError(
      APIErrorCode.INTERNAL_ERROR,
      "EIA API key not configured",
      500
    );
  }

  const searchParams = new URLSearchParams({
    api_key: EIA_API_KEY,
    ...params,
  });

  return `${EIA_API_BASE}/${endpoint}?${searchParams.toString()}`;
}

/**
 * Fetch electricity prices by state
 */
export async function getElectricityPricesByState(): Promise<{
  data: Record<string, number>;
  cached: boolean;
  cacheAge?: number;
}> {
  const cacheKey = generateCacheKey(APISource.EIA, "electricity-prices", {});

  // Endpoint: electricity/retail-sales
  // Facets: sectorid=RES (residential), stateid
  const url = buildEIAUrl("electricity/retail-sales/data", {
    frequency: "monthly",
    "data[0]": "price",
    "facets[sectorid][]": "RES",
    sort: "[{\"column\":\"period\",\"direction\":\"desc\"}]",
    length: "500",
  });

  return withCache<Record<string, number>>(
    cacheKey,
    { source: APISource.EIA, ttlSeconds: 86400 * 7 },
    async () => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new APIError(
          APIErrorCode.UPSTREAM_ERROR,
          `EIA API returned ${response.status}`,
          502
        );
      }

      const data: EIAAPIResponse = await response.json();
      const priceRecord: Record<string, number> = {};

      if (!data.response?.data) {
        return priceRecord;
      }

      // Get most recent data for each state
      const latestByState: Record<string, { period: string; price: number }> = {};

      for (const item of data.response.data) {
        const stateId = item.stateId;
        const price = item.price;

        if (!stateId || price === undefined || price === null) continue;

        const existing = latestByState[stateId];
        if (!existing || item.period > existing.period) {
          latestByState[stateId] = { period: item.period, price };
        }
      }

      Object.entries(latestByState).forEach(([stateId, value]) => {
        priceRecord[stateId] = value.price;
      });

      return priceRecord;
    },
    url
  );
}

/**
 * Fetch gasoline prices by state
 * Regular unleaded gasoline retail prices
 */
export async function getGasolinePricesByState(): Promise<{
  data: Record<string, number>;
  cached: boolean;
  cacheAge?: number;
}> {
  const cacheKey = generateCacheKey(APISource.EIA, "gasoline-prices", {});

  // Endpoint: petroleum/pri/gnd (gasoline and diesel prices)
  // EMM_EPM0_PTE_R: Regular gasoline, price to end users, by region
  const url = buildEIAUrl("petroleum/pri/gnd/data", {
    frequency: "weekly",
    "data[0]": "value",
    "facets[product][]": "EPM0", // Total Gasoline (all formulations)
    "facets[process][]": "PTE", // Price to end users
    length: "5000", // Maximum allowed to get all regions
  });

  return withCache<Record<string, number>>(
    cacheKey,
    { source: APISource.EIA, ttlSeconds: 86400 * 7 },
    async () => {
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`EIA Gasoline API returned ${response.status}`);
        return {};
      }

      const data: EIAAPIResponse = await response.json();
      const priceRecord: Record<string, number> = {};

      console.log(`[GASOLINE] API response total records: ${data.response?.total}`);
      console.log(`[GASOLINE] API response data length: ${data.response?.data?.length}`);

      if (!data.response?.data) {
        console.warn(`[GASOLINE] No response data from API`);
        return priceRecord;
      }

      // Map PADD regions to states - EIA groups states by petroleum regions
      const PADD_TO_STATES: Record<string, string[]> = {
        "R1X": ["CT", "ME", "MA", "NH", "RI", "VT"], // PADD 1A - New England
        "R1Y": ["DE", "DC", "MD", "NJ", "NY", "PA"], // PADD 1B - Central Atlantic
        "R1Z": ["FL", "GA", "NC", "SC", "VA", "WV"], // PADD 1C - Lower Atlantic
        "R20": ["IL", "IN", "IA", "KS", "KY", "MI", "MN", "MO", "NE", "ND", "OH", "OK", "SD", "TN", "WI"], // PADD 2 - Midwest
        "R30": ["AL", "AR", "LA", "MS", "NM", "TX"], // PADD 3 - Gulf Coast
        "R40": ["CO", "ID", "MT", "UT", "WY"], // PADD 4 - Rocky Mountain
        "R5XCA": ["AZ", "NV", "OR", "WA", "AK"], // PADD 5 except California
        "SCA": ["CA"], // California (has its own state-level data)
      };

      const latestByRegion: Record<string, { period: string; price: number }> = {};

      for (const item of data.response.data) {
        const regionCode = item.duoarea;
        const price = item.value ?? item.price;

        if (!regionCode || price === undefined || price === null) continue;

        // Skip if not a PADD region or California
        if (!PADD_TO_STATES[regionCode]) continue;

        const existing = latestByRegion[regionCode];
        if (!existing || item.period > existing.period) {
          const numPrice = typeof price === "number" ? price : parseFloat(String(price));
          if (isNaN(numPrice)) continue;

          latestByRegion[regionCode] = {
            period: item.period,
            price: numPrice,
          };
        }
      }

      // Map regional prices to individual states
      const regionCount = Object.keys(latestByRegion).length;
      console.log(`[GASOLINE] Found ${regionCount} regions with data:`, Object.keys(latestByRegion));

      Object.entries(latestByRegion).forEach(([regionCode, value]) => {
        const states = PADD_TO_STATES[regionCode];
        if (states) {
          states.forEach((stateCode) => {
            priceRecord[stateCode] = value.price;
          });
        }
      });

      const stateCount = Object.keys(priceRecord).length;
      console.log(`[GASOLINE] Mapped prices to ${stateCount} states`);
      if (stateCount > 0) {
        const sample = Object.entries(priceRecord).slice(0, 3);
        console.log(`[GASOLINE] Sample prices:`, sample);
      }

      return priceRecord;
    },
    url
  );
}

/**
 * Fetch natural gas prices by state
 */
export async function getNaturalGasPricesByState(): Promise<{
  data: Record<string, number>;
  cached: boolean;
  cacheAge?: number;
}> {
  const cacheKey = generateCacheKey(APISource.EIA, "naturalgas-prices", {});

  // Endpoint: natural-gas/pri/sum
  const url = buildEIAUrl("natural-gas/pri/sum/data", {
    frequency: "monthly",
    "data[0]": "value",
    "facets[process][]": "PRS", // Residential price
    sort: "[{\"column\":\"period\",\"direction\":\"desc\"}]",
    length: "500",
  });

  return withCache<Record<string, number>>(
    cacheKey,
    { source: APISource.EIA, ttlSeconds: 86400 * 7 },
    async () => {
      const response = await fetch(url);

      if (!response.ok) {
        // Natural gas data may not be available for all endpoints
        console.warn(`EIA Natural Gas API returned ${response.status}`);
        return {};
      }

      const data: EIAAPIResponse = await response.json();
      const priceRecord: Record<string, number> = {};

      if (!data.response?.data) {
        return priceRecord;
      }

      const latestByState: Record<string, { period: string; price: number }> = {};

      for (const item of data.response.data) {
        const stateName = item.stateDescription;
        const price = item.price ?? (item as Record<string, unknown>).value;

        if (!stateName || price === undefined || price === null) continue;

        const stateCode = STATE_NAME_TO_CODE[stateName];
        if (!stateCode) continue;

        const existing = latestByState[stateCode];
        if (!existing || item.period > existing.period) {
          latestByState[stateCode] = {
            period: item.period,
            price: typeof price === "number" ? price : parseFloat(price as string),
          };
        }
      }

      Object.entries(latestByState).forEach(([stateCode, value]) => {
        priceRecord[stateCode] = value.price;
      });

      return priceRecord;
    },
    url
  );
}

/**
 * Get energy prices for a specific state
 */
export async function getEnergyPricesByState(
  stateCode: string
): Promise<{ data: EnergyPrices | null; cached: boolean; cacheAge?: number }> {
  const upperState = stateCode.toUpperCase();

  if (!/^[A-Z]{2}$/.test(upperState)) {
    throw new APIError(
      APIErrorCode.INVALID_PARAMS,
      "Invalid state code. Must be 2 letter abbreviation.",
      400
    );
  }

  const cacheKey = generateCacheKey(APISource.EIA, "energy-state", {
    stateCode: upperState,
  });

  return withCache<EnergyPrices | null>(
    cacheKey,
    { source: APISource.EIA, ttlSeconds: 86400 * 7 },
    async () => {
      // Use Promise.allSettled to allow partial failures
      const results = await Promise.allSettled([
        getElectricityPricesByState(),
        getNaturalGasPricesByState(),
        getGasolinePricesByState(),
      ]);

      const electricityResult = results[0].status === 'fulfilled' ? results[0].value : null;
      const gasResult = results[1].status === 'fulfilled' ? results[1].value : null;
      const gasolineResult = results[2].status === 'fulfilled' ? results[2].value : null;

      console.log(`[ENERGY-${upperState}] Promise.allSettled results:`, {
        electricity: results[0].status,
        naturalGas: results[1].status,
        gasoline: results[2].status
      });

      // Safely get prices from Record objects
      const electricityPrice = electricityResult?.data?.[upperState];
      const naturalGasPrice = gasResult?.data?.[upperState];
      const gasolinePrice = gasolineResult?.data?.[upperState];

      console.log(`[ENERGY-${upperState}] Extracted prices:`, {
        electricityPrice,
        naturalGasPrice,
        gasolinePrice,
        gasolineRecordSize: gasolineResult?.data ? Object.keys(gasolineResult.data).length : 0
      });

      // Allow partial data - don't require electricity if we have gasoline
      if (electricityPrice === undefined && gasolinePrice === undefined) {
        console.warn(`[ENERGY-${upperState}] No energy data available for state`);
        return null;
      }

      // Calculate national averages
      let electricitySum = 0;
      let electricityCount = 0;
      let gasSum = 0;
      let gasCount = 0;
      let gasolineSum = 0;
      let gasolineCount = 0;

      if (electricityResult?.data) {
        Object.values(electricityResult.data).forEach((price) => {
          electricitySum += price;
          electricityCount++;
        });
      }

      if (gasResult?.data) {
        Object.values(gasResult.data).forEach((price) => {
          gasSum += price;
          gasCount++;
        });
      }

      if (gasolineResult?.data) {
        Object.values(gasolineResult.data).forEach((price) => {
          gasolineSum += price;
          gasolineCount++;
        });
      }

      const electricityNationalAvg =
        electricityCount > 0 ? electricitySum / electricityCount : 0;
      const naturalGasNationalAvg = gasCount > 0 ? gasSum / gasCount : undefined;
      const gasolineNationalAvg = gasolineCount > 0 ? gasolineSum / gasolineCount : undefined;

      const currentDate = new Date();

      return {
        stateCode: upperState,
        stateName: STATE_CODE_TO_NAME[upperState] || upperState,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        electricityPrice,
        naturalGasPrice,
        gasolinePrice,
        electricityNationalAvg,
        naturalGasNationalAvg,
        gasolineNationalAvg,
        electricityIndex:
          electricityPrice !== undefined && electricityNationalAvg > 0
            ? (electricityPrice / electricityNationalAvg) * 100
            : undefined,
        naturalGasIndex:
          naturalGasPrice && naturalGasNationalAvg && naturalGasNationalAvg > 0
            ? (naturalGasPrice / naturalGasNationalAvg) * 100
            : undefined,
        gasolineIndex:
          gasolinePrice && gasolineNationalAvg && gasolineNationalAvg > 0
            ? (gasolinePrice / gasolineNationalAvg) * 100
            : undefined,
      };
    }
  );
}

/**
 * Get energy prices for all states
 */
export async function getAllStateEnergyPrices(): Promise<{
  data: EnergyPrices[];
  cached: boolean;
  cacheAge?: number;
}> {
  const cacheKey = generateCacheKey(APISource.EIA, "energy-all-states", {});

  return withCache<EnergyPrices[]>(
    cacheKey,
    { source: APISource.EIA, ttlSeconds: 86400 * 7 },
    async () => {
      const [electricityResult, gasResult, gasolineResult] = await Promise.all([
        getElectricityPricesByState(),
        getNaturalGasPricesByState(),
        getGasolinePricesByState(),
      ]);

      // Calculate national averages
      let electricitySum = 0;
      let electricityCount = 0;
      let gasSum = 0;
      let gasCount = 0;
      let gasolineSum = 0;
      let gasolineCount = 0;

      electricityResult.data.forEach((price) => {
        electricitySum += price;
        electricityCount++;
      });

      gasResult.data.forEach((price) => {
        gasSum += price;
        gasCount++;
      });

      gasolineResult.data.forEach((price) => {
        gasolineSum += price;
        gasolineCount++;
      });

      const electricityNationalAvg =
        electricityCount > 0 ? electricitySum / electricityCount : 0;
      const naturalGasNationalAvg = gasCount > 0 ? gasSum / gasCount : undefined;
      const gasolineNationalAvg = gasolineCount > 0 ? gasolineSum / gasolineCount : undefined;

      const currentDate = new Date();
      const results: EnergyPrices[] = [];

      electricityResult.data.forEach((electricityPrice, stateCode) => {
        const naturalGasPrice = gasResult.data.get(stateCode);
        const gasolinePrice = gasolineResult.data.get(stateCode);

        results.push({
          stateCode,
          stateName: STATE_CODE_TO_NAME[stateCode] || stateCode,
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
          electricityPrice,
          naturalGasPrice,
          gasolinePrice,
          electricityNationalAvg,
          naturalGasNationalAvg,
          gasolineNationalAvg,
          electricityIndex:
            electricityNationalAvg > 0
              ? (electricityPrice / electricityNationalAvg) * 100
              : 100,
          naturalGasIndex:
            naturalGasPrice && naturalGasNationalAvg && naturalGasNationalAvg > 0
              ? (naturalGasPrice / naturalGasNationalAvg) * 100
              : undefined,
          gasolineIndex:
            gasolinePrice && gasolineNationalAvg && gasolineNationalAvg > 0
              ? (gasolinePrice / gasolineNationalAvg) * 100
              : undefined,
        });
      });

      return results;
    }
  );
}

/**
 * Calculate monthly utility cost estimate
 */
export function calculateUtilityCost(
  energyPrices: EnergyPrices,
  electricityKwhPerMonth: number = AVG_MONTHLY_ELECTRICITY_KWH,
  naturalGasMcfPerMonth: number = AVG_MONTHLY_NATURAL_GAS_MCF
): UtilityCostEstimate {
  // Electricity: price is in cents per kWh
  const monthlyElectricity = energyPrices.electricityPrice
    ? (energyPrices.electricityPrice * electricityKwhPerMonth) / 100
    : 0;

  // Natural gas: price is in dollars per thousand cubic feet
  const monthlyNaturalGas = energyPrices.naturalGasPrice
    ? energyPrices.naturalGasPrice * naturalGasMcfPerMonth
    : 0;

  return {
    stateCode: energyPrices.stateCode,
    stateName: energyPrices.stateName,
    monthlyElectricity: Math.round(monthlyElectricity * 100) / 100,
    monthlyNaturalGas: Math.round(monthlyNaturalGas * 100) / 100,
    monthlyTotal: Math.round((monthlyElectricity + monthlyNaturalGas) * 100) / 100,
    electricityKwhPerMonth,
    naturalGasMcfPerMonth,
  };
}

/**
 * Get utility cost estimates for all states
 */
export async function getAllStateUtilityCosts(): Promise<{
  data: UtilityCostEstimate[];
  cached: boolean;
  cacheAge?: number;
}> {
  const energyResult = await getAllStateEnergyPrices();

  return {
    ...energyResult,
    data: energyResult.data.map((energy) => calculateUtilityCost(energy)),
  };
}

/**
 * Format utility cost for display
 */
export function formatUtilityCostDisplay(cost: UtilityCostEstimate): string {
  return `$${cost.monthlyTotal.toFixed(0)}/month`;
}

/**
 * Format energy index for display
 */
export function formatEnergyIndexDisplay(index: number): string {
  const diff = index - 100;
  if (Math.abs(diff) < 1) {
    return "At national average";
  } else if (diff > 0) {
    return `${diff.toFixed(0)}% above average`;
  }
  return `${Math.abs(diff).toFixed(0)}% below average`;
}
