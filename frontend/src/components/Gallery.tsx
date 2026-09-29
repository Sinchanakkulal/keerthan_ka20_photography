import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Aperture, Camera, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { apiGet } from "@/lib/api";
import { galleryImageSrc, type GalleryItem } from "@/lib/auth";
import { GALLERY_CATEGORIES } from "@/lib/site";
import { Reveal, Eyebrow } from "@/components/Reveal";

const FILTERS = ["All", ...GALLERY_CATEGORIES];

function filterTestid(f: string) {
  return `gallery-filter-${f.toLowerCase().replace(/[^a-z]+/g, "-")}`;
}

export function Gallery() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => apiGet<GalleryItem[]>("/gallery"),
    retry: 1,
  });
  const [filter, setFilter] = useState<string>("All");
  const [activeId, setActiveId] = useState<string | null>(null);

  const items = useMemo(
    () => (data ?? []).filter((i) => filter === "All" || i.category === filter),
    [data, filter],
  );
  const activeIndex = items.findIndex((i) => i.id === activeId);
  const active = activeIndex >= 0 ? items[activeIndex] : null;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
      if (e.key === "ArrowRight") setActiveId(items[(activeIndex + 1) % items.length]?.id ?? null);
      if (e.key === "ArrowLeft")
        setActiveId(items[(activeIndex - 1 + items.length) % items.length]?.id ?? null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, activeIndex, items]);

  return (
    <section id="gallery" className="border-y border-border bg-[#0E0F12] py-28" data-testid="gallery-section">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <Eyebrow>Selected Work</Eyebrow>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-xl font-heading text-4xl leading-tight tracking-tight text-white sm:text-5xl">
              Frames from the <em className="italic text-gold-soft">coast.</em>
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Showcase frames below — the studio uploads real client shoots here from the admin
              desk.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap gap-2" data-testid="gallery-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                data-testid={filterTestid(f)}
                className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-all duration-300 active:scale-95 ${
                  filter === f
                    ? "border-gold bg-gold text-obsidian"
                    : "border-border text-zinc-400 hover:border-gold/50 hover:text-gold-soft"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </Reveal>

        {isLoading && (
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="gallery-loading">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-panel" />
            ))}
          </div>
        )}

        {(isError || (!isLoading && items.length === 0)) && (
          <div
            className="mt-14 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-panel px-6 py-16 text-center"
            data-testid="gallery-empty-state"
          >
            <Camera className="h-8 w-8 text-gold/60" />
            <p className="text-sm text-muted-foreground">
              Fresh frames are on their way — the studio uploads new work here.
            </p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3" data-testid="gallery-grid">
            {items.map((item, i) => (
              <motion.figure
                key={item.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: 0.05 * (i % 3), ease: [0.16, 1, 0.3, 1] }}
                className="group relative mb-5 break-inside-avoid cursor-pointer overflow-hidden rounded-xl border border-border transition-colors duration-500 hover:border-gold/60"
                onClick={() => setActiveId(item.id)}
                data-testid={`gallery-item-${i}`}
              >
                <img
                  src={galleryImageSrc(item)}
                  alt={item.title}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-obsidian/90 via-transparent to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <p className="font-heading text-lg text-white">{item.title}</p>
                  <p className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gold-soft">
                    {item.category}
                    {item.location && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <MapPin className="h-3 w-3" /> {item.location}
                      </span>
                    )}
                  </p>
                </div>
              </motion.figure>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-obsidian/95 p-4 backdrop-blur-md sm:p-10"
            onClick={() => setActiveId(null)}
            data-testid="gallery-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
          >
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="absolute right-5 top-5 rounded-full border border-white/15 bg-white/5 p-2.5 text-cream transition-colors hover:border-gold hover:text-gold"
              data-testid="lightbox-close"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveId(items[(activeIndex - 1 + items.length) % items.length]?.id ?? null);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/5 p-2.5 text-cream transition-colors hover:border-gold hover:text-gold sm:left-8"
              data-testid="lightbox-prev"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveId(items[(activeIndex + 1) % items.length]?.id ?? null);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/5 p-2.5 text-cream transition-colors hover:border-gold hover:text-gold sm:right-8"
              data-testid="lightbox-next"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <motion.div
              key={active.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={galleryImageSrc(active)}
                alt={active.title}
                className="max-h-[72vh] w-full rounded-lg border border-gold/25 object-contain"
                data-testid="lightbox-image"
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-heading text-xl text-white" data-testid="lightbox-title">
                    {active.title}
                  </p>
                  {active.caption && <p className="mt-1 text-sm text-muted-foreground">{active.caption}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-soft">
                  {active.meta && (
                    <span className="flex items-center gap-1.5">
                      <Aperture className="h-3.5 w-3.5" /> {active.meta}
                    </span>
                  )}
                  {active.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {active.location}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
