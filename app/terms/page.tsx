import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { Container, PageHero } from "@/components/site/Page";
import { terms } from "@/content/legal";

export const metadata: Metadata = {
  title: "Website Terms",
  description:
    "The informational purpose and limits of the Sayfer Bio website, development-stage descriptions, and permitted use of content.",
};

export default function TermsPage() {
  return (
    <main className="relative z-10">
      <PageHero eyebrow={terms.hero.eyebrow} headline={terms.hero.headline}>
        <p className="measure text-lg leading-relaxed text-mist">
          {terms.hero.body}
        </p>
      </PageHero>

      <Container>
        <div className="max-w-3xl border-t border-hairline py-12">
          <Reveal>
            <p className="measure border-l-2 border-hairline-strong pl-4 text-sm leading-relaxed text-muted">
              {terms.draftNotice}
            </p>
            <div className="mt-12 flex flex-col">
              {terms.statements.map((st, i) => (
                <div
                  key={st.label}
                  className={`py-6 ${i > 0 ? "border-t border-hairline" : ""}`}
                >
                  <h2 className="font-display text-base text-ivory">
                    {st.label}
                  </h2>
                  <p className="mt-2 max-w-[64ch] text-sm leading-relaxed text-mist">
                    {st.body}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </main>
  );
}
