"use client";

import { Canvas } from "@react-three/fiber";
import { Preload, AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import { Suspense } from "react";
import { SceneController } from "./scenes/scene-controller";

export function PersistentCanvas() {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        style={{ pointerEvents: "none" }}
      >
        <Suspense fallback={null}>
          <SceneController />
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
