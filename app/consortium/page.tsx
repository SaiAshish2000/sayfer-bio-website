import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import {
  Section,
  PageHero,
  Prose,
  SectionHeading,
  DefinitionRows,
  Note,
  ActionRow,
} from "@/components/site/Page";
import { DataForm, type Field } from "@/components/site/Forms";
import * as c from "@/content/consortium";

export const metadata: Metadata = {
  title: "Consortium",
  description:
    "Sayfer Bio is inviting expressions of interest in forming a cultivated-meat industry consortium in India. A proposed initiative, gathering expressions of interest.",
};

export default function ConsortiumPage() {
  return (
    <main className="relative z-10">
      <PageHero eyebrow={c.hero.eyebrow} headline={c.hero.headline}>
        <div className="prose-body measure">
          <p>{c.hero.body}</p>
          <p>{c.hero.supporting}</p>
        </div>

        <p className="mt-6 text-sm text-muted">{c.hero.status}</p>

        <ActionRow className="mt-8" actions={[c.hero.action]} />
      </PageHero>

      <Section hold>
        <Reveal>
          <SectionHeading>{c.whatIsProposed.heading}</SectionHeading>

          <Prose className="mt-6" paragraphs={c.whatIsProposed.body} />
        </Reveal>
      </Section>

      <Section>
        <Reveal className="lg:max-w-[60%]">
          <SectionHeading>{c.whoIsInvited.heading}</SectionHeading>
        </Reveal>

        <Reveal
          className="mt-10 grid gap-x-12 gap-y-4 sm:grid-cols-2"
          stagger
        >
          {c.whoIsInvited.groups.map((g) => (
            <p
              key={g}
              className="border-t border-hairline pt-4 text-sm leading-relaxed text-mist"
            >
              {g}
            </p>
          ))}
        </Reveal>

        <Reveal>
          <Note>{c.whoIsInvited.note}</Note>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <SectionHeading>{c.collaborationAreas.heading}</SectionHeading>

          <DefinitionRows rows={c.collaborationAreas.rows} />

          <Note>{c.collaborationAreas.note}</Note>
        </Reveal>
      </Section>

      <Section hold>
        <Reveal>
          <SectionHeading>{c.principles.heading}</SectionHeading>

          <Prose className="mt-6" paragraphs={c.principles.body} />
        </Reveal>
      </Section>

      <Section hold>
        <Reveal>
          <SectionHeading>{c.afterInterest.heading}</SectionHeading>

          <Prose className="mt-6" paragraphs={c.afterInterest.body} />
        </Reveal>
      </Section>

      <section
        id="express-interest"
        className="scroll-mt-24 border-t border-hairline py-20 md:py-28"
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <Reveal className="max-w-2xl">
            <SectionHeading>{c.form.heading}</SectionHeading>

            <div className="max-w-2xl">
              <DataForm
                fields={c.form.fields as Field[]}
                consent={c.form.consent}
                updates={c.form.updates}
                submitLabel={c.form.submitLabel}
                beforeSubmitNote={c.form.intro}
                submit={{
                  endpoint: "/api/consortium",
                  turnstileSiteKey:
                    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
                  messages: {
                    success: c.form.success,
                    failure: c.form.failure,
                    unavailable:
                      "The consortium expression-of-interest form is temporarily unavailable. Please try again later.",
                  },
                }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      <Section hold>
        <Reveal>
          <SectionHeading>Consortium questions</SectionHeading>
        </Reveal>

        <Reveal className="mt-8 flex flex-col">
          {c.faqs.map((f, i) => (
            <details
              key={f.q}
              className={`group py-5 ${
                i > 0 ? "border-t border-hairline" : ""
              }`}
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
    </main>
  );
}