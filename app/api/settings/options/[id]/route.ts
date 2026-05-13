import { NextRequest } from "next/server";
import { forbidden, requireAdmin } from "@/lib/auth";
import { SETTING_OPTION_KINDS, makeSettingValue, revalidateAppData } from "@/lib/data";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }

  const { id } = await context.params;
  const body = await req.json();
  const kind = typeof body.kind === "string" ? body.kind : "";
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const rawValue = typeof body.value === "string" ? body.value.trim() : "";
  const sortOrder = Number(body.sortOrder ?? 0);

  if (!label) return Response.json({ error: "Nomi majburiy" }, { status: 400 });

  try {
    const option = await prisma.settingOption.update({
      where: { id },
      data: {
        label,
        value: rawValue || (kind === SETTING_OPTION_KINDS.brand ? label : makeSettingValue(label)),
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      },
    });
    revalidateAppData("settings", "parts");
    return Response.json({ option });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("unique")) {
      return Response.json({ error: "Bu qiymat allaqachon mavjud" }, { status: 409 });
    }
    return Response.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }

  const { id } = await context.params;
  await prisma.settingOption.delete({ where: { id } });
  revalidateAppData("settings", "parts");
  return Response.json({ ok: true });
}
