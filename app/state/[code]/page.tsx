/**
 * Enhanced State Detail Page with Full Breakdown
 * File: app/state/[code]/page.tsx
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import stateColData from '@/public/data/state-col-data.json';
import type { Metadata } from 'next';
import { CostBreakdownTable } from '@/components/cost-breakdown/cost-breakdown-table';
import { SalaryCalculator } from '@/components/calculators/salary-calculator';
import { getEnergyPricesByState } from '@/lib/api/eia';

interface StatePageProps {
  params: Promise<{ code: string }>;
}

// Generate static params for all states
export async function generateStaticParams() {
  return Object.keys(stateColData.states).map((code) => ({
    code: code.toLowerCase(),
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const stateData = stateColData.states[upperCode as keyof typeof stateColData.states];

  if (!stateData) {
    return {
      title: 'State Not Found - CostWise',
    };
  }

  const percentDiff = (stateData.col - 100).toFixed(1);
  const comparison = parseFloat(percentDiff) > 0 ? 'above' : 'below';

  return {
    title: `${stateData.name} Cost of Living | CostWise`,
    description: `${stateData.name} has a cost of living index of ${stateData.col.toFixed(1)}, which is ${Math.abs(parseFloat(percentDiff))}% ${comparison} the national average.`,
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const stateData = stateColData.states[upperCode as keyof typeof stateColData.states];

  if (!stateData) {
    notFound();
  }

  // Fetch energy prices for gasoline data
  let energyPrices;
  try {
    const result = await getEnergyPricesByState(upperCode);
    energyPrices = result.data;
    console.log(`[PAGE-${upperCode}] energyPrices received:`, {
      hasData: !!energyPrices,
      gasolinePrice: energyPrices?.gasolinePrice,
      gasolineNationalAvg: energyPrices?.gasolineNationalAvg,
      electricityPrice: energyPrices?.electricityPrice
    });
  } catch (error) {
    console.warn(`Failed to fetch energy prices for ${upperCode}:`, error);
    energyPrices = null;
  }

  // Calculate comparisons
  const nationalAvg = 100;
  const colDiff = stateData.col - nationalAvg;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{stateData.name}</h1>
              <p className="text-xs text-gray-400">
                Rank #{stateData.rank} of 51
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* COL Index Summary - Compact */}
        <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/40 to-black/60 p-6 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Big Number */}
            <div className="text-center md:text-left">
              <div className="text-7xl font-bold text-white mb-2">{stateData.col}</div>
              <div className="text-sm text-gray-400">Cost of Living Index</div>
              <div className="text-xs text-gray-500">National avg: 100</div>
            </div>

            {/* Right: Summary */}
            <div className="flex-1 text-center md:text-right">
              <p className="text-lg text-gray-300 mb-3">
                <span className={`font-semibold ${colDiff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {Math.abs(colDiff).toFixed(1)}% {colDiff > 0 ? 'more expensive' : 'less expensive'}
                </span>{" "}
                than the national average
              </p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                colDiff > 0
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
              }`}>
                {colDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-medium">Ranked #{stateData.rank} of 51</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown Table - MOST IMPORTANT */}
        <CostBreakdownTable
          col={stateData.col}
          housing={stateData.housing}
          goods={stateData.goods}
          services={stateData.services}
          gasolinePrice={energyPrices?.gasolinePrice}
          gasolineNationalAvg={energyPrices?.gasolineNationalAvg}
        />

        {/* Quick Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="text-sm text-gray-400 mb-1">Housing Index</div>
            <div className="text-3xl font-bold text-white">{stateData.housing}</div>
            <div className={`text-sm mt-1 ${stateData.housing > 100 ? 'text-red-400' : 'text-green-400'}`}>
              {stateData.housing > 100 ? '+' : ''}{(stateData.housing - 100).toFixed(1)}% vs national
            </div>
          </div>
          <div className="glass-card rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="text-sm text-gray-400 mb-1">Goods Index</div>
            <div className="text-3xl font-bold text-white">{stateData.goods}</div>
            <div className={`text-sm mt-1 ${stateData.goods > 100 ? 'text-red-400' : 'text-green-400'}`}>
              {stateData.goods > 100 ? '+' : ''}{(stateData.goods - 100).toFixed(1)}% vs national
            </div>
          </div>
          <div className="glass-card rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="text-sm text-gray-400 mb-1">Services Index</div>
            <div className="text-3xl font-bold text-white">{stateData.services}</div>
            <div className={`text-sm mt-1 ${stateData.services > 100 ? 'text-red-400' : 'text-green-400'}`}>
              {stateData.services > 100 ? '+' : ''}{(stateData.services - 100).toFixed(1)}% vs national
            </div>
          </div>
        </div>

        {/* Salary Calculator */}
        <SalaryCalculator
          targetStateName={stateData.name}
          targetStateCOL={stateData.col}
        />

        {/* Counties & Metro Areas Map */}
        <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-blue-950/20 to-black/40 p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-blue-500/20 p-3">
              <MapPin className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Counties & Metro Areas</h2>
              <p className="text-sm text-gray-400">Drill down to specific regions in {stateData.name}</p>
            </div>
          </div>

          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Interactive County Map Coming Soon</h3>
            <p className="text-gray-400 text-base mb-4">
              We're working on adding an interactive county map that will let you click on specific regions to see detailed cost of living data.
            </p>
            <p className="text-gray-500 text-sm">
              In the meantime, use the search bar to find specific cities, metro areas, or ZIP codes.
            </p>
          </div>
        </div>

        {/* Data Source */}
        <div className="text-center text-sm text-gray-500">
          <p>Data sourced from Bureau of Economic Analysis Regional Price Parities</p>
          <p className="mt-1">Last updated: 2024 • National average baseline: 100</p>
        </div>
      </div>
    </div>
  );
}

