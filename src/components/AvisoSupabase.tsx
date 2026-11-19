import { supabaseConfigurado } from "@/lib/supabase/config";

/** Aparece só enquanto as chaves do Supabase não foram configuradas */
export function AvisoSupabase() {
  if (supabaseConfigurado) return null;
  return (
    <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Configuração pendente:</strong> as chaves do Supabase ainda não foram cadastradas. O login só funciona
      depois disso.
    </p>
  );
}
