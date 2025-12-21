import { createServerClient } from "@/lib/supabase";
import { APISource } from "@/types";

/**
 * Caching Utility for CostWise API Data
 *
 * This module provides caching functionality for external API responses using the Supabase api_cache table.
 * All cached data is stored with automatic expiration timestamps and can be invalidated manually.
 *
 * DATABASE SCHEMA:
 * - api_cache table columns: id, source, location_key, data (JSONB), created_at, expires_at
 * - Unique constraint on (source, location_key)
 *
 * CACHE TTL (Time To Live):
 * - HUD (Fair Market Rent): 720 hours (30 days)
 * - BEA (Regional Price Parity): 720 hours (30 days)
 * - BLS (Consumer Price Index): 168 hours (7 days)
 * - EIA (Energy Information): 168 hours (7 days)
 *
 * ERROR HANDLING:
 * - All functions use try/catch and log errors to console
 * - Functions return null on errors instead of throwing
 * - Cache misses return null (not an error condition)
 *
 * USAGE EXAMPLE:
 * ```typescript
 * import { getCachedData, setCachedData } from '@/lib/cache';
 *
 * // Try to get cached data first
 * const cachedData = await getCachedData(APISource.HUD, 'zip:90210');
 * if (cachedData) {
 *   return cachedData;
 * }
 *
 * // If no cache, fetch from API and cache the result
 * const freshData = await fetchFromAPI();
 * await setCachedData(APISource.HUD, 'zip:90210', freshData);
 * ```
 */

/**
 * Cache TTL configuration in hours
 * Maps API sources to their cache expiration times
 */
const CACHE_TTL_HOURS: Record<APISource, number> = {
  [APISource.HUD]: 720,   // 30 days for housing data
  [APISource.BEA]: 720,   // 30 days for regional price parity
  [APISource.BLS]: 168,   // 7 days for consumer price index
  [APISource.EIA]: 168,   // 7 days for energy information
  [APISource.CENSUS]: 720, // 30 days for census data
};

/**
 * Validates that a source string is a valid APISource enum value
 *
 * @param source - The source string to validate
 * @returns true if source is a valid APISource, false otherwise
 *
 * @example
 * ```typescript
 * isValidAPISource('hud') // true
 * isValidAPISource('invalid') // false
 * ```
 */
function isValidAPISource(source: string): source is APISource {
  return Object.values(APISource).includes(source as APISource);
}

/**
 * Retrieves cached data from the api_cache table
 *
 * Checks if cached data exists and is still valid (not expired).
 * Returns null if:
 * - No cached entry exists
 * - Cached entry has expired
 * - Database query fails
 * - Invalid API source provided
 *
 * @param source - The API source (e.g., APISource.HUD, APISource.BEA)
 * @param locationKey - The location identifier (e.g., "zip:90210", "state:CA", "metro:31080")
 * @returns The cached data object if valid, null otherwise
 *
 * @example
 * ```typescript
 * // Fetch cached HUD data for a ZIP code
 * const hudData = await getCachedData(APISource.HUD, 'zip:90210');
 * if (hudData) {
 *   console.log('Cache hit!', hudData);
 * } else {
 *   console.log('Cache miss - need to fetch from API');
 * }
 * ```
 */
export async function getCachedData<T = unknown>(
  source: APISource,
  locationKey: string
): Promise<T | null> {
  try {
    // Validate inputs
    if (!isValidAPISource(source)) {
      console.error(`[Cache] Invalid API source: ${source}`);
      return null;
    }

    if (!locationKey || typeof locationKey !== "string") {
      console.error(`[Cache] Invalid location key: ${locationKey}`);
      return null;
    }

    const supabase = createServerClient();

    // Query for cached entry
    const { data, error } = await supabase
      .from("api_cache")
      .select("data, expires_at")
      .eq("source", source)
      .eq("location_key", locationKey)
      .single();

    if (error) {
      // Not found is expected, don't log as error
      if (error.code === "PGRST116") {
        console.log(
          `[Cache] Cache miss for ${source}:${locationKey} - no entry found`
        );
        return null;
      }

      console.error(
        `[Cache] Database error fetching cache for ${source}:${locationKey}:`,
        error
      );
      return null;
    }

    if (!data) {
      console.log(`[Cache] Cache miss for ${source}:${locationKey} - no data`);
      return null;
    }

    // Check if cache entry has expired
    if (!isCacheValid(data.expires_at)) {
      console.log(
        `[Cache] Cache expired for ${source}:${locationKey} - expires_at: ${data.expires_at}`
      );
      return null;
    }

    console.log(`[Cache] Cache hit for ${source}:${locationKey}`);
    return data.data as T;
  } catch (error) {
    console.error(
      `[Cache] Unexpected error in getCachedData for ${source}:${locationKey}:`,
      error
    );
    return null;
  }
}

