-- Testes automáticos das regras de segurança da Etapa 2 (rodar no Postgres local de teste)
\set ON_ERROR_STOP 1
create or replace function pg_temp.como(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), true);
  execute 'set local role ' || case when uid is null then 'anon' else 'authenticated' end;
end $$;
create or replace function pg_temp.ok(cond boolean, nome text) returns void language plpgsql as $$
begin if not cond then raise exception 'FALHOU: %', nome; end if; raise notice 'ok: %', nome; end $$;
create or replace function pg_temp.erro(sql text, esperado text, nome text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then
    if sqlerrm like '%' || esperado || '%' then raise notice 'ok: %', nome; return; end if;
    raise exception 'FALHOU: % (erro inesperado: %)', nome, sqlerrm;
  end;
  raise exception 'FALHOU: % (deveria dar erro)', nome;
end $$;

-- 1) Detector de contato
select pg_temp.ok(tem_contato('me chama no 86 99999-1234'), 'detecta telefone com traço');
select pg_temp.ok(tem_contato('8 6 9 9 9 9 1 2 3 4'), 'detecta telefone espaçado');
select pg_temp.ok(tem_contato('fulano@gmail.com'), 'detecta e-mail');
select pg_temp.ok(tem_contato('chama no zap'), 'detecta zap');
select pg_temp.ok(tem_contato('nove oito sete seis cinco quatro três'), 'detecta número por extenso');
select pg_temp.ok(not tem_contato('Split 12000 BTUs, 2 aparelhos, R$ 1.500,00 em 12/03/2026'), 'não bloqueia BTU, preço e data');
select pg_temp.ok(not tem_contato('Instalação com garantia de 90 dias'), 'não bloqueia texto comum');

-- 2) Cliente comum
begin;
select pg_temp.como('c1111111-1111-4111-8111-111111111111');
select pg_temp.ok((select count(*) from perfis) = 4, 'logado vê perfis');
update perfis set is_admin = true, nome = 'Ana C.' where id = auth.uid();
select pg_temp.ok((select not is_admin and nome = 'Ana C.' from perfis where id = auth.uid()), 'não vira admin sozinho, mas edita nome');
select pg_temp.erro($q$update perfis set tipo = 'profissional' where id = auth.uid()$q$, 'TIPO_NAO_PODE_MUDAR', 'não troca de tipo');
update perfis set nome = 'Hacker' where id = 'a1111111-1111-4111-8111-111111111111';
select pg_temp.ok((select nome from perfis where id = 'a1111111-1111-4111-8111-111111111111') = 'Carlos Andrade', 'não edita perfil de outro');
insert into contatos_privados (id, whatsapp) values (auth.uid(), '86999991234');
select pg_temp.ok((select count(*) from contatos_privados) = 1, 'vê só o próprio contato');
update profissionais set verificado = false;
select pg_temp.ok((select verificado from profissionais where id = 'a1111111-1111-4111-8111-111111111111'), 'cliente não mexe em currículo');
select pg_temp.erro($q$insert into contatos_privados (id, telefone) values ('a1111111-1111-4111-8111-111111111111', '86999990000')$q$, 'row-level security', 'não grava contato de outro');
rollback;

-- 3) Profissional
begin;
select pg_temp.como('a2222222-2222-4222-8222-222222222222');
update profissionais set verificado = true, nota_media = 5, descricao = 'Novo texto' where id = auth.uid();
select pg_temp.ok((select not verificado and nota_media = 4.6 and descricao = 'Novo texto' from profissionais where id = auth.uid()), 'não se auto-verifica nem muda nota');
select pg_temp.erro($q$update profissionais set descricao = 'liga 86 98888-7777' where id = auth.uid()$q$, 'CONTATO_BLOQUEADO', 'bloqueia telefone na descrição');
select pg_temp.erro($q$update profissionais set cursos = array['meu insta @fulano'] where id = auth.uid()$q$, 'CONTATO_BLOQUEADO', 'bloqueia contato nos cursos');
select pg_temp.erro($q$insert into profissional_categorias values (auth.uid(), 'diarista')$q$, 'row-level security', 'não escolhe categoria "em breve"');
insert into profissional_categorias values (auth.uid(), 'pintor');
select pg_temp.erro($q$insert into portfolio_fotos (profissional_id, caminho) values (auth.uid(), 'a1111111-1111-4111-8111-111111111111/x.jpg')$q$, 'row-level security', 'não usa foto da pasta de outro');
select pg_temp.erro($q$insert into storage.objects (bucket_id, name) values ('publico', 'a1111111-1111-4111-8111-111111111111/x.jpg')$q$, 'row-level security', 'não envia arquivo na pasta de outro');
insert into storage.objects (bucket_id, name) values ('publico', auth.uid()::text || '/portfolio/x.jpg');
select pg_temp.ok(true, 'envia arquivo na própria pasta');
rollback;

-- 4) Visitante sem login
begin;
select pg_temp.como(null);
select pg_temp.ok((select count(*) from perfis) = 3, 'visitante vê só perfis de profissionais');
select pg_temp.ok((select count(*) from contatos_privados) = 0, 'visitante não vê contatos');
rollback;

-- 5) Novo usuário pelo Google (sem aceite ainda)
insert into auth.users (id, email, raw_user_meta_data) values ('b0000000-0000-4000-8000-000000000001', 'g@teste', '{"full_name":"Gil Google"}');
select pg_temp.ok((select nome = 'Gil Google' and tipo is null and aceitou_termos_em is null from perfis where id = 'b0000000-0000-4000-8000-000000000001'), 'perfil criado ao cadastrar (Google)');
begin;
select pg_temp.como('b0000000-0000-4000-8000-000000000001');
update perfis set tipo = 'profissional', aceitou_termos_em = '2000-01-01', versao_termos = '2026-11-v1' where id = auth.uid();
select pg_temp.ok((select aceitou_termos_em > now() - interval '1 minute' from perfis where id = auth.uid()), 'hora do aceite vem do servidor');
select pg_temp.ok(exists (select 1 from profissionais where id = auth.uid()), 'currículo criado ao virar profissional');
rollback;
select 'TODOS OS TESTES DA ETAPA 2 PASSARAM' as resultado;
