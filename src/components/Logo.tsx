import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2" aria-label="ProntoJá, ir para o início">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg font-bold text-marca font-titulo">
        P
      </span>
      <span className="font-titulo text-xl font-bold tracking-tight text-white">
        Pronto<span className="text-orange-300">Já</span>
      </span>
    </Link>
  );
}
