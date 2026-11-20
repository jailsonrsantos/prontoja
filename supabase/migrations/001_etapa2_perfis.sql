-- =====================================================================
-- ProntoJá · Etapa 2 · Perfis de cliente e profissional
-- Como usar: Supabase > SQL Editor > New query > cole TUDO > Run.
-- Pode rodar mais de uma vez sem problema.
-- =====================================================================

-- ---------- Funções de apoio ----------

-- Detecta telefone, e-mail ou pedido de contato em um texto.
-- (A mesma regra existe no app, em src/lib/contato.ts)
create or replace function public.tem_contato(texto text)
returns boolean language sql immutable as $fn$
  select coalesce(texto, '') ~ '(\d[\s.()-]*){8,}'
      or coalesce(texto, '') ~* '[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}'
      or coalesce(texto, '') ~* '(whats|wats|zap|wpp|telegram|instagram|\minsta\M|me liga|liga pra mim|liga para mim|meu n[uú]mero|meu contato)'
      or coalesce(texto, '') ~* '\m(zero|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove)([\s,.-]+(zero|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove)){5,}\M'
$fn$;

-- Gera erro se algum dos textos tiver contato
create or replace function public.checar_contato(variadic textos text[])
returns void language plpgsql immutable as $fn$
declare t text;
begin
  foreach t in array textos loop
    if public.tem_contato(t) then
      raise exception 'CONTATO_BLOQUEADO' using hint = 'Telefone, e-mail e redes sociais só são liberados após o acordo pago.';
    end if;
  end loop;
end $fn$;

-- Atualiza a coluna atualizado_em automaticamente
create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $fn$
begin new.atualizado_em := now(); return new; end $fn$;

-- "Quem está fazendo a alteração é um usuário comum do app?"
-- (No SQL Editor do Supabase você é 'postgres', então pode tudo.)
create or replace function public.eh_usuario_do_app()
returns boolean language sql stable as $fn$
  -- 'role' continua 'authenticated' mesmo dentro de funções com permissão especial.
  -- Funções internas do sistema ligam a marca 'prontoja.sistema' para fazer mudanças permitidas.
  select coalesce(current_setting('role', true), current_user) in ('authenticated', 'anon')
     and coalesce(current_setting('prontoja.sistema', true), '') <> '1'
$fn$;

-- ---------- Categorias ----------
create table if not exists public.categorias (
  slug  text primary key,
  nome  text not null,
  ativa boolean not null default true,
  ordem int not null default 0
);
insert into public.categorias (slug, nome, ativa, ordem) values
  ('pintor', 'Pintor', true, 1),
  ('eletricista', 'Eletricista', true, 2),
  ('encanador', 'Encanador', true, 3),
  ('ar-condicionado', 'Ar-condicionado', true, 4),
  ('diarista', 'Diarista', false, 5),
  ('baba', 'Babá', false, 6)
on conflict (slug) do nothing;

alter table public.categorias enable row level security;
drop policy if exists "categorias_leitura" on public.categorias;
create policy "categorias_leitura" on public.categorias for select using (true);

