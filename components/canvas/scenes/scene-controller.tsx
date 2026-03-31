"use client";

import { useFrame } from "@react-three/fiber";
import { useAppStore } from "@/store/use-app-store";
import { HeroMesh } from "../objects/hero-mesh";
import { ParticleField } from "../objects/particle-field";

export function SceneController() {
  useFrame(() => {
    // Scene-level orchestration can go here
    // Individual objects read from the store directly
  });

  const scrollProgress = useAppStore((s) => s.scrollProgress);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#8B5CF6" />
      <HeroMesh scrollProgress={scrollProgress} />
      <ParticleField count={800} />
    </>
  );
}
