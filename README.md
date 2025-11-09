# EduPlanner

Plataforma de educação online com sistema de cursos, progresso de usuários e certificados.

![EduPlanner Demo](videos/edupplaner.gif)

## Stack Tecnológica

- **Frontend/Backend:** Next.js 16 (App Router)
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma
- **Autenticação:** NextAuth.js
- **Pagamentos:** Stripe (Checkout + Webhooks)
- **Storage:** MinIO (S3-compatible)
- **Containerização:** Docker & Docker Compose
- **Proxy Reverso:** NGINX

## Arquitetura

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ HTTP Requests
     ▼
┌─────────────────────────────────────┐
│   Next.js (App Router)             │
│   - Server Actions                 │
│   - API Routes                     │
│   - React Components               │
└────┬───────────────────┬────────────┘
     │                   │
     │ Prisma ORM        │ Stripe API
     │                   │ (Checkout)
     ▼                   ▼
┌─────────────┐    ┌──────────────┐
│ PostgreSQL  │    │   Stripe     │
│   Database  │    │   (Payment)  │
└─────────────┘    └──────┬───────┘
                          │
                          │ Webhook Events
                          │ (checkout.session.completed,
                          │  customer.subscription.updated, etc.)
                          ▼
                   ┌─────────────────────┐
                   │ Next.js API Route   │
                   │ /api/stripe/webhook │
                   └──────┬──────────────┘
                          │
                          │ Prisma ORM
                          │ (Update DB)
                          ▼
                   ┌─────────────┐
                   │ PostgreSQL  │
                   │   Database  │
                   └─────────────┘
```

### Fluxo de Pagamento (Stripe)

1. **Checkout:** User → Next.js → Stripe Checkout → User (redirecionamento)
2. **Webhook:** Stripe → Next.js API Route → Prisma ORM → PostgreSQL (atualização de assinatura)

O webhook do Stripe é essencial para manter a sincronização entre o estado de pagamento no Stripe e o banco de dados local, garantindo que assinaturas, cancelamentos e renovações sejam refletidos corretamente na aplicação.

## Como Executar

### 1. Criar arquivo `.env`

Copie o arquivo `env.example` para `.env` e configure as chaves do Stripe e Prisma:

```bash
cp env.example .env
```

**Variáveis obrigatórias:**
- `DATABASE_URL` - URL de conexão do PostgreSQL
- `AUTH_SECRET` ou `NEXTAUTH_SECRET` - Secret para NextAuth (gere com `openssl rand -base64 32`)
- `STRIPE_SECRET_KEY` - Chave secreta do Stripe
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Chave pública do Stripe
- `STRIPE_WEBHOOK_SECRET` - Secret do webhook do Stripe

### 2. Subir com Docker Compose

```bash
docker compose up -d
```

Isso sobe todos os serviços:
- PostgreSQL (banco de dados)
- MinIO (storage S3-compatible)
- Next.js App (aplicação)

### 3. Executar Migrations

```bash
docker compose exec app npm run migrate
```

Pronto! Acesse: http://localhost:3000

## Comandos Docker Úteis

```bash
# Ver logs da aplicação
docker compose logs -f app

# Parar todos os serviços
docker compose down

# Rebuild da aplicação
docker compose up -d --build app
```

## Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento (fora do Docker)
- `npm run build` - Build de produção
- `npm run start` - Inicia servidor de produção
- `npm run migrate` - Executa migrations do banco
- `npm run lint` - Executa linter

## Licença

Este projeto é privado.
