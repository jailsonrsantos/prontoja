import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { perfilAtual, primeiroNome } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { meuLocal } from "@/lib/meuLocal";
import { linksFotosPedido } from "@/lib/fotosPedido";
import { PedidosProximos, type PedidoProximo } from "./PedidosProximos";

export const metadata: Metadata = { title: "Painel do profissional" };

export default async function PainelProfissional() {
  const { perfil } = await perfilAtual();
  if (!perfil) redirect("/entrar?voltar=/painel");
  if (perfil.tipo !== "profissional") redirect("/meus-pedidos");

  const supabase = await createClient();
  const [{ data: prof }, { count: nEsp }, { count: nFotos }, { data: contato }, local, { data: proximos }] = await Promise.all([
    supabase.from("profissionais").select("descricao, raio_km").eq("id", perfil.id).single(),
    supabase.from("profissional_categorias").select("*", { count: "exact", head: true }).eq("profissional_id", perfil.id),
    supabase.from("portfolio_fotos").select("*", { count: "exact", head: true }).eq("profissional_id", perfil.id),
    supabase.from("contatos_privados").select("whatsapp").eq("id", perfil.id).maybeSingle(),
    meuLocal(),
    supabase.rpc("buscar_pedidos_proximos"),
  ]);

  // Primeira foto de cada pedido (link temporário)
  const pedidos = (proximos ?? []) as PedidoProximo[];
  const { data: capas } = pedidos.length
    ? await supabase.from("pedido_fotos").select("pedido_id, caminho, ordem").in("pedido_id", pedidos.map((p) => p.id)).order("ordem")
    : { data: [] };
  const capaDe = new Map<string, string>();
  (capas ?? []).forEach((c) => !capaDe.has(c.pedido_id) && capaDe.set(c.pedido_id, c.caminho));
  const links = await linksFotosPedido(supabase, [...capaDe.values()]);
  const pedidosComCapa = pedidos.map((p) => ({ ...p, capa: capaDe.has(p.id) ? links[capaDe.get(p.id)!] : null }));

  const passos = [
    { feito: Boolean(perfil.foto_url), texto: "Foto de perfil", href: "/painel/curriculo" },
    { feito: (nEsp ?? 0) > 0, texto: "Especialidades", href: "/painel/curriculo" },
    { feito: (prof?.descricao?.length ?? 0) >= 20, texto: "Descrição do seu trabalho", href: "/painel/curriculo" },
    { feito: (nFotos ?? 0) > 0, texto: "Fotos de trabalhos", href: "/painel/curriculo" },
    { feito: Boolean(contato?.whatsapp), texto: "WhatsApp (fica protegido)", href: "/conta" },
  ];
  const completos = passos.filter((p) => p.feito).length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-marca">Olá, {primeiroNome(perfil.nome)}!</h1>

      {completos < passos.length && (
        <section className="cartao space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold">Complete seu perfil</h2>
            <span className="text-sm text-suave">{completos}/{passos.length}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-protegido" style={{ width: `${(completos / passos.length) * 100}%` }} />
          </div>
          <ul className="divide-y divide-slate-100">
            {passos.map((p) => (
              <li key={p.texto}>
                <Link href={p.href} className="flex min-h-11 items-center gap-3">
                  {p.feito ? <CheckCircle2 className="h-5 w-5 text-protegido" aria-hidden /> : <Circle className="h-5 w-5 text-slate-300" aria-hidden />}
                  <span className={p.feito ? "text-suave line-through" : "font-medium"}>{p.texto}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PedidosProximos pedidos={pedidosComCapa} local={local} raioKm={prof?.raio_km ?? 10} />
    </div>
  );
}
