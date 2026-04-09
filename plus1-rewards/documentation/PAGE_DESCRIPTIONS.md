# Plus1 Rewards - Complete Page Descriptions

This document provides highly detailed descriptions of every page in the Plus1 Rewards application.

---

## Public Pages

### Landing Page (`/`)
**File:** `src/pages/Landing.tsx`

**Purpose:** Main marketing and information page for Plus1 Rewards platform

**Key Features:**
- Animated hero section with call-to-action buttons
- "How It Works" section explaining the cashback system
- Cover status visualization showing funding progress
- Partner carousel displaying participating businesses
- Role-based information (Member, Partner, Agent)
- Offline feature highlights
- FAQ section
- Footer with links and contact information

**User Flow:**
- Visitors land here to learn about Plus1 Rewards
- Can navigate to login/register for different user types
- Provides comprehensive overview of the platform's value proposition

**Technical Details:**
- Uses Framer Motion for smooth animations
- Responsive design with mobile-first approach
- SEO optimized with meta tags
- Staggered animation loading for sections

---

### Terms of Service (`/terms-of-service`)
**File:** `src/pages/TermsOfService.tsx`

**Purpose:** Legal terms and conditions for platform usage

**Key Features:**
- Complete terms of service documentation
- Sections covering user agreements, liability, and usage policies
- Accessible from registration flows

---

### Privacy Policy (`/privacy-policy`)
**File:** `src/pages/PrivacyPolicy.tsx`

**Purpose:** Privacy policy and data protection information

**Key Features:**
- POPIA compliance documentation
- Data collection and usage policies
- User rights and data protection measures

---

## Member Pages

### Member Login (`/login`, `/member/login`)
**File:** `src/pages/MemberLogin.tsx`

**Purpose:** Authentication page for members to access their accounts

**Key Features:**
- Phone number (10 digits) and 6-digit PIN authentication
- "Remember me" option for 30-day session persistence
- Platform parameter support (rewards/go)
- Quick access links to partner login
- Forgot PIN functionality
- Session management (localStorage vs sessionStorage)

**Validation:**
- Phone number must be exactly 10 digits
- PIN must be exactly 6 digits
- Account status check (active/suspended)

**User Flow:**
1. Enter phone number and PIN
2. Optional: Check "Remember me"
3. System validates credentials
4. Redirects to member dashboard on success

---

### Member Register (`/register`, `/member/register`)
**File:** `src/pages/MemberRegister.tsx`

**Purpose:** New member registration and account creation

**Key Features:**
- Multi-step registration form
- Personal information collection (first name, last name, phone, DOB)
- Age validation (must be 18+)
- 6-digit PIN creation with confirmation
- Terms of Service and Privacy Policy acceptance
- Automatic QR code generation
- Platform-specific registration (rewards/go)

**Validation:**
- Phone number uniqueness check
- Age verification (18+ required)
- PIN matching confirmation
- Terms acceptance required

**User Flow:**
1. Enter personal details
2. Provide phone number and date of birth
3. Create 6-digit PIN
4. Accept terms and conditions
5. Account created with "active" status
6. Redirect to login page

**Technical Details:**
- No default cover plan assigned during registration
- QR code format: `PLUS1-{phone}-{timestamp}`
- Email defaults to `{phone}@plus1rewards.local` if not provided

---

### Member Dashboard (`/member/dashboard`)
**File:** `src/pages/DashboardNew.tsx`

**Purpose:** Main hub for members to view and manage their account

**Key Features:**
- Profile summary with QR code display
- Cover plan progress visualization
- Total cashback earned display
- Recent transactions list (last 3)
- Linked people (dependants/sponsored) overview
- Quick action buttons
- Profile editing capabilities
- Multiple modal interactions

**Key Sections:**
1. **Profile Header**
   - Profile picture placeholder
   - Member name and contact info
   - Active status badge
   - Edit profile button
   - QR code quick access

2. **Cover Plan Progress**
   - Visual progress bar
   - Funded amount vs target amount
   - Percentage completion
   - Overflow balance display
   - Plan status indicators

3. **Quick Stats**
   - Total cashback earned
   - Current month earnings
   - Active cover plans count

