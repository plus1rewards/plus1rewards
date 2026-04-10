# Sponsored Plan Testing Guide

This guide shows you how to test the sponsored plan renewal flow without waiting 30 days.

## Test Scenarios

### Scenario 1: Sponsor Has Enough Overflow (Happy Path)

**Setup:**
1. Create a sponsor member with a main plan
2. Give sponsor some overflow (e.g., R500)
3. Sponsor creates a sponsored member with R390 plan
4. Simulate 30-day expiration

**Test Steps:**

```sql
-- 1. Check current state
SELECT 
  m.first_name,
  m.last_name,
  mcp.status,
  mcp.overflow_balance,
  mcp.active_to,
  mcp.sponsored_by
FROM member_cover_plans mcp
JOIN members m ON m.id = mcp.member_id
WHERE mcp.sponsored_by IS NOT NULL OR mcp.overflow_balance > 0;

-- 2. Run the test renewal function (simulates 30-day check)
SELECT * FROM test_renew_sponsored_plans();

-- 3. Verify results
-- Sponsored plan should be: status = 'active', active_to = now + 30 days
-- Sponsor overflow should be: reduced by R390
SELECT 
  m.first_name,
  m.last_name,
  mcp.status,
  mcp.overflow_balance,
  mcp.active_to,
  mcp.sponsored_by
FROM member_cover_plans mcp
JOIN members m ON m.id = mcp.member_id
WHERE mcp.sponsored_by IS NOT NULL OR mcp.overflow_balance > 0;
```

**Expected Result:**
- ✅ Sponsored plan status: `active`
- ✅ Sponsor overflow: Reduced by R390
- ✅ Wallet entries created for both sponsor and sponsored member

---

### Scenario 2: Sponsor Has Insufficient Overflow (Pause Path)

**Setup:**
1. Create a sponsor member with a main plan
2. Give sponsor minimal overflow (e.g., R50 - less than R390)
3. Sponsor creates a sponsored member with R390 plan
4. Simulate 30-day expiration

**Test Steps:**

```sql
-- 1. Set sponsor's overflow to low amount (for testing)
UPDATE member_cover_plans
SET overflow_balance = 50
WHERE member_id = 'YOUR_SPONSOR_ID' AND creation_order = 1;

-- 2. Run the test renewal function
SELECT * FROM test_renew_sponsored_plans();

-- 3. Verify results
SELECT 
  m.first_name,
  m.last_name,
  mcp.status,
  mcp.overflow_balance,
  mcp.active_to,
  mcp.sponsored_by
FROM member_cover_plans mcp
JOIN members m ON m.id = mcp.member_id
WHERE mcp.sponsored_by IS NOT NULL OR mcp.overflow_balance > 0;
```

**Expected Result:**
- ✅ Sponsored plan status: `paused`
- ✅ Sponsor overflow: Unchanged (R50)
- ✅ No wallet entries created

---

### Scenario 3: Automatic Reactivation When Sponsor Earns Cashback

**Setup:**
1. Have a sponsored plan in `paused` status (from Scenario 2)
2. Sponsor earns cashback that increases overflow above R390

**Test Steps:**

```sql
-- 1. Verify sponsored plan is paused
SELECT 
  m.first_name,
  mcp.status,
  mcp.sponsored_by
FROM member_cover_plans mcp
JOIN members m ON m.id = mcp.member_id
WHERE mcp.sponsored_by IS NOT NULL;

-- 2. Manually add overflow to sponsor (simulating cashback earned)
UPDATE member_cover_plans
SET overflow_balance = 500
WHERE member_id = 'YOUR_SPONSOR_ID' AND creation_order = 1;

-- 3. Manually trigger reactivation (normally happens after transaction)
SELECT * FROM reactivate_paused_sponsored_plans('YOUR_SPONSOR_ID');

-- 4. Verify results
SELECT 
  m.first_name,
  mcp.status,
  mcp.overflow_balance,
  mcp.active_to,
  mcp.sponsored_by
FROM member_cover_plans mcp
JOIN members m ON m.id = mcp.member_id
WHERE mcp.sponsored_by IS NOT NULL OR mcp.overflow_balance > 0;
```

