/**
 * A single lit membrane — the shared building block for every organic form on
 * the About page, in both the hero field and the stage fields.
 *
 * Previously the ochre "material" marks were flat fill+stroke paths while only
 * the green cells received gradients. That difference is why the ochre group
 * read as cheap clumped vector shapes: it wasn't a placement problem alone, it
 * was a *material* problem. Both tones now go through this one component, so
 * they sit at the same standard and there is no duplicated cell rendering.
 *
 * Light model (a light-response study, not a copy of any one material):
 *   body      translucent volume, brightest toward the key, falling off soft
 *   shade     form shadow on the opposite side, giving the form roundness
 *   trans     light transmitted THROUGH the membrane, entering on the shadow
 *             side and dying out toward the key — this is what separates a
 *             translucent sac from an opaque pebble
 *   core      off-centre interior density — never a hard nucleus dot
 *   folds     paired crest/valley creases: each fold is a lit sliver and a
 *             warm dark sliver either side of the same curve, so it reads as
 *             local surface depth rather than as a line drawn on a flat shape
 *   halo      a very faint wide outer stroke — surface tension at the edge
 *   rim       gradient stroke: catches on the lit edge, dissolves in shadow
 *   tension   one narrow curved highlight riding the lit edge
 *   spec      one small soft specular, offset toward the key
 *
 * Read against references/CELL_MEMBRANE_LIGHT_REFERENCE.png for how a real
 * membrane behaves: highlights are stretched along the fold crests and taper
 * off rather than ending, and every dent pairs a bright crest with a darker
 * valley. Only that light behaviour is borrowed — the reference's opaque near
 * black body is explicitly NOT the target here.
 *
 * The key sits upper-right to agree with the scaffold's own top-right key.
 * Nothing here is opaque and nothing is black — the darkest element is a low
 * alpha warm shadow that only deepens the turn of the form.
 */

export type Tone = "ochre" | "green";

export type Blob = { x: number; y: number; r: number };

const TONE = {
  ochre: { bright: "#e8bd72", body: "#d8a24a", deep: "#a9762b" },
  green: { bright: "#8fcfa0", body: "#74b884", deep: "#5f9d6e" },
} as const;

/** Warm, never black — the deepest value anywhere in the system. */
const VALLEY = "#160d04";

/** Key direction, upper-right, matching the gradients and the scaffold's key. */
const KEY_X = 0.6;
const KEY_Y = -0.8;

/**
 * Detail-only PRNG, seeded from the blob's own geometry.
 *
 * The membranes share one seeded stream across a whole field, so ANY extra
 * rand() call here would shift every later cell's shape, drift period and
 * phase. The placement, silhouettes and drift are already approved, so new
 * surface detail draws from this separate per-blob stream instead and the
 * shared stream is consumed in exactly the order it was before.
 */
