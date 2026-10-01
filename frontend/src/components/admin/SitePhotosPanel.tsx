import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Loader2, RotateCcw, UploadCloud } from "lucide-react";
import { apiDelete, ApiError } from "@/lib/api";
import { DEFAULT_SITE_IMAGES, SITE_IMAGE_SLOTS, siteImage, useSiteImages } from "@/lib/siteImages";
import { Button } from "@/components/ui/button";

function SlotCard({ slot, label }: { slot: string; label: string }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const images = useSiteImages();
  const hasOverride = !!images?.[slot];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["site-images"] });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("file", file as File);
      const res = await fetch(`/api/site-images/${slot}`, { method: "POST", body: fd });
      if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
      return res.json();
    },
    onSuccess: () => {
      toast.success(`${label} updated`);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      invalidate();
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? String((e.body as { detail?: unknown } | null)?.detail ?? "Upload failed") : "Upload failed"),
  });

  const resetMutation = useMutation({
    mutationFn: () => apiDelete(`/site-images/${slot}`),
    onSuccess: () => {
      toast.success(`${label} reset to default`);
      invalidate();
    },
    onError: () => toast.error("Could not reset"),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel" data-testid={`site-photo-card-${slot}`}>
      <img
        src={siteImage(slot, images)}
        alt={label}
        loading="lazy"
        className="aspect-[16/9] w-full object-cover"
        data-testid={`site-photo-preview-${slot}`}
      />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-cream">{label}</p>
          {hasOverride && (
            <span className="rounded-full bg-gold/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-gold-soft">
              Custom
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-xs text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:text-cream hover:file:bg-panel-hover"
            data-testid={`site-photo-file-${slot}`}
          />
          <Button
            type="button"
            size="sm"
            disabled={!file || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
            className="shrink-0 rounded-full bg-gold text-xs font-semibold text-obsidian hover:bg-gold-bright disabled:opacity-50"
            data-testid={`site-photo-upload-${slot}`}
          >
            {uploadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          </Button>
          {hasOverride && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => resetMutation.mutate()}
              className="shrink-0 rounded-full text-xs"
              data-testid={`site-photo-reset-${slot}`}
              aria-label={`Reset ${label}`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SitePhotosPanel() {
  return (
    <div data-testid="site-photos-panel">
      <div className="rounded-xl border border-border bg-panel p-6">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-gold">
          <ImageIcon className="h-4 w-4" /> Swap any photo on the website
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          These slots control the hero, about and service photos across the homepage. Upload your own
          shot to replace one — it goes live instantly. Gallery photos are managed in the Gallery
          Manager tab. Reset anytime to bring back the default.
        </p>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SITE_IMAGE_SLOTS.map((s) => (
          <SlotCard key={s.slot} slot={s.slot} label={s.label} />
        ))}
      </div>
      {void DEFAULT_SITE_IMAGES}
    </div>
  );
}
