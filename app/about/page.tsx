import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import {
  Section,
  Container,
  Prose,
  SectionHeading,
  ActionRow,
} from "@/components/site/Page";
import { HeroField } from "@/components/about/HeroField";
import { StageProgression } from "@/components/about/StageProgression";
import * as a from "@/content/about";

export const metadata: Metadata = {
  title: "About & Platform Vision",
  description:
    "Sayfer Bio is an early-stage cultivated-meat company progressing from scaffold development toward a broader cultivated-meat platform in India.",
};

export default function AboutPage() {
  return (
    <main className="relative z-10">
      {/*
        Typography-led hero. Home leads with the spindle and Our Scaffold with
        the scaffold; About leads with the argument, so the visual stays a
        background depth field behind and to the right of the type, never a
        second hero object and never underneath the copy.
      */}
      <section className="relative overflow-hidden pt-32 pb-14 md:pt-36 md:pb-20">
        {/*
          Anchored to START where the text column ends (the copy is capped at
          58%), rather than sized by width — a width-based box overlapped the
          body copy by 200-370px depending on viewport. Decorative depth must
          never sit under running text.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[60%] right-[-8%] top-16 hidden opacity-[0.55] lg:block"
        >
          <HeroField className="h-auto w-full" />
        </div>
        <Container>
          <Reveal className="relative lg:max-w-[58%]" stagger>
            <p className="label mb-6">{a.hero.eyebrow}</p>
            <h1 className="statement text-[2.4rem] leading-[1.05] sm:text-5xl md:text-[3.4rem]">
              {a.hero.headline}
            </h1>
            <div className="prose-body measure mt-8">
              <p>{a.hero.body}</p>
              <p>{a.hero.supporting}</p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Mission / vision: two statements on hairlines, no boxes. */}
      <Section>
        <div className="grid gap-10 md:grid-cols-2">
          {a.missionVision.map((m) => (
            <Reveal key={m.label} className="border-t border-hairline pt-6">
              <p className="mb-4 font-display text-sm text-muted">{m.label}</p>
              <p className="text-lg leading-relaxed text-ivory">{m.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section hold>
        <Reveal>
          <SectionHeading>{a.whatPlatformMeans.heading}</SectionHeading>
          <Prose className="mt-6" paragraphs={a.whatPlatformMeans.body} />
        </Reveal>
      </Section>

      {/*
        The four-stage progression. Deliberately not a stepper or a card grid:
        one continuous process rail, an evolving visual system, and a different
        spatial relationship at each stage. Nothing here states that a stage is
        complete — each carries the authority's own status wording.
      */}
      <section className="py-16 md:py-24">
        <Container>
          <Reveal className="lg:max-w-[62%]">
            <SectionHeading>{a.developmentDirection.heading}</SectionHeading>
            <p className="measure mt-6 text-base leading-relaxed text-mist">
              {a.developmentDirection.note}
            </p>
          </Reveal>
        </Container>
        <div className="mt-16 md:mt-24">
          <StageProgression stages={a.developmentDirection.stages} />
        </div>
        <Container>
          <Reveal>
            <p className="measure mt-20 border-t border-hairline pt-6 text-xs leading-relaxed text-faint">
              A representative progression. Stages beyond the current priority
              depend on evaluation results and are not a committed timetable.
            </p>
          </Reveal>
        </Container>
      </section>

      <Section hold>
        <Reveal>
          <SectionHeading>{a.whyIndia.heading}</SectionHeading>
          <Prose className="mt-6" paragraphs={a.whyIndia.body} />
        </Reveal>
      </Section>

      <Section className="border-t border-hairline" hold>
        <Reveal stagger>
          <SectionHeading>{a.howWeBuild.heading}</SectionHeading>
          <Prose className="mt-6" paragraphs={a.howWeBuild.body} />
          <ActionRow className="mt-10" actions={a.howWeBuild.actions} />
        </Reveal>
      </Section>
    </main>
  );
}
