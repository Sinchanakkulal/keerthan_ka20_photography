import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Download, Film, ImageOff, Loader2, LogOut, X } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { deliveryFileUrl, formatSize, useAuth, type DeliveryFile } from "@/lib/auth";
import { Logo } from "@/components/Logo";

function safeDate(iso: string) {
  try {
    return format(new Date(iso), "dd MMM yyyy");
  } catch {
    return iso;
  }
}

export default function MyPhotos() {
  const { data: me, isPending, isError } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lightbox, setLightbox] = useState<DeliveryFile | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ["my-files"],
    queryFn: () => apiGet<DeliveryFile[]>("/deliveries/mine"),
    enabled: !!me,
  });

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian" data-testid="myphotos-loading">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }
  if (isError || !me) {
    return <Navigate to="/portal" replace />;
  }

  const logout = async () => {
    try {
      await apiPost("/auth/logout");
    } finally {
      queryClient.clear();
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-cream" data-testid="myphotos-page">
      <header className="border-b border-border bg-panel/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-4">
            <p className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 sm:block" data-testid="myphotos-user-label">
              {me.name} · {me.email}
            </p>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-zinc-300 transition-colors hover:border-red-400/50 hover:text-red-300"
              data-testid="myphotos-logout-button"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold">Your Deliveries</p>
        <h1 className="mt-3 font-heading text-4xl tracking-tight text-white" data-testid="myphotos-title">
          Your photos &amp; films, <em className="italic text-gold-soft">in full quality.</em>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Every file here is the original high-resolution version from the studio. Click to preview,
          or hit download to keep it forever.
        </p>

        {isLoading && <div className="mt-12 h-40 animate-pulse rounded-xl bg-panel" data-testid="myphotos-loading-grid" />}

        {!isLoading && (!files || files.length === 0) && (
          <div
            className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-panel px-6 py-16 text-center"
            data-testid="myphotos-empty"
          >
            <ImageOff className="h-8 w-8 text-gold/60" />
            <p className="text-sm text-muted-foreground">
              Nothing delivered yet — once your shoot is ready, the studio will upload your photos and
              videos here.
            </p>
          </div>
        )}

        {files && files.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="myphotos-grid">
            {files.map((f, i) => (
              <div
                key={f.id}
                className="overflow-hidden rounded-xl border border-border bg-panel transition-colors duration-500 hover:border-gold/40"
                data-testid={`myphotos-item-${i}`}
              >
                {f.kind === "video" ? (
                  <div className="relative">
                    <video
                      controls
                      preload="metadata"
                      src={deliveryFileUrl(f.id)}
                      className="aspect-video w-full bg-black object-contain"
                      data-testid={`myphotos-video-${i}`}
                    />
                    <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-obsidian/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                      <Film className="h-3 w-3" /> Video
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="block w-full cursor-pointer"
                    onClick={() => setLightbox(f)}
                    data-testid={`myphotos-preview-${i}`}
                    aria-label={`Preview ${f.original_filename}`}
                  >
                    <img
                      src={deliveryFileUrl(f.id)}
                      alt={f.caption || f.original_filename}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                    />
                  </button>
                )}
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-cream" title={f.original_filename}>
                      {f.original_filename}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      {formatSize(f.size)} · {safeDate(f.created_at)}
                    </p>
                  </div>
                  <a
                    href={deliveryFileUrl(f.id, true)}
                    download={f.original_filename}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-obsidian transition-transform duration-300 hover:scale-105 active:scale-95"
                    data-testid={`myphotos-download-${i}`}
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-obsidian/95 p-4 backdrop-blur-md sm:p-10"
            onClick={() => setLightbox(null)}
            data-testid="myphotos-lightbox"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute right-5 top-5 rounded-full border border-white/15 bg-white/5 p-2.5 text-cream transition-colors hover:border-gold hover:text-gold"
              data-testid="myphotos-lightbox-close"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={deliveryFileUrl(lightbox.id)}
                alt={lightbox.caption || lightbox.original_filename}
                className="max-h-[74vh] w-full rounded-lg border border-gold/25 object-contain"
                data-testid="myphotos-lightbox-image"
              />
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-300">{lightbox.original_filename}</p>
                <a
                  href={deliveryFileUrl(lightbox.id, true)}
                  download={lightbox.original_filename}
                  className="flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-xs font-semibold text-obsidian transition-transform duration-300 hover:scale-105 active:scale-95"
                  data-testid="myphotos-lightbox-download"
                  onClick={() => toast.success("Download started")}
                >
                  <Download className="h-3.5 w-3.5" /> Download original
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
