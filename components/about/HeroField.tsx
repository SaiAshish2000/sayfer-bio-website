/**
 * The About hero's background hint.
 *
 * The whole progression compressed into one wide field: material weighted to
 * the left, biology taking over toward the right. It states the page's argument
 * spatially before the reader reaches the stages themselves.
 *
 * Uses the same lit-membrane renderer as the stage fields, so there is exactly
 * one cell system on this page rather than a duplicate implementation here.
 * Material and biology only — an earlier revision drew node-to-node links,
 * which read as a network diagram rather than as biology.
 *
 * Deliberately quiet: About is the strategic page, so this stays a background
 * depth field rather than a hero object. Server-rendered SVG, seeded so it is
 * stable across renders, and positioned so it never sits under body copy.
 */

import { Membrane, MembraneDefs, placeBlobs } from "./Membrane";

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

const W = 900;
const H = 460;
const ID = "hero";

/** Map the 0-400 placement space onto this wider field. */
function spreadOut(b: { x: number; y: number; r: number }, shiftX: number) {
  return { x: b.x * (W / 400) * 0.86 + shiftX, y: b.y * (H / 400), r: b.r };
}

export function HeroField({ className = "" }: { className?: string }) {
  const rand = rng(90210);

  // Sparse and well separated. The hero is the quietest surface on the page,
  // so this is quality over count — a handful of forms, none of them touching.
  const material = placeBlobs(7, 170, 200, 150, 15, 27, rand, 1.45).map((b) => spreadOut(b, 10));
  const biology = placeBlobs(6, 250, 200, 140, 14, 25, rand, 1.45).map((b) => spreadOut(b, 240));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="presentation" aria-hidden="true" focusable="false">
      <defs>
        <MembraneDefs id={ID} />
        <linearGradient id="hero-fade-x" x1="0" x2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="26%" stopColor="#fff" stopOpacity="0.92" />
          <stop offset="78%" stopColor="#fff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hero-fade-y" cx="50%" cy="50%" r="64%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="hero-mask">
          <rect width={W} height={H} fill="url(#hero-fade-x)" />
          <rect width={W} height={H} fill="url(#hero-fade-y)" style={{ mixBlendMode: "multiply" }} />
        </mask>
      </defs>
      <g mask="url(#hero-mask)">
        {material.map((b, i) => (
          <Membrane key={`m${i}`} b={b} tone="ochre" id={ID} rand={rand} opacity={0.62} />
        ))}
        {biology.map((b, i) => (
          <Membrane key={`b${i}`} b={b} tone="green" id={ID} rand={rand} opacity={0.72} />
        ))}
      </g>
    </svg>
  );
}
