import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

type Credentials = {
  email: string;
  password: string;
};

type AppToken = JWT & {
  uid?: string;
  role?: string;
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET, // ✅ importante no App Router
  debug: process.env.NEXTAUTH_DEBUG === "true",
  session: { strategy: "jwt" },

  pages: { signIn: "/auth/signin" },

  providers: [
    CredentialsProvider({
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
      },

      async authorize(credentials) {
        const c = credentials as Credentials | null;

        const email = c?.email?.trim();
        const password = c?.password?.trim();

        if (!email || !password) return null;

        const envEmail = (process.env.DEV_AUTH_EMAIL ?? "").trim();
        const envPassword = (process.env.DEV_AUTH_PASSWORD ?? "").trim();

        const ok = email === envEmail && password === envPassword;
        if (!ok) return null;

        // ✅ garante User no banco e pega o ID REAL (cuid)
        const dbUser = await prisma.user.upsert({
          where: { email },
          update: { name: process.env.DEV_AUTH_NAME ?? "Admin Local" },
          create: {
            email,
            name: process.env.DEV_AUTH_NAME ?? "Admin Local",
          },
          select: { id: true, email: true, name: true },
        });

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      const t = token as AppToken;
      if (user) {
        t.uid = user.id;
        t.role = process.env.DEV_AUTH_ROLE ?? "ADMIN";
      }
      return t;
    },

    async session({ session, token }) {
      const t = token as AppToken;
      if (session.user) {
        (session.user as Record<string, unknown>).id = t.uid ?? null;
        (session.user as Record<string, unknown>).role = t.role ?? null;
      }
      return session;
    },
  },
};
