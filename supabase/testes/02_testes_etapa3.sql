-- Testes automáticos da Etapa 3 (Postgres local de teste)
\set ON_ERROR_STOP 1
create or replace function pg_temp.como(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), true);
  execute 'set local role ' || case when uid is null then 'anon' else 'authenticated' end;
end $$;
create or replace function pg_temp.ok(cond boolean, nome text) returns void language plpgsql as $$
begin if not coalesce(cond, false) then raise exception 'FALHOU: %', nome; end if; raise notice 'ok: %', nome; end $$;
create or replace function pg_temp.erro(sql text, esperado text, nome text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then
    if sqlerrm like '%' || esperado || '%' then raise notice 'ok: %', nome; return; end if;
    raise exception 'FALHOU: % (erro inesperado: %)', nome, sqlerrm;
  end;
  raise exception 'FALHOU: % (deveria dar erro)', nome;
end $$;

select pg_temp.ok(arredondar_coord(-5.08734) = -5.09, 'arredonda para ~1 km');
select pg_temp.ok(abs(distancia_km(-5.0898, -42.8131, -5.0681, -42.7926) - 3.3) < 0.3, 'distância Centro→Fátima ~3,3 km');
select pg_temp.ok((select fonte from ponto_do_bairro('fatima')) = 'bairro', 'acha bairro sem acento');
select pg_temp.ok((select fonte from ponto_do_bairro('Bairro Inventado')) = 'cidade', 'bairro desconhecido usa o centro');

-- Cliente
begin;
select pg_temp.como('c1111111-1111-4111-8111-111111111111');
insert into pedidos (id, categoria_slug, descricao, bairro, data_desejada, loc_lat, loc_lng, loc_fonte, status)
  values ('f0000000-0000-4000-8000-000000000001', 'pintor', 'Pintar a sala inteira, duas demãos', 'Centro', current_date + 1, -5.087349, -42.811234, 'gps', 'concluido');
select pg_temp.ok((select status = 'aberto' and loc_lat = -5.09 and loc_lng = -42.81 from pedidos where id = 'f0000000-0000-4000-8000-000000000001'), 'pedido nasce aberto e com GPS arredondado');
select pg_temp.erro($q$insert into pedidos (categoria_slug, descricao, bairro, data_desejada) values ('pintor', 'me chama no zap pra combinar', 'Centro', current_date)$q$, 'CONTATO_BLOQUEADO', 'bloqueia contato na descrição');
select pg_temp.erro($q$insert into pedidos (categoria_slug, descricao, bairro, data_desejada) values ('diarista', 'Faxina completa na casa', 'Centro', current_date)$q$, 'CATEGORIA_INDISPONIVEL', 'não pede em categoria "em breve"');
select pg_temp.erro($q$insert into pedidos (categoria_slug, descricao, bairro, data_desejada) values ('ar-condicionado', 'Ar não gela de jeito nenhum', 'Centro', current_date)$q$, 'DADOS_AR_CONDICIONADO', 'ar-condicionado exige tipo e quantidade');
select pg_temp.erro($q$insert into pedidos (categoria_slug, descricao, bairro, data_desejada) values ('pintor', 'Pintar a sala inteira', 'Centro', current_date - 2)$q$, 'DATA_INVALIDA', 'não aceita data no passado');
select pg_temp.erro($q$insert into pedidos (cliente_id, categoria_slug, descricao, bairro, data_desejada) values ('a1111111-1111-4111-8111-111111111111', 'pintor', 'Pintar a sala inteira', 'Centro', current_date)$q$, 'APENAS_CLIENTES', 'não cria pedido em nome de outro');
select pg_temp.erro($q$update pedidos set lance_inicial = 1 where id = 'e1111111-1111-4111-8111-111111111111'$q$, 'PEDIDO_NAO_EDITAVEL', 'não edita pedido depois de publicado');
select pg_temp.erro($q$update pedidos set status = 'pago_retido' where id = 'e1111111-1111-4111-8111-111111111111'$q$, 'PEDIDO_NAO_EDITAVEL', 'não marca como pago sozinho');
update pedidos set status = 'cancelado' where id = 'e2222222-2222-4222-8222-222222222222';
select pg_temp.ok((select status = 'cancelado' and cancelado_em is not null from pedidos where id = 'e2222222-2222-4222-8222-222222222222'), 'cliente cancela pedido aberto');
select pg_temp.ok((select count(*) from pedido_endereco) = 4, 'cliente vê os próprios endereços');
insert into pedido_fotos (pedido_id, caminho) values ('f0000000-0000-4000-8000-000000000001', 'c1111111-1111-4111-8111-111111111111/f0000000-0000-4000-8000-000000000001/1.jpg');
select pg_temp.erro($q$insert into pedido_fotos (pedido_id, caminho) values ('f0000000-0000-4000-8000-000000000001', 'outra/pasta/1.jpg')$q$, 'FOTO_INVALIDA', 'foto precisa estar na pasta do pedido');
insert into pedido_fotos (pedido_id, caminho) select 'f0000000-0000-4000-8000-000000000001', 'c1111111-1111-4111-8111-111111111111/f0000000-0000-4000-8000-000000000001/' || g || '.jpg' from generate_series(2, 6) g;
select pg_temp.erro($q$insert into pedido_fotos (pedido_id, caminho) values ('f0000000-0000-4000-8000-000000000001', 'c1111111-1111-4111-8111-111111111111/f0000000-0000-4000-8000-000000000001/7.jpg')$q$, 'LIMITE_FOTOS_PEDIDO', 'máximo de 6 fotos');
select pg_temp.ok((select count(*) from buscar_profissionais_proximos(-5.1818, -42.781, 'ar-condicionado')) = 2, 'cliente no Angelim acha 2 técnicos (Rafael atende só 5 km)');
select pg_temp.ok((select nome from buscar_profissionais_proximos(-5.0681, -42.7926, 'ar-condicionado') limit 1) = 'Carlos Andrade', 'mais próximo primeiro');
rollback;

-- Profissional de ar-condicionado
begin;
select pg_temp.como('a3333333-3333-4333-8333-333333333333');
select pg_temp.ok((select count(*) from pedidos) = 3, 'técnico de ar vê só os 3 pedidos de ar');
select pg_temp.ok((select count(*) from pedido_endereco) = 0, 'técnico NÃO vê endereço completo');
select pg_temp.ok((select count(*) from pedido_fotos) = 4, 'técnico vê as fotos dos pedidos de ar');
select pg_temp.ok((select count(*) from localizacoes) = 0, 'não vê a localização de ninguém');
select pg_temp.ok((select id from buscar_pedidos_proximos() limit 1) = 'e3333333-3333-4333-8333-333333333333', 'pedido do Mocambinho aparece primeiro para quem mora lá');
select pg_temp.ok((select count(*) filter (where dentro_do_raio) from buscar_pedidos_proximos()) = 2, 'marca quais estão dentro do raio');
rollback;
begin;
select pg_temp.como('a3333333-3333-4333-8333-333333333333');
update pedidos set status = 'cancelado' where id = 'e1111111-1111-4111-8111-111111111111';
select pg_temp.ok((select status from pedidos where id = 'e1111111-1111-4111-8111-111111111111') = 'aberto', 'pedido continua aberto');
insert into localizacoes (usuario_id, lat, lng) values (auth.uid(), -5.123456, -42.765432);
select pg_temp.ok((select lat = -5.12 and lng = -42.77 from localizacoes), 'GPS salvo já arredondado');
select pg_temp.erro($q$select * from local_do_usuario('c1111111-1111-4111-8111-111111111111')$q$, 'permission denied', 'não consulta a localização de outro');
rollback;

-- Eletricista não vê pedido de ar; ninguém vê sem login
begin;
select pg_temp.como('a2222222-2222-4222-8222-222222222222');
select pg_temp.ok((select count(*) from pedidos where categoria_slug = 'eletricista') = 0, 'técnico de ar não vê pedido de eletricista');
rollback;
begin;
select pg_temp.como(null);
select pg_temp.ok((select count(*) from pedidos) = 0, 'visitante não vê pedidos');
select pg_temp.ok((select count(*) from buscar_profissionais_proximos(null, null, null)) >= 1, 'visitante busca profissionais no mapa');
rollback;
select 'TODOS OS TESTES DA ETAPA 3 PASSARAM' as resultado;
