export type TipoUsuario = "cliente" | "profissional";

export type Perfil = {
  id: string;
  tipo: TipoUsuario | null;
  nome: string;
  foto_url: string | null;
  bairro: string | null;
  aceitou_termos_em: string | null;
  versao_termos: string | null;
  is_admin: boolean;
};

export type Profissional = {
  id: string;
  descricao: string;
  cursos: string[];
  verificado: boolean;
  nota_media: number;
  total_avaliacoes: number;
  total_servicos: number;
};

export type FotoPortfolio = { id: string; caminho: string; legenda: string };

export type Resultado = { ok: true } | { ok: false; erro: string };
