"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, UserRound } from "lucide-react";

const ITENS = [
  { href: "/", rotulo: "Início", Icone: Home },
  { href: "/meus-pedidos", rotulo: "Meus pedidos", Icone: ClipboardList },
  { href: "/conta", rotulo: "Conta", Icone: UserRound },
];

export function MenuInferior() {
  const caminho = usePathname();
  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-3">
        {ITENS.map(({ href, rotulo, Icone }) => {
          const ativo = href === "/" ? caminho === "/" : caminho.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  ativo ? "text-marca" : "text-suave"
                }`}
              >
                <Icone className="h-6 w-6" aria-hidden />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
