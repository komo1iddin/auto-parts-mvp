import { ImagePlus } from "lucide-react";

interface PartImageUploadProps {
  imageUrl: string;
  uploading: boolean;
  isDragging: boolean;
  onDragStateChange: (isDragging: boolean) => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void;
}

export function PartImageUpload({
  imageUrl,
  uploading,
  isDragging,
  onDragStateChange,
  onFileSelect,
  onDrop,
}: PartImageUploadProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <span className="text-sm font-medium text-foreground">Rasm</span>
        {imageUrl && (
          <p className="mt-1 text-xs text-gray-500">
            Joriy rasm ko'rsatilmoqda. Almashtirish uchun yangi rasm tashlang yoki tanlang.
          </p>
        )}
      </div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          onDragStateChange(true);
        }}
        onDragLeave={() => onDragStateChange(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-left transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Qism rasmi"
            className="size-16 shrink-0 rounded-md border bg-white object-cover"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-white text-gray-500 shadow-xs">
            <ImagePlus className="size-5" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-gray-700">
            {imageUrl ? "Joriy rasm bor" : "Rasm yuklash"}
          </span>
          <span className="mt-1 block text-xs text-gray-500">
            Almashtirish uchun rasmni shu yerga tashlang yoki bosing.
          </span>
          <span className="mt-1 block text-xs text-gray-400">PNG, JPG yoki WEBP</span>
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="sr-only"
        />
      </label>
      {uploading && <p className="text-xs text-muted-foreground">Yuklanmoqda...</p>}
    </div>
  );
}
