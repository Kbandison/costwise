"use client";

import {
  Home,
  BarChart3,
  Scale,
  TrendingUp,
  Map,
  Smartphone,
} from "lucide-react";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { TextReveal } from "@/components/animations/text-reveal";
import { ArrowRight } from "lucide-react";

const features = [
  {
    title: "Housing Costs",
    description:
      "Detailed rent and housing price data by bedroom count from HUD Fair Market Rents.",
    icon: Home,
  },
  {
    title: "Category Breakdown",
    description:
      "Food, transportation, healthcare, and utilities costs compared to national average.",
    icon: BarChart3,
  },
  {
    title: "Regional Comparison",
    description:
      "Compare multiple locations side-by-side to make informed decisions.",
    icon: Scale,
  },
  {
    title: "Official Data",
    description:
      "Powered by Bureau of Economic Analysis Regional Price Parities.",
    icon: TrendingUp,
  },
  {
    title: "Metro & County Data",
    description:
      "Drill down to specific metro areas and counties within each state.",
    icon: Map,
  },
  {
    title: "Mobile Friendly",
    description:
      "Fully responsive design optimized for all devices and screen sizes.",
    icon: Smartphone,
  },
];

export function FeaturesSection() {
  return (
    <section className="lux-section">
      <div className="lux-container">
        {/* Asymmetric header - offset left */}
        <div className="max-w-2xl mb-16">
          <ScrollReveal>
            <span className="lux-label mb-4 block">What You Get</span>
          </ScrollReveal>
          <TextReveal
            tag="h2"
            className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4"
          >
            Comprehensive cost of living data at your fingertips
          </TextReveal>
          <ScrollReveal delay={0.2}>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
              Everything you need to understand the true cost of living in any
              US state, metro area, or ZIP code.
            </p>
          </ScrollReveal>
        </div>

        {/* Card grid - asymmetric 7/5 on desktop */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <ScrollReveal
              key={feature.title}
              delay={i * 0.08}
              y={60}
              scale={0.95}
            >
              <div className="group relative p-8 border border-[var(--lux-border)] rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--lux-accent)]/30 transition-all duration-500">
                <span className="text-xs font-mono text-[var(--lux-accent)] mb-4 block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <feature.icon className="w-6 h-6 text-[var(--lux-accent)] mb-4" />
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {feature.description}
                </p>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="w-5 h-5 text-[var(--lux-accent)]" />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
