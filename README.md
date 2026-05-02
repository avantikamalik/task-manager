# Team Task Manager

A full-stack web app for teams to plan projects, assign tasks, and track progress.
Authenticated users can create projects, invite teammates, assign work, and watch
status move from To Do to In Progress to Done. Admins get a separate members area
inside each project.

## Stack

| Layer    | Tech                                                          |
| -------- | ------------------------------------------------------------- |
| Frontend | React 18, Vite, React Router, TanStack Query, React Hook Form |
| Styling  | Tailwind CSS, shadcn-style primitives, Lucide icons           |
| Backend  | Node.js, Express, Knex query builder, Zod validation          |
| Database | MySQL 8                                                       |
| Auth     | JWT + bcryptjs                                                |
| Deploy   | Railway (Nixpacks)                                            |

## Project layout

```
.
+-- client/                    React + Vite SPA
|   +-- src/
|   |   +-- components/        UI primitives + layout
|   |   +-- context/           AuthProvider
|   |   +-- lib/               api client, helpers
|   |   +-- pages/             Route pages
|   |   +-- App.jsx            Router
|   |   \-- main.jsx           Entry point
|   \-- vite.config.js
+-- server/                    Express + Knex API
|   +-- migrations/            SQL schema migrations
|   +-- seeds/                 Demo data + admin user
|   +-- src/
|   |   +-- config/            env, db connection
|   |   +-- controllers/       auth, projects, tasks, users
|   |   +-- middleware/        auth, RBAC, validation, errors
|   |   +-- routes/            Express routers
|   |   +-- utils/             http errors, async-handler, jwt
|   |   \-- app.js             Express app factory
|   +-- knexfile.js
|   \-- server.js              Entry point
+-- .env.example               Copy to .env and fill in
+-- nixpacks.toml              Railway build config
+-- railway.json               Railway deployment config
\-- package.json               Workspace scripts
```

## Quick start (local)

### Prerequisites

* Node.js 18 or newer
* A running MySQL 8.x instance (local or hosted)

### 1. Install

