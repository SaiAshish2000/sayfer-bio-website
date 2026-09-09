"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav, contactLink } from "@/content/site";
import { BrandLogo } from "./BrandLogo";

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open ? "bg-void/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      {!scrolled && !open ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-void/85 to-transparent"
        />
      ) : null}
      <nav className="relative mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-6 md:px-12">
        <Link href="/" aria-label="Sayfer Bio, home" className="shrink-0">
          <BrandLogo height={40} mobileHeight={33} priority on="dark" />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <ul className="flex items-center gap-7">
            {primaryNav.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(pathname, l.href) ? "page" : undefined}
                  className={`text-[0.82rem] transition-colors hover:text-ivory ${
                    isActive(pathname, l.href) ? "text-ivory" : "text-mist"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={contactLink.href}
            className="rounded-full border border-hairline-strong px-4 py-1.5 text-[0.82rem] text-ivory transition-colors hover:border-accent-bright hover:text-ivory"
          >
            {contactLink.label}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="label text-ivory lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>

      {open && (
        <div
          id="mobile-nav"
          className="fixed inset-x-0 top-[72px] bottom-0 overflow-y-auto border-t border-hairline bg-void px-6 py-10 lg:hidden"
        >
          <ul className="flex flex-col gap-5">
            {[...primaryNav, contactLink].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, l.href) ? "page" : undefined}
                  className={`font-display text-xl ${
                    isActive(pathname, l.href) ? "text-ivory" : "text-mist"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
