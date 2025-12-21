"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Home, Car, ShoppingCart, Heart, Zap, Coffee, DollarSign } from "lucide-react";

interface CostBreakdownTableProps {
  col: number;
  housing: number;
  goods: number;
  services: number;
  gasolinePrice?: number;
  gasolineNationalAvg?: number;
}

// National monthly averages (in dollars)
const NATIONAL_AVERAGES = {
  housing: 1400,
  transportation: 800,
  food: 450,
  healthcare: 400,
  utilities: 150,
  entertainment: 250,
  other: 300,
};

const CATEGORIES = [
  {
    name: "Housing",
    icon: Home,
    national: NATIONAL_AVERAGES.housing,
    useIndex: "housing",
    description: "Rent, mortgages, property taxes, insurance",
    details: [
      "Average 2-bedroom apartment rent",
      "Property taxes and insurance",
      "Utilities (sometimes included in rent)",
      "Maintenance and HOA fees",
    ],
    tip: "Housing is typically the largest monthly expense, representing 30-40% of total costs.",
    // National average rent by bedroom size
    rentBreakdown: {
      studio: 1100,
      oneBedroom: 1300,
      twoBedroom: 1500,
      threeBedroom: 1800,
      fourBedroom: 2100,
    },
  },
  {
    name: "Transportation",
    icon: Car,
    national: NATIONAL_AVERAGES.transportation,
    useIndex: "col",
    description: "Auto payments, insurance, gas, maintenance",
    details: [
      "Car payment or lease",
      "Auto insurance premiums",
      "Gas and fuel costs",
      "Maintenance and repairs",
      "Registration and fees",
      "Public transit if applicable",
    ],
    tip: "Transportation costs vary greatly by location - urban areas may have lower car costs but higher parking fees.",
  },
  {
    name: "Food & Groceries",
    icon: ShoppingCart,
    national: NATIONAL_AVERAGES.food,
    useIndex: "goods",
    description: "Groceries, household items",
    details: [
      "Weekly groceries and staples",
      "Fresh produce and meats",
      "Packaged and canned goods",
      "Household cleaning supplies",
      "Personal care products",
    ],
    tip: "Grocery prices can vary 20-30% between states due to transportation costs and local taxes.",
  },
  {
    name: "Healthcare",
    icon: Heart,
    national: NATIONAL_AVERAGES.healthcare,
    useIndex: "services",
    description: "Insurance, co-pays, prescriptions",
    details: [
      "Health insurance premiums",
      "Doctor visit co-pays",
      "Prescription medications",
      "Dental and vision care",
      "Out-of-pocket medical expenses",
    ],
    tip: "Healthcare costs vary significantly by state due to insurance markets and provider networks.",
  },
  {
    name: "Utilities",
    icon: Zap,
    national: NATIONAL_AVERAGES.utilities,
    useIndex: "col",
    description: "Electric, water, gas, internet",
    details: [
      "Electricity",
      "Water and sewer",
      "Natural gas or heating oil",
      "Internet and cable/streaming",
      "Cell phone service",
    ],
    tip: "Utility costs depend heavily on climate - heating costs in cold states, cooling costs in hot states.",
  },
  {
    name: "Entertainment",
    icon: Coffee,
    national: NATIONAL_AVERAGES.entertainment,
    useIndex: "services",
    description: "Dining, movies, recreation",
    details: [
      "Dining out and takeout",
      "Movies and entertainment",
      "Streaming services",
      "Gym memberships",
      "Hobbies and recreation",
    ],
    tip: "Entertainment spending is highly variable and can often be adjusted based on budget.",
  },
  {
    name: "Other",
    icon: DollarSign,
    national: NATIONAL_AVERAGES.other,
    useIndex: "col",
    description: "Clothing, personal care, misc.",
    details: [
      "Clothing and apparel",
      "Personal services (haircuts, etc.)",
      "Pet care and supplies",
      "Gifts and donations",
      "Miscellaneous expenses",
    ],
    tip: "This category covers all other regular expenses not included in the main categories above.",
  },
];

