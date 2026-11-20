import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Inbox, Lock } from "lucide-react";
import { perfilAtual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { linksFotosPedido } from "@/lib/fotosPedido";
import { DetalhePedido } from "@/components/DetalhePedido";
import type { ResumoPedido } from "@/components/CartaoPedido";
import { BotaoCancelar } from "./BotaoCancelar";

export const metadata: Metadata = { title: "Meu pedido" };

export default async function MeuPedido({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ novo?: string }> }) {
  const [{ id }, { novo }] = await Promise.all([params, searchParams]);
  const { perfil } = await perfilAtual();
  if (!perfil) redirect(`/entrar?voltar=/meus-pedidos/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select("id, cliente_id, categoria_slug, ac_tipo_servico, ac_btus, ac_quantidade, descricao, bairro, data_desejada, lance_inicial, status, pedido_fotos(caminho, ordem), pedido_endereco(endereco, referencia)")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.cliente_id !== perfil.id) notFound();

  const p = data as unknown as ResumoPedido & {
    pedido_fotos: { caminho: string; ordem: number }[];
    pedido_endereco: { endereco: string; referencia: string | null } | null;
  };
  const caminhos = [...p.pedido_fotos].sort((a, b) => a.ordem - b.ordem).map((f) => f.caminho);
  const links = await linksFotosPedido(supabase, caminhos);

  return (
    <div className="space-y-4">
      {novo && (
        <p className="flex items-center gap-2 rounded-xl bg-protegido-claro px-4 py-3 text-sm font-medium text-protegido">
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden /> Pedido publicado! Os profissionais da categoria já podem ver.
        </p>
      )}
      <DetalhePedido
        p={p}
        fotos={caminhos.map((c) => links[c]).filter(Boolean)}
        extra={
          <>
            {p.pedido_endereco && (
              <section className="cartao space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium text-suave"><Lock className="h-4 w-4" aria-hidden /> Endereço (só você vê até o pagamento)</p>
                <p>{p.pedido_endereco.endereco}</p>
                {p.pedido_endereco.referencia && <p className="text-sm text-suave">Ref.: {p.pedido_endereco.referencia}</p>}
              </section>
            )}
            <section className="cartao space-y-2 text-center">
              <Inbox className="mx-auto h-8 w-8 text-suave" aria-hidden />
              <h2 className="font-bold">Propostas recebidas</h2>
              <p className="text-sm text-suave">As propostas dos profissionais aparecerão aqui (Etapa 4).</p>
            </section>
            {p.status === "aberto" && <BotaoCancelar id={p.id} />}
          </>
        }
      />
    </div>
  );
}
