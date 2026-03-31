"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TextReveal } from "@/components/animations/text-reveal";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { MagneticButton } from "@/components/animations/magnetic-button";

export function CTASection() {
  return (
    <section className="lux-section relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--lux-accent)]/5 to-transparent pointer-events-none" />

      <div className="relative lux-container">
        <div className="max-w-4xl mx-auto text-center">
          <TextReveal
            tag="h2"
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--text-primary)] mb-6"
          >
            Ready to find your next home?
          </TextReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-[var(--text-secondary)] text-lg mb-10 max-w-xl mx-auto">
              Start comparing cost of living across the US. Free, fast, and
              powered by official government data.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-wrap justify-center gap-4">
              <MagneticButton>
                <Link href="/compare" className="btn-primary group text-base px-10 py-5">
                  Start Comparing
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link href="/#map" className="btn-secondary text-base px-10 py-5">
                  Explore Map
                </Link>
              </MagneticButton>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
