"use client";

import dynamic from "next/dynamic";

/** O mapa só é baixado quando a tela realmente mostra um mapa */
export const Mapa = dynamic(() => import("./MapaBase"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[360px] w-full place-items-center rounded-2xl border border-slate-200 bg-slate-100 text-sm text-suave">
      Carregando mapa…
    </div>
  ),
});
export type { MarcadorMapa } from "./MapaBase";
