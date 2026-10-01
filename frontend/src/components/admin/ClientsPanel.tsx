import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Film, Loader2, MailPlus, Trash2, UploadCloud } from "lucide-react";
import { apiDelete, apiGet, apiPost, ApiError } from "@/lib/api";
import { deliveryFileUrl, formatApiError, formatSize, type AllowedEmail, type DeliveryFile, type SessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function safeDate(iso: string) {
  try {
    return format(new Date(iso), "dd MMM yyyy");
  } catch {
    return iso;
  }
}

function errMsg(e: unknown) {
  return e instanceof ApiError ? formatApiError((e.body as { detail?: unknown } | null)?.detail) : "Something went wrong";
}

export function ClientsPanel() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [deliverTo, setDeliverTo] = useState("");
  const [deliverCaption, setDeliverCaption] = useState("");
  const [deliverFile, setDeliverFile] = useState<File | null>(null);

  const { data: allowed, isLoading: allowedLoading } = useQuery({
    queryKey: ["allowed-emails"],
    queryFn: () => apiGet<AllowedEmail[]>("/allowed-emails"),
  });
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => apiGet<SessionUser[]>("/users"),
  });
  const { data: deliveries, isLoading: deliveriesLoading } = useQuery({
    queryKey: ["deliveries"],
    queryFn: () => apiGet<DeliveryFile[]>("/deliveries"),
  });

  const addEmailMutation = useMutation({
    mutationFn: () => apiPost<AllowedEmail>("/allowed-emails", { email: newEmail.trim(), note: newNote.trim() || null }),
    onSuccess: () => {
      toast.success("Email approved — the client can now create an account");
      setNewEmail("");
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const removeEmailMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/allowed-emails/${id}`),
    onSuccess: () => {
      toast.success("Approval removed");
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const deliverMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("file", deliverFile as File);
      fd.append("user_email", deliverTo);
      fd.append("caption", deliverCaption.trim());
      const res = await fetch("/api/deliveries/upload", { method: "POST", body: fd });
      if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
      return (await res.json()) as DeliveryFile;
    },
    onSuccess: (f) => {
      toast.success(`Delivered to ${f.user_email}`);
      setDeliverFile(null);
      setDeliverCaption("");
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/deliveries/${id}`),
    onSuccess: () => {
      toast.success("File removed");
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const customerEmails: Record<string, string> = Object.fromEntries((customers ?? []).map((c) => [c.email, `${c.name} — ${c.email}`]));

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-panel p-6" data-testid="whitelist-section">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-gold">
          <MailPlus className="h-4 w-4" /> Approved client emails
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Only these emails can create a client account. Approve a client here, then ask them to sign
          up on the Client Portal.
        </p>
        <form
          className="mt-5 space-y-3"
          data-testid="whitelist-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (newEmail.trim() && !addEmailMutation.isPending) addEmailMutation.mutate();
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              type="email"
              placeholder="client@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              data-testid="whitelist-email-input"
              required
            />
            <Input
              placeholder="Note (e.g. Shetty wedding)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              data-testid="whitelist-note-input"
            />
          </div>
          <Button
            type="submit"
            disabled={!newEmail.trim() || addEmailMutation.isPending}
            className="rounded-full bg-gold px-6 text-sm font-semibold text-obsidian hover:bg-gold-bright disabled:opacity-50"
            data-testid="whitelist-add-button"
          >
            {addEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve Email"}
          </Button>
        </form>

        <div className="mt-6 space-y-2" data-testid="whitelist-list">
          {allowedLoading && <div className="h-16 animate-pulse rounded-lg bg-obsidian" />}
          {allowed?.map((a, i) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-obsidian px-4 py-3"
              data-testid={`whitelist-row-${i}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-cream">{a.email}</p>
                {a.note && <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">{a.note}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeEmailMutation.mutate(a.id)}
                className="shrink-0 rounded-full border border-border p-2 text-zinc-400 transition-colors hover:border-red-400/50 hover:text-red-300"
                data-testid={`whitelist-remove-${i}`}
                aria-label={`Remove ${a.email}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {allowed && allowed.length === 0 && (
            <p className="text-sm text-muted-foreground" data-testid="whitelist-empty">No approved emails yet.</p>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold">Registered customers</p>
          <div className="mt-4 space-y-2" data-testid="customers-list">
            {customers?.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-obsidian px-4 py-3" data-testid={`customer-row-${i}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm text-cream">{c.name}</p>
                  <p className="truncate font-mono text-[10px] text-zinc-500">{c.email}</p>
                </div>
              </div>
            ))}
            {customers && customers.length === 0 && (
              <p className="text-sm text-muted-foreground" data-testid="customers-empty">No customers registered yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-panel p-6" data-testid="deliveries-section">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-gold">
          <UploadCloud className="h-4 w-4" /> Deliver photos &amp; videos
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Upload full-quality files to a specific client. They&apos;ll see them in their portal and can
          download the originals.
        </p>
        <form
          className="mt-5 space-y-3"
          data-testid="delivery-upload-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (deliverFile && deliverTo && !deliverMutation.isPending) deliverMutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={deliverTo} onValueChange={(v: string) => setDeliverTo(v)}>
              <SelectTrigger data-testid="delivery-customer-select">
                <SelectValue>{(v: string) => customerEmails[v] ?? "Choose a registered client"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(customers ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.email} data-testid={`delivery-customer-${c.email}`}>
                    {c.name} — {c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {customers && customers.length === 0 && (
              <p className="text-xs text-zinc-500">Approve an email above and the client must register first.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery-file">Photo or video</Label>
            <Input
              id="delivery-file"
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
              onChange={(e) => setDeliverFile(e.target.files?.[0] ?? null)}
              data-testid="delivery-file-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery-caption">Caption (optional)</Label>
            <Input
              id="delivery-caption"
              placeholder="e.g. Wedding highlight film"
              value={deliverCaption}
              onChange={(e) => setDeliverCaption(e.target.value)}
              data-testid="delivery-caption-input"
            />
          </div>
          <Button
            type="submit"
            disabled={!deliverFile || !deliverTo || deliverMutation.isPending}
            className="rounded-full bg-gold px-6 text-sm font-semibold text-obsidian hover:bg-gold-bright disabled:opacity-50"
            data-testid="delivery-upload-button"
          >
            {deliverMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deliver File"}
          </Button>
        </form>

        <div className="mt-6 space-y-2" data-testid="deliveries-list">
          {deliveriesLoading && <div className="h-16 animate-pulse rounded-lg bg-obsidian" />}
          {deliveries?.map((f, i) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-obsidian px-3 py-3"
              data-testid={`delivery-row-${i}`}
            >
              {f.kind === "video" ? (
                <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-md bg-panel text-gold">
                  <Film className="h-4 w-4" />
                </span>
              ) : (
                <img
                  src={deliveryFileUrl(f.id)}
                  alt={f.original_filename}
                  loading="lazy"
                  className="h-11 w-14 shrink-0 rounded-md object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-cream" title={f.original_filename}>{f.original_filename}</p>
                <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                  → {f.user_email} · {formatSize(f.size)} · {safeDate(f.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Remove "${f.original_filename}"?`)) deleteDeliveryMutation.mutate(f.id);
                }}
                className="shrink-0 rounded-full border border-border p-2 text-zinc-400 transition-colors hover:border-red-400/50 hover:text-red-300"
                data-testid={`delivery-delete-${i}`}
                aria-label={`Remove ${f.original_filename}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {deliveries && deliveries.length === 0 && (
            <p className="text-sm text-muted-foreground" data-testid="deliveries-empty">No files delivered yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
