"use client";

import dynamic from "next/dynamic";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { CustomCursor } from "@/components/animations/custom-cursor";
import { LoadingScreen } from "@/components/animations/loading-screen";
import { useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";

// Dynamically import 3D canvas to avoid SSR issues
const PersistentCanvas = dynamic(
  () =>
    import("@/components/canvas/persistent-canvas").then(
      (mod) => mod.PersistentCanvas
    ),
  { ssr: false }
);

function MouseTracker() {
  const setMousePosition = useAppStore((s) => s.setMousePosition);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePosition(x, y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [setMousePosition]);

  return null;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScrollProvider>
      <LoadingScreen />
      <CustomCursor />
      <MouseTracker />
      <PersistentCanvas />
      {children}
    </SmoothScrollProvider>
  );
}