4. **Recent Activity**
   - Last 3 transactions
   - Partner name and cashback amount
   - Transaction dates

5. **Linked People**
   - Dependants list
   - Sponsored individuals
   - Status for each person

**Modals:**
- QR Code Modal (full-screen display)
- Upgrade Prompt Modal (when overflow ≥ plan amount)
- Profile Incomplete Modal (at 90%+ funding)
- Pending Verification Modal (at 100% funding)
- Plan Selection Modal (if no plan assigned)

**Profile Completion Checks:**
- Triggers at 90%, 95%, 96%, and 100% funding
- Required fields: valid email, SA ID, address
- Plan pauses at 100% if profile incomplete
- Changes to "pending" status when profile complete

**User Flow:**
- Members land here after login
- View overall account status
- Navigate to specific features via quick actions
- Manage profile and cover plans

---

### Member Cover Plans (`/member/cover-plans`)
**File:** `src/pages/MemberCoverPlans.tsx`

**Purpose:** Detailed view of all member cover plans

**Key Features:**
- List of all owned cover plans
- Sponsored plans display
- Plan progress visualization
- Linked people per plan
- Plan status indicators
- Expandable sections for linked people

**Plan Information Displayed:**
- Plan name and creation order
- Target amount and funded amount
- Progress percentage
- Status (active/in_progress/paused)
- Active dates (for active plans)
- Linked people count

**User Flow:**
- View all cover plans in one place
- Expand to see linked people details
- Navigate back to dashboard

---

### Member Transactions (`/member/transactions`)
**File:** `src/pages/MemberTransactions.tsx`

**Purpose:** Complete transaction history for member

**Key Features:**
- Filterable transaction list (today/week/month/all)
- Summary statistics
- Transaction details (partner, amount, cashback)
- Date and time stamps

**Summary Cards:**
- Total transactions count
- Total purchases amount
- Total cashback earned

**Filter Options:**
- Today
- Last 7 days
- Last 30 days
- All time

**Transaction Details:**
- Partner shop name
- Purchase amount
- Cashback earned
- Transaction date and time
- Cashback percentage

---

### Member Top-Up (`/member/top-up`)
**File:** `src/pages/MemberTopUp.tsx`

**Purpose:** Interface for members to add funds to cover plans

**Key Features:**
- Direct chat with admin for EFT payments
- How it works guide
- Top-up options (full/partial)
- Chat modal integration

**Process:**
1. Click "Start Chat with Admin"
2. Specify which cover plan to top up
3. Receive banking details from admin
4. Make EFT payment
5. Upload proof of payment
6. Admin confirms and credits account

---

### Member Policies (`/member/policies`)
**File:** `src/pages/MemberPolicies.tsx`

**Purpose:** Manage insurance policies and funding

**Key Features:**
- Policy overview with funding status
- Overflow management
- Policy progress tracking
- Total rewards display

**Policy Information:**
- Policy number and status
- Monthly premium amount
- Amount funded
- Start date
- Policy plan details
- Provider information

**Overflow Management:**
- Modal for handling excess funds
- Options to upgrade or redistribute

---

### Member QR Code (`/member/qr`)
**File:** `src/pages/MemberQR.tsx`

**Purpose:** Display member QR code for partner scanning

**Key Features:**
- Large QR code display
- Member information
- Download/share options
- Encoded member data for verification

---

### Member Find Partners (`/member/find-partners`)
**File:** `src/pages/MemberFindPartners.tsx`

**Purpose:** Search and locate partner businesses

**Key Features:**
- Partner search functionality
- Location-based filtering
- Partner details display
- Category filtering

---

### Member Scan Partner (`/member/scan-partner`)
**File:** `src/pages/MemberScanPartner.tsx`

**Purpose:** Scan partner QR codes for transactions

**Key Features:**
- Camera integration
- QR code scanning
- Partner verification
- Transaction initiation

---

### Member History (`/member/history`)
**File:** `src/pages/MemberHistory.tsx`

**Purpose:** Comprehensive activity history

**Key Features:**
- All transactions
- Cover plan changes
- Profile updates
- System notifications

---

### Member Linked People (`/member/linked-people`)
**File:** `src/pages/MemberLinkedPeople.tsx`

