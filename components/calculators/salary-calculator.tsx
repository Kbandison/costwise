"use client";

import { useState, useMemo } from "react";
import { DollarSign, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import stateColData from "@/public/data/state-col-data.json";

interface SalaryCalculatorProps {
  targetStateName: string;
  targetStateCOL: number;
}

export function SalaryCalculator({
  targetStateName,
  targetStateCOL,
}: SalaryCalculatorProps) {
  const [salary, setSalary] = useState<string>("75000");
  const [currentState, setCurrentState] = useState<string>("national");

  // Get list of states for dropdown
  const stateOptions = useMemo(() => {
    const states = Object.entries(stateColData.states).map(([code, data]) => ({
      code,
      name: data.name,
      col: data.col,
    }));
    return [
      { code: "national", name: "National Average", col: 100 },
      ...states.sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, []);

  // Get current state COL
  const currentStateCOL = useMemo(() => {
    if (currentState === "national") return 100;
    const state = stateOptions.find((s) => s.code === currentState);
    return state?.col || 100;
  }, [currentState, stateOptions]);

  // Calculate equivalent salary
  const calculations = useMemo(() => {
    const inputSalary = parseFloat(salary.replace(/,/g, "")) || 0;
    const equivalentSalary = (inputSalary * targetStateCOL) / currentStateCOL;
    const difference = equivalentSalary - inputSalary;
    const percentDiff = inputSalary > 0 ? (difference / inputSalary) * 100 : 0;

    return {
      inputSalary,
      equivalentSalary,
      difference,
      percentDiff,
    };
  }, [salary, currentStateCOL, targetStateCOL]);

  // Format number as currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle salary input
  const handleSalaryChange = (value: string) => {
    // Remove non-numeric characters except for decimals
    const numericValue = value.replace(/[^0-9]/g, "");
    setSalary(numericValue);
  };

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/30 to-black/50 p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-purple-500/20 p-2">
          <DollarSign className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Salary Calculator</h2>
          <p className="text-xs text-gray-400">Compare purchasing power</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Current Salary Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Current Salary
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={calculations.inputSalary > 0 ? calculations.inputSalary.toLocaleString() : ""}
              onChange={(e) => handleSalaryChange(e.target.value)}
              placeholder="75,000"
              className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-12 pr-4 text-white placeholder-gray-500 backdrop-blur-xl transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Annual salary before taxes</p>
        </div>

        {/* Current State Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Current Location
          </label>
          <select
            value={currentState}
            onChange={(e) => setCurrentState(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 py-3 px-4 text-white backdrop-blur-xl transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            {stateOptions.map((state) => (
              <option key={state.code} value={state.code} className="bg-black">
                {state.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            COL: {currentStateCOL.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Calculation Display */}
      {calculations.inputSalary > 0 && (
        <div className="space-y-4">
          {/* Visual Comparison */}
          <div className="grid md:grid-cols-3 gap-3 items-center">
            {/* Current Salary */}
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-xs text-gray-400 mb-1">
                {currentState === "national" ? "National Avg" : stateOptions.find(s => s.code === currentState)?.name}
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(calculations.inputSalary)}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-purple-400" />
            </div>

            {/* Equivalent Salary */}
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="text-xs text-gray-400 mb-1">{targetStateName}</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(calculations.equivalentSalary)}
              </div>
            </div>
          </div>

          {/* Difference Explanation */}
          <div className="text-center">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                calculations.difference > 0
                  ? "bg-red-500/20 text-red-300"
                  : calculations.difference < 0
                  ? "bg-green-500/20 text-green-300"
                  : "bg-gray-500/20 text-gray-300"
              }`}
            >
              {calculations.difference > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : calculations.difference < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              <span className="font-medium">
                {calculations.difference > 0
                  ? `Need ${formatCurrency(Math.abs(calculations.difference))} more (${calculations.percentDiff.toFixed(1)}% increase)`
                  : calculations.difference < 0
                  ? `Need ${formatCurrency(Math.abs(calculations.difference))} less (${Math.abs(calculations.percentDiff).toFixed(1)}% decrease)`
                  : "Same purchasing power"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
