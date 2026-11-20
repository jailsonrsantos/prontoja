-- =====================================================================
-- ProntoJá · Etapa 3 · Pedidos com fotos + mapa por proximidade
-- Rode DEPOIS da 001. Supabase > SQL Editor > New query > cole tudo > Run.
-- Pode rodar mais de uma vez.
-- =====================================================================

-- ---------- Ajuste da Etapa 2: identificar "usuário comum do app" com segurança ----------
create or replace function public.eh_usuario_do_app()
returns boolean language sql stable as $fn$
  -- 'role' continua 'authenticated' mesmo dentro de funções com permissão especial.
  -- Funções internas do sistema ligam a marca 'prontoja.sistema' para fazer mudanças permitidas.
  select coalesce(current_setting('role', true), current_user) in ('authenticated', 'anon')
     and coalesce(current_setting('prontoja.sistema', true), '') <> '1'
$fn$;

-- ---------- Funções de geografia (sem extensões extras) ----------

-- Arredonda uma coordenada para uma grade de ~1 km (0,01 grau).
-- É sempre o mesmo resultado para o mesmo lugar: impede "triangular" endereços.
create or replace function public.arredondar_coord(x double precision)
returns double precision language sql immutable as $fn$
  select round(x::numeric, 2)::double precision
$fn$;

-- Distância em km entre dois pontos (fórmula de Haversine)
create or replace function public.distancia_km(lat1 double precision, lng1 double precision,
                                               lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $fn$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)))
$fn$;

-- Remove acentos e deixa minúsculo (para comparar nomes de bairro)
create or replace function public.normalizar_txt(t text)
returns text language sql immutable as $fn$
  select lower(trim(translate(coalesce(t, ''),
    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
    'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')))
$fn$;

-- ---------- Bairros de Teresina (centro aproximado) ----------
-- Coordenadas: © colaboradores do OpenStreetMap (ODbL), via Nominatim.
create table if not exists public.bairros (
  nome      text primary key,
  nome_norm text generated always as (public.normalizar_txt(nome)) stored unique,
  lat       double precision not null,
  lng       double precision not null
);
insert into public.bairros (nome, lat, lng) values
  ('Acarape', -5.071, -42.8299),
  ('Aeroporto', -5.068, -42.8176),
  ('Angelim', -5.1818, -42.781),
  ('Areias', -5.159, -42.7931),
  ('Bela Vista', -5.1345, -42.7738),
  ('Buenos Aires', -5.038, -42.8086),
  ('Cabral', -5.082, -42.8015),
  ('Campestre', -5.0678, -42.7551),
  ('Centro', -5.0898, -42.8131),
  ('Cristo Rei', -5.1006, -42.7877),
  ('Dirceu Arcoverde', -5.1082, -42.7607),
  ('Esplanada', -5.1925, -42.7547),
  ('Fátima', -5.0681, -42.7926),
  ('Gurupi', -5.0846, -42.7388),
  ('Horto', -5.0661, -42.7774),
  ('Ilhotas', -5.0918, -42.7928),
  ('Ininga', -5.0552, -42.7938),
  ('Itararé', -5.1046, -42.7598),
  ('Jóquei', -5.0762, -42.7895),
  ('Lourival Parente', -5.1333, -42.7875),
  ('Mafuá', -5.0785, -42.8172),
  ('Matinha', -5.0813, -42.8251),
  ('Memorare', -5.0459, -42.8172),
  ('Mocambinho', -5.0253, -42.8128),
  ('Monte Castelo', -5.1036, -42.7964),
  ('Morada do Sol', -5.0696, -42.7663),
  ('Morros', -5.03, -42.7561),
  ('Noivos', -5.0844, -42.7853),
  ('Nova Brasília', -5.051, -42.8281),
  ('Novo Horizonte', -5.1121, -42.7492),
  ('Parque Piauí', -5.1434, -42.7862),
  ('Pedra Mole', -5.0114, -42.7817),
  ('Piçarra', -5.0936, -42.7988),
  ('Planalto', -5.0578, -42.7766),
  ('Poti Velho', -5.0369, -42.8298),
  ('Primavera', -5.0632, -42.813),
  ('Promorar', -5.1491, -42.7857),
  ('Recanto das Palmeiras', -5.0835, -42.7588),
  ('Redenção', -5.1182, -42.793),
  ('Saci', -5.1378, -42.8004),
  ('Santa Isabel', -5.0756, -42.7578),
  ('Santa Maria da Codipi', -4.9841, -42.8366),
  ('Santo Antônio', -5.1532, -42.7757),
  ('Satélite', -5.0475, -42.7579),
  ('Socopo', -5.0152, -42.7603),
  ('São Cristóvão', -5.0781, -42.77),
  ('São Joaquim', -5.0567, -42.8345),
  ('Tabuleta', -5.1227, -42.8037),
  ('Três Andares', -5.1136, -42.7867),
  ('Uruguai', -5.0646, -42.7406),
  ('Vale Quem Tem', -5.0492, -42.7382),
  ('Vermelha', -5.1053, -42.8088),
  ('Água Mineral', -5.046, -42.8074)
