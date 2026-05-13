import { NextRequest } from "next/server";
import { forbidden, requireAdmin } from "@/lib/auth";
import {
  SETTING_OPTION_KINDS,
  type SettingOptionKind,
  getSettingOptions,
  makeSettingValue,
  revalidateAppData,
} from "@/lib/data";
import { prisma } from "@/lib/prisma";

const allowedKinds = new Set<string>(Object.values(SETTING_OPTION_KINDS));

function isSettingOptionKind(kind: string | null): kind is SettingOptionKind {
  return Boolean(kind && allowedKinds.has(kind));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");

  if (!isSettingOptionKind(kind)) {
    return Response.json({ error: "Noto'g'ri sozlama turi" }, { status: 400 });
  }

  const options = await getSettingOptions(kind);
  return Response.json({ options });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }

  const body = await req.json();
  const kind = typeof body.kind === "string" ? body.kind : null;
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const rawValue = typeof body.value === "string" ? body.value.trim() : "";
  const sortOrder = Number(body.sortOrder ?? 0);

  if (!isSettingOptionKind(kind)) {
    return Response.json({ error: "Noto'g'ri sozlama turi" }, { status: 400 });
  }
  if (!label) return Response.json({ error: "Nomi majburiy" }, { status: 400 });

  const value = rawValue || (kind === SETTING_OPTION_KINDS.brand ? label : makeSettingValue(label));
  if (!value) return Response.json({ error: "Qiymat majburiy" }, { status: 400 });

  try {
    const option = await prisma.settingOption.create({
      data: { kind, value, label, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 },
    });
    revalidateAppData("settings", "parts");
    return Response.json({ option }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("unique")) {
      return Response.json({ error: "Bu qiymat allaqachon mavjud" }, { status: 409 });
    }
    return Response.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
}
