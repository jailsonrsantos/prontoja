export const TIPOS_AR = [
  { valor: "instalacao", rotulo: "Instalação" },
  { valor: "limpeza", rotulo: "Limpeza/higienização" },
  { valor: "conserto", rotulo: "Conserto/manutenção" },
  { valor: "recarga", rotulo: "Recarga de gás" },
] as const;

export const BTUS = [7000, 9000, 12000, 18000, 22000, 24000, 30000, 36000, 48000, 60000];

export const STATUS_PEDIDO: Record<string, { rotulo: string; cor: string }> = {
  aberto: { rotulo: "Recebendo propostas", cor: "bg-marca-clara text-marca" },
  aguardando_pagamento: { rotulo: "Aguardando pagamento", cor: "bg-amber-100 text-amber-900" },
  pago_retido: { rotulo: "Pago (valor protegido)", cor: "bg-protegido-claro text-protegido" },
  concluido: { rotulo: "Serviço concluído", cor: "bg-protegido-claro text-protegido" },
  avaliado: { rotulo: "Avaliado", cor: "bg-slate-100 text-suave" },
  cancelado: { rotulo: "Cancelado", cor: "bg-slate-100 text-suave" },
  em_disputa: { rotulo: "Em análise", cor: "bg-red-100 text-red-800" },
};

export function rotuloTipoAr(v: string | null | undefined) {
  return TIPOS_AR.find((t) => t.valor === v)?.rotulo ?? "";
}

export function formatarBtus(b: number | null | undefined) {
  return b ? `${b.toLocaleString("pt-BR")} BTUs` : "BTUs não informados";
}

export function formatarReais(v: number | string | null | undefined) {
  if (v == null || v === "") return "";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

/** Data de hoje em Teresina, no formato AAAA-MM-DD */
export function hojeTeresina(somarDias = 0) {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000 + somarDias * 86400000);
  return d.toISOString().slice(0, 10);
}

/** Resumo curto do serviço (ex.: "Limpeza/higienização · 2× 12.000 BTUs") */
export function resumoServico(p: { ac_tipo_servico?: string | null; ac_btus?: number | null; ac_quantidade?: number | null }) {
  if (!p.ac_tipo_servico) return "";
  const qtd = p.ac_quantidade && p.ac_quantidade > 1 ? `${p.ac_quantidade}× ` : "";
  return `${rotuloTipoAr(p.ac_tipo_servico)} · ${qtd}${formatarBtus(p.ac_btus)}`;
}
