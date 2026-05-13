"use client";

import { useState } from "react";
import { PartDetails, type PartDetailsData } from "@/components/parts/detail/PartDetails";
import { Modal } from "@/components/ui/Modal";

interface OrderPartCodeButtonProps {
  code: string;
  isAdmin: boolean;
}

export function OrderPartCodeButton({ code, isAdmin }: OrderPartCodeButtonProps) {
  const [part, setPart] = useState<PartDetailsData | null>(null);
  const [imagePreview, setImagePreview] = useState<PartDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPart() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/parts?q=${encodeURIComponent(code)}&take=10`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Qism ma'lumotlarini olishda xatolik");
        return;
      }
      const found = (data.parts ?? []).find((item: PartDetailsData) => item.code === code) ?? data.parts?.[0];
      if (!found) {
        setError("Bu kod bo'yicha qism topilmadi");
        return;
      }
      setPart(found);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPart}
        className="rounded-sm text-left font-mono text-sm font-medium text-blue-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {loading ? "Yuklanmoqda..." : code}
      </button>

      <Modal
        open={Boolean(part) || Boolean(error)}
        onClose={() => {
          setPart(null);
          setError("");
        }}
        title={part ? `Qism: ${part.code}` : "Qism ma'lumotlari"}
        className="max-w-2xl"
      >
        {part ? (
          <PartDetails part={part} isAdmin={isAdmin} onImageOpen={() => setImagePreview(part)} />
        ) : (
          <p className="text-sm text-gray-600">{error}</p>
        )}
      </Modal>

      <Modal
        open={Boolean(imagePreview)}
        onClose={() => setImagePreview(null)}
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
