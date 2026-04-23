# Local Setup Guide: DevSecOps To-Do App

This guide will walk you through the steps to run the complete DevSecOps To-Do application (Backend, Database, and Frontend) on your local machine.

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v20.0.0 or higher)
- **pnpm** (v9.0.0 or higher)
- **Docker** & **Docker Compose**

## 1. Installation

Install all monorepo dependencies from the project root:

```bash
pnpm install
```

## 2. Environment Configuration

The backend requires environment variables to connect to the database and manage authentication. 

Copy the provided example environment file to `.env`:
```bash
cp .env.example .env
```

If you keep the defaults in `.env`, the system will automatically configure itself to use a local PostgreSQL database with the credentials `todo_user`:`todo_password` on port `5432`.

## 3. Database Setup

You can easily spin up the required PostgreSQL database using the provided Docker Compose file:

```bash
# Start the database in the background
docker compose -f infra/docker/docker-compose.yml up -d postgres
```

> **Note:** Once the database container is running, make sure your database schema is up to date:
> ```bash
> pnpm db:generate
> pnpm db:migrate
> ```

## 4. Running the Application Locally (Development Mode)

For the best developer experience with hot-reloading, run the backend and frontend separately.

### Start the Backend
In your terminal, from the project root, run:
```bash
pnpm dev
```
*The backend API server will start at `http://localhost:3001`.*

### Start the Frontend
In a **separate** terminal window, run:
```bash
pnpm --filter @todo/frontend dev
```
*The React web application will start at `http://localhost:5173`.*

---

## Alternative: Run Everything via Docker

If you prefer to run the entire stack (Database, Backend API, and the Observability stack including Prometheus/Grafana) simultaneously via Docker:

```bash
pnpm docker:dev
```

To gracefully shut down the Docker environment and clean up database volumes:
```bash
pnpm docker:down
```

## 5. Helpful Commands

Here are some other useful commands you can run from the root of the project:

- **`pnpm test`**: Run all unit and integration tests across the monorepo.
- **`pnpm typecheck`**: Run TypeScript type checking to catch errors early.
- **`pnpm build`**: Build all workspace packages for production.
- **`pnpm db:studio`**: Open Drizzle Studio in your browser to inspect and interact with your database tables graphically.
