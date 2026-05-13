"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface AlertDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function AlertDialog({
  open,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  return (
    <Modal open={open} onClose={onCancel ?? onConfirm} title={title} className="max-w-sm">
      <div className="space-y-4">
        <p className="text-sm leading-6 text-gray-600">{description}</p>
        <div className="flex justify-end gap-2">
          {cancelLabel && (
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Kutilyapti..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
