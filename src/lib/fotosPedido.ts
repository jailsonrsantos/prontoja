import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Gera links temporários (1 hora) para as fotos privadas de pedidos.
 * O Supabase só gera o link se o usuário tiver permissão de ver o pedido.
 */
export async function linksFotosPedido(supabase: SupabaseClient, caminhos: string[]): Promise<Record<string, string>> {
  const resultado: Record<string, string> = {};
  const privados = caminhos.filter((c) => !c.startsWith("/"));
  caminhos.filter((c) => c.startsWith("/")).forEach((c) => (resultado[c] = c)); // imagens de exemplo
  if (privados.length) {
    const { data } = await supabase.storage.from("pedidos").createSignedUrls(privados, 3600);
    data?.forEach((d) => {
      if (d.signedUrl && d.path) resultado[d.path] = d.signedUrl;
    });
  }
  return resultado;
}
