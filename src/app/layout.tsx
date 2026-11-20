import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Cabecalho } from "@/components/Cabecalho";
import { MenuInferior } from "@/components/MenuInferior";
import { RegistrarServiceWorker } from "@/components/RegistrarServiceWorker";
import { perfilAtual } from "@/lib/perfil";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ProntoJá — Profissionais em Teresina", template: "%s · ProntoJá" },
  description:
    "Peça orçamento com fotos e contrate pintor, eletricista, encanador e técnico de ar-condicionado em Teresina-PI.",
  applicationName: "ProntoJá",
  appleWebApp: { capable: true, title: "ProntoJá", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icones/icone-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icones/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E3A8A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { perfil } = await perfilAtual();
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh antialiased">
        <Cabecalho />
        <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-4">{children}</main>
        <MenuInferior tipo={perfil?.tipo} />
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
