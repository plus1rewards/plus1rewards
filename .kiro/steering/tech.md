# Technology Stack

## Frontend

- **React 19.2.4** - UI framework with concurrent features
- **TypeScript 5.9.3** - Type-safe development
- **Vite 8.0.0** - Build tool and dev server
- **React Router DOM 7.13.1** - Client-side routing

## Styling & UI

- **Tailwind CSS 4.2.1** - Utility-first CSS framework
- **Framer Motion 12.38.0** - Animation library
- **Lucide React** - Icon system
- **Custom color palette**: Primary blue (#1a568b), Secondary green (#37d270)

## State Management

- **Zustand 5.0.11** - Lightweight global state
- **TanStack Query 5.90.21** - Server state and caching
- **IndexedDB (idb 8.0.3)** - Offline data persistence

## Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions
  - File storage
  - Custom authentication (no Supabase Auth for most roles)

## Key Libraries

- **QRCode.react 4.2.0** - QR code generation
- **jsQR 1.4.0** - QR code scanning
- **Axios 1.13.6** - HTTP client
- **React Leaflet 5.0.0** - Map integration
- **Workbox CLI 7.4.0** - Service worker/PWA

## Build Configuration

### Development Server
```bash
npm run dev          # Start dev server on port 5174
```

### Production Build
```bash
npm run build        # Build for production (output: dist/)
npm run preview      # Preview production build
```

### Linting
```bash
npm run lint         # Run ESLint
```

### Root Commands
```bash
# From project root
npm run dev          # Runs cd plus1-rewards && npm run dev
npm run build        # Runs cd plus1-rewards && npm run build
```

## Environment Variables

Required in `.env.local`:
```env
VITE_SUPABASE_URL=<supabase_project_url>
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_SUPABASE_SERVICE_ROLE=<service_role_key>
VITE_APP_URL=<app_url>
```

Access in code:
```typescript
import.meta.env.VITE_SUPABASE_URL
```

## TypeScript Configuration

- Target: ES2020
- Module: ESNext with bundler resolution
- Strict mode enabled
- JSX: react-jsx
- No unused locals/parameters enforced

## Build Optimizations

- Terser minification
- Tree shaking enabled
- No source maps in production
- Service worker for offline caching
- Code splitting via React Router

## Database Inspection

**IMPORTANT**: Do NOT manually check database files or guess database structure.

To inspect the database, use Kiro Powers:

```
kiroPowers action="activate" powerName="supabase-hosted"
```

Then use available tools:
- `execute_sql` - Run SQL queries to check data
- `list_tables` - View all tables and schema
- `get_project` - Check project details

This ensures accurate, real-time database information without assumptions.
