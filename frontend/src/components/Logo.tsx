export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="9" fill="#121316" />
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="#D4AF37" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="11" stroke="#E5B869" strokeWidth="1.2" strokeDasharray="2.5 2.5" />
      <text
        x="20"
        y="26.5"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontSize="17"
        fill="#D4AF37"
      >
        K
      </text>
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3" data-testid="brand-logo">
      <LogoMark />
      {!compact && (
        <span className="leading-none">
          <span className="block font-heading text-lg tracking-wide text-cream">
            Keerthan <em className="italic text-gold-soft">KA20</em>
          </span>
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
            Photography · Crop Creation
          </span>
        </span>
      )}
    </span>
  );
}
