"use server";

import { createClient } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/erros";
import { motivoContato } from "@/lib/contato";
import { buscarCategoria } from "@/lib/categorias";
import { BTUS, TIPOS_AR, hojeTeresina } from "@/lib/pedidos";

export type DadosPedido = {
  id: string;
  categoria: string;
  acTipo?: string | null;
  acBtus?: number | null;
  acQuantidade?: number | null;
  descricao: string;
  bairro: string;
  endereco: string;
  referencia?: string;
  dataDesejada: string;
  lanceInicial?: number | null;
  gps?: { lat: number; lng: number } | null;
  fotos: string[];
};

export async function criarPedido(d: DadosPedido): Promise<{ ok: true; id: string } | { ok: false; erro: string }> {
  const cat = buscarCategoria(d.categoria);
  if (!cat?.ativa) return { ok: false, erro: "Escolha uma categoria disponível." };
  if (!/^[0-9a-f-]{36}$/i.test(d.id)) return { ok: false, erro: "Pedido inválido. Recarregue a página." };
  const descricao = d.descricao.trim();
  if (descricao.length < 10) return { ok: false, erro: "Descreva o serviço com pelo menos 10 caracteres." };
  if (!d.bairro.trim()) return { ok: false, erro: "Informe o bairro." };
  if (d.endereco.trim().length < 5) return { ok: false, erro: "Informe o endereço (fica protegido até o pagamento)." };
  if (!d.dataDesejada || d.dataDesejada < hojeTeresina() || d.dataDesejada > hojeTeresina(90)) {
    return { ok: false, erro: "Escolha uma data entre hoje e os próximos 90 dias." };
  }
  if (d.lanceInicial != null && (d.lanceInicial < 10 || d.lanceInicial > 100000)) {
    return { ok: false, erro: "O lance inicial deve ficar entre R$ 10 e R$ 100.000." };
  }
  if (motivoContato(descricao) || motivoContato(d.bairro)) return { ok: false, erro: traduzirErro("CONTATO_BLOQUEADO") };
  const ehAr = d.categoria === "ar-condicionado";
  if (ehAr) {
    if (!TIPOS_AR.some((t) => t.valor === d.acTipo)) return { ok: false, erro: "Escolha o tipo de serviço do ar-condicionado." };
    if (d.acBtus != null && !BTUS.includes(d.acBtus)) return { ok: false, erro: "Potência inválida." };
    if (!d.acQuantidade || d.acQuantidade < 1 || d.acQuantidade > 20) return { ok: false, erro: "Informe a quantidade de aparelhos (1 a 20)." };
  }
  if (d.fotos.length > 6) return { ok: false, erro: "Envie no máximo 6 fotos." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Faça login novamente." };
  const prefixo = `${user.id}/${d.id}/`;
  if (d.fotos.some((f) => !f.startsWith(prefixo))) return { ok: false, erro: "Foto inválida. Envie de novo." };

  const { error } = await supabase.from("pedidos").insert({
    id: d.id,
    cliente_id: user.id,
    categoria_slug: d.categoria,
    ac_tipo_servico: ehAr ? d.acTipo : null,
    ac_btus: ehAr ? d.acBtus ?? null : null,
    ac_quantidade: ehAr ? d.acQuantidade : null,
    descricao,
    bairro: d.bairro.trim(),
    data_desejada: d.dataDesejada,
    lance_inicial: d.lanceInicial ?? null,
    loc_lat: d.gps?.lat ?? null,
    loc_lng: d.gps?.lng ?? null,
    loc_fonte: d.gps ? "gps" : null,
  });
  if (error) return { ok: false, erro: traduzirErro(error.message) };

  const { error: eEnd } = await supabase
    .from("pedido_endereco")
    .insert({ pedido_id: d.id, endereco: d.endereco.trim().slice(0, 200), referencia: d.referencia?.trim().slice(0, 200) || null });
  const { error: eFotos } = d.fotos.length
    ? await supabase.from("pedido_fotos").insert(d.fotos.map((caminho, ordem) => ({ pedido_id: d.id, caminho, ordem })))
    : { error: null };
  if (eEnd || eFotos) {
    // Não deixa um pedido pela metade: cancela e avisa
    await supabase.from("pedidos").update({ status: "cancelado" }).eq("id", d.id);
    return { ok: false, erro: traduzirErro((eEnd ?? eFotos)!.message) };
  }
  return { ok: true, id: d.id };
}
