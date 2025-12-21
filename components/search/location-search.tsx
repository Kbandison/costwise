"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { debounce } from "@/lib/utils";
import type { LocationSearchResult, LocationType } from "@/types";

const RECENT_SEARCHES_KEY = "costwise_recent_searches";
const MAX_RECENT_SEARCHES = 5;

interface SearchState {
  query: string;
  results: LocationSearchResult[];
  loading: boolean;
  error: string | null;
  showDropdown: boolean;
  selectedIndex: number;
}

export function LocationSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<SearchState>({
    query: "",
    results: [],
    loading: false,
    error: null,
    showDropdown: false,
    selectedIndex: -1,
  });

  const [recentSearches, setRecentSearches] = useState<LocationSearchResult[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load recent searches:", err);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (location: LocationSearchResult) => {
    try {
      const updated = [
        location,
        ...recentSearches.filter((s) => s.id !== location.id),
      ].slice(0, MAX_RECENT_SEARCHES);

      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save recent search:", err);
    }
  };

  // Search locations
  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setState((prev) => ({ ...prev, results: [], showDropdown: false }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/location/search?q=${encodeURIComponent(query)}&limit=10`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          results: data.data,
          loading: false,
          showDropdown: true,
          selectedIndex: -1,
        }));
      } else {
        throw new Error(data.error?.message || "Search failed");
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Search failed",
        results: [],
      }));
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce<(query: string) => Promise<void>>(
      (query: string) => searchLocations(query),
      300
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Handle input change
  const handleInputChange = (value: string) => {
    setState((prev) => ({ ...prev, query: value }));
    debouncedSearch(value);
  };

  // Handle location select
  const handleSelectLocation = (location: LocationSearchResult) => {
    saveRecentSearch(location);
    setState((prev) => ({ ...prev, query: "", showDropdown: false }));

    // Navigate based on type
    if (location.type === "state") {
      router.push(`/state/${location.stateCode?.toLowerCase()}`);
    } else {
      // For metros, counties, and ZIPs, we'll navigate to a location detail page
      router.push(`/location/${location.id}`);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const { results, selectedIndex, showDropdown } = state;

    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.min(selectedIndex + 1, results.length - 1),
        }));
        break;
      case "ArrowUp":
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.max(selectedIndex - 1, -1),
        }));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectLocation(results[selectedIndex]);
        }
        break;
      case "Escape":
        setState((prev) => ({ ...prev, showDropdown: false }));
        inputRef.current?.blur();
        break;
    }
  };

  // Handle clear
  const handleClear = () => {
    setState((prev) => ({
      ...prev,
      query: "",
      results: [],
      showDropdown: false,
      selectedIndex: -1,
    }));
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setState((prev) => ({ ...prev, showDropdown: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get type badge color
  const getTypeBadgeColor = (type: LocationType) => {
    switch (type) {
      case "state":
        return "bg-purple-500/20 text-purple-300";
      case "metro":
        return "bg-blue-500/20 text-blue-300";
      case "county":
        return "bg-green-500/20 text-green-300";
      case "zip":
        return "bg-orange-500/20 text-orange-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const displayResults = state.query.length >= 2 ? state.results : recentSearches;
  const showRecentLabel = state.query.length < 2 && recentSearches.length > 0;

  return (
    <div className="relative w-full">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={state.query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() =>
            setState((prev) => ({
              ...prev,
              showDropdown: prev.query.length >= 2 || recentSearches.length > 0,
            }))
          }
          placeholder="Search by state, city, metro area, or ZIP code..."
          className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-12 pr-12 text-white placeholder-gray-500 backdrop-blur-xl transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />

        {/* Loading or Clear button */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {state.loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : state.query ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {state.showDropdown && displayResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[100] mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl"
        >
          {showRecentLabel && (
            <div className="border-b border-white/5 px-4 py-2">
              <span className="text-xs font-medium text-gray-400">
                Recent Searches
              </span>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {displayResults.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelectLocation(result)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  index === state.selectedIndex
                    ? "bg-purple-500/20"
                    : "hover:bg-white/5"
                }`}
              >
                <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />

                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm text-white">
                      {result.name}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${getTypeBadgeColor(
                        result.type
                      )}`}
                    >
                      {result.type}
                    </span>
                  </div>
                  {result.stateCode && (
                    <div className="text-xs text-gray-400">{result.stateCode}</div>
                  )}
                </div>

                {result.population && (
                  <div className="text-xs text-gray-500">
                    Pop: {result.population.toLocaleString()}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {state.error && (
        <div className="mt-2 text-sm text-red-400">{state.error}</div>
      )}
    </div>
  );
}
