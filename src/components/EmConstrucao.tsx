import Link from "next/link";
import { Hammer } from "lucide-react";

export function EmConstrucao({ titulo, etapa }: { titulo: string; etapa: string }) {
  return (
    <div className="cartao space-y-3 text-center">
      <Hammer className="mx-auto h-10 w-10 text-acao" aria-hidden />
      <h1 className="text-xl font-bold">{titulo}</h1>
      <p className="text-suave">Esta tela será construída na {etapa}.</p>
      <Link href="/" className="btn-marca w-full">Voltar ao início</Link>
    </div>
  );
}
