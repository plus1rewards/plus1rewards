# Plus1 Rewards - Technical Architecture Documentation

## Document Version: 1.0
## Last Updated: 2026-04-09
## Author: Technical Documentation Team

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Database Architecture](#database-architecture)
5. [Authentication System](#authentication-system)
6. [State Management](#state-management)
7. [Routing Structure](#routing-structure)
8. [Build Configuration](#build-configuration)

---

## System Overview

Plus1 Rewards is a comprehensive healthcare funding platform that enables members to earn cashback toward medical cover plans through everyday shopping at partner stores. The system operates as a Progressive Web Application (PWA) with offline capabilities.

### Core Business Model
- **Members** shop at partner stores and earn cashback
- **Partners** provide cashback (3-40%) on purchases
- **Agents** recruit partners and earn 1% commission
- **Insurers** (Policy Providers) receive funded policy data
- **Drivers** fulfill Plus1-Go delivery orders
- **Admin** manages the entire ecosystem

### Key Features
- Real-time cashback calculation and allocation
- Multi-plan cover management with overflow handling
- Offline transaction processing with sync queue
- QR code-based member identification
- Invoice generation and payment tracking
- Commission calculation for agents
- Policy export to insurance providers
- Delivery order management (Plus1-Go)

---

## Technology Stack

### Frontend Framework
- **React 19.2.4** - Latest React with concurrent features
- **TypeScript 5.9.3** - Type-safe development
- **Vite 8.0.0** - Ultra-fast build tool and dev server

### UI & Styling
- **Tailwind CSS 4.2.1** - Utility-first CSS framework
- **Framer Motion 12.38.0** - Animation library
- **Material Symbols** - Icon system
- **Custom CSS** - Component-specific styling

### State Management
- **Zustand 5.0.11** - Lightweight state management
- **React Query (TanStack) 5.90.21** - Server state management
- **IndexedDB (idb 8.0.3)** - Client-side database for offline

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication (custom implementation)
  - Storage for file uploads

### Routing
- **React Router DOM 7.13.1** - Client-side routing

### Additional Libraries
- **QRCode.react 4.2.0** - QR code generation
- **jsQR 1.4.0** - QR code scanning
- **Axios 1.13.6** - HTTP client
- **React Leaflet 5.0.0** - Map integration
- **Workbox CLI 7.4.0** - Service worker management

---

## Application Architecture

### Project Structure
```
plus1-rewards/
├── src/
│   ├── api/                    # API integration layer
│   ├── assets/                 # Static assets (images, icons)
│   ├── components/             # React components
│   │   ├── admin/             # Admin-specific components
│   │   ├── agent/             # Agent-specific components
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Admin dashboard components
│   │   ├── landing/           # Landing page components
│   │   ├── member/            # Member-specific components
│   │   ├── mobile/            # Mobile-optimized components
│   │   ├── partner/           # Partner-specific components
│   │   ├── provider/          # Policy provider components
│   │   └── ui/                # Reusable UI components
│   ├── config/                # Configuration files
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   ├── pages/                 # Page components
│   ├── services/              # Business logic services
│   ├── store/                 # Zustand stores
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── App.tsx                # Root application component
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
├── public/                    # Public static files
├── documentation/             # Project documentation
├── database/                  # Database scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind configuration
└── package.json              # Dependencies and scripts
```

### Component Architecture

#### 1. Layout Components
- **DashboardLayout** - Admin dashboard wrapper
- **MemberLayout** - Member dashboard wrapper
- **PartnerLayout** - Partner dashboard wrapper
- **AuthLayout** - Authentication pages wrapper

#### 2. Feature Components
- **Dashboard Components** - Admin management interfaces
- **Member Components** - Member-facing features
- **Partner Components** - Partner shop management
- **Agent Components** - Agent network management

#### 3. Shared Components
- **AuthComponents** - Reusable auth UI elements
- **Notification** - Toast notification system
- **LoadingPage** - Loading state component
- **SEO** - Meta tags and SEO optimization

---

## Database Architecture

### Authentication Model
**CRITICAL:** This project has NO central users table. Each role is self-contained.

#### Authentication Tables
```typescript
// Members authenticate with:
members.cell_phone + members.pin_code

// Partners authenticate with:
partners.cell_phone + partners.pin_code

// Agents authenticate with:
agents.cell_phone + agents.pin_code

// Policy Providers authenticate with:
policy_providers.email + policy_providers.password

// Admin users are stored in members table with role='admin'
```

### Core Tables

#### 1. members
Primary user table for platform members.
```sql
- id (uuid, primary key)
- first_name (text)
- last_name (text)
- cell_phone (text, unique) -- Authentication identifier
- email (text)
- pin_code (text) -- 6-digit PIN for authentication
- qr_code (text, unique) -- Member identification
- sa_id (text) -- South African ID number
- date_of_birth (date)
- address_line_1 (text)
- city (text)
- postal_code (text)
- status (text) -- 'active', 'suspended'
- role (text) -- 'member', 'admin'
- created_at (timestamp)
```

#### 2. partners
Partner shop/business table.
```sql
- id (uuid, primary key)
- shop_name (text)
- first_name (text)
- last_name (text)
- cell_phone (text, unique) -- Authentication identifier
- email (text)
- pin_code (text) -- 6-digit PIN
- address (text)
- latitude (numeric)
- longitude (numeric)
- cashback_percent (numeric) -- 3-40%
- category (text)
- status (text) -- 'pending', 'active', 'suspended', 'rejected'
- suppliers (jsonb) -- List of supplier products
- suppliers_updated_at (timestamp)
- agent_id (uuid, foreign key)
- created_at (timestamp)
```

#### 3. agents
Agent network table.
```sql
- id (uuid, primary key)
- first_name (text)
- last_name (text)
- cell_phone (text, unique) -- Authentication identifier
- email (text)
- pin_code (text) -- 6-digit PIN
- sa_id (text)
- status (text) -- 'pending', 'active', 'suspended'
- created_at (timestamp)
```

#### 4. member_cover_plans
Member policy/cover plan tracking.
```sql
- id (uuid, primary key)
- member_id (uuid, foreign key → members)
- cover_plan_id (uuid, foreign key → cover_plans)
- creation_order (integer) -- Funding priority
- target_amount (numeric) -- Monthly target (e.g., R390)
- funded_amount (numeric) -- Current funded amount
- overflow_balance (numeric) -- Excess cashback
- status (text) -- 'in_progress', 'pending', 'active', 'paused', 'suspended'
- active_from (timestamp)
- active_to (timestamp)
- plan_changes_count (integer) -- Track plan changes
- suspended_at (timestamp)
- created_at (timestamp)
```

#### 5. transactions
All cashback transactions.
```sql
- id (uuid, primary key)
- member_id (uuid, foreign key → members)
- partner_id (uuid, foreign key → partners)
- agent_id (uuid, foreign key → agents)
- purchase_amount (numeric) -- Total purchase
- cashback_percent (numeric) -- Applied rate
- member_amount (numeric) -- Member cashback
- partner_contribution (numeric) -- Partner pays
- agent_amount (numeric) -- Agent commission (1%)
- system_amount (numeric) -- Platform fee (1%)
- status (text) -- 'completed', 'pending', 'reversed', 'disputed'
- transaction_time (time)
- is_spend (boolean) -- false = earn, true = spend
- created_at (timestamp)
- synced_at (timestamp)
```

#### 6. cover_plan_wallet_entries
Detailed cashback allocation tracking.
```sql
- id (uuid, primary key)
- member_id (uuid, foreign key → members)
- member_cover_plan_id (uuid, foreign key → member_cover_plans)
- transaction_id (uuid, foreign key → transactions)
- entry_type (text) -- 'cashback_earned', 'overflow_moved', 'top_up', etc.
- amount (numeric)
- balance_after (numeric)
- description (text)
- created_at (timestamp)
```

#### 7. cover_plans
Available cover plan templates.
```sql
- id (uuid, primary key)
- plan_name (text) -- e.g., "Day1 Health Basic"
- monthly_target_amount (numeric) -- e.g., 390
- provider_id (uuid, foreign key → policy_providers)
- status (text) -- 'active', 'inactive'
- created_at (timestamp)
```

#### 8. policy_providers
Insurance/cover providers.
```sql
- id (uuid, primary key)
- provider_name (text) -- e.g., "Day1 Health"
- email (text, unique)
- password (text) -- Hashed
- status (text) -- 'active', 'inactive'
- created_at (timestamp)
```

#### 9. invoices
Partner monthly invoices.
```sql
- id (uuid, primary key)
- partner_id (uuid, foreign key → partners)
- invoice_month (text) -- 'YYYY-MM'
- total_cashback_issued (numeric)
- total_transactions (integer)
- status (text) -- 'pending', 'sent', 'paid', 'overdue'
- due_date (date)
- paid_at (timestamp)
- created_at (timestamp)
```

#### 10. top_ups
Member top-up requests.
```sql
- id (uuid, primary key)
- payer_id (uuid) -- member_id or partner_id
- payer_type (text) -- 'member' or 'partner'
- member_cover_plan_id (uuid, foreign key → member_cover_plans)
- amount (numeric)
- payment_method (text) -- 'eft', 'instant_eft', 'cash'
- status (text) -- 'pending', 'approved', 'rejected'
- proof_of_payment_url (text)
- created_at (timestamp)
- approved_at (timestamp)
```

#### 11. disputes
Transaction disputes.
```sql
- id (uuid, primary key)
- member_id (uuid, foreign key → members)
- transaction_id (uuid, foreign key → transactions)
- partner_id (uuid, foreign key → partners)
- dispute_type (text) -- 'missing_cashback', 'wrong_amount', etc.
- description (text)
- status (text) -- 'open', 'investigating', 'resolved', 'rejected'
- resolution_notes (text)
- created_at (timestamp)
- resolved_at (timestamp)
```

#### 12. admin_notifications
System notifications for admin.
```sql
- id (uuid, primary key)
- type (text) -- Notification category
- member_id (uuid, foreign key → members)
- member_name (text)
- member_phone (text)
- message (text)
- priority (text) -- 'low', 'medium', 'high'
- read (boolean)
- metadata (jsonb) -- Additional data
- created_at (timestamp)
```

### Plus1-Go Tables

#### 13. drivers
Delivery drivers.
```sql
- id (uuid, primary key)
- first_name (text)
- last_name (text)
- cell_phone (text, unique)
- pin_code (text)
- vehicle_type (text)
- vehicle_make (text)
- vehicle_color (text)
- vehicle_registration (text)
- license_number (text)
- license_photo_url (text)
- status (text) -- 'pending', 'active', 'suspended'
- current_status (text) -- 'offline', 'online', 'busy'
- latitude (numeric)
- longitude (numeric)
- created_at (timestamp)
```

#### 14. orders
Plus1-Go delivery orders.
```sql
- id (uuid, primary key)
- member_id (uuid, foreign key → members)
- partner_id (uuid, foreign key → partners)
- driver_id (uuid, foreign key → drivers)
- order_type (text) -- 'delivery', 'pickup'
- subtotal (numeric)
- delivery_fee (numeric)
- total_amount (numeric)
- delivery_address (text)
- delivery_latitude (numeric)
- delivery_longitude (numeric)
- status (text) -- 'pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled'
- created_at (timestamp)
- confirmed_at (timestamp)
- delivered_at (timestamp)
```

#### 15. order_items
Items in each order.
```sql
- id (uuid, primary key)
- order_id (uuid, foreign key → orders)
- product_id (uuid, foreign key → products)
- quantity (integer)
- unit_price (numeric)
- total_price (numeric)
- created_at (timestamp)
```

#### 16. products
Partner product catalog.
```sql
- id (uuid, primary key)
- partner_id (uuid, foreign key → partners)
- name (text)
- description (text)
- price (numeric)
- category (text)
- image_url (text)
- available (boolean)
- created_at (timestamp)
```

#### 17. driver_earnings
Driver payment tracking.
```sql
- id (uuid, primary key)
- driver_id (uuid, foreign key → drivers)
- order_id (uuid, foreign key → orders)
- delivery_fee (numeric)
- driver_amount (numeric) -- 93% of delivery fee
- system_amount (numeric) -- 5% of delivery fee
- agent_amount (numeric) -- 2% of delivery fee
- status (text) -- 'pending', 'paid'
- created_at (timestamp)
- paid_at (timestamp)
```

---

## Authentication System

### Custom Authentication Implementation

Plus1 Rewards uses a **custom authentication system** without Supabase Auth. Each role authenticates independently.

#### Member Authentication Flow
```typescript
// Login: plus1-rewards/src/pages/MemberLogin.tsx
1. User enters cell_phone and pin_code
2. Query members table: WHERE cell_phone = ? AND pin_code = ?
3. Verify status === 'active'
4. Create session object
5. Store in localStorage (remember me) or sessionStorage
6. Navigate to /member/dashboard

// Session Structure
interface MemberSession {
  member: {
    id: string;
    first_name: string;
    last_name: string;
    cell_phone: string;
    email: string;
    qr_code: string;
    status: string;
  };
  loggedInAt: string;
  expiresAt: string | null; // null for session storage
  rememberMe: boolean;
  platform: 'rewards' | 'go';
}
```

#### Partner Authentication Flow
```typescript
// Login: plus1-rewards/src/pages/PartnerLogin.tsx
1. User enters cell_phone/email and pin_code
2. Query partners table: WHERE (cell_phone = ? OR email = ?) AND pin_code = ?
3. Verify status === 'active'
4. Create session object
5. Store in localStorage/sessionStorage
6. Navigate to /partner/dashboard

// Session Structure
interface PartnerSession {
  user: {
    id: string;
    role: 'partner';
    first_name: string;
    last_name: string;
    cell_phone: string;
    status: string;
  };
  partner: {
    // Full partner object
  };
  loggedInAt: string;
  expiresAt: string | null;
  rememberMe: boolean;
}
```

#### Agent Authentication Flow
```typescript
// Login: plus1-rewards/src/pages/AgentLogin.tsx
1. User enters cell_phone and pin_code
2. Query agents table: WHERE cell_phone = ? AND pin_code = ?
3. Verify status === 'active'
4. Create session object
5. Store in localStorage/sessionStorage
6. Navigate to /agent/dashboard

// Session Structure
interface AgentSession {
  agent_id: string;
  first_name: string;
  last_name: string;
  cell_phone: string;
  email: string;
  status: string;
}
```

#### Admin Authentication Flow
```typescript
// Login: plus1-rewards/src/pages/AdminLogin.tsx
1. User enters email and password
2. Use Supabase Auth: signInWithPassword()
3. Verify user exists
4. Navigate to /admin/dashboard

// Admin uses Supabase Auth (different from other roles)
```

### Session Management

#### Session Utilities
File: `plus1-rewards/src/lib/session.ts`

```typescript
// Get current session
function getSession(role: 'member' | 'partner'): SessionData | null

// Clear session (logout)
function clearSession(role: 'member' | 'partner'): void

// Check if session is valid
function isSessionValid(role: 'member' | 'partner'): boolean
```

#### Session Expiry
- **Remember Me**: 30 days expiry
- **Session Only**: Expires on browser close
- **Validation**: Checked on every protected route access

### Protected Routes

#### Member Routes
All `/member/*` routes check for valid member session.

#### Partner Routes
All `/partner/*` routes check for valid partner session.

#### Agent Routes
All `/agent/*` routes check for agent session in localStorage/sessionStorage.

#### Admin Routes
All `/admin/*` routes check for Supabase Auth session.

---

## State Management

### 1. Zustand Store (Global State)

File: `plus1-rewards/src/store/appStore.ts`

```typescript
interface AppState {
  user: User | null;
  isOnline: boolean;
  syncQueue: any[];
  setUser: (user: User | null) => void;
  setOnline: (online: boolean) => void;
  addToSyncQueue: (item: any) => void;
  clearSyncQueue: () => void;
}

// Usage
const { user, isOnline, syncQueue } = useAppStore();
```

**Purpose:**
- Track online/offline status
- Manage sync queue for offline transactions
- Store minimal user state

### 2. Custom Hooks (Data Fetching)

#### useAdminData
File: `plus1-rewards/src/hooks/useAdminData.ts`

Fetches all admin dashboard data:
- Members with wallets
- Partners
- Agents
- Policy providers
- Policies
- Transactions

#### useMemberDashboard
File: `plus1-rewards/src/hooks/useMemberDashboard.ts`

Fetches member-specific data:
- Member profile
- Wallets (per partner)
- Partners
- Transactions
- Stats (total rewards, balance, pending transactions)

Methods:
- `spendRewards(partnerId, amount)` - Spend cashback
- `syncPendingTransactions()` - Sync offline transactions
- `refetch()` - Reload all data

#### usePartnerDashboard
File: `plus1-rewards/src/hooks/usePartnerDashboard.ts`

Fetches partner-specific data:
- Partner profile
- Transactions
- Stats (today's rewards, total members, revenue)

Methods:
- `issueRewards(memberId, purchaseAmount)` - Process transaction
- `searchMember(phone)` - Find member by phone
- `refetch()` - Reload all data

#### useProviderDashboard
File: `plus1-rewards/src/hooks/useProviderDashboard.ts`

Fetches policy provider data:
- Provider profile
- Policies (active/pending)
- Plans
- Stats (total funded, payout, activation rate)
- Plan breakdown

Methods:
- `exportCSV()` - Export policy data
- `refetch()` - Reload all data

#### useSupplierExpiry
File: `plus1-rewards/src/hooks/useSupplierExpiry.ts`

Tracks partner supplier list expiry (30-day limit).

Returns:
- `daysRemaining` - Days until expiry
- `isExpired` - Boolean expiry status
- `canAddSuppliers` - Can add new suppliers
- `clearExpiredSuppliers()` - Clear expired list

### 3. IndexedDB (Offline Storage)

File: `plus1-rewards/src/services/indexedDB.ts`

**Database Schema:**
```typescript
interface Plus1DB {
  members: {
    key: string;
    value: MemberData;
  };
  wallets: {
    key: string;
    value: WalletData;
  };
  transactions: {
    key: string;
    value: TransactionData;
    indexes: { 'by-created': number };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
  };
}
```

**Methods:**
- `initDB()` - Initialize database
- `getDB()` - Get database instance
- `addTransaction(tx)` - Store offline transaction
- `getTransactions()` - Retrieve all transactions
- `addToSyncQueue(item)` - Queue for sync
- `getSyncQueue()` - Get pending sync items
- `clearSyncQueue()` - Clear after sync

**Usage:**
```typescript
// Store offline transaction
await addTransaction({
  id: uuid(),
  partnerId,
  memberId,
  amount,
  type: 'earn',
  status: 'pending_sync',
  createdAt: Date.now()
});

// Sync when online
const queue = await getSyncQueue();
for (const item of queue) {
  await supabase.from('transactions').insert(item.data);
}
await clearSyncQueue();
```

---

## Routing Structure

File: `plus1-rewards/src/App.tsx`

### Public Routes
```typescript
/ - Landing page
/terms-of-service - Terms
/privacy-policy - Privacy policy
/find-partner - Partner locator
```

### Authentication Routes
```typescript
/login - Unified member login (Rewards & Go)
/register - Unified member registration
/member/login - Legacy member login (redirects to /login)
/member/register - Legacy member register (redirects to /register)
/partner/login - Partner login
/partner/register - Partner registration
/agent/login - Agent login
/agent/register - Agent registration
/provider/login - Policy provider login
/admin/login - Admin login
```

### Member Routes
```typescript
/member/dashboard - Main dashboard
/member/chat - Support chat
/member/cover-plans - View cover plans
/member/transactions - Transaction history
/member/top-up - Top-up cover plan
/member/support - Support page
/member/add-dependant - Add dependant
/member/sponsor - Sponsor someone
/member/scan-partner - Scan partner QR
/member/policy-selector - Select policy
/member/policies - View policies
/member/history - Purchase history
/member/qr - Member QR code
/member/find-partners - Find partners
```

### Partner Routes
```typescript
/partner/dashboard - Main dashboard
/partner/process-transaction - Process purchase
/partner/quick-transaction - Quick transaction
/partner/member-registration - Register member
/partner/sales - Sales terminal
/partner/sales-terminal - Advanced terminal
/partner/transaction-history - View transactions
/partner/transaction/:id - Transaction details
/partner/monthly-invoice - View invoice
/partner/profile - Shop profile
/partner/support - Support page
```

### Agent Routes
```typescript
/agent/dashboard - Main dashboard
/agent/add-shop - Add partner shop
/agent/commission - Commission tracking
/agent/support - Support page
/agent/profile - Agent profile
/agent/shop/:partnerId - Shop details
```

### Admin Routes
```typescript
/admin/dashboard - Main dashboard
/admin/approvals - Approval queue
/admin/members - Member management
/admin/cover-plans - Cover plan management
/admin/notifications - Notifications
/admin/partners - Partner management
/admin/invoices - Invoice management
/admin/agents - Agent management
/admin/commissions - Commission management
/admin/providers - Provider management
/admin/transactions - Transaction management
/admin/disputes - Dispute management
/admin/top-ups - Top-up management
/admin/settings - System settings
/admin/chat - Admin chat dashboard
```

### Policy Provider Routes
```typescript
/provider/dashboard - Provider dashboard (protected)
```

---

## Build Configuration

### Vite Configuration
File: `plus1-rewards/vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  
  // Environment variables
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  
  // Module resolution
  resolve: {
    alias: {
      process: 'process/browser',
      buffer: 'buffer',
    },
  },
  
  // Optimization
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  
  // Dev server
  server: {
    port: 5174,
    host: true,
  },
  
  // Production build
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  
  // Preview server
  preview: {
    port: 5174,
    host: true,
  },
})
```

### TypeScript Configuration
File: `plus1-rewards/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

### Environment Variables
File: `plus1-rewards/.env.local`

```env
VITE_SUPABASE_URL=https://gcbmlxdxwakkubpldype.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_SUPABASE_SERVICE_ROLE=<service_role_key>
VITE_APP_URL=https://www.plus1rewards.com
```

**Usage in Code:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### Package Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

---

## Performance Optimizations

### 1. Code Splitting
- Automatic route-based code splitting via React Router
- Lazy loading of heavy components
- Dynamic imports for modals and dialogs

### 2. Image Optimization
- WebP format for images
- Lazy loading with Intersection Observer
- Responsive images with srcset

### 3. Caching Strategy
- Service Worker for offline caching
- IndexedDB for data persistence
- LocalStorage for session data

### 4. Bundle Optimization
- Tree shaking enabled
- Minification with Terser
- CSS purging with Tailwind

---

## Security Considerations

### 1. Authentication Security
- PIN codes stored as plain text (6 digits)
- Session tokens in localStorage/sessionStorage
- No JWT tokens (custom session management)
- Admin uses Supabase Auth with hashed passwords

### 2. Database Security
- Row Level Security (RLS) policies on all tables
- Service role key for admin operations
- Anon key for public operations
- No direct database access from client

### 3. API Security
- Supabase handles all API security
- RLS policies enforce data access rules
- Service role bypasses RLS for admin

### 4. Input Validation
- Client-side validation with TypeScript
- Server-side validation via Supabase
- SQL injection prevention via parameterized queries

---

## Deployment

### Build Process
```bash
cd plus1-rewards
npm install
npm run build
```

### Output
- Build artifacts in `plus1-rewards/dist/`
- Static files ready for deployment
- Service worker for PWA functionality

### Hosting Options
- Vercel (recommended)
- Netlify
- Firebase Hosting
- Any static hosting service

### Environment Setup
1. Set environment variables in hosting platform
2. Configure custom domain
3. Enable HTTPS
4. Configure redirects for SPA routing

---

## Monitoring & Logging

### Client-Side Logging
- Console logs for development
- Error boundaries for React errors
- Network error handling

### Server-Side Monitoring
- Supabase dashboard for database metrics
- Real-time query performance
- Error logs in Supabase

---

## Future Enhancements

### Planned Features
1. Push notifications
2. Real-time chat system
3. Advanced analytics dashboard
4. Mobile app (React Native)
5. Payment gateway integration
6. SMS notifications
7. Email notifications
8. Advanced reporting

### Technical Debt
1. Migrate to JWT-based authentication
2. Implement proper password hashing for PINs
3. Add comprehensive error logging
4. Implement automated testing
5. Add API rate limiting
6. Improve offline sync reliability

---

## Conclusion

Plus1 Rewards is a modern, scalable healthcare funding platform built with React, TypeScript, and Supabase. The architecture supports offline functionality, real-time updates, and multi-role access with custom authentication. The system is designed for growth and can handle increasing user loads with proper database indexing and caching strategies.

---

**Document End**
