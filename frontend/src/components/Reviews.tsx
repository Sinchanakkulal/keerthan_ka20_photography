import { Star, Quote } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { SITE } from "@/lib/site";

const REVIEWS = [
  {
    name: "Anusha Kulal",
    text: "Photos and videos good quality and best service for all others.",
    tag: "Google review",
    testid: "review-card-anusha",
  },
  {
    name: "Manjunath M",
    text: "They have very affordable pricing as well for the facility they provide.",
    tag: "Google review",
    testid: "review-card-manjunath",
  },
  {
    name: "Sinchana Kulal",
    text: "Booked our engagement candids — natural, warm and delivered right on time.",
    tag: "Client story",
    testid: "review-card-sinchana",
  },
  {
    name: "Rakshith K",
    text: "The album and frame quality is on another level. Worth every rupee.",
    tag: "Client story",
    testid: "review-card-rakshith",
  },
];

export function Reviews() {
  return (
    <section id="reviews" className="mx-auto max-w-7xl px-6 py-28" data-testid="reviews-section">
      <Reveal>
        <Eyebrow>Word of Mouth</Eyebrow>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl font-heading text-4xl leading-tight tracking-tight text-white sm:text-5xl">
            Loved across the <em className="italic text-gold-soft">coast.</em>
          </h2>
          <div
            className="flex items-center gap-3 rounded-full border border-gold/30 bg-gold/5 px-5 py-2.5"
            data-testid="reviews-google-badge"
          >
            <span className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-gold text-gold" />
              ))}
            </span>
            <span className="font-heading text-xl text-gold-soft">{SITE.rating}</span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
              · {SITE.reviewCount} Google reviews
            </span>
          </div>
        </div>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {REVIEWS.map((r, i) => (
          <Reveal key={r.testid} delay={0.07 * i}>
            <figure
              className="flex h-full flex-col justify-between rounded-2xl border border-border bg-panel p-6 transition-colors duration-500 hover:border-gold/40 hover:bg-panel-hover"
              data-testid={r.testid}
            >
              <div>
                <Quote className="h-5 w-5 text-gold/70" />
                <blockquote className="mt-4 text-sm leading-relaxed text-zinc-200">“{r.text}”</blockquote>
              </div>
              <figcaption className="mt-6 border-t border-border pt-4">
                <p className="text-sm font-semibold text-cream">{r.name}</p>
                <p className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  <span className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="h-2.5 w-2.5 fill-gold text-gold" />
                    ))}
                  </span>
                  {r.tag}
                </p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
