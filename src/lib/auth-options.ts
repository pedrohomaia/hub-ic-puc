import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type Credentials = {
  email?: string;
  password?: string;
};

export const authOptions: NextAuthOptions = {
  debug: process.env.NEXTAUTH_DEBUG === "true",
  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/signin",
  },

  providers: [
    CredentialsProvider({
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
      },

      async authorize(credentials) {
  const email = (credentials as any)?.email;
  const password = (credentials as any)?.password;

  console.log("[AUTH] got email:", JSON.stringify(email));
  console.log("[AUTH] got hasPassword:", !!password);
  console.log("[AUTH] env email:", JSON.stringify(process.env.DEV_AUTH_EMAIL));
  console.log("[AUTH] env hasPassword:", !!process.env.DEV_AUTH_PASSWORD);

  const ok =
    (email ?? "").trim() === (process.env.DEV_AUTH_EMAIL ?? "").trim() &&
    (password ?? "").trim() === (process.env.DEV_AUTH_PASSWORD ?? "").trim();

  console.log("[AUTH] ok:", ok);

  if (!ok) return null;

  return {
    id: "dev-user-1",
    name: process.env.DEV_AUTH_NAME ?? "Admin Local",
    email: (email ?? "").trim(),
  };
}

    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).uid = (user as any).id;
        (token as any).role = process.env.DEV_AUTH_ROLE ?? "ADMIN";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).uid ?? null;
        (session.user as any).role = (token as any).role ?? null;
      }
      return session;
    },
  },
};
