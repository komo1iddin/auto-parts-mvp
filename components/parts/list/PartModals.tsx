import { PartDetails } from "@/components/parts/detail/PartDetails";
import { PartForm } from "@/components/parts/PartForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Part } from "@/components/parts/types/parts";

interface PartModalsProps {
  isAdmin: boolean;
  createOpen: boolean;
  addVariantFrom: Part | null;
  viewPart: Part | null;
  editPart: Part | null;
  imagePreview: Part | null;
  onCloseCreate: () => void;
  onCloseView: () => void;
  onCloseEdit: () => void;
  onCloseImagePreview: () => void;
  onCreateSuccess: () => void;
  onEditSuccess: () => void;
  onImageOpen: (part: Part) => void;
  onAddVariant: (part: Part) => void;
}

export function PartModals({
  isAdmin,
  createOpen,
  addVariantFrom,
  viewPart,
  editPart,
  imagePreview,
  onCloseCreate,
  onCloseView,
  onCloseEdit,
  onCloseImagePreview,
  onCreateSuccess,
  onEditSuccess,
  onImageOpen,
  onAddVariant,
}: PartModalsProps) {
  return (
    <>
      {isAdmin && (
        <Modal
          open={createOpen}
          onClose={onCloseCreate}
          title={addVariantFrom ? `Yangi variant: ${addVariantFrom.code}` : "Yangi qism qo'shish"}
          className="max-w-3xl"
        >
          <PartForm
            mode="create"
            defaultValues={addVariantFrom ? {
              code: addVariantFrom.code,
              name: addVariantFrom.name ?? "",
              categoryId: addVariantFrom.categoryId ?? "",
              categoryName: addVariantFrom.category?.name ?? "",
            } : undefined}
            onSuccess={onCreateSuccess}
            onCancel={onCloseCreate}
            className="space-y-5"
          />
        </Modal>
      )}

      <Modal
        open={Boolean(viewPart)}
        onClose={onCloseView}
        title={viewPart ? `Qism: ${viewPart.code}` : "Qism ma'lumotlari"}
        className="max-w-2xl"
      >
        {viewPart && (
          <>
            <PartDetails
              part={viewPart}
              isAdmin={isAdmin}
              onImageOpen={() => onImageOpen(viewPart)}
            />
            {isAdmin && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="mb-2 text-xs text-gray-400">
                  Bir xil kodda boshqa sifat (OEM, aftermarket...) yoki brend uchun:
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddVariant(viewPart)}
                >
                  + Yangi variant qo'shish
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      {isAdmin && (
        <Modal
          open={Boolean(editPart)}
          onClose={onCloseEdit}
          title={editPart ? `Qismni tahrirlash: ${editPart.code}` : "Qismni tahrirlash"}
          className="max-w-3xl"
        >
          {editPart && (
            <>
              <div className="mb-4 flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
                <p className="text-xs text-blue-600">
                  Shu kod bilan boshqa sifat (OEM, aftermarket...) yoki brend qo'shmoqchimisiz?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-3 shrink-0 border-blue-200 text-blue-700 hover:bg-blue-100"
                  onClick={() => { onCloseEdit(); onAddVariant(editPart); }}
                >
                  + Yangi variant
                </Button>
              </div>
              <PartForm
                mode="edit"
                defaultValues={{
                  id: editPart.id,
                  code: editPart.code,
                  name: editPart.name ?? "",
                  categoryId: editPart.categoryId ?? "",
                  brand: editPart.brand ?? "",
                  type: editPart.type,
                  sellingPriceCny: editPart.sellingPriceCny?.toString() ?? "",
                  supplierPrices: editPart.supplierPrices ?? [],
                  categoryName: editPart.category?.name ?? "",
                  supplierName: editPart.supplier?.name ?? "",
                  imageUrl: editPart.imageUrl ?? "",
                  note: editPart.note ?? "",
                }}
                onSuccess={onEditSuccess}
                onCancel={onCloseEdit}
                className="space-y-5"
              />
            </>
          )}
        </Modal>
      )}

      <Modal
        open={Boolean(imagePreview)}
        onClose={onCloseImagePreview}
        title={imagePreview ? `Rasm: ${imagePreview.code}` : "Rasm"}
        className="max-w-4xl"
      >
        {imagePreview?.imageUrl && (
          <div className="rounded-lg bg-gray-50 p-3">
            <img
              src={imagePreview.imageUrl}
              alt={imagePreview.name ?? imagePreview.code}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
        )}
      </Modal>
    </>
  );
}
