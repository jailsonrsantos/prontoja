import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { perfilAtual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { FotoPerfil } from "@/app/conta/FotoPerfil";
import { SeloVerificado } from "@/components/Selos";
import { FormCurriculo } from "./FormCurriculo";
import { FotosTrabalhos } from "./FotosTrabalhos";
import type { FotoPortfolio } from "@/lib/tipos";

export const metadata: Metadata = { title: "Meu mini currículo" };

export default async function PaginaCurriculo({ searchParams }: { searchParams: Promise<{ novo?: string }> }) {
  const { novo } = await searchParams;
  const { perfil } = await perfilAtual();
  if (!perfil) redirect("/entrar?voltar=/painel/curriculo");
  if (perfil.tipo !== "profissional") redirect("/conta");

  const supabase = await createClient();
  const [{ data: prof }, { data: esp }, { data: fotos }] = await Promise.all([
    supabase.from("profissionais").select("descricao, cursos, verificado").eq("id", perfil.id).single(),
    supabase.from("profissional_categorias").select("categoria_slug").eq("profissional_id", perfil.id),
    supabase.from("portfolio_fotos").select("id, caminho, legenda").eq("profissional_id", perfil.id).order("criado_em"),
  ]);

  return (
    <div className="space-y-4">
      {novo && (
        <p className="rounded-xl bg-marca-clara px-4 py-3 text-sm text-marca">
          <strong>Bem-vindo!</strong> Complete seu currículo: profissionais com foto, descrição e fotos de trabalhos recebem mais respostas.
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-marca">Meu mini currículo</h1>
        <Link href={`/profissional/${perfil.id}`} className="btn-contorno px-3 text-sm">
          <Eye className="h-4 w-4" aria-hidden /> Ver
        </Link>
      </div>

      <div className="cartao space-y-2">
        <FotoPerfil nome={perfil.nome} foto={perfil.foto_url} />
        {prof?.verificado ? (
          <SeloVerificado />
        ) : (
          <p className="text-xs text-suave">O selo “Verificado” é concedido pela equipe ProntoJá após conferência de documentos.</p>
        )}
      </div>

      <FormCurriculo
        descricao={prof?.descricao ?? ""}
        cursos={prof?.cursos ?? []}
        especialidades={(esp ?? []).map((e) => e.categoria_slug as string)}
      />
      <FotosTrabalhos fotos={(fotos ?? []) as FotoPortfolio[]} />
    </div>
  );
}
