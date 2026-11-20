import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { caminhoSeguro } from "@/lib/erros";

/** O Supabase manda o usuário para cá depois do login com Google ou da confirmação de e-mail */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const voltar = caminhoSeguro(searchParams.get("voltar"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${voltar}`);
  }
  // Quando o link de confirmação é aberto em outro navegador, o e-mail JÁ foi
  // confirmado pelo Supabase, mas a sessão não pode ser criada aqui.
  const tipoErro = searchParams.get("error_description") ? "link" : code ? "outro-navegador" : "login";
  return NextResponse.redirect(`${origin}/entrar?erro=${tipoErro}`);
}
