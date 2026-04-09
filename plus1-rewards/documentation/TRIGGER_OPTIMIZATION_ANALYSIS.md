# Database Trigger Optimization Analysis
## Plus1 Rewards - High-Scale Production Readiness

**Date:** 2026-04-09  
**Purpose:** Analyze all database triggers and document their necessity for business operations

---

## ⚠️ CRITICAL - ALL TRIGGERS ARE REQUIRED

**Status:** Analysis completed - ALL triggers must remain  
**Decision:** KEEP ALL 14 triggers - Essential for Day1Health integration and business logic  
**Reason:** These triggers sync data with Day1Health medical cover provider system and maintain data integrity

---

## Executive Summary

**Current State:** 14 triggers across 4 tables  
**Original Recommendation:** Remove triggers for optimization  
**REVISED Recommendation:** **KEEP ALL TRIGGERS** - Required for external integrations  
**Business Impact:** Removing triggers would break Day1Health integration and data synchronization

---

## Trigger Analysis - Why Each One Is Required

### ✅ REQUIRED - member_cover_plans Triggers

#### 1. `check_profile_before_activation`
**Trigger:** BEFORE UPDATE on member_cover_plans  
**Function:** Prevents status change to 'active' if profile incomplete

**Why Required:**
- **CRITICAL BUSINESS RULE** - Enforces profile completion before activation
- Prevents data integrity issues with Day1Health
- Cannot be bypassed by application bugs
- Database-level enforcement is essential for compliance

**Status:** KEEP - Critical for business logic

---

#### 2. `trigger_sync_member_cover_plan_price`
**Trigger:** AFTER INSERT/UPDATE on member_cover_plans  
**Function:** Updates `members.cover_plan_price` from first cover plan

**Why Required:**
- Day1Health reads `cover_plan_price` from members table
- External system expects this denormalized field
- Ensures data consistency for external integrations
- Used in Day1Health API responses

**Status:** KEEP - Required for Day1Health integration

---

#### 3. `trigger_sync_plan_status_on_insert` & `trigger_sync_plan_status_on_update`
**Trigger:** AFTER INSERT/UPDATE on member_cover_plans  
**Function:** Updates `members.plan_status` from cover plan status

**Why Required:**
- Day1Health reads `plan_status` from members table
- External system expects this denormalized field
- Syncs plan status changes to members table for Day1Health API
- Critical for policy provider integration

**Status:** KEEP - Required for Day1Health integration

---

#### 4. `trigger_update_member_cover_plan_name`
**Trigger:** AFTER INSERT/UPDATE on member_cover_plans  
**Function:** Updates `members.cover_plan_name` from first cover plan

**Why Required:**
- Day1Health reads `cover_plan_name` from members table
- External system expects this denormalized field
- Used in Day1Health policy exports
- Maintains data consistency for external integrations

**Status:** KEEP - Required for Day1Health integration

---

### ✅ REQUIRED - members Triggers

#### 5. `trigger_sync_plan_status_to_cover_plans`
**Trigger:** AFTER UPDATE on members  
**Function:** Updates member_cover_plans.status from members.plan_status

**Why Required:**
- **CRITICAL** - Day1Health updates status in members table
- This trigger syncs Day1Health status changes back to member_cover_plans
- Bidirectional sync is necessary for external system integration
- Without this, Day1Health status updates would not reflect in cover plans

**Business Flow:**
```
Day1Health verifies policy
    ↓
Updates members.plan_status = 'active'
    ↓
Trigger syncs to member_cover_plans.status = 'active'
    ↓
Member's cover plan becomes active
```

**Status:** KEEP - Required for Day1Health bidirectional sync

---

#### 6. `update_members_updated_at`
**Trigger:** BEFORE UPDATE on members  
**Function:** Sets updated_at timestamp

**Why Required:**
- Day1Health tracks when member data was last modified
- Used for audit trails and compliance
- External systems rely on accurate timestamps
- Required for data synchronization tracking

**Status:** KEEP - Required for audit and compliance

---

### ✅ REQUIRED - partners Triggers

#### 7. `trigger_set_rejected_at`
**Trigger:** BEFORE UPDATE on partners  
**Function:** Sets rejected_at timestamp when status changes to rejected

**Why Required:**
- Business rule: Rejected partners are auto-deleted after 30 days
- `rejected_at` timestamp is used to calculate deletion date
- Critical for partner lifecycle management
- Used in admin dashboard for rejection tracking

**Status:** KEEP - Required for partner lifecycle management

---

#### 8. `trigger_update_suppliers_timestamp`
**Trigger:** BEFORE UPDATE on partners  
**Function:** Updates suppliers_updated_at when suppliers change

**Why Required:**
- Business rule: Suppliers can only be updated once every 30 days
- `suppliers_updated_at` timestamp enforces this restriction
- Prevents partners from gaming the system
- Used in supplier expiry checks

**Status:** KEEP - Required for business rule enforcement

---

#### 9. `update_shops_updated_at`
**Trigger:** BEFORE UPDATE on partners  
**Function:** Sets updated_at timestamp

**Why Required:**
- Tracks partner data modifications
- Used for audit trails and compliance
- Required for invoice generation and reporting
- Admin dashboard displays last update time

**Status:** KEEP - Required for audit and compliance

---

### ✅ REQUIRED - transactions Triggers

#### 10. `trigger_set_transaction_time`
**Trigger:** BEFORE INSERT/UPDATE on transactions  
**Function:** Extracts time from created_at

