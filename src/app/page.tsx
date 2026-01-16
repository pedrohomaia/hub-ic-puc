import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth/signin"); // ou "/auth" se você criar /auth/page.tsx
}
