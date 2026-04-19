# GNS Backend

Go backend service with Chi router, uber/dig dependency injection, JWT authentication, and RBAC.

## Requirements

- Go 1.21+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional)

## Setup

```bash
# Copy config files
cp .env.example .env
cp config/config.template.yaml config/config.development.yaml

# Install dependencies
go mod download
make init
```

## Running

### Docker (Recommended)

```bash
make dev          # Start PostgreSQL + Redis + Backend
make dev-down     # Stop containers
make dev-clean    # Clean restart with fresh volumes
```

### Local

Requires local PostgreSQL and Redis instances configured in `.env`.

```bash
make run          # Run with development config
make build        # Build production binary
```

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make init` | Install migration tool |
| `make dev` | Start dev Docker environment |
| `make dev-down` | Stop dev containers |
| `make dev-clean` | Clean restart (removes volumes) |
| `make run` | Run locally |
| `make build` | Build production binary |
| `make create-migration name=X` | Create new migration file |
| `make migrate-up` | Run pending migrations |
| `make migrate-down` | Rollback last migration |
| `make migrate-force version=X` | Force migration version |
| `make db-shell` | Access PostgreSQL shell |

## Project Structure

```
backend/
├── cmd/api/              # Entry point
│   ├── main.go           # Bootstrap & DI container
│   ├── config.go         # Environment flag & config loading
│   ├── migration.go      # Database migration runner
│   └── server.go         # Server start & graceful shutdown
├── config/               # YAML config per environment
├── container/            # uber/dig DI wiring
├── internal/             # Business modules
│   ├── auth/             # Authentication module
│   │   ├── dto.go        # Request/response types
│   │   ├── handler.go    # HTTP handlers
│   │   ├── repository.go # Database queries
│   │   └── service.go    # Business logic
│   ├── rbac/             # RBAC module (same pattern)
│   └── shared/           # Shared domain types
├── migrations/           # SQL migration files
│   └── seeders/          # Data seeder scripts
├── pkg/                  # Shared packages
│   ├── cache/            # Redis client
│   ├── config/           # Config parser
│   ├── database/         # PostgreSQL connection
│   ├── middleware/        # JWT, CORS, rate limiting, role guard
│   ├── response/         # Standard JSON response
│   ├── router/           # Centralized route setup
│   ├── server/           # HTTP server wrapper
│   ├── token/            # JWT token utilities
│   ├── utils/            # Password hashing, helpers
│   └── validator/        # Request validation
└── tests/                # Test files
```

## Adding a New Module

1. Create `internal/your_module/` with 4 files:
   - `dto.go` — Request/response structs
   - `repository.go` — Database layer
   - `service.go` — Business logic
   - `handler.go` — HTTP handlers

2. Wire in `container/container.go`:
   ```go
   container.Provide(yourmodule.NewRepository)
   container.Provide(yourmodule.NewService)
   container.Provide(yourmodule.NewHandler)
   ```

3. Add routes in `pkg/router/router.go`:
   ```go
   r.Route("/your-module", func(r chi.Router) {
       r.Use(middleware.JWTAuthMiddleware)
       r.Get("/", yourHandler.List)
       r.Post("/", yourHandler.Create)
   })
   ```

## API Routes

All routes prefixed with `/v1`.

### Auth (Public)
- `POST /auth/register` — Register
- `POST /auth/login` — Login
- `POST /auth/oauth/google` — Google OAuth
- `POST /auth/refresh` — Refresh token

### Auth (Protected)
- `POST /auth/logout` — Logout
- `GET /auth/profile` — Get profile
- `PUT /auth/profile` — Update profile
- `POST /auth/change-password` — Change password

### Users (Admin)
- `GET /users` — List users
- `POST /users` — Create user
- `GET /users/:id` — Get user
- `PUT /users/:id` — Update user
- `DELETE /users/:id` — Delete user
- `POST /users/:id/toggle-status` — Toggle active
- `POST /users/:id/restore` — Restore deleted

### RBAC (Admin)
- `GET /rbac/roles` — List roles
- `POST /rbac/roles` — Create role
- `PUT /rbac/roles/:id` — Update role
- `DELETE /rbac/roles/:id` — Delete role
- `POST /rbac/roles/:id/permissions` — Assign permissions
- `GET /rbac/permissions` — List permissions
- `POST /rbac/permissions` — Create permission
- `POST /rbac/users/:userId/roles` — Assign roles to user

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | postgres | Database host |
| `DB_PORT` | 5432 | Database port |
| `DB_NAME` | gns_db | Database name |
| `APP_PORT` | 8080 | Server port |
| `JWT_SECRET` | — | JWT signing secret |
| `CACHE_HOST` | redis | Redis host |
| `CORS_ALLOWED_ORIGINS` | localhost:3000 | Allowed CORS origins |
