import type { NextRequest } from "next/server";
import { requireAdminOrManager, unauthorized } from "@/lib/auth";
import { parseClipboardOrderText } from "./_lib/clipboard";
import { finalizeImport } from "./_lib/service";
import { parseWorkbook } from "./_lib/workbook";

export async function POST(req: NextRequest) {
  try {
    await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  try {
    if (isJsonRequest(req)) {
      return importResolvedRows(req);
    }

    return importWorkbook(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Excel import qilishda xatolik yuz berdi";
    return Response.json({ error: message }, { status: 500 });
  }
}

function isJsonRequest(req: NextRequest) {
  return (req.headers.get("content-type") ?? "").includes("application/json");
}

async function importResolvedRows(req: NextRequest) {
  const body = await req.json();
  if (typeof body.text === "string") {
    const parsedRows = parseClipboardOrderText(body.text);
    if (!parsedRows.length) {
      return Response.json({ error: "Clipboard matnidan part number, narx va son topilmadi" }, { status: 400 });
    }

    return Response.json(await finalizeImport(parsedRows));
  }

  if (!Array.isArray(body.rows)) {
    return Response.json({ error: "Import qatorlari yuborilmadi" }, { status: 400 });
  }

  return Response.json(await finalizeImport(body.rows, body.resolutions ?? []));
}

async function importWorkbook(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Excel fayl yuborilmadi" }, { status: 400 });
  }

  const parsedRows = parseWorkbook(await file.arrayBuffer());
  if (!parsedRows.length) {
    return Response.json({ error: "Excel ichidan part number ustuni topilmadi" }, { status: 400 });
  }

  return Response.json(await finalizeImport(parsedRows));
}
