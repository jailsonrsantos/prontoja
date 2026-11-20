"use client";

import { useState } from "react";
import { cancelarPedido } from "./actions";

export function BotaoCancelar({ id }: { id: string }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={ocupado}
        onClick={async () => {
          if (!confirm("Cancelar este pedido? Os profissionais deixarão de vê-lo.")) return;
          setOcupado(true);
          const r = await cancelarPedido(id);
          if (!r.ok) setErro(r.erro);
          setOcupado(false);
        }}
        className="btn-contorno w-full text-red-700"
      >
        {ocupado ? "Cancelando…" : "Cancelar pedido"}
      </button>
      {erro && <p className="text-sm text-red-700">{erro}</p>}
    </div>
  );
}
