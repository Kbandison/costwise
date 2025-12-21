// ============================================================================
// CostWise Type Definitions
// ============================================================================
// Comprehensive TypeScript types for the CostWise cost of living application
//
// TABLE OF CONTENTS:
// 1. Location Types - Geographic location data (states, metros, counties, cities, ZIP codes)
// 2. HUD Fair Market Rent Types - Monthly rent data by bedroom count from HUD
// 3. BEA Regional Price Parity Types - Cost of living indices from Bureau of Economic Analysis
// 4. BLS CPI Types - Consumer Price Index data from Bureau of Labor Statistics
// 5. EIA Energy Types - Electricity and natural gas prices from Energy Information Administration
// 6. Combined Cost of Living Types - Aggregated data from all sources
// 7. Comparison Types - Side-by-side location comparisons
// 8. API Cache Types - Response caching with automatic expiration
// 9. Map Visualization Types - Interactive map tooltips and choropleth data
// 10. API Response Wrappers - Standard response format and error handling
//
// DATABASE SCHEMA REFERENCE:
// - api_cache: id, source, location_key, data (JSONB), created_at, expires_at
// - locations: id, name, type, state_code, zip_code, metro_code, county_fips,
//              lat, lng, population, created_at
//
// DATA SOURCES:
// - HUD: Housing and Urban Development Fair Market Rents (annual)
// - BEA: Bureau of Economic Analysis Regional Price Parities (annual)
// - BLS: Bureau of Labor Statistics Consumer Price Index (monthly)
// - EIA: Energy Information Administration utility prices (monthly)
// - Census: U.S. Census Bureau population and location data
//
// INDEX VALUES:
// All index values use 100 as the national average baseline:
// - 100 = national average cost
// - < 100 = below average (more affordable)
// - > 100 = above average (more expensive)
// - 85 = 15% below average
// - 125 = 25% above average
// ============================================================================

// ============================================================================
// LOCATION TYPES
// ============================================================================

/**
 * Supported location types for cost of living data
 * Matches the locations.type field in the database
 */
export enum LocationType {
  /** US State (e.g., California, Texas) */
  STATE = "state",
  /** Metropolitan Statistical Area (e.g., San Francisco-Oakland-Berkeley) */
  METRO = "metro",
  /** County (e.g., Los Angeles County) */
  COUNTY = "county",
  /** City (e.g., San Francisco, Austin) */
  CITY = "city",
  /** ZIP code (e.g., 90210, 10001) */
  ZIP = "zip",
}

/**
 * Complete location data from the database
 * Maps to the locations table schema
 */
export interface Location {
  /** Unique identifier */
  id: string;
  /** Location type (state, metro, county, city, zip) */
  type: LocationType;
  /** Display name (e.g., "San Francisco", "California") */
  name: string;
  /** Lowercase name for searching */
  searchName: string;
  /** Two-letter state code (e.g., "CA", "TX") */
  stateCode?: string;
  /** State FIPS code */
  stateFips?: string;
  /** County FIPS code */
  countyFips?: string;
  /** Metro area code */
  metroCode?: string;
  /** ZIP code (for ZIP type locations) */
  zipCode?: string;
  /** Parent state location ID */
  parentStateId?: string;
  /** Parent metro location ID */
  parentMetroId?: string;
  /** Parent county location ID */
  parentCountyId?: string;
  /** Latitude coordinate */
  latitude?: number;
  /** Longitude coordinate */
  longitude?: number;
  /** Population count */
  population?: number;
  /** Timezone (e.g., "America/Los_Angeles") */
  timezone?: string;
  /** Census region (e.g., "West", "Northeast") */
  region?: string;
  /** Census division (e.g., "Pacific", "New England") */
  division?: string;
}

/**
 * Simplified location data for search results and autocomplete
 * Optimized for performance with minimal fields
 */
export interface LocationSearchResult {
  /** Unique identifier */
  id: string;
  /** Location type */
  type: LocationType;
  /** Display name */
  name: string;
  /** State code for context */
  stateCode?: string;
  /** Population for sorting results */
  population?: number;
}

// ============================================================================
// HUD FAIR MARKET RENT TYPES
// ============================================================================
// Data from U.S. Department of Housing and Urban Development
// Fair Market Rents are used to determine payment standard amounts for HUD programs
// Updated annually, typically released in the fall
// https://www.huduser.gov/portal/datasets/fmr.html

