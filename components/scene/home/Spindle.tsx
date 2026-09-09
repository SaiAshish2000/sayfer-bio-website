"use client";

/**
 * Homepage spindle — the approved V2 Blender asset (public/models/sayfer-spindle-v2.glb).
 *
 * Composition (fixed, never repositioned between sections):
 *   large, close, diagonally anchored, both longitudinal ends outside the frame,
 *   biased right so the left-column text stays clear.
 *
 * Motion: rotation ONLY around the model's local long axis. The GLB was exported
 *   +Y-up, so the shaft runs along local +Y; the inner `spin` group rotates on Y.
 *   Rotation is driven deterministically by accumulated scroll distance
 *   (rotationY = scrollDistance * multiplier). No autoplay, no momentum: when
 *   scrolling stops the target stops moving and the spindle settles.
 *
 * Materials come from code, not the GLB (procedural Blender roughness/anisotropy
 * cannot travel through glTF). They reproduce the approved brushed-stainless
 * intent: darker neutral steel, controlled roughness, restrained highlights.
 */

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { sceneState } from "@/lib/scene-store";
import { damp } from "@/lib/anim";

const GLB_URL = "/models/sayfer-spindle-v2.glb";
useGLTF.preload(GLB_URL);

/** scroll pixels -> radians. A full long Home page is roughly two turns. */
const ROTATION_PER_PX = 0.0019;

function makeSteel() {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#a7abb1"),
    metalness: 1.0,
    roughness: 0.4,
    clearcoat: 0.04,
    clearcoatRoughness: 0.35,
    envMapIntensity: 1.45,
  });
  // brushed directional response where three supports it
  m.anisotropy = 0.55;
  m.anisotropyRotation = Math.PI / 2;
  return m;
}

function makeDarkSteel() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color("#15181b"),
    metalness: 0.65,
    roughness: 0.5,
    envMapIntensity: 0.8,
  });
}

export function Spindle() {
  const spin = useRef<THREE.Group>(null);
  const { size } = useThree();
  const { scene } = useGLTF(GLB_URL);

  const model = useMemo(() => {
    const root = scene.clone(true);
    const steel = makeSteel();
    const dark = makeDarkSteel();
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        mesh.material = /setscrew/i.test(mesh.name) ? dark : steel;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        // the model is intentionally cropped; keep every part rendering
        mesh.frustumCulled = false;
      }
    });
    return root;
  }, [scene]);

  // Fixed composition per breakpoint. Narrow screens: the spindle rises through
  // the open upper area above the bottom-aligned hero text, still cropped at
  // both ends. Wide screens: large, diagonal, biased right.
  const narrow = size.width < 820;
  const pos: [number, number, number] = narrow ? [0.3, 3.0, -0.6] : [3.35, 0.1, 0];
  const rot: [number, number, number] = narrow ? [0.16, 0, 0.5] : [0.15, 0, 0.58];
  const scl = narrow ? 4.7 : 6.05;

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    if (!spin.current) return;
    // Deterministic scroll-scrubbed axial rotation. Light damping only removes
    // ScrollTrigger stepping; the target is constant when scrolling stops, so
    // the spindle settles rather than coasting.
    const target = sceneState.scrollDistance * ROTATION_PER_PX;
    spin.current.rotation.y = damp(spin.current.rotation.y, target, 9, dt);
  });

  return (
    <group position={pos} rotation={rot} scale={scl}>
      <group ref={spin}>
        <primitive object={model} />
      </group>
    </group>
  );
}
