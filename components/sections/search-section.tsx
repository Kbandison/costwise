"use client";

import { LocationSearch } from "@/components/search/location-search";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { TextReveal } from "@/components/animations/text-reveal";

export function SearchSection() {
  return (
    <section id="search" className="lux-section">
      <div className="lux-container">
        <div className="relative max-w-3xl mx-auto">
          {/* Glow background */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[var(--lux-accent)]/10 via-[var(--lux-accent)]/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />

          <div className="relative rounded-2xl border border-[var(--lux-border)] bg-[var(--bg-secondary)] p-8 md:p-12">
            <div className="text-center mb-8">
              <ScrollReveal>
                <span className="lux-label mb-4 block">Search</span>
              </ScrollReveal>
              <TextReveal
                tag="h2"
                className="text-2xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-3"
              >
                Find any location
              </TextReveal>
              <ScrollReveal delay={0.1}>
                <p className="text-[var(--text-secondary)]">
                  Search by city, metro area, state, or ZIP code
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={0.2} y={20}>
              <LocationSearch />
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
