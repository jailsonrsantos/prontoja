"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Lock, MapPin, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagem } from "@/lib/imagem";
import { CATEGORIAS } from "@/lib/categorias";
import { AVISO_CONTATO, motivoContato } from "@/lib/contato";
import { BTUS, TIPOS_AR, hojeTeresina } from "@/lib/pedidos";
import type { Ponto } from "@/lib/geo";
import { IconeCategoria } from "@/components/IconeCategoria";
import { CampoBairro } from "@/components/CampoBairro";
import { BotaoLocalizacao } from "@/components/BotaoLocalizacao";
import { criarPedido } from "./actions";

type Foto = { chave: string; preview: string; caminho?: string; estado: "enviando" | "ok" | "erro" };
const MAX_FOTOS = 6;

export function FormNovoPedido({ categoriaInicial, bairroInicial }: { categoriaInicial: string; bairroInicial: string }) {
  const router = useRouter();
  const pedidoId = useMemo(() => crypto.randomUUID(), []);
  const camera = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);

  const [categoria, setCategoria] = useState(categoriaInicial);
  const [acTipo, setAcTipo] = useState("");
  const [acBtus, setAcBtus] = useState("");
  const [acQtd, setAcQtd] = useState(1);
  const [descricao, setDescricao] = useState("");
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [gps, setGps] = useState<Ponto | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const ehAr = categoria === "ar-condicionado";
  const alerta = motivoContato(descricao);
  const fotosEnviando = fotos.some((f) => f.estado === "enviando");

  async function adicionarFotos(lista: FileList | null) {
    const arquivos = Array.from(lista ?? []).slice(0, MAX_FOTOS - fotos.length);
    if (!arquivos.length) return;
    setErro(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setErro("Faça login novamente.");

    for (const arquivo of arquivos) {
      const chave = crypto.randomUUID();
      let blob: Blob;
      try {
        blob = await comprimirImagem(arquivo);
      } catch {
        setErro("Não conseguimos ler uma das imagens. Tente outra foto.");
        continue;
      }
      const preview = URL.createObjectURL(blob);
      setFotos((f) => [...f, { chave, preview, estado: "enviando" }]);
      const caminho = `${user.id}/${pedidoId}/${chave}.jpg`;
      const { error } = await supabase.storage.from("pedidos").upload(caminho, blob, { contentType: "image/jpeg" });
      setFotos((f) => f.map((x) => (x.chave === chave ? { ...x, caminho, estado: error ? "erro" : "ok" } : x)));
      if (error) setErro("Uma foto não foi enviada. Remova e tente de novo.");
    }
  }

  async function removerFoto(foto: Foto) {
    setFotos((f) => f.filter((x) => x.chave !== foto.chave));
    URL.revokeObjectURL(foto.preview);
    if (foto.caminho) await createClient().storage.from("pedidos").remove([foto.caminho]);
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const form = new FormData(e.currentTarget);
    const lance = String(form.get("lance") ?? "").replace(/\./g, "").replace(",", ".").trim();
    setEnviando(true);
    const r = await criarPedido({
      id: pedidoId,
      categoria,
      acTipo: ehAr ? acTipo : null,
      acBtus: ehAr && acBtus ? Number(acBtus) : null,
      acQuantidade: ehAr ? acQtd : null,
      descricao,
      bairro: String(form.get("bairro") ?? ""),
      endereco: String(form.get("endereco") ?? ""),
      referencia: String(form.get("referencia") ?? ""),
      dataDesejada: String(form.get("data") ?? ""),
      lanceInicial: lance ? Number(lance) : null,
      gps,
      fotos: fotos.filter((f) => f.estado === "ok" && f.caminho).map((f) => f.caminho!),
    });
    if (r.ok) {
      router.replace(`/meus-pedidos/${r.id}?novo=1`);
    } else {
      setErro(r.erro);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <h1 className="text-2xl font-bold text-marca">Pedir orçamento</h1>

      {/* 1. Categoria */}
      <fieldset className="cartao space-y-3">
        <legend className="sr-only">Categoria</legend>
        <p className="font-bold">1. Qual serviço?</p>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIAS.map((c) => (
            <button
              key={c.slug}
              type="button"
              disabled={!c.ativa}
              onClick={() => setCategoria(c.slug)}
              aria-pressed={categoria === c.slug}
              className={`relative flex min-h-14 items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold transition ${
                categoria === c.slug ? "border-2 border-marca bg-marca-clara/50" : "border-slate-300"
              } disabled:opacity-50`}
            >
              <IconeCategoria slug={c.slug} className="h-5 w-5 shrink-0 text-marca" />
              <span>
                {c.nome}
                {!c.ativa && <span className="block text-[11px] font-medium text-suave">Em breve</span>}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* 2. Detalhes do ar-condicionado */}
      {ehAr && (
        <fieldset className="cartao space-y-4">
          <legend className="sr-only">Detalhes do ar-condicionado</legend>
          <p className="font-bold">2. Sobre o ar-condicionado</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TIPOS_AR.map((t) => (
              <label key={t.valor} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 has-[:checked]:border-marca has-[:checked]:bg-marca-clara/50">
                <input type="radio" name="acTipo" value={t.valor} checked={acTipo === t.valor} onChange={() => setAcTipo(t.valor)} className="h-5 w-5 accent-marca" />
                <span className="text-sm font-medium">{t.rotulo}</span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="btus" className="rotulo">Potência</label>
              <select id="btus" value={acBtus} onChange={(e) => setAcBtus(e.target.value)} className="campo">
                <option value="">Não sei</option>
                {BTUS.map((b) => (
                  <option key={b} value={b}>{b.toLocaleString("pt-BR")} BTUs</option>
                ))}
              </select>
            </div>
            <div>
              <span className="rotulo" id="rotulo-qtd">Quantidade</span>
              <div className="flex items-center gap-2" role="group" aria-labelledby="rotulo-qtd">
                <button type="button" onClick={() => setAcQtd((q) => Math.max(1, q - 1))} className="btn-contorno w-11 px-0" aria-label="Diminuir">−</button>
                <span className="w-8 text-center text-lg font-bold" aria-live="polite">{acQtd}</span>
                <button type="button" onClick={() => setAcQtd((q) => Math.min(20, q + 1))} className="btn-contorno w-11 px-0" aria-label="Aumentar">+</button>
              </div>
            </div>
          </div>
        </fieldset>
      )}

      {/* 3. Fotos */}
      <section className="cartao space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="font-bold">{ehAr ? "3" : "2"}. Fotos do problema</p>
          <span className="text-xs text-suave">{fotos.length}/{MAX_FOTOS}</span>
        </div>
        {fotos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2">
            {fotos.map((f) => (
              <li key={f.chave} className="relative">
                <img src={f.preview} alt="Foto do pedido" className={`aspect-square w-full rounded-xl object-cover ${f.estado === "enviando" ? "opacity-50" : ""}`} />
                {f.estado === "enviando" && <span className="absolute inset-0 grid place-items-center text-xs font-semibold">Enviando…</span>}
                {f.estado === "erro" && <span className="absolute inset-x-0 bottom-0 rounded-b-xl bg-red-600 py-0.5 text-center text-xs text-white">Falhou</span>}
                <button type="button" onClick={() => removerFoto(f)} className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white" aria-label="Remover foto">
                  <Trash2 className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {fotos.length < MAX_FOTOS && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => camera.current?.click()} className="btn-contorno">
              <Camera className="h-5 w-5" aria-hidden /> Câmera
            </button>
            <button type="button" onClick={() => galeria.current?.click()} className="btn-contorno">
              <ImagePlus className="h-5 w-5" aria-hidden /> Galeria
            </button>
          </div>
        )}
        <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { adicionarFotos(e.target.files); e.target.value = ""; }} />
        <input ref={galeria} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { adicionarFotos(e.target.files); e.target.value = ""; }} />
        <p className="flex items-center gap-1 text-xs text-suave">
          <Lock className="h-3.5 w-3.5" aria-hidden /> Só você e os profissionais da categoria veem as fotos.
        </p>
      </section>

      {/* 4. Descrição, local e data */}
      <section className="cartao space-y-4">
        <p className="font-bold">{ehAr ? "4" : "3"}. Detalhes</p>
        <div>
          <label htmlFor="descricao" className="rotulo">Descreva o serviço</label>
          <textarea
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            maxLength={1500}
            placeholder="Ex.: O ar do quarto está pingando e fazendo barulho…"
            className="campo min-h-28 py-3"
          />
          {alerta && (
            <p role="alert" className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Parece que há <strong>{alerta}</strong> no texto. {AVISO_CONTATO}
            </p>
          )}
        </div>

        <CampoBairro valorInicial={bairroInicial} />

        <div className="space-y-2">
          <p className="flex items-center gap-1 text-sm font-medium">
            <MapPin className="h-4 w-4 text-marca" aria-hidden /> Posição no mapa dos profissionais
          </p>
          {gps ? (
            <p className="rounded-xl bg-protegido-claro px-3 py-2 text-sm text-protegido">
              Usando sua localização aproximada (~1 km).{" "}
              <button type="button" onClick={() => setGps(null)} className="font-semibold underline">Usar só o bairro</button>
            </p>
          ) : (
            <BotaoLocalizacao aoObter={setGps} salvar={false} texto="Usar localização aproximada" />
          )}
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-suave">
            <Lock className="h-4 w-4" aria-hidden /> Endereço completo: só aparece para o profissional depois do pagamento.
          </p>
          <div className="space-y-3">
            <div>
              <label htmlFor="endereco" className="rotulo">Rua, número e complemento</label>
              <input id="endereco" name="endereco" className="campo" maxLength={200} autoComplete="street-address" required />
            </div>
            <div>
              <label htmlFor="referencia" className="rotulo">Ponto de referência (opcional)</label>
              <input id="referencia" name="referencia" className="campo" maxLength={200} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="data" className="rotulo">Data desejada</label>
            <input id="data" name="data" type="date" min={hojeTeresina()} max={hojeTeresina(90)} defaultValue={hojeTeresina(1)} className="campo" required />
          </div>
          <div>
            <label htmlFor="lance" className="rotulo">Seu lance (opcional)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-suave">R$</span>
              <input id="lance" name="lance" inputMode="decimal" placeholder="0,00" className="campo pl-11" />
            </div>
          </div>
        </div>
        <p className="text-xs text-suave">O lance é quanto você gostaria de pagar. Os profissionais podem aceitar ou fazer contraproposta.</p>
      </section>

      {erro && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{erro}</p>}

      <button type="submit" disabled={enviando || fotosEnviando || !categoria || Boolean(alerta)} className="btn-acao w-full text-lg">
        {enviando ? "Publicando…" : fotosEnviando ? "Aguarde as fotos…" : "Publicar pedido"}
      </button>
    </form>
  );
}
