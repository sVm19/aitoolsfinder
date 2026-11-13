"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Points,
  AdditiveBlending,
  DoubleSide,
  Mesh,
} from "three";
import { heroMotion } from "./hero-motion";

/* ── Deep Space Nebula / Aurora Background ────────────────────────────── */

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

/* ── Accretion Disk Shader ────────────────────────────────────────── */

const DISK_VERT = `
varying vec2 vUv;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const DISK_FRAG = `
precision highp float;
uniform float uTime;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0; // 0.0 at center, 1.0 at outer edge
  float angle = atan(p.y, p.x);

  // Radial bounds: discard inner hole and soft fade on outer rim
  if (r < 0.42 || r > 0.99) discard;

  // Swirl & turbulence simulation
  float swirl1 = sin(angle * 5.0 - r * 14.0 + uTime * 2.8);
  float swirl2 = cos(angle * 9.0 + r * 18.0 - uTime * 3.6);
  float noise = swirl1 * 0.18 + swirl2 * 0.12;

  // Relativistic Doppler beaming (approaching side is brighter)
  float beaming = 0.7 + 0.35 * cos(angle + 0.4);

  // Distance from inner horizon: peak intensity near innermost stable orbit
  float edgeIntensity = smoothstep(0.42, 0.52, r) * (1.0 - smoothstep(0.72, 0.99, r));

  // Color temperature gradient:
  // Inner: blinding white / fiery sunrise orange (#FD8F32)
  // Outer: luminous deep lavender (#823CFC) & violet (#C4A3FD)
  vec3 hotOrange = vec3(0.99, 0.56, 0.20);
  vec3 coreWhite = vec3(1.0, 0.95, 0.90);
  vec3 electricLavender = vec3(0.51, 0.24, 0.99);
  vec3 softViolet = vec3(0.77, 0.64, 0.99);

  vec3 color = mix(coreWhite, hotOrange, smoothstep(0.42, 0.60, r));
  color = mix(color, electricLavender, smoothstep(0.58, 0.85, r));
  color = mix(color, softViolet, smoothstep(0.80, 0.98, r));

  float alpha = clamp((edgeIntensity + noise * 0.25) * beaming * 0.95, 0.0, 1.0);
  gl_FragColor = vec4(color * (1.2 + noise * 0.3), alpha);
}
`;

/* ── Gravitational Lensing Halo Shader ────────────────────────────── */

const HALO_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const HALO_FRAG = `
precision highp float;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;

  // Thin, intensely luminous ring curved by gravitational light deflection
  if (r < 0.65 || r > 0.98) discard;

  float ringGlow = smoothstep(0.68, 0.78, r) * (1.0 - smoothstep(0.78, 0.96, r));
  float pulse = 0.85 + 0.15 * sin(uTime * 2.0);

  // Gradient from intense orange to soft lavender
  vec3 colA = vec3(0.99, 0.56, 0.20); // Sunrise Orange
  vec3 colB = vec3(0.77, 0.64, 0.99); // Lavender
  vec3 col = mix(colA, colB, 0.5 + 0.5 * sin(p.y * 6.0 + uTime));

  gl_FragColor = vec4(col * 1.5, ringGlow * pulse * 0.85);
}
`;

/* ── Particle Swirl (Relativistic Gas Stream) ───────────────────────── */

const PARTICLE_COUNT = 900;

function createAccretionParticles() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const speeds = new Float32Array(PARTICLE_COUNT);
  const radii = new Float32Array(PARTICLE_COUNT);
  const angles = new Float32Array(PARTICLE_COUNT);

  const orange = new Color("#FD8F32");
  const lavender = new Color("#C4A3FD");
  const white = new Color("#FFFFFF");

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Distance distributed from inner to outer disk
    const r = 1.15 + Math.pow(Math.random(), 1.6) * 1.8;
    const theta = Math.random() * Math.PI * 2;
    radii[i] = r;
    angles[i] = theta;

    // Keplerian orbital speed (faster near event horizon)
    speeds[i] = (1.4 / Math.sqrt(r)) * (0.8 + Math.random() * 0.4);

    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.08 * (r * 0.8); // slight disk thickness
    positions[i * 3 + 2] = Math.sin(theta) * r;

    // Inner particles are white/orange, outer particles are lavender
    const t = (r - 1.15) / 1.8;
    const pColor = t < 0.35 ? white.clone().lerp(orange, t / 0.35) : orange.clone().lerp(lavender, (t - 0.35) / 0.65);
    colors[i * 3] = pColor.r;
    colors[i * 3 + 1] = pColor.g;
    colors[i * 3 + 2] = pColor.b;
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new Float32BufferAttribute(colors, 3));

  return { geo, radii, angles, speeds };
}

/* ── Black Hole Main Component ────────────────────────────────────── */

function BlackHole() {
  const groupRef = useRef<Group>(null);
  const diskMeshRef = useRef<Mesh>(null);
  const haloMeshRef = useRef<Mesh>(null);
  const pointsRef = useRef<Points>(null);

  const diskUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    [],
  );

  const haloUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    [],
  );

  const { geo: particleGeo, radii, angles, speeds } = useMemo(() => createAccretionParticles(), []);

  // Pointer tracking
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      heroMotion.pointerX = event.clientX / window.innerWidth - 0.5;
      heroMotion.pointerY = event.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    diskUniforms.uTime.value = time;
    haloUniforms.uTime.value = time;

    const group = groupRef.current;
    if (!group) return;

    // Follow mouse pointer with smooth lerp
    const targetX = 1.45 + heroMotion.pointerX * 0.5;
    const targetY = heroMotion.pointerY * -0.3;
    group.position.x += (targetX - group.position.x) * 0.05;
    group.position.y += (targetY - group.position.y) * 0.05;

    // Fluid Black Hole tilt responding to pointer and scroll
    const targetRotX = 0.55 + heroMotion.progress * 0.6 - heroMotion.pointerY * 0.25;
    const targetRotZ = -0.35 + heroMotion.pointerX * 0.2;
    group.rotation.x += (targetRotX - group.rotation.x) * 0.04;
    group.rotation.z += (targetRotZ - group.rotation.z) * 0.04;

    // Slow majestic spin of the disk
    if (diskMeshRef.current) {
      diskMeshRef.current.rotation.z += delta * 0.25;
    }

    // Animate swirling particle streams
    const posAttr = particleGeo.getAttribute("position");
    const posArr = posAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      angles[i] += speeds[i] * delta * 0.8;
      const r = radii[i];
      const theta = angles[i];
      posArr[i * 3] = Math.cos(theta) * r;
      posArr[i * 3 + 2] = Math.sin(theta) * r;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={[1.45, 0, 0]}>
      {/* ── 1. The Event Horizon (Pitch-black light-absorbing core) ── */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.08, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* ── 2. Gravitational Photon Ring (Blazing light hugging horizon) ── */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.11, 48, 48]} />
        <meshBasicMaterial
          color="#FD8F32"
          transparent
          opacity={0.35}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* ── 3. Gravitational Lensing Halo (Light bent over the top) ── */}
      <mesh ref={haloMeshRef} position={[0, 0, -0.05]} scale={[3.3, 3.3, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
          uniforms={haloUniforms}
          vertexShader={HALO_VERT}
          fragmentShader={HALO_FRAG}
        />
      </mesh>

      {/* ── 4. Swirling Accretion Disk (Luminous relativistic plasma) ── */}
      <mesh
        ref={diskMeshRef}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[3.1, 3.1, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
          uniforms={diskUniforms}
          vertexShader={DISK_VERT}
          fragmentShader={DISK_FRAG}
        />
      </mesh>

      {/* ── 5. Swirling High-Velocity Accretion Particles ── */}
      <points ref={pointsRef} geometry={particleGeo}>
        <pointsMaterial
          size={0.038}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.88}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* ── 6. Outer Diffuse Lensing Corona ── */}
      <mesh position={[0, 0, -0.1]} scale={[4.2, 4.2, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          uniforms={haloUniforms}
          vertexShader={HALO_VERT}
          fragmentShader={HALO_FRAG}
        />
      </mesh>
    </group>
  );
}

/* ── Scene Canvas ─────────────────────────────────────────────────── */

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.2], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <AuroraField />
      <BlackHole />
    </Canvas>
  );
}