export function CostBreakdownTable({
  col,
  housing,
  goods,
  services,
  gasolinePrice,
  gasolineNationalAvg,
}: CostBreakdownTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const multipliers = {
    housing: housing / 100,
    goods: goods / 100,
    services: services / 100,
    col: col / 100,
  };

  // Calculate monthly gas costs based on average driving
  const AVG_MONTHLY_MILES = 1000; // Average miles driven per month
  const AVG_MPG = 25; // Average fuel efficiency
  const monthlyGallons = AVG_MONTHLY_MILES / AVG_MPG;

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/20 to-black/40 backdrop-blur-xl overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white mb-1">Cost Breakdown by Category</h2>
        <p className="text-sm text-gray-400">Monthly costs compared to national averages</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left p-4 text-sm font-semibold text-gray-300">Category</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-300">National Avg</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-300">This State</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-300">Difference</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((category, idx) => {
              const Icon = category.icon;
              const multiplier = multipliers[category.useIndex as keyof typeof multipliers];
              const stateCost = category.national * multiplier;
              const difference = stateCost - category.national;
              const percentDiff = ((difference / category.national) * 100).toFixed(1);
              const isExpanded = expandedRow === idx;

              return (
                <React.Fragment key={idx}>
                  <tr
                    className={`border-b border-white/10 transition-all cursor-pointer select-none ${
                      isExpanded
                        ? 'bg-purple-500/10 hover:bg-purple-500/15'
                        : 'hover:bg-white/10'
                    }`}
                    onClick={() => setExpandedRow(isExpanded ? null : idx)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                        <div>
                          <div className="text-white font-medium flex items-center gap-2">
                            {category.name}
                            <span className="text-xs text-gray-500">(click for details)</span>
                          </div>
                          <div className="text-xs text-gray-500">{category.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-white font-medium">
                        ${category.national.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">per month</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-white font-bold">
                        ${Math.round(stateCost).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">per month</div>
                    </td>
                    <td className="p-4 text-right">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                          difference > 0
                            ? "text-red-400 bg-red-500/10"
                            : difference < 0
                            ? "text-green-400 bg-green-500/10"
                            : "text-gray-400"
                        }`}
                      >
                        {difference > 0 ? "+" : ""}${Math.round(difference).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ({difference > 0 ? "+" : ""}{percentDiff}%)
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-purple-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {isExpanded && (
                    <tr className="bg-purple-500/5 border-b border-white/10">
                      <td colSpan={5} className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Left: What's Included */}
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <Icon className="h-4 w-4 text-purple-400" />
                              What's Included
                            </h4>
                            <ul className="space-y-2">
                              {category.details.map((detail, detailIdx) => (
                                <li key={detailIdx} className="flex items-start gap-2 text-sm text-gray-300">
                                  <span className="text-purple-400 mt-1">•</span>
                                  {detail}
                                </li>
                              ))}
                            </ul>

                            {/* Housing Rent Breakdown - Only for Housing */}
                            {category.name === "Housing" && category.rentBreakdown && (
                              <div className="mt-6 pt-4 border-t border-white/10">
                                <h5 className="text-sm font-semibold text-white mb-3">
                                  Estimated Rent by Bedroom Size
                                </h5>
                                <div className="space-y-2">
                                  {Object.entries(category.rentBreakdown).map(([type, nationalRent]) => {
                                    const stateRent = nationalRent * multiplier;
                                    const labels: Record<string, string> = {
                                      studio: "Studio",
                                      oneBedroom: "1 Bedroom",
                                      twoBedroom: "2 Bedroom",
                                      threeBedroom: "3 Bedroom",
                                      fourBedroom: "4 Bedroom",
                                    };
                                    return (
                                      <div key={type} className="flex items-center justify-between text-sm bg-white/5 rounded p-2">
                                        <span className="text-gray-300">{labels[type]}</span>
                                        <div className="flex items-center gap-3">
                                          <span className="text-gray-400">${nationalRent.toLocaleString()}</span>
                                          <span className="text-gray-500">→</span>
                                          <span className="text-white font-semibold">${Math.round(stateRent).toLocaleString()}/mo</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                  Based on national averages adjusted for state housing index
                                </p>
                              </div>
                            )}

                            {/* Transportation Gas Prices - Only for Transportation */}
                            {category.name === "Transportation" && (
                              <div className="mt-6 pt-4 border-t border-white/10">
                                {gasolinePrice && gasolineNationalAvg ? (
                                  <>
                                    <h5 className="text-sm font-semibold text-white mb-3">
                                      Gasoline Prices
                                    </h5>
                                <div className="space-y-3">
                                  {/* Price per gallon comparison */}
                                  <div className="flex items-center justify-between text-sm bg-white/5 rounded p-2">
                                    <span className="text-gray-300">Price per Gallon</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-gray-400">${gasolineNationalAvg.toFixed(2)}</span>
                                      <span className="text-gray-500">→</span>
                                      <span className="text-white font-semibold">${gasolinePrice.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  {/* Monthly cost estimate */}
                                  <div className="flex items-center justify-between text-sm bg-white/5 rounded p-2">
                                    <span className="text-gray-300">Monthly Cost ({AVG_MONTHLY_MILES} mi @ {AVG_MPG} mpg)</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-gray-400">${Math.round(monthlyGallons * gasolineNationalAvg)}</span>
                                      <span className="text-gray-500">→</span>
                                      <span className="text-white font-semibold">${Math.round(monthlyGallons * gasolinePrice)}/mo</span>
                                    </div>
                                  </div>

                                  {/* Price difference indicator */}
                                  <div className={`flex items-center justify-between text-sm rounded p-2 ${
                                    gasolinePrice > gasolineNationalAvg
                                      ? 'bg-red-500/10 border border-red-500/20'
                                      : 'bg-green-500/10 border border-green-500/20'
                                  }`}>
                                    <span className="text-gray-300">Difference</span>
                                    <span className={`font-semibold ${
                                      gasolinePrice > gasolineNationalAvg ? 'text-red-400' : 'text-green-400'
                                    }`}>
                                      {gasolinePrice > gasolineNationalAvg ? '+' : ''}
                                      ${(gasolinePrice - gasolineNationalAvg).toFixed(2)}/gal (
                                      {((gasolinePrice / gasolineNationalAvg - 1) * 100).toFixed(1)}%)
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                  Based on latest EIA retail gasoline prices by region
                                </p>
                                  </>
                                ) : (
                                  <div className="text-sm text-gray-400">
                                    <p className="mb-2">Gasoline price data unavailable</p>
                                    <p className="text-xs text-gray-500">
                                      Debug: gasolinePrice={gasolinePrice?.toString() || 'undefined'},
                                      gasolineNationalAvg={gasolineNationalAvg?.toString() || 'undefined'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right: Cost Breakdown & Tip */}
                          <div className="space-y-4">
                            {/* Annual Costs */}
                            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                              <h5 className="text-xs font-semibold text-gray-400 mb-3">Annual Estimate</h5>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-300">National Average:</span>
                                <span className="text-sm font-semibold text-white">
                                  ${(category.national * 12).toLocaleString()}/year
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">This State:</span>
                                <span className="text-sm font-bold text-white">
                                  ${Math.round(stateCost * 12).toLocaleString()}/year
                                </span>
                              </div>
                            </div>

                            {/* Tip */}
                            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                              <div className="flex items-start gap-2">
                                <span className="text-blue-400 text-lg">💡</span>
                                <p className="text-sm text-gray-300">{category.tip}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-white/5 font-bold">
              <td className="p-4 text-white">Total Monthly</td>
              <td className="p-4 text-right text-white">
                ${Object.values(NATIONAL_AVERAGES).reduce((a, b) => a + b, 0).toLocaleString()}
              </td>
              <td className="p-4 text-right text-white">
                ${Math.round(
                  CATEGORIES.reduce((total, cat) => {
                    const mult = multipliers[cat.useIndex as keyof typeof multipliers];
                    return total + cat.national * mult;
                  }, 0)
                ).toLocaleString()}
              </td>
              <td className="p-4 text-right">
                {(() => {
                  const nationalTotal = Object.values(NATIONAL_AVERAGES).reduce((a, b) => a + b, 0);
                  const stateTotal = CATEGORIES.reduce((total, cat) => {
                    const mult = multipliers[cat.useIndex as keyof typeof multipliers];
                    return total + cat.national * mult;
                  }, 0);
                  const diff = stateTotal - nationalTotal;
                  return (
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                        diff > 0 ? "text-red-400" : diff < 0 ? "text-green-400" : "text-gray-400"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}${Math.round(diff).toLocaleString()}
                    </div>
                  );
                })()}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="p-4 bg-white/5 text-center">
        <p className="text-xs text-gray-400">
          💡 <strong>Tip:</strong> Click any row above to see detailed breakdowns, what's included, and annual cost estimates.
        </p>
      </div>
    </div>
  );
}
