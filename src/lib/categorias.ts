export type Categoria = {
  slug: string;
  nome: string;
  ativa: boolean;
  /** palavras que a busca da tela inicial reconhece */
  palavras: string[];
};

/** Lista de categorias. Na Etapa 2 ela também passa a existir no banco (tabela "categorias"). */
export const CATEGORIAS: Categoria[] = [
  { slug: "pintor", nome: "Pintor", ativa: true, palavras: ["pintar", "pintura", "parede", "tinta", "textura", "grafiato", "massa corrida"] },
  { slug: "eletricista", nome: "Eletricista", ativa: true, palavras: ["luz", "tomada", "fiação", "fio", "disjuntor", "chuveiro", "energia", "lâmpada", "quadro"] },
  { slug: "encanador", nome: "Encanador", ativa: true, palavras: ["cano", "vazamento", "torneira", "descarga", "esgoto", "caixa d'água", "pia", "registro", "hidráulica"] },
  { slug: "ar-condicionado", nome: "Ar-condicionado", ativa: true, palavras: ["ar", "split", "climatização", "limpeza", "higienização", "gás", "recarga", "btu", "instalação"] },
  { slug: "diarista", nome: "Diarista", ativa: false, palavras: ["faxina", "limpeza de casa", "doméstica"] },
  { slug: "baba", nome: "Babá", ativa: false, palavras: ["criança", "cuidadora", "bebê"] },
];

export function buscarCategoria(slug: string) {
  return CATEGORIAS.find((c) => c.slug === slug);
}

/** Remove acentos e deixa minúsculo, para a busca funcionar com ou sem acento */
export function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function filtrarCategorias(termo: string) {
  const t = normalizar(termo);
  if (!t) return CATEGORIAS;
  return CATEGORIAS.filter((c) =>
    [c.nome, ...c.palavras].some((palavra) => {
      const p = normalizar(palavra);
      // "ar" acha "ar-condicionado"; frases longas acham a palavra-chave dentro delas
      return p.includes(t) || (p.length >= 4 && t.includes(p));
    }),
  );
}
