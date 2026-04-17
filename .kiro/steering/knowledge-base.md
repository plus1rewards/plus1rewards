# Plus1 Rewards - Essential Knowledge Base

## CRITICAL INFORMATION - READ FIRST

### Database Structure - NO CENTRAL USERS TABLE
**MOST IMPORTANT:** This project has NO central users table. Each role is self-contained:
- `members` table: cell_phone + pin_code (6 digits)
- `partners` table: cell_phone + pin_code (6 digits)  
- `agents` table: cell_phone + pin_code (6 digits)
- `policy_providers` table: email + password
- `drivers` table: cell_phone + pin_code (6 digits)
- Admin users: stored in `members` table with `role='admin'`

### Supabase Project Configuration
- **Project ID**: `gcbmlxdxwakkubpldype`
- **Project Name**: plus1
- **Region**: eu-west-1
- **Database Host**: db.gcbmlxdxwakkubpldype.supabase.co

---

## Core Business Model

### What Plus1 Rewards Is
A healthcare funding platform where members earn cashback toward medical cover plans by shopping at partner stores. Uses **real rand value** (not loyalty points).

### Cashback Split Formula
```
Partner sets rate: 3% - 40%

Every transaction:
- System Fee: 1% of purchase
- Agent Commission: 1% of purchase
- Member Cashback: (Rate - 2%) of purchase
```

**Example:** R1,000 purchase at 7% cashback
- Total: R70
- System: R10 (1%)
- Agent: R10 (1%)
- Member: R50 (5%)

---

## Cover Plan Status Flow

### Status Definitions
- `in_progress`: 0-99% funded
- `paused`: 100% funded BUT profile incomplete **OR** insufficient funds for 30-day renewal
- `pending_day1health`: 100% funded AND profile complete (awaiting Day1Health verification)
- `pending_upgrade`: Plan upgrade in progress (awaiting Day1Health approval)
- `active`: Verified and active (30-day cycle)

### Critical Status Rules
```
[Registration] → in_progress (0-99%)
    ↓
[100% reached]
    ↓
Profile Complete?
    ↓ YES              ↓ NO
[pending_day1health]   [paused]
    ↓                  ↓
Day1Health      Complete Profile
Verification         ↓
    ↓            [pending_day1health]
[active]             ↓
(30 days)        [active]
    ↓                  ↓
[30-day cycle ends]   [Member clicks Upgrade]
    ↓                  ↓
Sufficient funds?  [pending_upgrade]
    ↓ YES    ↓ NO      ↓
[active]  [paused]  Day1Health
(renew)   (wait)    Verification
                      ↓
                    [active]
```

### CRITICAL: Overflow Means 100% Funded
**IF A PLAN HAS OVERFLOW, IT MUST BE AT 100% (target_amount) FUNDED!**
- Overflow only exists AFTER plan reaches target_amount
- If `overflow_balance > 0`, then `funded_amount` MUST equal `target_amount`
- Status should be `pending_day1health` (if profile complete) or `paused` (if incomplete)
- **NEVER** have overflow with status `in_progress` - this is a bug!

### Profile Completion Requirements
**Required for plan to become active:**
1. Valid email (NOT @plus1rewards.local)
2. SA ID number
3. Address Line 1

**Triggers:**
- 90%: Warning modal (dismissible)
- 95%: Mandatory modal (dismiss once)
- 96%: Critical modal (cannot dismiss)
- 100%: Plan PAUSES if incomplete, PENDING if complete

### 30-Day Renewal Logic
After 30 days of active coverage:
- System checks if member has sufficient funds to renew
- **If YES:** Plan automatically renews as `active` for another 30 days
- **If NO:** Plan status changes to `paused` (insufficient funds)
- When member earns enough cashback: Plan automatically reactivates as `active`

---

## Member Registration & Authentication

### Member Registration Fields
- First name, last name
- Cell phone (10 digits, unique)
- Date of birth (must be 18+)
- 6-digit PIN
- Email defaults to `{phone}@plus1rewards.local`
- QR code auto-generated: `PLUS1-{phone}-{timestamp}`
- Status: 'active'
- **NO default cover plan assigned during registration**
- **Members table has legacy fields:** `cover_plan_name`, `cover_plan_price`, `cover_plan_variant`
  - These are populated when member selects their first plan
  - Updated by `PlanSelectionModal` component

