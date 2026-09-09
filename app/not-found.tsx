import { Container, ActionLink } from "@/components/site/Page";

export default function NotFound() {
  return (
    <main className="relative z-10 flex min-h-[70vh] items-center">
      <Container>
        <div className="max-w-xl">
          <p className="label mb-6">404</p>
          <h1 className="statement text-3xl md:text-[2.6rem]">
            This page could not be found.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-mist">
            The page may have moved, or the address may be incomplete. Explore
            Sayfer Bio&rsquo;s current work or contact the team.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <ActionLink href="/" label="Return home" primary />
            <ActionLink href="/contact" label="Contact us" />
          </div>
        </div>
      </Container>
    </main>
  );
}
