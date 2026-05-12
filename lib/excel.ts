import * as XLSX from "xlsx";

type OrderItemRow = {
  partCode: string;
  partName: string | null;
  categoryName: string | null;
  brand: string | null;
  type: string | null;
  purchasePriceCny: { toString(): string } | null;
  wholesalePriceCny: { toString(): string } | null;
  sellingPriceCny: { toString(): string } | null;
  supplierName: string | null;
  supplierId: string | null;
  quantity: number;
  note: string | null;
};

type OrderMeta = {
  currentOrderNumber: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  creatorName?: string;
  updaterName?: string;
};

function toNum(v: { toString(): string } | number | null | undefined): number {
  if (v == null) return 0;
  return Number(v);
}

export function generateInternalExcel(
  order: OrderMeta,
  items: OrderItemRow[]
): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  const headerRows = [
    ["Buyurtma raqami:", order.currentOrderNumber],
    ["Versiya:", `V${order.version}`],
    ["Buyurtma sanasi:", order.createdAt.toLocaleDateString("uz")],
    ["Oxirgi yangilanish:", order.updatedAt.toLocaleDateString("uz")],
    ["Yaratdi:", order.creatorName ?? ""],
    ["Tahrirladi:", order.updaterName ?? ""],
    [],
    [
      "№",
      "Qism kodi",
      "Nomi",
      "Kategoriya",
      "Brend",
      "Turi",
      "Miqdor",
      "Xarid narxi (¥)",
      "Ulgurji narx (¥)",
      "Sotuv narxi (¥)",
      "Ta'minotchi",
      "Izoh",
      "Yetkazib berish",
      "Bojxona",
      "Qo'shimcha xarajatlar",
      "Eslatmalar",
    ],
  ];

  const dataRows = items.map((item, idx) => [
    idx + 1,
    item.partCode,
    item.partName ?? "",
    item.categoryName ?? "",
    item.brand ?? "",
    item.type ?? "",
    item.quantity,
    toNum(item.purchasePriceCny),
    toNum(item.wholesalePriceCny),
    toNum(item.sellingPriceCny),
    item.supplierName ?? "",
    item.note ?? "",
    "",
    "",
    "",
    "",
  ]);

  const totalPurchase = items.reduce(
    (s, i) => s + toNum(i.purchasePriceCny) * i.quantity,
    0
  );
  const totalSelling = items.reduce(
    (s, i) => s + toNum(i.sellingPriceCny) * i.quantity,
    0
  );

  const summaryRow = [
    "",
    "",
    "",
    "",
    "",
    "JAMI:",
    items.reduce((s, i) => s + i.quantity, 0),
    totalPurchase,
    "",
    totalSelling,
    "",
    "",
    "",
    "",
    "",
    "",
  ];

  const ws = XLSX.utils.aoa_to_sheet([
    ...headerRows,
    ...dataRows,
    summaryRow,
  ]);

  // Column widths
  ws["!cols"] = [
    { wch: 4 }, { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 12 },
    { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Buyurtma");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function generateSupplierExcel(
  order: OrderMeta,
  items: OrderItemRow[],
  supplierName: string,
  language: "cn" | "en"
): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  const isCn = language === "cn";

  const columns = isCn
    ? ["序号", "零件编号", "产品名称", "品牌", "类型", "数量", "单价（人民币）", "总价（人民币）", "备注"]
    : ["No.", "Part Code", "Product Name", "Brand", "Type", "Quantity", "Unit Price (CNY)", "Total Price (CNY)", "Notes"];

  const typeLabel = (t: string | null) => {
    if (!t) return "";
    const map: Record<string, Record<string, string>> = {
      cn: { original: "原厂", oem: "OEM", copy: "副厂", analog: "代用" },
      en: { original: "Original", oem: "OEM", copy: "Copy", analog: "Analog" },
    };
    return map[language]?.[t] ?? t;
  };

  const headerLabel = isCn
    ? `供应商：${supplierName}  订单：${order.currentOrderNumber}`
    : `Supplier: ${supplierName}  Order: ${order.currentOrderNumber}`;

  const headerRows = [
    [headerLabel],
    [],
    columns,
  ];

  const dataRows = items.map((item, idx) => [
    idx + 1,
    item.partCode,
    item.partName ?? "",
    item.brand ?? "",
    typeLabel(item.type),
    item.quantity,
    toNum(item.purchasePriceCny),
    toNum(item.purchasePriceCny) * item.quantity,
    item.note ?? "",
  ]);

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce(
    (s, i) => s + toNum(i.purchasePriceCny) * i.quantity,
    0
  );

  const totalLabel = isCn ? "合计" : "Total";
  const summaryLabelRow = [totalLabel, "", "", "", "", totalQty, "", totalPrice, ""];

  const ws = XLSX.utils.aoa_to_sheet([
    ...headerRows,
    ...dataRows,
    summaryLabelRow,
  ]);

  ws["!cols"] = [
    { wch: 4 }, { wch: 16 }, { wch: 22 }, { wch: 12 }, { wch: 10 },
    { wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
  ];

  const sheetName = isCn ? "订单" : "Order";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function buildExportFileName(
  orderNumber: string,
  type: "internal" | "supplier",
  language?: "cn" | "en",
  supplierName?: string
): string {
  if (type === "internal") return `${orderNumber}.xlsx`;
  const suffix = language === "cn" ? "CN" : "EN";
  const prefix = supplierName
    ? `${supplierName.replace(/\s+/g, "-")}-`
    : "Supplier-";
  return `${prefix}${orderNumber}-${suffix}.xlsx`;
}
