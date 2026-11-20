"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/erros";
import type { Resultado } from "@/lib/tipos";

export async function cancelarPedido(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pedidos").update({ status: "cancelado" }).eq("id", id).eq("status", "aberto").select("id");
  if (error) return { ok: false, erro: traduzirErro(error.message) };
  if (!data?.length) return { ok: false, erro: "Este pedido não pode mais ser cancelado." };
  revalidatePath("/meus-pedidos");
  revalidatePath(`/meus-pedidos/${id}`);
  return { ok: true };
}
