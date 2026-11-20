"use client";

import Link from "next/link";
import { useState } from "react";
import { Map as IconeMapa, Search } from "lucide-react";
import { filtrarCategorias } from "@/lib/categorias";
import { IconeCategoria } from "./IconeCategoria";

export function BuscaCategorias() {
  const [termo, setTermo] = useState("");
  const lista = filtrarCategorias(termo);

  return (
    <section aria-labelledby="titulo-categorias" className="space-y-4">
      <label className="relative block">
        <span className="sr-only">Buscar serviço</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-suave" aria-hidden />
        <input
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Ex.: vazamento, tomada, split…"
          className="campo pl-12"
          enterKeyHint="search"
        />
      </label>

      <Link
        href={`/mapa${lista.length === 1 && lista[0].ativa ? `?categoria=${lista[0].slug}` : ""}`}
        className="btn-contorno w-full"
      >
        <IconeMapa className="h-5 w-5 text-marca" aria-hidden />
        {lista.length === 1 && lista[0].ativa ? `Ver no mapa: ${lista[0].nome}` : "Ver profissionais no mapa"}
      </Link>

      <h2 id="titulo-categorias" className="text-lg font-bold">
        Categorias
      </h2>

      {lista.length === 0 ? (
        <p className="cartao text-suave">
          Não encontramos “{termo}”. Por enquanto atendemos pintura, elétrica, encanamento e ar-condicionado.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {lista.map((c) => (
            <li key={c.slug}>
              {c.ativa ? (
                <Link
                  href={`/pedido/novo?categoria=${c.slug}`}
                  className="cartao flex min-h-28 flex-col items-center justify-center gap-2 text-center transition hover:border-marca active:scale-[0.98]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-marca-clara text-marca">
                    <IconeCategoria slug={c.slug} className="h-6 w-6" />
                  </span>
                  <span className="font-semibold">{c.nome}</span>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="cartao relative flex min-h-28 flex-col items-center justify-center gap-2 text-center opacity-60"
                >
                  <span className="absolute right-2 top-2 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-suave">
                    Em breve
                  </span>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-suave">
                    <IconeCategoria slug={c.slug} className="h-6 w-6" />
                  </span>
                  <span className="font-semibold">{c.nome}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
