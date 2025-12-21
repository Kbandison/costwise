"use client";

import {
  formatPercentage,
  calculatePercentageDiff,
  getColorForCOL,
  getBgColorForCOL,
} from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface COLSummaryProps {
  stateName: string;
  col: number;
  rank: number;
  totalStates?: number;
}

export function COLSummary({
  stateName,
  col,
  rank,
  totalStates = 51,
}: COLSummaryProps) {
  const percentDiff = calculatePercentageDiff(col);
  const colorClass = getColorForCOL(col);
  const bgColorClass = getBgColorForCOL(col);

  const isAboveAverage = percentDiff > 0;
  const isBelowAverage = percentDiff < 0;
  const isAverage = Math.abs(percentDiff) < 2;

  const Icon = isAboveAverage
    ? TrendingUp
    : isBelowAverage
    ? TrendingDown
    : Minus;

  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/20 to-black/40 p-6 backdrop-blur-xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-medium text-gray-400">
            Cost of Living Index
          </h2>
          <p className="text-sm text-gray-500">{stateName}</p>
        </div>

        {/* Main COL Index */}
        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-bold text-white">{col.toFixed(1)}</span>
            <div className={`flex items-center gap-1 ${colorClass}`}>
              <Icon className="h-6 w-6" />
              <span className="text-2xl font-semibold">
                {formatPercentage(Math.abs(percentDiff))}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${bgColorClass}`}>
            <span className={`text-sm font-medium ${colorClass}`}>
              {isAverage
                ? "Average"
                : isAboveAverage
                ? `${formatPercentage(percentDiff)} Above National Average`
                : `${formatPercentage(Math.abs(percentDiff))} Below National Average`}
            </span>
          </div>
        </div>

        {/* Visual gauge */}
        <div className="space-y-2">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
              style={{
                width: `${((col - 85) / (115 - 85)) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>85 (Most Affordable)</span>
            <span>115 (Most Expensive)</span>
          </div>
        </div>

        {/* Rank */}
        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4">
          <span className="text-sm text-gray-400">National Ranking</span>
          <span className="text-xl font-bold text-white">
            #{rank}{" "}
            <span className="text-sm font-normal text-gray-400">
              of {totalStates}
            </span>
          </span>
        </div>

        {/* Explanation */}
        <div className="rounded-lg bg-white/5 p-4">
          <p className="text-xs text-gray-400">
            The cost of living index is based on Regional Price Parities from the
            Bureau of Economic Analysis. A value of 100 represents the national
            average. {stateName} has a COL index of {col.toFixed(1)}, meaning
            goods and services cost{" "}
            {isAboveAverage ? (
              <>
                <span className={colorClass}>{formatPercentage(percentDiff)}</span>{" "}
                more
              </>
            ) : (
              <>
                <span className={colorClass}>
                  {formatPercentage(Math.abs(percentDiff))}
                </span>{" "}
                less
              </>
            )}{" "}
            than the national average.
          </p>
        </div>
      </div>
    </div>
  );
}
