# Plan Renewal Flow - Correct Logic

## Initial Funding (0% → 100%)

When a member first joins and earns cashback:
- Cashback goes to `funded_amount` until plan reaches 100%
- At 100%:
  - If profile complete: Status = `active`, `active_to` = NOW + 30 days
  - If profile incomplete: Status = `paused`, no expiration set

## While Active (After 100%)

Once a plan is active:
- ALL cashback goes to `overflow_balance`
- `funded_amount` stays at 100% (target_amount)
- Plan is active for 30 days

## After 30 Days (Renewal Check)

Daily at 2 AM, the system checks all expired plans:

### For Members with Only Their Own Plan:
1. Check if `overflow_balance` ≥ `target_amount`
2. **IF YES:**
   - Deduct from overflow
   - Set status = `active`
   - Set `active_to` = NOW + 30 days
3. **IF NO:**
   - Set status = `paused`
   - Wait for more overflow

### For Members Who Sponsor Someone:

**Priority Order:**
1. **FIRST:** Check YOUR own plan(s) (in creation_order)
   - If overflow ≥ your plan amount: Renew YOUR plan
   - If not enough: Pause YOUR plan
2. **THEN:** Check sponsored plans (oldest first)
   - If overflow ≥ sponsored plan amount: Renew sponsored plan
   - If not enough: Pause sponsored plan

**Example:**
- You have R500 overflow
- Your plan needs R385
- Sponsored plan needs R390

**Result:**
- Your plan: Renewed (R500 - R385 = R115 left)
- Sponsored plan: Paused (R115 < R390)

## Automatic Reactivation

When you earn cashback and it goes to overflow:
- System automatically checks for paused plans
- Same priority: YOUR plans first, then sponsored plans
- Reactivates plans if you now have enough overflow

## Key Points

1. ✅ Cashback goes to overflow when plan is active (100%)
2. ✅ Plans expire after 30 days
3. ✅ YOUR plans are always checked/renewed FIRST
4. ✅ Sponsored plans are checked AFTER your plans
5. ✅ Both can be paused independently
6. ✅ Both reactivate automatically when you have overflow

## Database Functions

- `renew_all_active_plans()` - Daily cron at 2 AM
- `reactivate_paused_sponsored_plans(member_id)` - Called after transactions

## Status Flow

```
[0-99%] in_progress
    ↓
[100% + profile complete] active (30 days)
    ↓
[After 30 days + enough overflow] active (renewed)
    ↓
[After 30 days + insufficient overflow] paused
    ↓
[Earn overflow] active (reactivated)
```
