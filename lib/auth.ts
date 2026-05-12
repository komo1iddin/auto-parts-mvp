import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cache } from "react";

export type UserRole = "admin" | "manager" | "client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export async function hasAuthSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  if (!(await hasAuthSessionCookie())) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role as UserRole,
  };
});

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}

export async function requireAdminOrManager(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!["admin", "manager"].includes(user.role)) throw new Error("Forbidden");
  return user;
}

export function unauthorized(message = "Ruxsat yo'q") {
  return Response.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Taqiqlangan") {
  return Response.json({ error: message }, { status: 403 });
}
