-- ============================================================================
-- CostWise Initial Database Schema
-- Migration: 001_initial_schema
-- Description: Creates core tables for API caching and location autocomplete
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- API CACHE TABLE
-- Stores cached API responses to reduce external API calls and improve performance
-- ============================================================================

CREATE TABLE api_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Cache key: unique identifier for the cached request (e.g., endpoint + params hash)
    cache_key TEXT NOT NULL UNIQUE,

    -- The cached response data as JSONB for flexible querying
    response_data JSONB NOT NULL,

    -- API source identifier (e.g., 'bls', 'census', 'zillow')
    api_source TEXT NOT NULL,

    -- Original request metadata for debugging/auditing
    request_url TEXT,
    request_params JSONB,

    -- HTTP status code of the cached response
    status_code INTEGER DEFAULT 200,

    -- Cache timing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Track cache hits for analytics
    hit_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ
);

-- Index for fast cache lookups by key
CREATE INDEX idx_api_cache_cache_key ON api_cache (cache_key);

-- Index for finding expired entries (for cleanup jobs)
CREATE INDEX idx_api_cache_expires_at ON api_cache (expires_at);

-- Index for filtering by API source
CREATE INDEX idx_api_cache_api_source ON api_cache (api_source);

-- Composite index for source + expiration queries
CREATE INDEX idx_api_cache_source_expires ON api_cache (api_source, expires_at);

COMMENT ON TABLE api_cache IS 'Stores cached API responses to reduce external API calls and improve response times';
COMMENT ON COLUMN api_cache.cache_key IS 'Unique identifier for the cached request, typically a hash of endpoint + parameters';
COMMENT ON COLUMN api_cache.response_data IS 'The cached API response stored as JSONB';
COMMENT ON COLUMN api_cache.api_source IS 'Identifier for the API source (e.g., bls, census, zillow)';
COMMENT ON COLUMN api_cache.expires_at IS 'When this cache entry should be considered stale';
COMMENT ON COLUMN api_cache.hit_count IS 'Number of times this cache entry has been accessed';

-- ============================================================================
-- LOCATIONS TABLE
-- Stores US locations for autocomplete functionality
-- Supports states, metropolitan areas, counties, and ZIP codes
-- ============================================================================

-- Enum for location types
CREATE TYPE location_type AS ENUM ('state', 'metro', 'county', 'zip');

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Location type determines the granularity
    type location_type NOT NULL,

    -- Display name for the location (e.g., "New York, NY" or "90210")
    name TEXT NOT NULL,

    -- Searchable name (lowercase, normalized for autocomplete matching)
    search_name TEXT NOT NULL,

    -- Geographic codes for API lookups
    state_code CHAR(2),              -- Two-letter state abbreviation (e.g., 'CA', 'NY')
    state_fips CHAR(2),              -- State FIPS code (e.g., '06' for California)
    county_fips CHAR(5),             -- Full county FIPS code (state + county, e.g., '06037')
    metro_code TEXT,                 -- CBSA/MSA code for metropolitan areas
    zip_code CHAR(5),                -- 5-digit ZIP code

    -- Parent relationships for hierarchical lookups
    parent_state_id UUID REFERENCES locations(id),
    parent_metro_id UUID REFERENCES locations(id),
    parent_county_id UUID REFERENCES locations(id),

    -- Geographic coordinates for mapping
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),

    -- Population for sorting results by relevance
    population INTEGER,

    -- Additional metadata
    timezone TEXT,
    region TEXT,                     -- Census region (e.g., 'West', 'Northeast')
    division TEXT,                   -- Census division (e.g., 'Pacific', 'New England')

    -- Tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure unique entries per type and code combination
    CONSTRAINT unique_state UNIQUE NULLS NOT DISTINCT (type, state_fips)
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT unique_county UNIQUE NULLS NOT DISTINCT (type, county_fips)
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT unique_zip UNIQUE NULLS NOT DISTINCT (type, zip_code)
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT unique_metro UNIQUE NULLS NOT DISTINCT (type, metro_code)
        DEFERRABLE INITIALLY DEFERRED
);

-- Primary index for autocomplete searches (case-insensitive prefix matching)
CREATE INDEX idx_locations_search_name ON locations (search_name text_pattern_ops);

-- Index for type-filtered searches
CREATE INDEX idx_locations_type_search ON locations (type, search_name text_pattern_ops);

-- Index for lookups by state code
CREATE INDEX idx_locations_state_code ON locations (state_code);

-- Index for lookups by FIPS codes
CREATE INDEX idx_locations_state_fips ON locations (state_fips);
CREATE INDEX idx_locations_county_fips ON locations (county_fips);

-- Index for ZIP code lookups
CREATE INDEX idx_locations_zip_code ON locations (zip_code);

-- Index for metro code lookups
CREATE INDEX idx_locations_metro_code ON locations (metro_code);

-- Index for sorting by population (for relevance ranking)
CREATE INDEX idx_locations_population ON locations (population DESC NULLS LAST);

-- Composite index for type + population (common query pattern)
CREATE INDEX idx_locations_type_population ON locations (type, population DESC NULLS LAST);

-- Index for geographic queries
CREATE INDEX idx_locations_coordinates ON locations (latitude, longitude);

-- Index for parent relationship traversal
CREATE INDEX idx_locations_parent_state ON locations (parent_state_id);
CREATE INDEX idx_locations_parent_metro ON locations (parent_metro_id);
CREATE INDEX idx_locations_parent_county ON locations (parent_county_id);

COMMENT ON TABLE locations IS 'US locations for autocomplete - states, metros, counties, and ZIP codes';
COMMENT ON COLUMN locations.type IS 'Location granularity: state, metro (MSA/CBSA), county, or zip';
COMMENT ON COLUMN locations.name IS 'Display name shown to users';
COMMENT ON COLUMN locations.search_name IS 'Lowercase normalized name for search matching';
COMMENT ON COLUMN locations.state_fips IS 'Two-digit state FIPS code';
COMMENT ON COLUMN locations.county_fips IS 'Five-digit county FIPS code (includes state prefix)';
COMMENT ON COLUMN locations.metro_code IS 'CBSA/MSA code for metropolitan statistical areas';
COMMENT ON COLUMN locations.population IS 'Population count for relevance ranking in search results';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on locations
CREATE TRIGGER trigger_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired cache entries
-- Usage: SELECT cleanup_expired_cache();
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_cache() IS 'Removes expired entries from api_cache. Returns count of deleted rows.';

-- Function to increment cache hit count
CREATE OR REPLACE FUNCTION record_cache_hit(p_cache_key TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE api_cache
    SET hit_count = hit_count + 1,
        last_accessed_at = NOW()
    WHERE cache_key = p_cache_key;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_cache_hit(TEXT) IS 'Increments hit count and updates last_accessed_at for a cache entry';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS but allow public read access for locations
-- ============================================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- Locations are publicly readable (no auth required for autocomplete)
CREATE POLICY "Locations are publicly readable"
    ON locations FOR SELECT
    USING (true);

-- API cache is publicly readable (cached data is not sensitive)
CREATE POLICY "API cache is publicly readable"
    ON api_cache FOR SELECT
    USING (true);

-- Only service role can insert/update/delete (for backend operations)
CREATE POLICY "Service role can manage locations"
    ON locations FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage api_cache"
    ON api_cache FOR ALL
    USING (auth.role() = 'service_role');
