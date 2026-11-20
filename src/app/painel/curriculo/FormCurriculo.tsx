"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { salvarCurriculo } from "./actions";
import { CATEGORIAS } from "@/lib/categorias";
import { AVISO_CONTATO, motivoContato } from "@/lib/contato";
import { IconeCategoria } from "@/components/IconeCategoria";

export function FormCurriculo({
  descricao,
  cursos,
  especialidades,
  raioKm,
}: {
  descricao: string;
  cursos: string[];
  especialidades: string[];
  raioKm: number;
}) {
  const [estado, enviar, enviando] = useActionState(salvarCurriculo, undefined);
  const [texto, setTexto] = useState(descricao);
  const [listaCursos, setListaCursos] = useState<string[]>(cursos.length ? cursos : [""]);
  const alerta = motivoContato(texto) ?? listaCursos.map(motivoContato).find(Boolean);

  return (
    <form action={enviar} className="space-y-5">
      <section className="cartao space-y-3">
        <h2 className="font-bold">Especialidades</h2>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIAS.filter((c) => c.ativa).map((c) => (
            <label key={c.slug} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 has-[:checked]:border-marca has-[:checked]:bg-marca-clara/50">
              <input type="checkbox" name="especialidades" value={c.slug} defaultChecked={especialidades.includes(c.slug)} className="h-5 w-5 accent-marca" />
              <IconeCategoria slug={c.slug} className="h-5 w-5 text-marca" />
              <span className="text-sm font-medium">{c.nome}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-suave">Você receberá pedidos das categorias marcadas.</p>
      </section>

      <section className="cartao space-y-3">
        <h2 className="font-bold">Até onde você atende?</h2>
        <div className="grid grid-cols-3 gap-2">
          {[3, 5, 10, 20, 50].map((r) => (
            <label key={r} className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-300 px-2 text-center text-sm font-semibold has-[:checked]:border-marca has-[:checked]:bg-marca text-texto has-[:checked]:text-white">
              <input type="radio" name="raio_km" value={r} defaultChecked={raioKm === r} className="sr-only" />
              {r >= 50 ? "Toda Teresina" : `${r} km`}
            </label>
          ))}
        </div>
        <p className="text-xs text-suave">Você aparece no mapa só para clientes dentro desse raio. Defina sua localização em Conta.</p>
      </section>

      <section className="cartao space-y-2">
        <label htmlFor="descricao" className="font-bold">Sobre você e seu trabalho</label>
        <textarea
          id="descricao"
          name="descricao"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={5}
          maxLength={1000}
          placeholder="Ex.: Trabalho com instalação e limpeza de ar-condicionado há 8 anos, com garantia…"
          className="campo min-h-32 py-3"
        />
        <p className="text-right text-xs text-suave">{texto.length}/1000</p>
      </section>

      <section className="cartao space-y-3">
        <h2 className="font-bold">Cursos e certificados</h2>
        {listaCursos.map((curso, i) => (
          <div key={i} className="flex gap-2">
            <input
              name="cursos"
              value={curso}
              onChange={(e) => setListaCursos((l) => l.map((c, j) => (j === i ? e.target.value : c)))}
              placeholder="Ex.: Técnico em Refrigeração — SENAI (2020)"
              maxLength={120}
              className="campo"
              aria-label={`Curso ${i + 1}`}
            />
            <button type="button" onClick={() => setListaCursos((l) => (l.length > 1 ? l.filter((_, j) => j !== i) : [""]))} className="btn-contorno px-3" aria-label="Remover curso">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
        {listaCursos.length < 10 && (
          <button type="button" onClick={() => setListaCursos((l) => [...l, ""])} className="btn-contorno w-full">
            <Plus className="h-5 w-5" aria-hidden /> Adicionar curso
          </button>
        )}
      </section>

      {alerta && (
        <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Parece que há <strong>{alerta}</strong> no texto. {AVISO_CONTATO}
        </p>
      )}
      {estado && !estado.ok && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{estado.erro}</p>}
      {estado?.ok && <p role="status" className="rounded-xl bg-protegido-claro px-4 py-3 text-sm text-protegido">Currículo salvo!</p>}

      <button type="submit" disabled={enviando || Boolean(alerta)} className="btn-acao w-full">
        {enviando ? "Salvando…" : "Salvar currículo"}
      </button>
    </form>
  );
}
