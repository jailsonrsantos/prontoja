import { BAIRROS_TERESINA } from "@/lib/bairros";

export function CampoBairro({ valorInicial = "", nome = "bairro" }: { valorInicial?: string; nome?: string }) {
  return (
    <div>
      <label htmlFor={nome} className="rotulo">Bairro (Teresina)</label>
      <input id={nome} name={nome} list="lista-bairros" defaultValue={valorInicial} className="campo" maxLength={60} required autoComplete="off" />
      <datalist id="lista-bairros">
        {BAIRROS_TERESINA.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <p className="mt-1 text-xs text-suave">Só o bairro aparece para os outros. O endereço completo fica protegido.</p>
    </div>
  );
}
