import { Phone } from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";
import { Logo } from "@/components/Logo";
import { AdminHeaderLink } from "@/components/Navbar";
import { scrollToId } from "@/lib/smoothScroll";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#0A0B0D]" data-testid="site-footer">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-14 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Pre-wedding · Wedding · Photography &amp; Videography · Albums · Frames · Banners.
            DM for shoots and edits.
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.25em] text-gold">
            Udupi · Kundapura · Mangalore
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          <nav className="flex flex-wrap gap-6">
            {[
              { label: "Work", hash: "#gallery", testid: "footer-link-work" },
              { label: "Services", hash: "#services", testid: "footer-link-services" },
              { label: "Book", hash: "#book", testid: "footer-link-book" },
              { label: "Visit", hash: "#visit", testid: "footer-link-visit" },
            ].map((l) => (
              <button
                key={l.hash}
                type="button"
                onClick={() => scrollToId(l.hash)}
                data-testid={l.testid}
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-gold-soft"
              >
                {l.label}
              </button>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href={SITE.phoneHref}
              className="flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-gold-bright"
              data-testid="footer-phone-link"
            >
              <Phone className="h-3.5 w-3.5 text-gold" /> {SITE.phoneDisplay}
            </a>
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-gold-bright"
              data-testid="footer-instagram-link"
            >
              <SiInstagram className="h-3.5 w-3.5 text-gold" /> {SITE.instagramHandle}
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <p className="font-mono text-[11px] text-zinc-500">
            © 2026 {SITE.name} · {SITE.tagline} · {SITE.owner}
          </p>
          <AdminHeaderLink />
        </div>
      </div>
    </footer>
  );
}
