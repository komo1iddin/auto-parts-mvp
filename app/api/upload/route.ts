import { NextRequest } from "next/server";
import { requireAdmin, forbidden } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return Response.json({ error: "Fayl topilmadi" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["jpg", "jpeg", "png", "webp"].includes(ext ?? "")) {
    return Response.json({ error: "Faqat rasm fayllar ruxsat etiladi" }, { status: 400 });
  }

  const fileName = `parts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();

  const supabase = await createServiceClient();
  const { error } = await supabase.storage
    .from("parts-images")
    .upload(fileName, bytes, { contentType: file.type, upsert: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage
    .from("parts-images")
    .getPublicUrl(fileName);

  return Response.json({ url: urlData.publicUrl });
}