on conflict (nome) do update set lat = excluded.lat, lng = excluded.lng;

alter table public.bairros enable row level security;
drop policy if exists "bairros_leitura" on public.bairros;
create policy "bairros_leitura" on public.bairros for select using (true);

-- Centro de Teresina: usado quando o bairro não é conhecido
create or replace function public.centro_teresina(out lat double precision, out lng double precision)
language sql immutable as $fn$ select -5.0898::double precision, -42.8131::double precision $fn$;

-- Ponto (arredondado) de um bairro, ou o centro da cidade
create or replace function public.ponto_do_bairro(p_bairro text, out lat double precision, out lng double precision, out fonte text)
language sql stable as $fn$
  select coalesce(b.lat, c.lat), coalesce(b.lng, c.lng), case when b.nome is null then 'cidade' else 'bairro' end
  from public.centro_teresina() c
  left join public.bairros b on b.nome_norm = public.normalizar_txt(p_bairro)
$fn$;

-- ---------- Localização aproximada de cada usuário ----------
-- Só o próprio usuário lê. Guardamos SÓ a posição arredondada (~1 km).
create table if not exists public.localizacoes (
  usuario_id    uuid primary key references public.perfis(id) on delete cascade,
  lat           double precision not null check (lat between -90 and 90),
  lng           double precision not null check (lng between -180 and 180),
  fonte         text not null default 'gps' check (fonte in ('gps')),
  atualizado_em timestamptz not null default now()
);
create or replace function public.arredondar_localizacao()
returns trigger language plpgsql as $fn$
begin
  new.lat := public.arredondar_coord(new.lat);
  new.lng := public.arredondar_coord(new.lng);
  new.atualizado_em := now();
  return new;
end $fn$;
drop trigger if exists localizacoes_arredondar on public.localizacoes;
create trigger localizacoes_arredondar before insert or update on public.localizacoes
  for each row execute function public.arredondar_localizacao();

alter table public.localizacoes enable row level security;
drop policy if exists "localizacoes_dono" on public.localizacoes;
create policy "localizacoes_dono" on public.localizacoes for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Onde o usuário está (aproximado): GPS salvo > bairro do perfil > centro da cidade
create or replace function public.local_do_usuario(p_usuario uuid, out lat double precision, out lng double precision, out fonte text)
language sql stable security definer set search_path = public as $fn$
  select coalesce(l.lat, pb.lat), coalesce(l.lng, pb.lng), coalesce(l.fonte, pb.fonte)
  from public.perfis pe
  cross join lateral public.ponto_do_bairro(pe.bairro) pb
  left join public.localizacoes l on l.usuario_id = pe.id
  where pe.id = p_usuario
$fn$;
revoke execute on function public.local_do_usuario(uuid) from public, anon, authenticated;

-- A localização aproximada do PRÓPRIO usuário logado (para centralizar o mapa)
create or replace function public.meu_local(out lat double precision, out lng double precision, out fonte text)
language sql stable security definer set search_path = public as $fn$
  select l.lat, l.lng, l.fonte from public.local_do_usuario(auth.uid()) l
$fn$;
revoke execute on function public.meu_local() from public, anon;
grant execute on function public.meu_local() to authenticated;

-- ---------- Raio de atendimento do profissional ----------
alter table public.profissionais add column if not exists raio_km int not null default 10;
alter table public.profissionais drop constraint if exists profissionais_raio_km_check;
alter table public.profissionais add constraint profissionais_raio_km_check check (raio_km in (3, 5, 10, 20, 50));

