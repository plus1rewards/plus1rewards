# Transaction & Overflow Analysis: Frikkie Du Toit (0215551111)

## Member Information
- **Name:** Frikkie Du Toit
- **Phone:** 0215551111
- **Email:** frik@out.com
- **Status:** Active
- **Member ID:** c3e92986-74a4-4dc1-8f9c-9b1a1ab07a0c

## Current Cover Plan Status
- **Plan:** Hospital - Value
- **Creation Order:** 1
- **Target Amount:** R390.00
- **Funded Amount:** R381.30
- **Overflow Balance:** R12.60
- **Status:** in_progress (97.77% funded)
- **Active Period:** Not yet active

## Transaction History (6 Transactions)

| Date/Time | Shop | Purchase | Cashback % | Member Amount | Agent | System | Status |
|-----------|------|----------|------------|---------------|-------|--------|--------|
| 2026-04-17 06:04:14 | 1-Up | R600.00 | 5% | R18.00 | R6.00 | R6.00 | completed |
| 2026-04-17 06:03:53 | 1-Up | R400.00 | 5% | R12.00 | R4.00 | R4.00 | completed |
| 2026-04-17 06:01:33 | 1-Up | R500.00 | 5% | R15.00 | R5.00 | R5.00 | completed |
| 2026-04-17 06:00:28 | 1-Up | R544.00 | 5% | R16.32 | R5.44 | R5.44 | completed |
| 2026-04-17 05:59:40 | 1-Up | R8000.00 | 5% | R240.00 | R80.00 | R80.00 | completed |
| 2026-04-17 05:59:14 | 1-Up | R3666.00 | 5% | R109.98 | R36.66 | R36.66 | completed |

**Total Purchases:** R13,710.00  
**Total Member Cashback:** R411.30  
**Total Agent Commission:** R137.10  
**Total System Fee:** R137.10

## Wallet Entry Analysis

### Transaction 1: R3666.00 purchase (R109.98 cashback)
- Entry: `cashback_added` → R109.98
- Balance After: R109.98
- **Status:** Plan at 28.20% funded

### Transaction 2: R8000.00 purchase (R240.00 cashback)
- Entry: `cashback_added` → R240.00
- Balance After: R349.98
- **Status:** Plan at 89.74% funded

### Transaction 3: R544.00 purchase (R16.32 cashback)
- Entry: `cashback_added` → R16.32
- Balance After: R366.30
- **Status:** Plan at 93.92% funded

### Transaction 4: R500.00 purchase (R15.00 cashback)
- Entry: `cashback_added` → R15.00
- Balance After: R381.30
- **Status:** Plan at 97.77% funded

### Transaction 5: R400.00 purchase (R12.00 cashback)
- Entry 1: `cashback_added` → R8.70
- Balance After: R390.00 (100% funded!)
- Entry 2: `overflow_added` → R3.30
- Balance After: R3.30 overflow
- **Status:** Plan reached 100%, overflow started

### Transaction 6: R600.00 purchase (R18.00 cashback)
- Entry 1: `cashback_added` → R8.70
- Balance After: R390.00 (stays at 100%)
- Entry 2: `overflow_added` → R9.30
- Balance After: R12.60 overflow
- **Status:** Plan at 100%, overflow accumulated

## ISSUE IDENTIFIED: Overflow Deduction Problem

### The Problem
Looking at the screenshot and database:
- **UI Shows:** "POLICY DEDUCTIONS: -R381.30"
- **Database Shows:** 
  - Funded Amount: R381.30
  - Overflow Balance: R12.60
  - Total Lifetime Earned: R411.30

### What Should Happen
According to the business rules:
1. Plan should be at 100% funded (R390.00)
2. Overflow should be R21.30 (R411.30 - R390.00)
3. No "policy deductions" should appear until plan is active

### What Actually Happened
1. ✅ Transactions processed correctly (R411.30 total earned)
2. ❌ Plan shows R381.30 funded (should be R390.00)
3. ❌ Overflow shows R12.60 (should be R21.30)
4. ❌ UI shows "-R381.30" as policy deductions (incorrect)

### Mathematical Verification

**Expected Calculation:**
```
Total Earned: R411.30
Target: R390.00
Overflow: R411.30 - R390.00 = R21.30

Plan Funded: R390.00 ✓
Overflow: R21.30 ✓
```

**Actual Database State:**
```
Total Earned: R411.30
Plan Funded: R381.30 ❌
Overflow: R12.60 ❌
Missing: R17.40 (R390.00 - R381.30 + R21.30 - R12.60)
```

### Root Cause Analysis

The issue appears to be in the cashback allocation logic. Looking at transactions 5 and 6:

**Transaction 5 (R400 purchase, R12 cashback):**
- Should add: R8.70 to plan (to reach R390)
- Should add: R3.30 to overflow
- ✅ This was done correctly

**Transaction 6 (R600 purchase, R18 cashback):**
- Should add: R0.00 to plan (already at R390)
- Should add: R18.00 to overflow
- ❌ Actually added: R8.70 to plan, R9.30 to overflow

### The Bug
The system is incorrectly adding cashback to the plan even after it reaches R390.00. This causes:
1. Plan to show incorrect funded amount
2. Overflow to be understated
3. UI to display confusing "policy deductions"

## Recommended Fix

The cashback allocation function needs to:
1. Check if plan is already at 100% (R390.00)
2. If yes, ALL new cashback goes to overflow
3. If no, split appropriately

### Current Behavior (WRONG):
```javascript
// Transaction 6: Plan already at R390
cashback_to_plan = R8.70  // ❌ Should be R0
overflow = R9.30          // ❌ Should be R18
```

### Expected Behavior (CORRECT):
```javascript
// Transaction 6: Plan already at R390
if (funded_amount >= target_amount) {
  cashback_to_plan = R0     // ✓
  overflow = R18.00         // ✓
}
```

## Impact
- Member sees incorrect funded amount
- Overflow balance is understated by R8.70
- "Policy deductions" label is misleading
- Plan status stuck at "in_progress" instead of moving to "pending"

## Next Steps
1. Fix the cashback allocation logic in transaction processing
2. Run a data correction script for Frikkie's account
3. Verify other members aren't affected by the same bug
4. Update UI to not show "policy deductions" for in_progress plans
