-- =====================================================================
-- ProntoJá · Dados de exemplo (para testes)
-- Rode DEPOIS da migração 001. Pode rodar mais de uma vez.
-- Senha de todas as contas de teste: ProntoJa@2026
-- ⚠️ Antes do lançamento, apague essas contas em Authentication > Users.
-- =====================================================================

do $seed$
declare
  senha text := extensions.crypt('ProntoJa@2026', extensions.gen_salt('bf'));
  contas jsonb := '[
    {"id":"a1111111-1111-4111-8111-111111111111","email":"carlos.frio@prontoja.teste","nome":"Carlos Andrade","tipo":"profissional","bairro":"Jóquei"},
    {"id":"a2222222-2222-4222-8222-222222222222","email":"marcos.clima@prontoja.teste","nome":"Marcos Silva","tipo":"profissional","bairro":"Dirceu Arcoverde"},
    {"id":"a3333333-3333-4333-8333-333333333333","email":"rafael.split@prontoja.teste","nome":"Rafael Sousa","tipo":"profissional","bairro":"Mocambinho"},
    {"id":"c1111111-1111-4111-8111-111111111111","email":"cliente@prontoja.teste","nome":"Ana Cliente","tipo":"cliente","bairro":"Fátima"}
  ]';
  c jsonb;
begin
  for c in select * from jsonb_array_elements(contas) loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', (c->>'id')::uuid, 'authenticated', 'authenticated',
            c->>'email', senha, now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('nome', c->>'nome', 'aceitou_termos_em', now()),
            now(), now(), '', '', '', '')
    on conflict (id) do nothing;

    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (c->>'id', (c->>'id')::uuid,
            jsonb_build_object('sub', c->>'id', 'email', c->>'email', 'email_verified', true),
            'email', now(), now(), now())
    on conflict (provider_id, provider) do nothing;

    update public.perfis
       set tipo = c->>'tipo', bairro = c->>'bairro',
           foto_url = case when c->>'tipo' = 'profissional' then '/exemplo/' || split_part(c->>'email', '@', 1) || '.svg' end
     where id = (c->>'id')::uuid;
  end loop;
end $seed$;

update public.profissionais set
  descricao = 'Técnico em refrigeração há 12 anos. Instalação, limpeza completa com bolsa coletora e recarga de gás. Atendo todas as zonas de Teresina, com garantia de 90 dias no serviço.',
  cursos = array['Técnico em Refrigeração e Climatização — SENAI-PI (2013)', 'NR-10 Segurança em Eletricidade', 'Certificação Inverter — Fabricante (2022)'],
  verificado = true, nota_media = 4.90, total_avaliacoes = 38, total_servicos = 52
where id = 'a1111111-1111-4111-8111-111111111111';

update public.profissionais set
  descricao = 'Especialista em split e janela. Faço higienização, troca de capacitor, conserto de placa e instalação com tubulação embutida. Pontual e caprichoso.',
  cursos = array['Refrigeração Residencial — SENAC (2018)', 'NR-35 Trabalho em Altura'],
  verificado = false, nota_media = 4.60, total_avaliacoes = 14, total_servicos = 19
where id = 'a2222222-2222-4222-8222-222222222222';

update public.profissionais set
  descricao = 'Começando no ProntoJá! Trabalho com limpeza e manutenção preventiva de ar-condicionado split de 9.000 a 24.000 BTUs.',
  cursos = array['Curso de Manutenção de Ar-condicionado Split — IFPI (2024)'],
  verificado = false, nota_media = 0, total_avaliacoes = 0, total_servicos = 0
where id = 'a3333333-3333-4333-8333-333333333333';

insert into public.profissional_categorias (profissional_id, categoria_slug) values
  ('a1111111-1111-4111-8111-111111111111', 'ar-condicionado'),
  ('a1111111-1111-4111-8111-111111111111', 'eletricista'),
  ('a2222222-2222-4222-8222-222222222222', 'ar-condicionado'),
  ('a3333333-3333-4333-8333-333333333333', 'ar-condicionado')
on conflict do nothing;

insert into public.portfolio_fotos (profissional_id, caminho, legenda)
select v.p::uuid, v.c, v.l from (values
  ('a1111111-1111-4111-8111-111111111111', '/exemplo/trabalho-instalacao.svg', 'Instalação de split 12.000 BTUs'),
  ('a1111111-1111-4111-8111-111111111111', '/exemplo/trabalho-limpeza.svg', 'Higienização completa'),
  ('a1111111-1111-4111-8111-111111111111', '/exemplo/trabalho-gas.svg', 'Recarga de gás R-410A'),
  ('a2222222-2222-4222-8222-222222222222', '/exemplo/trabalho-limpeza.svg', 'Limpeza com bolsa coletora'),
  ('a2222222-2222-4222-8222-222222222222', '/exemplo/trabalho-instalacao.svg', 'Instalação com tubulação embutida')
) as v(p, c, l)
where not exists (select 1 from public.portfolio_fotos f where f.profissional_id = v.p::uuid and f.caminho = v.c);