**Purpose:** Manage dependants and sponsored individuals

**Key Features:**
- Add dependants
- View linked people
- Status tracking
- Cover plan associations

---

### Add Dependant (`/member/add-dependant`)
**File:** `src/pages/AddDependant.tsx`

**Purpose:** Add family members to cover plan

**Key Features:**
- Dependant information form
- Relationship selection
- ID document upload
- Cover plan assignment

---

### Sponsor Someone (`/member/sponsor`)
**File:** `src/pages/SponsorSomeone.tsx`

**Purpose:** Sponsor another person's cover plan

**Key Features:**
- Sponsorship form
- Beneficiary details
- Payment commitment
- Sponsorship terms

---

### Member Support (`/member/support`)
**File:** `src/pages/MemberSupport.tsx`

**Purpose:** Help and support for members

**Key Features:**
- FAQ section
- Contact admin
- Support tickets
- Help documentation

---

### Member Chat (`/member/chat`)
**File:** `src/pages/MemberChat.tsx`

**Purpose:** Direct messaging with admin team

**Key Features:**
- Real-time chat interface
- Message history
- File attachments
- Admin responses

---

## Partner Pages

### Partner Login (`/partner/login`)
**File:** `src/pages/PartnerLogin.tsx`

**Purpose:** Authentication for partner businesses

**Key Features:**
- Mobile number OR email login
- 6-digit PIN authentication
- Remember me option (30 days)
- Status validation (active/pending/paused/rejected)
- Phone number normalization

**Validation:**
- 10-digit mobile number or valid email
- 6-digit PIN
- Account status check

**Status Handling:**
- Pending: Shows approval waiting message
- Paused: Contact admin message
- Rejected: Shows rejection reason
- Active: Grants access

---

### Partner Register (`/partner/register`)
**File:** `src/pages/PartnerRegister.tsx`

**Purpose:** New partner business registration

**Key Features:**
- 3-step registration process
- Business information collection
- Cashback percentage selection (3-40%)
- Digital signature capture
- Agreement acceptance

**Step 1: Business Details**
- Business name
- Category selection
- Physical address
- Postal code
- Responsible person name

**Step 2: Contact & Cashback**
- Cell phone number
- Email address
- Cashback percentage slider
- Split breakdown display (1% system, 1% agent, rest to member)

**Step 3: Security & Agreement**
- 6-digit PIN creation
- PIN confirmation
- Agreement summary
- Digital signature
- Terms acceptance

**Validation:**
- Duplicate business name check
- Duplicate phone/email check
- Cashback range: 3-40%
- PIN must be 6 digits

**User Flow:**
1. Enter business details
2. Set contact info and cashback rate
3. Create PIN and sign agreement
4. Status set to "pending" for admin approval
5. Redirect to login

---

### Partner Dashboard (`/partner/dashboard`)
**File:** `src/components/partner/PartnerDashboard.tsx`

**Purpose:** Main hub for partner business operations

**Key Features:**
- Sales overview
- Transaction history
- Monthly invoice access
- Shop profile management
- Quick transaction processing

**Key Sections:**
- Today's sales summary
- Recent transactions
- Monthly performance
- Quick action buttons

---

### Partner Sales Terminal (`/partner/sales-terminal`, `/partner/sales`)
**File:** `src/pages/PartnerSales.tsx`

**Purpose:** Process member transactions and issue cashback

**Key Features:**
- Dual search methods (phone/QR code)
- Camera scanner for QR codes
- Member verification
- Transaction processing
- Real-time cashback calculation
- Recent sales sidebar

**Search Methods:**
1. **Phone Number Search**
   - 10-digit phone input
   - Member lookup
   - Status verification

2. **QR Code Search**
   - Manual QR code entry
   - Camera scanner option
   - Real-time scanning

**Transaction Process:**
1. Search for member (phone or QR)
2. Verify member is active
3. Enter purchase amount
4. System calculates cashback split
5. Process transaction
6. Update member's cover plan funding

**Cashback Distribution:**
- System fee: 1%
- Agent commission: 1%
- Member cashback: (total % - 2%)

**Recent Sales Display:**
- Last 10 transactions
- Member name and phone
- Purchase amount
- Cashback earned
- Transaction time