**Expected Result:**
- ✅ Sponsored plan status: `active`
- ✅ Sponsor overflow: Reduced by R390
- ✅ Wallet entries created

---

## Manual Date Manipulation (Alternative Testing Method)

If you want to test the actual `renew_sponsored_plans()` function (not the test version), you can manually set the `active_to` date to the past:

```sql
-- 1. Set sponsored plan's active_to to yesterday (simulate expiration)
UPDATE member_cover_plans
SET active_to = NOW() - INTERVAL '1 day'
WHERE sponsored_by IS NOT NULL;

-- 2. Run the REAL renewal function
SELECT * FROM renew_sponsored_plans();

-- 3. Verify results
SELECT 
  m.first_name,
  mcp.status,
  mcp.active_to,
  mcp.sponsored_by
FROM member_cover_plans mcp
JOIN members m ON m.id = mcp.member_id
WHERE mcp.sponsored_by IS NOT NULL;
```

---

## Quick Test Commands

### Check Sponsor's Overflow
```sql
SELECT 
  m.first_name,
  m.last_name,
  mcp.overflow_balance,
  mcp.creation_order
FROM member_cover_plans mcp
JOIN members m ON m.id = mcp.member_id
WHERE mcp.creation_order = 1
ORDER BY m.first_name;
```

### Check All Sponsored Plans
```sql
SELECT 
  sponsor.first_name || ' ' || sponsor.last_name as sponsor_name,
  sponsored.first_name || ' ' || sponsored.last_name as sponsored_name,
  mcp.status,
  mcp.active_to,
  mcp.target_amount,
  mcp.funded_amount
FROM member_cover_plans mcp
JOIN members sponsored ON sponsored.id = mcp.member_id
JOIN members sponsor ON sponsor.id = mcp.sponsored_by
WHERE mcp.sponsored_by IS NOT NULL;
```

### Check Wallet Entries
```sql
SELECT 
  m.first_name || ' ' || m.last_name as member_name,
  w.entry_type,
  w.amount,
  w.balance_after,
  w.created_at
FROM cover_plan_wallet_entries w
JOIN members m ON m.id = w.member_id
WHERE w.entry_type LIKE '%sponsor%'
ORDER BY w.created_at DESC
LIMIT 20;
```

### Reset Test Data (Clean Up)
```sql
-- Delete test wallet entries
DELETE FROM cover_plan_wallet_entries
WHERE entry_type LIKE '%test%';

-- Reset sponsored plan status
UPDATE member_cover_plans
SET status = 'active', active_to = NOW() + INTERVAL '30 days'
WHERE sponsored_by IS NOT NULL;
```

---

## Testing Checklist

- [ ] Test with sufficient overflow (should activate)
- [ ] Test with insufficient overflow (should pause)
- [ ] Test automatic reactivation after earning cashback
- [ ] Verify wallet entries are created correctly
- [ ] Check that oldest paused plans are reactivated first (if multiple)
- [ ] Verify sponsor's overflow is deducted correctly
- [ ] Confirm sponsored plan's active_to is set to +30 days

---

## Common Issues

**Issue:** Function returns empty result
- **Solution:** Make sure you have sponsored plans in the database

**Issue:** Overflow not deducting
- **Solution:** Check that sponsor has a plan with `creation_order = 1`

**Issue:** Status not changing
- **Solution:** Verify the plan's current status is `active` or `paused`

---

## Production Monitoring

The real `renew_sponsored_plans()` function runs daily at 2 AM via cron job.

To check cron job status:
```sql
SELECT * FROM cron.job WHERE jobname = 'renew-sponsored-plans-daily';
```

To manually trigger the production renewal:
```sql
SELECT * FROM renew_sponsored_plans();
```

To check recent cron job runs:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'renew-sponsored-plans-daily')
ORDER BY start_time DESC
LIMIT 10;
```
