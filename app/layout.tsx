import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { IntroOverlay } from "@/components/intro/IntroOverlay";
import { INTRO_FLAG } from "@/components/intro/introConfig";
import { INTRO_DATA } from "@/components/intro/introData.generated";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sayfer.bio"),
  title: {
    default: "Sayfer Bio — Cultivated meat, beginning with structure",
    template: "%s — Sayfer Bio",
  },
  description:
    "Sayfer Bio is an early-stage cultivated-meat company in India, developing a zein-based, bone-like scaffold as a first step toward a cultivated-meat platform.",
};

/** The intro's binaries, in the order it needs them. */
const INTRO_PRELOAD = [
  INTRO_DATA.assets.atlas,
  INTRO_DATA.assets.mark.src,
  INTRO_DATA.assets.wordmark.src,
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
      // The intro's pre-paint script stamps data-intro here before React
      // hydrates, which is the whole point of it — so the difference is
      // expected rather than a mismatch to report.
      suppressHydrationWarning
    >
      <body className="min-h-full">
        {/* Decides before first paint whether this session gets the intro, so
            neither the overlay nor the site is ever briefly visible in the
            wrong state. Nothing is recorded beyond one session-scoped flag.

            When the intro IS going to run, it also starts the three binaries
            downloading right here. They were previously requested only once the
            component had mounted and resolved its metadata, which put a serial
            waterfall in front of the first frame — and that delay is spent
            looking at a black screen. Returning visitors, who will not see the
            intro, are never asked to download them. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              `try{if(!sessionStorage.getItem(${JSON.stringify(INTRO_FLAG)})){` +
              `document.documentElement.dataset.intro="running";` +
              `for(const u of ${JSON.stringify(INTRO_PRELOAD)}){` +
              `var l=document.createElement("link");l.rel="preload";l.as="image";l.href=u;` +
              `document.head.appendChild(l)}}}catch(e){}`,
          }}
        />
        <IntroOverlay />
        <SiteNav />
        {children}
        <SiteFooter />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
