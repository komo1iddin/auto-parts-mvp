import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAdminOrManager, forbidden, getAuthUser } from "@/lib/auth";
import {
  generateInternalExcel,
  generateSupplierExcel,
  buildExportFileName,
} from "@/lib/excel";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { type, language, supplierId } = body as {
    type: "internal" | "supplier" | "supplier_by_supplier";
    language?: "cn" | "en";
    supplierId?: string;
  };

  // Supplier exports — admin only
  if (type === "supplier" || type === "supplier_by_supplier") {
    try {
      await requireAdmin();
    } catch {
      return forbidden("Faqat admin ta'minotchi exporti yarata oladi");
    }
  } else {
    try {
      await requireAdminOrManager();
    } catch {
      return forbidden();
    }
  }

  const user = await getAuthUser();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { partCode: "asc" } },
      customer: { select: { name: true } },
      creator: { select: { name: true } },
      updater: { select: { name: true } },
    },
  });

  if (!order) return Response.json({ error: "Topilmadi" }, { status: 404 });

  let workbook: ArrayBuffer;
  let fileName: string;
  const orderNum = order.currentOrderNumber;

  if (type === "internal") {
    workbook = generateInternalExcel(
      {
        currentOrderNumber: orderNum,
        version: order.version,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customerName: order.customer?.name,
        creatorName: order.creator?.name,
        updaterName: order.updater?.name,
      },
      order.items
    );
    fileName = buildExportFileName(orderNum, "internal");
  } else if (type === "supplier" && supplierId) {
    // Single supplier export
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    const supplierItems = order.items.filter((i) => i.supplierId === supplierId);
    if (!supplierItems.length) {
      return Response.json({ error: "Bu ta'minotchi uchun qismlar yo'q" }, { status: 400 });
    }
    workbook = generateSupplierExcel(
      {
        currentOrderNumber: orderNum,
        version: order.version,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      supplierItems,
      supplier?.name ?? "Ta'minotchi",
      language ?? "cn"
    );
    fileName = buildExportFileName(orderNum, "supplier", language ?? "cn", supplier?.name);
  } else if (type === "supplier_by_supplier") {
    // Return list of unique suppliers in this order
    const supplierIds = [...new Set(order.items.map((i) => i.supplierId).filter(Boolean))];
    return Response.json({
      suppliers: supplierIds,
      orderNumber: orderNum,
    });
  } else {
    return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  // Log export
  await prisma.orderExport.create({
    data: {
      orderId: id,
      exportType: type,
      language: language ?? "internal",
      supplierId: supplierId || null,
      fileName,
      exportedBy: user?.id || null,
    },
  });

  return new Response(workbook, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(workbook.byteLength),
    },
  });
}
