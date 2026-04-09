# Plus1 Rewards - Cashback System Detailed Documentation

## Document Version: 1.0
## Last Updated: 2026-04-09

---

## Table of Contents
1. [Cashback Model Overview](#cashback-model-overview)
2. [Transaction Flow](#transaction-flow)
3. [Cashback Calculation](#cashback-calculation)
4. [Cover Plan Funding](#cover-plan-funding)
5. [Overflow Management](#overflow-management)
6. [Multi-Plan Funding](#multi-plan-funding)
7. [Top-Up System](#top-up-system)
8. [Status Transitions](#status-transitions)

---

## Cashback Model Overview

### Core Principle
Plus1 Rewards uses **real rand value cashback**, not loyalty points. Every transaction generates actual money that funds medical cover plans.

### Cashback Split Formula
```
Partner Cashback Rate: 3% - 40% (partner chooses)

Split:
- System Fee: 1% of purchase amount
- Agent Commission: 1% of purchase amount  
- Member Cashback: (Cashback Rate - 2%) of purchase amount
```

### Example Calculation
```
Purchase Amount: R1,000
Partner Cashback Rate: 7%

Breakdown:
- Total Cashback: R1,000 × 7% = R70
- System Fee: R1,000 × 1% = R10
- Agent Commission: R1,000 × 1% = R10
- Member Cashback: R1,000 × 5% = R50

Member receives: R50 toward cover plan
```

---

## Transaction Flow

### 1. Member Shops at Partner
```typescript
// Member provides identification
Method 1: Mobile number (cell_phone)
Method 2: QR code scan

// Partner enters transaction
Input: Purchase amount
System: Calculates cashback automatically
```

### 2. Transaction Creation
File: `plus1-rewards/src/hooks/usePartnerDashboard.ts`

```typescript
const issueRewards = async (memberId: string, purchaseAmount: number) => {
  const commissionRate = partner?.commission_rate || 13;
  
  // Partner pays commission rate % of purchase
  const partnerContribution = purchaseAmount * (commissionRate / 100);
  
  // Member gets commission rate minus 2% (1% agent + 1% platform)
  const memberRewardRate = Math.max(0, commissionRate - 2);
  const memberReward = purchaseAmount * (memberRewardRate / 100);
  
  // Agent gets 1% of purchase amount
  const agentCommission = purchaseAmount * 0.01;
  
  // Platform gets 1% of purchase amount
  const platformFee = purchaseAmount * 0.01;

  // Create transaction with synced status (immediate transaction)
  const { data: transaction, error: transError } = await supabase
    .from('transactions')
    .insert({
      partner_id: partnerId,
      member_id: memberId,
      purchase_amount: purchaseAmount,
      partner_contribution: partnerContribution,
      member_reward: memberReward,
      agent_commission: agentCommission,
      platform_fee: platformFee,
      status: 'synced',
      synced_at: new Date().toISOString()
    })
    .select()
    .single();

  // Update or create wallet
  // ... wallet logic
};
```

### 3. Wallet Update
```typescript
// Check if wallet exists
const { data: existingWallet } = await supabase
  .from('wallets')
  .select('*')
  .eq('member_id', memberId)
  .eq('partner_id', partnerId)
  .maybeSingle();

if (existingWallet) {
  // Update existing wallet
  await supabase
    .from('wallets')
    .update({
      rewards_total: (existingWallet.rewards_total || 0) + memberReward,
      balance: (existingWallet.balance || 0) + memberReward
    })
    .eq('id', existingWallet.id);
} else {
  // Create new wallet
  await supabase
    .from('wallets')
    .insert({
      member_id: memberId,
      partner_id: partnerId,
      rewards_total: memberReward,
      balance: memberReward
    });
}
```

### 4. Cover Plan Funding
```typescript
// Cashback is allocated to member_cover_plans
// Based on creation_order (priority)
// Tracked in cover_plan_wallet_entries table
```

---

## Cashback Calculation

### Calculation Logic

#### Standard Transaction
```typescript
interface CashbackCalculation {
  purchaseAmount: number;
  cashbackPercent: number;
  
  // Calculated values
  totalCashback: number;        // purchaseAmount × (cashbackPercent / 100)
  systemFee: number;            // purchaseAmount × 0.01
  agentCommission: number;      // purchaseAmount × 0.01
  memberCashback: number;       // purchaseAmount × ((cashbackPercent - 2) / 100)
}

// Example
const calculation: CashbackCalculation = {
  purchaseAmount: 1000,
  cashbackPercent: 7,
  totalCashback: 70,
  systemFee: 10,
  agentCommission: 10,
  memberCashback: 50
};
```

#### Minimum Cashback Rate
```typescript
// Partner must offer at least 3%
// This ensures:
// - 1% to system
// - 1% to agent
// - 1% to member (minimum)

if (cashbackPercent < 3) {
  throw new Error('Minimum cashback rate is 3%');
}
```

#### Maximum Cashback Rate
```typescript
// Partner can offer up to 40%
// This means:
// - 1% to system
// - 1% to agent
// - 38% to member (maximum)

if (cashbackPercent > 40) {
  throw new Error('Maximum cashback rate is 40%');
}
```

### Real-World Examples

#### Example 1: Grocery Store (5% cashback)
```
Purchase: R500 groceries
Cashback Rate: 5%

Calculation:
- Total Cashback: R500 × 5% = R25
- System Fee: R500 × 1% = R5
- Agent Commission: R500 × 1% = R5
- Member Cashback: R500 × 3% = R15

Member receives R15 toward cover plan
```

#### Example 2: Pharmacy (10% cashback)
```
Purchase: R200 medication
Cashback Rate: 10%

Calculation:
- Total Cashback: R200 × 10% = R20
- System Fee: R200 × 1% = R2
- Agent Commission: R200 × 1% = R2
- Member Cashback: R200 × 8% = R16

Member receives R16 toward cover plan
```

#### Example 3: Restaurant (15% cashback)
```
Purchase: R300 meal
Cashback Rate: 15%

Calculation:
- Total Cashback: R300 × 15% = R45
- System Fee: R300 × 1% = R3
- Agent Commission: R300 × 1% = R3
- Member Cashback: R300 × 13% = R39

Member receives R39 toward cover plan
```

---

## Cover Plan Funding

### Cover Plan Structure

#### Default Plan
```typescript
interface CoverPlan {
  id: string;
  plan_name: string;              // "Day1 Health Basic"
  monthly_target_amount: number;  // 390
  provider_id: string;
  status: 'active' | 'inactive';
}
```

#### Member Cover Plan
```typescript
interface MemberCoverPlan {
  id: string;
  member_id: string;
  cover_plan_id: string;
  creation_order: number;         // Funding priority (1, 2, 3...)
  target_amount: number;          // 390
  funded_amount: number;          // Current funded (0-390)
  overflow_balance: number;       // Excess cashback
  status: 'in_progress' | 'pending' | 'active' | 'paused' | 'suspended';
  active_from: string | null;
  active_to: string | null;
  plan_changes_count: number;
  suspended_at: string | null;
}
```

### Funding Process

#### Step 1: Cashback Earned
```typescript
// Transaction creates cashback
memberCashback = R50

// Cashback allocated to cover plan
// Based on creation_order priority
```

#### Step 2: Wallet Entry Created
```typescript
await supabase
  .from('cover_plan_wallet_entries')
  .insert({
    member_id: memberId,
    member_cover_plan_id: coverPlanId,
    transaction_id: transactionId,
    entry_type: 'cashback_earned',
    amount: memberCashback,
    balance_after: newBalance,
    description: `Cashback from ${partnerName}`
  });
```

#### Step 3: Cover Plan Updated
```typescript
const newFundedAmount = currentFunded + memberCashback;

if (newFundedAmount >= targetAmount) {
  // Plan reaches 100%
  const overflow = newFundedAmount - targetAmount;
  
  await supabase
    .from('member_cover_plans')
    .update({
      funded_amount: targetAmount,
      overflow_balance: overflow,
      status: 'pending' // Awaiting verification
    })
    .eq('id', coverPlanId);
} else {
  // Plan still in progress
  await supabase
    .from('member_cover_plans')
    .update({
      funded_amount: newFundedAmount
    })
    .eq('id', coverPlanId);
}
```

### Funding Progress Tracking

#### Progress Calculation
```typescript
const progressPercent = (fundedAmount / targetAmount) * 100;

// Examples:
// R100 / R390 = 25.6%
// R200 / R390 = 51.3%
// R390 / R390 = 100%
```

#### Progress Milestones
```typescript
// 90% - Profile completion warning
if (progressPercent >= 90 && progressPercent < 95) {
  // Show profile completion modal (dismissible)
}

// 95% - Profile completion mandatory
if (progressPercent >= 95 && progressPercent < 96) {
  // Show profile completion modal (mandatory, can dismiss once)
}

// 96% - Profile completion critical
if (progressPercent >= 96 && progressPercent < 100) {
  // Show profile completion modal (cannot dismiss)
  // Plan will be paused at 100% if incomplete
}

// 100% - Plan complete
if (progressPercent >= 100) {
  if (profileComplete) {
    status = 'pending'; // Awaiting Day1Health verification
  } else {
    status = 'paused'; // Profile incomplete
  }
}
```

---

## Overflow Management

### What is Overflow?

Overflow is cashback earned **after** a cover plan reaches its target amount (100%).

### Overflow Scenarios

#### Scenario 1: Single Plan with Overflow
```
Target: R390
Funded: R390
New Transaction: R50 cashback

Result:
- Funded Amount: R390 (stays at target)
- Overflow Balance: R50
```

#### Scenario 2: Overflow Helps Next Cycle
```
Month 1:
- Target: R390
- Funded: R390
- Overflow: R50
- Status: Active (30 days)

Month 2 (after 30 days):
- Target: R390
- Available: R50 (overflow)
- Needed: R340 more
- Status: In Progress (need R340)
```

#### Scenario 3: Overflow Funds Upgrade
```
Current Plan: R390 (100% funded)
Overflow: R275
Upgrade Cost: R275 (to R665 plan)

Action: Use overflow to upgrade
Result:
- New Plan: R665
- Funded: R665
- Overflow: R0
- Status: Active
```

### Overflow Allocation Rules

#### Rule 1: Priority Order
```typescript
// Overflow fills plans in creation_order
Plan 1 (creation_order: 1) - fills first
Plan 2 (creation_order: 2) - fills second
Plan 3 (creation_order: 3) - fills third
```

#### Rule 2: Automatic Allocation
```typescript
// When cashback is earned:
1. Check Plan 1 (creation_order: 1)
   - If < 100%, add to Plan 1
   - If = 100%, move to Plan 2

2. Check Plan 2 (creation_order: 2)
   - If < 100%, add to Plan 2
   - If = 100%, move to Plan 3

3. Check Plan 3 (creation_order: 3)
   - If < 100%, add to Plan 3
   - If = 100%, add to overflow
```

#### Rule 3: Overflow Storage
```typescript
// Overflow stored in first plan (creation_order: 1)
await supabase
  .from('member_cover_plans')
  .update({
    overflow_balance: currentOverflow + newCashback
  })
  .eq('id', firstPlanId);
```

### Overflow Usage

#### Use Case 1: Next Month Funding
```typescript
// Automatic: Overflow helps fund next cycle
// No action needed from member
```

#### Use Case 2: Plan Upgrade
```typescript
// Manual: Member chooses to upgrade
const handleUpgrade = async () => {
  const upgradeCost = 275; // R665 - R390
  
  if (overflowBalance >= upgradeCost) {
    // Deduct from overflow
    // Upgrade to higher plan
    // Set new target
  }
};
```

#### Use Case 3: Dependant Funding
```typescript
// Manual: Member adds dependant
// Overflow helps fund dependant's plan
```

---

## Multi-Plan Funding

### Multiple Cover Plans

Members can have multiple cover plans:
1. Main member plan
2. Dependant plans
3. Additional coverage plans

### Funding Priority

#### Creation Order System
```typescript
// Plans funded in order of creation
Plan A (created first)  → creation_order: 1
Plan B (created second) → creation_order: 2
Plan C (created third)  → creation_order: 3
```

#### Funding Flow
```typescript
// New cashback: R100

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

### Dependant Plans

#### Adding a Dependant
```typescript
// Member adds dependant
// New cover plan created with next creation_order

const addDependant = async (dependantData) => {
  // Get max creation_order
  const { data: plans } = await supabase
    .from('member_cover_plans')
    .select('creation_order')
    .eq('member_id', memberId)
    .order('creation_order', { ascending: false })
    .limit(1);
  
  const nextOrder = (plans[0]?.creation_order || 0) + 1;
  
  // Create new plan
  await supabase
    .from('member_cover_plans')
    .insert({
      member_id: memberId,
      cover_plan_id: selectedPlanId,
      creation_order: nextOrder,
      target_amount: 390,
      funded_amount: 0,
      overflow_balance: 0,
      status: 'in_progress'
    });
};
```

---

## Top-Up System

### What is Top-Up?

Top-up allows members to manually add funds to cover plans when cashback is insufficient.

### Top-Up Methods

#### Method 1: EFT (Electronic Funds Transfer)
```typescript
// Member does bank transfer
// Provides proof of payment
// Admin approves manually
```

#### Method 2: Instant EFT
```typescript
// Member clicks "Do Instant EFT" button
// Opens chat with admin
// Admin provides payment details
// Member completes payment
// Admin confirms and approves
```

### Top-Up Flow

#### Step 1: Member Initiates
File: `plus1-rewards/src/pages/MemberTopUp.tsx`

```typescript
const handleTopUp = async () => {
  const { data, error } = await supabase
    .from('top_ups')
    .insert({
      payer_id: memberId,
      payer_type: 'member',
      member_cover_plan_id: coverPlanId,
      amount: topUpAmount,
      payment_method: 'eft',
      status: 'pending'
    })
    .select()
    .single();
};
```

#### Step 2: Admin Reviews
File: `plus1-rewards/src/components/dashboard/pages/TopUpsPage.tsx`

```typescript
const handleApprove = async (topUpId: string) => {
  // Update top-up status
  await supabase
    .from('top_ups')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString()
    })
    .eq('id', topUpId);
  
  // Add to cover plan
  await supabase
    .from('cover_plan_wallet_entries')
    .insert({
      member_id: memberId,
      member_cover_plan_id: coverPlanId,
      entry_type: 'top_up',
      amount: topUpAmount,
      description: 'Manual top-up'
    });
  
  // Update funded amount
  await supabase
    .from('member_cover_plans')
    .update({
      funded_amount: currentFunded + topUpAmount
    })
    .eq('id', coverPlanId);
};
```

### Top-Up Scenarios

#### Scenario 1: Partial Top-Up
```
Target: R390
Funded: R300
Shortfall: R90

Member tops up: R50
New Funded: R350
Still needs: R40
```

#### Scenario 2: Full Top-Up
```
Target: R390
Funded: R300
Shortfall: R90

Member tops up: R90
New Funded: R390
Status: Pending verification
```

#### Scenario 3: Excess Top-Up
```
Target: R390
Funded: R300
Shortfall: R90

Member tops up: R150
New Funded: R390
Overflow: R60
```

---

## Status Transitions

### Cover Plan Statuses

```typescript
type CoverPlanStatus = 
  | 'in_progress'  // Funding in progress (0-99%)
  | 'pending'      // Awaiting verification (100%, profile complete)
  | 'active'       // Verified and active (30-day cycle)
  | 'paused'       // Profile incomplete at 100%
  | 'suspended';   // Insufficient funds for next cycle
```

### Status Flow Diagram

```
[Registration]
     ↓
[in_progress] ← Earning cashback (0-99%)
     ↓
[90% reached] → Profile completion warning
     ↓
[95% reached] → Profile completion mandatory
     ↓
[96% reached] → Profile completion critical
     ↓
[100% reached]
     ↓
Profile Complete? 
     ↓ Yes          ↓ No
[pending]      [paused]
     ↓              ↓
Day1Health     Complete Profile
Verification        ↓
     ↓         [pending]
[active]            ↓
(30 days)      [active]
     ↓
[30 days end]
     ↓
Sufficient Funds?
     ↓ Yes          ↓ No
[active]      [suspended]
(renew)            ↓
               Shop/Top-up
                    ↓
               [active]
```

### Transition Logic

#### in_progress → pending
```typescript
// Triggered when funded_amount >= target_amount
// AND profile is complete

if (fundedAmount >= targetAmount && profileComplete) {
  await supabase
    .from('member_cover_plans')
    .update({
      status: 'pending',
      funded_amount: targetAmount,
      overflow_balance: fundedAmount - targetAmount
    })
    .eq('id', coverPlanId);
}
```

#### in_progress → paused
```typescript
// Triggered when funded_amount >= target_amount
// AND profile is incomplete

if (fundedAmount >= targetAmount && !profileComplete) {
  await supabase
    .from('member_cover_plans')
    .update({
      status: 'paused',
      funded_amount: targetAmount,
      overflow_balance: fundedAmount - targetAmount,
      suspended_at: new Date().toISOString()
    })
    .eq('id', coverPlanId);
}
```

#### pending → active
```typescript
// Triggered by Day1Health verification
// Admin manually activates

await supabase
  .from('member_cover_plans')
  .update({
    status: 'active',
    active_from: new Date().toISOString(),
    active_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  })
  .eq('id', coverPlanId);
```

#### active → active (renewal)
```typescript
// Triggered after 30 days
// If sufficient funds available

const now = new Date();
const activeTo = new Date(plan.active_to);

if (now >= activeTo) {
  const availableFunds = plan.overflow_balance + newCashback;
  
  if (availableFunds >= plan.target_amount) {
    await supabase
      .from('member_cover_plans')
      .update({
        funded_amount: plan.target_amount,
        overflow_balance: availableFunds - plan.target_amount,
        active_from: now.toISOString(),
        active_to: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', coverPlanId);
  }
}
```

#### active → suspended
```typescript
// Triggered after 30 days
// If insufficient funds

const now = new Date();
const activeTo = new Date(plan.active_to);

if (now >= activeTo) {
  const availableFunds = plan.overflow_balance + newCashback;
  
  if (availableFunds < plan.target_amount) {
    await supabase
      .from('member_cover_plans')
      .update({
        status: 'suspended',
        suspended_at: now.toISOString()
      })
      .eq('id', coverPlanId);
  }
}
```

#### suspended → active
```typescript
// Triggered when funds become sufficient
// Through shopping or top-up

const availableFunds = plan.overflow_balance + newCashback + topUp;

if (availableFunds >= plan.target_amount) {
  await supabase
    .from('member_cover_plans')
    .update({
      status: 'active',
      funded_amount: plan.target_amount,
      overflow_balance: availableFunds - plan.target_amount,
      active_from: new Date().toISOString(),
      active_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      suspended_at: null
    })
    .eq('id', coverPlanId);
}
```

#### paused → pending
```typescript
// Triggered when profile is completed
// While plan is paused at 100%

if (profileComplete && plan.status === 'paused') {
  await supabase
    .from('member_cover_plans')
    .update({
      status: 'pending',
      suspended_at: null
    })
    .eq('id', coverPlanId);
}
```

---

## Conclusion

The Plus1 Rewards cashback system is designed to be transparent, fair, and automated. Every transaction generates real value that directly funds medical cover plans. The system handles complex scenarios like overflow, multi-plan funding, and status transitions automatically while providing manual top-up options for flexibility.

---

**Document End**
