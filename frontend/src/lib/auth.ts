import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost, ApiError } from "@/lib/api";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  event_type: string;
  event_date?: string | null;
  location?: string | null;
  message?: string | null;
  status: "new" | "contacted" | "booked" | "archived";
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  caption?: string | null;
  location?: string | null;
  meta?: string | null;
  image_url?: string | null;
  storage_path?: string | null;
  visible: boolean;
  created_at: string;
}

export function galleryImageSrc(item: GalleryItem): string {
  if (item.image_url) return item.image_url;
  if (item.storage_path) return `/api/files/${item.storage_path}`;
  return "";
}

export function useAdminAuth() {
  return useQuery({
    queryKey: ["admin-me"],
    retry: false,
    staleTime: 30_000,
    queryFn: async (): Promise<AdminUser> => {
      try {
        return await apiGet<AdminUser>("/auth/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          try {
            await apiPost("/auth/refresh");
          } catch {
            throw e;
          }
          return await apiGet<AdminUser>("/auth/me");
        }
        throw e;
      }
    },
  });
}

export function formatApiError(detail: unknown): string {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof detail === "object" && "msg" in detail && typeof (detail as { msg: unknown }).msg === "string") {
    return (detail as { msg: string }).msg;
  }
  return String(detail);
}
