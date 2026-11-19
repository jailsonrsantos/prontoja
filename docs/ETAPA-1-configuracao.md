# Etapa 1 — Configuração (passo a passo)

## A. GitHub (guardar o código)
1. github.com → botão verde **New** (ou "+" → New repository).
2. Repository name: `prontoja`. Marque **Private**. NÃO marque "Add a README".
3. **Create repository**.

## B. Supabase (login e banco de dados)
1. supabase.com/dashboard → **New project**.
2. Name: `prontoja` · Database password: clique **Generate a password** e GUARDE num lugar seguro · Region: **South America (São Paulo)** → **Create new project** (leva ~2 min).
3. Menu lateral → **Project Settings** (engrenagem) → **API** / **Data API**: copie
   - **Project URL** → vai em `NEXT_PUBLIC_SUPABASE_URL`
   - Chave **anon / public** (ou "publishable") → vai em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ⚠️ NUNCA use nem compartilhe a chave **service_role / secret**.

## C. Vercel (colocar o app no ar)
1. vercel.com → **Add New… → Project** → escolha o repositório `prontoja` → **Import**.
2. Abra **Environment Variables** e adicione as duas variáveis do passo B.3.
3. **Deploy**. Ao terminar, copie o endereço (ex.: `https://prontoja-xyz.vercel.app`).

## D. Avisar o Supabase sobre o endereço do app
Supabase → **Authentication → URL Configuration**:
- **Site URL**: o endereço da Vercel.
- **Redirect URLs → Add URL**: `https://SEU-ENDERECO.vercel.app/**` e `http://localhost:3000/**`.

## E. Login com Google
1. console.cloud.google.com → no topo, **Select a project → New project** → nome `ProntoJa` → Create.
2. Menu → **APIs & Services → OAuth consent screen** (ou "Google Auth Platform") → **Get started**:
   App name `ProntoJá`, e-mail de suporte = o seu, Audience **External**, contato = seu e-mail → Create.
3. **Clients → Create client** → Application type **Web application** → Name `ProntoJá Web`.
   - **Authorized redirect URIs → Add URI**: cole o valor "Callback URL" que aparece no Supabase em
     **Authentication → Sign In / Providers → Google** (algo como `https://XXXX.supabase.co/auth/v1/callback`).
   - **Create** → copie **Client ID** e **Client secret**.
4. Supabase → **Authentication → Sign In / Providers → Google** → ative **Enable**, cole Client ID e Client secret → **Save**.
5. Enquanto o app estiver em "Testing" no Google, adicione seu e-mail em **Audience → Test users**.

## Observação sobre e-mails
O Supabase gratuito envia poucos e-mails de confirmação por hora (só para teste). Antes do lançamento,
configuraremos um serviço de e-mail próprio (ex.: Resend) em Authentication → Emails → SMTP.
