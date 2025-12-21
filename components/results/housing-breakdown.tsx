"use client";

import { formatCurrency, calculatePercentageDiff, formatPercentage } from "@/lib/utils";
import { Home, TrendingUp, TrendingDown } from "lucide-react";

interface HousingBreakdownProps {
  housingIndex: number;
  rentData?: {
    studio: number;
    oneBedroom: number;
    twoBedroom: number;
    threeBedroom: number;
    fourBedroom: number;
  };
  stateName: string;
}

// National average rent estimates (these would ideally come from API)
const NATIONAL_AVERAGE_RENT = {
  studio: 1200,
  oneBedroom: 1400,
  twoBedroom: 1700,
  threeBedroom: 2000,
  fourBedroom: 2400,
};

export function HousingBreakdown({
  housingIndex,
  rentData,
  stateName,
}: HousingBreakdownProps) {
  const housingDiff = calculatePercentageDiff(housingIndex);
  const isExpensive = housingDiff > 0;

  // Estimate rent based on housing index if actual data not available
  const estimatedRent = rentData || {
    studio: Math.round((NATIONAL_AVERAGE_RENT.studio * housingIndex) / 100),
    oneBedroom: Math.round((NATIONAL_AVERAGE_RENT.oneBedroom * housingIndex) / 100),
    twoBedroom: Math.round((NATIONAL_AVERAGE_RENT.twoBedroom * housingIndex) / 100),
    threeBedroom: Math.round((NATIONAL_AVERAGE_RENT.threeBedroom * housingIndex) / 100),
    fourBedroom: Math.round((NATIONAL_AVERAGE_RENT.fourBedroom * housingIndex) / 100),
  };

  const bedrooms = [
    { label: "Studio", value: estimatedRent.studio, national: NATIONAL_AVERAGE_RENT.studio },
    { label: "1 Bedroom", value: estimatedRent.oneBedroom, national: NATIONAL_AVERAGE_RENT.oneBedroom },
    { label: "2 Bedrooms", value: estimatedRent.twoBedroom, national: NATIONAL_AVERAGE_RENT.twoBedroom },
    { label: "3 Bedrooms", value: estimatedRent.threeBedroom, national: NATIONAL_AVERAGE_RENT.threeBedroom },
    { label: "4 Bedrooms", value: estimatedRent.fourBedroom, national: NATIONAL_AVERAGE_RENT.fourBedroom },
  ];

  const maxRent = Math.max(...bedrooms.map((b) => b.value));

  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/20 to-black/40 p-6 backdrop-blur-xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium text-white">Housing Costs</h2>
            <p className="text-sm text-gray-400">{stateName}</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <Home className="h-6 w-6 text-purple-400" />
          </div>
        </div>

        {/* Housing Index */}
        <div className="rounded-lg border border-white/5 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Housing Index</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {housingIndex.toFixed(1)}
              </span>
              <div
                className={`flex items-center gap-1 ${
                  isExpensive ? "text-red-400" : "text-green-400"
                }`}
              >
                {isExpensive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {formatPercentage(Math.abs(housingDiff))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rent by bedroom count */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400">
            Estimated Monthly Rent
          </h3>

          {bedrooms.map((bedroom, index) => {
            const diff = bedroom.value - bedroom.national;
            const diffPercent = ((diff / bedroom.national) * 100);
            const barWidth = (bedroom.value / maxRent) * 100;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{bedroom.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {formatCurrency(bedroom.value)}
                    </span>
                    <span
                      className={`text-xs ${
                        diff > 0 ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      ({diff > 0 ? "+" : ""}
                      {formatPercentage(diffPercent)})
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      diff > 0
                        ? "bg-gradient-to-r from-orange-500 to-red-500"
                        : "bg-gradient-to-r from-green-500 to-emerald-500"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart visualization */}
        <div className="relative h-48 rounded-lg border border-white/5 bg-black/20 p-4">
          <div className="flex h-full items-end justify-around gap-2">
            {bedrooms.map((bedroom, index) => {
              const heightPercent = (bedroom.value / maxRent) * 100;
              return (
                <div key={index} className="group relative flex flex-1 flex-col items-center">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-purple-400 transition-all group-hover:from-purple-500 group-hover:to-purple-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="mt-2 text-xs text-gray-500">
                    {bedroom.label.split(" ")[0]}
                  </span>

                  {/* Tooltip on hover */}
                  <div className="invisible absolute bottom-full mb-2 rounded-lg bg-black/90 px-3 py-2 text-xs text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                    {formatCurrency(bedroom.value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div className="rounded-lg bg-purple-500/10 p-3">
          <p className="text-xs text-gray-400">
            {rentData
              ? "Rent data based on HUD Fair Market Rents."
              : "Estimated based on housing price index. Actual rents may vary by location."}
          </p>
        </div>
      </div>
    </div>
  );
}
