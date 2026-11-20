"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { BotaoLocalizacao } from "@/components/BotaoLocalizacao";
import { apagarMinhaLocalizacao } from "@/app/localizacao/actions";

export function CartaoLocalizacao({ fonte }: { fonte: "gps" | "bairro" | "cidade" }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  return (
    <section className="cartao space-y-3">
      <h2 className="flex items-center gap-2 font-bold"><MapPin className="h-5 w-5 text-marca" aria-hidden /> Minha localização no mapa</h2>
      <p className="text-sm text-suave">
        {fonte === "gps"
          ? "Usando sua localização aproximada (área de ~1 km)."
          : fonte === "bairro"
            ? "Usando o centro do seu bairro."
            : "Seu bairro não foi reconhecido: usando o centro de Teresina."}
      </p>
      {fonte === "gps" ? (
        <button
          type="button"
          disabled={ocupado}
          onClick={async () => {
            setOcupado(true);
            await apagarMinhaLocalizacao();
            setOcupado(false);
            router.refresh();
          }}
          className="btn-contorno w-full"
        >
          {ocupado ? "Apagando…" : "Apagar e usar só o bairro"}
        </button>
      ) : (
        <BotaoLocalizacao aoObter={() => router.refresh()} />
      )}
    </section>
  );
}
