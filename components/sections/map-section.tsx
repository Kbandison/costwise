"use client";

import { USStatesMap } from "@/components/map/us-states-map";
import { MapLegend } from "@/components/map/map-legend";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { TextReveal } from "@/components/animations/text-reveal";

export function MapSection() {
  return (
    <section id="map" className="lux-section">
      <div className="lux-container">
        {/* Asymmetric header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-7">
            <ScrollReveal>
              <span className="lux-label mb-4 block">Interactive Map</span>
            </ScrollReveal>
            <TextReveal
              tag="h2"
              className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)]"
            >
              Explore cost of living by state
            </TextReveal>
          </div>
          <div className="lg:col-span-5 flex items-end">
            <ScrollReveal delay={0.2}>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Click on any state to view a detailed cost breakdown including
                housing, goods, services, and energy prices.
              </p>
            </ScrollReveal>
          </div>
        </div>

        {/* Map container with enhanced styling */}
        <ScrollReveal y={40} duration={1}>
          <div className="relative rounded-2xl border border-[var(--lux-border)] bg-[var(--bg-secondary)] p-4 md:p-8 overflow-hidden">
            {/* Subtle glow behind map */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--lux-accent)]/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <USStatesMap />
            </div>
          </div>
        </ScrollReveal>

        {/* Legend */}
        <ScrollReveal delay={0.3} y={20}>
          <div className="mt-6">
            <MapLegend />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
