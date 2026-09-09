/**
 * Site-wide chrome: brand, navigation, footer.
 * Source of truth for public copy: content/website-content.md (V2 authority).
 * Editorial "Content note" lines from that document are intentionally excluded.
 */

/**
 * The approved V5 logo, in its two supplied editions -- one drawn on black, one
 * on white. Keyed by the tone of the surface the logo sits ON, so call sites
 * read as intent ("this is a dark surface") rather than as a filename.
 *
 * V5 is supplied as a vertical lockup (mark above wordmark). Site chrome is
 * horizontal, so scripts/prepare-assets.mjs separates the two parts the artwork
 * already contains and sets them side by side, then prints the intrinsic sizes
 * recorded here. Each part keeps its own proportions and colours; nothing is
 * redrawn or recoloured. The two editions differ slightly in aspect (~3%)
 * because their supplied wordmarks do; they remain interchangeable at a given
 * render height.
 */
export const brandLogo = {
  dark: { src: "/brand/sayfer-bio-logo-on-dark.webp", width: 1400, height: 437 },
  light: { src: "/brand/sayfer-bio-logo-on-light.webp", width: 1400, height: 453 },
} as const;

export type SurfaceTone = keyof typeof brandLogo;

export const brand = {
  name: "Sayfer Bio",
  tagline: "Cultivated meat, beginning with structure.",
  supporting:
    "Developing a bone-like scaffold as a first step toward a cultivated-meat platform in India.",
  stage: "Early-stage research and development.",
};

/** Primary navigation. Order follows the V2 information architecture. */
export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Our Scaffold", href: "/our-scaffold" },
  { label: "About", href: "/about" },
  { label: "Consortium", href: "/consortium" },
  { label: "Team", href: "/team" },
  { label: "Archive", href: "/archive" },
];

export const contactLink = { label: "Contact", href: "/contact" };

export const footerNav = [
  {
    heading: "Company",
    links: [
      { label: "Home / Cultivated Meat", href: "/" },
      { label: "Our Scaffold", href: "/our-scaffold" },
      { label: "About & Platform Vision", href: "/about" },
      { label: "Consortium", href: "/consortium" },
      { label: "Team", href: "/team" },
      { label: "Archive", href: "/archive" },
    ],
  },
  {
    heading: "Get in touch",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Express consortium interest", href: "/consortium#express-interest" },
    ],
  },
  {
    heading: "Reference",
    links: [
      { label: "Sources & Further Reading", href: "/sources" },
      { label: "Privacy Notice", href: "/privacy" },
      { label: "Website Terms", href: "/terms" },
    ],
  },
];

export const footerNote =
  "This website describes research and development activities and future ambitions. It does not offer a consumer food product, guarantee a development outcome, or confirm regulatory authorization for a Sayfer Bio product.";

export const copyright = `© ${new Date().getFullYear()} Sayfer Bio. All rights reserved.`;
