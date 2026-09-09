import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import {
  Section,
  PageHero,
  SectionHeading,
  DefinitionRows,
} from "@/components/site/Page";
import { DataForm, type Field } from "@/components/site/Forms";
import * as ct from "@/content/contact";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Sayfer Bio about scaffold evaluation, research collaboration, laboratory or technical support, cultivated-meat ecosystem development, investment, or a general inquiry.",
};

export default function ContactPage() {
  return (
    <main className="relative z-10">
      <PageHero eyebrow={ct.hero.eyebrow} headline={ct.hero.headline}>
        <div className="prose-body measure">
          <p>{ct.hero.body}</p>
          <p>{ct.hero.supporting}</p>
        </div>
      </PageHero>

      <Section>
        <Reveal>
          <SectionHeading>{ct.categories.heading}</SectionHeading>
          <DefinitionRows rows={ct.categories.rows} />
        </Reveal>
      </Section>

      <Section className="border-t border-hairline">
        <Reveal className="max-w-2xl">
          <SectionHeading>{ct.form.heading}</SectionHeading>
          <DataForm
            fields={ct.form.fields as Field[]}
            consent={ct.form.consent}
            submitLabel={ct.form.submitLabel}
            beforeSubmitNote={ct.form.intro}
            submit={{
              endpoint: "/api/contact",
              // Public by design; the matching secret never leaves the server.
              turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
              messages: {
                success: ct.form.messages.success,
                failure: ct.form.messages.failure,
                unavailable: ct.form.messages.unavailable,
              },
            }}
          />
        </Reveal>
      </Section>

      <Section className="border-t border-hairline" hold>
        <Reveal>
          <SectionHeading>{ct.directContact.heading}</SectionHeading>
          <p className="measure mt-6 text-sm leading-relaxed text-mist">
            {ct.directContact.body}
          </p>
          <ul className="mt-6 flex flex-col gap-2">
            {ct.directContact.pending.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-muted">
                <span className="font-mono text-xs text-faint">pending</span>
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>
    </main>
  );
}
