import { ChevronDown } from "lucide-react";
import type { Revision } from "@/components/orders/types/orderDetailTypes";
import { formatDateTime, splitChanges } from "@/components/orders/detail/orderDetailUtils";

export function OrderRevisions({ revisions }: { revisions: Revision[] }) {
  return (
    <details className="group overflow-hidden rounded-xl border border-gray-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <ChevronDown className="size-4 text-gray-400 transition-transform group-open:rotate-180" />
          <h2 className="font-semibold text-gray-900">Tahrirlash tarixi</h2>
        </div>
        <span className="text-sm text-gray-500">{revisions.length} ta yozuv</span>
      </summary>
      <div className="divide-y divide-gray-100 border-t border-gray-100">
        {revisions.length ? revisions.map((revision) => {
          const changes = splitChanges(revision.changeNote);
          const isLatest = revision.id === revisions[0]?.id;
          return (
            <details key={revision.id} className="group/revision" open={isLatest}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  <ChevronDown className="size-4 text-gray-400 transition-transform group-open/revision:rotate-180" />
                  <h3 className="font-mono text-sm font-semibold text-gray-900">{revision.newOrderNumber}</h3>
                  <span className="text-sm text-gray-500">V{revision.version}</span>
                  <span className="text-sm text-gray-500">{revision.changer?.name ?? "—"}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDateTime(revision.createdAt)}</span>
              </summary>
              <ul className="space-y-1 px-5 pb-4 pl-14 text-sm text-gray-600">
                {changes.map((change) => <li key={change}>{change}</li>)}
              </ul>
            </details>
          );
        }) : (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Tahrirlash tarixi yo'q</p>
        )}
      </div>
    </details>
  );
}
