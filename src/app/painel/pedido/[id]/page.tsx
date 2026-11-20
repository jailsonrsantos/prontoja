import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Gavel, Lock, UserRound } from "lucide-react";
import { perfilAtual, primeiroNome } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { linksFotosPedido } from "@/lib/fotosPedido";
import { DetalhePedido } from "@/components/DetalhePedido";
import type { ResumoPedido } from "@/components/CartaoPedido";

export const metadata: Metadata = { title: "Pedido" };

export default async function PedidoParaProfissional({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { perfil } = await perfilAtual();
  if (!perfil) redirect(`/entrar?voltar=/painel/pedido/${id}`);
  if (perfil.tipo !== "profissional") redirect(`/meus-pedidos/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  // As regras do banco só devolvem o pedido se ele for da categoria do profissional e estiver aberto
  const { data } = await supabase
    .from("pedidos")
    .select("id, categoria_slug, ac_tipo_servico, ac_btus, ac_quantidade, descricao, bairro, data_desejada, lance_inicial, status, perfis(nome), pedido_fotos(caminho, ordem)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const p = data as unknown as ResumoPedido & { perfis: { nome: string } | null; pedido_fotos: { caminho: string; ordem: number }[] };
  const caminhos = [...p.pedido_fotos].sort((a, b) => a.ordem - b.ordem).map((f) => f.caminho);
  const links = await linksFotosPedido(supabase, caminhos);

  return (
    <div className="space-y-4">
      <Link href="/painel" className="text-sm font-medium text-marca">← Voltar ao painel</Link>
      <DetalhePedido
        p={p}
        fotos={caminhos.map((c) => links[c]).filter(Boolean)}
        extra={
          <>
            <section className="cartao flex items-center gap-3">
              <UserRound className="h-5 w-5 text-marca" aria-hidden />
              <p className="text-sm">
                Cliente: <strong>{primeiroNome(p.perfis?.nome)}</strong>
              </p>
            </section>
            <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-suave">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Endereço completo e telefone do cliente são liberados depois do acordo fechado e pago.
            </p>
            <button type="button" disabled className="btn-acao w-full">
              <Gavel className="h-5 w-5" aria-hidden /> Dar lance (disponível na Etapa 4)
            </button>
          </>
        }
      />
    </div>
  );
}
