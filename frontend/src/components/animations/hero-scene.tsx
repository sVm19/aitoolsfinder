"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Object3D,
  Points,
} from "three";
import { heroMotion } from "./hero-motion";

const PARTICLE_COUNT = 90;

const AURORA_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const AURORA_FRAG = `
precision highp float;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;

void main() {
  vec2 p = vUv - 0.5;
  float t = uTime * 0.12;
  float w1 = sin(p.x * 6.0 + t) * 0.08 + cos(p.x * 3.0 - t * 1.3) * 0.05;
  float w2 = sin(p.x * 4.0 - t * 0.7) * 0.1;
  float b1 = exp(-pow((p.y - w1) / 0.11, 2.0));
  float b2 = exp(-pow((p.y - 0.14 - w2) / 0.15, 2.0));
  float b3 = exp(-pow((p.y + 0.2 + w1) / 0.18, 2.0));
  vec3 col = uColorA * b1 + mix(uColorA, uColorB, 0.7) * b2 + uColorB * b3;
  float fade = smoothstep(0.62, 0.02, abs(p.y)) * smoothstep(0.72, 0.05, abs(p.x));
  float alpha = clamp((b1 * 0.85 + b2 * 0.7 + b3 * 0.55) * fade, 0.0, 0.82);
  gl_FragColor = vec4(col, alpha);
}
`;

function AuroraField() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new Color("#5c24c9") },
      uColorB: { value: new Color("#e08a3a") },
    }),
    [],
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={[0.8, 0.1, -3.4]} scale={[16, 9, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={AURORA_VERT}
        fragmentShader={AURORA_FRAG}
      />
    </mesh>
  );
}

function Constellation() {
  const groupRef = useRef<Group>(null);
  const pointsRef = useRef<Points>(null);
  const shardsRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const angle = index * 2.399963;
      const radius = 1.15 + ((index * 17) % 90) / 70;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.62;
      positions[index * 3 + 2] = Math.sin(index * 1.37) * 0.55;
    }
    const points = new BufferGeometry();
    points.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return points;
  }, []);

  useEffect(() => {
    const mesh = shardsRef.current;
    if (!mesh) return;
    for (let index = 0; index < 16; index += 1) {
      const angle = index * 0.55 + 0.4;
      const radius = 1.7 + (index % 4) * 0.18;
      dummy.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 1.3) * 0.85,
        Math.sin(index) * 0.45,
      );
      dummy.rotation.set(index * 0.2, index * 0.35, 0);
      dummy.scale.setScalar(0.045 + (index % 3) * 0.012);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      heroMotion.pointerX = event.clientX / window.innerWidth - 0.5;
      heroMotion.pointerY = event.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const targetX = 1.45 + heroMotion.pointerX * 0.55;
    const targetY = heroMotion.pointerY * -0.35;
    group.position.x += (targetX - group.position.x) * 0.05;
    group.position.y += (targetY - group.position.y) * 0.05;
    group.rotation.y += delta * 0.18;
    group.rotation.x += (heroMotion.progress * 0.9 - group.rotation.x) * 0.05;
    group.rotation.z = heroMotion.pointerX * 0.12;

    const points = pointsRef.current;
    if (points) {
      points.rotation.z += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[1.45, 0, 0]}>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          color="#d7c4ff"
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
      <mesh>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshBasicMaterial color="#c4a3fd" wireframe transparent opacity={0.55} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.62, 0]} />
        <meshBasicMaterial color="#fd8f32" wireframe transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[1.15, 0.2, 0.15]}>
        <torusGeometry args={[1.72, 0.008, 8, 120]} />
        <meshBasicMaterial color="#7022fc" transparent opacity={0.45} />
      </mesh>
      <mesh rotation={[-0.4, 0.6, 0.9]}>
        <torusGeometry args={[1.28, 0.006, 8, 100]} />
        <meshBasicMaterial color="#fd8f32" transparent opacity={0.35} />
      </mesh>
      <instancedMesh ref={shardsRef} args={[undefined, undefined, 16] as never}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#f7f5fa" transparent opacity={0.55} />
      </instancedMesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.2], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <AuroraField />
      <Constellation />
    </Canvas>
  );
}
