import { AirVent, Baby, Paintbrush, Sparkles, Wrench, Zap, type LucideProps } from "lucide-react";

const ICONES: Record<string, React.ComponentType<LucideProps>> = {
  pintor: Paintbrush,
  eletricista: Zap,
  encanador: Wrench,
  "ar-condicionado": AirVent,
  diarista: Sparkles,
  baba: Baby,
};

export function IconeCategoria({ slug, ...props }: { slug: string } & LucideProps) {
  const Icone = ICONES[slug] ?? Wrench;
  return <Icone aria-hidden {...props} />;
}