---

### Partner Member Registration (`/partner/member-registration`)
**File:** `src/pages/PartnerMemberRegistration.tsx`

**Purpose:** Register new members at point of sale

**Key Features:**
- Touch-friendly interface
- Numeric keypad for input
- Step-by-step registration
- Immediate member creation
- Default cover plan assignment

**Registration Fields:**
- First name
- Last name
- Phone number (10 digits)
- Date of birth (18+ required)
- 6-digit PIN
- PIN confirmation
- Terms acceptance

**User Flow:**
1. Partner initiates registration
2. Customer provides information
3. Partner enters details via keypad
4. System validates age and phone
5. Member account created instantly
6. Redirect to sales terminal

**Technical Details:**
- Large touch targets for ease of use
- Visual feedback for each step
- Automatic QR code generation
- Default R390 cover plan assigned

---

### Partner Transaction History (`/partner/transaction-history`)
**File:** `src/components/partner/pages/TransactionHistory.tsx`

**Purpose:** View all processed transactions

**Key Features:**
- Filterable transaction list
- Date range selection
- Export functionality
- Transaction details

---

### Partner Monthly Invoice (`/partner/monthly-invoice`)
**File:** `src/components/partner/pages/MonthlyInvoice.tsx`

**Purpose:** View and download monthly cashback invoices

**Key Features:**
- Invoice generation
- Payment status
- Transaction breakdown
- Download PDF

---

### Partner Profile (`/partner/profile`)
**File:** `src/components/partner/PartnerShopProfile.tsx`

**Purpose:** Manage partner business profile

**Key Features:**
- Business information editing
- Logo upload
- Contact details update
- Cashback rate display

---

### Partner Support (`/partner/support`)
**File:** `src/pages/PartnerSupport.tsx`

**Purpose:** Help and support for partners

**Key Features:**
- FAQ section
- Contact admin
- Technical support
- Documentation access

---

## Agent Pages

### Agent Login (`/agent/login`)
**File:** `src/pages/AgentLogin.tsx`

**Purpose:** Authentication for sales agents

**Key Features:**
- Phone number and PIN authentication
- Remember me option
- Status validation
- Quick access links

**Status Handling:**
- Pending: Application pending approval
- Suspended: Account suspended message
- Rejected: Application rejected
- Active: Grants access

---

### Agent Register (`/agent/register`)
**File:** `src/pages/AgentRegister.tsx`

**Purpose:** New agent application and registration

**Key Features:**
- 3-step application process
- Personal information collection
- Document upload
- Digital signature
- Agreement acceptance

**Step 1: Personal Info**
- First name
- Surname
- ID number

**Step 2: Contact & Documents**
- Cell phone number
- Email address
- ID document upload (JPG/PNG/PDF, max 5MB)

**Step 3: Security & Agreement**
- 6-digit PIN creation
- PIN confirmation
- Agreement summary
- Digital signature
- Terms acceptance

**Commission Structure:**
- 1% of every transaction at recruited partners
- Monthly payouts
- Minimum R500 payout threshold

**User Flow:**
1. Enter personal details
2. Upload ID document
3. Create PIN and sign agreement
4. Status set to "pending"
5. Admin approval required
6. Redirect to login

---

### Agent Dashboard (`/agent/dashboard`)
**File:** `src/pages/AgentDashboard.tsx`

**Purpose:** Main hub for agent operations and commission tracking

**Key Features:**
- Commission overview
- Partner shop management
- Recruitment tracking
- Performance metrics

**Key Sections:**
1. **Profile Summary**
   - Agent name and contact
   - Total commission earned
   - Account status

2. **Stats Cards**
   - Total shops recruited
   - Active shops
   - Suspended shops
   - This month's commission

3. **Quick Actions**
   - Add partner shop
   - View commission breakdown
   - Contact admin
   - View agreement PDF

4. **Partner Shops List**
   - Shop name and status
   - Cashback percentage
   - Monthly commission
   - Contact information
   - Action buttons (view details, resend login, contact)

**Commission Calculation:**
- 1% of all transactions at recruited partners
- Real-time tracking
- Monthly aggregation

---

