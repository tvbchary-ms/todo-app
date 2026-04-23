# 📋 Todo DevSecOps Platform

Production-grade To-Do application with a complete DevSecOps lifecycle.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         pnpm Monorepo                               │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  @todo/       │  │  @todo/       │  │  @todo/shared            │  │
│  │  frontend     │──│  backend      │──│  Zod schemas + types     │  │
│  │  React 19     │  │  Express 4    │  │  (single source of truth)│  │
│  └──────────────┘  └──────┬───────┘  └──────────────────────────┘  │
│                           │                                         │
│  ┌────────────────────────┼────────────────────────────────────┐   │
│  │             Infrastructure (Docker Compose)                  │   │
│  │                         │                                    │   │
│  │  ┌──────────┐  ┌───────┴──────┐  ┌────────────────────┐    │   │
│  │  │PostgreSQL │  │  Prometheus  │  │  Grafana + Loki    │    │   │
│  │  │    16     │  │  + Alerting  │  │  Dashboards + Logs │    │   │
│  │  └──────────┘  └──────────────┘  └────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
.
├── .github/workflows/ci.yml       # CI/CD pipeline (build → test → scan → deploy)
├── packages/
│   ├── frontend/                   # React 19 app (placeholder)
│   ├── backend/                    # Express 4 API
│   │   ├── src/
│   │   │   ├── config/             # Zod-validated environment config
│   │   │   ├── db/                 # Drizzle ORM schema + connection
│   │   │   ├── lib/                # Logger (Pino) + Metrics (Prometheus)
│   │   │   ├── middleware/         # Auth, validation, error handling, logging
│   │   │   ├── routes/             # Auth, Todos, Health endpoints
│   │   │   ├── services/           # Business logic (auth, todo)
│   │   │   ├── app.ts              # Express app factory
│   │   │   └── index.ts            # Server entry + graceful shutdown
│   │   └── tests/                  # Vitest unit + integration tests
│   └── shared/                     # Zod schemas (end-to-end type safety)
├── infra/
│   ├── docker/                     # Docker Compose (dev + prod)
│   ├── monitoring/                 # Prometheus, Grafana, Loki configs
│   ├── backup/                     # pg_dump → S3 backup & restore scripts
│   └── security/                   # Trivy scanner config
├── Dockerfile                      # Multi-stage build (non-root)
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker + Docker Compose

### 1. Clone and Install

```bash
git clone <repo-url> && cd todo-devsecops
cp .env.example .env
pnpm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Prometheus, Grafana, Loki
docker compose -f infra/docker/docker-compose.yml up -d postgres prometheus grafana loki promtail
```

### 3. Build and Run

```bash
# Build shared schemas
pnpm --filter @todo/shared build

# Run database migrations
pnpm db:push

# Start backend in dev mode
pnpm dev
```

### 4. Or Run Everything via Docker

```bash
pnpm docker:dev   # Builds and starts all services
```

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login (returns JWT) |
| `POST` | `/api/auth/logout` | ✅ | Invalidate session |
| `GET` | `/api/auth/me` | ✅ | Get current user |
| `GET` | `/api/todos` | ✅ | List todos (paginated, filterable) |
| `POST` | `/api/todos` | ✅ | Create todo |
| `GET` | `/api/todos/:id` | ✅ | Get todo by ID |
| `PUT` | `/api/todos/:id` | ✅ | Update todo |
| `DELETE` | `/api/todos/:id` | ✅ | Delete todo |
| `GET` | `/health` | ❌ | Health check |
| `GET` | `/ready` | ❌ | Readiness probe |
| `GET` | `/metrics` | ❌ | Prometheus metrics |

### Authentication

Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Query Parameters (GET /api/todos)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `status` | enum | — | Filter: pending, in_progress, completed, cancelled |
| `priority` | enum | — | Filter: low, medium, high, urgent |
| `search` | string | — | Search in title |
| `sortBy` | string | createdAt | Sort field |
| `sortOrder` | asc/desc | desc | Sort direction |

## 🔐 Security

### Layers

