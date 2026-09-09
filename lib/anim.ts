/** Small animation helpers shared by the 3D layer. */

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Frame-rate independent damping toward a target. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/**
 * Secondary biological progression. Cells stay restrained (V2): a small rise
 * across the page, never a proliferation spectacle. `progress` is 0..1.
 */
export function cellProgression(progress: number): number {
  return 0.28 + smoothstep(0, 1, progress) * 0.6;
}
