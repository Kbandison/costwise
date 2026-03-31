"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { useAppStore } from "@/store/use-app-store";

export function LoadingScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoading = useAppStore((s) => s.isLoading);
  const setIsLoading = useAppStore((s) => s.setIsLoading);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const timeout = setTimeout(() => {
      gsap.to(el, {
        clipPath: "circle(0% at 50% 50%)",
        duration: 1.2,
        ease: "power3.inOut",
        onComplete: () => {
          el.style.display = "none";
          setIsLoading(false);
        },
      });
    }, 800);

    return () => clearTimeout(timeout);
  }, [setIsLoading]);

  if (!isLoading) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[var(--bg-primary)] flex items-center justify-center"
      style={{ clipPath: "circle(100% at 50% 50%)" }}
    >
      <motion.span
        className="font-bold text-2xl tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        COSTWISE
      </motion.span>
    </div>
  );
}
