"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "@/store/use-app-store";
import { lerp } from "@/lib/math";

interface HeroMeshProps {
  scrollProgress: number;
}

export function HeroMesh({ scrollProgress }: HeroMeshProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const targetRotation = useRef({ x: 0, y: 0 });

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.8, 1), []);
  const innerGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.75, 1), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const { mousePosition } = useAppStore.getState();

    // Auto-rotate
    groupRef.current.rotation.y += delta * 0.15;
    groupRef.current.rotation.x += delta * 0.05;

    // Mouse-reactive tilt
    targetRotation.current.x = mousePosition.y * 0.3;
    targetRotation.current.y = mousePosition.x * 0.3;

    groupRef.current.rotation.x = lerp(
      groupRef.current.rotation.x,
      groupRef.current.rotation.x + targetRotation.current.x,
      0.02
    );

    // Scroll-reactive: move down and scale down as user scrolls
    groupRef.current.position.y = lerp(0.5, -3, scrollProgress * 3);
    const scaleBase = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    const scrollScale = Math.max(0.3, 1 - scrollProgress * 2);
    const s = scaleBase * scrollScale;
    groupRef.current.scale.set(s, s, s);

    // Fade opacity based on scroll
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.max(0, 1 - scrollProgress * 4) * (mat.userData.baseOpacity ?? mat.opacity);
      }
    });
  });

  return (
    <group ref={groupRef} position={[1.5, 0.5, 0]}>
      {/* Wireframe shell */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#8B5CF6"
          wireframe
          transparent
          opacity={0.3}
          userData={{ baseOpacity: 0.3 }}
        />
      </mesh>
      {/* Inner solid */}
      <mesh geometry={innerGeometry}>
        <meshStandardMaterial
          color="#8B5CF6"
          transparent
          opacity={0.08}
          roughness={0.2}
          metalness={0.8}
          userData={{ baseOpacity: 0.08 }}
        />
      </mesh>
    </group>
  );
}
