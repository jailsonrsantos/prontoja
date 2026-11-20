import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, FileText, LogOut, UserRoundSearch } from "lucide-react";
import { perfilAtual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { FotoPerfil } from "./FotoPerfil";
import { FormConta } from "./FormConta";
import { CartaoLocalizacao } from "./CartaoLocalizacao";
import { meuLocal } from "@/lib/meuLocal";

export const metadata: Metadata = { title: "Minha conta" };

export default async function PaginaConta() {
  const { usuario, perfil } = await perfilAtual();
  if (!usuario || !perfil) redirect("/entrar?voltar=/conta");

  const supabase = await createClient();
  const [{ data: contato }, local] = await Promise.all([
    supabase.from("contatos_privados").select("telefone, whatsapp").eq("id", usuario.id).maybeSingle(),
    meuLocal(),
  ]);
  const provedor = usuario.app_metadata?.provider === "google" ? "Google" : "E-mail e senha";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-marca">Minha conta</h1>
        <span className="rounded-full bg-marca-clara px-3 py-1 text-xs font-semibold text-marca">
          {perfil.tipo === "profissional" ? "Profissional" : "Cliente"}
        </span>
      </div>

      <div className="cartao space-y-3">
        <FotoPerfil nome={perfil.nome} foto={perfil.foto_url} />
        <p className="text-sm text-suave">{usuario.email} · entrou com {provedor}</p>
      </div>

      {perfil.tipo === "profissional" && (
        <div className="cartao divide-y divide-slate-100 p-0">
          <Link href="/painel/curriculo" className="flex min-h-14 items-center gap-3 px-4">
            <FileText className="h-5 w-5 text-marca" aria-hidden />
            <span className="flex-1 font-medium">Editar meu mini currículo</span>
            <ChevronRight className="h-5 w-5 text-suave" aria-hidden />
          </Link>
          <Link href={`/profissional/${perfil.id}`} className="flex min-h-14 items-center gap-3 px-4">
            <UserRoundSearch className="h-5 w-5 text-marca" aria-hidden />
            <span className="flex-1 font-medium">Ver como os clientes me veem</span>
            <ChevronRight className="h-5 w-5 text-suave" aria-hidden />
          </Link>
        </div>
      )}

      <FormConta nome={perfil.nome} bairro={perfil.bairro ?? ""} telefone={contato?.telefone ?? null} whatsapp={contato?.whatsapp ?? null} />

      <CartaoLocalizacao fonte={local.fonte} />

      <form action="/auth/sair" method="post">
        <button className="btn-contorno w-full">
          <LogOut className="h-5 w-5" aria-hidden /> Sair
        </button>
      </form>
      <p className="text-center text-xs text-suave">
        <Link href="/termos" className="underline">Termos de Uso</Link> · <Link href="/privacidade" className="underline">Privacidade</Link>
      </p>
    </div>
  );
}
