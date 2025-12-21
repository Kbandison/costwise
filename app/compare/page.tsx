"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Home,
  ShoppingCart,
  Briefcase,
} from "lucide-react";
import {
  formatCurrency,
  formatPercentage,
  calculatePercentageDiff,
  getColorForCOL,
  getStateName,
} from "@/lib/utils";
import stateColData from "@/public/data/state-col-data.json";

interface StateData {
  name: string;
  col: number;
  housing: number;
  goods: number;
  services: number;
  rank: number;
}

interface ComparisonLocation {
  code: string;
  data: StateData;
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<ComparisonLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Load initial locations from URL
  useEffect(() => {
    const locationParam = searchParams.get("locations");
    if (locationParam) {
      const codes = locationParam.split(",").filter(Boolean);
      const validLocations: ComparisonLocation[] = codes
        .map((code) => {
          const upperCode = code.toUpperCase();
          const data =
            stateColData.states[upperCode as keyof typeof stateColData.states];
          return data ? { code: upperCode, data } : null;
        })
        .filter((loc): loc is ComparisonLocation => loc !== null);

      setLocations(validLocations);
    }
  }, [searchParams]);

  // Add location
  const addLocation = (code: string) => {
    const upperCode = code.toUpperCase();
    const data = stateColData.states[upperCode as keyof typeof stateColData.states];

    if (data && !locations.find((loc) => loc.code === upperCode)) {
      setLocations([...locations, { code: upperCode, data }]);
      setSearchQuery("");
      setShowSearch(false);

      // Update URL
      const newCodes = [...locations.map((l) => l.code), upperCode].join(",");
      window.history.replaceState(null, "", `/compare?locations=${newCodes}`);
    }
  };

  // Remove location
  const removeLocation = (code: string) => {
    const newLocations = locations.filter((loc) => loc.code !== code);
    setLocations(newLocations);

    // Update URL
    const newCodes = newLocations.map((l) => l.code).join(",");
    window.history.replaceState(
      null,
      "",
      newCodes ? `/compare?locations=${newCodes}` : "/compare"
    );
  };

