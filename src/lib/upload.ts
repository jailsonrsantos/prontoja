"use client";

import { createClient } from "./supabase/client";
import { comprimirImagem } from "./imagem";
import { BUCKET_PUBLICO } from "./storage";

/** Comprime e envia uma foto para a pasta do usuário. Retorna o caminho salvo. */
export async function enviarFotoPublica(arquivo: File, pasta: "avatar" | "portfolio"): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Faça login novamente.");
  const blob = await comprimirImagem(arquivo, pasta === "avatar" ? 512 : 1600);
  const caminho = `${user.id}/${pasta}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET_PUBLICO).upload(caminho, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
  });
  if (error) throw error;
  return caminho;
}