-- O profissional atende essa categoria?
create or replace function public.eh_profissional_da(p_categoria text)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.profissional_categorias
                 where profissional_id = auth.uid() and categoria_slug = p_categoria)
$fn$;

-- ---------- Pedidos ----------
create table if not exists public.pedidos (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid not null default auth.uid() references public.perfis(id) on delete cascade,
  categoria_slug  text not null references public.categorias(slug),
  ac_tipo_servico text check (ac_tipo_servico in ('instalacao', 'limpeza', 'conserto', 'recarga')),
  ac_btus         int check (ac_btus between 5000 and 80000),
  ac_quantidade   int check (ac_quantidade between 1 and 20),
  descricao       text not null check (char_length(descricao) between 10 and 1500),
  bairro          text not null check (char_length(bairro) between 2 and 60),
  data_desejada   date not null,
  lance_inicial   numeric(10,2) check (lance_inicial is null or lance_inicial between 10 and 100000),
  loc_lat         double precision,
  loc_lng         double precision,
  loc_fonte       text check (loc_fonte in ('gps', 'bairro', 'cidade')),
  status          text not null default 'aberto' check (status in
                    ('aberto', 'aguardando_pagamento', 'pago_retido', 'concluido', 'avaliado', 'cancelado', 'em_disputa')),
  cancelado_em    timestamptz,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
create index if not exists pedidos_abertos_por_categoria on public.pedidos (categoria_slug, criado_em desc) where status = 'aberto';
create index if not exists pedidos_por_cliente on public.pedidos (cliente_id, criado_em desc);

create or replace function public.validar_pedido_novo()
returns trigger language plpgsql as $fn$
declare hoje date := (now() at time zone 'America/Fortaleza')::date;
        pb record;
begin
  perform public.checar_contato(new.descricao, new.bairro);
  if not exists (select 1 from public.categorias where slug = new.categoria_slug and ativa) then
    raise exception 'CATEGORIA_INDISPONIVEL';
  end if;
  if not exists (select 1 from public.perfis where id = new.cliente_id and tipo = 'cliente') then
    raise exception 'APENAS_CLIENTES';
  end if;
  if new.categoria_slug = 'ar-condicionado' then
    if new.ac_tipo_servico is null or new.ac_quantidade is null then raise exception 'DADOS_AR_CONDICIONADO'; end if;
  else
    new.ac_tipo_servico := null; new.ac_btus := null; new.ac_quantidade := null;
  end if;
  if new.data_desejada < hoje or new.data_desejada > hoje + 90 then raise exception 'DATA_INVALIDA'; end if;
  if public.eh_usuario_do_app() then
    new.status := 'aberto';
    new.criado_em := now();
  end if;
  -- Localização: GPS arredondado, ou o centro do bairro
  if new.loc_lat is not null and new.loc_lng is not null and new.loc_fonte = 'gps' then
    new.loc_lat := public.arredondar_coord(new.loc_lat);
    new.loc_lng := public.arredondar_coord(new.loc_lng);
  else
    select * into pb from public.ponto_do_bairro(new.bairro);
    new.loc_lat := pb.lat; new.loc_lng := pb.lng; new.loc_fonte := pb.fonte;
  end if;
  return new;
end $fn$;
drop trigger if exists pedidos_validar_novo on public.pedidos;
create trigger pedidos_validar_novo before insert on public.pedidos
  for each row execute function public.validar_pedido_novo();

-- Usuário comum só pode CANCELAR um pedido aberto (o resto muda pelas próximas etapas)
create or replace function public.proteger_pedido()
returns trigger language plpgsql as $fn$
begin
  new.atualizado_em := now();
  if public.eh_usuario_do_app() and not public.is_admin() then
    if row(new.cliente_id, new.categoria_slug, new.ac_tipo_servico, new.ac_btus, new.ac_quantidade, new.descricao,
           new.bairro, new.data_desejada, new.lance_inicial, new.loc_lat, new.loc_lng, new.criado_em)
       is distinct from
       row(old.cliente_id, old.categoria_slug, old.ac_tipo_servico, old.ac_btus, old.ac_quantidade, old.descricao,
           old.bairro, old.data_desejada, old.lance_inicial, old.loc_lat, old.loc_lng, old.criado_em) then
      raise exception 'PEDIDO_NAO_EDITAVEL';
    end if;
    if new.status is distinct from old.status then
      if not (old.status = 'aberto' and new.status = 'cancelado') then raise exception 'PEDIDO_NAO_EDITAVEL'; end if;
      new.cancelado_em := now();
    end if;
  end if;
  return new;
end $fn$;
drop trigger if exists pedidos_proteger on public.pedidos;
create trigger pedidos_proteger before update on public.pedidos
  for each row execute function public.proteger_pedido();

-- Quem pode ver o pedido: o dono, o admin e os profissionais da categoria (enquanto aberto)
create or replace function public.pode_ver_pedido(p_pedido uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.pedidos p
    where p.id = p_pedido
      and (p.cliente_id = auth.uid() or public.is_admin()
           or (p.status = 'aberto' and public.eh_profissional_da(p.categoria_slug))))
$fn$;

alter table public.pedidos enable row level security;
drop policy if exists "pedidos_leitura" on public.pedidos;
create policy "pedidos_leitura" on public.pedidos for select
  using (cliente_id = auth.uid() or public.is_admin()
         or (status = 'aberto' and public.eh_profissional_da(categoria_slug)));
drop policy if exists "pedidos_criar" on public.pedidos;
create policy "pedidos_criar" on public.pedidos for insert with check (cliente_id = auth.uid());
drop policy if exists "pedidos_atualizar" on public.pedidos;
create policy "pedidos_atualizar" on public.pedidos for update
  using (cliente_id = auth.uid() or public.is_admin()) with check (cliente_id = auth.uid() or public.is_admin());

-- ---------- Endereço completo do pedido (protegido) ----------
-- Só o dono vê. A etapa de pagamento libera para o profissional após o pagamento confirmado.
create table if not exists public.pedido_endereco (
  pedido_id  uuid primary key references public.pedidos(id) on delete cascade,
  endereco   text not null check (char_length(endereco) between 5 and 200),
  referencia text check (char_length(referencia) <= 200)
);
alter table public.pedido_endereco enable row level security;
drop policy if exists "endereco_dono" on public.pedido_endereco;
create policy "endereco_dono" on public.pedido_endereco for all
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.cliente_id = auth.uid()))
  with check (exists (select 1 from public.pedidos p where p.id = pedido_id and p.cliente_id = auth.uid()));