1. **Input Validation**: All inputs validated by Zod schemas before reaching services
2. **Authentication**: JWT with DB-backed session validation
3. **Password Security**: bcrypt with 12 salt rounds
4. **HTTP Headers**: Helmet.js (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
5. **Rate Limiting**: 100 requests per 15-minute window per IP
6. **CORS**: Configurable origin whitelist
7. **Error Sanitization**: Internal errors never leak to clients
8. **Dependency Scanning**: Trivy SAST + SCA in CI
9. **Container Scanning**: Trivy image scan before deploy
10. **Zero-Trust Deploy**: OIDC auth, secrets from AWS SSM

### Security Scanning

```bash
# Run Trivy locally
trivy fs --config infra/security/trivy.yaml .

# Scan Docker image
docker build -t todo-app .
trivy image todo-app
```

## 🔄 CI/CD Pipeline

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  BUILD   │──▶│   TEST   │──▶│  SECURE  │──▶│ CONTAINER│──▶│  DEPLOY  │
│          │   │          │   │          │   │   SCAN   │   │          │
│ install  │   │ vitest   │   │ trivy fs │   │ trivy    │   │ OIDC +   │
│ typecheck│   │ coverage │   │ SAST+SCA │   │ image    │   │ SSM      │
│ build    │   │          │   │          │   │          │   │ compose  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

- **Triggers**: Push to main/develop, PRs to main
- **Security**: OIDC authentication (no static secrets)
- **Secrets**: Fetched from AWS SSM at deploy time
- **Fail Fast**: Pipeline fails on CRITICAL/HIGH vulnerabilities

## 📊 Monitoring

### Dashboards

Access Grafana at `http://localhost:3000` (admin/admin):

- **RED Metrics**: Request Rate, Error Rate, Duration (P50/P95/P99)
- **Infrastructure**: Memory, Event Loop Lag, Active Connections
- **Traffic Analysis**: Requests by status code, by route

### Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| HighRequestRate | >100 req/s for 5m | Warning |
| HighErrorRate | >5% errors for 5m | Critical |
| High5xxRate | >1% server errors for 2m | Critical |
| HighLatency | P95 >1s for 5m | Warning |
| VeryHighLatency | P99 >5s for 2m | Critical |
| HighMemoryUsage | >450MB for 5m | Warning |
| BackendDown | Target down for 1m | Critical |

### Log Querying

Loki is available at `http://localhost:3100`. Query via Grafana Explore:

```logql
{service="todo-backend"} |= "error"
{service="todo-backend"} | json | level="error"
{service="todo-backend"} | json | duration > 1000
```

## 💾 Backup & Recovery

### Automated Backups

```bash
# Manual backup
./infra/backup/backup.sh

# Setup cron (daily at 2 AM)
echo "0 2 * * * /path/to/infra/backup/backup.sh >> /var/log/todo-backup.log 2>&1" | crontab -
```

### Restore

```bash
# From local file
./infra/backup/restore.sh /tmp/todo-backups/todo_db_20240101_020000.sql.gz

# From S3
./infra/backup/restore.sh s3://my-bucket/backups/postgres/todo_db_20240101_020000.sql.gz
```

### Recovery Procedure

1. Stop the backend: `docker compose stop backend`
2. Run restore: `./infra/backup/restore.sh <backup-path>`
3. Push schema migrations: `pnpm db:push`
4. Restart backend: `docker compose start backend`
5. Verify health: `curl http://localhost:3001/health`

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm --filter @todo/backend test:watch

# With coverage
pnpm test:coverage
```

### Test Coverage Thresholds

| Metric | Threshold |
|--------|-----------|
| Lines | 70% |
| Functions | 70% |
| Branches | 60% |
| Statements | 70% |

## 🏭 Production Deployment

### Zero-Downtime Strategy

The production compose uses rolling updates:

```yaml
deploy:
  replicas: 2
  update_config:
    parallelism: 1
    delay: 30s
    order: start-first  # New container starts before old one stops
```

### Environment Variables

All secrets come from AWS SSM — **no static secrets in the repo**:

```bash
aws ssm put-parameter --name /todo/prod/database-url --type SecureString --value "postgresql://..."
aws ssm put-parameter --name /todo/prod/jwt-secret --type SecureString --value "..."
```

### OIDC Setup

Configure GitHub Actions OIDC in AWS IAM:

1. Create an OIDC identity provider for `token.actions.githubusercontent.com`
2. Create an IAM role with SSM read access
3. Set `AWS_ROLE_ARN` as a GitHub Actions variable

## 📝 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.6, Vite 7, Tailwind CSS 4, Radix UI |
| Backend | Express 4, TypeScript, Drizzle ORM |
| Database | PostgreSQL 16 |
| Validation | Zod (end-to-end) |
| Auth | JWT + bcrypt + DB sessions |
| Testing | Vitest + Supertest |
| CI/CD | GitHub Actions |
| Security | Trivy (SAST + SCA + Container) |
| Observability | Prometheus + Grafana + Loki + Pino |
| Containerization | Docker + Docker Compose |
| Package Manager | pnpm (workspace monorepo) |

## 📜 License

MIT
