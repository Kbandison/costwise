"use client";

import { Search, MapPin, BarChart3, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { TextReveal } from "@/components/animations/text-reveal";

const steps = [
  {
    icon: Search,
    title: "Search or Explore",
    description:
      "Use the interactive map or search bar to find any US location — states, metros, counties, or ZIP codes.",
  },
  {
    icon: MapPin,
    title: "View the Breakdown",
    description:
      "Get a detailed cost breakdown including housing, goods, services, energy prices, and more.",
  },
  {
    icon: BarChart3,
    title: "Compare & Decide",
    description:
      "Compare up to 3 locations side-by-side to understand the real cost difference before you move.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="lux-section">
      <div className="lux-container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <ScrollReveal>
            <span className="lux-label mb-4 block">How It Works</span>
          </ScrollReveal>
          <TextReveal
            tag="h2"
            className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4"
          >
            Three steps to smarter decisions
          </TextReveal>
        </div>

        {/* Steps - horizontal on desktop */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-4">
          {steps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 0.15} y={50}>
              <div className="relative flex flex-col items-center text-center">
                {/* Step number */}
                <div className="w-16 h-16 rounded-full border border-[var(--lux-accent)]/30 bg-[var(--lux-accent)]/10 flex items-center justify-center mb-6">
                  <step.icon className="w-7 h-7 text-[var(--lux-accent)]" />
                </div>

                {/* Connector arrow (between items) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+3rem)] w-[calc(100%-6rem)]">
                    <div className="h-px bg-gradient-to-r from-[var(--lux-accent)]/30 to-transparent" />
                  </div>
                )}

                <span className="text-xs font-mono text-[var(--lux-accent)] mb-2">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