### Agent Add Partner (`/agent/add-shop`)
**File:** `src/pages/AgentAddPartner.tsx`

**Purpose:** Recruit and onboard new partner businesses

**Key Features:**
- 3-step partner onboarding
- Business information collection
- Agreement signing
- Partner-agent link creation

**Step 1: Shop Details**
- Business name
- Category selection
- Address and postal code
- Contact person
- Cell phone and email
- Login credentials (phone + PIN)
- Cashback percentage (3-40%)

**Step 2: Agreement**
- Partner agreement display
- Digital signature canvas
- Terms review

**Step 3: Confirmation**
- Review all details
- Confirm connection
- Upload signature to storage
- Create partner record
- Link to agent

**Validation:**
- Duplicate phone/email check
- Cashback range validation
- PIN format check
- Signature required

**Technical Details:**
- Partner status starts as "pending"
- Signature stored in Supabase storage
- Partner-agent link created in database
- Commission tracking begins immediately

---

### Agent Commission (`/agent/commission`)
**File:** `src/pages/AgentCommission.tsx`

**Purpose:** Detailed commission tracking and breakdown

**Key Features:**
- Total earnings display
- Monthly breakdown
- Partner-wise commission
- Transaction history
- Payout information

**Key Sections:**
1. **Summary Stats**
   - Total earned (all time)
   - Total paid out
   - Pending payout

2. **Current Month Breakdown**
   - Commission by partner
   - Transaction count per partner
   - Amount earned per partner

3. **Transaction History**
   - Date and time
   - Member name
   - Partner shop
   - Purchase amount
   - Agent commission (1%)

**Payout Information:**
- Minimum threshold: R500
- Payout date: 5th of each month
- Commission rate: 1% of transaction

---

### Agent Shop Detail (`/agent/shop/:partnerId`)
**File:** `src/pages/AgentShopDetail.tsx`

**Purpose:** Detailed view of recruited partner shop

**Key Features:**
- Shop performance metrics
- Transaction history
- Commission breakdown
- Contact information

---

### Agent Profile (`/agent/profile`)
**File:** `src/pages/AgentProfile.tsx`

**Purpose:** Manage agent profile information

**Key Features:**
- Personal information editing
- Contact details update
- Agreement viewing
- Performance summary

---

### Agent Support (`/agent/support`)
**File:** `src/pages/AgentSupport.tsx`

**Purpose:** Help and support for agents

**Key Features:**
- FAQ section
- Contact admin
- Commission queries
- Technical support

---

## Admin Pages

### Admin Login (`/admin/login`)
**File:** `src/pages/AdminLogin.tsx`

**Purpose:** Secure authentication for system administrators

**Key Features:**
- Email and password authentication
- Remember me option
- Supabase Auth integration
- Restricted access warning

**Security:**
- All access attempts logged
- Authorized personnel only
- Session management

---

### Admin Dashboard (`/admin/dashboard`)
**File:** `src/components/dashboard/Dashboard.tsx` and `src/pages/AdminDashboard.tsx`

**Purpose:** Comprehensive platform management and monitoring

**Key Features:**
- Multi-tab interface
- Real-time statistics
- Alert system
- Quick actions

**Tabs:**
1. **Overview**
   - KPI cards (16 metrics)
   - Entity counts
   - Financial overview
   - Operational stats

2. **Members**
   - Member list
   - Status management
   - Profile verification alerts
   - Suspension capabilities

3. **Member Policies**
   - Policy management interface
   - Status updates
   - Verification workflow

4. **Notifications**
   - System notifications
   - Admin alerts
   - Priority flagging

5. **Shops**
   - Partner list
   - Approval workflow
   - Status management

6. **Agents**
   - Agent list
   - Application approval
   - Commission tracking

7. **Pending Day1Health**
   - Cover plans awaiting verification
   - Approval workflow

8. **Policies**
   - All policies overview
   - Status management

9. **Transactions**
   - Transaction monitoring
   - Financial tracking

**KPI Categories:**
- **Entities:** Members, shops, agents, providers
- **Policies:** Total, active, in progress, value
- **Financial:** Revenue, rewards, commissions
- **Operational:** Transactions, invoices, health

