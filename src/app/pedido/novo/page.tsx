import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { perfilAtual } from "@/lib/perfil";
import { buscarCategoria } from "@/lib/categorias";
import { FormNovoPedido } from "./FormNovoPedido";

export const metadata: Metadata = { title: "Pedir orçamento" };

export default async function NovoPedido({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const { perfil } = await perfilAtual();
  if (!perfil) redirect("/entrar?voltar=/pedido/novo");

  if (perfil.tipo === "profissional") {
    return (
      <div className="cartao space-y-3 text-center">
        <h1 className="text-xl font-bold">Conta de profissional</h1>
        <p className="text-suave">Pedidos são feitos por clientes. Veja os pedidos abertos da sua categoria no painel.</p>
        <Link href="/painel" className="btn-marca w-full">Ir para o painel</Link>
      </div>
    );
  }

  const cat = categoria && buscarCategoria(categoria)?.ativa ? categoria : "";
  return <FormNovoPedido categoriaInicial={cat} bairroInicial={perfil.bairro ?? ""} />;
}
