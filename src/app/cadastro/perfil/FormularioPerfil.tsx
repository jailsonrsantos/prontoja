"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Briefcase, Home } from "lucide-react";
import { concluirCadastro } from "./actions";
import { CampoBairro } from "@/components/CampoBairro";
import type { TipoUsuario } from "@/lib/tipos";

export function FormularioPerfil({
  voltar,
  nomeInicial,
  bairroInicial,
  tipoDefinido,
  precisaAceitar,
}: {
  voltar: string;
  nomeInicial: string;
  bairroInicial: string;
  tipoDefinido: TipoUsuario | null;
  precisaAceitar: boolean;
}) {
  const [tipo, setTipo] = useState<TipoUsuario | null>(tipoDefinido);
  const [estado, enviar, enviando] = useActionState(concluirCadastro, undefined);

  const opcoes = [
    { valor: "cliente" as const, titulo: "Quero contratar", texto: "Peço orçamentos e escolho o profissional.", Icone: Home },
    { valor: "profissional" as const, titulo: "Quero trabalhar", texto: "Recebo pedidos da minha área e dou lances.", Icone: Briefcase },
  ];

  return (
    <form action={enviar} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-marca">Falta pouco!</h1>
        <p className="text-suave">Conte um pouco sobre você para começar.</p>
      </div>

      <input type="hidden" name="voltar" value={voltar} />
      <input type="hidden" name="tipo" value={tipo ?? ""} />

      {!tipoDefinido && (
        <fieldset className="space-y-3">
          <legend className="rotulo">Como você vai usar o ProntoJá?</legend>
          {opcoes.map(({ valor, titulo, texto, Icone }) => (
            <button
              key={valor}
              type="button"
              onClick={() => setTipo(valor)}
              aria-pressed={tipo === valor}
              className={`cartao flex w-full items-center gap-4 text-left transition ${
                tipo === valor ? "border-2 border-marca bg-marca-clara/40" : ""
              }`}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-marca-clara text-marca">
                <Icone className="h-6 w-6" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">{titulo}</span>
                <span className="block text-sm text-suave">{texto}</span>
              </span>
            </button>
          ))}
          <p className="text-xs text-suave">Atenção: essa escolha não pode ser trocada depois.</p>
        </fieldset>
      )}

      <div className="cartao space-y-4">
        <div>
          <label htmlFor="nome" className="rotulo">Nome completo</label>
          <input id="nome" name="nome" defaultValue={nomeInicial} className="campo" autoComplete="name" maxLength={80} required />
        </div>
        <CampoBairro valorInicial={bairroInicial} />
      </div>

      {precisaAceitar && (
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input type="checkbox" name="aceitou" className="mt-0.5 h-5 w-5 shrink-0 accent-marca" />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" target="_blank" className="font-semibold text-marca underline">Termos de Uso</Link> e a{" "}
            <Link href="/privacidade" target="_blank" className="font-semibold text-marca underline">Política de Privacidade</Link> (LGPD).
          </span>
        </label>
      )}

      {estado?.erro && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{estado.erro}</p>
      )}

      <button type="submit" disabled={enviando || !tipo} className="btn-acao w-full">
        {enviando ? "Salvando…" : "Continuar"}
      </button>
    </form>
  );
}
