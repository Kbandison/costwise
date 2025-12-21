"use client";

export function MapLegend() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Color gradient bar */}
      <div className="flex w-full max-w-md flex-col gap-2">
        <div className="relative h-3 w-full overflow-hidden rounded-full">
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(to right, #22c55e 0%, #84cc16 20%, #eab308 40%, #f59e0b 60%, #f97316 80%, #ef4444 100%)",
            }}
          />
        </div>

        {/* Range labels */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>85</span>
          <span>95</span>
          <span>105</span>
          <span>115</span>
        </div>
      </div>

      {/* Text labels */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-gray-300">Below Average</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="text-gray-300">Average</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-gray-300">Above Average</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-center text-xs text-gray-500">
        Click any state to view detailed cost of living breakdown
      </p>
    </div>
  );
}