/**
 * HUD Fair Market Rent data structure
 * Contains monthly rent estimates by bedroom count
 * Values represent the 40th percentile of gross rents for standard quality units
 */
export interface HUDFairMarketRent {
  /** ZIP code for this rent data */
  zipCode: string;
  /** County name */
  countyName: string;
  /** Full state name (e.g., "California") */
  stateName: string;
  /** Two-letter state code (e.g., "CA") */
  stateCode: string;
  /** Metropolitan area name (if applicable) */
  metroName?: string;
  /** Metro area code */
  metroCode?: string;
  /** Data year (e.g., 2024) */
  year: number;
  /** HUD area name */
  areaName: string;

  // Monthly rent by bedroom count (in USD)
  /** Studio / 0 bedroom monthly rent */
  efficiency: number;
  /** 1 bedroom monthly rent */
  oneBedroom: number;
  /** 2 bedroom monthly rent */
  twoBedroom: number;
  /** 3 bedroom monthly rent */
  threeBedroom: number;
  /** 4 bedroom monthly rent */
  fourBedroom: number;

  /** Whether this is a Small Area FMR (ZIP code level) vs metro-level */
  isSmallAreaFMR: boolean;

  /** Median rent if available (50th percentile) */
  medianRent?: number;
}

export interface HUDAPIResponse {
  features: Array<{
    attributes: {
      zip_code: string;
      county_name: string;
      state_name: string;
      state_alpha: string;
      metro_name?: string;
      cbsasub?: string;
      year: number;
      area_name: string;
      fmr_0: number;
      fmr_1: number;
      fmr_2: number;
      fmr_3: number;
      fmr_4: number;
      smallarea_status: number;
      Rent50_0?: number;
      Rent50_1?: number;
      Rent50_2?: number;
      Rent50_3?: number;
      Rent50_4?: number;
    };
  }>;
}

// ============================================================================
// BEA REGIONAL PRICE PARITY TYPES
// ============================================================================
// Data from Bureau of Economic Analysis
// Regional Price Parities (RPPs) measure differences in price levels across states
// Base year index where 100 = national average
// Updated annually
// https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area

/**
 * Bureau of Economic Analysis Regional Price Parity data
 * Measures relative price levels across geographic areas
 * Values are indexes where 100 = national average
 * Higher values indicate higher cost of living
 *
 * @example
 * // California with RPP of 112.5 means costs are 12.5% above national average
 * { overall: 112.5, percentAboveNational: 12.5 }
 */
export interface RegionalPriceParity {
  /** Geographic FIPS code */
  geoFips: string;
  /** Geographic area name (e.g., "California", "New York-Newark-Jersey City") */
  geoName: string;
  /** Two-letter state code */
  stateCode?: string;
  /** Data year */
  year: number;

  // RPP indices (100 = national average)
  /** Overall RPP index combining all categories */
  overall: number;
  /** Goods RPP index (durable and nondurable goods) */
  goods: number;
  /** Other services RPP index (excluding rents) */
  servicesOther: number;
  /** Rents RPP index (housing costs) */
  servicesRents: number;

  /** Housing-specific index (alias for servicesRents) */
  housing?: number;

  /** Percentage above or below national average (overall - 100) */
  percentAboveNational: number;
  /** Rank compared to other areas (1 = most expensive) */
  rank?: number;
}

export interface BEAAPIResponse {
  BEAAPI: {
    Results: {
      Data: Array<{
        GeoFips: string;
        GeoName: string;
        TimePeriod: string;
        DataValue: string;
        CL_UNIT: string;
        UNIT_MULT: string;
        LineCode: string;
        LineDescription: string;
      }>;
      Statistic: string;
      UTCProductionTime: string;
      Dimensions: Array<{
        Ordinal: string;
        Name: string;
        DataType: string;
        IsValue: string;
      }>;
    };
  };
}

export enum RPPLineCode {
  ALL_ITEMS = "1",
  GOODS = "2",
  SERVICES_RENTS = "3",
  SERVICES_OTHER = "4",
}

// ============================================================================
// BLS CPI TYPES
// ============================================================================
// Data from Bureau of Labor Statistics
// Consumer Price Index (CPI) measures changes in prices paid by consumers
// Updated monthly
// https://www.bls.gov/cpi/

