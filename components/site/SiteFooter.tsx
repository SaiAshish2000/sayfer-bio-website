import Link from "next/link";
import { brand, footerNav, footerNote, copyright } from "@/content/site";
import { BrandLogo } from "./BrandLogo";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-hairline bg-void">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-12 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.2fr_2fr]">
          <div>
            <BrandLogo height={44} on="dark" />
            <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-mist">
              {brand.name}. {brand.tagline}
            </p>
            <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-muted">
              {brand.supporting}
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {footerNav.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <p className="label mb-4">{col.heading}</p>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-mist transition-colors hover:text-ivory"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-hairline pt-8">
          <p className="max-w-[80ch] text-xs leading-relaxed text-faint">
            {footerNote}
          </p>
          <p className="mt-4 text-xs text-faint">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
