import Link from "next/link";
import { UserRound } from "lucide-react";
import { Logo } from "./Logo";
import { usuarioAtual } from "@/lib/supabase/server";

export async function Cabecalho() {
  const usuario = await usuarioAtual();
  return (
    <header className="sticky top-0 z-20 bg-marca pt-[env(safe-area-inset-top)] shadow">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2">
        <Logo />
        {usuario ? (
          <Link href="/conta" className="btn min-h-11 px-3 text-white hover:bg-white/10" aria-label="Minha conta">
            <UserRound className="h-6 w-6" />
          </Link>
        ) : (
          <Link href="/entrar" className="btn min-h-11 bg-white px-4 text-marca hover:bg-marca-clara">
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
