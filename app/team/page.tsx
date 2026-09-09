import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import {
  Section,
  PageHero,
  SectionHeading,
  ActionRow,
  Note,
} from "@/components/site/Page";
import * as t from "@/content/team";

export const metadata: Metadata = {
  title: "Team",
  description:
    "Sayfer Bio is led by one founder, supported by a research and ecosystem development associate and strategic advisers.",
};

/**
 * The contact links on a card. Shared by both card kinds so the placeholder
 * card carries exactly the same treatment as an ordinary one.
 */
function MemberLinks({ linkedin, email }: { linkedin?: string; email?: string }) {
  return (
    <>
      {linkedin ? (
        <a
          href={linkedin}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-fit items-center gap-2 border-b border-hairline-strong pb-0.5 text-sm text-ivory transition-colors hover:border-accent-bright"
        >
          LinkedIn
        </a>
      ) : null}
      {email ? (
        <a
          href={`mailto:${email}`}
          className="mt-2 inline-flex w-fit border-b border-hairline-strong pb-0.5 text-sm text-mist transition-colors hover:border-accent-bright hover:text-ivory"
        >
          {email}
        </a>
      ) : null}
    </>
  );
}

function Card({ member }: { member: t.Member }) {
  return (
    <article className="flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-hairline bg-ground">
        {member.image ? (
          <Image
            src={member.image}
            alt={`Portrait of ${member.name}`}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 30vw"
            className="object-cover object-top grayscale-[0.15]"
          />
        ) : null}
      </div>
      <p className="label mt-5">{member.role}</p>
      <h3 className="mt-2 font-display text-xl text-ivory">{member.name}</h3>
      {member.blurb ? (
        <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-mist">
          {member.blurb}
        </p>
      ) : null}
      <MemberLinks linkedin={member.linkedin} email={member.email} />
    </article>
  );
}

function PlaceholderCard() {
  return (
    <article className="flex flex-col">
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg border border-dashed border-hairline-strong bg-ground/40">
        <span className="px-6 text-center font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
          Profile pending
        </span>
      </div>
      <p className="label mt-5">{t.associatePlaceholder.role}</p>
      <h3 className="mt-2 font-display text-xl text-ivory">
        {t.associatePlaceholder.name}
      </h3>
      <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-muted">
        {t.associatePlaceholder.note}
      </p>
      <MemberLinks
        linkedin={t.associatePlaceholder.linkedin}
        email={t.associatePlaceholder.email}
      />
    </article>
  );
}

export default function TeamPage() {
  return (
    <main className="relative z-10">
      <PageHero eyebrow={t.hero.eyebrow} headline={t.hero.headline}>
        <div className="prose-body measure">
          <p>{t.hero.body}</p>
          <p>{t.hero.supporting}</p>
        </div>
      </PageHero>

      <Section>
        <Reveal className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" stagger>
          <Card member={t.founder} />
          <PlaceholderCard />
        </Reveal>
      </Section>

      <Section className="border-t border-hairline">
        <Reveal>
          <SectionHeading>Advisers</SectionHeading>
          <p className="measure mt-5 text-sm leading-relaxed text-mist">
            {t.advisersIntro}
          </p>
        </Reveal>
        <Reveal
          className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
          stagger
        >
          {t.advisers.map((m) => (
            <Card key={m.name} member={m} />
          ))}
        </Reveal>
      </Section>

      <Section className="border-t border-hairline" hold>
        <Reveal stagger>
          <SectionHeading>{t.connect.heading}</SectionHeading>
          <p className="measure mt-6 text-base leading-relaxed text-mist">
            {t.connect.body}
          </p>
          <ActionRow className="mt-9" actions={[t.connect.action]} />
          <Note>{t.connect.note}</Note>
        </Reveal>
      </Section>
    </main>
  );
}