/**
 * CPI expense categories
 * Matches BLS CPI series codes
 */
export enum CPICategory {
  /** Food and beverages */
  FOOD = "food",
  /** Transportation (gas, car insurance, etc.) */
  TRANSPORTATION = "transportation",
  /** Medical care and health insurance */
  MEDICAL_CARE = "medical",
  /** Housing (rent, utilities, household operations) */
  HOUSING = "housing",
  /** Clothing and apparel */
  APPAREL = "apparel",
  /** Education and communication */
  EDUCATION = "education",
  /** All items combined */
  ALL_ITEMS = "all",
}

/**
 * Consumer Price Index data point
 * Represents CPI for a specific category, region, and time period
 */
export interface CPIData {
  /** BLS series ID (e.g., "CUURA421SA0") */
  seriesId: string;
  /** Expense category */
  category: CPICategory;
  /** BLS region code */
  regionCode: string;
  /** Region name (e.g., "Los Angeles-Long Beach-Anaheim") */
  regionName: string;
  /** Year */
  year: number;
  /** Month (1-12) */
  month: number;
  /** BLS period code (e.g., "M01" for January) */
  period: string;
  /** CPI value (index, not percentage) */
  value: number;
  /** BLS footnotes if any */
  footnotes?: string[];
}

export interface CPIIndexes {
  food: number;
  transportation: number;
  medical: number;
  housing?: number;
  overall: number;

  // Relative to national average (100 = national)
  foodIndex: number;
  transportationIndex: number;
  medicalIndex: number;
  housingIndex?: number;
}

export interface BLSAPIResponse {
  status: string;
  responseTime: number;
  message: string[];
  Results: {
    series: Array<{
      seriesID: string;
      data: Array<{
        year: string;
        period: string;
        periodName: string;
        value: string;
        footnotes: Array<{ code: string; text: string }>;
      }>;
    }>;
  };
}

export interface BLSRegion {
  code: string;
  name: string;
  states: string[];
}

// ============================================================================
// EIA ENERGY TYPES
// ============================================================================
// Data from U.S. Energy Information Administration
// Tracks electricity and natural gas prices by state
// Updated monthly
// https://www.eia.gov/electricity/data.php

/**
 * Energy prices by state from EIA
 * Includes electricity and natural gas pricing data
 */
export interface EnergyPrices {
  /** Two-letter state code */
  stateCode: string;
  /** Full state name */
  stateName: string;
  /** Data year */
  year: number;
  /** Month (1-12) */
  month: number;

  // Prices in cents per kWh / dollars per thousand cubic feet / dollars per gallon
  /** Electricity price in cents per kilowatt-hour */
  electricityPrice?: number;
  /** Natural gas price in dollars per thousand cubic feet (Mcf) */
  naturalGasPrice?: number;
  /** Regular gasoline price in dollars per gallon */
  gasolinePrice?: number;

  // National averages for comparison
  /** National average electricity price in cents per kWh */
  electricityNationalAvg?: number;
  /** National average natural gas price in dollars per Mcf */
  naturalGasNationalAvg?: number;
  /** National average gasoline price in dollars per gallon */
  gasolineNationalAvg?: number;

  // Relative indexes (100 = national average)
  /** Electricity price index (100 = national average) */
  electricityIndex?: number;
  /** Natural gas price index (100 = national average) */
  naturalGasIndex?: number;
  /** Gasoline price index (100 = national average) */
  gasolineIndex?: number;
}

export interface UtilityCostEstimate {
  stateCode: string;
  stateName: string;

  // Monthly estimates based on average consumption
  monthlyElectricity: number;
  monthlyNaturalGas: number;
  monthlyTotal: number;

  // Assumptions used
  electricityKwhPerMonth: number;
  naturalGasMcfPerMonth: number;
}

export interface EIAAPIResponse {
  response: {
    total: number;
    dateFormat: string;
    frequency: string;
    data: Array<{
      period: string;
      stateDescription?: string;
      stateId?: string;
      sectorName?: string;
      price?: number;
      "price-units"?: string;
      "series-description"?: string;
      value?: number | string;
      duoarea?: string;
      "area-name"?: string;
      units?: string;
    }>;
  };
}

// ============================================================================
// COMBINED COST OF LIVING TYPES
// ============================================================================

