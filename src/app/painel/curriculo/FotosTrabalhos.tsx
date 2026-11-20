"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2 } from "lucide-react";
import { enviarFotoPublica } from "@/lib/upload";
import { urlPublica } from "@/lib/storage";
import { traduzirErro } from "@/lib/erros";
import type { FotoPortfolio } from "@/lib/tipos";
import { adicionarFotoTrabalho, removerFotoTrabalho } from "./actions";

export function FotosTrabalhos({ fotos }: { fotos: FotoPortfolio[] }) {
  const entrada = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [legenda, setLegenda] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []).slice(0, 12 - fotos.length);
    e.target.value = "";
    if (!arquivos.length) return;
    setErro(null);
    setOcupado(true);
    try {
      for (const arquivo of arquivos) {
        const caminho = await enviarFotoPublica(arquivo, "portfolio");
        const r = await adicionarFotoTrabalho(caminho, legenda.trim());
        if (!r.ok) throw new Error(r.erro);
      }
      setLegenda("");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErro(/^[A-Z_]+$/.test(msg) || msg.length > 140 ? traduzirErro(msg) : msg);
    } finally {
      setOcupado(false);
    }
  }

  async function remover(id: string) {
    if (!confirm("Remover esta foto?")) return;
    setOcupado(true);
    const r = await removerFotoTrabalho(id);
    if (!r.ok) setErro(r.erro);
    setOcupado(false);
    router.refresh();
  }

  return (
    <section className="cartao space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold">Fotos de trabalhos</h2>
        <span className="text-xs text-suave">{fotos.length}/12</span>
      </div>

      {fotos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {fotos.map((f) => (
            <li key={f.id} className="relative">
              <img src={urlPublica(f.caminho) ?? ""} alt={f.legenda || "Foto de trabalho"} className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
              <button type="button" onClick={() => remover(f.id)} disabled={ocupado} className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white" aria-label="Remover foto">
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {fotos.length < 12 && (
        <>
          <input value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Legenda (opcional). Ex.: Instalação split 12.000 BTUs" maxLength={120} className="campo" aria-label="Legenda da foto" />
          <button type="button" onClick={() => entrada.current?.click()} disabled={ocupado} className="btn-contorno w-full">
            <ImagePlus className="h-5 w-5" aria-hidden /> {ocupado ? "Enviando…" : "Adicionar fotos"}
          </button>
          <input ref={entrada} type="file" accept="image/*" multiple className="hidden" onChange={aoEscolher} />
        </>
      )}
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <p className="text-xs text-suave">As fotos são comprimidas no celular antes do envio. Não mostre placas com telefone.</p>
    </section>
  );
}
