"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { IntroRenderer, type IntroUniforms } from "./IntroRenderer";
import { INTRO_FLAG, HEADER_LOGO_SELECTOR } from "./introConfig";
import { INTRO_DATA, LOCKUP } from "./introData.generated";

/**
 * The Sayfer Bio V5 intro.
 *
 * One continuous transformation — a living cell mass elongates into the leaf,
 * the leaf is twisted from opposite ends while its pores differentiate out of
 * the material, and the form resolves onto the V5 mark, which then recomposes
 * into the site header.
 *
 * Structure:
 *   - a WebGL canvas carries the morph and the torsion (see IntroRenderer)
 *   - the real V5 mark and wordmark are DOM images, so the finished lockup is
 *     the production artwork rather than a shader's approximation of it
 *   - the shader cross-fades into the real mark at the lock, where the two
 *     silhouettes are identical because both come from the same artwork
 *   - the lockup then flies to the header logo's measured position
 *
 * The site is fully rendered underneath the whole time, so the reveal is a fade
 * rather than a load. Visibility is decided before first paint by the inline
 * script in the root layout, so a returning visitor never sees a flash of it.
 */

type Stage = {
  t1: number;
  t2: number;
  twist: number;
  warp: number;
  fold: number;
  emerge: number;
  pore: number;
  glow: number;
  colorSpan: number;
  fade: number;
};

type Lockup = typeof LOCKUP;

const INTRO = INTRO_DATA;
const MARK_SRC = INTRO.assets.mark.src;
const WORDMARK_SRC = INTRO.assets.wordmark.src;

/** What the layout pass resolves: canvas size plus both pieces' start rects. */
type Geo = {
  cvsW: number;
  cvsH: number;
  markW: number;
  wordW: number;
  markLeft: number;
  markTop: number;
  wordLeft: number;
  wordTop: number;
};

/** Canvas box / atlas box. Headroom so the form's outer glow is never clipped. */
const PAD = 1.3;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      // Decode before the sequence starts. Left to the first paint, the decode
      // of the field atlas lands inside the opening beat and stalls it.
      const done = () => resolve(img);
      img.decode().then(done, done);
    };
    img.onerror = () => reject(new Error(`intro: failed to load ${src}`));
    img.src = src;
  });
}

