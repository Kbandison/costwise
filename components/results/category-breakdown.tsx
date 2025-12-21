"use client";

import { formatCurrency, formatPercentage, calculatePercentageDiff } from "@/lib/utils";
import {
  ShoppingCart,
  Car,
  Heart,
  Zap,
  Home,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface CategoryData {
  label: string;
  index: number;
  icon: React.ComponentType<{ className?: string }>;
  estimatedMonthly: number;
  color: string;
}

interface CategoryBreakdownProps {
  housing: number;
  goods: number;
  services: number;
  stateName: string;
}

// Estimated monthly costs for a single person (national average baseline)
const BASELINE_MONTHLY = {
  housing: 1400,
  food: 400,
  transportation: 300,
  healthcare: 400,
  utilities: 200,
};

export function CategoryBreakdown({
  housing,
  goods,
  services,
  stateName,
}: CategoryBreakdownProps) {
  const categories: CategoryData[] = [
    {
      label: "Housing",
      index: housing,
      icon: Home,
      estimatedMonthly: Math.round((BASELINE_MONTHLY.housing * housing) / 100),
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Food & Groceries",
      index: goods,
      icon: ShoppingCart,
      estimatedMonthly: Math.round((BASELINE_MONTHLY.food * goods) / 100),
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Transportation",
      index: goods,
      icon: Car,
      estimatedMonthly: Math.round((BASELINE_MONTHLY.transportation * goods) / 100),
      color: "from-green-500 to-green-600",
    },
    {
      label: "Healthcare",
      index: services,
      icon: Heart,
      estimatedMonthly: Math.round((BASELINE_MONTHLY.healthcare * services) / 100),
      color: "from-red-500 to-red-600",
    },
    {
      label: "Utilities",
      index: services,
      icon: Zap,
      estimatedMonthly: Math.round((BASELINE_MONTHLY.utilities * services) / 100),
      color: "from-yellow-500 to-yellow-600",
    },
  ];

  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/20 to-black/40 p-6 backdrop-blur-xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-medium text-white">Category Breakdown</h2>
          <p className="text-sm text-gray-400">{stateName}</p>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const percentDiff = calculatePercentageDiff(category.index);
            const isExpensive = percentDiff > 5;
            const isAffordable = percentDiff < -5;
            const isNeutral = !isExpensive && !isAffordable;

            return (
              <div
                key={index}
                className="group rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:border-white/10 hover:bg-white/10"
              >
                <div className="space-y-3">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg bg-gradient-to-br ${category.color} p-2.5`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">
                          {category.label}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Index: {category.index.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        {formatCurrency(category.estimatedMonthly)}
                      </div>
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          isExpensive
                            ? "text-red-400"
                            : isAffordable
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {isExpensive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : isAffordable ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : null}
                        <span>{formatPercentage(Math.abs(percentDiff))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${category.color} transition-all`}
                      style={{
                        width: `${Math.min((category.index / 120) * 100, 100)}%`,
                      }}
                    />
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        isExpensive
                          ? "bg-red-500/10 text-red-400"
                          : isAffordable
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {isExpensive
                        ? "Above Average"
                        : isAffordable
                        ? "Below Average"
                        : "Near Average"}
                    </span>
                    <span className="text-xs text-gray-500">
                      Est. monthly cost
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total estimated monthly cost */}
        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">
                Estimated Total Monthly Cost
              </h3>
              <p className="text-xs text-gray-500">For a single person</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {formatCurrency(
                  categories.reduce((sum, cat) => sum + cat.estimatedMonthly, 0)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-gray-400">
            Estimates based on Bureau of Economic Analysis Regional Price Parity
            data. Individual costs vary based on lifestyle, location within state,
            and personal circumstances.
          </p>
        </div>
      </div>
    </div>
  );
}
