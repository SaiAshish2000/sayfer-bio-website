"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StageField, type StageKey } from "./StageField";
import { Container } from "@/components/site/Page";

gsap.registerPlugin(ScrollTrigger);

type Stage = {
  key: string;
  short: string;
  stage: string;
  focus: string;
  status: string;
};

/**
 * Per-stage spatial treatment. Each stage sits differently in the 12-column
 * grid and its field is a different size, so the four read as one progression
 * that opens out rather than as a repeated card row. Class strings are static
 * literals so Tailwind can see them.
 */
const LAYOUT = [
  { text: "lg:col-span-5", visual: "lg:col-start-7 lg:col-span-6", field: "max-w-[26rem]" },
  { text: "lg:col-start-2 lg:col-span-5", visual: "lg:col-start-8 lg:col-span-5", field: "max-w-[24rem]" },
  { text: "lg:col-span-5", visual: "lg:col-start-7 lg:col-span-6", field: "max-w-[29rem]" },
  { text: "lg:col-span-6", visual: "lg:col-start-7 lg:col-span-6", field: "max-w-[34rem]" },
];

export function StageProgression({ stages }: { stages: readonly Stage[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const line = el.querySelector<HTMLElement>("[data-progress-line]");
      const items = gsap.utils.toArray<HTMLElement>("[data-stage]", el);

      // Reduced motion: the rail is simply drawn and every stage is fully
      // emphasised, so the sequence reads identically without animation.
      if (reduce) {
        if (line) line.style.transform = "scaleY(1)";
        items.forEach((i) => i.setAttribute("data-active", "true"));
        return;
      }

      if (line) {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 70%", end: "bottom 75%", scrub: 0.6 },
          },
        );
      }

      // Emphasis follows the reader rather than firing once, but it only
      // changes tone — never reveals information.
      items.forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top 72%",
          end: "bottom 40%",
          onToggle: (self) => item.setAttribute("data-active", String(self.isActive)),
        });
      });

      items.forEach((item) => {
        gsap.from(item, {
          y: 24,
          opacity: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: { trigger: item, start: "top 84%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <Container>
        <ol className="relative grid gap-y-24 md:gap-y-32">
          {/* Continuous process rail: one line through the whole programme,
              with a marker per stage. Desktop only — on narrow screens it would
              just crowd the type. */}
          <div className="pointer-events-none absolute left-0 top-2 bottom-2 hidden w-px bg-hairline lg:block" aria-hidden>
            <div
              data-progress-line
              className="h-full w-px origin-top bg-accent/60"
              style={{ transform: "scaleY(0)" }}
            />
          </div>

          {stages.map((s, i) => {
            const L = LAYOUT[i] ?? LAYOUT[0];
            return (
              <li
                key={s.key}
                data-stage
                data-active="false"
                className="group relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12 lg:pl-16"
              >
                {/* rail marker */}
                <span
                  aria-hidden
                  className="absolute -left-[4.5px] top-3 hidden h-[9px] w-[9px] rounded-full border border-hairline-strong bg-void transition-colors duration-500 group-data-[active=true]:border-accent-bright group-data-[active=true]:bg-accent-bright lg:block"
                />

                <div className={L.text}>
                  <p className="font-mono text-xs tracking-[0.2em] text-muted transition-colors duration-500 group-data-[active=true]:text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="statement mt-4 text-[1.6rem] leading-tight text-mist transition-colors duration-500 group-data-[active=true]:text-ivory md:text-[2rem]">
                    {s.short}
                  </h3>
                  <p className="mt-3 font-display text-sm text-muted">{s.stage}</p>
                  <p className="measure mt-5 text-base leading-relaxed text-mist">{s.focus}</p>
                  <p className="label mt-6 text-faint">{s.status}</p>
                </div>

                <div className={`${L.visual} order-first lg:order-none`}>
                  <div className={`relative mx-auto w-full ${L.field}`}>
                    {/* Stage 01 shows the real approved scaffold material; the
                        later stages are the progression field, which is why the
                        macro is not repeated below. */}
                    {i === 0 ? (
                      <div
                        className="relative aspect-square"
                        // A deliberate editorial crop, not a spotlight. The
                        // earlier radial cut-out read as an arbitrary circular
                        // vignette; this feathers hard on the LEFT (the side
                        // facing the copy) and only gently top and bottom, so
                        // the fragment stays generously visible and bleeds
                        // outward like a cropped plate. Composited so both
                        // gradients apply.
                        style={{
                          WebkitMaskImage:
                            "linear-gradient(to right, transparent 0%, #000 26%, #000 100%), linear-gradient(to bottom, transparent 0%, #000 15%, #000 85%, transparent 100%)",
                          maskImage:
                            "linear-gradient(to right, transparent 0%, #000 26%, #000 100%), linear-gradient(to bottom, transparent 0%, #000 15%, #000 85%, transparent 100%)",
                          WebkitMaskComposite: "source-in",
                          maskComposite: "intersect",
                        }}
                      >
                        <Image
                          src="/brand/scaffold-macro.webp"
                          alt="Macro detail of the Sayfer Bio scaffold's porous structure"
                          width={720}
                          height={720}
                          sizes="(max-width: 1024px) 80vw, 26rem"
                          className="h-full w-full object-cover opacity-80 transition-opacity duration-700 group-data-[active=true]:opacity-100"
                        />
                      </div>
                    ) : (
                      <StageField
                        stage={s.key as StageKey}
                        className="h-auto w-full opacity-85 transition-opacity duration-700 group-data-[active=true]:opacity-100"
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </div>
  );
}
