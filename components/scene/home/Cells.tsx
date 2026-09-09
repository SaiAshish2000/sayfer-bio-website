"use client";

/* eslint-disable react-hooks/immutability -- per-frame mutation of three.js objects is the intended R3F pattern */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState, getSafeNodes, type Quality } from "@/lib/scene-store";
import { clamp, damp, smoothstep, cellProgression } from "@/lib/anim";
import { createCellMaterial, createNucleusMaterial } from "./cellMaterial";

/** Restrained secondary system: quantity stays close to V1, realism is improved. */
const COUNT: Record<Quality, number> = { high: 34, medium: 22, low: 12 };

type CellDef = {
  base: THREE.Vector3;
  radius: number;
  drift: THREE.Vector3;
  speed: number;
  phase: number;
  threshold: number;
  seed: number;
  nucOffset: THREE.Vector3;
  nucScale: number;
};

function buildCells(count: number): CellDef[] {
  const cells: CellDef[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = i * 2.399963; // golden angle
    const ring = 2.6 + Math.pow(t, 0.7) * 7.0;
    const x = Math.cos(angle) * ring * (0.55 + 0.4 * Math.sin(i * 1.7));
    const y = Math.sin(i * 0.9) * 3.2 + (t - 0.5) * 1.4;
    const z = -1.6 - Math.abs(Math.sin(i * 1.3)) * 4.2 + Math.cos(i) * 0.6;
    const r = 0.13 + Math.pow(((i * 97) % 100) / 100, 1.7) * 0.34;
    cells.push({
      base: new THREE.Vector3(x, y, z),
      radius: r,
      drift: new THREE.Vector3(
        Math.sin(i * 3.1) * 0.4,
        0.18 + Math.abs(Math.cos(i * 2.2)) * 0.32,
        Math.sin(i * 1.9) * 0.32,
      ),
      speed: 0.04 + (((i * 53) % 100) / 100) * 0.07,
      phase: i * 1.618,
      // a few cells are always present; the rest join gently across the page
      threshold: i < 4 ? 0 : 0.1 + (i / count) * 0.7,
      seed: ((i * 131) % 1000) / 1000,
      // nucleus sits slightly off-centre -> the cell reads as having depth
      nucOffset: new THREE.Vector3(
        Math.sin(i * 5.3) * 0.22,
        Math.cos(i * 3.9) * 0.2,
        Math.sin(i * 2.7) * 0.18,
      ),
      nucScale: 0.26 + (((i * 71) % 100) / 100) * 0.12,
    });
  }
  return cells;
}

export function Cells({ quality }: { quality: Quality }) {
  const { camera, size } = useThree();
  const group = useRef<THREE.Group>(null);

  const geo = useMemo(
    () => new THREE.IcosahedronGeometry(1, quality === "low" ? 3 : 4),
    [quality],
  );
  const nucleusGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  const defs = useMemo(() => buildCells(COUNT[quality]), [quality]);

  const cells = useMemo(
    () =>
      defs.map((d) => {
        const membrane = createCellMaterial();
        membrane.uniforms.uSeed.value = d.seed;
        return {
          membrane,
          nucleus: createNucleusMaterial(),
          mesh: null as THREE.Group | null,
          opacity: 0,
        };
      }),
    [defs],
  );

  useEffect(() => {
    const current = cells;
    return () => {
      current.forEach((c) => {
        c.membrane.dispose();
        c.nucleus.dispose();
      });
    };
  }, [cells]);

  const safeRects = useRef<{ x: number; y: number; w: number; h: number }[]>([]);
  const rectTimer = useRef(0);
  const projected = useRef(new THREE.Vector3());

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const g = group.current;
    if (!g) return;

    const time = performance.now() / 1000;
    const reduce = sceneState.reducedMotion;
    const targetPop = cellProgression(sceneState.progress);

    rectTimer.current -= dt;
    if (rectTimer.current <= 0) {
      rectTimer.current = 0.16;
      const rects: { x: number; y: number; w: number; h: number }[] = [];
      getSafeNodes().forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > window.innerHeight + 80) return;
        rects.push({ x: r.left, y: r.top, w: r.width, h: r.height });
      });
      safeRects.current = rects;
    }

    for (let i = 0; i < defs.length; i++) {
      const def = defs[i];
      const cell = cells[i];
      const m = cell.mesh;
      if (!m) continue;

      const wob = reduce ? 0 : 1;
      m.position.set(
        def.base.x + Math.sin(time * def.speed + def.phase) * def.drift.x * wob,
        def.base.y + Math.cos(time * def.speed * 0.8 + def.phase) * def.drift.y * wob,
        def.base.z + Math.sin(time * def.speed * 0.6 + def.phase * 1.3) * def.drift.z * wob,
      );

      // once a cell has "joined" the population it is fully present; the
      // proliferation curve controls how many cells cross that line, not how
      // visible each present cell is.
      const member =
        def.threshold === 0
          ? 1
          : smoothstep(def.threshold, def.threshold + 0.08, targetPop);

      cell.membrane.uniforms.uTime.value = time;
      cell.membrane.uniforms.uWobble.value = reduce ? 0 : 1;
      projected.current.copy(m.position).project(camera);
      const sx = (projected.current.x * 0.5 + 0.5) * size.width;
      const sy = (-projected.current.y * 0.5 + 0.5) * size.height;

      let safe = 1;
      const margin = 240;
      for (const r of safeRects.current) {
        const dx = Math.max(r.x - sx, 0, sx - (r.x + r.w));
        const dy = Math.max(r.y - sy, 0, sy - (r.y + r.h));
        safe = Math.min(safe, smoothstep(0, margin, Math.hypot(dx, dy)));
      }
      const safeFactor = 0.04 + safe * 0.96;
      // depth only modulates the last quarter -> present cells stay readable
      const depth = clamp(1 - (def.base.z * -1) / 18, 0, 1);

      const targetOpacity = clamp(member * safeFactor * (0.72 + 0.28 * depth), 0, 1);
      cell.opacity = damp(cell.opacity, targetOpacity, 6, dt);
      cell.membrane.uniforms.uOpacity.value = cell.opacity;
      cell.nucleus.uniforms.uOpacity.value = cell.opacity * 0.55;

      const s =
        def.radius *
        (0.85 + member * 0.15) *
        (reduce ? 1 : 1 + Math.sin(time * 0.4 + def.phase) * 0.025);
      m.scale.setScalar(s);
    }
  });

  return (
    <group ref={group}>
      {defs.map((d, i) => (
        <group
          key={i}
          ref={(el) => {
            cells[i].mesh = el;
          }}
        >
          <mesh geometry={geo} material={cells[i].membrane} />
          <mesh
            geometry={nucleusGeo}
            material={cells[i].nucleus}
            position={d.nucOffset}
            scale={d.nucScale}
          />
        </group>
      ))}
    </group>
  );
}
