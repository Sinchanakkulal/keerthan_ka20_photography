import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPatch, ApiError } from "@/lib/api";
import { galleryImageSrc, type GalleryItem } from "@/lib/auth";
import { GALLERY_CATEGORIES } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(GALLERY_CATEGORIES.map((c) => [c, c]));

export function GalleryPanel() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Wedding");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: () => apiGet<GalleryItem[]>("/gallery/all"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
    queryClient.invalidateQueries({ queryKey: ["gallery"] });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("file", file as File);
      fd.append("title", title.trim() || "Untitled");
      fd.append("category", category);
      fd.append("caption", caption.trim());
      const res = await fetch("/api/gallery/upload", { method: "POST", body: fd });
      if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
      return (await res.json()) as GalleryItem;
    },
    onSuccess: () => {
      toast.success("Photo added to the gallery");
      setTitle("");
      setCaption("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      invalidate();
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? String((e.body as { detail?: unknown } | null)?.detail ?? "Upload failed") : "Upload failed");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (item: GalleryItem) => apiPatch<GalleryItem>(`/gallery/${item.id}`, { visible: !item.visible }),
    onSuccess: () => invalidate(),
    onError: () => toast.error("Could not update photo"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/gallery/${id}`),
    onSuccess: () => {
      toast.success("Photo removed from the gallery");
      invalidate();
    },
    onError: () => toast.error("Could not delete photo"),
  });

  return (
    <div className="space-y-8">
      <form
        className="rounded-xl border border-border bg-panel p-6"
        data-testid="gallery-upload-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (file && !uploadMutation.isPending) uploadMutation.mutate();
        }}
      >
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-gold">
          <ImagePlus className="h-4 w-4" /> Upload a new frame
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="upload-file">Photo</Label>
            <Input
              id="upload-file"
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              data-testid="gallery-upload-file-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="upload-title">Title</Label>
            <Input
              id="upload-title"
              placeholder="e.g. Haldi Morning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="gallery-upload-title-input"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v: string) => setCategory(v)}>
              <SelectTrigger data-testid="gallery-upload-category-select">
                <SelectValue>{(v: string) => CATEGORY_LABELS[v] ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {GALLERY_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} data-testid={`gallery-upload-category-${c.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="upload-caption">Caption (optional)</Label>
            <Input
              id="upload-caption"
              placeholder="One line about the shot"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              data-testid="gallery-upload-caption-input"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={!file || uploadMutation.isPending}
          className="mt-5 rounded-full bg-gold px-6 text-sm font-semibold text-obsidian hover:bg-gold-bright disabled:opacity-50"
          data-testid="gallery-upload-submit-button"
        >
          {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload to Gallery"}
        </Button>
      </form>

      {isLoading && <div className="h-40 animate-pulse rounded-xl bg-panel" data-testid="admin-gallery-loading" />}
      {isError && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-300" data-testid="admin-gallery-error">
          Could not load gallery. Please sign in again.
        </p>
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="admin-gallery-grid">
          {data.map((item, i) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-border bg-panel"
              data-testid={`admin-gallery-item-${i}`}
            >
              <div className="relative">
                <img src={galleryImageSrc(item)} alt={item.title} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                {!item.visible && (
                  <span className="absolute left-3 top-3 rounded-full bg-obsidian/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                    Hidden
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-cream">{item.title}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{item.category}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate(item)}
                    className="rounded-full border border-border p-2 text-zinc-400 transition-colors hover:border-gold/50 hover:text-gold"
                    data-testid={`admin-gallery-toggle-${i}`}
                    aria-label={item.visible ? "Hide photo" : "Show photo"}
                  >
                    {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove "${item.title}" from the gallery?`)) deleteMutation.mutate(item.id);
                    }}
                    className="rounded-full border border-border p-2 text-zinc-400 transition-colors hover:border-red-400/50 hover:text-red-300"
                    data-testid={`admin-gallery-delete-${i}`}
                    aria-label="Delete photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <p className="rounded-xl border border-dashed border-border bg-panel px-5 py-10 text-center text-sm text-muted-foreground" data-testid="admin-gallery-empty">
          No photos yet — upload the first frame above.
        </p>
      )}
    </div>
  );
}
