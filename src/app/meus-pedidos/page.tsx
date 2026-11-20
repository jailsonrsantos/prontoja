import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { perfilAtual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { linksFotosPedido } from "@/lib/fotosPedido";
import { CartaoPedido, type ResumoPedido } from "@/components/CartaoPedido";

export const metadata: Metadata = { title: "Meus pedidos" };

export default async function MeusPedidos() {
  const { perfil } = await perfilAtual();
  if (!perfil) redirect("/entrar?voltar=/meus-pedidos");
  if (perfil.tipo === "profissional") redirect("/painel");

  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select("id, categoria_slug, ac_tipo_servico, ac_btus, ac_quantidade, descricao, bairro, data_desejada, lance_inicial, status, pedido_fotos(caminho, ordem)")
    .eq("cliente_id", perfil.id)
    .order("criado_em", { ascending: false })
    .limit(50);

  const pedidos = (data ?? []) as (ResumoPedido & { pedido_fotos: { caminho: string; ordem: number }[] })[];
  const capas = pedidos.map((p) => [...p.pedido_fotos].sort((a, b) => a.ordem - b.ordem)[0]?.caminho).filter(Boolean) as string[];
  const links = await linksFotosPedido(supabase, capas);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-marca">Meus pedidos</h1>
        <Link href="/pedido/novo" className="btn-acao px-4 text-sm"><Plus className="h-4 w-4" aria-hidden /> Novo</Link>
      </div>
      {pedidos.length === 0 ? (
        <div className="cartao space-y-3 text-center">
          <p className="text-suave">Você ainda não fez nenhum pedido.</p>
          <Link href="/pedido/novo" className="btn-acao w-full">Pedir orçamento com fotos</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {pedidos.map((p) => {
            const capa = [...p.pedido_fotos].sort((a, b) => a.ordem - b.ordem)[0]?.caminho;
            return (
              <li key={p.id}>
                <CartaoPedido p={{ ...p, total_fotos: p.pedido_fotos.length, capa: capa ? links[capa] : null }} href={`/meus-pedidos/${p.id}`} mostrarStatus />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
