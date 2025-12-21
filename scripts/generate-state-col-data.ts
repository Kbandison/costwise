/**
 * Generate state cost of living data from BEA Regional Price Parities
 *
 * Usage: npx tsx scripts/generate-state-col-data.ts
 *
 * Requires BEA_API_KEY environment variable
 */

// Load environment variables from .env file
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import * as fs from "fs";
import * as path from "path";

const BEA_API_BASE = "https://apps.bea.gov/api/data";

interface StateData {
  name: string;
  col: number;
  housing: number;
  goods: number;
  services: number;
  rank: number;
}

interface StateMapData {
  [stateCode: string]: StateData;
}

// State FIPS to code and name mapping
const STATE_INFO: Record<string, { code: string; name: string }> = {
  "01": { code: "AL", name: "Alabama" },
  "02": { code: "AK", name: "Alaska" },
  "04": { code: "AZ", name: "Arizona" },
  "05": { code: "AR", name: "Arkansas" },
  "06": { code: "CA", name: "California" },
  "08": { code: "CO", name: "Colorado" },
  "09": { code: "CT", name: "Connecticut" },
  "10": { code: "DE", name: "Delaware" },
  "11": { code: "DC", name: "District of Columbia" },
  "12": { code: "FL", name: "Florida" },
  "13": { code: "GA", name: "Georgia" },
  "15": { code: "HI", name: "Hawaii" },
  "16": { code: "ID", name: "Idaho" },
  "17": { code: "IL", name: "Illinois" },
  "18": { code: "IN", name: "Indiana" },
  "19": { code: "IA", name: "Iowa" },
  "20": { code: "KS", name: "Kansas" },
  "21": { code: "KY", name: "Kentucky" },
  "22": { code: "LA", name: "Louisiana" },
  "23": { code: "ME", name: "Maine" },
  "24": { code: "MD", name: "Maryland" },
  "25": { code: "MA", name: "Massachusetts" },
  "26": { code: "MI", name: "Michigan" },
  "27": { code: "MN", name: "Minnesota" },
  "28": { code: "MS", name: "Mississippi" },
  "29": { code: "MO", name: "Missouri" },
  "30": { code: "MT", name: "Montana" },
  "31": { code: "NE", name: "Nebraska" },
  "32": { code: "NV", name: "Nevada" },
  "33": { code: "NH", name: "New Hampshire" },
  "34": { code: "NJ", name: "New Jersey" },
  "35": { code: "NM", name: "New Mexico" },
  "36": { code: "NY", name: "New York" },
  "37": { code: "NC", name: "North Carolina" },
  "38": { code: "ND", name: "North Dakota" },
  "39": { code: "OH", name: "Ohio" },
  "40": { code: "OK", name: "Oklahoma" },
  "41": { code: "OR", name: "Oregon" },
  "42": { code: "PA", name: "Pennsylvania" },
  "44": { code: "RI", name: "Rhode Island" },
  "45": { code: "SC", name: "South Carolina" },
  "46": { code: "SD", name: "South Dakota" },
  "47": { code: "TN", name: "Tennessee" },
  "48": { code: "TX", name: "Texas" },
  "49": { code: "UT", name: "Utah" },
  "50": { code: "VT", name: "Vermont" },
  "51": { code: "VA", name: "Virginia" },
  "53": { code: "WA", name: "Washington" },
  "54": { code: "WV", name: "West Virginia" },
  "55": { code: "WI", name: "Wisconsin" },
  "56": { code: "WY", name: "Wyoming" },
};

// RPP Line Codes - These are the actual Regional Price Parity index codes
// Values are indexes where US = 100
const LINE_CODES = {
  ALL_ITEMS: "5",      // RPPs: All items
  GOODS: "6",          // RPPs: Goods
  SERVICES_RENTS: "7", // RPPs: Services: Rents (housing)
  SERVICES_OTHER: "9", // RPPs: Services: Other
};

interface BEADataItem {
  Code: string; // e.g., "SARPP-1" where 1 is the line code
  GeoFips: string;
  GeoName: string;
  TimePeriod: string;
  DataValue: string;
  CL_UNIT: string;
  UNIT_MULT: string;
  NoteRef?: string;
}

interface BEAResponse {
  BEAAPI: {
    Results: {
      Data: BEADataItem[];
    };
  };
}

async function fetchBEADataForLineCode(year: number, lineCode: string): Promise<BEADataItem[]> {
  const apiKey = process.env.BEA_API_KEY;

  if (!apiKey) {
    throw new Error(
      "BEA_API_KEY environment variable is required.\n" +
        "Get a free API key at: https://apps.bea.gov/api/signup/"
    );
  }

  const params = new URLSearchParams({
    UserID: apiKey,
    method: "GetData",
    DataSetName: "Regional",
    TableName: "SARPP",
    LineCode: lineCode,
    GeoFips: "STATE",
    Year: String(year),
    ResultFormat: "JSON",
  });

  const url = `${BEA_API_BASE}?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`BEA API returned ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();

  // Check for API errors
  if (json.BEAAPI?.Results?.Error) {
    console.error("BEA API Error:", JSON.stringify(json.BEAAPI.Results.Error, null, 2));
    throw new Error(`BEA API Error: ${json.BEAAPI.Results.Error.ErrorDetail?.Description || json.BEAAPI.Results.Error.APIErrorDescription}`);
  }

  return json.BEAAPI?.Results?.Data || [];
}

