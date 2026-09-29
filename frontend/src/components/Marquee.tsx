const ITEMS = [
  "Weddings",
  "Pre-Wedding Cinema",
  "Candid Stories",
  "Premium Albums",
  "Frames & Banners",
  "4K Videography",
  "Udupi · Kundapura · Mangalore",
];

export function Marquee() {
  return (
    <div
      className="relative overflow-hidden border-y border-border bg-[#0E0F12] py-5"
      data-testid="editorial-marquee"
      aria-hidden="true"
    >
      <div className="marquee-track flex w-max items-center gap-12 whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-12">
            {ITEMS.map((item) => (
              <span
                key={`${copy}-${item}`}
                className="flex items-center gap-12 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground"
              >
                {item}
                <span className="inline-block h-1.5 w-1.5 rotate-45 bg-gold" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
