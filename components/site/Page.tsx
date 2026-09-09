import type { ReactNode } from "react";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1400px] px-6 md:px-12 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Vertical section rhythm. `hold` keeps content in the left column on wide
 * viewports so a right-side visual (flagship pages) never collides with type.
 */
export function Section({
  id,
  children,
  className = "",
  hold = false,
}: {
  id?: string;
  children?: ReactNode;
  className?: string;
  hold?: boolean;
}) {
  return (
    <section id={id} className={`py-16 md:py-24 ${className}`}>
      <Container>
        <div className={hold ? "lg:max-w-[62%]" : ""}>{children}</div>
      </Container>
    </section>
  );
}

export function PageHero({
  eyebrow,
  headline,
  children,
  hold = false,
}: {
  eyebrow?: string;
  headline: string;
  children?: ReactNode;
  hold?: boolean;
}) {
  return (
    <section className="pt-32 pb-10 md:pt-36 md:pb-12">
      <Container>
        <Reveal className={hold ? "lg:max-w-[62%]" : "max-w-3xl"} stagger>
          {eyebrow ? <p className="label mb-6">{eyebrow}</p> : null}
          <h1 className="statement text-[2.4rem] leading-[1.05] sm:text-5xl md:text-[3.4rem]">
            {headline}
          </h1>
          {children ? <div className="mt-8">{children}</div> : null}
        </Reveal>
      </Container>
    </section>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  return (
    <p className="measure text-lg leading-relaxed text-mist">{children}</p>
  );
}

export function Prose({
  paragraphs,
  className = "",
}: {
  paragraphs: string[];
  className?: string;
}) {
  return (
    <div className={`prose-body measure ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export function SectionHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`statement text-2xl md:text-[2.1rem] ${className}`}>
      {children}
    </h2>
  );
}

/** One thin hairline between rows, never a box around each row. */
export function DefinitionRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-10">
      {rows.map(([term, desc], i) => (
        <div
          key={term}
          className={`grid gap-2 py-5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8 ${
            i > 0 ? "border-t border-hairline" : ""
          }`}
        >
          <dt className="font-display text-sm text-ivory">{term}</dt>
          <dd className="max-w-[60ch] text-sm leading-relaxed text-mist">
            {desc}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="measure mt-8 border-l-2 border-hairline-strong pl-4 text-sm leading-relaxed text-muted">
      {children}
    </p>
  );
}

type ActionProps = { href: string; label: string; primary?: boolean };

export function ActionLink({ href, label, primary = false }: ActionProps) {
  const external = href.startsWith("http");
  const cls = primary
    ? "inline-flex items-center gap-2 rounded-full bg-ivory px-5 py-2.5 text-sm font-medium text-void transition-colors hover:bg-accent-bright"
    : "inline-flex items-center gap-2 border-b border-hairline-strong pb-1 text-sm text-ivory transition-colors hover:border-accent-bright";
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {label}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {label}
    </Link>
  );
}

export function ActionRow({
  actions,
  className = "",
}: {
  actions: ActionProps[];
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-8 gap-y-4 ${className}`}>
      {actions.map((a, i) => (
        <ActionLink key={a.href} {...a} primary={a.primary ?? i === 0} />
      ))}
    </div>
  );
}