  // Search states
  const searchResults = searchQuery
    ? Object.entries(stateColData.states)
        .filter(
          ([code, data]) =>
            data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            code.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(([code]) => !locations.find((loc) => loc.code === code))
        .slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-black">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            {locations.length > 0 && (
              <button
                onClick={() => setLocations([])}
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Compare Locations
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Side-by-side cost of living comparison
          </p>
        </div>

        {/* Location Selection */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <div
              key={location.code}
              className="glass-card relative rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
            >
              <button
                onClick={() => removeLocation(location.code)}
                className="absolute right-2 top-2 rounded-lg bg-red-500/20 p-1.5 text-red-400 transition-colors hover:bg-red-500/30"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-semibold text-white">
                {location.data.name}
              </h3>
              <p className="text-sm text-gray-400">
                COL: {location.data.col.toFixed(1)}
              </p>
            </div>
          ))}

          {/* Add Location Button */}
          {locations.length < 3 && (
            <button
              onClick={() => setShowSearch(true)}
              className="glass-card flex min-h-[100px] items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-white/10"
            >
              <div className="text-center">
                <Plus className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-400">Add Location</p>
              </div>
            </button>
          )}
        </div>

        {/* Search Modal */}
        {showSearch && (
          <div className="mb-8 glass-card rounded-xl border border-white/10 bg-black/60 p-6 backdrop-blur-xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a state..."
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map(([code, data]) => (
                  <button
                    key={code}
                    onClick={() => addLocation(code)}
                    className="w-full rounded-lg border border-white/5 bg-white/5 p-3 text-left transition-colors hover:border-purple-500/30 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{data.name}</span>
                      <span className="text-sm text-gray-400">
                        COL: {data.col.toFixed(1)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comparison Table */}
        {locations.length >= 2 ? (
          <div className="space-y-8">
            {/* Overall Summary */}
            <div className="glass-card overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/20 to-black/40 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                        Metric
                      </th>
                      {locations.map((location) => (
                        <th
                          key={location.code}
                          className="px-6 py-4 text-center text-sm font-medium text-white"
                        >
                          {location.data.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { label: "Overall COL", key: "col" as const, icon: TrendingUp },
                      { label: "Housing", key: "housing" as const, icon: Home },
                      { label: "Goods", key: "goods" as const, icon: ShoppingCart },
                      { label: "Services", key: "services" as const, icon: Briefcase },
                      { label: "Rank", key: "rank" as const, icon: null },
                    ].map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <tr key={metric.key} className="hover:bg-white/5">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="h-4 w-4 text-gray-400" />}
                              <span className="text-sm font-medium text-gray-300">
                                {metric.label}
                              </span>
                            </div>
                          </td>
                          {locations.map((location) => {
                            const value = location.data[metric.key];
                            const isRank = metric.key === "rank";
                            const diff = !isRank
                              ? calculatePercentageDiff(value)
                              : 0;
                            const colorClass = !isRank
                              ? getColorForCOL(value)
                              : "";

                            return (
                              <td
                                key={location.code}
                                className="px-6 py-4 text-center"
                              >
                                <div className="space-y-1">
                                  <div
                                    className={`text-lg font-semibold ${
                                      isRank ? "text-white" : colorClass
                                    }`}
                                  >
                                    {isRank ? `#${value}` : value.toFixed(1)}
                                  </div>
                                  {!isRank && (
                                    <div
                                      className={`flex items-center justify-center gap-1 text-xs ${colorClass}`}
                                    >
                                      {diff > 0 ? (
                                        <TrendingUp className="h-3 w-3" />
                                      ) : (
                                        <TrendingDown className="h-3 w-3" />
                                      )}
                                      <span>
                                        {formatPercentage(Math.abs(diff))}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Difference Analysis */}
            {locations.length === 2 && (
              <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/20 to-black/40 p-6 backdrop-blur-xl">
                <h2 className="mb-6 text-2xl font-bold text-white">
                  Cost Difference
                </h2>
                <div className="space-y-4">
                  {[
                    { label: "Overall COL", key: "col" as const },
                    { label: "Housing", key: "housing" as const },
                    { label: "Goods", key: "goods" as const },
                    { label: "Services", key: "services" as const },
                  ].map((metric) => {
                    const diff =
                      locations[1].data[metric.key] -
                      locations[0].data[metric.key];
                    const percentDiff =
                      (diff / locations[0].data[metric.key]) * 100;
                    const isHigher = diff > 0;

                    return (
                      <div
                        key={metric.key}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4"
                      >
                        <span className="text-sm font-medium text-gray-300">
                          {metric.label}
                        </span>
                        <div
                          className={`flex items-center gap-2 ${
                            isHigher ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {isHigher ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-semibold">
                            {isHigher ? "+" : ""}
                            {diff.toFixed(1)} ({formatPercentage(Math.abs(percentDiff))})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-lg bg-purple-500/10 p-4">
                  <p className="text-sm text-gray-300">
                    {locations[1].data.name} is{" "}
                    <span
                      className={
                        locations[1].data.col > locations[0].data.col
                          ? "font-semibold text-red-400"
                          : "font-semibold text-green-400"
                      }
                    >
                      {Math.abs(
                        ((locations[1].data.col - locations[0].data.col) /
                          locations[0].data.col) *
                          100
                      ).toFixed(1)}
                      %{" "}
                      {locations[1].data.col > locations[0].data.col
                        ? "more expensive"
                        : "more affordable"}
                    </span>{" "}
                    than {locations[0].data.name}.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
            <TrendingUp className="mx-auto h-16 w-16 text-gray-600" />
            <h3 className="mt-4 text-xl font-semibold text-gray-400">
              Add at least 2 locations to compare
            </h3>
            <p className="mt-2 text-gray-500">
              Click the "Add Location" button to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
