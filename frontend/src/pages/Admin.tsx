import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Images, Inbox, Loader2, LogOut, Sparkles, Users } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAdminAuth, type Enquiry, type GalleryItem, type SessionUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { EnquiriesPanel } from "@/components/admin/EnquiriesPanel";
import { GalleryPanel } from "@/components/admin/GalleryPanel";
import { ClientsPanel } from "@/components/admin/ClientsPanel";
import { InstaPanel } from "@/components/admin/InstaPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const { data: me, isPending, isError } = useAdminAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: enquiries } = useQuery({
    queryKey: ["admin-enquiries"],
    queryFn: () => apiGet<Enquiry[]>("/enquiries"),
    enabled: !!me,
  });
  const { data: gallery } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: () => apiGet<GalleryItem[]>("/gallery/all"),
    enabled: !!me,
  });
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => apiGet<SessionUser[]>("/users"),
    enabled: !!me,
  });

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian" data-testid="admin-loading">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }
  if (isError || !me) {
    return <Navigate to="/admin/login" replace />;
  }

  const newCount = (enquiries ?? []).filter((e) => e.status === "new").length;

  const logout = async () => {
    try {
      await apiPost("/auth/logout");
    } finally {
      queryClient.clear();
      toast.success("Signed out");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-cream" data-testid="admin-dashboard">
      <header className="border-b border-border bg-panel/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-4">
            <p className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 sm:block" data-testid="admin-user-label">
              {me.name} · {me.email}
            </p>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-zinc-300 transition-colors hover:border-red-400/50 hover:text-red-300"
              data-testid="admin-logout-button"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-heading text-3xl text-white" data-testid="admin-title">
          Studio Desk
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enquiries, gallery, clients and Instagram strip for Keerthan KA20 Photography.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Inbox, label: "Total enquiries", value: (enquiries ?? []).length, testid: "stat-total-enquiries" },
            { icon: Sparkles, label: "New enquiries", value: newCount, testid: "stat-new-enquiries" },
            { icon: Images, label: "Gallery photos", value: (gallery ?? []).length, testid: "stat-gallery-count" },
            { icon: Users, label: "Client accounts", value: (customers ?? []).length, testid: "stat-customers-count" },
          ].map((s) => (
            <div key={s.testid} className="flex items-center gap-4 rounded-xl border border-border bg-panel p-5" data-testid={s.testid}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                <s.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-heading text-2xl text-gold-soft">{s.value}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="enquiries" className="mt-10">
          <TabsList className="border border-border bg-panel" data-testid="admin-tabs">
            <TabsTrigger value="enquiries" data-testid="admin-tab-enquiries">
              Enquiries
            </TabsTrigger>
            <TabsTrigger value="gallery" data-testid="admin-tab-gallery">
              Gallery Manager
            </TabsTrigger>
            <TabsTrigger value="clients" data-testid="admin-tab-clients">
              Clients &amp; Delivery
            </TabsTrigger>
            <TabsTrigger value="insta" data-testid="admin-tab-insta">
              Insta Strip
            </TabsTrigger>
          </TabsList>
          <TabsContent value="enquiries" className="mt-6">
            <EnquiriesPanel />
          </TabsContent>
          <TabsContent value="gallery" className="mt-6">
            <GalleryPanel />
          </TabsContent>
          <TabsContent value="clients" className="mt-6">
            <ClientsPanel />
          </TabsContent>
          <TabsContent value="insta" className="mt-6">
            <InstaPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
