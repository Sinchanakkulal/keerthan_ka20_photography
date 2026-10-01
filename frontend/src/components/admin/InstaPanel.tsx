import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";
import { apiDelete, apiGet, apiPatch, ApiError } from "@/lib/api";
import { type InstaPost } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InstaPanel() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [permalink, setPermalink] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-insta"],
    queryFn: () => apiGet<InstaPost[]>("/insta-strip/all"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-insta"] });
    queryClient.invalidateQueries({ queryKey: ["insta-strip"] });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("file", file as File);
      fd.append("caption", caption.trim());
      fd.append("permalink", permalink.trim());
      const res = await fetch("/api/insta-strip/upload", { method: "POST", body: fd });
      if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
      return (await res.json()) as InstaPost;
    },
    onSuccess: () => {
      toast.success("Added to the Instagram strip");
      setFile(null);
      setCaption("");
      setPermalink("");
      if (fileRef.current) fileRef.current.value = "";
      invalidate();
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? String((e.body as { detail?: unknown } | null)?.detail ?? "Upload failed") : "Upload failed"),
  });

  const toggleMutation = useMutation({
    mutationFn: (p: InstaPost) => apiPatch<InstaPost>(`/insta-strip/${p.id}`, { visible: !p.visible }),
    onSuccess: invalidate,
    onError: () => toast.error("Could not update post"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/insta-strip/${id}`),
    onSuccess: () => {
      toast.success("Post removed");
      invalidate();
    },
    onError: () => toast.error("Could not remove post"),
  });

  return (
    <div className="space-y-8">
      <form
        className="rounded-xl border border-border bg-panel p-6"
        data-testid="insta-upload-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (file && !uploadMutation.isPending) uploadMutation.mutate();
        }}
      >
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-gold">
          <SiInstagram className="h-4 w-4" /> Pin a post to the footer strip
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Upload the same photo you posted on Instagram — it appears in the &quot;Fresh from
          Instagram&quot; strip near the footer and links back to your profile or the post.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="insta-file">Photo</Label>
            <Input
              id="insta-file"
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              data-testid="insta-file-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insta-caption">Caption (optional)</Label>
            <Input
              id="insta-caption"
              placeholder="e.g. Haldi mornings"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              data-testid="insta-caption-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insta-permalink">Post link (optional)</Label>
            <Input
              id="insta-permalink"
              placeholder={SITE.instagram}
              value={permalink}
              onChange={(e) => setPermalink(e.target.value)}
              data-testid="insta-permalink-input"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={!file || uploadMutation.isPending}
          className="mt-5 rounded-full bg-gold px-6 text-sm font-semibold text-obsidian hover:bg-gold-bright disabled:opacity-50"
          data-testid="insta-upload-button"
        >
          {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pin to Strip"}
        </Button>
      </form>

      {isLoading && <div className="h-40 animate-pulse rounded-xl bg-panel" data-testid="insta-loading" />}

      {data && data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" data-testid="insta-admin-grid">
          {data.map((p, i) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-panel" data-testid={`insta-admin-item-${i}`}>
              <div className="relative">
                <img src={`/api/files/${p.storage_path}`} alt={p.caption || "Insta post"} loading="lazy" className="aspect-square w-full object-cover" />
                {!p.visible && (
                  <span className="absolute left-2 top-2 rounded-full bg-obsidian/80 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-zinc-400">
                    Hidden
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <p className="min-w-0 truncate text-xs text-zinc-400">{p.caption || "—"}</p>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate(p)}
                    className="rounded-full border border-border p-1.5 text-zinc-400 transition-colors hover:border-gold/50 hover:text-gold"
                    data-testid={`insta-toggle-${i}`}
                    aria-label={p.visible ? "Hide post" : "Show post"}
                  >
                    {p.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Remove this post from the strip?")) deleteMutation.mutate(p.id);
                    }}
                    className="rounded-full border border-border p-1.5 text-zinc-400 transition-colors hover:border-red-400/50 hover:text-red-300"
                    data-testid={`insta-delete-${i}`}
                    aria-label="Delete post"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <p className="rounded-xl border border-dashed border-border bg-panel px-5 py-10 text-center text-sm text-muted-foreground" data-testid="insta-empty">
          No posts pinned yet — add your latest Instagram shots above.
        </p>
      )}
    </div>
  );
}
