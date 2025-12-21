"use client";

import { PieChart, TrendingUp, TrendingDown } from "lucide-react";

interface MonthlyBudgetEstimateProps {
  col: number;
  housing: number;
  goods: number;
  services: number;
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

export function MonthlyBudgetEstimate({
  col,
  housing,
  goods,
  services,
}: MonthlyBudgetEstimateProps) {
  // Convert COL indices to multipliers
  const housingMultiplier = housing / 100;
  const goodsMultiplier = goods / 100;
  const servicesMultiplier = services / 100;
  const colMultiplier = col / 100;

  // Calculate state costs
  const stateCosts = {
    housing: NATIONAL_AVERAGES.housing * housingMultiplier,
    transportation: NATIONAL_AVERAGES.transportation * colMultiplier,
    food: NATIONAL_AVERAGES.food * goodsMultiplier,
    healthcare: NATIONAL_AVERAGES.healthcare * servicesMultiplier,
    utilities: NATIONAL_AVERAGES.utilities * colMultiplier,
    entertainment: NATIONAL_AVERAGES.entertainment * servicesMultiplier,
    other: NATIONAL_AVERAGES.other * colMultiplier,
  };

  // Calculate totals
  const nationalTotal = Object.values(NATIONAL_AVERAGES).reduce((a, b) => a + b, 0);
  const stateTotal = Object.values(stateCosts).reduce((a, b) => a + b, 0);
  const difference = stateTotal - nationalTotal;
  const percentDiff = ((difference / nationalTotal) * 100).toFixed(1);

  // Calculate percentage breakdown
  const categories = [
    { name: "Housing", amount: stateCosts.housing, color: "bg-purple-500" },
    { name: "Transportation", amount: stateCosts.transportation, color: "bg-blue-500" },
    { name: "Food & Groceries", amount: stateCosts.food, color: "bg-green-500" },
    { name: "Healthcare", amount: stateCosts.healthcare, color: "bg-pink-500" },
    { name: "Utilities", amount: stateCosts.utilities, color: "bg-yellow-500" },
    { name: "Entertainment", amount: stateCosts.entertainment, color: "bg-orange-500" },
    { name: "Other", amount: stateCosts.other, color: "bg-indigo-500" },
  ];

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/30 to-black/50 p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-purple-500/20 p-2">
          <PieChart className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Monthly Budget Estimate</h2>
          <p className="text-xs text-gray-400">Average monthly expenses</p>
        </div>
      </div>

      {/* Total Comparison */}
      <div className="grid md:grid-cols-3 gap-4 mb-6 items-center">
        {/* National Average Total */}
        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-gray-400 mb-1">National Average</div>
          <div className="text-2xl font-bold text-white">
            ${nationalTotal.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">per month</div>
        </div>

        {/* Arrow/Difference */}
        <div className="text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
              difference > 0
                ? "bg-red-500/20 text-red-300"
                : difference < 0
                ? "bg-green-500/20 text-green-300"
                : "bg-gray-500/20 text-gray-300"
            }`}
          >
            {difference > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : difference < 0 ? (
              <TrendingDown className="h-4 w-4" />
            ) : null}
            <span className="font-medium">
              {difference > 0 ? "+" : ""}${Math.round(Math.abs(difference)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* State Total */}
        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <div className="text-xs text-gray-400 mb-1">This State</div>
          <div className="text-2xl font-bold text-white">
            ${Math.round(stateTotal).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">per month</div>
        </div>
      </div>

      {/* Category Breakdown - Compact Grid */}
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        {categories.map((category, idx) => {
          const percentage = (category.amount / stateTotal) * 100;
          return (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${category.color}`} />
                <span className="text-sm text-gray-300">{category.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">
                  ${Math.round(category.amount).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">{percentage.toFixed(0)}%</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-xs text-gray-400 text-center">
          Estimates based on national averages adjusted for state cost of living.
          Actual expenses vary by lifestyle and location.
        </p>
      </div>
    </div>
  );
}
