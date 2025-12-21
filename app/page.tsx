import Link from "next/link";
import { ArrowRight, MapPin, TrendingUp, DollarSign } from "lucide-react";
import { USStatesMap } from "@/components/map/us-states-map";
import { MapLegend } from "@/components/map/map-legend";
import { LocationSearch } from "@/components/search/location-search";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
              Cost of Living
              <span className="block bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
              Make informed decisions about where to live. Compare cost of living
              across the United States with real-time data from official government
              sources.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/20 p-3">
                  <MapPin className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">50+ States</div>
                  <div className="text-sm text-gray-400">Complete Coverage</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/20 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">Real-Time</div>
                  <div className="text-sm text-gray-400">BEA & Census Data</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/20 p-3">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">Free</div>
                  <div className="text-sm text-gray-400">No Hidden Costs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Section */}
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              Explore Cost of Living by State
            </h2>
            <p className="mt-2 text-gray-400">
              Click on any state to view detailed breakdown
            </p>
          </div>

          {/* Map */}
          <USStatesMap />

          {/* Legend */}
          <MapLegend />
        </div>
      </div>

      {/* Search Section */}
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/40 to-black/60 p-8 backdrop-blur-xl sm:p-12">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Or Search by Location
              </h2>
              <p className="mt-2 text-gray-400">
                Find cost of living for cities, metro areas, or ZIP codes
              </p>
            </div>

            <LocationSearch />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">What You Get</h2>
          <p className="mt-2 text-gray-400">
            Comprehensive cost of living data at your fingertips
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Housing Costs",
              description:
                "Detailed rent and housing price data by bedroom count from HUD Fair Market Rents.",
              icon: "🏠",
            },
            {
              title: "Category Breakdown",
              description:
                "Food, transportation, healthcare, and utilities costs compared to national average.",
              icon: "📊",
            },
            {
              title: "Regional Comparison",
              description:
                "Compare multiple locations side-by-side to make informed decisions.",
              icon: "⚖️",
            },
            {
              title: "Official Data",
              description:
                "Powered by Bureau of Economic Analysis Regional Price Parities.",
              icon: "📈",
            },
            {
              title: "Metro & County Data",
              description:
                "Drill down to specific metro areas and counties within each state.",
              icon: "🗺️",
            },
            {
              title: "Mobile Friendly",
              description:
                "Fully responsive design optimized for all devices and screen sizes.",
              icon: "📱",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-white/10"
            >
              <div className="text-4xl">{feature.icon}</div>
              <h3 className="mt-4 text-xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass-card overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-900/40 to-pink-900/20 backdrop-blur-xl">
          <div className="px-6 py-12 sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to compare?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-300">
                Start exploring cost of living data to find the perfect place for
                your budget and lifestyle.
              </p>
            </div>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-all hover:from-purple-600 hover:to-pink-700 hover:shadow-purple-500/25"
              >
                Compare Locations
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p className="text-sm">
              Data sourced from Bureau of Economic Analysis, U.S. Census Bureau,
              and HUD.
            </p>
            <p className="mt-2 text-xs">
              © {new Date().getFullYear()} CostWise. Cost of living data for
              informational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
