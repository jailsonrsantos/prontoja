"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { traduzirErro } from "@/lib/erros";

type Modo = "entrar" | "cadastro";

export function FormularioEntrar({
  voltar,
  modoInicial,
  erroInicial,
}: {
  voltar: string;
  modoInicial: Modo;
  erroInicial?: string;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [aceitou, setAceitou] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(erroInicial ? "Não foi possível concluir o login. Tente de novo." : null);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const urlRetorno = () => `${window.location.origin}/auth/callback?voltar=${encodeURIComponent(voltar)}`;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (modo === "cadastro" && !aceitou) {
      setErro("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.");
      return;
    }
    setCarregando(true);
    const supabase = createClient();
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        router.replace(voltar);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: urlRetorno(),
            data: { nome: nome.trim(), aceitou_termos_em: new Date().toISOString() },
          },
        });
        if (error) throw error;
        if (data.session) {
          router.replace(voltar);
          router.refresh();
        } else {
          setEmailEnviado(true);
        }
      }
    } catch (err) {
      setErro(traduzirErro(err instanceof Error ? err.message : String(err)));
    } finally {
      setCarregando(false);
    }
  }

  async function entrarComGoogle() {
    setErro(null);
    setCarregando(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: urlRetorno() },
    });
    if (error) {
      setErro(traduzirErro(error.message));
      setCarregando(false);
    }
  }

  if (emailEnviado) {
    return (
      <div className="cartao space-y-3 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-protegido" aria-hidden />
        <h1 className="text-xl font-bold">Confirme seu e-mail</h1>
        <p className="text-suave">
          Enviamos um link para <strong>{email}</strong>. Abra o e-mail e toque no link para ativar sua conta.
        </p>
        <p className="text-sm text-suave">Não chegou? Olhe a caixa de spam.</p>
      </div>
    );
  }

  return (
    <div className="cartao space-y-5">
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist">
        {(["entrar", "cadastro"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            onClick={() => {
              setModo(m);
              setErro(null);
            }}
            className={`min-h-11 rounded-lg text-sm font-semibold ${modo === m ? "bg-white text-marca shadow" : "text-suave"}`}
          >
            {m === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <h1 className="text-xl font-bold">{modo === "entrar" ? "Bem-vindo de volta" : "Crie sua conta grátis"}</h1>

      <button type="button" onClick={entrarComGoogle} disabled={carregando} className="btn-contorno w-full">
        <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {modo === "entrar" ? "Entrar com Google" : "Cadastrar com Google"}
      </button>

      <div className="flex items-center gap-3 text-sm text-suave">
        <span className="h-px flex-1 bg-slate-200" /> ou com e-mail <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={enviar} className="space-y-4" noValidate>
        {modo === "cadastro" && (
          <div>
            <label htmlFor="nome" className="rotulo">Seu nome</label>
            <input id="nome" className="campo" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" required />
          </div>
        )}
        <div>
          <label htmlFor="email" className="rotulo">E-mail</label>
          <input
            id="email"
            type="email"
            inputMode="email"
            className="campo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="senha" className="rotulo">Senha</label>
          <div className="relative">
            <input
              id="senha"
              type={verSenha ? "text" : "password"}
              className="campo pr-12"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              className="absolute right-0 top-0 grid h-11 w-12 place-items-center text-suave"
              aria-label={verSenha ? "Esconder senha" : "Mostrar senha"}
            >
              {verSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {modo === "cadastro" && <p className="mt-1 text-xs text-suave">Mínimo de 6 caracteres.</p>}
        </div>

        {modo === "cadastro" && (
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={aceitou}
              onChange={(e) => setAceitou(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-marca"
            />
            <span>
              Li e aceito os{" "}
              <Link href="/termos" target="_blank" className="font-semibold text-marca underline">Termos de Uso</Link> e a{" "}
              <Link href="/privacidade" target="_blank" className="font-semibold text-marca underline">Política de Privacidade</Link>{" "}
              (LGPD).
            </span>
          </label>
        )}

        {erro && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {erro}
          </p>
        )}

        <button type="submit" disabled={carregando} className="btn-acao w-full">
          {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
        </button>
      </form>
    </div>
  );
}
