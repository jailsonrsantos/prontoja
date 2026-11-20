import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { caminhoSeguro } from "@/lib/erros";

/**
 * Link do e-mail de confirmação (funciona mesmo se o e-mail for aberto
 * em outro navegador, como o do aplicativo do Gmail).
 * Requer o modelo de e-mail do Supabase apontando para esta rota.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const voltar = caminhoSeguro(searchParams.get("voltar"));

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${voltar}`);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
