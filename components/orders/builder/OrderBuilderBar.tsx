"use client";

import { ArrowLeft, X, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCny, formatNumber } from "@/lib/utils";

interface OrderItem {
  partId: string;
  partCode: string;
  partName: string;
  quantity: number;
}

interface UndoState {
  item: OrderItem;
  index: number;
}

interface Props {
  itemCount: number;
  totalQty: number;
  totalPurchase: number;
  totalSelling: number;
  isAdmin: boolean;
  undoState: UndoState | null;
  onUndo: () => void;
  onDismissUndo: () => void;
  saving: boolean;
  isEdit: boolean;
  onCancel: () => void;
  onBackToOrders: () => void;
  onSave: () => void;
}

export function OrderBuilderBar({
  itemCount,
  totalQty,
  totalPurchase,
  totalSelling,
  isAdmin,
  undoState,
  onUndo,
  onDismissUndo,
  saving,
  isEdit,
  onCancel,
  onBackToOrders,
  onSave,
}: Props) {
  const profit = totalSelling - totalPurchase;

  return (
    <>
      {/* Undo toast */}
      {undoState && (
        <div className="fixed bottom-20 left-64 right-0 z-50 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-lg text-sm">
            <span className="text-gray-600">
              <span className="font-mono font-semibold text-gray-800">{undoState.item.partCode}</span>{" "}
              o'chirildi
            </span>
            <button
              type="button"
              onClick={onUndo}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-700"
            >
              <Undo2 className="size-3" />
              Qaytarish
            </button>
            <button
              type="button"
              onClick={onDismissUndo}
              className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sticky action bar — left-64 matches sidebar w-64 */}
      <div className="fixed bottom-0 left-64 right-0 z-40 border-t border-gray-200 bg-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>
              <span className="text-gray-400">Qismlar:</span>{" "}
              <strong>{formatNumber(itemCount)}</strong>
            </span>
            <span>
              <span className="text-gray-400">Miqdor:</span>{" "}
              <strong>{formatNumber(totalQty)}</strong>
            </span>
            {isAdmin && (
              <span>
                <span className="text-gray-400">Xarid:</span>{" "}
                <strong className="text-red-600">{formatCny(totalPurchase)}</strong>
              </span>
            )}
            <span>
              <span className="text-gray-400">Sotuv:</span>{" "}
              <strong className="text-green-600">{formatCny(totalSelling)}</strong>
            </span>
            {isAdmin && (totalSelling > 0 || totalPurchase > 0) && (
              <span>
                <span className="text-gray-400">Foyda:</span>{" "}
                <strong className={profit >= 0 ? "text-blue-600" : "text-red-600"}>
                  {formatCny(profit)}
                </strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isEdit && (
            <Button variant="outline" onClick={onBackToOrders} className="hover:border-gray-400 hover:bg-gray-100">
              <ArrowLeft className="size-4" />
              Buyurtmalar
            </Button>
            )}
            <Button variant="secondary" onClick={onCancel} className="hover:bg-gray-200 hover:text-gray-950">
              Bekor qilish
            </Button>
            <Button onClick={onSave} disabled={saving || itemCount === 0} className="hover:bg-gray-800">
              {saving ? "Saqlanmoqda..." : isEdit ? "Yangilash" : "Buyurtma yaratish"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