export function IntroOverlay() {
  const root = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const markEl = useRef<HTMLImageElement>(null);
  const wordEl = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // The pre-paint script in the layout is the single source of truth for
    // whether this session gets an intro.
    if (document.documentElement.dataset.intro !== "running") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: IntroRenderer | null = null;
    let raf = 0;
    let tl: gsap.core.Timeline | null = null;
    let done = false;
    let cleanupSeek: (() => void) | undefined;

    const stage: Stage = {
      t1: 0, t2: 0, twist: 0, warp: 0, fold: 0, emerge: 0.68, pore: 0, glow: 0.10,
      colorSpan: 0.46, fade: 0,
    };

    /**
     * Un-hides the production header logo ahead of the overlay going away.
     * Inline opacity beats the attribute rule in globals.css that hides it for
     * the duration of the intro.
     */
    const revealHeaderLogo = () => {
      const img = document.querySelector<HTMLElement>(HEADER_LOGO_SELECTOR);
      if (img) img.style.opacity = "1";
    };

    /** Ends the intro exactly once, from any path including failure. */
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(safety);
      if (raf) cancelAnimationFrame(raf);
      tl?.kill();
      renderer?.dispose();
      renderer = null;
      cleanupSeek?.();
      try {
        sessionStorage.setItem(INTRO_FLAG, "1");
      } catch {
        /* private mode — the intro simply plays again next load */
      }
      document.documentElement.dataset.intro = "done";
      // The attribute rule no longer applies, so the inline override that
      // carried the hand-over can go and the header returns to its own styling.
      const headerImg = document.querySelector<HTMLElement>(HEADER_LOGO_SELECTOR);
      if (headerImg) headerImg.style.removeProperty("opacity");
      el.remove();
      window.removeEventListener("keydown", onKey);
      // ScrollTrigger measures on resize; the scroll lock has just been
      // released, so let Home's controller re-measure against the real height.
      window.dispatchEvent(new Event("resize"));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    el.addEventListener("click", finish);
    // Never leave the page unusable if anything stalls.
    const safety = setTimeout(finish, 9000);

    /**
     * Measures the flight: the vertical lockup where it sits -> the real header
     * logo's mark and wordmark sub-rectangles.
     *
     * Start positions come from the layout pass rather than from
     * getBoundingClientRect, because by the time a seek re-evaluates this the
     * elements may already carry a transform, and measuring a transformed rect
     * would compound the offset.
     */
    const flight = (lockup: Lockup, geo: Geo) => {
      const header = document.querySelector<HTMLElement>(HEADER_LOGO_SELECTOR);
      if (!header) return null;
      const from = {
        mark: { left: geo.markLeft, top: geo.markTop, width: geo.markW },
        word: { left: geo.wordLeft, top: geo.wordTop, width: geo.wordW },
      };
      const h = header.getBoundingClientRect();
      const to = {
        mark: {
          left: h.left + h.width * lockup.mark.x,
          top: h.top + h.height * lockup.mark.y,
          width: h.width * lockup.mark.w,
        },
        word: {
          left: h.left + h.width * lockup.wordmark.x,
          top: h.top + h.height * lockup.wordmark.y,
          width: h.width * lockup.wordmark.w,
        },
      };
      return {
        mark: {
          x: to.mark.left - from.mark.left,
          y: to.mark.top - from.mark.top,
          scale: to.mark.width / from.mark.width,
        },
        word: {
          x: to.word.left - from.word.left,
          y: to.word.top - from.word.top,
          scale: to.word.width / from.word.width,
        },
      };
    };

    let cancelled = false;

    (async () => {
      const lockup: Lockup = LOCKUP;

      // Lay the vertical lockup out at the proportions of the supplied artwork.
      const stageEl = el.querySelector<HTMLElement>("[data-intro-stage]")!;
      const layout = () => {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const markH = Math.min(vh * 0.46, vw * 0.72, 430);
        const markW = markH * lockup.vertical.markAspect;
        // Exactly the supplied lockup's proportions — the wordmark's size and
        // its distance below the mark are both measured from the artwork, so
        // the composition the visitor holds on is the approved one.
        const wordH = markH * lockup.vertical.wordmarkHeight;
        const wordW = wordH * lockup.vertical.wordmarkAspect;
        const gap = markH * lockup.vertical.gap;

        const cvsH = markH / (INTRO.markRect.h / PAD);
        const cvsW = cvsH * (INTRO.atlas.width / INTRO.atlas.height);
        // The whole lockup is centred a little above the middle, so the
        // wordmark's arrival does not push the mark off centre.
        const totalH = markH + gap + wordH;
        const top = (vh - totalH) / 2;

        stageEl.style.cssText = `left:50%;top:${top}px;width:0;height:0`;
        const c = canvas.current!;
        c.style.cssText = `position:absolute;left:${-cvsW / 2}px;top:${markH / 2 - cvsH / 2}px;width:${cvsW}px;height:${cvsH}px`;
        const m = markEl.current!;
        m.style.cssText = `position:absolute;left:${-markW / 2}px;top:0;width:${markW}px;height:${markH}px;opacity:${m.style.opacity || 0}`;
        const w = wordEl.current!;
        w.style.cssText = `position:absolute;left:${-wordW / 2}px;top:${markH + gap}px;width:${wordW}px;height:${wordH}px;opacity:${w.style.opacity || 0}`;
        return {
          cvsW, cvsH, markW, wordW,
          markLeft: window.innerWidth / 2 - markW / 2,
          markTop: top,
          wordLeft: window.innerWidth / 2 - wordW / 2,
          wordTop: top + markH + gap,
        };
      };

      // Reduced motion: no morph, no torsion. The finished lockup appears, is
      // held briefly, and hands off. Nothing moves that does not have to.
      if (reduced) {
        const geo = layout();
        markEl.current!.style.opacity = "1";
        wordEl.current!.style.opacity = "1";
        canvas.current!.style.display = "none";
        const f = flight(lockup, geo);
        tl = gsap.timeline({ onComplete: finish });
        tl.to({}, { duration: 0.45 });
        if (f) {
          tl.to(markEl.current, { x: f.mark.x, y: f.mark.y, scale: f.mark.scale, duration: 0.5, ease: "power2.inOut" }, "fly")
            .to(wordEl.current, { x: f.word.x, y: f.word.y, scale: f.word.scale, duration: 0.5, ease: "power2.inOut" }, "fly")
            .to(backdrop.current, { opacity: 0, duration: 0.4 }, "fly+=0.1")
            .call(revealHeaderLogo, undefined, "fly+=0.44")
            .to([markEl.current, wordEl.current], { opacity: 0, duration: 0.12 }, "fly+=0.5");
        } else {
          tl.to(backdrop.current, { opacity: 0, duration: 0.4 });
        }
        return;
      }

      let atlasImg: HTMLImageElement;
      try {
        [atlasImg] = await Promise.all([
          loadImage(INTRO.assets.atlas),
          loadImage(MARK_SRC),
          loadImage(WORDMARK_SRC),
        ]);
      } catch {
        finish();
        return;
      }
      if (cancelled) return;

      let geo = layout();
      try {
        renderer = new IntroRenderer(canvas.current!, {
          atlas: atlasImg,
          atlasWidth: INTRO.atlas.width,
          atlasHeight: INTRO.atlas.height,
          pad: PAD,
          range: INTRO.atlas.range,
          pow: INTRO.atlas.pow,
          ramp: INTRO.ramp as unknown as number[][],
        });
      } catch {
        // No WebGL2: fall back to the reduced-motion path rather than nothing.
        finish();
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.resize(geo.cvsW, geo.cvsH, dpr);

      // Warm-up before a single tween runs.
      //
      // Linking a program is not the end of the cost: the driver uploads and
      // specialises it on the first draw that uses it, and that first draw was
      // landing inside the opening beat. Measured on this machine it stalled a
      // frame by ~750ms, with several more over 40ms around it — the sequence
      // visibly lurched out of black. Paying it here, against a fully faded-out
      // frame, costs nothing the viewer can see.
      renderer.render(stage as IntroUniforms);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (cancelled || done) return;
      renderer.render(stage as IntroUniforms);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (cancelled || done) return;

      // Development-only: records what each REAL frame actually rendered. Seeking
      // the timeline proves the curve is smooth in principle; only a trace of
      // live playback proves the frames the viewer sees are.
      const trace: { t: number; emerge: number; warp: number; fade: number }[] = [];
      const tracing =
        process.env.NODE_ENV !== "production" &&
        new URLSearchParams(location.search).has("introTrace");
      if (tracing) {
        (window as unknown as { __introTrace?: typeof trace }).__introTrace = trace;
      }

      // What is actually rendered, as opposed to what the timeline currently
      // holds. See `follow` below.
      const shown: Stage = { ...stage };

      /**
       * Rate limiter for the values that change the form's apparent SIZE.
       *
       * A time-based tween is correct but not smooth when frames are not
       * delivered evenly: after a 90ms gap it hands back a value 90ms further
       * along, and because the previous frame was on screen for that whole gap,
       * the change lands as one visible step. A trace of real playback showed
       * exactly that — single frames moving the silhouette 4-5%.
       *
       * Capping the change per RENDERED FRAME removes the failure mode by
       * construction rather than by tuning: in normal playback the per-frame
       * delta is below the cap and passes through untouched, and after a stall
       * the form simply lags a little and catches up over the next few frames.
       * The emergence finishes well before the morph needs it, so that lag has
       * somewhere to go.
       */
      const follow = (key: "emerge" | "warp", max: number) => {
        const d = stage[key] - shown[key];
        shown[key] += Math.abs(d) <= max ? d : Math.sign(d) * max;
      };

      const draw = () => {
        // Peak per-frame deltas at 60fps are ~0.010 (emerge) and ~0.55 (warp);
        // the caps sit just above those, so only a stall is ever clamped.
        follow("emerge", 0.0115);
        follow("warp", 0.65);
        shown.t1 = stage.t1;
        shown.t2 = stage.t2;
        shown.twist = stage.twist;
        shown.fold = stage.fold;
        shown.pore = stage.pore;
        shown.glow = stage.glow;
        shown.colorSpan = stage.colorSpan;
        shown.fade = stage.fade;
        renderer?.render(shown as IntroUniforms);
        if (tracing) {
          trace.push({
            t: tl ? +tl.time().toFixed(4) : 0,
            emerge: +shown.emerge.toFixed(4),
            warp: +shown.warp.toFixed(3),
            fade: +shown.fade.toFixed(3),
          });
        }
        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);

      tl = gsap.timeline({ onComplete: finish });

      // The whole sequence is staged to OVERLAP. An earlier cut ran each beat
      // end to end, which left roughly half a second after the leaf formed with
      // nothing changing, and that gap is what made the sequence read as a set
      // of steps. Every stage now begins while the one before it is still
      // finishing, so the form is never doing nothing.

      // 0.00-0.92  emergence out of black.
      //
      // One long, decelerating scale rather than the old distance-erosion, so
      // the mass swells continuously and settles instead of appearing at a
      // fraction of its size and then jumping. The opacity runs shorter than
      // the scale, so the form is fully present while it is still easing into
      // its final size — it arrives, then settles, rather than doing both at
      // once.
      // The growth deliberately does not start at t=0.
      //
      // A per-frame trace of real playback showed the first ~200ms delivering
      // only four frames while the page brings itself up — one gap was 92ms.
      // Any size change scheduled across that lands as a single visible step;
      // that gap alone was moving the silhouette 5.3% in one frame, which is
      // the pop. From ~0.2s onward frames arrive every ~13ms.
      //
      // So the opening 0.2s is held as the black/emerging beat the sequence
      // already calls for, and the entire scale change happens afterwards, in
      // the well-paced region, on a curve that starts and ends at zero
      // velocity. The starting scale is also higher than before, so there is
      // less total range for any remaining jitter to show up in.
      tl.to(stage, { emerge: 1, duration: 0.84, ease: "sine.inOut" }, 0.16)
        // Opacity leads the scale. A dropped frame inside a fade is far less
        // legible than one inside a size change, so the fade is what absorbs
        // the unsettled early frames.
        .to(stage, { fade: 1, duration: 0.4, ease: "sine.out" }, 0.14)
        // The membrane's life comes in only once there is a body to carry it.
        // Ramped earlier, a warp of this amplitude was a large fraction of the
        // small form's own radius and threw it about.
        .to(stage, { warp: 14, fold: 6.8, duration: 0.62, ease: "sine.inOut" }, 0.4)

        // 0.92-1.00  the cell mass lives. Nothing is tweened here: the shader's
        // own drifting noise carries the membrane, so this beat is free.

        // 1.00-1.95  cell -> leaf, then a short beat where the leaf stands alone. A long, slow S-curve rather than the shorter
        // power2 it used to be, so the volume redistributes gradually instead
        // of snapping through the middle of the morph.
        // sine.inOut rather than power1.inOut. The leaf's features — the tip and the
        // top of its channel — cross into visibility wherever this tween is
        // moving fastest, and a quadratic ease peaks at twice its average rate
        // where a sinusoidal one peaks at about 1.57x. Spreading that peak is
        // what stops the tip's notch from arriving as a discrete detail.
        .to(stage, { t1: 1, duration: 1.02, ease: "sine.inOut" }, 0.96)
        // The palette stretches with the form, so the same material keeps the
        // same yellow-to-teal descent as it elongates.
        .to(stage, { colorSpan: 0.94, duration: 1.06, ease: "sine.inOut" }, 0.96)
        // The membrane keeps a little life well into the morph and only settles
        // as the leaf resolves — the mass stays alive while it reorganises.
        .to(stage, { warp: 7, fold: 2.4, duration: 0.85, ease: "sine.inOut" }, 1.1)
        .to(stage, { warp: 0, fold: 0, duration: 0.5, ease: "sine.inOut" }, 1.9)

        // 1.78-2.60  torsion begins BEFORE the leaf has finished forming, so
        // the twist appears to take hold of material that is still moving.
        .to(stage, { twist: 1.72, duration: 0.82, ease: "sine.inOut" }, 1.78)

        // 2.12-2.94  differentiation into the mark, driven by the twist.
        // The shader scales the twist angle by (1 - t2), so this one tween both
        // resolves the silhouette AND retires the torsion. There is deliberately
        // no separate `twist -> 0`: releasing the angle on its own schedule is
        // what used to read as the logo correcting itself into place, and it
        // also pulled the twist out from under the differentiation just as the
        // channels were forming.
        .to(stage, { t2: 1, duration: 0.82, ease: "sine.inOut" }, 2.12)
        // Pores land last, as the final act of the differentiation.
        .to(stage, { pore: 1, duration: 0.6, ease: "sine.inOut" }, 2.36)
        // The material stops being luminous as it becomes a mark. This is also
        // what lets the shader and the artwork match exactly at the hand-over.
        .to(stage, { glow: 0, duration: 0.72, ease: "sine.inOut" }, 2.3)

        // 2.96-3.10  SETTLE. The shader holds the fully resolved mark, with
        // nothing animating, before anything else happens. The previous cut
        // began the hand-over while the twist was still unwinding, which put two
        // different silhouettes on screen at half opacity — the visible snap.
        .addLabel("resolved", 2.96)

        // 3.10-3.32  exact lock. Both silhouettes are now identical, so the
        // hand-over from the shader to the production artwork is invisible.
        .to(markEl.current, { opacity: 1, duration: 0.22, ease: "sine.inOut" }, 3.1)
        .to(stage, { fade: 0, duration: 0.22, ease: "sine.inOut" }, 3.12)

        // 3.38-3.72  wordmark, well clear of the mark settling
        .fromTo(
          wordEl.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.34, ease: "power2.out" },
          3.38,
        )
        // 3.72-3.88  the completed lockup holds
        .add("hold", 3.88);

      // 3.88-4.48  recompose into the header and reveal the site.
      // The targets are function-based so they are measured when the tween
      // first renders — the header's position is only knowable then, and this
      // keeps the whole flight on the timeline where it stays seekable and
      // cannot outlive the sequence.
      const land = (part: "mark" | "word", key: "x" | "y" | "scale") => () => {
        const f = flight(lockup, geo);
        return f ? f[part][key] : 0;
      };
      tl.to(
        markEl.current,
        { x: land("mark", "x"), y: land("mark", "y"), scale: land("mark", "scale"), duration: 0.46, ease: "power2.inOut" },
        "hold",
      )
        .to(
          wordEl.current,
          { x: land("word", "x"), y: land("word", "y"), scale: land("word", "scale"), duration: 0.46, ease: "power2.inOut" },
          "hold",
        )
        .to(backdrop.current, { opacity: 0, duration: 0.4, ease: "power2.inOut" }, "hold+=0.12")
        // Reveal the header's own logo while the intro's is STILL fully opaque
        // on top of it and pixel-aligned with it. Previously the header logo
        // stayed hidden until the timeline completed, so for about 80ms after
        // the flying lockup had faded there was no logo on screen at all — a
        // blink, which is what read as a swap. Bringing it up underneath means
        // at least one logo is fully present in every frame, and because they
        // coincide exactly the changeover cannot be seen. It is a `set`, not a
        // fade: cross-fading two copies of the same artwork would dip the
        // composite to about 75% brightness halfway through.
        .call(revealHeaderLogo, undefined, "hold+=0.40")
        .to([markEl.current, wordEl.current], { opacity: 0, duration: 0.12 }, "hold+=0.46")
        .to({}, { duration: 0.04 });

      const onResize = () => {
        geo = layout();
        renderer?.resize(geo.cvsW, geo.cvsH, Math.min(window.devicePixelRatio || 1, 2));
      };
      window.addEventListener("resize", onResize);
      const removeResize = () => window.removeEventListener("resize", onResize);

      // Development-only deterministic control, so visual QA can hold the
      // sequence on an exact beat. Dead code in a production bundle: the branch
      // is compile-time constant, and nothing outside it touches `window`.
      if (process.env.NODE_ENV !== "production") {
        const w = window as unknown as { __introSeek?: (t: number) => void };
        w.__introSeek = (t: number) => {
          tl?.pause(t);
          renderer?.render(stage as IntroUniforms);
        };
        if (new URLSearchParams(location.search).has("introPaused")) {
          tl.pause(0);
          clearTimeout(safety);
        }
        cleanupSeek = () => {
          delete w.__introSeek;
          removeResize();
        };
      } else {
        cleanupSeek = removeResize;
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(safety);
      if (raf) cancelAnimationFrame(raf);
      tl?.kill();
      renderer?.dispose();
      cleanupSeek?.();
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={root} className="intro-overlay" aria-hidden>
      <div ref={backdrop} className="intro-backdrop" />
      <div data-intro-stage className="intro-stage">
        <canvas ref={canvas} />
        {/* The finished mark and wordmark are the production assets, so the
            lockup the visitor ends on is exact rather than approximated.
            Plain <img> rather than next/image: these are already sized and
            compressed by the project's own asset pipeline, they are decorative
            (aria-hidden), and the flight needs to drive the element's own
            transform without an optimiser's wrapper and srcset in between. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={markEl} src={MARK_SRC} alt="" style={{ opacity: 0 }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={wordEl} src={WORDMARK_SRC} alt="" style={{ opacity: 0 }} />
      </div>
    </div>
  );
}
