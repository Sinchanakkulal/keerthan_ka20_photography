import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { formatApiError, type Enquiry } from "@/lib/auth";
import { EVENT_TYPES, SITE } from "@/lib/site";
import { Reveal, Eyebrow } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY = { name: "", phone: "", event_type: "", event_date: "", location: "", message: "" };

const EVENT_LABELS: Record<string, string> = Object.fromEntries(EVENT_TYPES.map((t) => [t, t]));
const LOCATIONS = ["Udupi", "Kundapura", "Mangalore", "Other"];
const LOCATION_LABELS: Record<string, string> = Object.fromEntries(LOCATIONS.map((l) => [l, l]));

export function Booking() {
  const [form, setForm] = useState(EMPTY);

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<Enquiry>("/enquiries", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        event_type: form.event_type,
        event_date: form.event_date || null,
        location: form.location || null,
        message: form.message.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Enquiry received! We'll call you back shortly.");
      setForm(EMPTY);
    },
    onError: (e) => {
      toast.error(
        e instanceof ApiError
          ? formatApiError((e.body as { detail?: unknown } | null)?.detail)
          : "Could not send the enquiry — please WhatsApp us instead.",
      );
    },
  });

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSubmit = form.name.trim() && form.phone.trim() && form.event_type && !mutation.isPending;

  return (
    <section id="book" className="border-y border-border bg-[#0E0F12] py-28" data-testid="booking-section">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-12 px-6">
        <div className="col-span-12 lg:col-span-5">
          <Reveal>
            <Eyebrow>Book a Date</Eyebrow>
            <h2 className="mt-4 font-heading text-4xl leading-tight tracking-tight text-white sm:text-5xl">
              Your date, <em className="italic text-gold-soft">our lenses.</em>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Tell us what you&apos;re planning — wedding, pre-wedding, a birthday or just new frames
              for the wall. We reply fast, and the pricing is famously friendly.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <a
                href={SITE.phoneHref}
                data-testid="booking-call-link"
                className="flex w-fit items-center gap-3 rounded-full border border-border px-5 py-3 text-sm text-cream transition-colors hover:border-gold/50 hover:text-gold-bright"
              >
                <Phone className="h-4 w-4 text-gold" /> {SITE.phoneDisplay}
              </a>
              <a
                href={SITE.whatsapp}
                target="_blank"
                rel="noreferrer"
                data-testid="booking-whatsapp-link"
                className="flex w-fit items-center gap-3 rounded-full border border-border px-5 py-3 text-sm text-cream transition-colors hover:border-gold/50 hover:text-gold-bright"
              >
                <MessageCircle className="h-4 w-4 text-gold" /> Chat on WhatsApp
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="col-span-12 lg:col-span-7">
          <form
            className="rounded-2xl border border-border bg-panel p-7 sm:p-9"
            data-testid="booking-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) mutation.mutate();
            }}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking-name">Your name</Label>
                <Input
                  id="booking-name"
                  data-testid="booking-name-input"
                  placeholder="Full name"
                  value={form.name}
                  onChange={set("name")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-phone">Phone / WhatsApp</Label>
                <Input
                  id="booking-phone"
                  data-testid="booking-phone-input"
                  placeholder="+91 ..."
                  value={form.phone}
                  onChange={set("phone")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Event type</Label>
                <Select
                  value={form.event_type}
                  onValueChange={(v: string) => setForm((f) => ({ ...f, event_type: v }))}
                >
                  <SelectTrigger data-testid="booking-eventtype-select">
                    <SelectValue>{(v: string) => EVENT_LABELS[v] ?? "Choose one"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} data-testid={`booking-eventtype-${t.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-date">Event date</Label>
                <Input
                  id="booking-date"
                  type="date"
                  data-testid="booking-date-input"
                  value={form.event_date}
                  onChange={set("event_date")}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={form.location}
                  onValueChange={(v: string) => setForm((f) => ({ ...f, location: v }))}
                >
                  <SelectTrigger data-testid="booking-location-select">
                    <SelectValue>{(v: string) => LOCATION_LABELS[v] ?? "Pick a region"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => (
                      <SelectItem key={l} value={l} data-testid={`booking-location-${l.toLowerCase()}`}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="booking-message">Tell us more</Label>
                <Textarea
                  id="booking-message"
                  data-testid="booking-message-input"
                  placeholder="Venue, hours, album or frame requirements — anything that helps us quote."
                  rows={4}
                  value={form.message}
                  onChange={set("message")}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!canSubmit}
              data-testid="booking-submit-button"
              className="mt-7 rounded-full bg-gold px-8 py-6 text-sm font-semibold text-obsidian transition-transform duration-300 hover:scale-[1.03] hover:bg-gold-bright active:scale-95 disabled:opacity-50"
            >
              {mutation.isPending ? "Sending…" : "Send Enquiry"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