**Alert System:**
- Profile incomplete at 90%+
- Suspended shops
- Overdue invoices
- Pending approvals
- System health warnings

**Quick Actions:**
- Partner invoices
- Manage partners
- Agent commissions
- Export data
- System settings

---

### Admin Members (`/admin/members`)
**File:** `src/components/dashboard/pages/MembersPage.tsx`

**Purpose:** Manage all member accounts

**Key Features:**
- Member list with search
- Status updates
- Profile verification
- Suspension management
- Bulk actions

---

### Admin Partners (`/admin/partners`)
**File:** `src/components/dashboard/pages/PartnersPage.tsx`

**Purpose:** Manage partner businesses

**Key Features:**
- Partner approval workflow
- Status management
- Suspension/activation
- Profile editing

---

### Admin Agents (`/admin/agents`)
**File:** `src/components/dashboard/pages/AgentsPage.tsx`

**Purpose:** Manage sales agents

**Key Features:**
- Agent approval workflow
- Commission management
- Performance tracking
- Status updates

---

### Admin Invoices (`/admin/invoices`)
**File:** `src/components/dashboard/pages/InvoicesPage.tsx`

**Purpose:** Manage partner invoices and payments

**Key Features:**
- Invoice generation
- Payment tracking
- Overdue management
- Export functionality

---

### Admin Commissions (`/admin/commissions`)
**File:** `src/components/dashboard/pages/CommissionsPage.tsx`

**Purpose:** Manage agent commission payouts

**Key Features:**
- Commission calculation
- Payout processing
- Agent performance
- Export reports

---

### Admin Transactions (`/admin/transactions`)
**File:** `src/components/dashboard/pages/TransactionsPage.tsx`

**Purpose:** Monitor all platform transactions

**Key Features:**
- Transaction list
- Filtering and search
- Export functionality
- Financial analytics

---

### Admin Notifications (`/admin/notifications`)
**File:** `src/components/admin/AdminNotificationsPage.tsx`

**Purpose:** Manage system notifications and alerts

**Key Features:**
- Notification list
- Priority management
- Action items
- Dismissal tracking

---

### Admin Cover Plans (`/admin/cover-plans`)
**File:** `src/components/dashboard/pages/CoverPlansPage.tsx`

**Purpose:** Manage cover plan templates

**Key Features:**
- Plan creation
- Plan editing
- Pricing management
- Status control

---

### Admin Approvals (`/admin/approvals`)
**File:** `src/components/dashboard/pages/ApprovalsPage.tsx`

**Purpose:** Centralized approval workflow

**Key Features:**
- Pending partners
- Pending agents
- Pending providers
- Bulk approval

---

### Admin Suspensions (`/admin/suspensions`)
**File:** `src/pages/AdminSuspensions.tsx`

**Purpose:** Manage suspended entities

**Key Features:**
- Suspension list
- Reactivation workflow
- Suspension reasons
- History tracking

---

### Admin Settings (`/admin/settings`)
**File:** `src/components/dashboard/pages/SettingsPage.tsx`

**Purpose:** System configuration

**Key Features:**
- Platform settings
- Email templates
- System parameters
- Integration settings

---

### Admin Chat Dashboard (`/admin/chat`)
**File:** `src/components/dashboard/pages/AdminChatDashboard.tsx`

**Purpose:** Manage member support chats

**Key Features:**
- Active chats
- Chat history
- Response management
- Priority flagging

---

## Policy Provider Pages

### Policy Provider Login (`/provider/login`)
**File:** `src/pages/PolicyProviderLogin.tsx`

**Purpose:** Authentication for insurance providers (Day1Health)

**Key Features:**
- Hardcoded Day1Health credentials
- Local authentication (no database)
- Session management

**Credentials:**
- ID: day1health
- Password: day1health2024

---

### Policy Provider Dashboard (`/provider/dashboard`)
**File:** `src/pages/PolicyProviderDashboard.tsx`

**Purpose:** View and manage member cover plans for insurance processing

**Key Features:**
- Cover plan overview
- Status filtering (active/paused/in progress)
- Monthly batch export
- Linked people tracking

**Key Sections:**
1. **Stats Cards**
   - Active plans count
   - In progress plans
   - Paused plans
   - Total linked people

