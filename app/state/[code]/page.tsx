import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  MapPin,
  ArrowRight,
  Home,
  ShoppingBag,
  Briefcase,
} from "lucide-react";
import stateColData from "@/public/data/state-col-data.json";
import type { Metadata } from "next";
import { CostBreakdownTable } from "@/components/cost-breakdown/cost-breakdown-table";
import { SalaryCalculator } from "@/components/calculators/salary-calculator";
import { getEnergyPricesByState } from "@/lib/api/eia";

interface StatePageProps {
  params: Promise<{ code: string }>;
}

export async function generateStaticParams() {
  return Object.keys(stateColData.states).map((code) => ({
    code: code.toLowerCase(),
  }));
}

export async function generateMetadata({
  params,
}: StatePageProps): Promise<Metadata> {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const stateData =
    stateColData.states[upperCode as keyof typeof stateColData.states];

  if (!stateData) {
    return { title: "State Not Found - CostWise" };
  }

  const percentDiff = (stateData.col - 100).toFixed(1);
  const comparison = parseFloat(percentDiff) > 0 ? "above" : "below";

  return {
    title: `${stateData.name} Cost of Living | CostWise`,
    description: `${stateData.name} has a cost of living index of ${stateData.col.toFixed(1)}, which is ${Math.abs(parseFloat(percentDiff))}% ${comparison} the national average.`,
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const stateData =
    stateColData.states[upperCode as keyof typeof stateColData.states];

  if (!stateData) {
    notFound();
  }

  let energyPrices;
  try {
    const result = await getEnergyPricesByState(upperCode);
    energyPrices = result.data;
  } catch {
    energyPrices = null;
  }

  const colDiff = stateData.col - 100;
  const isExpensive = colDiff > 0;

  return (
    <div className="min-h-screen pt-16">
      {/* Hero banner */}
      <section className="relative overflow-hidden border-b border-[var(--lux-border)]">
        {/* Background accent glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--lux-accent)]/5 via-transparent to-transparent pointer-events-none" />

        <div className="lux-container py-12 md:py-20">
          {/* Breadcrumb */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Map
          </Link>

          {/* Asymmetric hero layout - 7/5 grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end">
            {/* Left: State name + big COL number */}
            <div className="lg:col-span-7">
              <span className="lux-label mb-3 block">
                Rank #{stateData.rank} of 51
              </span>
              <h1
                className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.03em] leading-[1.0] text-[var(--text-primary)] mb-4"
                style={{ fontFamily: "var(--font-display-family)" }}
              >
                {stateData.name}
              </h1>
              <p className="text-lg text-[var(--text-secondary)] max-w-lg">
                <span
                  className={`font-semibold ${isExpensive ? "text-red-400" : "text-emerald-400"}`}
                >
                  {Math.abs(colDiff).toFixed(1)}%{" "}
                  {isExpensive ? "more expensive" : "less expensive"}
                </span>{" "}
                than the national average
              </p>
            </div>

            {/* Right: Big index display */}
            <div className="lg:col-span-5 lg:text-right">
              <div
                className="text-8xl md:text-9xl font-bold text-gradient leading-none"
                style={{
                  fontFamily: "var(--font-display-family)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {stateData.col}
              </div>
              <div className="text-sm text-[var(--text-dim)] mt-2">
                Cost of Living Index
              </div>
              <div className="text-xs text-[var(--text-dim)]">
                National avg: 100
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="lux-section">
        <div className="lux-container">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                label: "Housing",
                value: stateData.housing,
                icon: Home,
              },
              {
                label: "Goods",
                value: stateData.goods,
                icon: ShoppingBag,
              },
              {
                label: "Services",
                value: stateData.services,
                icon: Briefcase,
              },
            ].map((item) => {
              const diff = item.value - 100;
              const positive = diff > 0;
              return (
                <div
                  key={item.label}
                  className="group relative p-6 md:p-8 border border-[var(--lux-border)] rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--lux-accent)]/30 transition-all duration-500"
                >
                  <div className="flex items-center justify-between mb-4">
                    <item.icon className="w-5 h-5 text-[var(--lux-accent)]" />
                    <div
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                        positive
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {positive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {positive ? "+" : ""}
                      {diff.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] mb-1">
                    {item.label} Index
                  </div>
                  <div
                    className="text-4xl md:text-5xl font-bold text-[var(--text-primary)]"
                    style={{
                      fontFamily: "var(--font-display-family)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cost Breakdown Table */}
      <section className="lux-section pt-0">
        <div className="lux-container">
          <div className="mb-8">
            <span className="lux-label mb-3 block">Detailed Breakdown</span>
            <h2
              className="text-2xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-display-family)" }}
            >
              Cost categories
            </h2>
          </div>
          <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--bg-secondary)] overflow-hidden">
            <CostBreakdownTable
              col={stateData.col}
              housing={stateData.housing}
              goods={stateData.goods}
              services={stateData.services}
              gasolinePrice={energyPrices?.gasolinePrice}
              gasolineNationalAvg={energyPrices?.gasolineNationalAvg}
            />
          </div>
        </div>
      </section>

      {/* Salary Calculator */}
      <section className="lux-section pt-0">
        <div className="lux-container">
          <div className="mb-8">
            <span className="lux-label mb-3 block">Calculator</span>
            <h2
              className="text-2xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-display-family)" }}
            >
              Salary comparison
            </h2>
          </div>
          <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--bg-secondary)] overflow-hidden">
            <SalaryCalculator
              targetStateName={stateData.name}
              targetStateCOL={stateData.col}
            />
          </div>
        </div>
      </section>

      {/* Counties & Metro Areas */}
      <section className="lux-section pt-0">
        <div className="lux-container">
          <div className="rounded-2xl border border-[var(--lux-border)] bg-[var(--bg-secondary)] p-8 md:p-12">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-full border border-[var(--lux-accent)]/30 bg-[var(--lux-accent)]/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[var(--lux-accent)]" />
              </div>
              <div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-display-family)" }}
                >
                  Counties & Metro Areas
                </h2>
                <p className="text-[var(--text-secondary)] mt-1">
                  Drill down to specific regions in {stateData.name}
                </p>
              </div>
            </div>

            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-[var(--text-dim)] mx-auto mb-4" />
              <h3
                className="text-xl font-semibold text-[var(--text-primary)] mb-2"
                style={{ fontFamily: "var(--font-display-family)" }}
              >
                Interactive County Map Coming Soon
              </h3>
              <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto mb-6">
                Use the search bar to find specific cities, metro areas, or ZIP
                codes within {stateData.name}.
              </p>
              <Link
                href="/#search"
                className="btn-primary group inline-flex"
              >
                Search Locations
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Data attribution */}
      <section className="pb-16">
        <div className="lux-container text-center">
          <p className="text-sm text-[var(--text-dim)]">
            Data sourced from Bureau of Economic Analysis Regional Price
            Parities
          </p>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Last updated: 2024 &middot; National average baseline: 100
          </p>
        </div>
      </section>
    </div>
  );
}

