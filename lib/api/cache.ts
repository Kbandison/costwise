import { createServerClient } from "@/lib/supabase";
import type { APISource, CacheConfig } from "@/types";
import { DEFAULT_CACHE_TTL } from "@/types";

/**
 * Generate a cache key from API source, endpoint, and params
 */
export function generateCacheKey(
  source: APISource,
  endpoint: string,
  params?: Record<string, unknown>
): string {
  const paramString = params ? JSON.stringify(params, Object.keys(params).sort()) : "";
  return `${source}:${endpoint}:${paramString}`;
}

/**
 * Get cached data if available and not expired
 */
export async function getCachedData<T>(
  source: APISource,
  locationKey: string
): Promise<{ data: T; cacheAge: number } | null> {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("api_cache")
      .select("data, created_at, expires_at")
      .eq("source", source)
      .eq("location_key", locationKey)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    const row = data as { data: unknown; created_at: string; expires_at: string };

    const cacheAge = Math.floor(
      (Date.now() - new Date(row.created_at).getTime()) / 1000
    );

    return {
      data: row.data as T,
      cacheAge,
    };
  } catch (error) {
    console.error("Cache read error:", error);
    return null;
  }
}

/**
 * Store data in cache
 */
export async function setCachedData<T>(
  cacheKey: string,
  data: T,
  config: CacheConfig,
  requestUrl?: string,
  requestParams?: Record<string, unknown>
): Promise<void> {
  try {
    // Don't cache null or undefined values
    if (data === null || data === undefined) {
      return;
    }

    const supabase = createServerClient();
    const expiresAt = new Date(
      Date.now() + (config.ttlSeconds || DEFAULT_CACHE_TTL[config.source]) * 1000
    );

    // Match existing schema: source, location_key, data, expires_at, created_at
    const { error } = await supabase
      .from("api_cache")
      .upsert(
        {
          source: config.source,
          location_key: cacheKey,
          data: data as unknown,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "source,location_key" }
      );

    if (error) {
      console.error("Cache write error:", error);
    }
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

/**
 * Invalidate cache entry
 */
export async function invalidateCache(source: APISource, locationKey: string): Promise<void> {
  try {
    const supabase = createServerClient();

    await supabase
      .from("api_cache")
      .delete()
      .eq("source", source)
      .eq("location_key", locationKey);
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
}

/**
 * Invalidate all cache entries for a source
 */
export async function invalidateCacheBySource(source: APISource): Promise<void> {
  try {
    const supabase = createServerClient();

    await supabase.from("api_cache").delete().eq("source", source);
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
}

/**
 * Wrapper for API calls with caching
 */
export async function withCache<T>(
  cacheKey: string,
  config: CacheConfig,
  fetchFn: () => Promise<T>,
  requestUrl?: string,
  requestParams?: Record<string, unknown>
): Promise<{ data: T; cached: boolean; cacheAge?: number }> {
  // Try to get from cache first
  const cached = await getCachedData<T>(config.source, cacheKey);

  if (cached) {
    console.log(`[CACHE-HIT] ${config.source}:${cacheKey.substring(0, 50)} (age: ${cached.cacheAge}s)`);
    return {
      data: cached.data,
      cached: true,
      cacheAge: cached.cacheAge,
    };
  }

  console.log(`[CACHE-MISS] ${config.source}:${cacheKey.substring(0, 50)} - fetching fresh data`);

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache (don't await)
  setCachedData(cacheKey, data, config, requestUrl, requestParams);

  return {
    data,
    cached: false,
  };
}
