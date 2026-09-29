import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { apiGet, apiPatch, ApiError } from "@/lib/api";
import { formatApiError, type Enquiry } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<Enquiry["status"], string> = {
  new: "New",
  contacted: "Contacted",
  booked: "Booked",
  archived: "Archived",
};

const STATUS_STYLES: Record<Enquiry["status"], string> = {
  new: "border-gold/50 text-gold-soft",
  contacted: "border-sky-400/40 text-sky-300",
  booked: "border-emerald-400/40 text-emerald-300",
  archived: "border-zinc-600 text-zinc-400",
};

function safeDate(iso: string) {
  try {
    return format(new Date(iso), "dd MMM yyyy, hh:mm a");
  } catch {
    return iso;
  }
}

export function EnquiriesPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-enquiries"],
    queryFn: () => apiGet<Enquiry[]>("/enquiries"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Enquiry["status"] }) =>
      apiPatch<Enquiry>(`/enquiries/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-enquiries"] });
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? formatApiError((e.body as { detail?: unknown } | null)?.detail) : "Update failed");
    },
  });

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl bg-panel" data-testid="enquiries-loading" />;
  }
  if (isError) {
    return (
      <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-300" data-testid="enquiries-error">
        Could not load enquiries. Please sign in again.
      </p>
    );
  }
  if (!data || data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-panel px-5 py-10 text-center text-sm text-muted-foreground" data-testid="enquiries-empty">
        No enquiries yet — new bookings from the website will land here.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel" data-testid="enquiries-table">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-zinc-500">Received</TableHead>
            <TableHead className="text-zinc-500">Name</TableHead>
            <TableHead className="text-zinc-500">Phone</TableHead>
            <TableHead className="text-zinc-500">Event</TableHead>
            <TableHead className="text-zinc-500">Date</TableHead>
            <TableHead className="text-zinc-500">Location</TableHead>
            <TableHead className="text-zinc-500">Message</TableHead>
            <TableHead className="text-zinc-500">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((e) => (
            <TableRow key={e.id} className="border-border" data-testid={`enquiry-row-${e.id}`}>
              <TableCell className="whitespace-nowrap font-mono text-xs text-zinc-400">{safeDate(e.created_at)}</TableCell>
              <TableCell className="font-medium text-cream">{e.name}</TableCell>
              <TableCell>
                <a href={`tel:${e.phone.replace(/\s/g, "")}`} className="text-gold-soft hover:underline">
                  {e.phone}
                </a>
              </TableCell>
              <TableCell className="text-zinc-300">{e.event_type}</TableCell>
              <TableCell className="whitespace-nowrap text-zinc-300">{e.event_date || "—"}</TableCell>
              <TableCell className="text-zinc-300">{e.location || "—"}</TableCell>
              <TableCell className="max-w-[220px] truncate text-zinc-400" title={e.message ?? ""}>
                {e.message || "—"}
              </TableCell>
              <TableCell>
                <Select
                  value={e.status}
                  onValueChange={(v: string) =>
                    statusMutation.mutate({ id: e.id, status: v as Enquiry["status"] })
                  }
                >
                  <SelectTrigger
                    className={`h-8 w-[130px] rounded-full border text-xs ${STATUS_STYLES[e.status]}`}
                    data-testid={`enquiry-status-${e.id}`}
                  >
                    <SelectValue>{(v: string) => STATUS_LABELS[v as Enquiry["status"]] ?? v}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as Enquiry["status"][]).map((s) => (
                      <SelectItem key={s} value={s} data-testid={`enquiry-status-option-${s}`}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