2. **Key Metrics**
   - Active coverage summary
   - In progress summary
   - Portfolio summary

3. **Export Section**
   - CSV export for active plans
   - Monthly batch submission
   - Integration-ready format

4. **Cover Plans Table**
   - Tabbed interface (active/in progress/paused)
   - Member details
   - Plan information
   - Funding status
   - Active dates
   - Linked people count

**Export Format:**
- Member ID
- Member name and phone
- Plan name
- Monthly premium
- Funded amount
- Status
- Active dates
- Linked people count
- Month

**User Flow:**
- Provider logs in
- Views all cover plans
- Filters by status
- Exports active plans on 10th of month
- Integrates with policy management system

---

## Utility Pages

### Find Partner (`/find-partner`)
**File:** `src/pages/FindPartner.tsx`

**Purpose:** Public partner search and discovery

**Key Features:**
- Partner directory
- Location search
- Category filtering
- Partner details

---

### Legal Pages

#### Member Terms (`/legal/member-terms`)
**File:** `src/pages/LegalMemberTerms.tsx`

**Purpose:** Member-specific terms and conditions

#### POPIA Compliance (`/legal/popia`)
**File:** `src/pages/LegalPopia.tsx`

**Purpose:** POPIA compliance documentation

---

## Summary Statistics

**Total Pages:** 60+

**Page Categories:**
- Public: 3
- Member: 15
- Partner: 10
- Agent: 7
- Admin: 20+
- Provider: 2
- Legal: 3

**Authentication Pages:** 5 (Member, Partner, Agent, Admin, Provider)

**Dashboard Pages:** 5 (Member, Partner, Agent, Admin, Provider)

**Management Pages:** 20+ (Admin-specific)

---

## Navigation Patterns

### Member Navigation
Dashboard → Cover Plans → Transactions → Top-Up → Support

### Partner Navigation
Dashboard → Sales Terminal → Transaction History → Invoice → Profile

### Agent Navigation
Dashboard → Add Partner → Commission → Shop Details → Support

### Admin Navigation
Dashboard → [Multiple Management Tabs] → Specific Entity Management

### Provider Navigation
Dashboard → Export → (Limited navigation)

---

## Key User Flows

### Member Registration to First Transaction
1. Register → Login → Dashboard
2. View cover plan (if assigned)
3. Visit partner shop
4. Partner scans QR or enters phone
5. Transaction processed
6. Cashback added to cover plan

### Partner Onboarding
1. Register (or recruited by agent)
2. Admin approval
3. Login → Dashboard
4. Process first transaction
5. View monthly invoice

### Agent Recruitment Flow
1. Register → Admin approval
2. Login → Dashboard
3. Add partner shop
4. Partner signs agreement
5. Earn commission on transactions

---

## Modal Components

### Member Modals
- QR Code Display
- Upgrade Prompt
- Profile Incomplete
- Pending Verification
- Plan Selection
- Policy Overflow

### Partner Modals
- Digital Signature
- Transaction Confirmation

### Agent Modals
- Digital Signature
- Partner Agreement

### Admin Modals
- Member Suspension
- Approval Confirmation
- Bulk Actions

---

## Technical Architecture

### Authentication
- Member: Phone + PIN
- Partner: Phone/Email + PIN
- Agent: Phone + PIN
- Admin: Email + Password (Supabase Auth)
- Provider: Hardcoded credentials

### Session Management
- localStorage (remember me)
- sessionStorage (temporary)
- Expiry tracking
- Cross-tab sync

### Data Flow
1. User action
2. Frontend validation
3. Supabase query
4. State update
5. UI refresh

### Real-time Features
- Transaction processing
- Cover plan updates
- Notification system
- Chat functionality

---

## Accessibility Features

- Keyboard navigation
- Screen reader support
- High contrast mode
- Touch-friendly interfaces
- Responsive design
- Error messaging
- Loading states

---

## Security Features

- PIN-based authentication
- Session expiry
- Status validation
- Role-based access
- Audit logging
- Secure storage
- POPIA compliance

---

*Document Version: 1.0*
*Last Updated: 2026-04-09*
*Total Pages Documented: 60+*
