export function AvisoRevisao() {
  return (
    <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
      [REVISAR COM ADVOGADO] Texto provisório, sem validade jurídica. Deve ser revisado antes do lançamento.
    </p>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-marca">{titulo}</h2>
      <div className="space-y-2 text-[15px] leading-relaxed text-texto">{children}</div>
    </section>
  );
}
