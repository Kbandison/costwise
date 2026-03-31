"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "@/store/use-app-store";

interface ParticleFieldProps {
  count?: number;
}

export function ParticleField({ count = 800 }: ParticleFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
      ] as [number, number, number],
      speed: Math.random() * 0.5 + 0.1,
      offset: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const { scrollProgress } = useAppStore.getState();
    const time = state.clock.elapsedTime;
    const spread = 1 + scrollProgress * 0.3;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const x =
        (p.position[0] + Math.sin(time * p.speed + p.offset) * 0.3) * spread;
      const y =
        (p.position[1] + Math.cos(time * p.speed + p.offset) * 0.3) * spread;
      const z = p.position[2] * spread;

      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.012, 6, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.25} />
    </instancedMesh>
  );
}
