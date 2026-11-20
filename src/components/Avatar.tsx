/* eslint-disable @next/next/no-img-element */
import { urlPublica } from "@/lib/storage";

export function Avatar({ nome, foto, tamanho = 56 }: { nome: string; foto?: string | null; tamanho?: number }) {
  const url = urlPublica(foto);
  const iniciais = nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
  return url ? (
    <img src={url} alt={`Foto de ${nome}`} width={tamanho} height={tamanho} className="shrink-0 rounded-full object-cover" style={{ width: tamanho, height: tamanho }} />
  ) : (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-full bg-marca text-white font-titulo font-bold" style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.38 }}>
      {iniciais}
    </span>
  );
}
