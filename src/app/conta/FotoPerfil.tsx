"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { enviarFotoPublica } from "@/lib/upload";
import { traduzirErro } from "@/lib/erros";
import { salvarFotoPerfil } from "./actions";

export function FotoPerfil({ nome, foto }: { nome: string; foto: string | null }) {
  const entrada = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    try {
      const caminho = await enviarFotoPublica(arquivo, "avatar");
      const r = await salvarFotoPerfil(caminho);
      if (!r.ok) throw new Error(r.erro);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error && !err.message.match(/^[A-Z_]+$/) ? err.message : traduzirErro(String(err)));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar nome={nome} foto={foto} tamanho={72} />
      <div>
        <button type="button" onClick={() => entrada.current?.click()} disabled={enviando} className="btn-contorno">
          <Camera className="h-5 w-5" aria-hidden /> {enviando ? "Enviando…" : foto ? "Trocar foto" : "Adicionar foto"}
        </button>
        {erro && <p className="mt-1 text-sm text-red-700">{erro}</p>}
      </div>
      <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={aoEscolher} />
    </div>
  );
}
