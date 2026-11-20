/** Traduz as mensagens de erro mais comuns do Supabase para português */
export function traduzirErro(mensagem?: string | null): string {
  if (!mensagem) return "Algo deu errado. Tente de novo.";
  const m = mensagem.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (m.includes("user already registered")) return "Já existe uma conta com este e-mail. Tente entrar.";
  if (m.includes("password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("unable to validate email") || m.includes("invalid format")) return "Digite um e-mail válido.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos.";
  if (m.includes("provider is not enabled")) return "Login com Google ainda não foi ativado no Supabase.";
  if (m.includes("contato_bloqueado")) return "Por segurança, não é permitido colocar telefone, e-mail ou redes sociais. Eles são liberados depois do acordo pago.";
  if (m.includes("tipo_nao_pode_mudar")) return "O tipo de conta não pode ser alterado. Fale com o suporte.";
  if (m.includes("limite_fotos")) return "Você atingiu o limite de 12 fotos de trabalhos.";
  if (m.includes("row-level security")) return "Você não tem permissão para esta ação.";
  if (m.includes("payload too large") || m.includes("exceeded the maximum")) return "A foto é grande demais. Tente outra.";
  if (m.includes("failed to fetch")) return "Sem conexão com o servidor. Verifique sua internet.";
  return "Algo deu errado. Tente de novo.";
}

/** Só aceita endereços internos do app (evita redirecionar para sites externos) */
export function caminhoSeguro(voltar?: string | null): string {
  if (!voltar || !voltar.startsWith("/") || voltar.startsWith("//")) return "/";
  return voltar;
}
