# Project Cleanup Guide - Safe to Delete Files

This document lists files and components that are safe to delete to reduce project clutter. These files are either unused, duplicated, or replaced by newer implementations.

## ⚠️ CRITICAL - DO NOT DELETE

These dashboards are **ACTIVELY IN USE** and must be kept:

### Active Dashboards (KEEP)
- `src/pages/PolicyProviderDashboard.tsx` - **CURRENT PROVIDER DASHBOARD** (in use)
- `src/pages/AgentDashboard.tsx` - **CURRENT AGENT DASHBOARD** (in use)
- `src/pages/DashboardNew.tsx` - **CURRENT MEMBER DASHBOARD** (in use)
- `src/components/dashboard/Dashboard.tsx` - **ADMIN DASHBOARD** (in use)
- `src/components/partner/PartnerDashboard.tsx` - **PARTNER DASHBOARD** (in use)

### Active Dashboard Pages (KEEP)
- `src/components/dashboard/pages/` - **ALL ADMIN PAGES** (in use)
  - `AdminChatDashboard.tsx`
  - `AgentsPage.tsx`
  - `ApprovalsPage.tsx`
  - `AuditLogsPage.tsx`
  - `CommissionsPage.tsx`
  - `CoverPlansPage.tsx`
  - `DisputesPage.tsx`
  - `ExportsPage.tsx`
  - `InvoicesPage.tsx`
  - `MembersPage.tsx`
  - `PartnersPage.tsx`
  - `ProvidersPage.tsx`
  - `SettingsPage.tsx`
  - `TopUpsPage.tsx`
  - `TransactionsPage.tsx`

## 🗑️ SAFE TO DELETE

### Unused Provider Dashboard System
These files are from an old provider dashboard implementation that is no longer used:

```
src/components/provider/
├── ProviderDashboard.tsx          # OLD - replaced by PolicyProviderDashboard.tsx
├── ProviderLayout.tsx             # OLD - only used by old dashboard
├── pages/
│   └── Dashboard.tsx              # OLD - replaced by PolicyProviderDashboard.tsx
└── components/                    # OLD - entire directory unused
    ├── FinancialSummary.tsx
    ├── MonthlyBatchReporting.tsx
    ├── PlanBreakdown.tsx
    ├── PolicyStatsCard.tsx
    ├── ProviderFooter.tsx
    └── ShopContribution.tsx
```

### Unused Hook
```
src/hooks/useProviderDashboard.ts  # OLD - only used by deleted provider dashboard
```

### Potentially Unused Partner Components
**⚠️ VERIFY BEFORE DELETING** - Check if these are imported anywhere:

```
src/components/partner/pages/      # Check if these are used
├── MonthlyInvoice.tsx
├── QuickTransaction.tsx
└── TransactionHistory.tsx
```

## 🔍 VERIFICATION STEPS

Before deleting any files, run these checks:

### 1. Search for Imports
```bash
# Search for any imports of the file you want to delete
grep -r "import.*FileName" src/
```

### 2. Search for Usage
```bash
# Search for component usage
grep -r "ComponentName" src/
```

### 3. Check Routes
Look in `src/App.tsx` to see if the component is used in any routes.

## 📋 DELETION CHECKLIST

### Phase 1: Provider Dashboard Cleanup (SAFE)
- [ ] Delete `src/components/provider/ProviderDashboard.tsx`
- [ ] Delete `src/components/provider/ProviderLayout.tsx`
- [ ] Delete `src/components/provider/pages/Dashboard.tsx`
- [ ] Delete entire `src/components/provider/components/` directory
- [ ] Delete `src/hooks/useProviderDashboard.ts`

### Phase 2: Verify Partner Components (VERIFY FIRST)
- [ ] Check if `MonthlyInvoice.tsx` is imported anywhere
- [ ] Check if `QuickTransaction.tsx` is imported anywhere  
- [ ] Check if `TransactionHistory.tsx` is imported anywhere
- [ ] Delete only if no imports found

## 🎯 EXPECTED RESULTS

After cleanup:
- **Reduced confusion** - Only one provider dashboard (the correct one)
- **Smaller bundle size** - Removed unused components
- **Cleaner codebase** - Less clutter in file explorer
- **No functionality loss** - All active features preserved

## 🚨 ROLLBACK PLAN

If something breaks after deletion:
1. Check git history: `git log --oneline`
2. Restore deleted files: `git checkout HEAD~1 -- path/to/file`
3. Or revert entire commit: `git revert <commit-hash>`

## 📝 NOTES

- The current provider dashboard (`PolicyProviderDashboard.tsx`) is fully functional and modern
- The old provider dashboard system was causing import conflicts and confusion
- All active dashboards use different patterns and are not interchangeable
- Partner dashboard components may have dependencies - verify before deleting

---

**Last Updated:** $(date)
**Created By:** Kiro AI Assistant
**Purpose:** Clean up dashboard component confusion