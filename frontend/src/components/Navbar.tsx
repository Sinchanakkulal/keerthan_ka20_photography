import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { scrollToId } from "@/lib/smoothScroll";

const LINKS = [
  { label: "Work", hash: "#gallery", testid: "nav-link-work" },
  { label: "Services", hash: "#services", testid: "nav-link-services" },
  { label: "Studio", hash: "#studio", testid: "nav-link-studio" },
  { label: "Reviews", hash: "#reviews", testid: "nav-link-reviews" },
  { label: "Visit", hash: "#visit", testid: "nav-link-visit" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (hash: string) => {
    setOpen(false);
    scrollToId(hash);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open ? "border-b border-white/10 bg-obsidian/85 backdrop-blur-xl" : "bg-transparent"
      }`}
      data-testid="site-header"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => go("#top")}
          className="text-left"
          data-testid="nav-brand-button"
          aria-label="Back to top"
        >
          <Logo />
        </button>

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <button
              key={link.hash}
              type="button"
              onClick={() => go(link.hash)}
              data-testid={link.testid}
              className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 transition-colors duration-300 hover:text-gold-soft"
            >
              {link.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => go("#book")}
            data-testid="nav-book-btn"
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-obsidian transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            Book a Date
          </button>
        </nav>

        <button
          type="button"
          className="text-cream lg:hidden"
          onClick={() => setOpen((v) => !v)}
          data-testid="nav-mobile-toggle"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 px-6 py-6 lg:hidden" data-testid="nav-mobile-menu">
          <div className="flex flex-col gap-5">
            {LINKS.map((link) => (
              <button
                key={link.hash}
                type="button"
                onClick={() => go(link.hash)}
                data-testid={`${link.testid}-mobile`}
                className="text-left font-mono text-sm uppercase tracking-[0.2em] text-zinc-300"
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => go("#book")}
              data-testid="nav-book-btn-mobile"
              className="w-fit rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-obsidian"
            >
              Book a Date
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

export function AdminHeaderLink() {
  return (
    <Link
      to="/admin/login"
      data-testid="footer-admin-link"
      className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-gold-soft"
    >
      Studio Login
    </Link>
  );
}
