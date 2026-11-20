/**
 * Detecta telefone, e-mail ou pedido de contato em textos digitados.
 * A MESMA regra existe no banco (função public.tem_contato), que bloqueia
 * mesmo que alguém tente burlar o app.
 */
const NUM = "(zero|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove)";
const REGRAS: { re: RegExp; motivo: string }[] = [
  { re: /(\d[\s.()-]*){8,}/, motivo: "número de telefone" },
  { re: /[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}/i, motivo: "e-mail" },
  {
    re: /(whats|wats|zap|wpp|telegram|instagram|\binsta\b|me liga|liga pra mim|liga para mim|meu n[uú]mero|meu contato)/i,
    motivo: "pedido de contato fora do app",
  },
  { re: new RegExp(`\\b${NUM}([\\s,.-]+${NUM}){5,}\\b`, "i"), motivo: "número escrito por extenso" },
];

/** Retorna o motivo do bloqueio, ou null se o texto estiver ok */
export function motivoContato(texto: string | null | undefined): string | null {
  if (!texto) return null;
  for (const { re, motivo } of REGRAS) if (re.test(texto)) return motivo;
  return null;
}

export const AVISO_CONTATO =
  "Por segurança, telefone, e-mail e redes sociais só são liberados depois do acordo fechado e pago.";
