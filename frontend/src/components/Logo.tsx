export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="9" fill="#121316" />
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="#D4AF37" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="9" stroke="#E5B869" strokeWidth="1.5" strokeDasharray="2.5 2.5" />
      <circle cx="20" cy="20" r="4" fill="#D4AF37" />
      <path
        d="M10 14L14.5 9.5M30 14L25.5 9.5M10 26L14.5 30.5M30 26L25.5 30.5"
        stroke="#E5B869"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3" data-testid="brand-logo">
      <LogoMark />
      {!compact && (
        <span className="leading-none">
          <span className="block font-heading text-lg tracking-wide text-cream">Crop Creation</span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.22em] text-gold-soft">
            Keerthan KA20 Photography
          </span>
        </span>
      )}
    </span>
  );
}
