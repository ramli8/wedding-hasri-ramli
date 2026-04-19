'use client'

import { useState } from 'react'
import {
    BookOpen, Rocket, Server, Monitor, Cloud,
    ChevronRight, FolderTree,
    FileCode, ExternalLink
} from 'lucide-react'
import CodeBlock from "@/src/presentation/components/ui/code"
import { ThemeToggle } from '../theme-toggle'


// ─── Section Components ──────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-2xl font-bold tracking-tight mt-12 mb-4 first:mt-0">{children}</h2>
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">{title}</h3>
            {children}
        </div>
    )
}

function FileTree({ items }: { items: { name: string; desc?: string; indent?: number }[] }) {
    return (
        <div className="rounded-lg border border-border/50 bg-card/30 overflow-hidden my-4">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-muted/20">
                <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium">Project Structure</span>
            </div>
            <div className="p-4 font-mono text-sm space-y-1">
                {items.map((item, i) => (
                    <div key={i} className="flex items-baseline gap-3" style={{ paddingLeft: `${(item.indent || 0) * 16}px` }}>
                        <span className="text-emerald-400/80">{item.name}</span>
                        {item.desc && <span className="text-muted-foreground/50 text-xs">{`// `}{item.desc}</span>}
                    </div>
                ))}
            </div>
        </div>
    )
}

function InfoBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 my-4 text-sm leading-relaxed">
            {children}
        </div>
    )
}

// ─── Tab Content ─────────────────────────────────────────
function GettingStartedContent() {
    return (
        <div>
            <SectionTitle>Getting Started</SectionTitle>
            <p className="text-muted-foreground leading-relaxed">
                GNS is a production-ready starter kit built with <strong>Go</strong> (backend) and <strong>Next.js</strong> (frontend).
                Follow these steps to get your development environment running.
            </p>

            <SubSection title="Prerequisites">
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span><strong>Go</strong> 1.21 or later</span></li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span><strong>Node.js</strong> 18+ (or <strong>Bun</strong> for faster installs)</span></li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span><strong>Docker</strong> & <strong>Docker Compose</strong></span></li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span><strong>PostgreSQL</strong> 16+ (or use Docker)</span></li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span><strong>Redis</strong> 7+ (or use Docker)</span></li>
                </ul>
            </SubSection>

            <SubSection title="1. Clone the Repository">
                <CodeBlock code="git clone https://github.com/yogameleniawan/gns.git
cd gns" />
            </SubSection>

            <SubSection title="2. Backend Setup">
                <CodeBlock code={`cd backend

# Copy environment files
cp .env.example .env
cp config/config.template.yaml config/config.development.yaml

# Install Go dependencies
go mod download

# Install migration tool
make init`} />
                <InfoBox>
                    <strong>💡 Using Docker?</strong> You can skip manual PostgreSQL/Redis setup and run{' '}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">make dev</code> to start everything with Docker Compose.
                </InfoBox>
            </SubSection>

            <SubSection title="3. Start the Backend">
                <p className="text-sm text-muted-foreground mb-3">Option A — With Docker (recommended):</p>
                <CodeBlock code="make dev" />
                <p className="text-sm text-muted-foreground mb-3">Option B — Run locally (requires local PostgreSQL & Redis):</p>
                <CodeBlock code="make run" />
                <p className="text-sm text-muted-foreground">
                    The backend runs on <code className="bg-muted px-1.5 py-0.5 rounded text-xs">http://localhost:8080</code>.
                    Migrations run automatically on startup.
                </p>
            </SubSection>

            <SubSection title="4. Frontend Setup">
                <CodeBlock code={`cd frontend

# Install dependencies
bun install   # or: npm install

# Start development server
bun dev       # or: npm run dev`} />
                <p className="text-sm text-muted-foreground">
                    The frontend runs on <code className="bg-muted px-1.5 py-0.5 rounded text-xs">http://localhost:3000</code>.
                </p>
            </SubSection>

            <SubSection title="5. Default Admin Account">
                <p className="text-sm text-muted-foreground mb-3">
                    After running the backend, a Super Admin account is seeded automatically:
                </p>
                <div className="rounded-lg border border-border/50 bg-card/30 p-4 font-mono text-sm space-y-1">
                    <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">admin@gns.com</span></div>
                    <div><span className="text-muted-foreground">Password:</span> <span className="text-foreground">admin123</span></div>
                </div>
            </SubSection>
        </div>
    )
}

