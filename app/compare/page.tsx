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
    <div className="min-h-screen pt-16">
      {/* Header */}
      <section className="border-b border-[var(--lux-border)]">
        <div className="lux-container py-12 md:py-20">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>

          <div className="flex items-end justify-between">
            <div>
              <span className="lux-label mb-3 block">Side-by-side</span>
              <h1
                className="text-4xl md:text-6xl font-bold tracking-tight text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-display-family)" }}
              >
                Compare Locations
              </h1>
            </div>
            {locations.length > 0 && (
              <button
                onClick={() => setLocations([])}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="lux-container py-12">
        {/* Location Selection */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <div
              key={location.code}
              className="relative p-6 border border-[var(--lux-border)] rounded-2xl bg-[var(--bg-secondary)]"
            >
              <button
                onClick={() => removeLocation(location.code)}
                className="absolute right-3 top-3 rounded-lg bg-red-500/10 p-1.5 text-red-400 transition-colors hover:bg-red-500/20"
              >
                <X className="h-4 w-4" />
              </button>
              <h3
                className="text-lg font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-display-family)" }}
              >
                {location.data.name}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                COL Index: {location.data.col.toFixed(1)}
              </p>
            </div>
          ))}

          {locations.length < 3 && (
            <button
              onClick={() => setShowSearch(true)}
              className="flex min-h-[100px] items-center justify-center rounded-2xl border border-dashed border-[var(--lux-border)] bg-[var(--bg-secondary)] transition-all hover:border-[var(--lux-accent)]/50"
            >
              <div className="text-center">
                <Plus className="mx-auto h-8 w-8 text-[var(--text-dim)]" />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Add Location
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Search Modal */}
        {showSearch && (
          <div className="mb-8 rounded-2xl border border-[var(--lux-border)] bg-[var(--bg-secondary)] p-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a state..."
                className="w-full rounded-xl border border-[var(--lux-border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:border-[var(--lux-accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--lux-accent)]/20"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                    className="w-full rounded-xl border border-[var(--lux-border)] bg-[var(--bg-primary)] p-3 text-left transition-all hover:border-[var(--lux-accent)]/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[var(--text-primary)]">
                        {data.name}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
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
            <div className="overflow-hidden rounded-2xl border border-[var(--lux-border)] bg-[var(--bg-secondary)]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--lux-border)]">
                      <th className="px-6 py-4 text-left text-sm font-medium text-[var(--text-secondary)]">
                        Metric
                      </th>
                      {locations.map((location) => (
                        <th
                          key={location.code}
                          className="px-6 py-4 text-center text-sm font-medium text-[var(--text-primary)]"
                          style={{ fontFamily: "var(--font-display-family)" }}
                        >
                          {location.data.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--lux-border)]">
                    {[
                      { label: "Overall COL", key: "col" as const, icon: TrendingUp },
                      { label: "Housing", key: "housing" as const, icon: Home },
                      { label: "Goods", key: "goods" as const, icon: ShoppingCart },
                      { label: "Services", key: "services" as const, icon: Briefcase },
                      { label: "Rank", key: "rank" as const, icon: null },
                    ].map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <tr key={metric.key} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {Icon && (
                                <Icon className="h-4 w-4 text-[var(--text-dim)]" />
                              )}
                              <span className="text-sm font-medium text-[var(--text-secondary)]">
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
                                      isRank
                                        ? "text-[var(--text-primary)]"
                                        : colorClass
                                    }`}
                                    style={{
                                      fontFamily: "var(--font-display-family)",
                                      fontVariantNumeric: "tabular-nums",
                                    }}
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
              <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--bg-secondary)] p-6 md:p-8">
                <h2
                  className="mb-6 text-2xl font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-display-family)" }}
                >
                  Cost Difference
                </h2>
                <div className="space-y-3">
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
                        className="flex items-center justify-between rounded-xl border border-[var(--lux-border)] bg-[var(--bg-primary)] p-4"
                      >
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                          {metric.label}
                        </span>
                        <div
                          className={`flex items-center gap-2 ${
                            isHigher ? "text-red-400" : "text-emerald-400"
                          }`}
                        >
                          {isHigher ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span
                            className="font-semibold"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {isHigher ? "+" : ""}
                            {diff.toFixed(1)} (
                            {formatPercentage(Math.abs(percentDiff))})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-xl bg-[var(--lux-accent)]/10 border border-[var(--lux-accent)]/20 p-4">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {locations[1].data.name} is{" "}
                    <span
                      className={
                        locations[1].data.col > locations[0].data.col
                          ? "font-semibold text-red-400"
                          : "font-semibold text-emerald-400"
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
          <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--bg-secondary)] p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-[var(--text-dim)]" />
            </div>
            <h3
              className="text-xl font-semibold text-[var(--text-primary)] mb-2"
              style={{ fontFamily: "var(--font-display-family)" }}
            >
              Add at least 2 locations to compare
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Click the &ldquo;Add Location&rdquo; button to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
