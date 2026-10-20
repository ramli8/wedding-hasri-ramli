import { useLiveQuery } from "dexie-react-hooks";
import { Badge } from "../../components/ui/badge.js";
import { pendingCount } from "../../lib/scan/db.js";
import { formatAgo } from "../../lib/scan/format.js";
import { useSyncStatus } from "../../lib/scan/sync.js";

/** Status sinkronisasi ringkas untuk bilah atas scanner. */
export function SyncPill() {
  const status = useSyncStatus();
  const pending = useLiveQuery(() => pendingCount(), [], 0);

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {status.revoked ? (
        <Badge variant="tag" className="border-alert bg-alert text-paper">
          Dicabut
        </Badge>
      ) : (
        <Badge variant={status.online ? "tag" : "solid"}>
          {status.online ? "Online" : "Offline"}
        </Badge>
      )}
      {pending > 0 && <Badge variant="pill">{pending} antre</Badge>}
      {status.lastSyncAt && (
        <span className="text-xs text-ink-soft">sinkron {formatAgo(status.lastSyncAt)}</span>
      )}
    </div>
  );
}
