import { PartsList } from "@/components/parts/PartsList";
import { getPartsList } from "@/lib/data";

export default async function ManagerPartsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string; take?: string }>;
}) {
  const params = await searchParams;
  const q = params?.q ?? "";
  const takeOptions = [20, 50, 100];
  const take = takeOptions.includes(Number(params?.take)) ? Number(params?.take) : 20;
  const page = Math.max(1, Number(params?.page) || 1);
  const skip = (page - 1) * take;
  const { parts, total } = await getPartsList("manager", q, "", "", "", take, skip);

  return <PartsList parts={parts} total={total} q={q} page={page} take={take} />;
}
