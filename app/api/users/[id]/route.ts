import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidateAppData } from "@/lib/data";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }
  const { id } = await params;
  const { name, role, canCreateClientPayments } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      role,
      canCreateClientPayments: role === "manager" ? Boolean(canCreateClientPayments) : false,
    },
  });

  // Update app_metadata in auth
  const supabase = await createServiceClient();
  await supabase.auth.admin.updateUserById(id, { app_metadata: { role } });

  revalidateAppData("users", "orders");
  return Response.json({ user });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }
  const { id } = await params;

  const supabase = await createServiceClient();
  await supabase.auth.admin.deleteUser(id);
  // Cascade via FK will handle users table

  revalidateAppData("users", "orders");
  return Response.json({ ok: true });
}
