import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

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
  customerName?: string;
  creatorName?: string;
  updaterName?: string;
};

function toNum(v: { toString(): string } | number | null | undefined): number {
  if (v == null) return 0;
  return Number(v);
}

function customerInitials(name?: string | null): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toLowerCase() ?? "")
    .join("");
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
    ["Mijoz:", order.customerName ?? ""],
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

  ws["!cols"] = [
    { wch: 4 }, { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 12 },
    { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Buyurtma");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export async function generateSupplierExcel(
  order: OrderMeta,
  items: OrderItemRow[],
  supplierName: string,
  language: "cn" | "en"
): Promise<ArrayBuffer> {
  const isCn = language === "cn";

  const typeLabel = (t: string | null) => {
    if (!t) return "";
    const map: Record<string, Record<string, string>> = {
      cn: { original: "原厂", oem: "OEM", copy: "副厂", analog: "代用" },
      en: { original: "Original", oem: "OEM", copy: "Copy", analog: "Analog" },
    };
    return map[language]?.[t] ?? t;
  };

  // Build header label: 订单5月18日-wei-(am)
  const d = order.createdAt;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const initials = customerInitials(order.customerName);
  const headerLabel = isCn
    ? `订单${month}月${day}日-${supplierName}${initials ? `-(${initials})` : ""}`
    : `Order ${month}/${day} - ${supplierName}${initials ? ` (${initials})` : ""}`;

  // Columns (no 产品名称, no （人民币）, 零件编号→零件图号)
  const columns = isCn
    ? ["序号", "零件图号", "品牌", "类型", "数量", "单价", "总价", "备注"]
    : ["No.", "Part No.", "Brand", "Type", "Qty", "Unit Price", "Total Price", "Notes"];

  const wb = new ExcelJS.Workbook();
  const sheetName = isCn ? "订单" : "Order";
  const ws = wb.addWorksheet(sheetName);

  // Column widths (matching column order above)
  ws.columns = [
    { width: 6 },  // 序号
    { width: 18 }, // 零件图号
    { width: 14 }, // 品牌
    { width: 10 }, // 类型
    { width: 8 },  // 数量
    { width: 14 }, // 单价
    { width: 14 }, // 总价
    { width: 18 }, // 备注
  ];

  // Row 1: header label (merged across all columns)
  const headerRow = ws.addRow([headerLabel]);
  ws.mergeCells(1, 1, 1, columns.length);
  const headerCell = headerRow.getCell(1);
  headerCell.font = { bold: true, size: 12 };
  headerCell.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 22;

  // Row 2: empty
  ws.addRow([]);

  // Row 3: column headers
  const colHeaderRow = ws.addRow(columns);
  colHeaderRow.eachCell((cell, colNum) => {
    cell.font = { bold: true };
    cell.alignment = {
      horizontal: colNum === 2 ? "left" : "center",
      vertical: "middle",
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  colHeaderRow.height = 20;

  // Data rows
  items.forEach((item, idx) => {
    const unitPrice = toNum(item.purchasePriceCny);
    const totalPrice = unitPrice * item.quantity;
    const row = ws.addRow([
      idx + 1,
      item.partCode,
      item.brand ?? "",
      typeLabel(item.type),
      item.quantity,
      unitPrice || "",
      totalPrice || "",
      item.note ?? "",
    ]);
    row.eachCell((cell, colNum) => {
      cell.alignment = {
        horizontal: colNum === 2 ? "left" : "center",
        vertical: "middle",
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    row.height = 18;
  });

  // Summary row
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce(
    (s, i) => s + toNum(i.purchasePriceCny) * i.quantity,
    0
  );
  const totalLabel = isCn ? "合计" : "Total";
  const summaryRow = ws.addRow([totalLabel, "", "", "", totalQty, "", totalPrice, ""]);
  summaryRow.eachCell((cell, colNum) => {
    cell.font = { bold: true };
    cell.alignment = {
      horizontal: colNum === 2 ? "left" : "center",
      vertical: "middle",
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  summaryRow.height = 18;

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
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
