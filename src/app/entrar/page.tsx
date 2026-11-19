import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioEntrar } from "./FormularioEntrar";
import { AvisoSupabase } from "@/components/AvisoSupabase";
import { usuarioAtual } from "@/lib/supabase/server";
import { caminhoSeguro } from "@/lib/erros";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ voltar?: string; modo?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const voltar = caminhoSeguro(params.voltar);
  if (await usuarioAtual()) redirect(voltar);

  return (
    <div className="space-y-4">
      <AvisoSupabase />
      <FormularioEntrar voltar={voltar} modoInicial={params.modo === "cadastro" ? "cadastro" : "entrar"} erroInicial={params.erro} />
    </div>
  );
}
