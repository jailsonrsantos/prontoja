import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { usuarioAtual } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Minha conta" };

export default async function PaginaConta() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/conta");

  const nome = (usuario.user_metadata?.nome || usuario.user_metadata?.full_name || "") as string;
  const provedor = usuario.app_metadata?.provider === "google" ? "Google" : "E-mail e senha";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-marca">Minha conta</h1>
      <div className="cartao space-y-2">
        {nome && <p className="text-lg font-semibold">{nome}</p>}
        <p className="text-suave">{usuario.email}</p>
        <p className="text-sm text-suave">Entrou com: {provedor}</p>
      </div>
      <form action="/auth/sair" method="post">
        <button className="btn-contorno w-full">
          <LogOut className="h-5 w-5" aria-hidden /> Sair
        </button>
      </form>
    </div>
  );
}
