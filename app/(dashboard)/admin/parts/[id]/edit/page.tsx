import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PartForm } from "@/components/parts/PartForm";

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const part = await prisma.partVariant.findUnique({
    where: { id },
    include: {
      part: true,
      supplierPrices: { include: { supplier: true }, orderBy: [{ purchasePriceCny: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!part) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Qismni tahrirlash: <span className="font-mono">{part.part.code}</span>
      </h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <PartForm
          mode="edit"
          defaultValues={{
            id: part.id,
            code: part.part.code,
            name: part.part.name ?? "",
            categoryId: part.part.categoryId ?? "",
            brand: part.brand ?? "",
            type: part.type,
            sellingPriceCny: part.sellingPriceCny?.toString() ?? "",
            supplierPrices: part.supplierPrices ?? [],
            imageUrl: part.imageUrl ?? "",
            note: part.note ?? "",
          }}
        />
      </div>
    </div>
  );
}
