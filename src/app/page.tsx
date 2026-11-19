import Link from "next/link";
import { Camera, ShieldCheck } from "lucide-react";
import { BuscaCategorias } from "@/components/BuscaCategorias";

export default function Inicio() {
  return (
    <div className="space-y-6">
      <section className="space-y-2 pt-2">
        <h1 className="text-2xl font-bold leading-tight text-marca">
          Profissional de confiança em Teresina, sem dor de cabeça.
        </h1>
        <p className="text-suave">Descreva o serviço, receba propostas e negocie o preço.</p>
      </section>

      <Link href="/pedido/novo" className="btn-acao w-full text-lg">
        <Camera className="h-5 w-5" aria-hidden />
        Pedir orçamento com fotos
      </Link>

      <p className="flex items-center gap-2 rounded-xl bg-protegido-claro px-4 py-3 text-sm font-medium text-protegido">
        <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden />
        Pagamento protegido: o profissional só recebe depois do serviço feito.
      </p>

      <BuscaCategorias />
    </div>
  );
}
