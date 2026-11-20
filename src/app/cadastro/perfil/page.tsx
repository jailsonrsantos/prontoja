import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { perfilAtual } from "@/lib/perfil";
import { caminhoSeguro } from "@/lib/erros";
import { FormularioPerfil } from "./FormularioPerfil";

export const metadata: Metadata = { title: "Complete seu cadastro" };

export default async function PaginaCompletarCadastro({
  searchParams,
}: {
  searchParams: Promise<{ voltar?: string }>;
}) {
  const { voltar } = await searchParams;
  const { usuario, perfil } = await perfilAtual();
  if (!usuario) redirect("/entrar");
  if (perfil?.tipo && perfil.aceitou_termos_em) redirect(caminhoSeguro(voltar));

  return (
    <FormularioPerfil
      voltar={caminhoSeguro(voltar)}
      nomeInicial={perfil?.nome ?? ""}
      bairroInicial={perfil?.bairro ?? ""}
      tipoDefinido={perfil?.tipo ?? null}
      precisaAceitar={!perfil?.aceitou_termos_em}
    />
  );
}
