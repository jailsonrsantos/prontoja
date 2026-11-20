"use client";

import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { pedirLocalizacao, type Ponto } from "@/lib/geo";
import { salvarMinhaLocalizacao } from "@/app/localizacao/actions";

/** Botão "Usar minha localização": pede permissão, arredonda (~1 km) e salva */
export function BotaoLocalizacao({
  aoObter,
  salvar = true,
  texto = "Usar minha localização",
  className = "btn-contorno w-full",
}: {
  aoObter: (p: Ponto) => void;
  salvar?: boolean;
  texto?: string;
  className?: string;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function clicar() {
    setAviso(null);
    setOcupado(true);
    try {
      const p = await pedirLocalizacao();
      if (salvar) {
        const r = await salvarMinhaLocalizacao(p.lat, p.lng);
        if (!r.ok) throw new Error(r.erro);
      }
      aoObter(p);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não foi possível obter a localização.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-1">
      <button type="button" onClick={clicar} disabled={ocupado} className={className}>
        <LocateFixed className="h-5 w-5" aria-hidden /> {ocupado ? "Localizando…" : texto}
      </button>
      {aviso && <p className="text-sm text-amber-800">{aviso}</p>}
      <p className="text-xs text-suave">Usamos só a área aproximada (~1 km). Seu endereço nunca aparece no mapa.</p>
    </div>
  );
}
