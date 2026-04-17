# Plan Status Sync Function Implementation

## Problem
When a member's `plan_status` was changed in the `members` table to 'active', the corresponding `status` in the `member_cover_plans` table remained 'pending', causing a mismatch.

## Solution
Created a PostgreSQL trigger function that automatically syncs the `plan_status` from the `members` table to the `status` column in the `member_cover_plans` table.

## Implementation Details

### Trigger Function: `sync_member_plan_status_to_cover_plans()`
- **Type**: AFTER UPDATE trigger on `members` table
- **Behavior**: When `members.plan_status` changes, automatically updates the primary cover plan (creation_order = 1) in `member_cover_plans` table
- **Scope**: Only updates the primary plan (creation_order = 1) to avoid affecting secondary/sponsored plans

### How It Works
1. Listens for UPDATE events on the `members` table
2. Checks if `plan_status` has changed (NEW.plan_status IS DISTINCT FROM OLD.plan_status)
3. If changed, updates the corresponding `member_cover_plans` record where:
   - `member_id` matches the updated member
   - `creation_order = 1` (primary plan only)
   - `plan_status` is not NULL

### Data Sync
- Existing data was synced: 1 member record was updated
- Member ID: `7c191409-78d3-4735-8eef-4952fdfc6d88`
- Status changed from: `pending` → `active`

## Testing
The trigger is now active and will automatically sync any future changes to `members.plan_status` to the corresponding `member_cover_plans.status`.

## SQL Migration Applied
```sql
CREATE OR REPLACE FUNCTION sync_member_plan_status_to_cover_plans()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_status IS DISTINCT FROM OLD.plan_status THEN
    UPDATE member_cover_plans
    SET status = NEW.plan_status
    WHERE member_id = NEW.id
      AND creation_order = 1
      AND NEW.plan_status IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_member_plan_status
AFTER UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION sync_member_plan_status_to_cover_plans();
```

## Result
✅ Trigger created successfully
✅ Existing data synced
✅ Future updates will automatically sync between tables
