import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { ScaffoldSceneRoot } from "@/components/scene/scaffold/ScaffoldSceneRoot";
import {
  Section,
  Prose,
  SectionHeading,
  DefinitionRows,
  Note,
  ActionRow,
} from "@/components/site/Page";
import * as s from "@/content/scaffold";

export const metadata: Metadata = {
  title: "Our Scaffold",
  description:
    "Sayfer Bio is developing a zein-based, bone-like scaffold intended for food applications and potential integration into structured cultivated-meat products.",
};

export default function ScaffoldPage() {
  return (
    <>
      <ScaffoldSceneRoot />

      <main className="relative z-10">
        <section className="flex min-h-[92vh] items-end pb-[14vh] pt-32">
          <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12">
            <Reveal className="max-w-[34rem]" stagger>
              <p className="label mb-6">{s.hero.eyebrow}</p>
              <h1 className="statement text-[2.4rem] leading-[1.05] sm:text-5xl md:text-[3.4rem]">
                {s.hero.headline}
              </h1>
              <div className="prose-body measure mt-8">
                <p>{s.hero.body}</p>
                <p>{s.hero.objective}</p>
              </div>
              <p className="mt-6 text-sm text-accent-bright">{s.hero.status}</p>
            </Reveal>
          </div>
        </section>

      <Section hold>
        <Reveal>
          <SectionHeading>{s.whatWeAreDeveloping.heading}</SectionHeading>
          <Prose className="mt-6" paragraphs={s.whatWeAreDeveloping.body} />
        </Reveal>
      </Section>

      <Section hold>
        <Reveal>
          <SectionHeading>{s.whyScaffold.heading}</SectionHeading>
          <Prose className="mt-6" paragraphs={s.whyScaffold.body} />
        </Reveal>
      </Section>

      <Section hold>
        <Reveal>
          <SectionHeading>{s.twoFunctions.heading}</SectionHeading>
        </Reveal>
        <Reveal className="mt-12 grid gap-y-10" stagger>
          {s.twoFunctions.functions.map((f) => (
            <div key={f.title} className="border-t border-hairline pt-6">
              <h3 className="font-display text-lg text-ivory">{f.title}</h3>
              <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-mist">
                {f.body}
              </p>
            </div>
          ))}
        </Reveal>
        <Reveal>
          <Note>{s.twoFunctions.note}</Note>
        </Reveal>
      </Section>

      <Section hold>
        <Reveal>
          <SectionHeading>{s.currentStage.heading}</SectionHeading>
          <DefinitionRows rows={s.currentStage.rows} />
        </Reveal>
      </Section>

      <Section hold>
        <Reveal>
          <SectionHeading>{s.nextQuestions.heading}</SectionHeading>
          <DefinitionRows rows={s.nextQuestions.rows} />
          <Note>{s.nextQuestions.note}</Note>
        </Reveal>
      </Section>

      <Section className="border-t border-hairline" hold>
        <Reveal stagger>
          <SectionHeading>{s.whoShouldContact.heading}</SectionHeading>
          <Prose className="mt-6" paragraphs={s.whoShouldContact.body} />
          <ActionRow className="mt-9" actions={[s.whoShouldContact.action]} />
          <Note>{s.whoShouldContact.guidance}</Note>
        </Reveal>
      </Section>
      </main>
    </>
  );
}
