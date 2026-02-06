import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hub IC PUC",
  description: "Hub de pesquisas e ranking público (IC PUC).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          "min-h-screen antialiased text-foreground",
          // fundo premium (menos “chapado”)
          "bg-gradient-to-b from-[#050814] via-[#060A18] to-[#070A1C]",
        ].join(" ")}
      >
        {/* glows sutis (deixa vivo sem virar carnaval) */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -top-32 right-[-120px] h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-[-180px] left-[-140px] h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <SiteHeader />

        <main className="mx-auto max-w-6xl px-4 py-6">
          {/* frame do conteúdo (a “caixa” que dá cara de produto) */}
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-6">
            {children}
          </div>

          <footer className="mx-auto mt-8 pb-6 text-center text-xs text-foreground/50">
            Hub IC PUC • público/portfólio
          </footer>
        </main>
      </body>
    </html>
  );
}