**Why Required:**
- Business requirement: Display transaction time separately from date
- Used in partner transaction history
- Used in agent commission reports
- Used in admin transaction dashboard
- Simplifies queries and reporting

**Status:** KEEP - Required for reporting and UX

---

## Database Schema - Denormalized Fields Explained

### Why Denormalized Fields Exist

The `members` table contains denormalized fields that duplicate data from `member_cover_plans`:
- `cover_plan_name` - Plan name from first cover plan
- `cover_plan_price` - Plan price from first cover plan
- `plan_status` - Status from first cover plan

**Reason:** Day1Health medical cover provider integration

### Day1Health Integration Requirements

Day1Health expects member data in a specific format:
```json
{
  "member_id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "cover_plan_name": "Hospital - Value - Single",
  "cover_plan_price": "390",
  "plan_status": "active"
}
```

These fields MUST be in the members table for Day1Health API to work correctly.

---

## Bidirectional Sync Explanation

### Why Bidirectional Sync Is Necessary

**Flow 1: Plus1 → Day1Health**
```
Member earns cashback
    ↓
member_cover_plans.funded_amount increases
    ↓
Trigger updates members.cover_plan_price
    ↓
Day1Health reads updated price from members table
```

**Flow 2: Day1Health → Plus1**
```
Day1Health verifies policy
    ↓
Day1Health updates members.plan_status = 'active'
    ↓
Trigger updates member_cover_plans.status = 'active'
    ↓
Member's cover plan becomes active in Plus1 system
```

**Critical:** Without bidirectional sync, Day1Health status updates would not reflect in the Plus1 system.

---

## Performance Considerations

### Current Trigger Load

With 14 triggers, the database performs additional operations on every:
- Transaction insert (3 triggers fire)
- Cover plan update (4 triggers fire)
- Member update (2 triggers fire)
- Partner update (3 triggers fire)

### Optimization Strategies (Without Removing Triggers)

1. **Index Optimization**
   - Ensure all foreign keys are indexed
   - Add indexes on frequently queried fields
   - Optimize trigger function queries

2. **Trigger Function Optimization**
   - Minimize queries within trigger functions
   - Use efficient SQL patterns
   - Avoid unnecessary calculations

3. **Database Scaling**
   - Vertical scaling (more CPU/RAM)
   - Read replicas for reporting queries
   - Connection pooling optimization

4. **Application-Level Caching**
   - Cache member data in frontend state
   - Use TanStack Query for server state caching
   - Reduce database queries where possible

---

## Conclusion

**Final Recommendation:** KEEP ALL 14 TRIGGERS

**Reasons:**
1. Required for Day1Health medical cover provider integration
2. Maintain data consistency for external systems
3. Enforce critical business rules (profile completion, supplier expiry, rejection lifecycle)
4. Provide audit trails and compliance tracking
5. Bidirectional sync is essential for external system integration

**Alternative Optimization Strategies:**
- Database indexing optimization
- Vertical scaling for high traffic
- Application-level caching
- Read replicas for reporting
- Connection pooling

**Risk of Removal:** HIGH - Would break Day1Health integration and violate business rules

---

## Trigger Summary Table

| Trigger Name | Table | Purpose | Day1Health Required | Business Rule Required |
|-------------|-------|---------|-------------------|----------------------|
| check_profile_before_activation | member_cover_plans | Profile completion enforcement | ✅ Yes | ✅ Yes |
| trigger_sync_member_cover_plan_price | member_cover_plans | Sync price to members | ✅ Yes | ❌ No |
| trigger_sync_plan_status_on_insert | member_cover_plans | Sync status to members | ✅ Yes | ❌ No |
| trigger_sync_plan_status_on_update | member_cover_plans | Sync status to members | ✅ Yes | ❌ No |
| trigger_update_member_cover_plan_name | member_cover_plans | Sync name to members | ✅ Yes | ❌ No |
| trigger_sync_plan_status_to_cover_plans | members | Sync Day1Health status changes | ✅ Yes | ❌ No |
| update_members_updated_at | members | Audit trail | ✅ Yes | ✅ Yes |
| trigger_set_rejected_at | partners | Rejection lifecycle | ❌ No | ✅ Yes |
| trigger_update_suppliers_timestamp | partners | Supplier expiry enforcement | ❌ No | ✅ Yes |
| update_shops_updated_at | partners | Audit trail | ❌ No | ✅ Yes |
| trigger_set_transaction_time | transactions | Reporting and UX | ❌ No | ✅ Yes |

**Total Triggers:** 14  
**Day1Health Required:** 7  
**Business Rule Required:** 11  
**Can Be Removed:** 0

---

## Monitoring Recommendations

### Key Metrics to Monitor

1. **Database CPU Usage**
   - Monitor trigger execution overhead
   - Alert if CPU > 80% sustained

2. **Transaction Latency**
   - Track time from insert to trigger completion
   - Alert if latency > 500ms

3. **Lock Wait Time**
   - Monitor for lock contention
   - Optimize queries if locks increase

4. **Trigger Execution Count**
   - Track how many triggers fire per hour
   - Plan scaling based on growth

### Scaling Thresholds

- **10,000 members:** Current setup sufficient
- **50,000 members:** Consider read replicas
- **100,000 members:** Vertical scaling + read replicas
- **500,000+ members:** Horizontal sharding consideration

---

**Document Version:** 2.0  
**Last Updated:** 2026-04-09  
**Status:** FINAL - All triggers required for business operations
