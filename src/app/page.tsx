import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth/signin");
  }

  redirect("/research");
}