### Plan Selection Process
When a member selects their first plan (via PlanSelectionModal):
1. Creates record in `member_cover_plans` table
2. Updates `members` table with:
   - `cover_plan_name` (e.g., "Hospital - Value Plus")
   - `cover_plan_price` (e.g., "390")
   - `cover_plan_variant` (always "Single")
3. **Members can ONLY select a plan ONCE** - no plan changing allowed
4. If they try to select again, they get error: "You already have a cover plan selected"

### Member Login
- Credentials: `cell_phone` + `pin_code`
- Session: 30 days if "Remember Me" checked
- Validates status === 'active'

---

## Partner System

### Partner Registration
- Business name, category, address
- Contact person, phone, email
- Cashback percentage (3-40%)
- 6-digit PIN
- Digital signature
- Status starts as 'pending' (requires admin approval)

### Partner Status Flow
```
Registration → pending
    ↓
Admin Approval → active
    ↓
(If invoice unpaid) → suspended
    ↓
(After payment) → active
```

### Partner Transaction Processing
1. Member provides phone or QR code
2. Partner enters purchase amount
3. System calculates cashback split automatically
4. Transaction created
5. Member's cover plan funded
6. Wallet entry recorded

---

## Agent System

### Agent Commission
- **Rate:** 1% of every transaction at recruited partners
- **Calculation:** Based on purchase amount (not cashback)
- **Payout:** Monthly (5th of month)
- **Minimum:** R500 threshold

### Agent Registration
- First name, surname, SA ID
- Cell phone, email
- ID document upload
- 6-digit PIN
- Digital signature
- Status: 'pending' (requires admin approval)

---

## Multi-Plan Funding & Overflow

### Creation Order System
Plans funded in order of `creation_order`:
```
Plan 1 (creation_order: 1) → funded first
Plan 2 (creation_order: 2) → funded second  
Plan 3 (creation_order: 3) → funded third
```

### Overflow Rules
**Overflow** = cashback earned AFTER plan reaches 100%

**Overflow stored in:** First plan (creation_order: 1)

**Overflow uses:**
1. Next 30-day cycle funding
2. Plan upgrades
3. Dependant funding
4. Sponsoring others

### Sponsorship Rules
When sponsoring someone:
- Sponsored member's plan gets `creation_order: 2`
- Sponsor's plan (creation_order: 1) gets funded first
- Status set to 'paused' (profile incomplete by default)
- Sponsor can choose plan: Hospital or Day to Day (NOT Comprehensive)
- **Sponsored member role set to 'sponsored_member'**
- **Sponsored members CANNOT receive transactions** - only sponsor earns cashback
- **UI restrictions for sponsored members:**
  - "View All Transactions" button hidden
  - "Find Partners" button hidden
  - "Recent Rewards History" section hidden

### Sponsorship Renewal (30-Day Cycle)
After 30 days, sponsored plans need renewal:
- System checks if sponsor has enough overflow
- **If YES:** Deduct from sponsor's overflow, set to 'active' for 30 days
- **If NO:** Sponsored plan status → 'paused', waits for sponsor overflow
- When sponsor earns overflow: Automatically reactivate paused sponsored plans
- Oldest paused plans reactivated first

**Database Functions:**
- `renew_sponsored_plans()` - Daily cron job (2 AM) to check expired sponsored plans
- `reactivate_paused_sponsored_plans(sponsor_id)` - Called after sponsor earns cashback

---

## Invoice & Billing

### Partner Billing Cycle
```
Month: Transactions occur
    ↓
Month End: Invoice generated
    ↓
Due Date: Set by admin
    ↓
Payment: Partner pays
    ↓
Status: Marked as paid
    ↓
(If not paid) → Late Notice → Suspension
```

### Invoice Structure
- Total cashback issued
- Total transactions
- Amount due
- Due date
- Payment status

---

## Plus1-Go Delivery System

### Driver Earnings
- **Driver:** 93% of delivery fee
- **System:** 5% of delivery fee
- **Agent:** 2% of delivery fee

### Order Flow
1. Member orders from partner
2. System assigns driver
3. Driver picks up order
4. Driver delivers to member
5. Transaction created with cashback
6. Driver earnings recorded

---

## Technology Stack

### Frontend
- React 19.2.4
- TypeScript 5.9.3
- Vite 8.0.0
- Tailwind CSS 4.2.1
- Framer Motion 12.38.0

### Backend
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Real-time subscriptions
- Custom authentication (NO Supabase Auth for most roles)

