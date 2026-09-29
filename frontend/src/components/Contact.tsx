import { Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { SITE } from "@/lib/site";

function openStatus(): { open: boolean; label: string } {
  const now = new Date();
  const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
  const mins = ist.getHours() * 60 + ist.getMinutes();
  const open = mins >= 9 * 60 && mins <= 20 * 60 + 30;
  return { open, label: open ? "Open now · Closes 8:30 PM" : "Closed · Opens 9:00 AM" };
}

export function Contact() {
  const status = openStatus();
  return (
    <section id="visit" className="mx-auto max-w-7xl px-6 py-28" data-testid="contact-section">
      <Reveal>
        <Eyebrow>Visit the Studio</Eyebrow>
        <h2 className="mt-4 max-w-xl font-heading text-4xl leading-tight tracking-tight text-white sm:text-5xl">
          Balkur Proper, <em className="italic text-gold-soft">on the highway.</em>
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-12 gap-8">
        <Reveal className="col-span-12 lg:col-span-5">
          <div className="flex h-full flex-col gap-5">
            <div className="rounded-2xl border border-border bg-panel p-6">
              <p className="flex items-start gap-3 text-sm leading-relaxed text-zinc-200">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span data-testid="contact-address">{SITE.address}</span>
              </p>
              <p className="mt-4 flex items-center gap-3 text-sm text-zinc-200">
                <Clock className="h-4 w-4 shrink-0 text-gold" />
                <span data-testid="contact-hours-status" className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${status.open ? "bg-emerald-400" : "bg-red-400"}`} />
                  {status.label}
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    · {SITE.hours}
                  </span>
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <a
                href={SITE.phoneHref}
                data-testid="contact-call-button"
                className="flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-4 text-sm font-semibold text-obsidian transition-transform duration-300 hover:scale-[1.03] active:scale-95"
              >
                <Phone className="h-4 w-4" /> Call Now
              </a>
              <a
                href={SITE.mapsDirections}
                target="_blank"
                rel="noreferrer"
                data-testid="contact-directions-button"
                className="flex items-center justify-center gap-2 rounded-xl border border-gold/40 px-4 py-4 text-sm font-medium text-gold-bright transition-colors hover:bg-gold/10"
              >
                <Navigation className="h-4 w-4" /> Directions
              </a>
              <a
                href={SITE.whatsapp}
                target="_blank"
                rel="noreferrer"
                data-testid="contact-whatsapp-button"
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-4 text-sm text-cream transition-colors hover:border-gold/50 hover:text-gold-bright"
              >
                <MessageCircle className="h-4 w-4 text-gold" /> WhatsApp
              </a>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noreferrer"
                data-testid="contact-instagram-link"
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-4 text-sm text-cream transition-colors hover:border-gold/50 hover:text-gold-bright"
              >
                <SiInstagram className="h-4 w-4 text-gold" /> Instagram
              </a>
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              {SITE.instagramHandle} · {SITE.followers} followers
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="col-span-12 lg:col-span-7">
          <div className="h-full min-h-[380px] overflow-hidden rounded-2xl border border-border">
            <iframe
              title="Crop Creation studio location map"
              src={SITE.mapsEmbed}
              className="map-dark h-full min-h-[380px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              data-testid="contact-map-iframe"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
