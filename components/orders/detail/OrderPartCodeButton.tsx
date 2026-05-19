"use client";

import { useRef, useState } from "react";
import { PartDetails, type PartDetailsData } from "@/components/parts/detail/PartDetails";
import type { DetailItem } from "@/components/orders/types/orderDetailTypes";
import { Modal } from "@/components/ui/Modal";

interface OrderPartCodeButtonProps {
  item: DetailItem;
  isAdmin: boolean;
}

export function OrderPartCodeButton({ item, isAdmin }: OrderPartCodeButtonProps) {
  const [part, setPart] = useState<PartDetailsData | null>(null);
  const [imagePreview, setImagePreview] = useState<PartDetailsData | null>(null);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const code = item.partCode;

  function openPart() {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setPart(buildFallbackPart(item));
    setError("");

    window.setTimeout(() => {
      void loadCatalogPart(requestId);
    }, 0);
  }

  async function loadCatalogPart(requestId: number) {
    try {
      const res = await fetch(`/api/parts?q=${encodeURIComponent(code)}&take=10`);
      const data = await res.json();
      if (requestId !== requestIdRef.current) return;
      if (!res.ok) {
        setError(data.error ?? "Qism ma'lumotlarini olishda xatolik");
        return;
      }
      const found = (data.parts ?? []).find((item: PartDetailsData) => item.code === code) ?? data.parts?.[0];
      if (!found) {
        setError("Katalogda to'liq ma'lumot topilmadi. Buyurtmadagi ma'lumot ko'rsatilmoqda.");
        return;
      }
      setPart(found);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError("Katalog ma'lumotlarini olishda xatolik. Buyurtmadagi ma'lumot ko'rsatilmoqda.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPart}
        className="rounded-sm text-left text-[15px] font-semibold text-blue-700 underline-offset-2 transition-colors hover:text-blue-900 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className="font-sans tabular-nums">{code}</span>
      </button>

      <Modal
        open={Boolean(part)}
        onClose={() => {
          requestIdRef.current += 1;
          setPart(null);
          setError("");
        }}
        title={part ? `Qism: ${part.code}` : "Qism ma'lumotlari"}
        className="max-w-2xl"
      >
        {part ? (
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                {error}
              </div>
            )}
            <PartDetails part={part} isAdmin={isAdmin} onImageOpen={() => setImagePreview(part)} />
          </div>
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

function buildFallbackPart(item: DetailItem): PartDetailsData {
  return {
    code: item.partCode,
    name: item.partName,
    brand: null,
    type: item.type ?? "original",
    purchasePriceCny: toPartDetailsMoney(item.purchasePriceCny),
    sellingPriceCny: toPartDetailsMoney(item.sellingPriceCny),
    wholesalePriceCny: null,
    imageUrl: null,
    note: item.note,
    supplier: item.supplierName ? { name: item.supplierName } : null,
  };
}

function toPartDetailsMoney(value: DetailItem["purchasePriceCny"]) {
  if (value == null || typeof value === "string" || typeof value === "number") return value ?? null;
  return value.toString();
}