### State Management
- Zustand 5.0.11
- TanStack Query 5.90.21
- IndexedDB (idb 8.0.3) for offline

---

## Key Database Tables

### members
```sql
- id, first_name, last_name
- cell_phone (unique, auth)
- pin_code (6 digits)
- qr_code (unique)
- email, sa_id, date_of_birth
- address_line_1, city, postal_code
- status ('active', 'suspended')
- role ('member', 'admin', 'sponsored_member')
- cover_plan_name (legacy field - populated when plan selected)
- cover_plan_price (legacy field - populated when plan selected)
- cover_plan_variant (legacy field - always 'Single')
```

**Legacy Fields:** The `cover_plan_name`, `cover_plan_price`, and `cover_plan_variant` columns are legacy fields that mirror data from `member_cover_plans`. They are automatically populated by `PlanSelectionModal` and `UpgradePromptModal` when a member selects or upgrades their plan.

### partners
```sql
- id, shop_name
- cell_phone (unique, auth)
- email, pin_code
- cashback_percent (3-40)
- status ('pending', 'active', 'suspended', 'rejected')
- agent_id (foreign key)
```

### member_cover_plans
```sql
- id, member_id, cover_plan_id
- creation_order (funding priority)
- target_amount (e.g., R390)
- funded_amount (current funded)
- overflow_balance (excess cashback)
- status ('in_progress', 'pending_day1health', 'active', 'paused', 'pending_upgrade')
- active_from, active_to (30-day cycle)
- sponsored_by (if sponsored)
- plan_changes_count (DEPRECATED - no longer used, always 0)
```

**IMPORTANT:** The `plan_changes_count` column exists but is NO LONGER USED. Plan changing has been completely removed. Members can only select a plan once.

### transactions
```sql
- id, member_id, partner_id, agent_id
- purchase_amount
- cashback_percent
- member_amount (member cashback)
- agent_amount (1%)
- system_amount (1%)
- status ('completed', 'pending', 'reversed', 'disputed')
```

### cover_plan_wallet_entries
```sql
- id, member_id, member_cover_plan_id
- transaction_id
- entry_type ('cashback_earned', 'overflow_moved', 'top_up', etc.)
- amount
- balance_after
```

---

## Important Business Rules

### 1. Profile Completion Enforcement
- Plans CANNOT become active without complete profile
- System automatically sets status to 'paused' at 100% if incomplete
- Required: valid email, SA ID, address

### 2. Cashback Allocation
- Always fills plans in `creation_order`
- Excess goes to overflow (stored in first plan)
- Automatic allocation, no manual intervention

### 3. 30-Day Active Cycle
- Active plans last 30 days
- After 30 days: check if sufficient funds
- If YES: renew as active
- If NO: status changes to 'paused' (insufficient funds)

### 4. Sponsorship
- Deducts from sponsor's overflow
- Creates new member with plan at `creation_order: 2`
- Status: 'paused' (profile incomplete)
- Only Hospital or Day to Day plans (NOT Comprehensive)

### 5. Top-Up System
- Members can manually add funds
- Two methods: EFT or Instant EFT (via admin chat)
- Admin approves and credits account
- Can be partial or full

---

## Common Pitfalls to Avoid

### ❌ DON'T
1. Set sponsored plans to 'active' - use 'paused'
2. Allow Comprehensive plans for sponsorship
3. Forget to check profile completion at 100%
4. Hardcode plan amounts - use database values
5. Skip creation_order validation
6. Allow plans to activate without profile completion
7. Use 'suspended' for member cover plans - use 'paused'
8. Forget 30-day renewal logic - plans need funds to renew
9. **Allow overflow to exist with status 'in_progress'** - if overflow > 0, plan MUST be at 100%
10. **Use 'pending' status** - correct status is 'pending_day1health'
11. **Allow plan changing** - members can only select a plan ONCE
12. **Forget to update members table legacy fields** - must update when plan is selected

### ✅ DO
1. Always validate profile before setting 'active'
2. Use 'paused' for incomplete profiles at 100%
3. Use 'paused' for insufficient funds at 30-day renewal
4. Respect creation_order for funding
5. Store overflow in first plan only
6. Validate cashback range (3-40%)
7. Check member status before transactions
8. Automatically reactivate 'paused' plans when funds become available
9. **Ensure funded_amount = target_amount when overflow_balance > 0**
10. **Use 'pending_day1health' for plans awaiting verification**
11. **Block plan changes** - show error if member tries to select again
12. **Update both tables** - member_cover_plans AND members table when plan selected

