# Project Structure

## Root Layout

```
plus1-rewards/          # Main application directory
├── src/               # Source code
├── public/            # Static assets
├── documentation/     # Project documentation
├── dist/             # Build output (generated)
└── node_modules/     # Dependencies
```

## Source Directory (`src/`)

### Core Files
- `main.tsx` - Application entry point
- `App.tsx` - Root component with routing
- `index.css` - Global styles

### Directory Organization

```
src/
├── api/              # API integration layer
├── assets/           # Images, icons, static files
├── components/       # React components (organized by role)
│   ├── admin/       # Admin-specific components
│   ├── agent/       # Agent-specific components
│   ├── auth/        # Authentication components
│   ├── common/      # Shared components
│   ├── dashboard/   # Admin dashboard components
│   ├── email/       # Email templates
│   ├── landing/     # Landing page components
│   ├── member/      # Member-specific components
│   ├── mobile/      # Mobile-optimized components
│   ├── partner/     # Partner-specific components
│   ├── provider/    # Policy provider components
│   └── ui/          # Reusable UI components
├── config/          # Configuration files
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries (supabase.ts, session.ts)
├── pages/           # Page components (route handlers)
├── services/        # Business logic services
├── store/           # Zustand stores
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Component Organization Patterns

### Role-Based Components
Components are organized by user role (admin, agent, member, partner, provider) to maintain clear separation of concerns.

### Dashboard Structure
```
components/dashboard/
├── Dashboard.tsx           # Main admin dashboard
├── DashboardLayout.tsx     # Layout wrapper
├── Sidebar.tsx            # Navigation sidebar
├── Topbar.tsx             # Top navigation
├── components/            # Shared dashboard components
│   ├── StatCard.tsx
│   ├── PageHeader.tsx
│   └── MembersTable.tsx
└── pages/                 # Dashboard page views
    ├── MembersPage.tsx
    ├── PartnersPage.tsx
    ├── TransactionsPage.tsx
    └── ...
```

## Key Files & Conventions

### Authentication
- `lib/supabase.ts` - Supabase client initialization
- `lib/session.ts` - Session management utilities
- `components/auth/` - Auth UI components
- `pages/*Login.tsx` - Role-specific login pages
- `pages/*Register.tsx` - Role-specific registration pages

### State Management
- `store/appStore.ts` - Global Zustand store
- `hooks/use*.ts` - Custom hooks for data fetching
  - `useAdminData.ts` - Admin dashboard data
  - `useMemberDashboard.ts` - Member data
  - `usePartnerDashboard.ts` - Partner data
  - `useProviderDashboard.ts` - Provider data

### Services
- `services/indexedDB.ts` - Offline data persistence
- `services/` - Business logic and API calls

## Routing Convention

Routes follow role-based patterns:
- `/` - Public landing page
- `/login`, `/register` - Unified member auth
- `/{role}/login` - Role-specific login
- `/{role}/dashboard` - Role-specific dashboard
- `/{role}/*` - Role-specific features

Example:
- `/member/dashboard` - Member dashboard
- `/partner/transaction-history` - Partner transactions
- `/admin/members` - Admin member management

## Naming Conventions

### Files
- Components: PascalCase (e.g., `MemberDashboard.tsx`)
- Utilities: camelCase (e.g., `formatCurrency.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useMemberDashboard.ts`)
- Types: PascalCase (e.g., `Member.ts`)

### Components
- Page components: Descriptive names (e.g., `MemberLogin`, `PartnerDashboard`)
- UI components: Generic names (e.g., `Button`, `Card`, `Modal`)
- Feature components: Feature-specific (e.g., `TransactionHistory`, `CoverPlanCard`)

## Database Access Patterns

### Supabase Clients
```typescript
// Regular client (RLS enforced)
import { supabase } from '@/lib/supabase'

// Admin client (bypasses RLS)
import { supabaseAdmin } from '@/lib/supabase'
```

### Custom Authentication
No central users table - each role has its own table:
- Members: `members` table (cell_phone + pin_code)
- Partners: `partners` table (cell_phone + pin_code)
- Agents: `agents` table (cell_phone + pin_code)
- Providers: `policy_providers` table (email + password via Supabase Auth)
- Admin: `members` table with role='admin' (Supabase Auth)

### Database Inspection Rules

**CRITICAL**: Never manually check database files or guess database structure.

To inspect the database, always use Kiro Powers:
```
kiroPowers action="activate" powerName="supabase-hosted"
```

Available tools after activation:
- `execute_sql` - Query database for current state
- `list_tables` - View schema and table structure
- `get_project` - Check project configuration

If you don't understand something about the database or business logic, ASK the user instead of guessing.

## Documentation

Located in `plus1-rewards/documentation/`:
- `01_TECHNICAL_ARCHITECTURE.md` - System architecture
- `02_CASHBACK_SYSTEM_DETAILED.md` - Cashback logic
- `03_COMPONENT_API_REFERENCE.md` - Component APIs
- `COMPLETE_BUSINESS_FLOW_DOCUMENT.md` - Business flows
- `PAGE_DESCRIPTIONS.md` - Page documentation

## Build Output

- `dist/` - Production build artifacts
- `public/` - Static files copied to dist
- Service worker files for PWA functionality

## Configuration Files

- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.js` - Tailwind CSS configuration
- `eslint.config.js` - ESLint rules
- `postcss.config.js` - PostCSS configuration
- `.env.local` - Environment variables (not in git)
