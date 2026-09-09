/**
 * Frame-loop shared state.
 *
 * The 3D layer must react to scroll without re-rendering the React tree every
 * frame, so scroll signals and the text-safe rectangle registry live in a plain
 * module singleton. A page-level scroll controller writes these; R3F `useFrame`
 * reads them.
 *
 * V2: there is no autoplay and no wheel momentum. `scrollDistance` is a signed,
 * continuously accumulated scroll offset. Flagship objects map it directly to
 * axial rotation, so rotation tracks scrolling and holds still when scrolling
 * stops. `progress` (0..1) drives gentle secondary progression (cell density).
 */

export type Quality = "high" | "medium" | "low";

export const sceneState = {
  /** 0 at the top of the page, 1 at the bottom. */
  progress: 0,
  /**
   * Signed accumulated scroll distance in CSS pixels. Increases scrolling down,
   * decreases scrolling up. Multiply by a small factor for axial rotation.
   */
  scrollDistance: 0,
  /** Normalized pointer, -1..1 on each axis. Drives a very small parallax only. */
  pointerX: 0,
  pointerY: 0,
  quality: "high" as Quality,
  reducedMotion: false,
};

/** Reset per-page so a fresh route starts from a known state. */
export function resetSceneScroll() {
  sceneState.progress = 0;
  sceneState.scrollDistance = 0;
}

/** DOM nodes whose typography must stay readable. Cells fade near their rects. */
const safeNodes = new Set<HTMLElement>();

export function registerSafeZone(el: HTMLElement): () => void {
  safeNodes.add(el);
  return () => {
    safeNodes.delete(el);
  };
}

export function getSafeNodes(): Set<HTMLElement> {
  return safeNodes;
}

export function detectQuality(): Quality {
  if (typeof window === "undefined") return "high";
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (w < 720 || cores <= 4 || mem <= 4) return "low";
  if (w < 1180 || cores <= 6) return "medium";
  return "high";
}
