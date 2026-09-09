import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { Container, PageHero } from "@/components/site/Page";
import * as src from "@/content/sources";

export const metadata: Metadata = {
  title: "Sources & Further Reading",
  description:
    "Public scientific and institutional references that support the educational explanations on this website.",
};

export default function SourcesPage() {
  return (
    <main className="relative z-10">
      <PageHero eyebrow={src.hero.eyebrow} headline={src.hero.headline}>
        <div className="prose-body measure">
          {src.hero.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </PageHero>

      <Container>
        <div className="max-w-3xl">
          {src.groups.map((group) => (
            <Reveal key={group.heading}>
              <section className="border-t border-hairline py-10">
                <h2 className="font-display text-lg text-ivory">
                  {group.heading}
                </h2>
                <ul className="mt-6 flex flex-col gap-8">
                  {group.sources.map((s) => (
                    <li key={s.n} className="grid grid-cols-[2rem_1fr] gap-4">
                      <span className="font-mono text-xs text-muted">
                        [{s.n}]
                      </span>
                      <div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-display text-base text-ivory underline decoration-hairline-strong underline-offset-4 transition-colors hover:decoration-accent-bright"
                        >
                          {s.title}
                        </a>
                        <p className="mt-1 text-sm text-mist">{s.publisher}</p>
                        {s.date ? (
                          <p className="mt-1 text-xs text-faint">{s.date}</p>
                        ) : null}
                        <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-muted">
                          {s.note}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          ))}
        </div>
      </Container>
      <div className="h-16 md:h-24" />
    </main>
  );
}
