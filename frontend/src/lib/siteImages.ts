import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export const SITE_IMAGE_SLOTS: { slot: string; label: string }[] = [
  { slot: "hero-bg", label: "Hero background" },
  { slot: "hero-1", label: "Hero stack — left card" },
  { slot: "hero-2", label: "Hero stack — centre card" },
  { slot: "hero-3", label: "Hero stack — bottom card" },
  { slot: "about-studio", label: "About — studio photo" },
  { slot: "service-wedding", label: "Service — Wedding & Candid" },
  { slot: "service-prewedding", label: "Service — Pre-Wedding Cinema" },
  { slot: "service-albums", label: "Service — Albums & Printing" },
  { slot: "service-frames", label: "Service — Frames & Banners" },
  { slot: "service-video", label: "Service — 4K Videography" },
  { slot: "service-digital", label: "Service — Digital Work" },
];

export const DEFAULT_SITE_IMAGES: Record<string, string> = {
  "hero-bg":
    "https://images.unsplash.com/photo-1722952934708-749c22eb2e58?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000",
  "hero-1":
    "https://images.unsplash.com/photo-1599462616558-2b75fd26a283?crop=entropy&cs=srgb&fm=jpg&q=85&w=700",
  "hero-2":
    "https://images.unsplash.com/photo-1776458026426-804f19253669?crop=entropy&cs=srgb&fm=jpg&q=85&w=700",
  "hero-3":
    "https://images.unsplash.com/photo-1735052712464-9d24b69be5f5?crop=entropy&cs=srgb&fm=jpg&q=85&w=700",
  "about-studio": "/studio/studio-interior.png",
  "service-wedding":
    "https://images.unsplash.com/photo-1599462616558-2b75fd26a283?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
  "service-prewedding":
    "https://images.unsplash.com/photo-1715285977619-6d9357168f46?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  "service-albums": "/studio/studio-albums.png",
  "service-frames":
    "https://images.unsplash.com/photo-1611550287705-7ff8b459c8eb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  "service-video":
    "https://images.unsplash.com/photo-1629756048377-09540f52caa1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  "service-digital":
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
};

export function useSiteImages(): Record<string, string> | undefined {
  const { data } = useQuery({
    queryKey: ["site-images"],
    queryFn: () => apiGet<Record<string, string>>("/site-images"),
    staleTime: 60_000,
    retry: 1,
  });
  return data;
}

export function siteImage(slot: string, images: Record<string, string> | undefined): string {
  return images?.[slot] ?? DEFAULT_SITE_IMAGES[slot] ?? "";
}
