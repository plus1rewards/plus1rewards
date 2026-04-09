# Plus1 Rewards - Complete Business Flow Documentation

## Document Information
- **Version:** 2.0
- **Last Updated:** April 9, 2026
- **Purpose:** Comprehensive business flow documentation covering all roles, logic, rules, and dashboard functions

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Roles](#system-roles)
3. [Core Business Logic](#core-business-logic)
4. [Member Dashboard Functions](#member-dashboard-functions)
5. [Partner Dashboard Functions](#partner-dashboard-functions)
6. [Agent Dashboard Functions](#agent-dashboard-functions)
7. [Admin Dashboard Functions](#admin-dashboard-functions)
8. [Insurance Provider Dashboard Functions](#insurance-provider-dashboard-functions)
9. [Driver Dashboard Functions (Plus1-Go)](#driver-dashboard-functions)
10. [Plus1-Go Delivery System](#plus1-go-delivery-system)
11. [Business Rules & Logic](#business-rules-and-logic)
12. [Technical Architecture](#technical-architecture)

---

## 1. Project Overview

### What is Plus1 Rewards?

Plus1 Rewards is a healthcare funding platform that enables South African members to earn cashback toward medical cover plans through everyday shopping at partner stores. The system operates on real rand value cashback (not loyalty points), creating an accessible pathway to healthcare coverage.

### Core Value Proposition

**For Members:**
- Shop at partner stores and earn cashback
- Cashback automatically funds medical cover plans
- No upfront premium payments required
- Access to affordable healthcare coverage

**For Partners:**
- Attract and retain customers through cashback incentives
- Set their own cashback rates (3-40%)
- Monthly invoicing system
- Integrated sales terminal

**For Agents:**
- Earn 1% commission on all transactions at recruited partners
- Build a network of partner businesses
- Monthly commission payouts
- Support tools for partner management

**For Insurance Providers:**
- Access to funded policy data
- Automated policy activation workflow
- Export capabilities for integration
- Dashboard for policy monitoring

### Business Model

```
Member shops at Partner Store
    ↓
Partner issues cashback (3-40% of purchase)
    ↓
Cashback split:
- 1% → System/Platform
- 1% → Agent (who recruited the partner)
- Remaining % → Member's cover plan
    ↓
Member's cover plan gets funded
    ↓
When plan reaches 100% funding → Becomes Active
    ↓
Active for 30 days
    ↓
Cycle repeats monthly
```

### Key Statistics
- **Technology:** React 19, TypeScript, Supabase, Vite
- **User Roles:** 6 (Member, Partner, Agent, Admin, Insurance Provider, Driver)
- **Pages:** 60+
- **Cashback Range:** 3-40%
- **Default Cover Plan:** R390/month
- **Active Cycle:** 30 days

---

## 2. System Roles

### 2.1 Member

**Definition:** An individual who shops at partner stores and earns cashback toward medical cover plans.

**Registration Requirements:**
- First name and last name
- Mobile number (10 digits, unique)
- Date of birth (must be 18+)
- 6-digit PIN code
- Terms of Service acceptance

**Authentication:**
- Login: `cell_phone` + `pin_code`
- Session: 30 days (if "Remember Me" checked)
- QR Code: Auto-generated for identification

**Key Capabilities:**
- Shop at any partner store in the network
- Earn cashback automatically
- Track cover plan progress
- Add dependants
- Top-up cover plans
- View transaction history
- Access QR code for scanning
- Chat with admin support

**Database Table:** `members`
```sql
- id (uuid, primary key)
- first_name, last_name
- cell_phone (unique, authentication)
- pin_code (6 digits)
- qr_code (unique identifier)
- sa_id, date_of_birth
- address_line_1, city, postal_code
- email
- status ('active', 'suspended')
- role ('member', 'admin')
- created_at
```

---

### 2.2 Partner

**Definition:** A business or shop that offers cashback to members on purchases.

**Registration Requirements:**
- Business name
- Business category
- Physical address
- Responsible person name
- Mobile number (unique)
- Email address
- Cashback percentage (3-40%)
- 6-digit PIN code
- Digital signature
- Agreement acceptance

**Authentication:**
- Login: `cell_phone` OR `email` + `pin_code`
- Session: 30 days (if "Remember Me" checked)
- Status validation on login

**Key Capabilities:**
- Process member transactions
- Issue cashback rewards
- Register new members at point of sale
- View transaction history
- Access monthly invoices
- Manage shop profile
- Chat with admin
- View linked agent information

**Status Flow:**
```
Registration → pending
    ↓
Admin Approval → active
    ↓
(If invoice unpaid) → suspended
    ↓
(After payment) → active
```

**Database Table:** `partners`
```sql
- id (uuid, primary key)
- shop_name
- first_name, last_name
- cell_phone (unique, authentication)
- email
- pin_code (6 digits)
- address, latitude, longitude
- cashback_percent (3-40)
- category
- status ('pending', 'active', 'suspended', 'rejected')
- suppliers (jsonb)
- suppliers_updated_at
- agent_id (foreign key)
- created_at
```

---

### 2.3 Agent

**Definition:** A sales representative who recruits partner businesses and earns commission on their transactions.

**Registration Requirements:**
- First name and surname
- South African ID number
- Mobile number (unique)
- Email address
- ID document upload (JPG/PNG/PDF, max 5MB)
- 6-digit PIN code
- Digital signature
- Agreement acceptance

**Authentication:**
- Login: `cell_phone` + `pin_code`
- Session: 30 days (if "Remember Me" checked)

**Key Capabilities:**
- Recruit partner businesses
- Onboard new partners (3-step process)
- View linked partner shops
- Track commission earnings
- View partner performance
- Resend partner login details
- Support partner shops
- Access commission reports

**Commission Structure:**
- **Rate:** 1% of every transaction at recruited partners
- **Calculation:** Based on purchase amount (not cashback amount)
- **Payout:** Monthly (5th of each month)
- **Minimum:** R500 threshold

**Database Table:** `agents`
```sql
- id (uuid, primary key)
- first_name, last_name
- cell_phone (unique, authentication)
- email
- pin_code (6 digits)
- sa_id
- status ('pending', 'active', 'suspended')
- created_at
```

---

### 2.4 Admin

**Definition:** System administrator with full platform management capabilities.

**Authentication:**
- Login: Email + Password (Supabase Auth)
- Stored as member with `role='admin'`

**Key Capabilities:**
- Approve/reject partners, agents, providers
- Manage all user accounts
- Monitor cover plan progress
- Generate and manage invoices
- Process top-up requests
- Handle disputes
- Manage system settings
- Access all dashboards
- Chat with members/partners

**Access Level:** Full system access (bypasses Row Level Security)

---

### 2.5 Insurance Provider (Policy Provider)

**Definition:** Medical cover company (e.g., Day1Health) that receives funded policy data.

**Authentication:**
- Login: Email + Password (currently hardcoded)
- Credentials: `day1health` / `day1health2024`

**Key Capabilities:**
- View active cover plans
- View in-progress cover plans
- View paused cover plans
- Export policy data (CSV)
- View member details
- View linked dependants
- Monitor funding status
- Track active dates

**Database Table:** `policy_providers`
```sql
- id (uuid, primary key)
- provider_name (e.g., "Day1 Health")
- email (unique)
- password (hashed)
- status ('active', 'inactive')
- created_at
```

---

### 2.6 Driver (Plus1-Go)

**Definition:** Delivery driver who fulfills Plus1-Go orders.

**Registration Requirements:**
- First name and last name
- Mobile number (unique)
- 6-digit PIN code
- Vehicle type, make, color, registration
- Driver license number
- License photo upload

**Authentication:**
- Login: `cell_phone` + `pin_code`

**Key Capabilities:**
- Accept delivery requests
- Track active deliveries
- Update delivery status
- View earnings
- Manage online/offline status
- GPS location tracking
- View delivery history

**Earnings Structure:**
- **Rate:** 93% of delivery fee
- **System:** 5% of delivery fee
- **Agent:** 2% of delivery fee

**Database Table:** `drivers`
```sql
- id (uuid, primary key)
- first_name, last_name
- cell_phone (unique, authentication)
- pin_code (6 digits)
- vehicle_type, vehicle_make, vehicle_color
- vehicle_registration
- license_number, license_photo_url
- status ('pending', 'active', 'suspended')
- current_status ('offline', 'online', 'busy')
- latitude, longitude
- created_at
```

---

## 3. Core Business Logic

### 3.1 Cashback Model

#### Cashback Split Formula

```
Partner sets cashback rate: 3% - 40%

For every transaction:
- System Fee: 1% of purchase amount
- Agent Commission: 1% of purchase amount
- Member Cashback: (Cashback Rate - 2%) of purchase amount
```

#### Example Calculations

**Example 1: 7% Cashback**
```
Purchase: R1,000
Cashback Rate: 7%

Split:
- Total Cashback: R1,000 × 7% = R70
- System Fee: R1,000 × 1% = R10
- Agent Commission: R1,000 × 1% = R10
- Member Cashback: R1,000 × 5% = R50

Member receives R50 toward cover plan
```

**Example 2: 15% Cashback**
```
Purchase: R500
Cashback Rate: 15%

Split:
- Total Cashback: R500 × 15% = R75
- System Fee: R500 × 1% = R5
- Agent Commission: R500 × 1% = R5
- Member Cashback: R500 × 13% = R65

Member receives R65 toward cover plan
```

**Example 3: Minimum 3% Cashback**
```
Purchase: R200
Cashback Rate: 3%

Split:
- Total Cashback: R200 × 3% = R6
- System Fee: R200 × 1% = R2
- Agent Commission: R200 × 1% = R2
- Member Cashback: R200 × 1% = R2

Member receives R2 toward cover plan
```

---

### 3.2 Cover Plan System

#### Cover Plan Structure

**Default Plan:**
- Name: "Day1 Health Basic"
- Monthly Target: R390
- Provider: Day1 Health
- Cycle: 30 days

#### Member Cover Plan Statuses

```typescript
type CoverPlanStatus = 
  | 'in_progress'  // 0-99% funded
  | 'pending'      // 100% funded, awaiting verification
  | 'active'       // Verified and active (30-day cycle)
  | 'paused'       // 100% funded but profile incomplete
  | 'suspended';   // Insufficient funds for next cycle
```

#### Status Flow

```
[Registration]
    ↓
[in_progress] (0-99% funded)
    ↓
[90% reached] → Profile completion warning (dismissible)
    ↓
[95% reached] → Profile completion mandatory (dismiss once)
    ↓
[96% reached] → Profile completion critical (cannot dismiss)
    ↓
[100% reached]
    ↓
Profile Complete?
    ↓ YES                    ↓ NO
[pending]                [paused]
    ↓                        ↓
Day1Health           Complete Profile
Verification              ↓
    ↓                   [pending]
[active]                   ↓
(30 days)              [active]
    ↓
[30 days end]
    ↓
Sufficient Funds?
    ↓ YES                    ↓ NO
[active]              [suspended]
(renew)                    ↓
                    Shop/Top-up
                         ↓
                     [active]
```


#### Profile Completion Requirements

**Required Fields:**
- Valid email address (not placeholder)
- South African ID number
- Complete physical address (address_line_1, city, postal_code)

**Triggers:**
- 90%: Warning modal (dismissible)
- 95%: Mandatory modal (dismiss once)
- 96%: Critical modal (cannot dismiss)
- 100%: Plan pauses if incomplete, pending if complete

---

### 3.3 Overflow Cashback

#### What is Overflow?

Overflow is cashback earned AFTER a cover plan reaches 100% funding (target amount).

#### Overflow Scenarios

**Scenario 1: Single Plan with Overflow**
```
Target: R390
Funded: R390 (100%)
New Transaction: R50 cashback

Result:
- Funded Amount: R390 (stays at target)
- Overflow Balance: R50
```

**Scenario 2: Overflow Helps Next Cycle**
```
Month 1:
- Target: R390
- Funded: R390
- Overflow: R50
- Status: Active (30 days)

Month 2 (after 30 days):
- Target: R390
- Available: R50 (overflow from Month 1)
- Needed: R340 more
- Status: In Progress
```

**Scenario 3: Overflow Funds Upgrade**
```
Current Plan: R390 (100% funded)
Overflow: R275
Upgrade to: R665 plan
Upgrade Cost: R275

Action: Use overflow to upgrade
Result:
- New Plan: R665
- Funded: R665
- Overflow: R0
- Status: Active
```

#### Overflow Allocation Rules

1. **Priority Order:** Overflow fills plans based on `creation_order`
2. **Automatic Allocation:** System automatically allocates to next unfunded plan
3. **Storage:** Overflow stored in first plan (creation_order: 1)

---

### 3.4 Multi-Plan Funding

#### Creation Order System

Members can have multiple cover plans (main + dependants). Plans are funded in order of creation.

```
Plan A (created first)  → creation_order: 1 (funded first)
Plan B (created second) → creation_order: 2 (funded second)
Plan C (created third)  → creation_order: 3 (funded third)
```

#### Funding Flow Example

```
New cashback earned: R100

Step 1: Check Plan A (creation_order: 1)
- Current: R350 / R390
- Add: R40 (reaches R390)
- Remaining: R60

Step 2: Check Plan B (creation_order: 2)
- Current: R200 / R390
- Add: R60 (reaches R260)
- Remaining: R0

Result:
- Plan A: R390 / R390 (100%)
- Plan B: R260 / R390 (66.7%)
- Plan C: R0 / R390 (0%)
```

---

### 3.5 Top-Up System

#### What is Top-Up?

Top-up allows members to manually add funds to cover plans when cashback is insufficient.

#### Top-Up Methods

**Method 1: EFT (Electronic Funds Transfer)**
- Member does bank transfer
- Uploads proof of payment
- Admin reviews and approves

**Method 2: Instant EFT**
- Member clicks "Do Instant EFT" button
- Opens chat with admin
- Admin provides banking details
- Member completes payment
- Admin confirms and credits account

#### Top-Up Process

```
Member Dashboard
    ↓
Click "Top-Up"
    ↓
Select cover plan
    ↓
Enter amount
    ↓
Choose payment method
    ↓
Upload proof (if EFT)
    ↓
Status: Pending
    ↓
Admin reviews
    ↓
Admin approves
    ↓
Funds added to cover plan
    ↓
Status updated
```

#### Top-Up Scenarios

**Partial Top-Up:**
```
Target: R390
Funded: R300
Shortfall: R90

Member tops up: R50
New Funded: R350
Still needs: R40
```

**Full Top-Up:**
```
Target: R390
Funded: R300
Shortfall: R90

Member tops up: R90
New Funded: R390
Status: Pending verification
```

**Excess Top-Up:**
```
Target: R390
Funded: R300
Shortfall: R90

Member tops up: R150
New Funded: R390
Overflow: R60
```

---

### 3.6 Transaction Processing

#### Transaction Flow

```
1. Member shops at Partner
    ↓
2. Member provides identification (phone or QR code)
    ↓
3. Partner enters purchase amount
    ↓
4. System calculates cashback split
    ↓
5. Transaction created in database
    ↓
6. Wallet updated (or created)
    ↓
7. Cover plan funded
    ↓
8. Wallet entry recorded
    ↓
9. Member sees updated progress
```

#### Transaction Database Record

```typescript
interface Transaction {
  id: string;
  member_id: string;
  partner_id: string;
  agent_id: string;
  purchase_amount: number;
  cashback_percent: number;
  member_amount: number;        // Member cashback
  partner_contribution: number; // Partner pays
  agent_amount: number;         // Agent commission (1%)
  system_amount: number;        // Platform fee (1%)
  status: 'completed' | 'pending' | 'reversed' | 'disputed';
  transaction_time: time;
  is_spend: boolean;            // false = earn, true = spend
  created_at: timestamp;
  synced_at: timestamp;
}
```

---

### 3.7 Invoice System

#### Partner Billing Cycle

```
Month: Transactions occur
    ↓
Month End: Invoice generated
    ↓
Invoice shows:
- Total cashback issued
- Total transactions
- Amount due
    ↓
Due Date: Set by admin
    ↓
Grace Period: Optional
    ↓
Payment: Partner pays
    ↓
Status: Marked as paid
    ↓
(If not paid)
    ↓
Late Notice sent
    ↓
Suspension: Partner suspended
    ↓
(After payment)
    ↓
Reactivation: Partner active again
```

#### Invoice Structure

```typescript
interface Invoice {
  id: string;
  partner_id: string;
  invoice_month: string;        // 'YYYY-MM'
  total_cashback_issued: number;
  total_transactions: number;
  status: 'pending' | 'sent' | 'paid' | 'overdue';
  due_date: date;
  paid_at: timestamp;
  created_at: timestamp;
}
```

---

## 4. Member Dashboard Functions

### 4.1 Dashboard Overview (`/member/dashboard`)

**Primary Functions:**
1. View profile summary
2. Display QR code
3. Track cover plan progress
4. View recent transactions
5. Manage linked people
6. Access quick actions

**Key Components:**

#### Profile Section
- Profile picture placeholder
- Member name and contact info
- Active status badge
- Edit profile button
- QR code quick access

#### Cover Plan Progress
- Visual progress bar
- Funded amount vs target amount
- Percentage completion
- Overflow balance display
- Plan status indicators
- Active dates (if active)

#### Quick Stats Cards
- Total cashback earned (all time)
- Current month earnings
- Active cover plans count
- Linked people count

#### Recent Activity
- Last 3 transactions
- Partner name and cashback amount
- Transaction dates and times

#### Linked People Section
- Dependants list
- Sponsored individuals
- Status for each person
- Cover plan associations

**Modals:**
- QR Code Modal (full-screen display)
- Upgrade Prompt Modal (when overflow ≥ upgrade cost)
- Profile Incomplete Modal (at 90%+ funding)
- Pending Verification Modal (at 100% funding)
- Plan Selection Modal (if no plan assigned)

---

### 4.2 Cover Plans Management (`/member/cover-plans`)

**Functions:**
1. View all owned cover plans
2. View sponsored plans
3. Track funding progress
4. View linked people per plan
5. View plan status and dates

**Display Information:**
- Plan name and creation order
- Target amount and funded amount
- Progress percentage
- Status (active/in_progress/paused/suspended)
- Active dates (for active plans)
- Linked people count
- Expandable sections for linked people details

---

### 4.3 Transaction History (`/member/transactions`)

**Functions:**
1. View complete transaction history
2. Filter by date range
3. View summary statistics
4. Export transaction data

**Filter Options:**
- Today
- Last 7 days
- Last 30 days
- All time

**Summary Cards:**
- Total transactions count
- Total purchases amount
- Total cashback earned

**Transaction Details:**
- Partner shop name
- Purchase amount
- Cashback earned
- Cashback percentage
- Transaction date and time
- Transaction status

---

### 4.4 Top-Up Function (`/member/top-up`)

**Functions:**
1. Initiate top-up request
2. Select cover plan to top-up
3. Enter top-up amount
4. Choose payment method
5. Upload proof of payment
6. Chat with admin for instant EFT

**Process:**
1. Click "Start Chat with Admin"
2. Specify which cover plan
3. Receive banking details
4. Make EFT payment
5. Upload proof
6. Admin confirms
7. Account credited

---

### 4.5 QR Code Display (`/member/qr`)

**Functions:**
1. Display large QR code
2. Show member information
3. Download QR code
4. Share QR code

**QR Code Format:**
```
PLUS1-{phone}-{timestamp}
```

**Usage:**
- Partner scans at point of sale
- Instant member identification
- No need to enter phone number

---

### 4.6 Find Partners (`/member/find-partners`)

**Functions:**
1. Search partner businesses
2. Filter by location
3. Filter by category
4. View partner details
5. View cashback rates
6. Get directions

---

### 4.7 Add Dependant (`/member/add-dependant`)

**Functions:**
1. Add family members to cover
2. Enter dependant information
3. Select relationship
4. Upload ID document
5. Assign cover plan
6. Submit for approval

**Required Information:**
- Full name
- ID number
- Date of birth
- Relationship to member
- ID document upload

---

### 4.8 Sponsor Someone (`/member/sponsor`)

**Functions:**
1. Sponsor another person's cover
2. Enter beneficiary details
3. Set payment commitment
4. Review sponsorship terms
5. Submit sponsorship

---

### 4.9 Support & Chat (`/member/support`, `/member/chat`)

**Functions:**
1. Access FAQ section
2. Contact admin directly
3. View support tickets
4. Real-time chat with admin
5. File attachments
6. View message history

---

## 5. Partner Dashboard Functions

### 5.1 Dashboard Overview (`/partner/dashboard`)

**Primary Functions:**
1. View sales overview
2. Track today's performance
3. Access transaction history
4. View monthly invoice
5. Manage shop profile
6. Quick transaction processing

**Key Sections:**

#### Stats Cards
- Today's sales total
- Today's cashback issued
- Total members served
- Monthly revenue

#### Recent Transactions
- Last 10 transactions
- Member names
- Purchase amounts
- Cashback issued
- Transaction times

#### Quick Actions
- Process transaction
- View invoice
- Register member
- Contact admin

---

### 5.2 Sales Terminal (`/partner/sales-terminal`, `/partner/sales`)

**Primary Functions:**
1. Search for members
2. Process transactions
3. Issue cashback
4. Register new members
5. View recent sales

**Search Methods:**

**Method 1: Phone Number Search**
- Enter 10-digit phone number
- System looks up member
- Verifies member is active
- Displays member information

**Method 2: QR Code Search**
- Manual QR code entry
- Camera scanner option
- Real-time scanning
- Instant member lookup

**Transaction Process:**
1. Search for member (phone or QR)
2. Verify member status is active
3. Enter purchase amount
4. System calculates cashback split automatically
5. Display breakdown to partner
6. Confirm transaction
7. Process and update member's cover plan
8. Show success confirmation

**Cashback Calculation Display:**
```
Purchase Amount: R1,000
Cashback Rate: 7%

Breakdown:
- Total Cashback: R70
- System Fee: R10 (1%)
- Agent Commission: R10 (1%)
- Member Receives: R50 (5%)

Partner Pays: R70
```

**Recent Sales Sidebar:**
- Last 10 transactions
- Member name and phone
- Purchase amount
- Cashback earned
- Transaction time
- Quick reference

---

### 5.3 Member Registration (`/partner/member-registration`)

**Functions:**
1. Register new members at point of sale
2. Touch-friendly interface
3. Numeric keypad for input
4. Step-by-step process
5. Immediate account creation

**Registration Fields:**
- First name
- Last name
- Phone number (10 digits)
- Date of birth (18+ validation)
- 6-digit PIN
- PIN confirmation
- Terms acceptance

**Process:**
1. Partner initiates registration
2. Customer provides information
3. Partner enters details via keypad
4. System validates age (18+) and phone uniqueness
5. Member account created instantly
6. QR code generated
7. Default cover plan assigned (R390)
8. Redirect to sales terminal
9. Can immediately process first transaction

---

### 5.4 Transaction History (`/partner/transaction-history`)

**Functions:**
1. View all processed transactions
2. Filter by date range
3. Search by member
4. Export to CSV
5. View transaction details

**Display Information:**
- Transaction date and time
- Member name and phone
- Purchase amount
- Cashback issued
- Transaction status
- Transaction ID

---

### 5.5 Monthly Invoice (`/partner/monthly-invoice`)

**Functions:**
1. View current month invoice
2. View past invoices
3. Download invoice PDF
4. View payment status
5. See transaction breakdown

**Invoice Details:**
- Invoice number
- Invoice month
- Total cashback issued
- Total transactions
- Amount due
- Due date
- Payment status
- Transaction list

---

### 5.6 Shop Profile (`/partner/profile`)

**Functions:**
1. Edit business information
2. Upload shop logo
3. Update contact details
4. View cashback rate
5. View linked agent
6. Update address

**Editable Fields:**
- Business name
- Contact person
- Phone number
- Email address
- Physical address
- Business category

---

### 5.7 Support (`/partner/support`)

**Functions:**
1. Access FAQ section
2. Contact admin
3. Technical support
4. View documentation
5. Report issues

---

## 6. Agent Dashboard Functions

### 6.1 Dashboard Overview (`/agent/dashboard`)

**Primary Functions:**
1. View commission overview
2. Manage partner shops
3. Track recruitment performance
4. View earnings

**Key Sections:**

#### Profile Summary
- Agent name and contact
- Total commission earned (all time)
- Account status
- Registration date

#### Stats Cards
- Total shops recruited
- Active shops
- Suspended shops
- This month's commission
- Pending commission
- Total paid out

#### Partner Shops List
- Shop name and status
- Cashback percentage
- Monthly commission from shop
- Contact information
- Action buttons:
  - View details
  - Resend login credentials
  - Contact shop
  - View transactions

**Quick Actions:**
- Add partner shop
- View commission breakdown
- Contact admin
- View agent agreement PDF

---

### 6.2 Add Partner Shop (`/agent/add-shop`)

**Functions:**
1. Recruit new partner businesses
2. 3-step onboarding process
3. Collect business information
4. Digital signature capture
5. Create partner-agent link

**Step 1: Shop Details**
- Business name
- Category selection
- Physical address and postal code
- Contact person name
- Cell phone and email
- Login credentials (phone + 6-digit PIN)
- Cashback percentage (3-40%)
- Cashback split preview

**Step 2: Agreement**
- Display partner agreement
- Digital signature canvas
- Terms review
- Signature capture

**Step 3: Confirmation**
- Review all details
- Confirm connection
- Upload signature to storage
- Create partner record
- Link to agent
- Set status to "pending"
- Admin approval required

**Validation:**
- Duplicate phone/email check
- Cashback range validation (3-40%)
- PIN format check (6 digits)
- Signature required

---

### 6.3 Commission Tracking (`/agent/commission`)

**Functions:**
1. View total earnings
2. Monthly breakdown
3. Partner-wise commission
4. Transaction history
5. Payout information

**Summary Stats:**
- Total earned (all time)
- Total paid out
- Pending payout
- Current month earnings

**Current Month Breakdown:**
- Commission by partner
- Transaction count per partner
- Amount earned per partner
- Percentage of total

**Transaction History:**
- Date and time
- Member name
- Partner shop
- Purchase amount
- Agent commission (1%)
- Transaction ID

**Payout Information:**
- Minimum threshold: R500
- Payout date: 5th of each month
- Payout method: EFT
- Banking details on file

---

### 6.4 Shop Detail View (`/agent/shop/:partnerId`)

**Functions:**
1. View detailed shop performance
2. Transaction history for shop
3. Commission breakdown
4. Contact information
5. Shop status

**Display Information:**
- Shop name and category
- Contact person
- Phone and email
- Address
- Cashback percentage
- Status
- Total transactions
- Total commission earned
- Monthly performance
- Recent transactions

---

### 6.5 Agent Profile (`/agent/profile`)

**Functions:**
1. Edit personal information
2. Update contact details
3. View agent agreement
4. View performance summary
5. Update banking details

---

### 6.6 Support (`/agent/support`)

**Functions:**
1. Access FAQ section
2. Contact admin
3. Commission queries
4. Technical support
5. Partner support resources

---


## 7. Admin Dashboard Functions

### 7.1 Dashboard Overview (`/admin/dashboard`)

**Primary Functions:**
1. Comprehensive platform monitoring
2. Multi-tab interface for different entities
3. Real-time statistics
4. Alert system
5. Quick actions

**Dashboard Tabs:**

#### Tab 1: Overview
- 16 KPI cards showing platform health
- Entity counts (members, partners, agents, providers)
- Financial overview (revenue, rewards, commissions)
- Operational stats (transactions, invoices)
- System health indicators

**KPI Categories:**

**Entities:**
- Total Members
- Active Members
- Total Partners
- Active Partners
- Total Agents
- Active Agents
- Total Providers

**Policies:**
- Total Policies
- Active Policies
- In Progress Policies
- Total Policy Value

**Financial:**
- Total Revenue
- Total Rewards Issued
- Total Commissions
- Outstanding Invoices

**Operational:**
- Total Transactions
- Today's Transactions
- Pending Approvals
- System Health Score

#### Tab 2: Members
- Complete member list
- Search and filter
- Status management
- Profile verification alerts
- Suspension capabilities
- View member details
- Edit member information

#### Tab 3: Member Policies
- Policy management interface
- Status updates (in_progress → pending → active)
- Verification workflow
- Funding progress tracking
- Linked people management

#### Tab 4: Notifications
- System notifications
- Admin alerts
- Priority flagging
- Action items
- Dismissal tracking
- Notification types:
  - Profile incomplete warnings
  - Suspended partners
  - Overdue invoices
  - Pending approvals
  - System errors

#### Tab 5: Shops (Partners)
- Partner list with search
- Approval workflow
- Status management (active/suspended/rejected)
- View partner details
- Edit partner information
- Suspension/reactivation

#### Tab 6: Agents
- Agent list
- Application approval workflow
- Commission tracking
- Performance metrics
- Status updates
- View agent details

#### Tab 7: Pending Day1Health
- Cover plans awaiting verification
- Approval workflow
- Member profile review
- Activate cover plans
- Batch processing

#### Tab 8: Policies
- All policies overview
- Status filtering
- Funding tracking
- Export capabilities

#### Tab 9: Transactions
- Transaction monitoring
- Financial tracking
- Search and filter
- Dispute management
- Reversal capabilities

**Alert System:**
- Profile incomplete at 90%+ (yellow)
- Profile incomplete at 95%+ (orange)
- Profile incomplete at 96%+ (red)
- Suspended partners (red)
- Overdue invoices (red)
- Pending approvals (blue)
- System health warnings (yellow/red)

**Quick Actions:**
- Generate partner invoices
- Manage partners
- Process agent commissions
- System settings

---

### 7.2 Approvals Management (`/admin/approvals`)

**Functions:**
1. Centralized approval workflow
2. Pending partners review
3. Pending agents review
4. Pending providers review
5. Bulk approval capabilities

**Approval Process:**

**Partner Approval:**
1. Review business information
2. Verify contact details
3. Check cashback percentage
4. Review digital signature
5. Approve or reject
6. Send notification
7. Status changes to "active" or "rejected"

**Agent Approval:**
1. Review personal information
2. Verify ID document
3. Check digital signature
4. Approve or reject
5. Send notification
6. Status changes to "active" or "rejected"

**Provider Approval:**
1. Review provider information
2. Verify credentials
3. Approve or reject
4. Grant dashboard access

---

### 7.3 Member Management (`/admin/members`)

**Functions:**
1. View all members
2. Search by name, phone, email
3. Filter by status
4. View member details
5. Edit member information
6. Suspend/reactivate members
7. View cover plans
8. View transaction history
9. Process top-ups
10. Handle disputes

**Member Details View:**
- Personal information
- Contact details
- Cover plans and progress
- Transaction history
- Linked people
- Top-up history
- Dispute history
- Account status
- Registration date

**Actions:**
- Edit profile
- Suspend account
- Reactivate account
- Approve top-up
- View QR code
- Reset PIN

---

### 7.4 Partner Management (`/admin/partners`)

**Functions:**
1. View all partners
2. Search and filter
3. Approve pending partners
4. Suspend partners
5. Reactivate partners
6. Edit partner information
7. View partner transactions
8. Generate invoices
9. View linked agent

**Partner Details View:**
- Business information
- Contact details
- Cashback percentage
- Linked agent
- Transaction history
- Invoice history
- Status
- Registration date

**Actions:**
- Approve application
- Reject application
- Suspend partner
- Reactivate partner
- Edit details
- Generate invoice
- View transactions
- Contact partner

**Suspension Reasons:**
- Overdue invoice
- Terms violation
- Fraud detection
- Manual suspension

---

### 7.5 Agent Management (`/admin/agents`)

**Functions:**
1. View all agents
2. Approve pending agents
3. View agent performance
4. Track commissions
5. Manage payouts
6. View recruited partners
7. Suspend/reactivate agents

**Agent Details View:**
- Personal information
- Contact details
- ID document
- Recruited partners list
- Commission history
- Payout history
- Performance metrics
- Status

**Actions:**
- Approve application
- Reject application
- Suspend agent
- Reactivate agent
- Process payout
- View commission breakdown
- View recruited partners

---

### 7.6 Invoice Management (`/admin/invoices`)

**Functions:**
1. Generate monthly invoices
2. View all invoices
3. Filter by status
4. Mark invoices as paid
5. Send payment reminders
6. Track overdue invoices
7. Export invoice data

**Invoice Generation Process:**
1. Select month
2. System calculates total cashback per partner
3. Generate invoice records
4. Set due dates
5. Send to partners
6. Track payment status

**Invoice Statuses:**
- Pending: Generated but not sent
- Sent: Sent to partner
- Paid: Payment received
- Overdue: Past due date
- Disputed: Under dispute

**Actions:**
- Generate invoice
- Send invoice
- Mark as paid
- Send reminder
- Apply grace period
- Suspend partner (if overdue)
- Export invoice

---

### 7.7 Commission Management (`/admin/commissions`)

**Functions:**
1. Calculate agent commissions
2. Process monthly payouts
3. View commission breakdown
4. Track payout history
5. Export commission reports

**Commission Calculation:**
- Automatic calculation based on transactions
- 1% of purchase amount at recruited partners
- Monthly aggregation
- Minimum R500 threshold

**Payout Process:**
1. Calculate monthly commissions
2. Filter agents meeting R500 minimum
3. Generate payout list
4. Process payments
5. Mark as paid
6. Send confirmation

---

### 7.8 Transaction Management (`/admin/transactions`)

**Functions:**
1. View all transactions
2. Search and filter
3. Monitor transaction flow
4. Handle disputes
5. Reverse transactions
6. Export transaction data

**Transaction Details:**
- Transaction ID
- Date and time
- Member information
- Partner information
- Purchase amount
- Cashback breakdown
- Status
- Synced status

**Actions:**
- View details
- Reverse transaction
- Mark as disputed
- Add notes
- Export data

---

### 7.9 Top-Up Management (`/admin/top-ups`)

**Functions:**
1. View all top-up requests
2. Review proof of payment
3. Approve/reject top-ups
4. Process payments
5. Update cover plans

**Top-Up Approval Process:**
1. Review top-up request
2. Verify proof of payment
3. Check banking details
4. Approve or reject
5. If approved:
   - Add funds to cover plan
   - Create wallet entry
   - Update funded amount
   - Send confirmation
6. If rejected:
   - Add rejection reason
   - Send notification

---

### 7.10 Dispute Management (`/admin/disputes`)

**Functions:**
1. View all disputes
2. Investigate issues
3. Resolve disputes
4. Reverse transactions
5. Add manual adjustments
6. Track resolution history

**Dispute Types:**
- Missing cashback
- Wrong amount
- Duplicate transaction
- Unauthorized transaction
- System error

**Dispute Resolution Process:**
1. Review dispute details
2. Investigate transaction
3. Contact parties involved
4. Determine resolution
5. Take action (reverse, adjust, reject)
6. Add resolution notes
7. Close dispute
8. Send notifications

---

### 7.11 Cover Plan Management (`/admin/cover-plans`)

**Functions:**
1. Create cover plan templates
2. Edit existing plans
3. Set pricing
4. Assign to providers
5. Activate/deactivate plans

**Plan Configuration:**
- Plan name
- Monthly target amount
- Provider assignment
- Status (active/inactive)
- Description
- Benefits

---

### 7.12 Provider Management (`/admin/providers`)

**Functions:**
1. Add insurance providers
2. Manage provider access
3. View provider activity
4. Export policy data
5. Monitor integrations

---

### 7.13 System Settings (`/admin/settings`)

**Functions:**
1. Configure platform settings
2. Set system parameters
3. Manage email templates
4. Configure integrations
5. Set business rules

**Configurable Settings:**
- Default cover plan
- Minimum cashback rate (3%)
- Maximum cashback rate (40%)
- Commission rates
- Payout thresholds
- Invoice due dates
- Grace periods
- Email templates
- SMS templates

---

### 7.16 Chat Dashboard (`/admin/chat`)

**Functions:**
1. Manage member support chats
2. View active conversations
3. Respond to inquiries
4. View chat history
5. Priority flagging
6. Assign to team members

**Chat Features:**
- Real-time messaging
- File attachments
- Chat history
- Priority levels
- Status tracking (open/in progress/resolved)
- Response templates
- Internal notes

---

## 8. Insurance Provider Dashboard Functions

### 8.1 Provider Dashboard (`/provider/dashboard`)

**Primary Functions:**
1. View all cover plans
2. Filter by status
3. Export policy data
4. Monitor funding status
5. Track active policies

**Key Sections:**

#### Stats Cards
- Active plans count
- In progress plans count
- Paused plans count
- Total linked people

#### Key Metrics
- Active coverage summary
- In progress summary
- Portfolio value
- Monthly activations

#### Export Section
- CSV export for active plans
- Monthly batch submission
- Integration-ready format
- Custom date ranges

#### Cover Plans Table

**Tabbed Interface:**
- Active Plans
- In Progress Plans
- Paused Plans

**Display Information:**
- Member ID
- Member name and phone
- Plan name
- Monthly premium
- Funded amount
- Funding percentage
- Status
- Active from date
- Active to date
- Linked people count

**Export Format (CSV):**
```csv
Member ID, Member Name, Phone, Plan Name, Monthly Premium, Funded Amount, Status, Active From, Active To, Linked People, Month
```

**User Flow:**
1. Provider logs in
2. Views dashboard with all plans
3. Filters by status (active/in progress/paused)
4. Reviews member details
5. Exports active plans on 10th of month
6. Integrates with policy management system
7. Processes policy activations

**Integration Points:**
- CSV export for batch processing
- API endpoints (future)
- Real-time status updates
- Automated notifications

---

## 9. Driver Dashboard Functions (Plus1-Go)

### 9.1 Driver Dashboard

**Primary Functions:**
1. Manage online/offline status
2. View available delivery requests
3. Accept delivery orders
4. Track active deliveries
5. View earnings
6. View delivery history

**Key Sections:**

#### Status Control
- Toggle online/offline
- Current status indicator
- GPS location tracking
- Availability settings

#### Stats Cards
- Today's deliveries
- Today's earnings
- Total deliveries completed
- Average rating
- Total earnings

#### Available Deliveries
- New delivery requests
- Pickup location
- Delivery location
- Distance
- Delivery fee
- Estimated time
- Accept/Decline buttons

#### Active Deliveries
- Current delivery details
- Pickup address
- Delivery address
- Customer contact
- Order items
- Navigation assistance
- Status update buttons:
  - Picked up
  - In transit
  - Delivered

#### Delivery History
- Past deliveries
- Earnings per delivery
- Customer ratings
- Completion times

---

### 9.2 Delivery Request Flow

**Process:**
```
1. Member places order
    ↓
2. System finds available drivers in radius
    ↓
3. Driver receives notification
    ↓
4. Driver views delivery details
    ↓
5. Driver accepts delivery
    ↓
6. Driver status changes to "busy"
    ↓
7. Driver navigates to partner
    ↓
8. Driver picks up order
    ↓
9. Driver marks "Picked Up"
    ↓
10. Driver navigates to member address
    ↓
11. Driver delivers order
    ↓
12. Driver marks "Delivered"
    ↓
13. Earnings calculated and recorded
    ↓
14. Driver status returns to "online"
```

---

### 9.3 Driver Earnings

**Earnings Structure:**
- Driver receives: 93% of delivery fee
- System receives: 5% of delivery fee
- Agent receives: 2% of delivery fee

**Example:**
```
Delivery Fee: R50

Split:
- Driver: R46.50 (93%)
- System: R2.50 (5%)
- Agent: R1.00 (2%)
```

**Earnings Tracking:**
- Real-time calculation
- Daily totals
- Weekly totals
- Monthly totals
- Payout schedule

**Database Record:**
```typescript
interface DriverEarnings {
  id: string;
  driver_id: string;
  order_id: string;
  delivery_fee: number;
  driver_amount: number;    // 93%
  system_amount: number;    // 5%
  agent_amount: number;     // 2%
  status: 'pending' | 'paid';
  created_at: timestamp;
  paid_at: timestamp;
}
```

---

### 9.4 GPS and Location Tracking

**Functions:**
1. Real-time location updates
2. Route optimization
3. Distance calculation
4. ETA estimation
5. Geofencing for delivery radius

---

## 10. Plus1-Go Delivery System

### 10.1 What is Plus1-Go?

Plus1-Go is the delivery layer of the Plus1 Rewards ecosystem, allowing members to order products from partner shops and get delivery to their address while earning cashback.

**Key Features:**
- Order from partner shops
- Delivery or pickup options
- Earn cashback on purchases
- Build toward cover plans
- Track delivery in real-time

---

### 10.2 Plus1-Go Order Flow

```
1. Member browses partner shops on Plus1-Go app
    ↓
2. Member adds products to cart
    ↓
3. Member selects delivery or collection
    ↓
4. Member enters delivery address (if delivery)
    ↓
5. Member places order and pays
    ↓
6. Partner receives order notification
    ↓
7. Partner confirms and prepares order
    ↓
8. System assigns driver (if delivery)
    ↓
9. Driver accepts and picks up order
    ↓
10. Driver delivers to member
    ↓
11. Order marked as delivered
    ↓
12. Transaction created with cashback split
    ↓
13. Member cover plan funded with cashback
```

---

### 10.3 Plus1-Go Transaction Structure

Each Plus1-Go order creates multiple database records:

**1. Order Record (`orders` table)**
```typescript
interface Order {
  id: string;
  member_id: string;
  partner_id: string;
  driver_id: string;
  order_type: 'delivery' | 'pickup';
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: timestamp;
  confirmed_at: timestamp;
  delivered_at: timestamp;
}
```

**2. Order Items (`order_items` table)**
```typescript
interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: timestamp;
}
```

**3. Transaction Record (`transactions` table)**
- Purchase amount = order subtotal
- Cashback split (1% system, 1% agent, rest to member)
- Transaction type = "delivery"

**4. Driver Earnings (`driver_earnings` table)**
- Delivery fee split (93% driver, 5% system, 2% agent)

**5. Cover Plan Wallet Entry (`cover_plan_wallet_entries` table)**
- Cashback allocated to member's cover plan

---

### 10.4 Partner Role in Plus1-Go

**Partner Capabilities:**
- Enable delivery and/or pickup
- Set minimum order value
- Set delivery radius (km)
- Set average prep time
- Set opening hours
- Add products to catalog
- Manage product availability
- Receive order notifications
- Confirm orders
- Prepare orders
- Mark orders ready

**Product Catalog:**
```typescript
interface Product {
  id: string;
  partner_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  available: boolean;
  created_at: timestamp;
}
```

**Partner Settings:**
- delivery_enabled: true/false
- pickup_enabled: true/false
- minimum_order_value: number
- delivery_radius: number (km)
- average_prep_time: number (minutes)
- opening_hours: jsonb

---

### 10.5 Member Experience in Plus1-Go

**Member Functions:**
1. Browse partner shops
2. View product catalogs
3. Add items to cart
4. Select delivery or pickup
5. Enter delivery address
6. Place order
7. Track order status
8. View delivery on map
9. Receive order
10. Earn cashback
11. View order history

**Saved Addresses:**
- Members can save multiple delivery addresses
- Quick address selection
- Address validation
- GPS coordinates

---

## 11. Business Rules & Logic

### 11.1 Authentication Rules

**Member Authentication:**
- Login: cell_phone (10 digits) + pin_code (6 digits)
- Session: 30 days if "Remember Me" checked
- Status must be "active"
- No OTP required

**Partner Authentication:**
- Login: cell_phone OR email + pin_code (6 digits)
- Session: 30 days if "Remember Me" checked
- Status must be "active" (not pending/suspended/rejected)

**Agent Authentication:**
- Login: cell_phone (10 digits) + pin_code (6 digits)
- Session: 30 days if "Remember Me" checked
- Status must be "active"

**Admin Authentication:**
- Login: email + password (Supabase Auth)
- Stored as member with role='admin'
- Full system access

**Provider Authentication:**
- Login: email + password
- Currently hardcoded (day1health / day1health2024)
- Limited to dashboard access

**Driver Authentication:**
- Login: cell_phone (10 digits) + pin_code (6 digits)
- Status must be "active"

---

### 11.2 Cashback Rules

**Cashback Rate:**
- Minimum: 3%
- Maximum: 40%
- Set by partner during registration
- Can be changed by admin

**Cashback Split:**
- System: Always 1% of purchase amount
- Agent: Always 1% of purchase amount
- Member: (Cashback Rate - 2%) of purchase amount

**Validation:**
```typescript
if (cashbackRate < 3) {
  throw new Error('Minimum cashback rate is 3%');
}

if (cashbackRate > 40) {
  throw new Error('Maximum cashback rate is 40%');
}

const systemFee = purchaseAmount * 0.01;
const agentCommission = purchaseAmount * 0.01;
const memberCashback = purchaseAmount * ((cashbackRate - 2) / 100);
```

---

### 11.3 Cover Plan Rules

**Plan Activation:**
- Plan reaches 100% funding
- Profile must be complete (email, SA ID, address)
- Status changes to "pending"
- Day1Health verification required
- Admin activates plan
- Status changes to "active"
- Active for 30 days

**Plan Renewal:**
- After 30 days, check available funds
- If sufficient: Renew for another 30 days
- If insufficient: Status changes to "suspended"
- Member must shop more or top-up
- Once sufficient: Status returns to "active"

**Profile Completion:**
- Warning at 90% funding
- Mandatory at 95% funding
- Critical at 96% funding
- Plan pauses at 100% if incomplete
- Plan moves to pending when complete

---

### 11.4 Multi-Plan Rules

**Creation Order:**
- Plans funded in order of creation
- creation_order field determines priority
- First created plan fills first
- Overflow moves to next plan

**Dependant Plans:**
- Linked to main member
- Separate cover plan record
- Higher creation_order
- Funded after main plan

---

### 11.5 Invoice Rules

**Generation:**
- Monthly invoices generated at month end
- Total cashback issued during month
- Due date set by admin
- Grace period optional

**Payment:**
- Partner pays invoice amount
- Admin marks as paid
- If overdue: Late notice sent
- If still unpaid: Partner suspended
- After payment: Partner reactivated

---

### 11.6 Commission Rules

**Agent Commission:**
- 1% of purchase amount at recruited partners
- Calculated per transaction
- Aggregated monthly
- Minimum payout: R500
- Payout date: 5th of month

**Driver Earnings:**
- 93% of delivery fee
- Calculated per delivery
- Aggregated daily/weekly/monthly
- Payout schedule: TBD

---

### 11.7 Suspension Rules

**Partner Suspension:**
- Overdue invoice
- Terms violation
- Fraud detection
- Manual admin suspension
- Effect: Cannot process transactions
- Member sees: "Transaction error, contact administrator"

**Member Suspension:**
- Terms violation
- Fraud detection
- Manual admin suspension
- Effect: Cannot shop or earn cashback

**Agent Suspension:**
- Terms violation
- Fraud detection
- Manual admin suspension
- Effect: Cannot recruit partners or earn commission

---

### 11.8 Dispute Rules

**Dispute Types:**
- Missing cashback
- Wrong amount
- Duplicate transaction
- Unauthorized transaction
- System error

**Resolution Process:**
- Member/Partner submits dispute
- Admin investigates
- Admin determines resolution
- Actions: Reverse, adjust, reject
- Notifications sent
- Dispute closed

---

### 11.9 Top-Up Rules

**Eligibility:**
- Any member with cover plan
- Any amount (partial or full)
- Requires proof of payment

**Approval:**
- Admin reviews request
- Verifies proof of payment
- Approves or rejects
- If approved: Funds added to cover plan
- If rejected: Reason provided

---

### 11.10 Data Validation Rules

**Phone Numbers:**
- Must be 10 digits
- Must be unique per role
- Normalized (remove spaces, dashes)

**PIN Codes:**
- Must be exactly 6 digits
- Stored as plain text (security consideration)

**Email Addresses:**
- Must be valid format
- Must be unique per role
- Defaults to {phone}@plus1rewards.local if not provided

**Age Validation:**
- Must be 18+ for member registration
- Calculated from date_of_birth

**SA ID Numbers:**
- Required for agents
- Required for members (for policy activation)
- Format validation

---

## 12. Technical Architecture

### 12.1 Technology Stack

**Frontend:**
- React 19.2.4
- TypeScript 5.9.3
- Vite 8.0.0
- Tailwind CSS 4.2.1
- Framer Motion 12.38.0

**Backend:**
- Supabase (Backend-as-a-Service)
- PostgreSQL database
- Row Level Security (RLS)
- Real-time subscriptions

**State Management:**
- Zustand 5.0.11
- React Query (TanStack) 5.90.21
- IndexedDB (idb 8.0.3) for offline

**Routing:**
- React Router DOM 7.13.1

---

### 12.2 Database Architecture

**Key Tables:**
- members
- partners
- agents
- policy_providers
- drivers
- member_cover_plans
- cover_plans
- transactions
- cover_plan_wallet_entries
- wallets
- invoices
- top_ups
- disputes
- admin_notifications
- orders
- order_items
- products
- driver_earnings

**Authentication Model:**
- NO central users table
- Each role self-contained
- Role-specific authentication fields
- Custom session management

---

### 12.3 Offline Capabilities

**IndexedDB Storage:**
- Offline transaction queue
- Member data cache
- Wallet data cache
- Sync queue

**Sync Process:**
- Detect online status
- Process sync queue
- Update database
- Clear queue
- Refresh UI

---

### 12.4 Security Features

**Authentication:**
- PIN-based for most roles
- Password-based for admin
- Session expiry
- Status validation

**Authorization:**
- Row Level Security (RLS)
- Role-based access control
- Service role for admin

**Data Protection:**
- POPIA compliance
- Secure storage
- Audit logging

---

## Conclusion

Plus1 Rewards is a comprehensive healthcare funding platform with six distinct user roles, each with specific functions and capabilities. The system operates on a transparent cashback model that funds medical cover plans through everyday shopping, making healthcare coverage accessible to more South Africans.

The platform includes:
- **Member Dashboard:** Track cover plans, earn cashback, manage dependants
- **Partner Dashboard:** Process transactions, manage shop, view invoices
- **Agent Dashboard:** Recruit partners, track commissions, support shops
- **Admin Dashboard:** Comprehensive platform management and monitoring
- **Provider Dashboard:** View and export funded policy data
- **Driver Dashboard:** Fulfill deliveries, track earnings (Plus1-Go)

All roles work together in an ecosystem that benefits members, businesses, agents, and healthcare providers while creating a sustainable business model for the platform.

---

**Document Version:** 2.0  
**Last Updated:** April 9, 2026  
**Total Pages:** 60+  
**Total Roles:** 6  
**Total Dashboard Functions:** 100+

