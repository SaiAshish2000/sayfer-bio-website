/**
 * The About page's progression visual.
 *
 * ONE system whose composition evolves, not four separate illustrations. The
 * vocabulary is only ever material and biology — both drawn as lit membranes
 * (see Membrane.tsx), differing only in tone:
 *
 *   structure   the real scaffold macro carries this stage (see StageProgression)
 *   biological  material sits left; biology arrives in the open space right
 *   integrated  material and biology occupy one space and interleave
 *   future      material thins away and biology disperses across a wider field
 *
 * Integration and expansion are shown by PROXIMITY and DENSITY, never by drawn
 * connections — an earlier revision linked forms with lines and nodes, which
 * read as a network diagram rather than as biology.
 *
 * Counts are deliberately low and placement enforces separation, so the ochre
 * group reads as distinct organic presences instead of the tangled mass it was.
 *
 * Pure SVG + CSS with a seeded PRNG: server-rendered, no client JS, no GLB, and
 * identical between server and client (a live Math.random would hydrate-
 * mismatch). No canvas — this page stays quieter than Home and Our Scaffold.
 */

import { Membrane, MembraneDefs, placeBlobs } from "./Membrane";

/** mulberry32 — small deterministic PRNG so every render is byte-identical. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type StageKey = "structure" | "biological" | "integrated" | "future";

type Group = { n: number; cx: number; cy: number; spread: number; min: number; max: number; opacity: number; gap: number };
type Recipe = { seed: number; material: Group; biology: Group };

const NONE: Group = { n: 0, cx: 0, cy: 0, spread: 0, min: 0, max: 0, opacity: 0, gap: 1 };

const RECIPES: Record<StageKey, Recipe> = {
  // Not normally rendered — stage 01 shows the real scaffold macro instead.
  structure: {
    seed: 1207,
    material: { n: 9, cx: 200, cy: 200, spread: 168, min: 16, max: 30, opacity: 0.8, gap: 1.3 },
    biology: NONE,
  },
  // Material left, biology arriving into the open space on the right.
  biological: {
    seed: 5521,
    material: { n: 6, cx: 132, cy: 200, spread: 116, min: 17, max: 30, opacity: 0.72, gap: 1.35 },
    biology: { n: 5, cx: 280, cy: 198, spread: 84, min: 17, max: 28, opacity: 0.82, gap: 1.3 },
  },
  // Shared centre: the two now occupy one space. Read through overlap, not lines.
  integrated: {
    seed: 8803,
    material: { n: 5, cx: 196, cy: 202, spread: 130, min: 16, max: 28, opacity: 0.72, gap: 1.3 },
    biology: { n: 6, cx: 206, cy: 198, spread: 124, min: 17, max: 29, opacity: 0.82, gap: 1.25 },
  },
  // Material nearly gone; biology disperses outward across a wider field.
  future: {
    seed: 3319,
    material: { n: 3, cx: 196, cy: 210, spread: 116, min: 13, max: 22, opacity: 0.45, gap: 1.4 },
    biology: { n: 7, cx: 200, cy: 200, spread: 144, min: 14, max: 26, opacity: 0.7, gap: 1.35 },
  },
};

export function StageField({ stage, className = "" }: { stage: StageKey; className?: string }) {
  const R = RECIPES[stage];
  const rand = rng(R.seed);
  const id = `sf-${stage}`;

  const material = placeBlobs(R.material.n, R.material.cx, R.material.cy, R.material.spread, R.material.min, R.material.max, rand, R.material.gap);
  const biology = placeBlobs(R.biology.n, R.biology.cx, R.biology.cy, R.biology.spread, R.biology.min, R.biology.max, rand, R.biology.gap);

  return (
    <svg viewBox="0 0 400 400" className={className} role="presentation" aria-hidden="true" focusable="false">
      <defs>
        <MembraneDefs id={id} />
        {/* Softens the outer edge so the field reads as depth, not a boxed
            illustration — gently, so the composition still carries. */}
        <radialGradient id={`${id}-fade`} cx="50%" cy="50%" r="86%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="80%" stopColor="#fff" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width="400" height="400" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-mask)`}>
        {material.map((b, i) => (
          <Membrane key={`m${i}`} b={b} tone="ochre" id={id} rand={rand} opacity={R.material.opacity} />
        ))}
        {biology.map((b, i) => (
          <Membrane key={`b${i}`} b={b} tone="green" id={id} rand={rand} opacity={R.biology.opacity} />
        ))}
      </g>
    </svg>
  );
}
