"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { salvarConta } from "./actions";
import { CampoBairro } from "@/components/CampoBairro";

function formatarTelefone(d: string | null) {
  if (!d) return "";
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

export function FormConta({
  nome,
  bairro,
  telefone,
  whatsapp,
}: {
  nome: string;
  bairro: string;
  telefone: string | null;
  whatsapp: string | null;
}) {
  const [estado, enviar, enviando] = useActionState(salvarConta, undefined);
  return (
    <form action={enviar} className="cartao space-y-4">
      <div>
        <label htmlFor="nome" className="rotulo">Nome completo</label>
        <input id="nome" name="nome" defaultValue={nome} className="campo" maxLength={80} required />
      </div>
      <CampoBairro valorInicial={bairro} />

      <div className="rounded-xl bg-slate-50 p-3">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-suave">
          <Lock className="h-4 w-4" aria-hidden /> Só aparece para a outra pessoa depois do acordo pago.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="whatsapp" className="rotulo">WhatsApp</label>
            <input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" defaultValue={formatarTelefone(whatsapp)} placeholder="(86) 99999-1234" className="campo" autoComplete="tel" />
          </div>
          <div>
            <label htmlFor="telefone" className="rotulo">Outro telefone (opcional)</label>
            <input id="telefone" name="telefone" type="tel" inputMode="tel" defaultValue={formatarTelefone(telefone)} className="campo" />
          </div>
        </div>
      </div>

      {estado && !estado.ok && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{estado.erro}</p>}
      {estado?.ok && <p role="status" className="rounded-xl bg-protegido-claro px-4 py-3 text-sm text-protegido">Dados salvos!</p>}

      <button type="submit" disabled={enviando} className="btn-marca w-full">{enviando ? "Salvando…" : "Salvar"}</button>
    </form>
  );
}
