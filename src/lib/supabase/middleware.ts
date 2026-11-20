import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado } from "./config";

/** Páginas que exigem login */
const ROTAS_PROTEGIDAS = ["/conta", "/pedido", "/meus-pedidos", "/painel", "/negociacao", "/acordo", "/avaliar", "/cadastro"];

/** Páginas que funcionam mesmo antes de completar o cadastro */
const ROTAS_LIVRES_CADASTRO = ["/cadastro", "/auth", "/entrar", "/termos", "/privacidade", "/api", "/diagnostico"];

export async function atualizarSessao(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!supabaseConfigurado) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const protegida = ROTAS_PROTEGIDAS.some((r) => caminho === r || caminho.startsWith(r + "/"));
  if (!user && protegida) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?voltar=${encodeURIComponent(caminho + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  // Logado mas ainda não escolheu "cliente ou profissional" (ou não aceitou os termos)?
  // Leva para a tela de completar o cadastro.
  const livre = ROTAS_LIVRES_CADASTRO.some((r) => caminho === r || caminho.startsWith(r + "/"));
  if (user && !livre && request.method === "GET") {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("tipo, aceitou_termos_em")
      .eq("id", user.id)
      .maybeSingle();
    if (!perfil?.tipo || !perfil?.aceitou_termos_em) {
      const url = request.nextUrl.clone();
      url.pathname = "/cadastro/perfil";
      url.search = caminho === "/" ? "" : `?voltar=${encodeURIComponent(caminho + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}
