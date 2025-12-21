import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Client Configuration for CostWise
 *
 * This file provides properly configured Supabase clients for different contexts.
 * Use the appropriate client based on where you're running the code.
 */

// Database types matching the schema in migrations/001_initial_schema.sql
// For full type safety, generate types using: npx supabase gen types typescript
export type LocationType = "state" | "metro" | "county" | "zip";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Get Supabase configuration from environment variables
 * Returns placeholder values during build if env vars are not set
 */
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Return placeholder values during build time / when env vars are not set
    // This allows the app to build without throwing errors
    console.warn(
      "Supabase environment variables not set. Using placeholder values."
    );
    return {
      url: "https://placeholder.supabase.co",
      anonKey: "placeholder-key",
      isConfigured: false,
    };
  }

  return { url, anonKey, isConfigured: true };
}

const config = getSupabaseConfig();

// Singleton browser client instance
let browserClient: TypedSupabaseClient | null = null;

/**
 * Create or return the browser Supabase client
 *
 * USE THIS IN:
 * - Client Components (files with "use client")
 * - Browser-side code that needs to interact with Supabase
 * - Components that handle user authentication
 *
 * FEATURES:
 * - Singleton pattern (reuses the same instance)
 * - Auto-refreshes authentication tokens
 * - Persists session in browser storage
 * - Detects auth callbacks from email links
 *
 * EXAMPLE:
 * ```tsx
 * "use client";
 * import { createBrowserClient } from "@/lib/supabase";
 *
 * export function MyComponent() {
 *   const supabase = createBrowserClient();
 *   const { data } = await supabase.from("locations").select("*");
 *   // ...
 * }
 * ```
 */
export function createBrowserClient(): TypedSupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient<Database>(config.url, config.anonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

/**
 * Create a new server Supabase client
 *
 * USE THIS IN:
 * - Server Components (default in app directory)
 * - API Route Handlers (app/api/*)
 * - Server Actions
 * - Any server-side code
 *
 * FEATURES:
 * - Creates a new instance per request (no state sharing)
 * - Does NOT auto-refresh tokens (server-side only)
 * - Does NOT persist sessions
 * - Safe for concurrent requests
 *
 * EXAMPLE:
 * ```tsx
 * // In a Server Component or API route
 * import { createServerClient } from "@/lib/supabase";
 *
 * export async function GET() {
 *   const supabase = createServerClient();
 *   const { data } = await supabase.from("locations").select("*");
 *   // ...
 * }
 * ```
 *
 * IMPORTANT: Always create a new instance per request to avoid
 * sharing authentication state between different users.
 */
export function createServerClient(): TypedSupabaseClient {
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Check if Supabase is properly configured with environment variables
 *
 * @returns true if NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
 *
 * EXAMPLE:
 * ```tsx
 * if (!isSupabaseConfigured()) {
 *   console.error("Supabase is not configured!");
 * }
 * ```
 */
export function isSupabaseConfigured(): boolean {
  return config.isConfigured;
}

/**
 * Default browser client export for convenience
 *
 * USE THIS FOR:
 * - Quick prototyping in client components
 * - Simple read operations
 *
 * PREFER createBrowserClient() or createServerClient() for production code
 * to be explicit about the context.
 */
export const supabase = createBrowserClient();

// Type definitions for database tables (for reference)
// Generate actual types using: npx supabase gen types typescript --local > types/database.ts

/**
 * QUICK REFERENCE GUIDE
 *
 * ═══════════════════════════════════════════════════════════════
 * CLIENT COMPONENTS (Browser)
 * ═══════════════════════════════════════════════════════════════
 *
 * "use client";
 * import { createBrowserClient } from "@/lib/supabase";
 *
 * export function LocationSearch() {
 *   const supabase = createBrowserClient();
 *
 *   async function searchLocations(query: string) {
 *     const { data, error } = await supabase
 *       .from("locations")
 *       .select("*")
 *       .ilike("name", `%${query}%`)
 *       .limit(10);
 *     return data;
 *   }
 *   // ...
 * }
 *
 * ═══════════════════════════════════════════════════════════════
 * SERVER COMPONENTS (Server-side)
 * ═══════════════════════════════════════════════════════════════
 *
 * import { createServerClient } from "@/lib/supabase";
 *
 * export default async function StatePage({ params }) {
 *   const supabase = createServerClient();
 *
 *   const { data } = await supabase
 *     .from("locations")
 *     .select("*")
 *     .eq("state_code", params.code)
 *     .single();
 *
 *   return <div>{data.name}</div>;
 * }
 *
 * ═══════════════════════════════════════════════════════════════
 * API ROUTES (Server-side)
 * ═══════════════════════════════════════════════════════════════
 *
 * import { NextResponse } from "next/server";
 * import { createServerClient } from "@/lib/supabase";
 *
 * export async function GET(request: Request) {
 *   const supabase = createServerClient();
 *
 *   const { data, error } = await supabase
 *     .from("locations")
 *     .select("*");
 *
 *   if (error) {
 *     return NextResponse.json({ error }, { status: 500 });
 *   }
 *
 *   return NextResponse.json({ data });
 * }
 *
 * ═══════════════════════════════════════════════════════════════
 * ENVIRONMENT VARIABLES (.env.local)
 * ═══════════════════════════════════════════════════════════════
 *
 * NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
 *
 * Get these from: https://app.supabase.com/project/_/settings/api
 */

export interface APICacheRow {
  id: string;
  source: string;              // 'hud', 'bea', 'bls', 'eia'
  location_key: string;        // 'zip:30004', 'state:GA', etc.
  data: unknown;               // JSONB data
  created_at: string;
  expires_at: string;
}

export interface LocationRow {
  id: string;
  name: string;
  type: LocationType;          // 'state' | 'metro' | 'county' | 'city' | 'zip'
  state_code: string | null;
  zip_code: string | null;
  metro_code: string | null;
  county_fips: string | null;
  lat: number | null;
  lng: number | null;
  population: number | null;
  created_at: string;
}
