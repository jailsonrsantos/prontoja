import { BadgeCheck, Star } from "lucide-react";

export function SeloVerificado() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-protegido-claro px-2 py-0.5 text-xs font-semibold text-protegido">
      <BadgeCheck className="h-4 w-4" aria-hidden /> Verificado
    </span>
  );
}

export function Nota({ nota, total }: { nota: number; total: number }) {
  if (!total) return <span className="text-sm text-suave">Novo no ProntoJá</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`Nota ${nota.toFixed(1)} de 5, ${total} avaliações`}>
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
      <strong>{Number(nota).toFixed(1).replace(".", ",")}</strong>
      <span className="text-suave">({total})</span>
    </span>
  );
}