function BackendContent() {
    return (
        <div>
            <SectionTitle>Backend Guide</SectionTitle>
            <p className="text-muted-foreground leading-relaxed">
                The backend is built with Go using the <strong>Chi router</strong>, <strong>uber/dig</strong> for dependency injection,
                and a clean modular architecture.
            </p>

            <SubSection title="Project Structure">
                <FileTree items={[
                    { name: 'cmd/api/', desc: 'Application entry point' },
                    { name: '  main.go', desc: 'Bootstrap, DI container, signal handling', indent: 1 },
                    { name: '  config.go', desc: 'Environment flag & config loading', indent: 1 },
                    { name: '  migration.go', desc: 'Database migration runner', indent: 1 },
                    { name: '  server.go', desc: 'Server start & graceful shutdown', indent: 1 },
                    { name: 'config/', desc: 'YAML config files per environment' },
                    { name: 'container/', desc: 'Dependency injection wiring (uber/dig)' },
                    { name: 'internal/', desc: 'Business logic modules' },
                    { name: '  auth/', desc: 'Authentication (login, register, JWT)', indent: 1 },
                    { name: '  rbac/', desc: 'Roles, permissions, module access', indent: 1 },
                    { name: 'migrations/', desc: 'SQL migration files' },
                    { name: 'pkg/', desc: 'Shared packages' },
                    { name: '  cache/', desc: 'Redis cache client', indent: 1 },
                    { name: '  config/', desc: 'Config parser', indent: 1 },
                    { name: '  database/', desc: 'PostgreSQL connection', indent: 1 },
                    { name: '  middleware/', desc: 'JWT, CORS, rate limiting, RBAC', indent: 1 },
                    { name: '  router/', desc: 'Centralized route definitions', indent: 1 },
                    { name: '  server/', desc: 'HTTP server wrapper', indent: 1 },
                    { name: '  token/', desc: 'JWT token utilities', indent: 1 },
                    { name: '  utils/', desc: 'Password hashing, helpers', indent: 1 },
                    { name: '  validator/', desc: 'Request validation', indent: 1 },
                ]} />
            </SubSection>

            <SubSection title="Adding a New Module">
                <p className="text-sm text-muted-foreground mb-4">
                    Each module follows a consistent 4-file pattern inside <code className="bg-muted px-1.5 py-0.5 rounded text-xs">internal/</code>:
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                    {[
                        { file: 'dto.go', desc: 'Request/response structs & validation tags' },
                        { file: 'repository.go', desc: 'Database queries (interface + implementation)' },
                        { file: 'service.go', desc: 'Business logic layer' },
                        { file: 'handler.go', desc: 'HTTP handlers (controllers)' },
                    ].map((f) => (
                        <div key={f.file} className="rounded-lg border border-border/40 bg-card/20 p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <FileCode className="h-4 w-4 text-emerald-500" />
                                <span className="font-mono text-sm font-medium">{f.file}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{f.desc}</p>
                        </div>
                    ))}
                </div>

                <p className="text-sm text-muted-foreground mt-4">After creating your module files, wire them in 2 places:</p>

                <p className="text-sm font-medium mt-4 mb-2">1. Register in container (<code className="bg-muted px-1.5 py-0.5 rounded text-xs">container/container.go</code>):</p>
                <CodeBlock lang="go" code={`// your_module
if err := container.Provide(yourmodule.NewRepository); err != nil {
    return nil, err
}
if err := container.Provide(yourmodule.NewService); err != nil {
    return nil, err
}
if err := container.Provide(yourmodule.NewHandler); err != nil {
    return nil, err
}`} />

                <p className="text-sm font-medium mt-4 mb-2">2. Add routes (<code className="bg-muted px-1.5 py-0.5 rounded text-xs">pkg/router/router.go</code>):</p>
                <CodeBlock lang="go" code={`r.Route("/your-module", func(r chi.Router) {
    r.Use(middleware.JWTAuthMiddleware)
    r.Get("/", yourHandler.List)
    r.Post("/", yourHandler.Create)
    r.Route("/{id}", func(r chi.Router) {
        r.Get("/", yourHandler.GetByID)
        r.Put("/", yourHandler.Update)
        r.Delete("/", yourHandler.Delete)
    })
})`} />
            </SubSection>

            <SubSection title="Makefile Commands">
                <div className="rounded-lg border border-border/50 overflow-hidden my-4">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/30 border-b border-border/50">
                            <tr>
                                <th className="text-left px-4 py-2.5 font-medium">Command</th>
                                <th className="text-left px-4 py-2.5 font-medium">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {[
                                ['make dev', 'Start dev environment with Docker Compose'],
                                ['make dev-down', 'Stop dev containers'],
                                ['make run', 'Run backend locally'],
                                ['make build', 'Build production binary'],
                                ['make create-migration name=X', 'Create new migration file'],
                                ['make migrate-up', 'Run pending migrations'],
                                ['make migrate-down', 'Rollback migrations'],
                                ['make migrate-force version=X', 'Force migration version'],
                                ['make db-shell', 'Access PostgreSQL shell'],
                            ].map(([cmd, desc]) => (
                                <tr key={cmd} className="hover:bg-muted/10">
                                    <td className="px-4 py-2 font-mono text-xs text-emerald-500">{cmd}</td>
                                    <td className="px-4 py-2 text-muted-foreground">{desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SubSection>

            <SubSection title="API Routes Reference">
                <p className="text-sm text-muted-foreground mb-3">All routes are prefixed with <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/v1</code>.</p>
                <div className="space-y-4">
                    {[
                        {
                            group: 'Authentication (Public)',
                            routes: [
                                ['POST', '/auth/register', 'Register new user'],
                                ['POST', '/auth/login', 'Login & get JWT tokens'],
                                ['POST', '/auth/oauth/google', 'Google OAuth login'],
                                ['POST', '/auth/refresh', 'Refresh access token'],
                            ],
                        },
                        {
                            group: 'Authentication (Protected)',
                            routes: [
                                ['POST', '/auth/logout', 'Logout current session'],
                                ['GET', '/auth/profile', 'Get current user profile'],
                                ['PUT', '/auth/profile', 'Update profile'],
                                ['POST', '/auth/change-password', 'Change password'],
                            ],
                        },
                        {
                            group: 'User Management (Admin)',
                            routes: [
                                ['GET', '/users', 'List all users'],
                                ['POST', '/users', 'Create user'],
                                ['GET', '/users/:id', 'Get user by ID'],
                                ['PUT', '/users/:id', 'Update user'],
                                ['DELETE', '/users/:id', 'Soft delete user'],
                                ['POST', '/users/:id/toggle-status', 'Enable/disable user'],
                                ['POST', '/users/:id/restore', 'Restore deleted user'],
                            ],
                        },
                        {
                            group: 'RBAC (Admin)',
                            routes: [
                                ['GET', '/rbac/roles', 'List all roles'],
                                ['POST', '/rbac/roles', 'Create role'],
                                ['PUT', '/rbac/roles/:id', 'Update role'],
                                ['DELETE', '/rbac/roles/:id', 'Delete role'],
                                ['POST', '/rbac/roles/:id/permissions', 'Assign permissions'],
                                ['GET', '/rbac/permissions', 'List all permissions'],
                                ['POST', '/rbac/permissions', 'Create permission'],
                            ],
                        },
                    ].map((section) => (
                        <div key={section.group}>
                            <h4 className="text-sm font-medium mb-2">{section.group}</h4>
                            <div className="rounded-lg border border-border/40 overflow-hidden">
                                <table className="w-full text-xs">
                                    <tbody className="divide-y divide-border/20">
                                        {section.routes.map(([method, path, desc]) => (
                                            <tr key={path + method} className="hover:bg-muted/10">
                                                <td className="px-3 py-1.5 w-16">
                                                    <span className={`font-mono font-bold ${method === 'GET' ? 'text-blue-400' :
                                                        method === 'POST' ? 'text-emerald-400' :
                                                            method === 'PUT' ? 'text-amber-400' :
                                                                'text-red-400'
                                                        }`}>
                                                        {method}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-1.5 font-mono text-foreground">{path}</td>
                                                <td className="px-3 py-1.5 text-muted-foreground">{desc}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </SubSection>

            <SubSection title="Environment Variables">
                <CodeBlock lang="env" code={`# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=gns_user
DB_PASSWORD=gns_password
DB_NAME=gns_db
DB_SSLMODE=disable

# Server
APP_PORT=8080

# JWT
JWT_SECRET=supersecretkey
JWT_REFRESH_SECRET=anothersecretkey
JWT_ACCESS_TOKEN_EXPIRATION=86400
JWT_REFRESH_TOKEN_EXPIRATION=86400

# Cache (Redis)
CACHE_HOST=redis
CACHE_PORT=6379

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000`} />
            </SubSection>
        </div>
    )
}

function FrontendContent() {
    return (
        <div>
            <SectionTitle>Frontend Guide</SectionTitle>
            <p className="text-muted-foreground leading-relaxed">
                The frontend is built with <strong>Next.js 16</strong>, <strong>shadcn/ui</strong>, <strong>Tailwind CSS v4</strong>,
                and follows a clean architecture pattern.
            </p>

            <SubSection title="Project Structure">
                <FileTree items={[
                    { name: 'app/', desc: 'Next.js App Router pages' },
                    { name: '  auth/', desc: 'Login & register pages', indent: 1 },
                    { name: '  home/', desc: 'Dashboard home', indent: 1 },
                    { name: '  admin/', desc: 'Admin pages (users, roles, permissions)', indent: 1 },
                    { name: '  settings/', desc: 'User settings pages', indent: 1 },
                    { name: '  docs/', desc: 'Documentation page', indent: 1 },
                    { name: 'src/', desc: 'Source code (clean architecture)' },
                    { name: '  domain/', desc: '' },
                    { name: '    types/', desc: 'TypeScript interfaces & types', indent: 1 },
                    { name: '    services/', desc: 'Domain services', indent: 1 },
                    { name: '  application/', desc: '' },
                    { name: '    hooks/', desc: 'React Query hooks (data fetching)', indent: 1 },
                    { name: '    store/', desc: 'State management (Zustand)', indent: 1 },
                    { name: '  infrastructure/', desc: '' },
                    { name: '    api/', desc: 'Axios API client', indent: 1 },
                    { name: '    stores/', desc: 'Persistent stores', indent: 1 },
                    { name: '  presentation/', desc: '' },
                    { name: '    components/', desc: 'UI components', indent: 1 },
                    { name: '      ui/', desc: 'shadcn/ui base components', indent: 2 },
                    { name: '      layout/', desc: 'Navbar, sidebar, etc.', indent: 2 },
                    { name: '      pages/', desc: 'Page-level components', indent: 2 },
                    { name: '  lib/', desc: 'Utility functions' },
                    { name: 'locales/', desc: 'i18n translations (en.json, id.json)' },
                    { name: 'public/', desc: 'Static assets' },
                ]} />
            </SubSection>

            <SubSection title="Adding a New Page">
                <p className="text-sm text-muted-foreground mb-3">Follow these steps to add a new page:</p>
                <div className="space-y-4 text-sm">
                    <div>
                        <p className="font-medium mb-2">1. Create the page component:</p>
                        <CodeBlock lang="tsx" code={`// src/presentation/components/pages/your-page.tsx
'use client'

export function YourPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Your Page</h1>
            {/* Your content */}
        </div>
    )
}`} />
                    </div>
                    <div>
                        <p className="font-medium mb-2">2. Create the route file:</p>
                        <CodeBlock lang="tsx" code={`// app/your-page/page.tsx
import { YourPage } from '@/src/presentation/components/pages/your-page'

export default function Page() {
    return <YourPage />
}`} />
                    </div>
                    <div>
                        <p className="font-medium mb-2">3. Add to sidebar (optional):</p>
                        <CodeBlock lang="tsx" code={`// In sidebar.tsx menuItems array:
{
    label: 'Your Page',
    href: '/your-page',
    icon: YourIcon,
}`} />
                    </div>
                </div>
            </SubSection>

            <SubSection title="Data Fetching with Hooks">
                <p className="text-sm text-muted-foreground mb-3">
                    Use TanStack Query hooks inside <code className="bg-muted px-1.5 py-0.5 rounded text-xs">src/application/hooks/</code>:
                </p>
                <CodeBlock lang="tsx" code={`// src/application/hooks/use-your-query.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'

export function useYourList() {
    return useQuery({
        queryKey: ['your-items'],
        queryFn: async () => {
            const { data } = await axios.get('/v1/your-items')
            return data
        },
    })
}

export function useCreateYourItem() {
    return useMutation({
        mutationFn: async (body: CreateYourItemBody) => {
            const { data } = await axios.post('/v1/your-items', body)
            return data
        },
    })
}`} />
            </SubSection>

            <SubSection title="Internationalization (i18n)">
                <p className="text-sm text-muted-foreground mb-3">
                    GNS uses <strong>next-intl</strong> with English and Indonesian translations.
                </p>
                <CodeBlock lang="json" code={`// locales/en.json
{
    "your_page": {
        "title": "Your Page Title",
        "description": "Your page description"
    }
}`} />
                <CodeBlock lang="tsx" code={`// In your component:
import { useTranslations } from 'next-intl'

export function YourPage() {
    const t = useTranslations('your_page')
    return <h1>{t('title')}</h1>
}`} />
            </SubSection>

            <SubSection title="Theming">
                <p className="text-sm text-muted-foreground">
                    GNS supports light and dark modes via <strong>next-themes</strong>. Use the standard shadcn/ui CSS variables
                    (<code className="bg-muted px-1.5 py-0.5 rounded text-xs">bg-background</code>,{' '}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">text-foreground</code>,{' '}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">bg-muted</code>, etc.) — they automatically adapt to the active theme.
                </p>
            </SubSection>
        </div>
    )
}

function DeploymentContent() {
    return (
        <div>
            <SectionTitle>Deployment</SectionTitle>
            <p className="text-muted-foreground leading-relaxed">
                GNS supports Docker-based deployment for both development and production environments.
            </p>

            <SubSection title="Development (Docker Compose)">
                <p className="text-sm text-muted-foreground mb-3">
                    The dev environment includes PostgreSQL 16, Redis 7, and hot-reload for the Go backend.
                </p>
                <CodeBlock code={`cd backend

# Start all services
make dev

# Stop services
make dev-down

# Clean restart (removes volumes)
make dev-clean`} />
                <p className="text-sm text-muted-foreground">
                    Services: <strong>PostgreSQL</strong> on :5432, <strong>Redis</strong> on :6379, <strong>Backend</strong> on :8080.
                </p>
            </SubSection>

            <SubSection title="Production Build">
                <p className="text-sm font-medium mb-2">Backend:</p>
                <CodeBlock code={`cd backend

# Build binary
make build

# Or use Docker
docker build -t gns-backend .

# Run with production config
./main -env=production`} />
                <p className="text-sm font-medium mt-4 mb-2">Frontend:</p>
                <CodeBlock code={`cd frontend

# Build for production
bun run build   # or: npm run build

# Start production server
bun start       # or: npm start`} />
            </SubSection>

            <SubSection title="Production Docker Compose">
                <CodeBlock lang="yaml" code={`# backend/docker-compose.yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: \${DB_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    env_file:
      - .env
    depends_on:
      - postgres
      - redis`} />
            </SubSection>

            <SubSection title="Environment Configuration">
                <p className="text-sm text-muted-foreground">
                    The backend uses YAML config files loaded per environment. The <code className="bg-muted px-1.5 py-0.5 rounded text-xs">-env</code> flag
                    determines which config is loaded:
                </p>
                <div className="rounded-lg border border-border/50 overflow-hidden my-4">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/30 border-b border-border/50">
                            <tr>
                                <th className="text-left px-4 py-2.5 font-medium">Flag</th>
                                <th className="text-left px-4 py-2.5 font-medium">Config File</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            <tr><td className="px-4 py-2 font-mono text-xs">-env=development</td><td className="px-4 py-2 text-muted-foreground">config.development.yaml</td></tr>
                            <tr><td className="px-4 py-2 font-mono text-xs">-env=staging</td><td className="px-4 py-2 text-muted-foreground">config.staging.yaml</td></tr>
                            <tr><td className="px-4 py-2 font-mono text-xs">-env=production</td><td className="px-4 py-2 text-muted-foreground">config.production.yaml</td></tr>
                        </tbody>
                    </table>
                </div>
                <InfoBox>
                    <strong>🔒 Security:</strong> In production mode, the config file is automatically deleted after the server starts
                    to prevent exposure if the container is compromised.
                </InfoBox>
            </SubSection>
        </div>
    )
}

// ─── Navigation Tabs ─────────────────────────────────────
const tabs = [
    { id: 'getting-started', label: 'Getting Started', icon: Rocket },
    { id: 'backend', label: 'Backend', icon: Server },
    { id: 'frontend', label: 'Frontend', icon: Monitor },
    { id: 'deployment', label: 'Deployment', icon: Cloud },
]

const tabContent: Record<string, React.FC> = {
    'getting-started': GettingStartedContent,
    'backend': BackendContent,
    'frontend': FrontendContent,
    'deployment': DeploymentContent,
}

// ─── Main DocsPage ───────────────────────────────────────
export function DocsPage() {
    const [activeTab, setActiveTab] = useState('getting-started')
    const ActiveContent = tabContent[activeTab]

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-6xl px-6 py-10">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <BookOpen className="h-4 w-4" />
                        <span>Documentation</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">GNS Documentation</h1>
                    <p className="text-muted-foreground text-lg">
                        Complete guide for using and extending the GNS base project.
                    </p>
                </div>

                {/* Layout */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <nav className="lg:w-56 shrink-0">
                        <div className="lg:sticky lg:top-24 space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive
                                            ? 'bg-emerald-500/10 text-emerald-500 font-medium'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                        {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
                                    </button>
                                )
                            })}

                            <div className="pt-4 mt-4 border-t border-border/50">
                                <a
                                    href="https://github.com/yogameleniawan/gns.git"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    GitHub Repository
                                </a>
                            </div>

                            <ThemeToggle />
                        </div>
                    </nav>

                    {/* Content */}
                    <main className="flex-1 min-w-0">
                        <div className="rounded-xl border border-border/50 bg-card/20 p-6 md:p-8">
                            <ActiveContent />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
