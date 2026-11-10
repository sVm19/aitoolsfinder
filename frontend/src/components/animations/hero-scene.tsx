"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, Group } from "three";

const PARTICLE_COUNT = 72;

function NetworkField() {
  const groupRef = useRef<Group>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const angle = index * 2.399963;
      const radius = 0.35 + ((index * 37) % 100) / 100;
      positions[index * 3] = Math.cos(angle) * radius * 2.15;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 1.45;
      positions[index * 3 + 2] = Math.sin(index * 1.73) * 0.45;
    }

    const points = new BufferGeometry();
    points.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return points;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.z += delta * 0.012;
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          color="#C4A3FD"
          size={0.045}
          sizeAttenuation
          transparent
          opacity={0.78}
          depthWrite={false}
        />
      </points>
      <mesh rotation={[0.26, 0.18, -0.34]}>
        <torusGeometry args={[1.65, 0.007, 6, 100]} />
        <meshBasicMaterial color="#7022FC" transparent opacity={0.38} />
      </mesh>
      <mesh rotation={[-0.35, 0.12, 0.68]}>
        <torusGeometry args={[1.15, 0.005, 6, 100]} />
        <meshBasicMaterial color="#FD8F32" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={[1, 1.25]}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      aria-hidden="true"
    >
      <NetworkField />
    </Canvas>
  );
}
