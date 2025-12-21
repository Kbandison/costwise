/**
 * Location Detail Page
 * Handles metros, counties, and ZIP codes
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, TrendingUp, Home, Building2 } from 'lucide-react';
import { fetchFairMarketRents } from '@/lib/api/hud';
import type { Metadata } from 'next';

interface LocationPageProps {
  params: Promise<{ id: string }>;
}

// Determine location type from ID
function getLocationType(id: string): 'zip' | 'metro' | 'county' | 'state' | 'unknown' {
  if (id.startsWith('state-')) return 'state';
  if (id.startsWith('metro-')) return 'metro';
  if (id.startsWith('county-')) return 'county';
  if (id.startsWith('zip-')) return 'zip';
  if (/^\d{5}$/.test(id)) return 'zip'; // Also handle plain ZIP codes
  return 'unknown';
}

// Extract actual identifier from prefixed ID
function extractIdentifier(id: string): string {
  if (id.startsWith('state-')) return id.replace('state-', '');
  if (id.startsWith('metro-')) return id.replace('metro-', '');
  if (id.startsWith('county-')) return id.replace('county-', '');
  if (id.startsWith('zip-')) return id.replace('zip-', '');
  return id;
}

// Generate metadata
export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { id } = await params;
  const type = getLocationType(id);
  const identifier = extractIdentifier(id);

  if (type === 'zip') {
    return {
      title: `ZIP Code ${identifier} - Cost of Living | CostWise`,
      description: `Explore cost of living data for ZIP code ${identifier}, including housing costs and Fair Market Rents.`,
    };
  }

  return {
    title: `Location Details | CostWise`,
    description: `Cost of living information for your selected location.`,
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { id } = await params;
  const type = getLocationType(id);
  const identifier = extractIdentifier(id);

  // Handle state - redirect to state page
  if (type === 'state') {
    const stateCode = identifier.toLowerCase();
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-black to-black">
        <div className="text-center">
          <p className="text-gray-400">Redirecting to state page...</p>
          <script
            dangerouslySetInnerHTML={{
              __html: `window.location.href = '/state/${stateCode}';`,
            }}
          />
        </div>
      </div>
    );
  }

  // Handle ZIP code
  if (type === 'zip') {
    let fmrData = null;
    let error = null;

    try {
      fmrData = await fetchFairMarketRents(identifier);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load data';
    }

    if (!fmrData && !error) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-black">
        {/* Header */}
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  ZIP Code {identifier}
                </h1>
                {fmrData && (
                  <p className="text-sm text-gray-400">
                    {fmrData.areaName} • {fmrData.stateName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {error ? (
            <div className="glass-card rounded-2xl border border-red-500/20 bg-red-950/20 p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-red-400">
                <MapPin className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-semibold">Error Loading Data</h2>
                  <p className="mt-2 text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          ) : fmrData ? (
            <>
              {/* Location Info Card */}
              <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/40 to-black/60 p-8 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-lg bg-purple-500/20 p-3">
                    <MapPin className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Location Details</h2>
                    <p className="text-sm text-gray-400">Fair Market Rent data from HUD</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoRow label="ZIP Code" value={identifier} />
                  <InfoRow label="Area" value={fmrData.areaName} />
                  <InfoRow label="County" value={fmrData.countyName} />
                  <InfoRow label="State" value={fmrData.stateName} />
                  {fmrData.metroName && (
                    <InfoRow label="Metro Area" value={fmrData.metroName} />
                  )}
                  <InfoRow label="Data Year" value={fmrData.year.toString()} />
                </div>
              </div>

              {/* Fair Market Rents */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-6">Fair Market Rents</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <RentCard
                    icon={<Building2 className="h-6 w-6" />}
                    title="Studio / Efficiency"
                    rent={fmrData.efficiency}
                    color="purple"
                  />
                  <RentCard
                    icon={<Home className="h-6 w-6" />}
                    title="1 Bedroom"
                    rent={fmrData.oneBedroom}
                    color="blue"
                  />
                  <RentCard
                    icon={<Home className="h-6 w-6" />}
                    title="2 Bedroom"
                    rent={fmrData.twoBedroom}
                    color="green"
                  />
                  <RentCard
                    icon={<Home className="h-6 w-6" />}
                    title="3 Bedroom"
                    rent={fmrData.threeBedroom}
                    color="orange"
                  />
                  <RentCard
                    icon={<Home className="h-6 w-6" />}
                    title="4 Bedroom"
                    rent={fmrData.fourBedroom}
                    color="pink"
                  />
                  {fmrData.medianRent && (
                    <RentCard
                      icon={<TrendingUp className="h-6 w-6" />}
                      title="Median Rent"
                      rent={fmrData.medianRent}
                      color="yellow"
                    />
                  )}
                </div>
              </div>

              {/* Additional Info */}
              {fmrData.isSmallAreaFMR && (
                <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-950/20 p-6">
                  <h3 className="text-sm font-medium text-blue-400 mb-2">Small Area FMR</h3>
                  <p className="text-sm text-gray-400">
                    This ZIP code uses Small Area Fair Market Rents, which provide more granular
                    data at the ZIP code level rather than metro area level.
                  </p>
                </div>
              )}

              {/* State Link */}
              <div className="mt-8">
                <Link
                  href={`/state/${fmrData.stateCode.toLowerCase()}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-white transition-colors hover:bg-white/10"
                >
                  <MapPin className="h-4 w-4" />
                  View {fmrData.stateName} Overview
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // Handle metro and county (not yet implemented)
  if (type === 'metro' || type === 'county') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-black">
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {type === 'metro' ? 'Metro Area' : 'County'} Details
                </h1>
                <p className="text-sm text-gray-400">ID: {identifier}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {type === 'metro' ? 'Metro Area' : 'County'} Data Coming Soon
            </h2>
            <p className="text-gray-400 mb-6">
              We're working on adding detailed cost of living data for metro areas and counties.
              For now, try searching by state or ZIP code.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 text-white transition-all hover:from-purple-600 hover:to-pink-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Unknown type
  notFound();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-gray-400">{label}</dt>
      <dd className="mt-1 text-lg font-medium text-white">{value}</dd>
    </div>
  );
}

function RentCard({
  icon,
  title,
  rent,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  rent: number;
  color: 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'yellow';
}) {
  const colorClasses = {
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  return (
    <div className={`glass-card rounded-2xl border p-6 backdrop-blur-xl ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>

      <div className="text-3xl font-bold text-white mb-1">
        ${rent.toLocaleString()}
        <span className="text-lg text-gray-400">/mo</span>
      </div>

      <div className="text-xs text-gray-400">Fair Market Rent</div>
    </div>
  );
}