async function fetchBEAData(year: number): Promise<BEAResponse> {
  console.log(`Fetching BEA data for year ${year}...`);

  // Fetch each line code separately and combine
  // Using RPP index codes: 5=All items, 6=Goods, 7=Rents, 9=Other services
  const lineCodes = [
    LINE_CODES.ALL_ITEMS,
    LINE_CODES.GOODS,
    LINE_CODES.SERVICES_RENTS,
    LINE_CODES.SERVICES_OTHER,
  ];
  const allData: BEADataItem[] = [];

  for (const lineCode of lineCodes) {
    console.log(`  Fetching LineCode ${lineCode}...`);
    const data = await fetchBEADataForLineCode(year, lineCode);
    allData.push(...data);
  }

  return {
    BEAAPI: {
      Results: {
        Data: allData,
      },
    },
  };
}

function processData(response: BEAResponse, year: string): StateMapData {
  const data = response.BEAAPI?.Results?.Data;

  // Debug: log sample data
  if (data && data.length > 0) {
    console.log("Sample data item:", JSON.stringify(data[0], null, 2));
    console.log(`Total data items: ${data.length}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from BEA API");
  }

  // Group data by state FIPS
  const stateDataMap = new Map<
    string,
    { overall?: number; goods?: number; housing?: number; services?: number }
  >();

  // Track unique GeoFips for debugging
  const uniqueFips = new Set<string>();

  for (const item of data) {
    if (item.TimePeriod !== year) continue;

    const rawFips = item.GeoFips;
    uniqueFips.add(rawFips);

    // GeoFips is 5 digits like "01000" - extract first 2 digits for state FIPS
    const fips = rawFips.substring(0, 2);
    if (!STATE_INFO[fips]) continue;

    const value = parseFloat(item.DataValue);
    if (isNaN(value)) continue;

    if (!stateDataMap.has(fips)) {
      stateDataMap.set(fips, {});
    }

    const stateData = stateDataMap.get(fips)!;

    // Extract line code from Code field (e.g., "SARPP-1" -> "1")
    const lineCode = item.Code.split("-").pop() || "";

    switch (lineCode) {
      case LINE_CODES.ALL_ITEMS:
        stateData.overall = value;
        break;
      case LINE_CODES.GOODS:
        stateData.goods = value;
        break;
      case LINE_CODES.SERVICES_RENTS:
        stateData.housing = value;
        break;
      case LINE_CODES.SERVICES_OTHER:
        stateData.services = value;
        break;
    }
  }

  // Debug: show some FIPS codes
  console.log("Sample GeoFips values:", Array.from(uniqueFips).slice(0, 10));

  // Convert to array for ranking
  const stateArray: Array<{ fips: string; data: typeof stateDataMap extends Map<string, infer V> ? V : never }> = [];
  stateDataMap.forEach((data, fips) => {
    if (data.overall !== undefined) {
      stateArray.push({ fips, data });
    }
  });

  // Sort by overall COL descending for ranking
  stateArray.sort((a, b) => (b.data.overall || 0) - (a.data.overall || 0));

  // Build final output
  const result: StateMapData = {};

  stateArray.forEach((item, index) => {
    const stateInfo = STATE_INFO[item.fips];
    if (!stateInfo) return;

    result[stateInfo.code] = {
      name: stateInfo.name,
      col: item.data.overall || 100,
      housing: item.data.housing || 100,
      goods: item.data.goods || 100,
      services: item.data.services || 100,
      rank: index + 1,
    };
  });

  return result;
}

function generateColorScale(data: StateMapData): {
  min: number;
  max: number;
  midpoint: number;
} {
  const values = Object.values(data).map((d) => d.col);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    min: Math.floor(min),
    max: Math.ceil(max),
    midpoint: 100,
  };
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Generating State Cost of Living Data");
  console.log("=".repeat(60));
  console.log();

  // Get the most recent available year (typically 2 years behind)
  const currentYear = new Date().getFullYear();
  let dataYear = currentYear - 2;

  // Try fetching data
  let response: BEAResponse;
  try {
    response = await fetchBEAData(dataYear);
  } catch (error) {
    console.log(`Year ${dataYear} not available, trying ${dataYear - 1}...`);
    dataYear = dataYear - 1;
    response = await fetchBEAData(dataYear);
  }

  console.log(`Processing data for year ${dataYear}...`);
  const stateData = processData(response, String(dataYear));

  // Generate color scale info
  const colorScale = generateColorScale(stateData);

  // Create output object
  const output = {
    dataYear,
    generatedAt: new Date().toISOString(),
    colorScale,
    states: stateData,
  };

  // Ensure directory exists
  const outputPath = "public/data/state-col-data.json";
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log();
  console.log("=".repeat(60));
  console.log("Data generation complete!");
  console.log("=".repeat(60));
  console.log();
  console.log(`Output file: ${outputPath}`);
  console.log(`Data year: ${dataYear}`);
  console.log(`States included: ${Object.keys(stateData).length}`);
  console.log();
  console.log("Color scale:");
  console.log(`  Min: ${colorScale.min}`);
  console.log(`  Max: ${colorScale.max}`);
  console.log(`  Midpoint: ${colorScale.midpoint}`);
  console.log();

  // Print top 5 most expensive
  const sorted = Object.entries(stateData).sort((a, b) => b[1].col - a[1].col);
  console.log("Top 5 most expensive states:");
  sorted.slice(0, 5).forEach(([code, data]) => {
    console.log(`  ${data.rank}. ${data.name} (${code}): ${data.col.toFixed(1)}`);
  });

  console.log();
  console.log("Top 5 most affordable states:");
  sorted.slice(-5).reverse().forEach(([code, data]) => {
    console.log(`  ${data.rank}. ${data.name} (${code}): ${data.col.toFixed(1)}`);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
