import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { Container, Section, ActionLink } from "@/components/site/Page";
import * as ar from "@/content/archive";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Separate initiatives and exploratory work associated with the founder, included for context and not part of Sayfer Bio's active cultivated-meat programme.",
};

export default function ArchivePage() {
  return (
    <main className="relative z-10">
      <section className="pt-32 pb-14 md:pt-40 md:pb-20">
        <Container>
          <Reveal className="max-w-3xl" stagger>
            <p className="label mb-6">{ar.hero.eyebrow}</p>
            <h1 className="statement text-[2.2rem] leading-[1.08] sm:text-4xl md:text-[3rem]">
              {ar.hero.headline}
            </h1>
            <div className="prose-body measure mt-8">
              {ar.hero.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      <Container>
        <div className="border-t border-hairline">
          {ar.entries.map((e) => (
            <Reveal key={e.name}>
              <article className="grid gap-6 border-b border-hairline py-12 md:grid-cols-[1fr_2fr] md:gap-12 md:py-16">
                <div>
                  <h2 className="font-display text-2xl text-ivory">{e.name}</h2>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-muted">
                    {e.status}
                  </p>
                </div>
                <div className="prose-body max-w-[62ch]">
                  <p className="text-ivory">{e.summary}</p>
                  <p>{e.overview}</p>
                  {e.extra ? (
                    <p>
                      <span className="text-ivory">{e.extra.label}. </span>
                      {e.extra.body}
                    </p>
                  ) : null}
                  <p className="text-muted">{e.relationship}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>

      <Section>
        <Reveal className="max-w-2xl">
          <p className="text-lg text-ivory">{ar.closing.body}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
            {ar.closing.actions.map((a, i) => (
              <ActionLink key={a.href} {...a} primary={i === 0} />
            ))}
          </div>
        </Reveal>
      </Section>
    </main>
  );
}
