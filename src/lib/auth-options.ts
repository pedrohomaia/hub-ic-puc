import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

type Credentials = {
  email: string;
  password: string;
};

type AppToken = JWT & {
  uid?: string;
  role?: string;
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
        const c = credentials as Credentials | null;

        const email = c?.email?.trim();
        const password = c?.password?.trim();

        if (!email || !password) return null;

        const envEmail = (process.env.DEV_AUTH_EMAIL ?? "").trim();
        const envPassword = (process.env.DEV_AUTH_PASSWORD ?? "").trim();

        const ok = email === envEmail && password === envPassword;
        if (!ok) return null;

        return {
          id: "dev-user-1",
          name: process.env.DEV_AUTH_NAME ?? "Admin Local",
          email,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      const t = token as AppToken;

      if (user) {
        // NextAuth User sempre tem id (string) quando vem do authorize()
        t.uid = user.id;
        t.role = process.env.DEV_AUTH_ROLE ?? "ADMIN";
      }

      return t;
    },

    async session({ session, token }) {
      const t = token as AppToken;

      if (session.user) {
        // sem any: adiciona campos via Record
        (session.user as Record<string, unknown>).id = t.uid ?? null;
        (session.user as Record<string, unknown>).role = t.role ?? null;
      }

      return session;
    },
  },
};