import { requireAdminOrManager, unauthorized } from "@/lib/auth";
import { DATA_TAGS, revalidateAppData } from "@/lib/data";

export async function POST() {
  try {
    await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  revalidateAppData(...(Object.keys(DATA_TAGS) as Array<keyof typeof DATA_TAGS>));
  return Response.json({ revalidated: true });
}
