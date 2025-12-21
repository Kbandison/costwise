"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface HousingDetails {
  studio: { national: number; state: number };
  oneBedroom: { national: number; state: number };
  twoBedroom: { national: number; state: number };
  threeBedroom: { national: number; state: number };
  fourBedroom: { national: number; state: number };
  dataSource: "HUD FMR" | "Estimated";
}

interface CostCategoryProps {
  categoryName: string;
  icon: React.ReactNode;
  nationalAverage: number;
  stateMultiplier: number;
  colorTheme: "purple" | "blue" | "green" | "orange" | "pink" | "yellow";
  itemsIncluded: string[];
  housingDetails?: HousingDetails;
}

export function CostCategory({
  categoryName,
  icon,
  nationalAverage,
  stateMultiplier,
  colorTheme,
  itemsIncluded,
  housingDetails,
}: CostCategoryProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showHousingBreakdown, setShowHousingBreakdown] = useState(false);

  // Calculate state-specific cost
  const stateCost = nationalAverage * stateMultiplier;
  const difference = stateCost - nationalAverage;
  const percentDiff = ((difference / nationalAverage) * 100).toFixed(1);

  // Color classes for different themes
  const colorClasses = {
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  const iconColorClasses = {
    purple: "text-purple-400",
    blue: "text-blue-400",
    green: "text-green-400",
    orange: "text-orange-400",
    pink: "text-pink-400",
    yellow: "text-yellow-400",
  };

  return (
    <div
      className={`glass-card rounded-2xl border p-6 backdrop-blur-xl bg-gradient-to-br transition-all hover:scale-[1.02] cursor-pointer ${colorClasses[colorTheme]}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={iconColorClasses[colorTheme]}>{icon}</div>
          <h3 className="text-xl font-bold text-white">{categoryName}</h3>
        </div>
        {showDetails ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </div>

      {/* Cost Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* National Average */}
        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-sm text-gray-400 mb-1">National Average</div>
          <div className="text-2xl font-bold text-white">
            ${nationalAverage.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">per month</div>
        </div>

        {/* State Cost */}
        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-sm text-gray-400 mb-1">This State</div>
          <div className="text-2xl font-bold text-white">
            ${Math.round(stateCost).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">per month</div>
        </div>
      </div>

      {/* Difference */}
      <div className="text-center mb-4">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
            difference > 0
              ? "bg-red-500/20 text-red-300"
              : difference < 0
              ? "bg-green-500/20 text-green-300"
              : "bg-gray-500/20 text-gray-300"
          }`}
        >
          <span className="font-semibold">
            {difference > 0 ? "+" : ""}${Math.round(difference).toLocaleString()}{" "}
            ({percentDiff}%)
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>Less Expensive</span>
          <span>More Expensive</span>
        </div>
        <div className="relative h-4 overflow-hidden rounded-full bg-gradient-to-r from-green-900/40 via-yellow-900/40 to-red-900/40">
          <div
            className="absolute top-0 h-full w-1 bg-white shadow-lg"
            style={{
              left: `${Math.min(Math.max((stateMultiplier - 0.8) / 0.6, 0) * 100, 100)}%`,
            }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-white">
              {(stateMultiplier * 100).toFixed(0)}
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>80%</span>
          <span>100%</span>
          <span>120%</span>
          <span>140%</span>
        </div>
      </div>

      {/* Items Included - Expandable */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            What's Included:
          </h4>
          <ul className="space-y-2">
            {itemsIncluded.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                <span className={`${iconColorClasses[colorTheme]} mt-0.5`}>•</span>
                {item}
              </li>
            ))}
          </ul>

          {/* Housing Rent Breakdown - Only for Housing category */}
          {housingDetails && (
            <div className="mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHousingBreakdown(!showHousingBreakdown);
                }}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <span className="text-sm font-semibold text-white">
                  Rent by Bedroom Count
                </span>
                {showHousingBreakdown ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {showHousingBreakdown && (
                <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="text-xs text-gray-500 mb-3">
                    {housingDetails.dataSource === "HUD FMR"
                      ? "Data from HUD Fair Market Rents"
                      : "Estimated based on state housing cost index"}
                  </div>

                  {/* Studio */}
                  <RentComparisonRow
                    label="Studio/Efficiency"
                    national={housingDetails.studio.national}
                    state={housingDetails.studio.state}
                    colorTheme={colorTheme}
                  />

                  {/* 1 Bedroom */}
                  <RentComparisonRow
                    label="1 Bedroom"
                    national={housingDetails.oneBedroom.national}
                    state={housingDetails.oneBedroom.state}
                    colorTheme={colorTheme}
                  />

                  {/* 2 Bedroom */}
                  <RentComparisonRow
                    label="2 Bedroom"
                    national={housingDetails.twoBedroom.national}
                    state={housingDetails.twoBedroom.state}
                    colorTheme={colorTheme}
                  />

                  {/* 3 Bedroom */}
                  <RentComparisonRow
                    label="3 Bedroom"
                    national={housingDetails.threeBedroom.national}
                    state={housingDetails.threeBedroom.state}
                    colorTheme={colorTheme}
                  />

                  {/* 4 Bedroom */}
                  <RentComparisonRow
                    label="4 Bedroom"
                    national={housingDetails.fourBedroom.national}
                    state={housingDetails.fourBedroom.state}
                    colorTheme={colorTheme}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 text-center">
        Click to {showDetails ? "hide" : "show"} details
      </div>
    </div>
  );
}

// Rent comparison row component
function RentComparisonRow({
  label,
  national,
  state,
  colorTheme,
}: {
  label: string;
  national: number;
  state: number;
  colorTheme: string;
}) {
  const difference = state - national;
  const percentDiff = ((difference / national) * 100).toFixed(1);

  return (
    <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/5">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">
          ${national.toLocaleString()}
        </span>
        <span className="text-gray-500">→</span>
        <span className="text-sm font-semibold text-white">
          ${Math.round(state).toLocaleString()}
        </span>
        <span
          className={`text-xs ${
            difference > 0
              ? "text-red-400"
              : difference < 0
              ? "text-green-400"
              : "text-gray-400"
          }`}
        >
          ({difference > 0 ? "+" : ""}
          {percentDiff}%)
        </span>
      </div>
    </div>
  );
}
