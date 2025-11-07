# EduPlanner

Plataforma de educação online com sistema de cursos, progresso de usuários e certificados.

## 🚀 Stack Tecnológica

- **Frontend/Backend:** Next.js 16 (App Router)
- **Banco de Dados:** PostgreSQL
- **Autenticação:** NextAuth.js
- **Storage:** MinIO (S3-compatible)
- **Containerização:** Docker & Docker Compose
- **Proxy Reverso:** NGINX

## 📋 Pré-requisitos

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (ou use Docker)

## ⚡ Início Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env.local` e configure:

```bash
cp env.example .env.local
```

**Importante:** Para produção, gere um `NEXTAUTH_SECRET` seguro:
```bash
openssl rand -base64 32
```

### 3. Iniciar Serviços (Docker)
```bash
docker compose up -d postgres minio minio-setup
```

### 4. Executar Migrations
```bash
# Migração automática (recomendado)
npm run migrate
```

### 5. Iniciar Aplicação
```bash
npm run dev
```

Acesse: http://localhost:3000

## 📚 Documentação

- **Quick Start:** Veja `QUICK_START.md` para instruções detalhadas de desenvolvimento local
- **Deploy:** Veja `DEPLOYMENT_STEPS.md` para instruções de deploy em VPS

## 🗄️ Migrations

O projeto inclui um sistema de migrações automáticas:

```bash
# Executar migrations pendentes
npm run migrate

# Via Docker
npm run migrate:docker
```

As migrations são executadas automaticamente e apenas migrations pendentes são aplicadas.

## 🐳 Docker

```bash
# Subir todos os serviços
docker compose up -d

# Ver logs
docker compose logs -f app

# Parar serviços
docker compose down
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Inicia servidor de produção
- `npm run migrate` - Executa migrations do banco
- `npm run lint` - Executa linter

## 🔧 Troubleshooting

Veja `QUICK_START.md` para soluções de problemas comuns.

## 📄 Licença

Este projeto é privado.
