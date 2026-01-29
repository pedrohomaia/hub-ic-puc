import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/signin");

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Logado como: {user.email}</p>
      <p>UserId: {user.id}</p>
    </main>
  );
}
