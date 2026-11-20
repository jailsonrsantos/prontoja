# Etapa 2 — Cadastro de cliente e profissional

## 1. Atualizar o banco (Supabase)
1. Supabase → seu projeto → menu esquerdo **SQL Editor** → **New query**.
2. Abra no GitHub o arquivo `supabase/migrations/001_etapa2_perfis.sql`, clique em **Copy raw file** (ícone de copiar).
3. Cole no SQL Editor → **Run**. Deve aparecer "Success. No rows returned".
4. **New query** de novo → cole o arquivo `supabase/seed_exemplo.sql` → **Run** (cria as contas de teste).

## 2. Virar administrador (para marcar "verificado")
Supabase → **Table Editor** → tabela `perfis` → ache a linha com o seu nome → coluna `is_admin` → mude para **TRUE** → **Save**.

## 3. Marcar um profissional como verificado
Supabase → **Table Editor** → tabela `profissionais` → linha do profissional → coluna `verificado` → **TRUE** → **Save**.

## Contas de teste (senha de todas: ProntoJa@2026)
| E-mail | Tipo |
|---|---|
| carlos.frio@prontoja.teste | Profissional (verificado, nota 4,9) |
| marcos.clima@prontoja.teste | Profissional (nota 4,6) |
| rafael.split@prontoja.teste | Profissional (novo) |
| cliente@prontoja.teste | Cliente |
