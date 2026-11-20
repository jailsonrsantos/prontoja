# Etapa 3 — Pedidos com fotos + mapa por proximidade

## 1. Atualizar o banco (Supabase > SQL Editor > New query)
1. Cole e rode `supabase/migrations/002_etapa3_pedidos_mapa.sql` → "Success".
2. Rode de novo `supabase/seed_exemplo.sql` (agora ele também cria 4 pedidos de exemplo).

> Se você ainda não rodou a 001, rode na ordem: 001 → 002 → seed.

## Privacidade do mapa
- Ninguém vê ponto exato: só áreas de ~1 km e distâncias arredondadas.
- A localização salva já fica arredondada no banco.
- Endereço completo do pedido: só o cliente vê (até o pagamento, na etapa do Asaas).
