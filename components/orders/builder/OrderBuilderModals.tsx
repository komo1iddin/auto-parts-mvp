"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type {
  OrderItem,
  PendingNavigation,
} from "@/components/orders/types/orderBuilderTypes";

interface OrderBuilderModalsProps {
  deleteTarget: OrderItem | null;
  leavePromptOpen: boolean;
  pendingNavigation: PendingNavigation | null;
  error: string;
  saving: boolean;
  canSave: boolean;
  onCloseDelete: () => void;
  onConfirmDelete: (partId: string) => void;
  onCloseLeavePrompt: () => void;
  onLeaveAnyway: () => void;
  onSaveAndLeave: () => void;
}

export function OrderBuilderModals({
  deleteTarget,
  leavePromptOpen,
  error,
  saving,
  canSave,
  onCloseDelete,
  onConfirmDelete,
  onCloseLeavePrompt,
  onLeaveAnyway,
  onSaveAndLeave,
}: OrderBuilderModalsProps) {
  return (
    <>
      <Modal
        open={!!deleteTarget}
        onClose={onCloseDelete}
        title="Qismni o'chirish"
        className="max-w-sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Quyidagi qismni buyurtmadan o'chirasizmi?
            </p>
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <div className="font-mono font-semibold text-gray-800">{deleteTarget.partCode}</div>
              {deleteTarget.partName && (
                <div className="mt-0.5 text-xs text-gray-500">{deleteTarget.partName}</div>
              )}
              <div className="mt-1 text-xs text-gray-400">Miqdor: {deleteTarget.quantity}</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onCloseDelete}>
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                onClick={() => onConfirmDelete(deleteTarget.id ?? deleteTarget.partId ?? deleteTarget.localId ?? deleteTarget.partCode)}
              >
                O'chirish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={leavePromptOpen}
        onClose={onCloseLeavePrompt}
        title="Saqlanmagan o'zgarishlar"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bu sahifada saqlanmagan o'zgarishlar bor. Saqlab chiqasizmi yoki baribir chiqasizmi?
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCloseLeavePrompt} disabled={saving}>
              Qolish
            </Button>
            <Button variant="outline" onClick={onLeaveAnyway} disabled={saving}>
              Baribir chiqish
            </Button>
            <Button onClick={onSaveAndLeave} disabled={saving || !canSave}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