function detailRng(b: Blob) {
  let s =
    (Math.imul(Math.round(b.x * 8191), 0x27d4eb2d) ^
      Math.imul(Math.round(b.y * 8191), 0x165667b1) ^
      Math.imul(Math.round(b.r * 8191), 0x9e3779b9)) >>>
    0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A tapered crease that FOLLOWS an arc.
 *
 * Folds used to be plain stroked arcs, and a stroke's ends stop dead — that
 * hard termination is what made them read as scratches on a flat seed. This
 * draws a closed sliver instead, widest in the middle and tapering to nothing
 * at both ends, which is how a fold in a membrane actually resolves.
 *
 * The sliver is built on the arc itself rather than from one bowed quadratic:
 * over the long sweeps these folds need, a single quadratic cuts the chord and
 * the sliver collapses into a wedge with visible corners. Each edge is instead
 * two quadratic segments whose controls are solved so the curve passes exactly
 * through the sampled arc, and the width follows a sine taper.
 *
 * `off` slides the whole crease radially, so a lit crest and its darker valley
 * can be drawn either side of one and the same fold.
 */
function crease(cx: number, cy: number, r: number, a0: number, a1: number, off: number, w: number) {
  const pt = (t: number, sign: number, amp: number): [number, number] => {
    const rr = r + off + sign * amp * Math.sin(Math.PI * t);
    const a = a0 + (a1 - a0) * t;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  };
  // Control that makes a quadratic pass through `m` at its midpoint.
  const c = (p0: [number, number], m: [number, number], p1: [number, number]) =>
    `${(2 * m[0] - 0.5 * (p0[0] + p1[0])).toFixed(1)},${(2 * m[1] - 0.5 * (p0[1] + p1[1])).toFixed(1)}`;
  const f = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

  const O = [0, 0.25, 0.5, 0.75, 1].map((t) => pt(t, 1, w)) as [number, number][];
  const I = [0, 0.25, 0.5, 0.75, 1].map((t) => pt(t, -1, w * 0.38)) as [number, number][];

  return (
    `M${f(O[0])}` +
    `Q${c(O[0], O[1], O[2])} ${f(O[2])}` +
    `Q${c(O[2], O[3], O[4])} ${f(O[4])}` +
    `Q${c(I[4], I[3], I[2])} ${f(I[2])}` +
    `Q${c(I[2], I[1], I[0])} ${f(I[0])}Z`
  );
}

/**
 * Organic closed outline: random ANGULAR steps (not evenly spaced vertices),
 * random radii, plus per-shape squash and rotation, smoothed with a closed
 * Catmull-Rom → cubic Bézier. Evenly spaced vertices are what made earlier
 * attempts read as rounded polygons.
 */
export function blobPath(cx: number, cy: number, r: number, rand: () => number, wobble: number, n: number) {
  // Angular gaps stay uneven — evenly spaced vertices are what read as a
  // rounded polygon — but the floor is high enough that two vertices never
  // crowd together, which is what produced the hard shard-like corners.
  const steps = Array.from({ length: n }, () => 0.8 + rand() * 0.5);
  const total = steps.reduce((a, b) => a + b, 0);
  const squash = 0.72 + rand() * 0.5;
  const rot = rand() * Math.PI * 2;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);

  let acc = 0;
  const pts: [number, number][] = steps.map((step) => {
    const a = (acc / total) * Math.PI * 2;
    acc += step;
    const rr = r * (1 - wobble / 2 + rand() * wobble);
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr * squash;
    return [cx + px * cosR - py * sinR, cy + px * sinR + py * cosR];
  });

  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(2)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return `${d}Z`;
}

/**
 * Placement with an enforced separation, instead of plain disc scatter.
 * Rejection sampling keeps centres at least `gap` x the summed radii apart, so
 * forms read as separate or loosely related presences rather than a lump. This
 * is the actual fix for the clumping — density alone was never the problem.
 */
export function placeBlobs(
  n: number,
  cx: number,
  cy: number,
  spread: number,
  min: number,
  max: number,
  rand: () => number,
  gap = 1.25,
): Blob[] {
  const out: Blob[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 300) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * spread;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const r = min + rand() * (max - min);
    if (x < 26 || x > 374 || y < 26 || y > 374) continue;
    if (out.some((p) => Math.hypot(p.x - x, p.y - y) < (p.r + r) * gap)) continue;
    out.push({ x, y, r });
  }
  return out;
}

