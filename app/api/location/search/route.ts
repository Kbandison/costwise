/**
 * Location Search API Route - FIXED
 * File: app/api/location/search/route.ts
 * 
 * Fixes:
 * - Deduplicates ZIP codes (only returns highest residential_ratio)
 * - Better error handling
 * - More efficient queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// US State data
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

interface SearchResult {
  id: string;
  type: 'state' | 'metro' | 'county' | 'zip';
  name: string;
  stateCode?: string;
  zipCode?: string;
  population?: number;
  rank?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Search query must be at least 2 characters',
        },
      }, { status: 400 });
    }

    const results: SearchResult[] = [];

    // 1. Check if it's a ZIP code (5 digits)
    if (/^\d{1,5}$/.test(query)) {
      const zipResults = await searchZipCodes(query, limit);
      results.push(...zipResults);
    }

    // 2. Search states
    const stateResults = searchStates(query, limit);
    results.push(...stateResults);

    // 3. Search metro areas and cities
    const metroResults = await searchMetros(query, limit);
    results.push(...metroResults);

    // Sort by relevance and limit
    const sortedResults = results
      .sort((a, b) => {
        // Exact matches first
        const aExact = a.name.toLowerCase() === query.toLowerCase() ? 1 : 0;
        const bExact = b.name.toLowerCase() === query.toLowerCase() ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;

        // Then by type priority: state > metro > zip
        const typePriority = { state: 3, metro: 2, county: 1, zip: 0 };
        return typePriority[b.type] - typePriority[a.type];
      })
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: sortedResults,
      meta: {
        query,
        count: sortedResults.length,
      },
    });

  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to search locations',
      },
    }, { status: 500 });
  }
}

/**
 * Search ZIP codes - FIXED to deduplicate
 */
async function searchZipCodes(query: string, limit: number): Promise<SearchResult[]> {
  try {
    // Get ZIPs ordered by residential_ratio (highest first)
    const { data, error } = await supabase
      .from('zip_to_cbsa')
      .select('zip_code, cbsa_name, residential_ratio')
      .like('zip_code', `${query}%`)
      .order('residential_ratio', { ascending: false })
      .limit(limit * 3); // Get more to dedupe

    if (error || !data) {
      console.error('ZIP search error:', error);
      return [];
    }

    // CRITICAL FIX: Deduplicate by ZIP code
    // Keep only the first occurrence (highest residential_ratio)
    const seenZips = new Set<string>();
    const uniqueResults: SearchResult[] = [];

    for (const item of data) {
      if (!seenZips.has(item.zip_code) && uniqueResults.length < limit) {
        seenZips.add(item.zip_code);
        
        const stateParts = item.cbsa_name.split(',');
        const stateCode = stateParts[1]?.trim().split(' ')[0] || '';
        
        uniqueResults.push({
          id: `zip-${item.zip_code}`, // Now guaranteed unique!
          type: 'zip' as const,
          name: `ZIP ${item.zip_code}`,
          stateCode,
          zipCode: item.zip_code,
        });
      }
    }

    return uniqueResults;
  } catch (error) {
    console.error('ZIP search error:', error);
    return [];
  }
}

/**
 * Search US states
 */
function searchStates(query: string, limit: number): SearchResult[] {
  const lowerQuery = query.toLowerCase();
  
  return US_STATES
    .filter(state => 
      state.name.toLowerCase().includes(lowerQuery) ||
      state.code.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit)
    .map(state => ({
      id: `state-${state.code}`,
      type: 'state' as const,
      name: state.name,
      stateCode: state.code,
    }));
}

/**
 * Search metro areas (CBSAs) and cities - Already deduped
 */
async function searchMetros(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const { data, error } = await supabase
      .from('zip_to_cbsa')
      .select('cbsa_code, cbsa_name')
      .ilike('cbsa_name', `%${query}%`)
      .limit(limit * 2); // Get more to dedupe

    if (error || !data) {
      console.error('Metro search error:', error);
      return [];
    }

    // Deduplicate by CBSA code
    const seen = new Set<string>();
    const unique: SearchResult[] = [];

    for (const item of data) {
      if (!seen.has(item.cbsa_code) && unique.length < limit) {
        seen.add(item.cbsa_code);
        
        const nameParts = item.cbsa_name.split(',');
        const cityName = nameParts[0]?.trim() || item.cbsa_name;
        const stateCode = nameParts[1]?.trim().split(' ')[0] || '';

        unique.push({
          id: `metro-${item.cbsa_code}`,
          type: 'metro' as const,
          name: cityName,
          stateCode,
        });
      }
    }

    return unique;
  } catch (error) {
    console.error('Metro search error:', error);
    return [];
  }
}