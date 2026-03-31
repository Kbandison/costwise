"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TextReveal } from "@/components/animations/text-reveal";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { MagneticButton } from "@/components/animations/magnetic-button";

export function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
      {/* Subtle gradient overlay for text contrast over 3D */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-grid-white z-[1] opacity-30" />

      <div className="relative z-[2] lux-container w-full">
        {/* Asymmetric layout: content left, 3D scene right (handled by canvas) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Text content - 7 columns for asymmetric feel */}
          <div className="lg:col-span-7 space-y-8">
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <span className="lux-label">Cost of Living Intelligence</span>
            </motion.div>

            {/* Headline */}
            <TextReveal
              tag="h1"
              className="text-[clamp(2.5rem,6vw,5.5rem)] font-bold tracking-[-0.03em] leading-[1.0] text-[var(--text-primary)]"
              delay={1.2}
            >
              {"Know the\ncost before\nyou move"}
            </TextReveal>

            {/* Subheadline */}
            <ScrollReveal y={30} delay={0.2}>
              <p className="max-w-lg text-lg text-[var(--text-secondary)] leading-relaxed">
                Compare cost of living across the United States with real-time
                data from official government sources. Make smarter decisions
                about where to live.
              </p>
            </ScrollReveal>

            {/* CTA Buttons */}
            <ScrollReveal y={20} delay={0.4}>
              <div className="flex flex-wrap gap-4">
                <MagneticButton>
                  <Link
                    href="/#map"
                    className="btn-primary group"
                  >
                    Explore the Map
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link href="/compare" className="btn-secondary">
                    Compare Locations
                  </Link>
                </MagneticButton>
              </div>
            </ScrollReveal>
          </div>

          {/* Right side: empty space for 3D canvas to show through */}
          <div className="hidden lg:block lg:col-span-5" />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2]"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-6 h-6 text-[var(--text-dim)]" />
      </motion.div>
    </section>
  );
}
