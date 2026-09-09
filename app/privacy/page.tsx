import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { Container, PageHero } from "@/components/site/Page";
import { privacy } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description:
    "How information submitted through the Sayfer Bio website is handled, including general inquiries and consortium expressions of interest.",
};

export default function PrivacyPage() {
  return (
    <main className="relative z-10">
      <PageHero eyebrow={privacy.hero.eyebrow} headline={privacy.hero.headline}>
        <p className="measure text-lg leading-relaxed text-mist">
          {privacy.hero.body}
        </p>
      </PageHero>

      <Container>
        <div className="max-w-3xl border-t border-hairline py-12">
          <Reveal>
            <p className="measure border-l-2 border-hairline-strong pl-4 text-sm leading-relaxed text-muted">
              {privacy.draftNotice}
            </p>

            <h2 className="mt-12 font-display text-lg text-ivory">
              Sections this notice will cover
            </h2>
            <ol className="mt-5 flex flex-col gap-3">
              {privacy.sections.map((s, i) => (
                <li
                  key={s}
                  className="grid grid-cols-[2rem_1fr] gap-3 border-t border-hairline pt-3 text-sm text-mist"
                >
                  <span className="font-mono text-xs text-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s}
                </li>
              ))}
            </ol>

            <h2 className="mt-12 font-display text-lg text-ivory">
              Details still to be confirmed
            </h2>
            <ul className="mt-5 flex flex-col gap-2">
              {privacy.pending.map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm text-muted">
                  <span className="font-mono text-xs text-faint">pending</span>
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </main>
  );
}
