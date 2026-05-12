import { UsersList } from "@/components/users/UsersList";
import { getUsersList } from "@/lib/data";

export default async function UsersPage() {
  const users = await getUsersList();

  return <UsersList users={users} />;
}
