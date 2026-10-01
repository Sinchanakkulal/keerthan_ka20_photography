import { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, MessageCircle, Star } from "lucide-react";
import { SITE } from "@/lib/site";
import { scrollToId } from "@/lib/smoothScroll";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const HERO_BG =
  "https://images.unsplash.com/photo-1722952934708-749c22eb2e58?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000";

const STACK = [
  {
    src: "https://images.unsplash.com/photo-1599462616558-2b75fd26a283?crop=entropy&cs=srgb&fm=jpg&q=85&w=700",
    className: "left-0 top-16 w-52 -rotate-[7deg] xl:w-60",
    delay: 1.0,
    alt: "Bride and groom in traditional wedding attire",
  },
  {
    src: "https://images.unsplash.com/photo-1776458026426-804f19253669?crop=entropy&cs=srgb&fm=jpg&q=85&w=700",
    className: "left-36 top-0 z-10 w-56 rotate-[2deg] xl:left-44 xl:w-64",
    delay: 1.15,
    alt: "Couple embracing at golden hour",
  },
  {
    src: "https://images.unsplash.com/photo-1735052712464-9d24b69be5f5?crop=entropy&cs=srgb&fm=jpg&q=85&w=700",
    className: "left-14 top-64 w-52 rotate-[8deg] xl:w-60",
    delay: 1.3,
    alt: "Couple walking through a forest path",
  },
];

function MaskedLine({ children, delay, className = "" }: { children: ReactNode; delay: number; className?: string }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block"
        initial={{ y: "112%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden" data-testid="hero-section">
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-110">
        <img src={HERO_BG} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,12,14,0.62)_0%,rgba(11,12,14,0.82)_55%,#0B0C0E_100%)]" />
      </motion.div>

      <motion.div
        style={{ opacity: fade }}
        className="relative z-10 mx-auto grid max-w-7xl grid-cols-12 items-center gap-10 px-6 pb-32 pt-40 lg:pt-44"
      >
        <div className="col-span-12 lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
            className="font-mono text-xs uppercase tracking-[0.3em] text-gold"
            data-testid="hero-eyebrow"
          >
            Keerthan KA20 Photography · Crop Creation
          </motion.p>

          <h1 className="mt-6 font-heading text-5xl leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl" data-testid="hero-title">
            <MaskedLine delay={0.45}>You Dream It,</MaskedLine>
            <MaskedLine delay={0.58}>
              We <em className="italic text-gold-soft">Design It.</em>
            </MaskedLine>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.95, ease: EASE }}
            className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg"
            data-testid="hero-subcopy"
          >
            Wedding, pre-wedding &amp; candid storytellers from Balkur Proper — serving Udupi,
            Kundapura and Mangalore with cinema-grade 4K films, heirloom albums and frames that
            outlive trends.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              onClick={() => scrollToId("#book")}
              data-testid="hero-book-btn"
              className="group inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-obsidian transition-transform duration-300 hover:scale-[1.04] active:scale-95"
            >
              Book Your Date
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noreferrer"
              data-testid="hero-whatsapp-btn"
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-7 py-3.5 text-sm font-medium text-gold-bright transition-colors duration-300 hover:border-gold hover:bg-gold/10"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp the Studio
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.25, ease: EASE }}
            className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 backdrop-blur-md"
            data-testid="hero-rating-chip"
          >
            <span className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
              ))}
            </span>
            <span className="text-sm font-semibold text-cream">{SITE.rating}</span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
              {SITE.reviewCount} Google reviews
            </span>
          </motion.div>
        </div>

        <div className="relative col-span-5 hidden h-[540px] lg:block" data-testid="hero-photo-stack">
          {STACK.map((shot) => (
            <motion.div
              key={shot.src}
              initial={{ opacity: 0, y: 90, rotate: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: shot.delay, ease: EASE }}
              className={`absolute ${shot.className}`}
            >
              <div className="group overflow-hidden rounded-xl border border-gold/30 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] transition-all duration-500 hover:border-gold/70 hover:shadow-[0_30px_90px_-16px_rgba(212,175,55,0.25)]">
                <img
                  src={shot.src}
                  alt={shot.alt}
                  className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.button
        type="button"
        onClick={() => scrollToId("#studio")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-zinc-400 transition-colors hover:text-gold-soft"
        data-testid="hero-scroll-cue"
        aria-label="Scroll to studio section"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span className="h-12 w-px bg-gradient-to-b from-gold to-transparent" />
      </motion.button>
    </section>
  );
}