-- ---------- Perfis (um por usuário) ----------
create table if not exists public.perfis (
  id                uuid primary key references auth.users(id) on delete cascade,
  tipo              text check (tipo in ('cliente', 'profissional')),
  nome              text not null default '' check (char_length(nome) <= 80),
  foto_url          text,
  bairro            text check (char_length(bairro) <= 60),
  aceitou_termos_em timestamptz,
  versao_termos     text,
  is_admin          boolean not null default false,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce((select is_admin from public.perfis where id = auth.uid()), false)
$fn$;

-- Protege campos que o usuário não pode mudar sozinho
create or replace function public.proteger_perfil()
returns trigger language plpgsql as $fn$
begin
  perform public.checar_contato(new.nome, new.bairro);
  if public.eh_usuario_do_app() and not public.is_admin() then
    new.is_admin := old.is_admin;
    if old.tipo is not null and new.tipo is distinct from old.tipo then
      raise exception 'TIPO_NAO_PODE_MUDAR';
    end if;
    if old.aceitou_termos_em is not null then
      new.aceitou_termos_em := old.aceitou_termos_em;
      new.versao_termos := old.versao_termos;
    elsif new.aceitou_termos_em is not null then
      new.aceitou_termos_em := now();  -- a hora vem do servidor, não do celular
    end if;
  end if;
  return new;
end $fn$;

drop trigger if exists perfis_proteger on public.perfis;
create trigger perfis_proteger before update on public.perfis
  for each row execute function public.proteger_perfil();
drop trigger if exists perfis_atualizado on public.perfis;
create trigger perfis_atualizado before update on public.perfis
  for each row execute function public.tocar_atualizado_em();

-- Cria o perfil automaticamente quando alguém se cadastra
create or replace function public.criar_perfil_novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.perfis (id, nome, foto_url, aceitou_termos_em, versao_termos)
  values (
    new.id,
    left(coalesce(nullif(meta->>'nome', ''), meta->>'full_name', meta->>'name', ''), 80),
    meta->>'avatar_url',
    case when meta ? 'aceitou_termos_em' then now() end,
    case when meta ? 'aceitou_termos_em' then '2026-11-v1' end
  )
  on conflict (id) do nothing;
  return new;
end $fn$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- Cria perfis para quem já tinha conta antes desta etapa
insert into public.perfis (id, nome, aceitou_termos_em, versao_termos)
select u.id,
       left(coalesce(nullif(u.raw_user_meta_data->>'nome', ''), u.raw_user_meta_data->>'full_name', ''), 80),
       case when u.raw_user_meta_data ? 'aceitou_termos_em' then u.created_at end,
       case when u.raw_user_meta_data ? 'aceitou_termos_em' then '2026-11-v1' end
from auth.users u
on conflict (id) do nothing;

alter table public.perfis enable row level security;
drop policy if exists "perfis_leitura" on public.perfis;
create policy "perfis_leitura" on public.perfis for select
  using (auth.uid() is not null or tipo = 'profissional');
drop policy if exists "perfis_editar_proprio" on public.perfis;
create policy "perfis_editar_proprio" on public.perfis for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- ---------- Contatos privados (telefone/WhatsApp) ----------
-- Tabela separada: só o dono lê. Na etapa de pagamento ganha a regra
-- "a outra parte do acordo também lê, depois do pagamento confirmado".
create table if not exists public.contatos_privados (
  id            uuid primary key references public.perfis(id) on delete cascade,
  telefone      text check (telefone ~ '^\d{10,11}$'),
  whatsapp      text check (whatsapp ~ '^\d{10,11}$'),
  atualizado_em timestamptz not null default now()
);
drop trigger if exists contatos_atualizado on public.contatos_privados;
create trigger contatos_atualizado before update on public.contatos_privados
  for each row execute function public.tocar_atualizado_em();

alter table public.contatos_privados enable row level security;
drop policy if exists "contatos_dono" on public.contatos_privados;
create policy "contatos_dono" on public.contatos_privados for all
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid());