```bash
git clone <your-repo-url> team-task-manager
cd team-task-manager
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set, at minimum:

```
DATABASE_URL=mysql://user:password@host:3306/team_task_manager
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
```

You can use either `DATABASE_URL` or the individual `DB_*` variables; the app
prefers `DATABASE_URL` when both are present. Aiven and PlanetScale require
SSL, so leave `DB_SSL=true` (also auto-detected from the URL).

### 3. Migrate and seed

```bash
npm run migrate
npm run seed
```

The seed creates one admin and two members:

| Role   | Email                          | Password       |
| ------ | ------------------------------ | -------------- |
| Admin  | `admin@example.com`        | `Admin@12345`  |
| Member | `alice@example.com`        | `Member@12345` |
| Member | `bob@example.com`          | `Member@12345` |

### 4. Run

```bash
# Runs API on :4000 and the React app on :5173 together
npm run dev
```

Then open http://localhost:5173 and sign in.

## Deploying to Railway

This repo deploys as a single service: Express serves the built React app from
the same origin as the API.

### Step 1. Create the database

1. In Railway, click **New > Database > MySQL**.
2. Railway provisions an instance and exposes a `MYSQL_URL` variable.

### Step 2. Deploy the app

1. **New > Deploy from GitHub repo** and pick this repo.
2. Railway detects `nixpacks.toml` / `railway.json` and runs the build.
3. Open the service's **Variables** tab and add:

   ```
   NODE_ENV=production
   JWT_SECRET=<long random string>
   JWT_EXPIRES_IN=7d
   BCRYPT_SALT_ROUNDS=10
   DATABASE_URL=${{ MySQL.MYSQL_URL }}
   SEED_ADMIN_NAME=Your Name
   SEED_ADMIN_EMAIL=you@example.com
   SEED_ADMIN_PASSWORD=<a strong password>
   ```

   Use Railway's variable references to inject `MYSQL_URL` from the database
   service.

4. Railway runs `npm run migrate` automatically on startup (configured in
   `railway.json`).
5. (Optional, one-time) Run the seed via Railway's shell:

   ```bash
   npm --prefix server run seed
   ```

6. Open the generated public URL.

## API reference

All endpoints are prefixed with `/api`. Authenticated endpoints require an
`Authorization: Bearer <token>` header.

### Auth

| Method | Path           | Body / Notes                |
| ------ | -------------- | --------------------------- |
| POST   | `/auth/signup` | `{ name, email, password }` |
| POST   | `/auth/login`  | `{ email, password }`       |
| GET    | `/auth/me`     | Returns the current user    |

### Users

| Method | Path                | Notes                   |
| ------ | ------------------- | ----------------------- |
| GET    | `/users?q=<search>` | Search by name or email |

### Projects

| Method | Path                              | Role          |
| ------ | --------------------------------- | ------------- |
| GET    | `/projects`                       | Auth          |
| POST   | `/projects`                       | Auth          |
| GET    | `/projects/:id`                   | Member        |
| PATCH  | `/projects/:id`                   | Project admin |
| DELETE | `/projects/:id`                   | Project admin |
| GET    | `/projects/:id/members`           | Member        |
| POST   | `/projects/:id/members`           | Project admin |
| PATCH  | `/projects/:id/members/:userId`   | Project admin |
| DELETE | `/projects/:id/members/:userId`   | Project admin |

### Tasks

| Method | Path                          | Role                                                            |
| ------ | ----------------------------- | --------------------------------------------------------------- |
| GET    | `/projects/:projectId/tasks`  | Member                                                          |
| POST   | `/projects/:projectId/tasks`  | Member                                                          |
| GET    | `/tasks/:taskId`              | Member                                                          |
| PATCH  | `/tasks/:taskId`              | Members can update status; admin/creator can update everything  |
| DELETE | `/tasks/:taskId`              | Project admin or task creator                                   |

### Dashboard

| Method | Path         | Notes                                       |
| ------ | ------------ | ------------------------------------------- |
| GET    | `/dashboard` | Aggregated stats + my open / overdue tasks  |

## Security

* Passwords hashed with bcryptjs (configurable salt rounds).
* JWT secret enforced at startup; warns if too short.
* Helmet for HTTP security headers.
* express-rate-limit on `/api/auth/*` to slow down brute-force.
* All input validated with Zod schemas.
* Parameterized queries via Knex (no SQL injection).
* CORS configured per environment.
* Generic error messages to clients; full stack traces only logged on the server.

## Useful scripts

| Command                                      | What it does                                  |
| -------------------------------------------- | --------------------------------------------- |
| `npm run install:all`                        | Install root, server, and client dependencies |
| `npm run dev`                                | Run server + client together (hot reload)     |
| `npm run dev:server`                         | Run only the API on `:4000`                   |
| `npm run dev:client`                         | Run only the React app on `:5173`             |
| `npm run build`                              | Production build                              |
| `npm run migrate`                            | Apply pending migrations                      |
| `npm --prefix server run migrate:rollback`   | Roll back the last migration                  |
| `npm run seed`                               | Seed demo data + admin user                   |
| `npm start`                                  | Start the production server                   |

## Database schema

```
users
+-- id (PK)
+-- name, email (unique), password_hash
+-- global_role  (admin | member)
\-- created_at, updated_at

projects
+-- id (PK)
+-- name, description
+-- owner_id  -> users.id  (CASCADE)
\-- created_at, updated_at

project_members           (join table, unique on project_id + user_id)
+-- id (PK)
+-- project_id  -> projects.id  (CASCADE)
+-- user_id     -> users.id     (CASCADE)
+-- role  (admin | member)
\-- joined_at

tasks
+-- id (PK)
+-- project_id  -> projects.id  (CASCADE)
+-- title, description
+-- status      (todo | in_progress | done)
+-- priority    (low | medium | high)
+-- due_date
+-- assignee_id -> users.id    (SET NULL)
+-- created_by  -> users.id    (CASCADE)
\-- created_at, updated_at
```

## License

MIT