/**
 * Stores data in the api_cache table with automatic expiration
 *
 * Uses Supabase upsert to handle both new entries and updates to existing entries.
 * Automatically calculates expiration timestamp based on the API source's TTL.
 *
 * Returns true on success, false on failure (logs error but doesn't throw).
 *
 * @param source - The API source (e.g., APISource.HUD, APISource.BEA)
 * @param locationKey - The location identifier (e.g., "zip:90210", "state:CA")
 * @param data - The data to cache (will be stored as JSONB)
 * @returns true if cache was set successfully, false otherwise
 *
 * @example
 * ```typescript
 * // Cache HUD data for a ZIP code
 * const hudResponse = { fmr_0br: 1200, fmr_1br: 1500, ... };
 * const success = await setCachedData(APISource.HUD, 'zip:90210', hudResponse);
 * if (success) {
 *   console.log('Data cached successfully');
 * }
 * ```
 */
export async function setCachedData(
  source: APISource,
  locationKey: string,
  data: unknown
): Promise<boolean> {
  try {
    // Validate inputs
    if (!isValidAPISource(source)) {
      console.error(`[Cache] Invalid API source: ${source}`);
      return false;
    }

    if (!locationKey || typeof locationKey !== "string") {
      console.error(`[Cache] Invalid location key: ${locationKey}`);
      return false;
    }

    if (data === undefined || data === null) {
      console.error(
        `[Cache] Cannot cache null or undefined data for ${source}:${locationKey}`
      );
      return false;
    }

    const supabase = createServerClient();

    // Calculate expiration timestamp
    const ttlHours = CACHE_TTL_HOURS[source];
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    // Upsert cache entry (insert or update if exists)
    const { error } = await supabase.from("api_cache").upsert(
      {
        source,
        location_key: locationKey,
        data,
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: "source,location_key",
      }
    );

    if (error) {
      console.error(
        `[Cache] Database error setting cache for ${source}:${locationKey}:`,
        error
      );
      return false;
    }

    console.log(
      `[Cache] Successfully cached data for ${source}:${locationKey} (expires: ${expiresAt.toISOString()})`
    );
    return true;
  } catch (error) {
    console.error(
      `[Cache] Unexpected error in setCachedData for ${source}:${locationKey}:`,
      error
    );
    return false;
  }
}

/**
 * Invalidates (deletes) cache entries from the api_cache table
 *
 * Can delete:
 * - A specific entry (provide both source and locationKey)
 * - All entries for a source (provide only source)
 * - All entries for a location (provide only locationKey)
 * - All entries (provide no parameters)
 *
 * Returns the number of entries deleted, or null on error.
 *
 * @param source - Optional API source to filter deletion
 * @param locationKey - Optional location key to filter deletion
 * @returns Number of deleted entries, or null on error
 *
 * @example
 * ```typescript
 * // Delete specific cache entry
 * await invalidateCache(APISource.HUD, 'zip:90210');
 *
 * // Delete all HUD cache entries
 * await invalidateCache(APISource.HUD);
 *
 * // Delete all cache entries for a location
 * await invalidateCache(undefined, 'zip:90210');
 *
 * // Delete all cache entries
 * await invalidateCache();
 * ```
 */
