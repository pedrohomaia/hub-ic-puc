import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "@/lib/db";

type Credentials = { email: string; password: string };

type AppToken = JWT & {
  uid?: string;
  role?: string | null;
};

const isDevAuth = (process.env.AUTH_MODE ?? "dev") === "dev";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === "true",
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },

  providers: [
    ...(isDevAuth
      ? [
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

              if (email !== envEmail || password !== envPassword) return null;

              const dbUser = await prisma.user.upsert({
                where: { email },
                update: { name: process.env.DEV_AUTH_NAME ?? "Admin Local" },
                create: {
                  email,
                  name: process.env.DEV_AUTH_NAME ?? "Admin Local",
                },
                select: { id: true, email: true, name: true },
              });

              return { id: dbUser.id, name: dbUser.name, email: dbUser.email };
            },
          }),
        ]
      : [
          AzureADProvider({
            clientId: process.env.MICROSOFT_CLIENT_ID!,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
            tenantId: process.env.MICROSOFT_TENANT_ID!,
          }),
        ]),
  ],

  callbacks: {
    async jwt({ token, user }) {
      const t = token as AppToken;

      // Primeiro login (quando "user" existe) -> garante user no Prisma e pega ID real.
      if (user?.email) {
        const email = String(user.email).trim().toLowerCase();

        const dbUser = await prisma.user.upsert({
          where: { email },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined, // ✅ sem any
          },
          create: {
            email,
            name: user.name ?? null,
            image: user.image ?? null, // ✅ sem any
          },
          select: { id: true },
        });

        t.uid = dbUser.id;

        // role só no modo dev
        t.role = isDevAuth ? process.env.DEV_AUTH_ROLE ?? "ADMIN" : null;
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
