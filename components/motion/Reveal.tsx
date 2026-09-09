"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerSafeZone } from "@/lib/scene-store";

gsap.registerPlugin(ScrollTrigger);

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger direct children instead of animating the block as one. */
  stagger?: boolean;
  delay?: number;
  /** Register this block as a text-safe zone for the cell system. Default true. */
  safe?: boolean;
};

export function Reveal({
  children,
  className,
  stagger = false,
  delay = 0,
  safe = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const cleanupSafe = safe ? registerSafeZone(el) : undefined;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) {
        const targets = stagger ? Array.from(el.children) : el;
        gsap.from(targets, {
          y: 26,
          opacity: 0,
          duration: 0.9,
          delay,
          ease: "power3.out",
          stagger: stagger ? 0.08 : 0,
          scrollTrigger: { trigger: el, start: "top 82%" },
        });
      }

      return () => cleanupSafe?.();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
