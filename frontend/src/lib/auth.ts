import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost, ApiError } from "@/lib/api";

export type UserRole = "admin" | "customer";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type AdminUser = SessionUser;

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

export interface AllowedEmail {
  id: string;
  email: string;
  note?: string | null;
  created_at: string;
}

export interface DeliveryFile {
  id: string;
  user_email: string;
  storage_path: string;
  original_filename: string;
  content_type: string;
  kind: string;
  size: number;
  caption?: string | null;
  created_at: string;
}

export interface InstaPost {
  id: string;
  storage_path: string;
  caption?: string | null;
  permalink?: string | null;
  visible: boolean;
  created_at: string;
}

export function galleryImageSrc(item: GalleryItem): string {
  if (item.image_url) return item.image_url;
  if (item.storage_path) return `/api/files/${item.storage_path}`;
  return "";
}

export function deliveryFileUrl(fileId: string, download = false): string {
  return `/api/deliveries/${fileId}/file${download ? "?download=1" : ""}`;
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function fetchMe(): Promise<SessionUser> {
  try {
    return await apiGet<SessionUser>("/auth/me");
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      try {
        await apiPost("/auth/refresh");
      } catch {
        throw e;
      }
      return await apiGet<SessionUser>("/auth/me");
    }
    throw e;
  }
}

export function useAuth() {
  return useQuery({
    queryKey: ["auth-me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 30_000,
  });
}

export function useAdminAuth() {
  return useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const u = await fetchMe();
      if (u.role !== "admin") throw new ApiError(403, { detail: "Admin access required" });
      return u;
    },
    retry: false,
    staleTime: 30_000,
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
