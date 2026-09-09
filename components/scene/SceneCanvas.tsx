"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { ReactNode } from "react";
import { type Quality } from "@/lib/scene-store";

/** Generic R3F canvas. Route-specific scenes compose their own contents. */

const DPR: Record<Quality, [number, number]> = {
  high: [1, 1.8],
  medium: [1, 1.5],
  low: [1, 1.25],
};

export default function SceneCanvas({
  quality,
  cameraPosition = [0, 0, 9],
  fov = 34,
  dpr,
  children,
}: {
  quality: Quality;
  cameraPosition?: [number, number, number];
  fov?: number;
  /** Optional per-route DPR clamp. Omitted -> the shared default above, so
   *  routes that don't pass it (Home) are unaffected. */
  dpr?: [number, number];
  children: ReactNode;
}) {
  return (
    <Canvas
      dpr={dpr ?? DPR[quality]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1.18,
      }}
      camera={{ position: cameraPosition, fov }}
    >
      {children}
    </Canvas>
  );
}
