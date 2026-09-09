import Image from "next/image";
import type { CSSProperties } from "react";
import { brand, brandLogo, type SurfaceTone } from "@/content/site";

/**
 * The approved Sayfer Bio V5 logo. Two editions exist -- one drawn on black,
 * one on white -- so the correct one is chosen by the tone of the surface it
 * sits on.
 *
 * `on` describes the BACKGROUND, not the logo: `on="dark"` means "this sits on
 * a dark/near-black surface", which selects the black-edition artwork. Site
 * chrome is dark throughout, hence the default.
 *
 * V5 ships as a vertical lockup; scripts/prepare-assets.mjs relays it out
 * horizontally (mark left, wordmark right) so it fits the 72px nav row at the
 * same height the previous mark used. Because each edition already matches its
 * surface, the logo needs no ivory chip or backdrop-matched wrapper.
 *
 * The dark edition ships on opaque pure black, which painted a visible box on
 * the site's near-black chrome. That is handled once, in the asset pipeline
 * (scripts/prepare-assets.mjs), by carrying the black in the alpha channel --
 * so nothing here needs a blend mode, and it is correct against the nav at
 * rest, the translucent scrolled nav, and the solid footer alike.
 */
export function BrandLogo({
  className = "",
  priority = false,
  height = 44,
  mobileHeight,
  on = "dark",
}: {
  className?: string;
  priority?: boolean;
  height?: number;
  /**
   * Optional smaller height below `lg` — the same breakpoint at which SiteNav
   * swaps its links for the Menu control, so the mark scales with the header it
   * belongs to. Both heights derive their width from the one intrinsic ratio,
   * so the aspect is identical at either size. Omitted -> one size everywhere.
   */
  mobileHeight?: number;
  /** Tone of the surface the logo is placed on. */
  on?: SurfaceTone;
}) {
  const variant = brandLogo[on];
  const widthFor = (h: number) => Math.round((h * variant.width) / variant.height);
  const width = widthFor(height);
  const smallHeight = mobileHeight ?? height;
  const smallWidth = widthFor(smallHeight);
  return (
    <span className={`inline-flex items-center ${className}`}>
      {/* Rendered (not intrinsic) dimensions, so next/image generates a srcset
          around the size actually painted, rather than the intrinsic 1400px
          width -- which would otherwise serve a multi-hundred-KB candidate for
          a mark painted ~128px wide. The srcset is
          built from the larger of the two sizes, so the smaller one is still
          served comfortably above 2x.
          Size comes from CSS custom properties rather than inline width/height
          so it can be responsive; the class names stay static literals so
          Tailwind can still see them. */}
      <Image
        src={variant.src}
        alt={`${brand.name} logo`}
        width={width}
        height={height}
        priority={priority}
        className="h-[var(--logo-h-sm)] w-[var(--logo-w-sm)] lg:h-[var(--logo-h)] lg:w-[var(--logo-w)]"
        style={
          {
            "--logo-h-sm": `${smallHeight}px`,
            "--logo-w-sm": `${smallWidth}px`,
            "--logo-h": `${height}px`,
            "--logo-w": `${width}px`,
          } as CSSProperties
        }
      />
    </span>
  );
}