---

## File Structure Patterns

### Authentication
- `lib/supabase.ts` - Supabase client
- `lib/session.ts` - Session management
- `pages/*Login.tsx` - Role-specific login
- `pages/*Register.tsx` - Role-specific registration

### Dashboards
- `pages/DashboardNew.tsx` - Member dashboard
- `components/partner/PartnerDashboard.tsx` - Partner
- `pages/AgentDashboard.tsx` - Agent
- `components/dashboard/Dashboard.tsx` - Admin

### State Management
- `store/appStore.ts` - Global Zustand store
- `hooks/use*.ts` - Custom data hooks
- `services/indexedDB.ts` - Offline storage

---

## Development Commands

```bash
# Development
npm run dev          # Start dev server (port 5174)

# Build
npm run build        # Production build

# Lint
npm run lint         # Run ESLint

# Root commands
npm run dev          # cd plus1-rewards && npm run dev
npm run build        # cd plus1-rewards && npm run build
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://gcbmlxdxwakkubpldype.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_SUPABASE_SERVICE_ROLE=<service_role_key>
VITE_APP_URL=https://www.plus1rewards.com
```

---

## Quick Reference

### Default Cover Plans
- Day to Day Single: R385
- Hospital - Value - Single: R390
- Comprehensive - Value Plus - Single: R665

### User Roles
1. Member - Earns cashback
2. Partner - Issues cashback
3. Agent - Recruits partners, earns 1%
4. Admin - Manages platform
5. Policy Provider - Receives policy data
6. Driver - Delivers orders (Plus1-Go)

### Key Routes
- Member: `/member/dashboard`
- Partner: `/partner/dashboard`
- Agent: `/agent/dashboard`
- Admin: `/admin/dashboard`
- Provider: `/provider/dashboard`

---

## Remember These Key Points

1. **NO central users table** - each role is independent
2. **Profile completion required** for active status
3. **Paused ≠ Pending** - paused = incomplete profile OR insufficient funds for renewal, pending_day1health = awaiting verification
4. **Creation order matters** - determines funding priority
5. **Overflow stored in first plan** - not distributed
6. **Cashback is real money** - not loyalty points
7. **30-day cycles** - plans renew monthly if funded, pause if insufficient funds
8. **Sponsorship uses overflow** - deducted from sponsor
9. **Status flow is strict** - follow the rules
10. **Always validate before activating** - profile must be complete
11. **NO 'suspended' status for member plans** - use 'paused' instead
12. **Paused plans auto-reactivate** - when funds become available
13. **Overflow = 100% funded** - if overflow exists, funded_amount MUST equal target_amount
14. **Plan selection is ONE-TIME only** - no plan changing allowed
15. **Update both tables** - member_cover_plans AND members table when plan selected
16. **Use correct status names** - 'pending_day1health' not 'pending'

---

## Recent Fixes & Changes (April 2026)

### Fixed: Member Registration ID Generation
- **Issue:** Members table `id` column had no default UUID generation
- **Fix:** Added `gen_random_uuid()` as default value for `id` column
- **Impact:** New member registrations now work correctly

### Fixed: Cashback Allocation Bug
- **Issue:** Cashback was being added to plan even after reaching 100%, causing incorrect funded_amount and overflow_balance
- **Fix:** Updated transaction processing to stop adding to funded_amount once target is reached
- **Impact:** Plans now correctly show 100% when they have overflow

### Fixed: Plan Status Incorrect with Overflow
- **Issue:** Plans showing 'in_progress' status even with overflow balance
- **Fix:** Corrected status to 'pending_day1health' when plan reaches 100% with complete profile
- **Impact:** Plans with overflow now show correct status

### Removed: Plan Changing Feature
- **Change:** Completely removed ability to change plans after initial selection
- **Reason:** Caused confusion and code conflicts
- **Impact:** Members can only select a plan once, must contact support to change
- **Code:** Removed `plan_changes_count` logic, removed "Change Plan" button from ProfileIncompleteModal

### Fixed: Legacy Fields Not Populated
- **Issue:** `cover_plan_name`, `cover_plan_price`, `cover_plan_variant` in members table were NULL
- **Fix:** PlanSelectionModal now updates members table when plan is selected
- **Impact:** Legacy fields are now populated for all new plan selections

---

**Last Updated:** 2026-04-17
**Version:** 1.2
