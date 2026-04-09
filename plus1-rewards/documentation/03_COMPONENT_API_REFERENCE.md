# Plus1 Rewards - Component API Reference

## Document Version: 1.0
## Last Updated: 2026-04-09

---

## Table of Contents
1. [Authentication Components](#authentication-components)
2. [Member Components](#member-components)
3. [Partner Components](#partner-components)
4. [Agent Components](#agent-components)
5. [Admin Components](#admin-components)
6. [Shared Components](#shared-components)
7. [Layout Components](#layout-components)
8. [UI Components](#ui-components)

---

## Authentication Components

### AuthLayout
**File:** `plus1-rewards/src/components/auth/AuthLayout.tsx`

Wrapper component for all authentication pages with split-screen design.

**Props:**
```typescript
interface AuthLayoutProps {
  portalIcon: string;           // Material icon name
  portalName: string;           // Portal title (e.g., "+1 Rewards")
  headline: React.ReactNode;    // Main headline with optional styling
  subheadline: string;          // Descriptive text
  stats: Array<{
    value: string;              // Stat value (e.g., "3%")
    label: string;              // Stat label (e.g., "Rewards Rate")
  }>;
  children: React.ReactNode;    // Form content
}
```

**Usage:**
```tsx
<AuthLayout
  portalIcon="add_circle"
  portalName="+1 Rewards"
  headline={<>Start earning <span style={{ color: '#93c5fd' }}>cashback</span></>}
  subheadline="Join thousands of members..."
  stats={[
    { value: 'NO sign up Fee', label: '' },
    { value: '3%', label: 'Rewards Rate' }
  ]}
>
  <LoginForm />
</AuthLayout>
```

---

### AuthInput
**File:** `plus1-rewards/src/components/auth/AuthComponents.tsx`

Styled input field for authentication forms.

**Props:**
```typescript
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;                // Input label
  icon: string;                 // Material icon name
  suffix?: React.ReactNode;     // Optional suffix (e.g., visibility toggle)
  hint?: string;                // Optional hint text
  required?: boolean;           // Required field indicator
}
```

**Usage:**
```tsx
<AuthInput
  label="Cell Phone Number"
  icon="phone"
  id="phone"
  type="tel"
  placeholder="082 555 1234"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  required
/>
```

---

### AuthButton
**File:** `plus1-rewards/src/components/auth/AuthComponents.tsx`

Styled button for authentication forms with loading state.

**Props:**
```typescript
interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;            // Show loading spinner
  loadingText?: string;         // Text during loading
  variant?: 'primary' | 'outline'; // Button style
}
```

**Usage:**
```tsx
<AuthButton 
  type="submit" 
  loading={loading} 
  loadingText="Signing in..."
>
  Sign In
  <span className="material-symbols-outlined">arrow_forward</span>
</AuthButton>
```

---

### AuthError
**File:** `plus1-rewards/src/components/auth/AuthComponents.tsx`

Error message display component.

**Props:**
```typescript
interface AuthErrorProps {
  message: string;              // Error message to display
}
```

**Usage:**
```tsx
<AuthError message={error} />
```

---

### AuthDivider
**File:** `plus1-rewards/src/components/auth/AuthComponents.tsx`

Horizontal divider with centered label.

**Props:**
```typescript
interface AuthDividerProps {
  label: string;                // Divider label text
}
```

**Usage:**
```tsx
<AuthDivider label="Or sign in as" />
```

---

### AuthLink
**File:** `plus1-rewards/src/components/auth/AuthComponents.tsx`

Styled link for authentication pages.

**Props:**
```typescript
interface AuthLinkProps {
  onClick?: () => void;         // Click handler
  href?: string;                // Optional href
  children: React.ReactNode;    // Link text
}
```

**Usage:**
```tsx
<AuthLink onClick={() => navigate('/register')}>
  Register Now
</AuthLink>
```

---

## Member Components

### MemberLayout
**File:** `plus1-rewards/src/components/member/MemberLayout.tsx`

Main layout wrapper for member dashboard pages.

**Props:**
```typescript
interface MemberLayoutProps {
  children: ReactNode;
  member: Member | null;
  isOnline: boolean;
  pendingTransactions: number;
  onSignOut: () => void;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  qr_code: string;
}
```

**Usage:**
```tsx
<MemberLayout
  member={member}
  isOnline={navigator.onLine}
  pendingTransactions={5}
  onSignOut={handleSignOut}
>
  <DashboardContent />
</MemberLayout>
```

---

### MemberTopbar
**File:** `plus1-rewards/src/components/member/MemberTopbar.tsx`

Top navigation bar for member dashboard.

**Props:**
```typescript
interface MemberTopbarProps {
  member: Member | null;
  isOnline: boolean;
  pendingTransactions: number;
  onSignOut: () => void;
}
```

**Features:**
- Logo display
- Online/offline indicator
- Pending transactions badge
- Sign out button
- Mobile responsive

---

### MemberFooter
**File:** `plus1-rewards/src/components/member/MemberFooter.tsx`

Bottom navigation for member dashboard.

**Props:** None (self-contained)

**Features:**
- Dashboard link
- QR code link
- Transactions link
- Support link
- Active state highlighting

---

### ProfileCompletionModal
**File:** `plus1-rewards/src/components/member/ProfileCompletionModal.tsx`

Modal prompting member to complete profile at 90%+ funding.

**Props:**
```typescript
interface ProfileCompletionModalProps {
  show: boolean;
  onClose: () => void;
  missingFields: string[];
  progressPercent: number;
  canChangePlan: boolean;
  onChangePlan: () => void;
}
```

**Behavior:**
- 90-94%: Dismissible with "Remind Me Later"
- 95%: Dismissible once per session
- 96%+: Cannot dismiss, must complete profile

---

### ProfileIncompleteModal
**File:** `plus1-rewards/src/components/member/ProfileIncompleteModal.tsx`

Modal showing profile completion requirements.

**Props:**
```typescript
interface ProfileIncompleteModalProps {
  show: boolean;
  onClose: () => void;
  missingFields: string[];
  member: Member;
  onSave: () => void;
}
```

**Features:**
- Lists missing fields
- Inline editing
- Save functionality
- Validation

---

### PlanSelectionModal
**File:** `plus1-rewards/src/components/member/PlanSelectionModal.tsx`

Modal for selecting initial cover plan.

**Props:**
```typescript
interface PlanSelectionModalProps {
  show: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
  availablePlans: CoverPlan[];
}
```

---

### UpgradePromptModal
**File:** `plus1-rewards/src/components/member/UpgradePromptModal.tsx`

Modal prompting member to upgrade plan using overflow.

**Props:**
```typescript
interface UpgradePromptModalProps {
  show: boolean;
  onClose: () => void;
  currentPlan: MemberCoverPlan;
  overflowBalance: number;
  onUpgrade: () => void;
}
```

---

### PendingVerificationModal
**File:** `plus1-rewards/src/components/member/PendingVerificationModal.tsx`

Modal showing pending verification status at 100%.

**Props:**
```typescript
interface PendingVerificationModalProps {
  show: boolean;
  onClose: () => void;
  memberName: string;
  planName: string;
}
```

---

### PolicyOverflowModal
**File:** `plus1-rewards/src/components/member/PolicyOverflowModal.tsx`

Modal explaining overflow cashback.

**Props:**
```typescript
interface PolicyOverflowModalProps {
  show: boolean;
  onClose: () => void;
  overflowAmount: number;
  targetAmount: number;
}
```

---

### MemberChatWidget
**File:** `plus1-rewards/src/components/member/MemberChatWidget.tsx`

Floating chat widget for member support.

**Props:**
```typescript
interface MemberChatWidgetProps {
  memberId: string;
  memberName: string;
}
```

**Features:**
- Floating button
- Chat interface
- Message history
- Real-time updates

---

### BlockedFundsNotification
**File:** `plus1-rewards/src/components/member/BlockedFundsNotification.tsx`

Notification banner for blocked funds.

**Props:**
```typescript
interface BlockedFundsNotificationProps {
  blockedAmount: number;
  reason: string;
  onResolve: () => void;
}
```

---

### MemberNotifications
**File:** `plus1-rewards/src/components/member/MemberNotifications.tsx`

Notification center for member alerts.

**Props:**
```typescript
interface MemberNotificationsProps {
  memberId: string;
}
```

**Features:**
- Unread count badge
- Notification list
- Mark as read
- Delete notifications

---

## Partner Components

### PartnerLayout
**File:** `plus1-rewards/src/components/partner/PartnerLayout.tsx`

Main layout wrapper for partner dashboard.

**Props:**
```typescript
interface PartnerLayoutProps {
  children: ReactNode;
}
```

**Features:**
- Sidebar navigation
- Top bar
- Content area
- Responsive design

---

### PartnerDashboard
**File:** `plus1-rewards/src/components/partner/PartnerDashboard.tsx`

Main partner dashboard component.

**Features:**
- Stats cards (today's rewards, total members, transactions)
- Recent transactions list
- Quick actions
- Invoice status

---

### PartnerProcessTransaction
**File:** `plus1-rewards/src/components/partner/PartnerProcessTransaction.tsx`

Transaction processing interface.

**Props:**
```typescript
interface PartnerProcessTransactionProps {
  partnerId: string;
  partnerName: string;
  cashbackPercent: number;
}
```

**Features:**
- Member search (phone or QR)
- Purchase amount input
- Cashback calculation preview
- Transaction confirmation

**Flow:**
```typescript
1. Enter member phone or scan QR
2. Search member in database
3. Display member details
4. Enter purchase amount
5. Show cashback breakdown
6. Confirm transaction
7. Create transaction record
8. Update member wallet
9. Show success message
```

---

### PartnerShopProfile
**File:** `plus1-rewards/src/components/partner/PartnerShopProfile.tsx`

Partner shop profile management.

**Features:**
- Shop details editing
- Logo upload
- Cashback rate display
- Supplier management
- Opening hours

---

### PartnerTransactionDetail
**File:** `plus1-rewards/src/components/partner/PartnerTransactionDetail.tsx`

Detailed view of single transaction.

**Props:**
```typescript
interface PartnerTransactionDetailProps {
  transactionId: string;
}
```

**Displays:**
- Transaction ID
- Member details
- Purchase amount
- Cashback breakdown
- Timestamp
- Status

---

### LogoUpload
**File:** `plus1-rewards/src/components/partner/LogoUpload.tsx`

Component for uploading partner logo.

**Props:**
```typescript
interface LogoUploadProps {
  partnerId: string;
  currentLogoUrl?: string;
  onUploadComplete: (url: string) => void;
}
```

**Features:**
- Drag and drop
- File validation
- Image preview
- Upload to Supabase Storage

---

### SupplierExpiryBanner
**File:** `plus1-rewards/src/components/partner/SupplierExpiryBanner.tsx`

Banner showing supplier list expiry countdown.

**Props:**
```typescript
interface SupplierExpiryBannerProps {
  partnerId: string;
}
```

**Features:**
- Days remaining countdown
- Expiry warning
- Clear suppliers action

---

## Agent Components

### AgentDashboard
**File:** `plus1-rewards/src/pages/AgentDashboard.tsx`

Main agent dashboard.

**Features:**
- Total commission earned
- Partner shops list
- Monthly commission breakdown
- Quick actions (add shop, view commission)

---

### AgentCommission
**File:** `plus1-rewards/src/pages/AgentCommission.tsx`

Commission tracking and breakdown.

**Features:**
- Total earned
- Total paid
- Total pending
- Current month breakdown by partner
- Transaction history with commission details

---

### AgentAddShop
**File:** `plus1-rewards/src/pages/AgentAddPartner.tsx`

Form for adding new partner shop.

**Features:**
- Shop details form
- Cashback rate selection
- Agreement acceptance
- Submission to admin for approval

---

### AgentShopDetail
**File:** `plus1-rewards/src/pages/AgentShopDetail.tsx`

Detailed view of partner shop.

**Props:**
```typescript
interface AgentShopDetailProps {
  partnerId: string; // From URL params
}
```

**Features:**
- Shop information
- Transaction history
- Commission earned from shop
- Contact shop button
- Resend login credentials

---

## Admin Components

### DashboardLayout
**File:** `plus1-rewards/src/components/dashboard/DashboardLayout.tsx`

Main layout for admin dashboard.

**Props:**
```typescript
interface DashboardLayoutProps {
  children: ReactNode;
}
```

**Features:**
- Sidebar navigation
- Topbar
- Content area
- Responsive design

---

### Sidebar
**File:** `plus1-rewards/src/components/dashboard/Sidebar.tsx`

Admin dashboard sidebar navigation.

**Features:**
- Logo
- Navigation links
- Active state highlighting
- Collapsible on mobile

**Navigation Items:**
- Dashboard
- Approvals
- Members
- Cover Plans
- Partners
- Agents
- Transactions
- Invoices
- Commissions
- Disputes
- Top-Ups
- Providers
- Settings

---

### Topbar
**File:** `plus1-rewards/src/components/dashboard/Topbar.tsx`

Admin dashboard top bar.

**Props:**
```typescript
interface TopbarProps {
  onRefresh: () => void;
}
```

**Features:**
- Search bar
- Refresh button
- Notifications
- User menu
- Logout button

---

### StatsCards
**File:** `plus1-rewards/src/components/dashboard/StatsCards.tsx`

Dashboard statistics cards.

**Features:**
- Total members
- Active members
- Total partners
- Total transactions
- Total revenue
- Pending approvals

**Ref Methods:**
```typescript
interface StatsCardsRef {
  refresh: () => void;
}
```

---

### StatCard
**File:** `plus1-rewards/src/components/dashboard/components/StatCard.tsx`

Individual stat card component.

**Props:**
```typescript
interface StatCardProps {
  icon: string;           // Material icon name
  title: string;          // Card title
  value: string;          // Main value
  change: string;         // Change percentage
  description: string;    // Description text
}
```

**Usage:**
```tsx
<StatCard
  icon="group"
  title="Total Members"
  value="1,234"
  change="+12%"
  description="Active members"
/>
```

---

### MembersTable
**File:** `plus1-rewards/src/components/dashboard/components/MembersTable.tsx`

Table component for displaying members.

**Props:**
```typescript
interface MembersTableProps {
  members: Member[];
  onViewDetails: (member: Member) => void;
  onSuspend: (memberId: string) => void;
  onReactivate: (memberId: string) => void;
}
```

**Features:**
- Sortable columns
- Search/filter
- Pagination
- Action buttons
- Status badges

---

### PageHeader
**File:** `plus1-rewards/src/components/dashboard/components/PageHeader.tsx`

Reusable page header component.

**Props:**
```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}
```

**Usage:**
```tsx
<PageHeader
  title="Members Management"
  description="View and manage all platform members"
  actions={
    <button onClick={handleExport}>Export CSV</button>
  }
/>
```

---

### AdminNotifications
**File:** `plus1-rewards/src/components/admin/AdminNotifications.tsx`

Admin notification center.

**Features:**
- Unread notifications
- Priority filtering
- Mark as read
- Notification actions

---

### IncompleteProfileAlerts
**File:** `plus1-rewards/src/components/admin/IncompleteProfileAlerts.tsx`

Alerts for members with incomplete profiles at 90%+.

**Features:**
- Member list
- Progress percentage
- Missing fields
- Contact member button

---

### MemberPoliciesAdmin
**File:** `plus1-rewards/src/components/admin/MemberPoliciesAdmin.tsx`

Admin view of member policies.

**Features:**
- Policy list
- Status management
- Manual funding
- Verification actions

---

### MemberPolicyStatusModal
**File:** `plus1-rewards/src/components/admin/MemberPolicyStatusModal.tsx`

Modal for changing policy status.

**Props:**
```typescript
interface MemberPolicyStatusModalProps {
  show: boolean;
  onClose: () => void;
  policy: MemberCoverPlan;
  onStatusChange: (newStatus: string, reason: string) => void;
}
```

---

## Shared Components

### Notification
**File:** `plus1-rewards/src/components/Notification.tsx`

Toast notification component.

**Props:**
```typescript
interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}
```

**Hook:**
```typescript
const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  
  const showSuccess = (title: string, message: string, duration?: number) => void;
  const showError = (title: string, message: string, duration?: number) => void;
  const showWarning = (title: string, message: string, duration?: number) => void;
  const showInfo = (title: string, message: string, duration?: number) => void;
  const hideNotification = () => void;
  
  return { notification, showSuccess, showError, showWarning, showInfo, hideNotification };
};
```

**Usage:**
```tsx
const { notification, showSuccess, hideNotification } = useNotification();

// Show notification
showSuccess('Success!', 'Transaction completed');

// Render notification
{notification && (
  <Notification
    type={notification.type}
    title={notification.title}
    message={notification.message}
    onClose={hideNotification}
  />
)}
```

---

### LoadingPage
**File:** `plus1-rewards/src/components/LoadingPage.tsx`

Full-page loading screen.

**Features:**
- Animated logo
- Loading spinner
- Fade in/out animation

---

### SEO
**File:** `plus1-rewards/src/components/SEO.tsx`

SEO meta tags component.

**Props:**
```typescript
interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  robots?: string;
  ogImage?: string;
}
```

**Usage:**
```tsx
<SEO
  title="Member Dashboard | Plus1 Rewards"
  description="View your cashback progress and cover plan status"
  keywords="dashboard, cashback, medical cover"
  canonical="https://plus1rewards.com/member/dashboard"
  robots="noindex, nofollow"
/>
```

---

### DigitalSignature
**File:** `plus1-rewards/src/components/DigitalSignature.tsx`

Canvas-based signature component.

**Props:**
```typescript
interface DigitalSignatureProps {
  onSave: (signatureDataUrl: string) => void;
  onClear: () => void;
}
```

**Features:**
- Touch/mouse drawing
- Clear button
- Save as base64 image

---

### AnimatedHamburger
**File:** `plus1-rewards/src/components/AnimatedHamburger.tsx`

Animated hamburger menu icon.

**Props:**
```typescript
interface AnimatedHamburgerProps {
  isOpen: boolean;
  onClick: () => void;
}
```

---

### SuspensionPopup
**File:** `plus1-rewards/src/components/SuspensionPopup.tsx`

Popup for suspended accounts.

**Props:**
```typescript
interface SuspensionPopupProps {
  show: boolean;
  reason: string;
  onContact: () => void;
}
```

---

### ProtectedPolicyProviderRoute
**File:** `plus1-rewards/src/components/ProtectedPolicyProviderRoute.tsx`

Route protection for policy provider pages.

**Props:**
```typescript
interface ProtectedPolicyProviderRouteProps {
  children: ReactNode;
}
```

**Features:**
- Session validation
- Redirect to login if not authenticated
- Loading state

---

## Layout Components

### Layout
**File:** `plus1-rewards/src/components/Layout.tsx`

Generic layout wrapper.

**Props:**
```typescript
interface LayoutProps {
  children: ReactNode;
  title?: string;
}
```

**Features:**
- Header with logo
- Online/offline indicator
- Content area
- Footer

---

## UI Components

### feature-section-with-hover-effects
**File:** `plus1-rewards/src/components/ui/feature-section-with-hover-effects.tsx`

Animated feature section for landing page.

**Props:**
```typescript
interface FeatureSectionProps {
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}
```

**Features:**
- Hover animations
- Icon display
- Responsive grid

---

## Landing Page Components

### Navbar
**File:** `plus1-rewards/src/components/landing/Navbar.tsx`

Landing page navigation bar.

**Features:**
- Logo
- Navigation links
- Login/Register buttons
- Mobile menu
- Sticky on scroll

---

### Hero
**File:** `plus1-rewards/src/components/landing/Hero.tsx`

Hero section with main value proposition.

**Features:**
- Headline
- Subheadline
- CTA buttons
- Background image
- Animated elements

---

### HowItWorks
**File:** `plus1-rewards/src/components/landing/HowItWorks.tsx`

Step-by-step explanation section.

**Features:**
- 3-step process
- Icons
- Descriptions
- Animations

---

### CoverStatus
**File:** `plus1-rewards/src/components/landing/CoverStatus.tsx`

Cover plan status visualization.

**Features:**
- Progress bar
- Status badges
- Example scenarios

---

### PartnerCarousel
**File:** `plus1-rewards/src/components/landing/PartnerCarousel.tsx`

Carousel of partner logos.

**Features:**
- Auto-scroll
- Infinite loop
- Hover pause

---

### AnimatedPartnerCard
**File:** `plus1-rewards/src/components/landing/AnimatedPartnerCard.tsx`

Animated partner card with hover effects.

**Props:**
```typescript
interface AnimatedPartnerCardProps {
  partner: {
    name: string;
    logo: string;
    category: string;
    cashback: number;
  };
}
```

---

### Roles
**File:** `plus1-rewards/src/components/landing/Roles.tsx`

Role explanation section.

**Features:**
- Member role
- Partner role
- Agent role
- Icons and descriptions

---

### OfflineFeature
**File:** `plus1-rewards/src/components/landing/OfflineFeature.tsx`

Offline functionality showcase.

**Features:**
- Offline icon
- Feature description
- Benefits list

---

### FAQ
**File:** `plus1-rewards/src/components/landing/FAQ.tsx`

Frequently asked questions accordion.

**Features:**
- Expandable questions
- Smooth animations
- Search functionality

---

### Footer
**File:** `plus1-rewards/src/components/landing/Footer.tsx`

Landing page footer.

**Features:**
- Links
- Social media
- Copyright
- Contact info

---

### ValueBar
**File:** `plus1-rewards/src/components/landing/ValueBar.tsx`

Value proposition bar.

**Features:**
- Key stats
- Animated counters
- Icons

---

## Mobile Components

### MobileLanding
**File:** `plus1-rewards/src/components/mobile/MobileLanding.tsx`

Mobile-optimized landing page.

**Features:**
- Touch-friendly navigation
- Simplified layout
- Mobile-specific animations

---

### BottomNav
**File:** `plus1-rewards/src/components/mobile/BottomNav.tsx`

Bottom navigation for mobile.

**Features:**
- Fixed position
- Icon navigation
- Active state

---

### Header
**File:** `plus1-rewards/src/components/mobile/Header.tsx`

Mobile header component.

**Features:**
- Logo
- Menu button
- Compact design

---

### HeroSection
**File:** `plus1-rewards/src/components/mobile/HeroSection.tsx`

Mobile hero section.

**Features:**
- Vertical layout
- Touch-optimized CTAs
- Responsive images

---

### RolesCarousel
**File:** `plus1-rewards/src/components/mobile/RolesCarousel.tsx`

Swipeable roles carousel for mobile.

**Features:**
- Touch swipe
- Pagination dots
- Auto-advance

---

### CTASection
**File:** `plus1-rewards/src/components/mobile/CTASection.tsx`

Call-to-action section for mobile.

**Features:**
- Large buttons
- Clear messaging
- Easy tap targets

---

## Component Best Practices

### 1. Props Validation
Always define TypeScript interfaces for props:
```typescript
interface ComponentProps {
  required: string;
  optional?: number;
  callback: () => void;
}
```

### 2. Error Handling
Implement error boundaries and fallbacks:
```typescript
try {
  await operation();
} catch (error) {
  showError('Operation Failed', error.message);
}
```

### 3. Loading States
Show loading indicators during async operations:
```typescript
const [loading, setLoading] = useState(false);

if (loading) return <LoadingSpinner />;
```

### 4. Accessibility
- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Provide alt text for images

### 5. Responsive Design
- Mobile-first approach
- Use Tailwind responsive classes
- Test on multiple screen sizes

### 6. Performance
- Memoize expensive calculations
- Use React.memo for pure components
- Lazy load heavy components
- Optimize images

---

## Conclusion

This component API reference provides detailed information about all components in the Plus1 Rewards application. Each component is designed to be reusable, maintainable, and follows React best practices.

---

**Document End**