/** Gradients for both tones. Rendered once per SVG. */
export function MembraneDefs({ id }: { id: string }) {
  return (
    <>
      {(Object.keys(TONE) as Tone[]).map((t) => {
        const c = TONE[t];
        return (
          <g key={t}>
            {/* translucent volume, brightest toward the upper-right key */}
            <radialGradient id={`${id}-${t}-body`} cx="63%" cy="30%" r="82%">
              <stop offset="0%" stopColor={c.bright} stopOpacity="0.26" />
              <stop offset="46%" stopColor={c.body} stopOpacity="0.13" />
              <stop offset="100%" stopColor={c.deep} stopOpacity="0.04" />
            </radialGradient>
            {/* form shadow opposite the key — warm, low alpha, never black */}
            <radialGradient id={`${id}-${t}-shade`} cx="28%" cy="76%" r="72%">
              <stop offset="0%" stopColor="#120b04" stopOpacity="0.15" />
              <stop offset="55%" stopColor="#120b04" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#120b04" stopOpacity="0" />
            </radialGradient>
            {/* Light transmitted through the membrane: enters on the shadow
                side, dies out toward the key. Low alpha and bright-toned, so
                the terminator glows faintly instead of going flat and opaque. */}
            <linearGradient id={`${id}-${t}-trans`} x1="0.08" y1="0.96" x2="0.68" y2="0.22">
              <stop offset="0%" stopColor={c.bright} stopOpacity="0.15" />
              <stop offset="38%" stopColor={c.bright} stopOpacity="0.05" />
              <stop offset="100%" stopColor={c.bright} stopOpacity="0" />
            </linearGradient>
            {/* interior density */}
            <radialGradient id={`${id}-${t}-core`} cx="52%" cy="40%" r="70%">
              <stop offset="0%" stopColor={c.bright} stopOpacity="0.2" />
              <stop offset="70%" stopColor={c.body} stopOpacity="0.06" />
              <stop offset="100%" stopColor={c.body} stopOpacity="0" />
            </radialGradient>
            {/* rim: catches on the lit edge, dissolves into shadow */}
            <linearGradient id={`${id}-${t}-rim`} x1="0.15" y1="1" x2="0.85" y2="0">
              <stop offset="0%" stopColor={c.deep} stopOpacity="0.05" />
              <stop offset="55%" stopColor={c.body} stopOpacity="0.16" />
              <stop offset="100%" stopColor={c.bright} stopOpacity="0.4" />
            </linearGradient>
            {/* Falloff along a fold crest. Bounding-box relative, so one
                gradient serves every crease at any orientation: the lit band
                peaks part way along and dissolves at both ends, which is how a
                highlight rides a fold instead of being painted on it. */}
            <linearGradient id={`${id}-${t}-fold`} x1="0.05" y1="0.95" x2="0.95" y2="0.05">
              <stop offset="0%" stopColor={c.bright} stopOpacity="0.1" />
              <stop offset="44%" stopColor={c.bright} stopOpacity="1" />
              <stop offset="100%" stopColor={c.bright} stopOpacity="0.14" />
            </linearGradient>
            {/* soft specular */}
            <radialGradient id={`${id}-${t}-spec`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff7e8" stopOpacity="0.24" />
              <stop offset="55%" stopColor={c.bright} stopOpacity="0.09" />
              <stop offset="100%" stopColor={c.bright} stopOpacity="0" />
            </radialGradient>
          </g>
        );
      })}
    </>
  );
}

export function Membrane({
  b,
  tone,
  id,
  rand,
  opacity = 1,
}: {
  b: Blob;
  tone: Tone;
  id: string;
  rand: () => number;
  opacity?: number;
}) {
  const drand = detailRng(b);
  const outline = blobPath(b.x, b.y, b.r, rand, 0.54, 9);
  const ox = b.x + b.r * (rand() * 0.26 - 0.1);
  const oy = b.y + b.r * (rand() * 0.26 - 0.14);
  const core = blobPath(ox, oy, b.r * (0.34 + rand() * 0.14), rand, 0.5, 7);

  // Folds follow the curvature rather than crossing the form at random, so
  // they read as surface relief instead of scratches. Each one is drawn twice
  // — a lit crest and a warm darker valley on either side of the same curve —
  // because a single mark can only ever look like a line ON a shape, while a
  // paired light/dark step is what the eye reads as depth IN one.
  const folds = Array.from({ length: 2 + Math.floor(rand() * 2) }, (_, k) => {
    // Same five draws from the shared stream as before, but ranged so a fold
    // SPANS the form and rides its curvature. Short arcs bowed toward the
    // centre read as little parentheses drawn on a surface; a long one whose
    // control point sits out on the arc reads as the surface itself turning.
    // The outer extent stays under the silhouette's minimum radius, so a fold
    // can approach the edge without ever escaping it.
    const a = rand() * Math.PI * 2;
    const span = 1.15 + rand() * 1.3;
    const fr = b.r * (0.5 + rand() * 0.22);
    const bow = 0.9 + rand() * 0.16;
    const alpha = 0.1 + rand() * 0.07;
    // Which side of the fold faces the key, measured at its midpoint: that is
    // the side that catches light, and the valley falls on the other.
    const mid = a + span / 2;
    const lit = Math.cos(mid) * KEY_X + Math.sin(mid) * KEY_Y >= 0 ? 1 : -1;

    const w = fr * (0.1 + drand() * 0.05);
    const sep = w * 0.85;

    // Every fold sharing the blob's centre made them read as concentric
    // ripples around the core. A small independent centre per fold breaks that
    // without moving the fold anywhere near the edge.
    const jx = (drand() - 0.5) * b.r * 0.16;
    const jy = (drand() - 0.5) * b.r * 0.16;

    // Hard containment: the outermost painted point of a crease is its radius
    // plus its offset plus its half width, and the silhouette's own minimum
    // radius is 0.79 b.r (wobble 0.42). Clamping here is what lets the folds
    // run this large and this close to the rim without one ever escaping.
    const fold = Math.min(fr * bow, b.r * 0.74 - sep - w - Math.hypot(jx, jy));

    return (
      <g key={`f${k}`}>
        <path d={crease(b.x + jx, b.y + jy, fold, a, a + span, -lit * sep, w * 0.9)} fill={VALLEY} fillOpacity={alpha * 0.85} />
        <path d={crease(b.x + jx, b.y + jy, fold, a, a + span, lit * sep, w)} fill={`url(#${id}-${tone}-fold)`} fillOpacity={alpha * 1.05} />
      </g>
    );
  });

  // specular sits toward the key, scaled to the form
  const sr = b.r * (0.2 + rand() * 0.08);
  const sx = b.x + b.r * 0.34;
  const sy = b.y - b.r * 0.36;

  // One narrow highlight riding just inside the lit edge — the stretched,
  // tapering catch of light a taut membrane gets along its curvature, as
  // distinct from the broad soft sheen the specular already provides. Kept
  // well inside b.r so it cannot escape an irregular silhouette.
  const ta = -Math.PI / 4 + (drand() - 0.5) * 0.9;
  const tSweep = 0.55 + drand() * 0.5;
  const tension = crease(b.x, b.y, b.r * 0.68, ta - tSweep / 2, ta + tSweep / 2, 0, b.r * 0.07);

  // Non-harmonic periods per axis so the wander never visibly repeats or syncs.
  const tx = (38 + rand() * 30).toFixed(1);
  const ty = (47 + rand() * 34).toFixed(1);
  const dx = (2.4 + rand() * 3.2).toFixed(2);
  const dy = (2.0 + rand() * 3.0).toFixed(2);

  return (
    <g
      className="sf-drift-x"
      style={
        {
          "--sf-dx": `${dx}px`,
          "--sf-tx": `${tx}s`,
          "--sf-delay-x": `${(-rand() * 50).toFixed(1)}s`,
        } as React.CSSProperties
      }
    >
      <g
        className="sf-drift-y"
        style={
          {
            "--sf-dy": `${dy}px`,
            "--sf-ty": `${ty}s`,
            "--sf-delay-y": `${(-rand() * 50).toFixed(1)}s`,
          } as React.CSSProperties
        }
        opacity={opacity}
      >
        <path d={outline} fill={`url(#${id}-${tone}-body)`} />
        <path d={outline} fill={`url(#${id}-${tone}-shade)`} />
        {/* after the shade, so the terminator keeps a faint inner glow */}
        <path d={outline} fill={`url(#${id}-${tone}-trans)`} />
        <path d={core} fill={`url(#${id}-${tone}-core)`} />
        {folds}
        {/* surface tension: a wide, almost invisible halo under the crisp rim */}
        <path d={outline} fill="none" stroke={TONE[tone].bright} strokeOpacity={0.055} strokeWidth={2.4} />
        <path d={outline} fill="none" stroke={`url(#${id}-${tone}-rim)`} strokeWidth={0.7} />
        <ellipse cx={sx} cy={sy} rx={sr * 1.7} ry={sr * 1.1} fill={`url(#${id}-${tone}-spec)`} transform={`rotate(${(-28 + rand() * 22).toFixed(1)} ${sx.toFixed(1)} ${sy.toFixed(1)})`} />
        <path d={tension} fill={`url(#${id}-${tone}-fold)`} fillOpacity={0.13} />
      </g>
    </g>
  );
}