export async function invalidateCache(
  source?: APISource,
  locationKey?: string
): Promise<number | null> {
  try {
    // Validate source if provided
    if (source && !isValidAPISource(source)) {
      console.error(`[Cache] Invalid API source: ${source}`);
      return null;
    }

    const supabase = createServerClient();

    // Build query based on provided parameters
    let query = supabase.from("api_cache").delete();

    if (source) {
      query = query.eq("source", source);
    }

    if (locationKey) {
      query = query.eq("location_key", locationKey);
    }

    const { error, data } = await query.select();

    if (error) {
      console.error("[Cache] Database error invalidating cache:", error);
      return null;
    }

    const deletedCount = data?.length || 0;

    if (source && locationKey) {
      console.log(
        `[Cache] Invalidated ${deletedCount} cache entries for ${source}:${locationKey}`
      );
    } else if (source) {
      console.log(
        `[Cache] Invalidated ${deletedCount} cache entries for source: ${source}`
      );
    } else if (locationKey) {
      console.log(
        `[Cache] Invalidated ${deletedCount} cache entries for location: ${locationKey}`
      );
    } else {
      console.log(`[Cache] Invalidated ${deletedCount} total cache entries`);
    }

    return deletedCount;
  } catch (error) {
    console.error("[Cache] Unexpected error in invalidateCache:", error);
    return null;
  }
}

/**
 * Checks if a cache entry is still valid based on its expiration timestamp
 *
 * Helper function used internally by getCachedData, but exported for convenience.
 *
 * @param expiresAt - ISO 8601 timestamp string (e.g., "2024-01-15T10:30:00.000Z")
 * @returns true if cache is still valid (not expired), false otherwise
 *
 * @example
 * ```typescript
 * const expiresAt = '2024-12-31T23:59:59.000Z';
 * if (isCacheValid(expiresAt)) {
 *   console.log('Cache is still valid');
 * } else {
 *   console.log('Cache has expired');
 * }
 * ```
 */
export function isCacheValid(expiresAt: string): boolean {
  try {
    const expirationDate = new Date(expiresAt);
    const now = new Date();

    // Check if date is valid
    if (isNaN(expirationDate.getTime())) {
      console.error(`[Cache] Invalid expiration date: ${expiresAt}`);
      return false;
    }

    return expirationDate > now;
  } catch (error) {
    console.error(
      `[Cache] Error validating cache expiration for ${expiresAt}:`,
      error
    );
    return false;
  }
}

/**
 * Gets cache statistics for monitoring and debugging
 *
 * Returns information about cache entries:
 * - Total entries
 * - Entries by source
 * - Expired entries count
 *
 * @returns Cache statistics object, or null on error
 *
 * @example
 * ```typescript
 * const stats = await getCacheStats();
 * console.log(`Total cache entries: ${stats.total}`);
 * console.log(`HUD entries: ${stats.bySource.hud}`);
 * console.log(`Expired entries: ${stats.expired}`);
 * ```
 */
export async function getCacheStats(): Promise<{
  total: number;
  bySource: Record<string, number>;
  expired: number;
} | null> {
  try {
    const supabase = createServerClient();

    // Get all cache entries
    const { data, error } = await supabase
      .from("api_cache")
      .select("source, expires_at");

    if (error) {
      console.error("[Cache] Error fetching cache stats:", error);
      return null;
    }

    const stats = {
      total: data.length,
      bySource: {} as Record<string, number>,
      expired: 0,
    };

    const now = new Date();

    // Count entries by source and expired entries
    data.forEach((entry) => {
      // Count by source
      if (entry.source) {
        stats.bySource[entry.source] =
          (stats.bySource[entry.source] || 0) + 1;
      }

      // Count expired entries
      if (entry.expires_at) {
        const expiresAt = new Date(entry.expires_at);
        if (expiresAt <= now) {
          stats.expired++;
        }
      }
    });

    return stats;
  } catch (error) {
    console.error("[Cache] Unexpected error in getCacheStats:", error);
    return null;
  }
}

/**
 * Cleans up expired cache entries from the database
 *
 * Deletes all entries where expires_at is in the past.
 * Useful for periodic maintenance to keep the cache table clean.
 *
 * @returns Number of expired entries deleted, or null on error
 *
 * @example
 * ```typescript
 * // Run cleanup as a scheduled task
 * const cleaned = await cleanupExpiredCache();
 * console.log(`Cleaned up ${cleaned} expired cache entries`);
 * ```
 */
export async function cleanupExpiredCache(): Promise<number | null> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    const { error, data } = await supabase
      .from("api_cache")
      .delete()
      .lt("expires_at", now)
      .select();

    if (error) {
      console.error("[Cache] Error cleaning up expired cache:", error);
      return null;
    }

    const deletedCount = data?.length || 0;
    console.log(`[Cache] Cleaned up ${deletedCount} expired cache entries`);
    return deletedCount;
  } catch (error) {
    console.error("[Cache] Unexpected error in cleanupExpiredCache:", error);
    return null;
  }
}
