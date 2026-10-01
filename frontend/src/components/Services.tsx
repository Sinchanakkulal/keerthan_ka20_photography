import { Heart, Clapperboard, Album, Frame, Video, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { siteImage, useSiteImages } from "@/lib/siteImages";

interface Service {
  icon: LucideIcon;
  title: string;
  copy: string;
  image: string;
  span: string;
  testid: string;
}

const SERVICES: Service[] = [
  {
    icon: Heart,
    title: "Wedding & Candid Photography",
    copy: "Full-day coverage of the muhurta, the madness and the in-between moments nobody staged.",
    image:
      "https://images.unsplash.com/photo-1599462616558-2b75fd26a283?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
    span: "lg:col-span-7 min-h-[420px]",
    testid: "service-card-wedding",
  },
  {
    icon: Clapperboard,
    title: "Pre-Wedding Cinema",
    copy: "Concept shoots across Agumbe, Kodachadri and the coast — storyboards to colour grade.",
    image:
      "https://images.unsplash.com/photo-1715285977619-6d9357168f46?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    span: "lg:col-span-5 min-h-[420px]",
    testid: "service-card-prewedding",
  },
  {
    icon: Album,
    title: "Album Creation & HD Printing",
    copy: "Flush-mount albums with silk and leather finishes, designed and printed in-house.",
    image: "/studio/studio-albums.png",
    span: "lg:col-span-4 min-h-[300px]",
    testid: "service-card-albums",
  },
  {
    icon: Frame,
    title: "Frames & Banners",
    copy: "Every size of photo frame and large-format banner, ready for the hall wall.",
    image:
      "https://images.unsplash.com/photo-1611550287705-7ff8b459c8eb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    span: "lg:col-span-4 min-h-[300px]",
    testid: "service-card-frames",
  },
  {
    icon: Video,
    title: "4K Videography & Teasers",
    copy: "Cinematic wedding films, same-day teasers and reels cut for the gram.",
    image:
      "https://images.unsplash.com/photo-1629756048377-09540f52caa1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    span: "lg:col-span-4 min-h-[300px]",
    testid: "service-card-video",
  },
  {
    icon: Sparkles,
    title: "Digital Work & Restoration",
    copy: "Retouching, photo restoration, design work and every kind of studio digital service.",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
    span: "lg:col-span-12 min-h-[260px]",
    testid: "service-card-digital",
  },
];

export function Services() {
  const si = useSiteImages();
  return (
    <section id="services" className="mx-auto max-w-7xl px-6 py-28" data-testid="services-section">
      <Reveal>
        <Eyebrow>What We Do</Eyebrow>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl font-heading text-4xl leading-tight tracking-tight text-white sm:text-5xl">
            Every kind of <em className="italic text-gold-soft">studio work,</em> under one roof.
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            From the first look to the framed print on your wall — Crop Creation handles the whole
            journey in-house.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {SERVICES.map((s, i) => (
          <Reveal key={s.testid} delay={0.06 * (i % 3)} className={s.span}>
            <div
              className="group relative h-full min-h-[inherit] overflow-hidden rounded-2xl border border-border transition-colors duration-500 hover:border-gold/50"
              data-testid={s.testid}
            >
              <img
                src={siteImage(s.testid.replace("service-card-", "service-"), si)}
                alt={s.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/45 to-obsidian/10 transition-opacity duration-500 group-hover:via-obsidian/30" />
              <div className="relative flex h-full min-h-[inherit] flex-col justify-between p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-obsidian/60 backdrop-blur-md transition-colors duration-500 group-hover:bg-gold group-hover:text-obsidian text-gold">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-heading text-2xl text-white">{s.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-300">{s.copy}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
