export function LogoMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Keerthan KA20 Photography logo"
      className={className}
      data-testid="brand-logo-mark"
    />
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center" data-testid="brand-logo">
      <img
        src="/logo.png"
        alt="Keerthan KA20 Photography"
        className={`w-auto ${compact ? "h-7" : "h-9"}`}
      />
    </span>
  );
}
