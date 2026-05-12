import { SuppliersList } from "@/components/suppliers/SuppliersList";
import { getSuppliersList } from "@/lib/data";

export default async function SuppliersPage() {
  const suppliers = await getSuppliersList();

  return <SuppliersList suppliers={suppliers} />;
}
