"use client";

import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { Counter } from "@/components/animations/counter";

const stats = [
  { target: 51, suffix: "", label: "States & DC Covered" },
  { target: 4, suffix: "", label: "Government Data Sources" },
  { target: 100, suffix: "%", label: "Free to Use" },
  { target: 30000, suffix: "+", label: "ZIP Codes Searchable", prefix: "" },
];

export function StatsSection() {
  return (
    <section className="lux-section border-y border-[var(--lux-border)]">
      <div className="lux-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1} y={40}>
              <div className="text-center">
                <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-2">
                  <Counter
                    target={stat.target}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                    duration={2}
                  />
                </div>
                <p className="text-sm text-[var(--text-secondary)] uppercase tracking-[0.08em]">
                  {stat.label}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
