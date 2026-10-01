import { useQuery } from "@tanstack/react-query";
import { SiInstagram } from "@icons-pack/react-simple-icons";
import { apiGet } from "@/lib/api";
import type { InstaPost } from "@/lib/auth";
import { SITE } from "@/lib/site";

export function InstaStrip() {
  const { data } = useQuery({
    queryKey: ["insta-strip"],
    queryFn: () => apiGet<InstaPost[]>("/insta-strip"),
    retry: 1,
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="border-t border-border bg-[#0E0F12] py-14" data-testid="insta-strip">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold">Fresh from Instagram</p>
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-gold-soft"
            data-testid="insta-strip-profile-link"
          >
            <SiInstagram className="h-3.5 w-3.5 text-gold" /> {SITE.instagramHandle}
          </a>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2" data-testid="insta-strip-row">
          {data.map((post, i) => (
            <a
              key={post.id}
              href={post.permalink || SITE.instagram}
              target="_blank"
              rel="noreferrer"
              className="group relative shrink-0 overflow-hidden rounded-xl border border-border transition-colors duration-500 hover:border-gold/60"
              data-testid={`insta-post-${i}`}
              aria-label={post.caption || "Instagram post"}
            >
              <img
                src={`/api/files/${post.storage_path}`}
                alt={post.caption || "Instagram post"}
                loading="lazy"
                className="aspect-square w-40 object-cover transition-transform duration-700 group-hover:scale-110 sm:w-48"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-obsidian/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <SiInstagram className="h-5 w-5 text-gold-bright" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