/**
 * Comprehensive cost of living data for a location
 * Aggregates data from multiple sources (HUD, BEA, BLS, EIA)
 * All index values use 100 as national average
 *
 * @example
 * {
 *   locationName: "San Francisco, CA",
 *   overallIndex: 185,  // 85% above national average
 *   housing: 300,       // Housing is 3x the national average
 *   utilities: 120,     // Utilities 20% above average
 * }
 */
export interface CostOfLiving {
  /** Unique location identifier */
  locationId: string;
  /** Type of location (state, metro, city, etc.) */
  locationType: LocationType;
  /** Display name */
  locationName: string;
  /** State code if applicable */
  stateCode?: string;

  /** Overall cost of living index (100 = national average) */
  overallIndex: number;

  // Category indexes (100 = national average)
  /** Housing costs index */
  housing: number;
  /** Utilities (electricity, gas, water) index */
  utilities: number;
  /** Groceries and food costs index */
  groceries: number;
  /** Transportation costs index */
  transportation: number;
  /** Healthcare costs index */
  healthcare: number;

  /** HUD Fair Market Rent data with rent by bedroom count */
  medianRent?: HUDFairMarketRent;
  /** Median home purchase price */
  medianHomePrice?: number;

  // Source data (for detailed breakdowns)
  /** BEA Regional Price Parity data */
  rppData?: RegionalPriceParity;
  /** BLS CPI data */
  cpiData?: CPIIndexes;
  /** EIA energy price data */
  energyData?: EnergyPrices;

  /** Year of the data */
  dataYear: number;
  /** ISO timestamp of when data was last updated */
  lastUpdated: string;
}

// ============================================================================
// COMPARISON TYPES
// ============================================================================

export interface ComparisonLocation {
  id: string;
  name: string;
  type: LocationType;
  stateCode?: string;
  costOfLiving: CostOfLiving;
}

export interface ComparisonData {
  locations: ComparisonLocation[];
  baseLocation: ComparisonLocation;
  comparedLocations: ComparisonLocation[];

  // Calculated differences
  differences: Array<{
    locationId: string;
    locationName: string;
    overallDiff: number;
    housingDiff: number;
    utilitiesDiff: number;
    groceriesDiff: number;
    transportationDiff: number;
    healthcareDiff: number;
    annualSavings?: number; // Based on income input
  }>;

  // Comparison metadata
  comparisonDate: string;
  dataYear: number;
}

export interface ComparisonRequest {
  baseLocationId: string;
  compareLocationIds: string[];
  annualIncome?: number;
}

// ============================================================================
// API CACHE TYPES
// ============================================================================

/**
 * API data sources for cost of living information
 */
export enum APISource {
  /** U.S. Department of Housing and Urban Development - Fair Market Rents */
  HUD = "hud",
  /** Bureau of Economic Analysis - Regional Price Parities */
  BEA = "bea",
  /** Bureau of Labor Statistics - Consumer Price Index */
  BLS = "bls",
  /** Energy Information Administration - Utility Prices */
  EIA = "eia",
  /** U.S. Census Bureau - Population and Location Data */
  CENSUS = "census",
}

/**
 * API response cache entry
 * Maps to the api_cache table in the database
 * Stores API responses with automatic expiration
 *
 * @example
 * {
 *   id: "uuid",
 *   source: "hud",
 *   location_key: "zip:90210",
 *   data: { /* HUD API response *\/ },
 *   created_at: "2024-01-15T10:30:00Z",
 *   expires_at: "2024-02-15T10:30:00Z"
 * }
 */
export interface APICache {
  /** Unique identifier */
  id: string;
  /** API source (hud, bea, bls, eia, census) */
  source: string;
  /** Location identifier (e.g., "zip:90210", "state:CA", "metro:31080") */
  location_key: string;
  /** Cached API response data (JSONB) */
  data: unknown;
  /** ISO timestamp when cache was created */
  created_at: string;
  /** ISO timestamp when cache expires */
  expires_at: string;
}

export interface CacheConfig {
  ttlSeconds: number;
  source: APISource;
}

