import { Star } from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { SITE } from "@/lib/site";
import { siteImage, useSiteImages } from "@/lib/siteImages";

const STATS = [
  { value: SITE.rating, label: "Google rating", testid: "stat-rating" },
  { value: String(SITE.reviewCount), label: "Google reviews", testid: "stat-reviews" },
  { value: SITE.followers, label: "Instagram family", testid: "stat-followers" },
  { value: "3", label: "Coastal districts", testid: "stat-regions" },
];

export function About() {
  const si = useSiteImages();
  return (
    <section id="studio" className="relative mx-auto max-w-7xl px-6 py-28 lg:py-36" data-testid="about-section">
      <div className="grid grid-cols-12 items-center gap-12">
        <Reveal className="col-span-12 lg:col-span-6">
          <div className="relative" data-testid="about-photo-frame">
            <div className="absolute -left-4 -top-4 h-full w-full rounded-2xl border border-gold/25" />
            <div className="group relative overflow-hidden rounded-2xl border border-border">
              <img
                src={siteImage("about-studio", si)}
                alt="Inside the Keerthan KA20 Photography studio at Balkur Proper"
                className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent" />
              <p className="absolute bottom-4 left-4 font-mono text-[11px] uppercase tracking-[0.25em] text-gold-bright">
                The Studio · Balkur Proper
              </p>
            </div>
          </div>
        </Reveal>

        <div className="col-span-12 lg:col-span-6">
          <Reveal>
            <Eyebrow>The Studio</Eyebrow>
            <h2 className="mt-4 font-heading text-4xl leading-tight tracking-tight text-white sm:text-5xl">
              A dark-room heart on the <em className="italic text-gold-soft">Kundapur–Agumbe</em> highway.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              From a wood-panelled studio in Balkur Proper, {SITE.owner} and the Crop Creation crew
              have become the coast&apos;s quiet obsessives — chasing golden hour through Agumbe&apos;s
              forests, Malpe&apos;s surf and every wedding hall in between. Photography, 4K films,
              albums, frames, banners and every kind of digital work, under one roof.
            </p>
            <blockquote className="mt-6 border-l-2 border-gold pl-5 font-heading text-lg italic text-zinc-200">
              “Contact for everything in studio work.”
              <span className="mt-2 block font-mono text-[11px] not-italic uppercase tracking-[0.25em] text-gold">
                {SITE.owner} · Founder
              </span>
            </blockquote>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="bg-panel px-4 py-5 text-center" data-testid={s.testid}>
                  <p className="flex items-center justify-center gap-1 font-heading text-2xl text-gold-soft">
                    {s.value}
                    {s.testid === "stat-rating" && <Star className="h-4 w-4 fill-gold text-gold" />}
                    {s.testid === "stat-followers" && <SiInstagram className="h-4 w-4 text-gold" />}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
