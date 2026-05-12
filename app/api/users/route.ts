import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidateAppData } from "@/lib/data";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ users });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }

  const { name, email, password, role } = await req.json();
  if (!email || !password) {
    return Response.json({ error: "Email va parol majburiy" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: role ?? "manager" },
    user_metadata: { name: name ?? email.split("@")[0] },
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Ensure user row exists (trigger may handle it, upsert for safety)
  await prisma.user.upsert({
    where: { id: data.user.id },
    update: { name: name ?? email.split("@")[0], role: role ?? "manager" },
    create: {
      id: data.user.id,
      email,
      name: name ?? email.split("@")[0],
      role: role ?? "manager",
    },
  });

  revalidateAppData("users", "orders");
  return Response.json({ ok: true }, { status: 201 });
}
