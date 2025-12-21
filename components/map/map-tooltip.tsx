/**
 * Enhanced Map Tooltip Component
 * File: components/map/map-tooltip.tsx
 * 
 * Shows detailed COL info on state hover
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MapTooltipProps {
  name: string;
  col: number;
  housing: number;
  goods?: number;
  services?: number;
  rank?: number;
  visible: boolean;
  x: number;
  y: number;
}

export function MapTooltip({
  name,
  col,
  housing,
  goods,
  services,
  rank,
  visible,
  x,
  y,
}: MapTooltipProps) {
  if (!visible) return null;

  // Calculate position (offset to avoid cursor)
  const tooltipX = x + 15;
  const tooltipY = y - 10;

  // Determine if above or below national average
  const getIndicator = (value: number) => {
    if (value > 102) return { icon: TrendingUp, color: 'text-red-400', label: 'Above avg' };
    if (value < 98) return { icon: TrendingDown, color: 'text-green-400', label: 'Below avg' };
    return { icon: Minus, color: 'text-gray-400', label: 'Average' };
  };

  const colIndicator = getIndicator(col);
  const ColIcon = colIndicator.icon;

  return (
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: `${tooltipX}px`,
        top: `${tooltipY}px`,
      }}
    >
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="rounded-xl border border-white/20 bg-black/95 p-4 shadow-2xl backdrop-blur-xl min-w-[280px]">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="font-semibold text-white text-lg">{name}</h3>
              {rank && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Rank #{rank} of 51
                </p>
              )}
            </div>
            <div className={`flex items-center gap-1 ${colIndicator.color}`}>
              <ColIcon className="h-4 w-4" />
            </div>
          </div>

          {/* Overall COL */}
          <div className="mt-3 space-y-2">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-400">Overall Cost</span>
                <span className="text-xl font-bold text-white">{col}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${
                    col > 105
                      ? 'bg-red-500'
                      : col > 100
                      ? 'bg-orange-500'
                      : col > 95
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((col / 150) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                vs. national average (100%)
              </p>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/5">
              <CategoryRow label="Housing" value={housing} />
              {goods !== undefined && <CategoryRow label="Goods" value={goods} />}
              {services !== undefined && <CategoryRow label="Services" value={services} />}
            </div>
          </div>

          {/* Footer hint */}
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-gray-400 text-center">
              Click to view detailed breakdown
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({ label, value }: { label: string; value: number }) {
  const isHigh = value > 102;
  const isLow = value < 98;
  
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span
        className={`font-medium ${
          isHigh ? 'text-red-400' : isLow ? 'text-green-400' : 'text-gray-300'
        }`}
      >
        {value}%
      </span>
    </div>
  );
}