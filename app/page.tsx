import type { Metadata } from "next";
import { HomeSceneRoot } from "@/components/scene/home/HomeSceneRoot";
import { Reveal } from "@/components/motion/Reveal";
import {
  Container,
  Section,
  Prose,
  SectionHeading,
  Note,
  ActionRow,
  ActionLink,
} from "@/components/site/Page";
import * as home from "@/content/home";

export const metadata: Metadata = {
  title: "Cultivated meat, beginning with structure",
  description:
    "Cultivated meat is produced by growing animal cells in a controlled environment. Sayfer Bio is working toward a cultivated-meat platform in India, beginning with a bone-like scaffold.",
};

export default function HomePage() {
  return (
    <>
      <HomeSceneRoot />

      <main className="relative z-10">
        {/* Hero: text left, spindle + cells in the right/background field */}
        <section className="flex min-h-[100dvh] items-end pb-[16vh] pt-32">
          <Container>
            <Reveal className="max-w-[34rem]" stagger>
              <p className="label mb-7">{home.hero.eyebrow}</p>
              <h1 className="statement text-[2.6rem] leading-[1.05] sm:text-5xl md:text-[4rem]">
                {home.hero.headline}
              </h1>
              <p className="mt-8 max-w-[46ch] text-base leading-relaxed text-mist">
                {home.hero.body}
              </p>
              <p className="mt-4 max-w-[42ch] text-sm text-muted">
                {home.hero.supporting}
              </p>
              <ActionRow className="mt-10" actions={home.hero.actions} />
            </Reveal>
          </Container>
        </section>

        {/* What is cultivated meat */}
        <Section id="what-is-it" hold>
          <Reveal>
            <SectionHeading>{home.whatIsIt.heading}</SectionHeading>
            <Prose className="mt-6" paragraphs={home.whatIsIt.body} />
          </Reveal>
        </Section>

        {/* How is it made - numbered steps */}
        <Section hold>
          <Reveal>
            <SectionHeading>{home.howItsMade.heading}</SectionHeading>
            <p className="measure mt-5 text-sm text-muted">
              {home.howItsMade.intro}
            </p>
          </Reveal>
          <Reveal className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2" stagger>
            {home.howItsMade.steps.map((s, i) => (
              <div key={s.title}>
                <span className="font-mono text-xs text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-lg text-ivory">{s.title}</h3>
                <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-mist">
                  {s.body}
                </p>
              </div>
            ))}
          </Reveal>
          <Reveal>
            <Note>{home.howItsMade.note}</Note>
          </Reveal>
        </Section>

        {/* Why develop - two-column reasoning */}
        <Section hold>
          <Reveal>
            <SectionHeading>{home.whyDevelop.heading}</SectionHeading>
            <p className="measure mt-5 text-base leading-relaxed text-mist">
              {home.whyDevelop.intro}
            </p>
          </Reveal>
          <Reveal className="mt-14 grid gap-x-12 gap-y-12 md:grid-cols-2" stagger>
            {home.whyDevelop.points.map((p) => (
              <div key={p.title} className="border-t border-hairline pt-6">
                <h3 className="font-display text-lg text-ivory">{p.title}</h3>
                <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-mist">
                  {p.body}
                </p>
              </div>
            ))}
          </Reveal>
          <Reveal>
            <Note>{home.whyDevelop.qualification}</Note>
          </Reveal>
        </Section>

        {/* What still needs solving */}
        <Section hold>
          <Reveal>
            <SectionHeading>{home.toSolve.heading}</SectionHeading>
            <Prose className="mt-6" paragraphs={home.toSolve.body} />
          </Reveal>
        </Section>

        {/* Where Sayfer Bio begins - key editorial moment */}
        <Section id="where-we-begin" className="border-t border-hairline">
          <Reveal className="max-w-3xl" stagger>
            <p className="label mb-6">{home.whereWeBegin.eyebrow}</p>
            <h2 className="statement text-3xl md:text-[2.8rem]">
              {home.whereWeBegin.heading}
            </h2>
            <Prose className="mt-8" paragraphs={home.whereWeBegin.body} />
            <p className="mt-8 max-w-[52ch] text-sm leading-relaxed text-accent-bright">
              {home.whereWeBegin.stage}
            </p>
            <ActionRow className="mt-10" actions={[home.whereWeBegin.action]} />
          </Reveal>
        </Section>

        {/* Platform ambition */}
        <Section hold>
          <Reveal>
            <SectionHeading>{home.platform.heading}</SectionHeading>
            <Prose className="mt-6" paragraphs={home.platform.body} />
            <ActionRow className="mt-9" actions={[home.platform.action]} />
          </Reveal>
        </Section>

        {/* Consortium invitation band */}
        <section className="border-y border-hairline bg-ground/60 py-20 md:py-28">
          <Container>
            <Reveal className="max-w-3xl" stagger>
              <p className="label mb-6">{home.consortiumCta.eyebrow}</p>
              <h2 className="statement text-2xl md:text-[2.1rem]">
                {home.consortiumCta.heading}
              </h2>
              <Prose className="mt-6" paragraphs={home.consortiumCta.body} />
              <p className="mt-6 text-sm text-muted">
                {home.consortiumCta.status}
              </p>
              <ActionRow className="mt-9" actions={[home.consortiumCta.action]} />
            </Reveal>
          </Container>
        </section>

        {/* FAQ accordion */}
        <Section hold>
          <Reveal>
            <SectionHeading>Common questions</SectionHeading>
          </Reveal>
          <Reveal className="mt-10 flex flex-col">
            {home.faqs.map((f, i) => (
              <details
                key={f.q}
                className={`group py-5 ${i > 0 ? "border-t border-hairline" : ""}`}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-display text-base text-ivory marker:content-none">
                  {f.q}
                  <span
                    aria-hidden
                    className="mt-1 shrink-0 text-muted transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-mist">
                  {f.a}
                </p>
              </details>
            ))}
          </Reveal>
        </Section>

        {/* Closing */}
        <Section className="border-t border-hairline">
          <Reveal className="max-w-2xl" stagger>
            <h2 className="statement text-3xl md:text-[2.6rem]">
              {home.closing.heading}
            </h2>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-mist">
              {home.closing.body}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              {home.closing.actions.map((a, i) => (
                <ActionLink key={a.href} {...a} primary={i === 0} />
              ))}
            </div>
          </Reveal>
        </Section>
      </main>
    </>
  );
}
