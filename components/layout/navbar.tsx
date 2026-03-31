"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = [
  { label: "Explore", href: "/#map" },
  { label: "Compare", href: "/compare" },
  { label: "Search", href: "/#search" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav
        className="fixed top-0 left-0 w-full z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? "rgba(10,10,10,0.8)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
        }}
      >
        <div className="mx-auto flex h-16 max-w-[80rem] items-center justify-between px-6 md:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-[var(--text-primary)]"
          >
            COSTWISE
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--lux-accent)] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <Link
            href="/#search"
            className="hidden md:inline-flex h-9 items-center rounded-lg border border-[var(--lux-border)] px-4 text-sm text-[var(--text-secondary)] transition-all duration-300 hover:border-[var(--lux-accent)] hover:bg-[var(--lux-accent)] hover:text-white"
          >
            Get Started
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-[var(--text-primary)]"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[var(--bg-primary)] flex flex-col"
          >
            {/* Close Button */}
            <div className="flex h-16 items-center justify-end px-6">
              <button
                onClick={closeMobile}
                className="text-[var(--text-primary)]"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Mobile Links */}
            <div className="flex flex-1 flex-col items-center justify-center gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
                  className="text-3xl font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--lux-accent)]"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="/#search"
                onClick={closeMobile}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: navLinks.length * 0.08,
                  duration: 0.4,
                  ease: "easeOut",
                }}
                className="mt-4 inline-flex h-12 items-center rounded-lg border border-[var(--lux-accent)] px-8 text-lg font-bold text-[var(--lux-accent)] transition-all duration-300 hover:bg-[var(--lux-accent)] hover:text-white"
              >
                Get Started
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
