"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  sceneState,
  detectQuality,
  resetSceneScroll,
} from "@/lib/scene-store";
import { HomeScene } from "./HomeScene";

const SceneCanvas = dynamic(() => import("../SceneCanvas"), { ssr: false });

/**
 * Route-specific 3D root for Home. Owns its own fixed canvas and its own scroll
 * controller, and tears both down on navigation so the spindle scene is never
 * active on other routes.
 */
export function HomeSceneRoot() {
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
        // signed, continuously accumulated scroll offset -> axial rotation
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
        <SceneCanvas quality={quality} cameraPosition={[0, 0, 9]} fov={34}>
          <HomeScene quality={quality} />
        </SceneCanvas>
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        aria-hidden
        style={{
          background:
            "radial-gradient(120% 85% at 70% 42%, transparent 38%, rgba(7,9,8,0.72) 100%)",
        }}
      />
    </>
  );
}
