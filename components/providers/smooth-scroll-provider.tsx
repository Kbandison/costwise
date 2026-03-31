"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useAppStore } from "@/store/use-app-store";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const setScrollProgress = useAppStore((s) => s.setScrollProgress);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    lenis.on("scroll", ({ progress }: { progress: number }) => {
      setScrollProgress(progress);
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, [setScrollProgress]);

  return <>{children}</>;
}
