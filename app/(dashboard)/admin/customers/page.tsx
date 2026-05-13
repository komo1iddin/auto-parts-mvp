import { CustomersList } from "@/components/customers/CustomersList";
import { getCustomersList } from "@/lib/data";

export default async function AdminCustomersPage() {
  const customers = await getCustomersList();

  return <CustomersList customers={customers} />;
}
