# CLAUDE.md — Bandarin App

## Project Overview

Bandarin App is a Next.js SaaS web application for Indonesian business legalization services (OSS/licensing). It handles business registration services including PT, CV, NIB, HAKI, Virtual Office, Tax Consulting, and Trademark Registration. All UI text is in **Bahasa Indonesia**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Radix UI primitives, shadcn/ui, Tailwind CSS 4 |
| Icons | Lucide React |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod validation |
| Database | Supabase (PostgreSQL) via `@supabase/supabase-js` + `@supabase/ssr` |
| Auth | Supabase email/password with cookie-based sessions |
| Notifications | Sonner (toasts), real-time via Supabase listeners |
| Theme | next-themes + custom ThemeProvider (light/dark/auto with sun-calc) |
| Drag & Drop | @hello-pangea/dnd |

## Commands

```bash
npm run dev       # Start development server (Next.js)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint (next lint)
```

There are **no tests** configured. No Jest, Vitest, or other test runners are set up.

## Directory Structure

```
app/                        # Next.js App Router pages and layouts
├── layout.tsx              # Root layout (ThemeProvider, Toaster, lang="id")
├── page.tsx                # Landing page with auth popup modal
├── globals.css             # Global Tailwind CSS + custom theme variables
├── admin/                  # Admin-only routes (role-based protection)
│   ├── layout.tsx          # Admin layout with sidebar nav
│   ├── page.tsx            # Admin dashboard (stats, filtering)
│   └── services/           # Service CRUD, orders, field config
├── dashboard/              # Client dashboard (protected)
│   ├── profile/            # User profile settings
│   └── applications/       # Application management (new, [id])
└── user/                   # Alternative user routes (aliased dashboard)

components/                 # Reusable React components
├── ui/                     # Base UI (shadcn/Radix): button, card, dialog, etc.
├── auth/                   # Auth form (login/register toggle)
├── dashboard/              # Notification bell, chat box
├── admin/                  # Admin navigation
├── shared/                 # Submit button with loading state
└── providers/              # ThemeProvider context

actions/                    # Server Actions ('use server')
├── auth/                   # Login/signup with Supabase
├── admin/                  # Service, product, order CRUD
├── update-status/          # Order/chat status mutations
├── product.ts
└── order.ts

lib/                        # Utilities and schemas
├── applicationSchema/      # Zod schemas + cn() utility
└── validators/             # Auth, product, order validation schemas

types/                      # TypeScript type definitions (auth, product, applications)

utils/                      # Helper functions
├── sun-calc.ts             # Sunrise/sunset for auto theme
└── supabase/               # Supabase client factories
    ├── server.ts           # Server-side client (cookies)
    ├── client.ts           # Browser-side client
    └── middleware.ts       # Auth middleware
```

## Architecture Patterns

### Server vs Client Components
- **Server Components** (default): Used for data fetching, layouts, and pages that read from Supabase.
- **Client Components** (`"use client"`): Used for forms, interactive UI, state management, real-time listeners.
- Layouts are Server Components; forms and interactive widgets are Client Components.

### Server Actions
All data mutations go through Server Actions in `actions/`. These are `'use server'` functions that:
1. Validate input with Zod schemas
2. Create a server-side Supabase client
3. Perform the database operation
4. Return result or redirect

### Authentication & Authorization
- Supabase email/password auth with cookie-based sessions via `@supabase/ssr`.
- User profiles stored in a `profiles` table with a `role` field (`admin` | `user`).
- Admin routes check role in layout and block unauthorized access.
- Registration collects: email, password, phone, full_name, handedness preference.

### Form Pattern
```
React Hook Form (client) → Zod schema validation → Server Action → Supabase
```
- Schemas in `lib/validators/` or `lib/applicationSchema/`
- `@hookform/resolvers` bridges Zod with React Hook Form

### Application Status Flow
`pending` → `quoted` → `process` → `review` → `completed` (or `cancelled`)

## Code Conventions

### Naming
- **Components**: PascalCase (`AuthForm`, `NotificationBell`)
- **Files**: kebab-case (`auth-form.tsx`, `sun-calc.ts`)
- **Types/Interfaces**: PascalCase (`ApplicationStatus`, `ThemeContextType`)
- **Zod schemas**: camelCase (`loginSchema`, `applicationSchema`)
- **Server Actions**: camelCase functions in kebab-case files

### Import Alias
`@/*` maps to the project root (configured in `tsconfig.json`).

```tsx
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
```

### Styling
- Tailwind CSS 4 with custom color palette (tuscan-sun, deep-space-blue, cool-steel, amber-honey, vanilla-cream).
- Dark mode via CSS class strategy.
- `cn()` utility from `lib/applicationSchema/utils.ts` merges classes with `clsx` + `tailwind-merge`.
- Mobile-first responsive design using Tailwind breakpoints (`md:`, `lg:`).
- Radix UI provides accessible keyboard navigation and ARIA attributes.

### UI Components
shadcn/ui components live in `components/ui/`. To add new ones:
```bash
npx shadcn@latest add <component-name>
```
Configuration is in `components.json` (base color: slate, icon library: lucide).

## Environment Variables

Required (not committed — in `.gitignore`):
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

## Key Considerations for AI Assistants

1. **Language**: All user-facing text must be in Bahasa Indonesia. Variable/function names stay in English.
2. **No tests exist**: If adding features, consider suggesting test additions but don't assume any test infrastructure.
3. **No CI/CD**: No GitHub Actions or deployment pipelines are configured.
4. **No Prettier**: Only ESLint is configured for linting. No auto-formatting tool.
5. **Supabase dual clients**: Always use `createClient` from `utils/supabase/server.ts` in Server Components/Actions and from `utils/supabase/client.ts` in Client Components.
6. **Strict TypeScript**: The project uses strict mode — all code must be properly typed.
7. **Duplicate routes**: Both `/dashboard` and `/user/dashboard` exist as user-facing dashboards.
8. **Server Actions for mutations**: Never perform database writes directly in components; always use Server Actions in `actions/`.