// Default TTLs by source (in seconds)
export const DEFAULT_CACHE_TTL: Record<APISource, number> = {
  [APISource.HUD]: 86400 * 30, // 30 days (FMR updates annually)
  [APISource.BEA]: 86400 * 30, // 30 days (RPP updates annually)
  [APISource.BLS]: 86400 * 7, // 7 days (CPI updates monthly)
  [APISource.EIA]: 86400 * 7, // 7 days (energy updates monthly)
  [APISource.CENSUS]: 86400 * 90, // 90 days (census data)
};

// ============================================================================
// MAP VISUALIZATION TYPES
// ============================================================================

/**
 * Data structure for interactive map tooltips
 * Displayed when hovering over a location on the map
 */
export interface MapTooltipData {
  /** Location identifier */
  locationId: string;
  /** Display name */
  locationName: string;
  /** State code */
  stateCode: string;
  /** Location type */
  type: LocationType;

  /** Overall cost of living index (100 = national average) */
  overallIndex: number;
  /** Human-readable label (e.g., "12% above average", "8% below average") */
  overallLabel: string;
  /** Rank among all locations (1 = most expensive) */
  rank?: number;
  /** Human-readable rank label (e.g., "3rd most expensive") */
  rankLabel?: string;

  /** Category breakdown for detailed tooltip */
  categories: Array<{
    /** Category name (e.g., "Housing", "Transportation") */
    name: string;
    /** Category index value */
    index: number;
    /** Human-readable label */
    label: string;
  }>;

  /** Numeric value used for choropleth coloring */
  colorValue: number;
  /** Hex color for this location on the map */
  colorHex: string;
}

export interface StateMapData {
  [stateCode: string]: {
    name: string;
    col: number; // Cost of living index
    housing: number;
    utilities?: number;
    groceries?: number;
    transportation?: number;
    healthcare?: number;
    rank: number;
  };
}

export interface MapColorScale {
  min: number;
  max: number;
  midpoint: number;
  colors: {
    low: string;
    mid: string;
    high: string;
  };
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

/**
 * Standard API response wrapper
 * All API endpoints return data in this format for consistency
 *
 * @template T The type of data being returned
 *
 * @example
 * // Success response
 * {
 *   success: true,
 *   data: { locationName: "San Francisco" },
 *   meta: { cached: false, source: "hud" }
 * }
 *
 * @example
 * // Error response
 * {
 *   success: false,
 *   error: {
 *     code: "NOT_FOUND",
 *     message: "Location not found"
 *   }
 * }
 */
export interface APIResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data (only present if success = true) */
  data?: T;
  /** Error details (only present if success = false) */
  error?: {
    /** Machine-readable error code */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details */
    details?: unknown;
  };
  /** Optional metadata about the response */
  meta?: {
    /** Whether data was served from cache */
    cached: boolean;
    /** Age of cached data in seconds */
    cacheAge?: number;
    /** Year of the data */
    dataYear?: number;
    /** Data source */
    source: APISource;
    /** Query parameters used */
    query?: string;
    /** Result count */
    count?: number;
  };
}

/**
 * Paginated API response wrapper
 * Extends APIResponse with pagination metadata
 *
 * @template T The type of items being returned
 */
export interface PaginatedResponse<T> extends APIResponse<T[]> {
  /** Pagination information */
  pagination: {
    /** Current page number (1-indexed) */
    page: number;
    /** Number of items per page */
    pageSize: number;
    /** Total number of items across all pages */
    total: number;
    /** Total number of pages */
    totalPages: number;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Standard API error codes
 * Used in APIResponse.error.code field
 */
export enum APIErrorCode {
  /** Invalid request parameters */
  INVALID_PARAMS = "INVALID_PARAMS",
  /** Requested resource not found */
  NOT_FOUND = "NOT_FOUND",
  /** Too many requests, rate limit exceeded */
  RATE_LIMITED = "RATE_LIMITED",
  /** Error from upstream API (HUD, BEA, etc.) */
  UPSTREAM_ERROR = "UPSTREAM_ERROR",
  /** Error accessing cache */
  CACHE_ERROR = "CACHE_ERROR",
  /** Internal server error */
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * Custom error class for API errors
 * Includes structured error information for consistent error handling
 */
export class APIError extends Error {
  constructor(
    /** Machine-readable error code */
    public code: APIErrorCode,
    /** Human-readable error message */
    message: string,
    /** HTTP status code */
    public statusCode: number = 500,
    /** Additional error details */
    public details?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}
