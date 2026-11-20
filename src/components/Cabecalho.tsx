import Link from "next/link";
import { Logo } from "./Logo";
import { perfilAtual } from "@/lib/perfil";
import { Avatar } from "./Avatar";

export async function Cabecalho() {
  const { usuario, perfil } = await perfilAtual();
  return (
    <header className="sticky top-0 z-20 bg-marca pt-[env(safe-area-inset-top)] shadow">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2">
        <Logo />
        {usuario ? (
          <Link href="/conta" className="flex min-h-11 items-center rounded-full p-1 hover:bg-white/10" aria-label="Minha conta">
            <Avatar nome={perfil?.nome || usuario.email || "?"} foto={perfil?.foto_url} tamanho={36} />
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