-- ---------- Profissionais (mini currículo) ----------
create table if not exists public.profissionais (
  id               uuid primary key references public.perfis(id) on delete cascade,
  descricao        text not null default '' check (char_length(descricao) <= 1000),
  cursos           text[] not null default '{}' check (cardinality(cursos) <= 10),
  verificado       boolean not null default false,
  nota_media       numeric(3,2) not null default 0,
  total_avaliacoes int not null default 0,
  total_servicos   int not null default 0,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

create or replace function public.proteger_profissional()
returns trigger language plpgsql as $fn$
begin
  perform public.checar_contato(new.descricao, array_to_string(new.cursos, ' | '));
  if public.eh_usuario_do_app() and not public.is_admin() then
    new.verificado       := old.verificado;
    new.nota_media       := old.nota_media;
    new.total_avaliacoes := old.total_avaliacoes;
    new.total_servicos   := old.total_servicos;
  end if;
  return new;
end $fn$;
drop trigger if exists profissionais_proteger on public.profissionais;
create trigger profissionais_proteger before update on public.profissionais
  for each row execute function public.proteger_profissional();
drop trigger if exists profissionais_atualizado on public.profissionais;
create trigger profissionais_atualizado before update on public.profissionais
  for each row execute function public.tocar_atualizado_em();

-- Quando o perfil vira "profissional", cria o currículo vazio
create or replace function public.criar_curriculo()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.tipo = 'profissional' then
    insert into public.profissionais (id) values (new.id) on conflict (id) do nothing;
  end if;
  return new;
end $fn$;
drop trigger if exists perfis_criar_curriculo on public.perfis;
create trigger perfis_criar_curriculo after insert or update of tipo on public.perfis
  for each row execute function public.criar_curriculo();

alter table public.profissionais enable row level security;
drop policy if exists "profissionais_leitura" on public.profissionais;
create policy "profissionais_leitura" on public.profissionais for select using (true);
drop policy if exists "profissionais_editar_proprio" on public.profissionais;
create policy "profissionais_editar_proprio" on public.profissionais for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- ---------- Especialidades ----------
create table if not exists public.profissional_categorias (
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  categoria_slug  text not null references public.categorias(slug),
  primary key (profissional_id, categoria_slug)
);
alter table public.profissional_categorias enable row level security;
drop policy if exists "especialidades_leitura" on public.profissional_categorias;
create policy "especialidades_leitura" on public.profissional_categorias for select using (true);
drop policy if exists "especialidades_dono" on public.profissional_categorias;
create policy "especialidades_dono" on public.profissional_categorias for insert
  with check (profissional_id = auth.uid()
              and exists (select 1 from public.categorias c where c.slug = categoria_slug and c.ativa));
drop policy if exists "especialidades_remover" on public.profissional_categorias;
create policy "especialidades_remover" on public.profissional_categorias for delete
  using (profissional_id = auth.uid());

-- ---------- Fotos de trabalhos (portfólio) ----------
create table if not exists public.portfolio_fotos (
  id              uuid primary key default gen_random_uuid(),
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  caminho         text not null,
  legenda         text not null default '' check (char_length(legenda) <= 120),
  criado_em       timestamptz not null default now()
);
create index if not exists portfolio_por_profissional on public.portfolio_fotos (profissional_id, criado_em);

create or replace function public.limitar_portfolio()
returns trigger language plpgsql as $fn$
begin
  perform public.checar_contato(new.legenda);
  if (select count(*) from public.portfolio_fotos where profissional_id = new.profissional_id) >= 12 then
    raise exception 'LIMITE_FOTOS';
  end if;
  return new;
end $fn$;
drop trigger if exists portfolio_limite on public.portfolio_fotos;
create trigger portfolio_limite before insert on public.portfolio_fotos
  for each row execute function public.limitar_portfolio();

alter table public.portfolio_fotos enable row level security;
drop policy if exists "portfolio_leitura" on public.portfolio_fotos;
create policy "portfolio_leitura" on public.portfolio_fotos for select using (true);
drop policy if exists "portfolio_dono_inserir" on public.portfolio_fotos;
create policy "portfolio_dono_inserir" on public.portfolio_fotos for insert
  with check (profissional_id = auth.uid() and caminho like auth.uid()::text || '/%');
drop policy if exists "portfolio_dono_remover" on public.portfolio_fotos;
create policy "portfolio_dono_remover" on public.portfolio_fotos for delete
  using (profissional_id = auth.uid() or public.is_admin());

-- ---------- Armazenamento de fotos públicas (perfil e portfólio) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('publico', 'publico', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Cada usuário só envia/apaga arquivos dentro da própria pasta: publico/<id-do-usuario>/...
drop policy if exists "publico_enviar_propria_pasta" on storage.objects;
create policy "publico_enviar_propria_pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'publico' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "publico_apagar_propria_pasta" on storage.objects;
create policy "publico_apagar_propria_pasta" on storage.objects for delete to authenticated
  using (bucket_id = 'publico' and (storage.foldername(name))[1] = auth.uid()::text);
