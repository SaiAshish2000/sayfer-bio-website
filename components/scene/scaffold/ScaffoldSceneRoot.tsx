"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sceneState, detectQuality, resetSceneScroll } from "@/lib/scene-store";
import { ScaffoldScene } from "./ScaffoldScene";

const SceneCanvas = dynamic(() => import("../SceneCanvas"), { ssr: false });

/**
 * Route-specific 3D root for Our Scaffold. Owns its own fixed canvas and scroll
 * controller, torn down on navigation so the scaffold GLB is never active on
 * other routes (Home loads the spindle GLB instead).
 */
export function ScaffoldSceneRoot() {
  const [quality, setQuality] = useState(detectQuality);
  const pointer = useRef({ x: 0, y: 0, raf: 0 });

  useEffect(() => {
    const local = pointer.current;
    resetSceneScroll();

    const mm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyRM = () => {
      sceneState.reducedMotion = mm.matches;
    };
    applyRM();
    mm.addEventListener("change", applyRM);
    sceneState.quality = detectQuality();

    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 0,
      end: "max",
      onUpdate: (self) => {
        sceneState.progress = self.progress;
        sceneState.scrollDistance = self.scroll();
      },
    });
    sceneState.scrollDistance = st.scroll();

    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 600);

    const onPointer = (e: PointerEvent) => {
      local.x = (e.clientX / window.innerWidth) * 2 - 1;
      local.y = -((e.clientY / window.innerHeight) * 2 - 1);
      if (!local.raf) {
        local.raf = requestAnimationFrame(() => {
          sceneState.pointerX = local.x;
          sceneState.pointerY = local.y;
          local.raf = 0;
        });
      }
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const next = detectQuality();
        sceneState.quality = next;
        setQuality(next);
        ScrollTrigger.refresh();
      }, 250);
    };
    window.addEventListener("resize", onResize);

    return () => {
      mm.removeEventListener("change", applyRM);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      st.kill();
      clearTimeout(resizeTimer);
      clearTimeout(refreshTimer);
      if (local.raf) cancelAnimationFrame(local.raf);
      resetSceneScroll();
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0" aria-hidden>
        {/* The shared default clamps DPR to 1.8, which on a 2x display means the
            canvas renders at 1.8x and the compositor upscales it — measurable
            softness on the flagship close view. Clamping to exactly 2.0 makes it
            1:1 on retina with no resampling. Scaffold route only; Home keeps the
            shared default. */}
        <SceneCanvas
          quality={quality}
          cameraPosition={[0, 0, 9]}
          fov={34}
          dpr={quality === "high" ? [1, 2] : quality === "medium" ? [1, 1.6] : [1, 1.25]}
        >
          <ScaffoldScene quality={quality} />
        </SceneCanvas>
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        aria-hidden
        style={{
          background:
            "radial-gradient(120% 85% at 70% 42%, transparent 38%, rgba(7,9,8,0.74) 100%)",
        }}
      />
      {/* Narrow-viewport text safety. On desktop the copy lives in the left
          column and never crosses the scaffold, but on mobile the body text
          runs nearly full width and passes over the lit tube — measured 4.01:1
          against the gold, just under the 4.5:1 AA floor. This scrim applies
          ONLY below the 820px pose breakpoint and only dims the canvas behind
          the copy; composition, lighting and material are untouched. */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] max-[819px]:bg-black/25"
        aria-hidden
      />
    </>
  );
}
