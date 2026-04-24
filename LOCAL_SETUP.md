# Setup Guide: Todo App on Ubuntu (AWS)

---

## Prerequisites

Install Docker and Docker Compose on the Ubuntu instance:

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin

# Allow running docker without sudo (re-login after this)
sudo usermod -aG docker $USER
newgrp docker
```

Install Node.js 20 and pnpm (needed only for running migrations via drizzle-kit):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm@9.15.0
```

---

## 1. Copy files to the server

From your local machine:

```bash
scp -r /path/to/todo-app ubuntu@<your-aws-ip>:/home/ubuntu/todo-app
```

Or clone directly on the server:

```bash
git clone <your-repo-url> /home/ubuntu/todo-app
cd /home/ubuntu/todo-app
```

---

## 2. Install dependencies

```bash
cd /home/ubuntu/todo-app
pnpm install
```

---

## 3. Set the server IP for the frontend

> **Skip this and the frontend will show "Failed to fetch" on every login/register.**

Open `infra/docker/docker-compose.yml` and add the `VITE_API_URL` line to the frontend service:

```yaml
frontend:
  environment:
    VITE_API_URL: http://<your-aws-public-ip>:3001
```

Replace `<your-aws-public-ip>` with your actual server IP or domain (e.g. `http://54.123.45.67:3001`).

---

## 4. Start all containers

```bash
pnpm docker:dev
```

Wait until postgres is healthy before continuing:

```bash
docker ps   # todo-postgres should show (healthy)
```

---

## 5. Run the database migration

This creates all tables. Must be done once on a fresh database.

```bash
docker exec -i todo-postgres psql -U todo_user -d todo_db \
  < packages/backend/src/db/migrations/0000_dapper_chimera.sql
```

Verify tables were created:

```bash
docker exec todo-postgres psql -U todo_user -d todo_db -c "\dt"
# Should list: audit_logs, sessions, todos, users
```

---

## 6. Access the app

| Service  | URL |
|----------|-----|
| Frontend | `http://<your-aws-ip>:5173` |
| Backend API | `http://<your-aws-ip>:3001` |
| Grafana  | `http://<your-aws-ip>:3000` |

Default admin login (auto-created by the backend on first start):

| Email | Password |
|-------|----------|
| `admin@admin.local` | `admin` |

---

## Useful commands

```bash
# Stop everything (keeps data)
docker compose -f infra/docker/docker-compose.yml down

# Stop and wipe all data (full reset)
pnpm docker:down

# View backend logs
docker logs todo-backend -f

# Open database shell
docker exec -it todo-postgres psql -U todo_user -d todo_db

# Run migration via drizzle-kit (alternative to step 5)
export DATABASE_URL="postgresql://todo_user:todo_password@localhost:5432/todo_db"
pnpm db:migrate
```

---

## Local development (macOS / Linux desktop)

If running on your own machine instead of a server, skip steps 1 and 3.

Start only the database container, then run backend and frontend separately with hot-reload:

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres

# Terminal 1 — backend (http://localhost:3001)
pnpm dev

# Terminal 2 — frontend (http://localhost:5173)
pnpm --filter @todo/frontend dev
```

Run migration after starting postgres:

```bash
export DATABASE_URL="postgresql://todo_user:todo_password@localhost:5432/todo_db"
pnpm db:migrate
```
