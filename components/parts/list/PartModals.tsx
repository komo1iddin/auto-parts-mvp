import { PartDetails } from "@/components/parts/detail/PartDetails";
import { PartForm } from "@/components/parts/PartForm";
import { Modal } from "@/components/ui/Modal";
import type { Part } from "@/components/parts/types/parts";

interface PartModalsProps {
  isAdmin: boolean;
  createOpen: boolean;
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
}

export function PartModals({
  isAdmin,
  createOpen,
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
}: PartModalsProps) {
  return (
    <>
      {isAdmin && (
        <Modal
          open={createOpen}
          onClose={onCloseCreate}
          title="Yangi qism qo'shish"
          className="max-w-3xl"
        >
          <PartForm
            mode="create"
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
          <PartDetails
            part={viewPart}
            isAdmin={isAdmin}
            onImageOpen={() => onImageOpen(viewPart)}
          />
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
