import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrManager, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const { name, phone, note } = await req.json();
  if (!name?.trim()) return Response.json({ error: "Mijoz nomi majburiy" }, { status: 400 });

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      note: note?.trim() || null,
    },
  });

  revalidateAppData("customers", "orders");
  return Response.json({ customer });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const orderCount = await prisma.order.count({ where: { customerId: id } });
  if (orderCount > 0) {
    return Response.json(
      { error: "Bu mijozga bog'langan buyurtmalar bor" },
      { status: 409 }
    );
  }

  await prisma.customer.delete({ where: { id } });
  revalidateAppData("customers", "orders");
  return Response.json({ ok: true });
}
