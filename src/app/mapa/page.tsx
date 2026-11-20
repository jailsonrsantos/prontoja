import type { Metadata } from "next";
import { meuLocal } from "@/lib/meuLocal";
import { buscarCategoria } from "@/lib/categorias";
import { BuscaMapa } from "./BuscaMapa";

export const metadata: Metadata = { title: "Profissionais perto de você" };

export default async function PaginaMapa({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const cat = categoria && buscarCategoria(categoria)?.ativa ? categoria : null;
  const local = await meuLocal();
  return <BuscaMapa categoriaInicial={cat} localInicial={local} />;
}
