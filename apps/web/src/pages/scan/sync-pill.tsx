import { useLiveQuery } from "dexie-react-hooks";
import { Badge } from "@/components/ui/badge";
import { pendingCount } from "../../lib/scan/db.js";
import { formatAgo } from "../../lib/scan/format.js";
import { useSyncStatus } from "../../lib/scan/sync.js";

/** Status sinkronisasi ringkas untuk bilah atas scanner. */
export function SyncPill() {
  const status = useSyncStatus();
  const pending = useLiveQuery(() => pendingCount(), [], 0);

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={status.revoked ? "destructive" : "outline"}
        className="gap-1.5 whitespace-nowrap"
      >
        <span
          className={`size-1.5 rounded-full ${status.revoked ? "bg-white" : status.online ? "bg-success" : "bg-warning"}`}
          aria-hidden
        />
        {status.revoked ? "Dicabut" : status.online ? "Online" : "Offline"}
        {pending > 0 && <span className="font-mono">· {pending} antre</span>}
      </Badge>
      {status.lastSyncAt && (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          sinkron {formatAgo(status.lastSyncAt)}
        </span>
      )}
    </div>
  );
}