-- ---------- Fotos do pedido (até 6, privadas) ----------
create table if not exists public.pedido_fotos (
  id        uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  caminho   text not null,
  ordem     int not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists pedido_fotos_por_pedido on public.pedido_fotos (pedido_id, ordem);

create or replace function public.validar_foto_pedido()
returns trigger language plpgsql as $fn$
declare dono uuid;
begin
  select cliente_id into dono from public.pedidos where id = new.pedido_id;
  if public.eh_usuario_do_app() and new.caminho not like dono::text || '/' || new.pedido_id::text || '/%' then
    raise exception 'FOTO_INVALIDA';
  end if;
  if (select count(*) from public.pedido_fotos where pedido_id = new.pedido_id) >= 6 then
    raise exception 'LIMITE_FOTOS_PEDIDO';
  end if;
  return new;
end $fn$;
drop trigger if exists pedido_fotos_validar on public.pedido_fotos;
create trigger pedido_fotos_validar before insert on public.pedido_fotos
  for each row execute function public.validar_foto_pedido();

alter table public.pedido_fotos enable row level security;
drop policy if exists "pedido_fotos_leitura" on public.pedido_fotos;
create policy "pedido_fotos_leitura" on public.pedido_fotos for select using (public.pode_ver_pedido(pedido_id));
drop policy if exists "pedido_fotos_dono" on public.pedido_fotos;
create policy "pedido_fotos_dono" on public.pedido_fotos for insert
  with check (exists (select 1 from public.pedidos p where p.id = pedido_id and p.cliente_id = auth.uid() and p.status = 'aberto'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pedidos', 'pedidos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Caminho das fotos: pedidos/<id-do-cliente>/<id-do-pedido>/<arquivo>.jpg
drop policy if exists "pedidos_enviar" on storage.objects;
create policy "pedidos_enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'pedidos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "pedidos_ver" on storage.objects;
create policy "pedidos_ver" on storage.objects for select to authenticated
  using (bucket_id = 'pedidos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (case when (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
             then public.pode_ver_pedido(((storage.foldername(name))[2])::uuid) else false end)));
drop policy if exists "pedidos_apagar" on storage.objects;
create policy "pedidos_apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'pedidos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Busca por proximidade ----------

-- Profissionais perto de um ponto (qualquer pessoa pode buscar, até sem login).
-- Devolve só a ÁREA aproximada (~1 km) e a distância arredondada.
create or replace function public.buscar_profissionais_proximos(
  p_lat double precision, p_lng double precision, p_categoria text default null, p_limite int default 60)
returns table (
  id uuid, nome text, foto_url text, bairro text, verificado boolean, nota_media numeric,
  total_avaliacoes int, total_servicos int, categorias text[], raio_km int,
  area_lat double precision, area_lng double precision, distancia_km numeric)
language sql stable security definer set search_path = public as $fn$
  with origem as (
    select public.arredondar_coord(coalesce(p_lat, (public.centro_teresina()).lat)) as lat,
           public.arredondar_coord(coalesce(p_lng, (public.centro_teresina()).lng)) as lng
  )
  select pr.id, pe.nome, pe.foto_url, pe.bairro, pr.verificado, pr.nota_media, pr.total_avaliacoes,
         pr.total_servicos, cats.lista, pr.raio_km, l.lat, l.lng,
         round((public.distancia_km(o.lat, o.lng, l.lat, l.lng) * 2)::numeric) / 2
  from public.profissionais pr
  join public.perfis pe on pe.id = pr.id and pe.tipo = 'profissional'
  cross join origem o
  cross join lateral public.local_do_usuario(pr.id) l
  cross join lateral (select array_agg(pc.categoria_slug order by pc.categoria_slug) as lista
                      from public.profissional_categorias pc where pc.profissional_id = pr.id) cats
  where cats.lista is not null
    and (p_categoria is null or p_categoria = any (cats.lista))
    and (pr.raio_km >= 50 or public.distancia_km(o.lat, o.lng, l.lat, l.lng) <= pr.raio_km + 1)
  order by public.distancia_km(o.lat, o.lng, l.lat, l.lng), pr.verificado desc, pr.nota_media desc
  limit least(coalesce(p_limite, 60), 100)
$fn$;
grant execute on function public.buscar_profissionais_proximos(double precision, double precision, text, int) to anon, authenticated;

-- Pedidos abertos perto do profissional logado (só das categorias dele; usa as regras de acesso normais)
create or replace function public.buscar_pedidos_proximos(p_lat double precision default null, p_lng double precision default null)
returns table (
  id uuid, categoria_slug text, ac_tipo_servico text, ac_btus int, ac_quantidade int, descricao text,
  bairro text, data_desejada date, lance_inicial numeric, criado_em timestamptz, cliente_nome text,
  total_fotos int, area_lat double precision, area_lng double precision, distancia_km numeric, dentro_do_raio boolean)
language plpgsql stable security invoker set search_path = public as $fn$
declare o record; meu_raio int;
begin
  if p_lat is null or p_lng is null then
    select m.lat, m.lng into o from public.meu_local() m;
  else
    select public.arredondar_coord(p_lat) as lat, public.arredondar_coord(p_lng) as lng into o;
  end if;
  select pr.raio_km into meu_raio from public.profissionais pr where pr.id = auth.uid();
  return query
    select p.id, p.categoria_slug, p.ac_tipo_servico, p.ac_btus, p.ac_quantidade, p.descricao, p.bairro,
           p.data_desejada, p.lance_inicial, p.criado_em, split_part(pe.nome, ' ', 1),
           (select count(*)::int from public.pedido_fotos f where f.pedido_id = p.id),
           p.loc_lat, p.loc_lng,
           round((public.distancia_km(o.lat, o.lng, p.loc_lat, p.loc_lng) * 2)::numeric) / 2,
           coalesce(meu_raio, 10) >= 50 or public.distancia_km(o.lat, o.lng, p.loc_lat, p.loc_lng) <= coalesce(meu_raio, 10) + 1
    from public.pedidos p
    join public.perfis pe on pe.id = p.cliente_id
    where p.status = 'aberto' and p.cliente_id <> auth.uid()
    order by 16 desc, 15, p.criado_em desc
    limit 100;
end $fn$;
grant execute on function public.buscar_pedidos_proximos(double precision, double precision) to authenticated;
