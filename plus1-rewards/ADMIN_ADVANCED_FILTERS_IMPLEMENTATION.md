# Admin Dashboard - Advanced Filters Implementation Guide

This document outlines the advanced filtering system for all admin dashboard pages.

## Overview

The new advanced filtering system provides:
- **Multiple filter types**: text, select, date ranges, number ranges, multi-select
- **Reusable components**: `AdvancedFilters` component for consistent UI
- **Helper functions**: `filterHelpers.ts` for common filter logic
- **Active filter count**: Visual indicator of how many filters are active
- **Reset functionality**: Quick reset of all filters

## Components Created

### 1. AdvancedFilters Component
**Location**: `src/components/dashboard/AdvancedFilters.tsx`

**Features**:
- Collapsible filter panel
- Multiple filter types support
- Active filter count badge
- Reset all filters button
- Responsive grid layout

### 2. Filter Helpers
**Location**: `src/utils/filterHelpers.ts`

**Functions**:
- `applyFilters()` - Apply multiple filters to data
- `countActiveFilters()` - Count active filters
- `commonFilters` - Reusable filter functions

## Implementation Per Page

### Members Page

**Filter Configuration**:
```typescript
const memberFilters: FilterConfig[] = [
  {
    id: 'name',
    label: 'Member Name',
    type: 'text',
    placeholder: 'Search by name...'
  },
  {
    id: 'phone',
    label: 'Phone Number',
    type: 'text',
    placeholder: 'Search by phone...'
  },
  {
    id: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'Search by email...'
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'suspended', label: 'Suspended' },
      { value: 'pending', label: 'Pending' }
    ]
  },
  {
    id: 'role',
    label: 'Role',
    type: 'select',
    options: [
      { value: 'member', label: 'Member' },
      { value: 'sponsored_member', label: 'Sponsored Member' },
      { value: 'admin', label: 'Admin' }
    ]
  },
  {
    id: 'profileComplete',
    label: 'Profile Status',
    type: 'select',
    options: [
      { value: 'complete', label: 'Complete' },
      { value: 'incomplete', label: 'Incomplete' }
    ]
  },
  {
    id: 'hasCoverPlan',
    label: 'Has Cover Plan',
    type: 'select',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ]
  },
  {
    id: 'planStatus',
    label: 'Plan Status',
    type: 'multiSelect',
    options: [
      { value: 'in_progress', label: 'In Progress' },
      { value: 'pending_day1health', label: 'Pending Verification' },
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' }
    ]
  },
  {
    id: 'fundedAmount',
    label: 'Funded Amount (R)',
    type: 'numberRange',
    min: 0
  },
  {
    id: 'registrationDate',
    label: 'Registration Date',
    type: 'dateRange'
  },
  {
    id: 'city',
    label: 'City',
    type: 'text',
    placeholder: 'Search by city...'
  }
];
```

**Filter Logic**:
```typescript
const filterConfig = {
  name: (member: any, value: string) => 
    commonFilters.textMatch(getFullName(member), value),
  
  phone: (member: any, value: string) => 
    commonFilters.textMatch(member.cell_phone, value),
  
  email: (member: any, value: string) => 
    commonFilters.textMatch(member.email, value),
  
  status: (member: any, value: string) => 
    member.status === value,
  
  role: (member: any, value: string) => 
    member.role === value,
  
  profileComplete: (member: any, value: string) => {
    const isComplete = member.email && 
      !member.email.includes('@plus1rewards.local') && 
      member.sa_id && 
      member.address_line_1;
    return value === 'complete' ? isComplete : !isComplete;
  },
  
  hasCoverPlan: (member: any, value: string) => {
    const hasPlans = member.member_cover_plans && member.member_cover_plans.length > 0;
    return value === 'yes' ? hasPlans : !hasPlans;
  },
  
  planStatus: (member: any, values: string[]) => {
    if (!member.member_cover_plans || member.member_cover_plans.length === 0) return false;
    return member.member_cover_plans.some((plan: any) => values.includes(plan.status));
  },
  
  fundedAmount: (member: any, range: { from?: string; to?: string }) => {
    const total = member.member_cover_plans?.reduce((sum: number, p: any) => 
      sum + (parseFloat(p.funded_amount) || 0), 0) || 0;
    return commonFilters.numberInRange(total, range);
  },
  
  registrationDate: (member: any, range: { from?: string; to?: string }) => 
    commonFilters.dateInRange(member.created_at, range),
  
  city: (member: any, value: string) => 
    commonFilters.textMatch(member.city, value)
};
```

---

### Partners Page

**Filter Configuration**:
```typescript
const partnerFilters: FilterConfig[] = [
  {
    id: 'shopName',
    label: 'Shop Name',
    type: 'text',
    placeholder: 'Search by shop name...'
  },
  {
    id: 'phone',
    label: 'Phone Number',
    type: 'text',
    placeholder: 'Search by phone...'
  },
  {
    id: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'Search by email...'
  },
  {
    id: 'status',
    label: 'Status',
    type: 'multiSelect',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'active', label: 'Active' },
      { value: 'suspended', label: 'Suspended' },
      { value: 'rejected', label: 'Rejected' }
    ]
  },
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'grocery', label: 'Grocery Store' },
      { value: 'restaurant', label: 'Restaurant' },
      { value: 'pharmacy', label: 'Pharmacy' },
      { value: 'retail', label: 'Retail' },
      { value: 'service', label: 'Service' },
      { value: 'other', label: 'Other' }
    ]
  },
  {
    id: 'cashbackPercent',
    label: 'Cashback %',
    type: 'numberRange',
    min: 3,
    max: 40
  },
  {
    id: 'hasAgent',
    label: 'Has Agent',
    type: 'select',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ]
  },
  {
    id: 'registrationDate',
    label: 'Registration Date',
    type: 'dateRange'
  },
  {
    id: 'city',
    label: 'City',
    type: 'text',
    placeholder: 'Search by city...'
  },
  {
    id: 'hasUnpaidInvoices',
    label: 'Unpaid Invoices',
    type: 'select',
    options: [
      { value: 'yes', label: 'Has Unpaid' },
      { value: 'no', label: 'All Paid' }
    ]
  }
];
```

---

### Transactions Page

**Filter Configuration**:
```typescript
const transactionFilters: FilterConfig[] = [
  {
    id: 'transactionId',
    label: 'Transaction ID',
    type: 'text',
    placeholder: 'Search by ID...'
  },
  {
    id: 'memberName',
    label: 'Member Name',
    type: 'text',
    placeholder: 'Search member...'
  },
  {
    id: 'partnerName',
    label: 'Partner Name',
    type: 'text',
    placeholder: 'Search partner...'
  },
  {
    id: 'status',
    label: 'Status',
    type: 'multiSelect',
    options: [
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending' },
      { value: 'reversed', label: 'Reversed' },
      { value: 'disputed', label: 'Disputed' }
    ]
  },
  {
    id: 'type',
    label: 'Transaction Type',
    type: 'select',
    options: [
      { value: 'earn', label: 'Cashback Earned' },
      { value: 'spend', label: 'Spend Transaction' }
    ]
  },
  {
    id: 'purchaseAmount',
    label: 'Purchase Amount (R)',
    type: 'numberRange',
    min: 0
  },
  {
    id: 'cashbackAmount',
    label: 'Cashback Amount (R)',
    type: 'numberRange',
    min: 0
  },
  {
    id: 'date',
    label: 'Transaction Date',
    type: 'dateRange'
  },
  {
    id: 'hasAgent',
    label: 'Has Agent Commission',
    type: 'select',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ]
  }
];
```

---

### Agents Page

**Filter Configuration**:
```typescript
const agentFilters: FilterConfig[] = [
  {
    id: 'name',
    label: 'Agent Name',
    type: 'text',
    placeholder: 'Search by name...'
  },
  {
    id: 'phone',
    label: 'Phone Number',
    type: 'text',
    placeholder: 'Search by phone...'
  },
  {
    id: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'Search by email...'
  },
  {
    id: 'status',
    label: 'Status',
    type: 'multiSelect',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'active', label: 'Active' },
      { value: 'suspended', label: 'Suspended' },
      { value: 'rejected', label: 'Rejected' }
    ]
  },
  {
    id: 'partnerCount',
    label: 'Number of Partners',
    type: 'numberRange',
    min: 0
  },
  {
    id: 'totalCommission',
    label: 'Total Commission (R)',
    type: 'numberRange',
    min: 0
  },
  {
    id: 'registrationDate',
    label: 'Registration Date',
    type: 'dateRange'
  },
  {
    id: 'hasIdDocument',
    label: 'ID Document',
    type: 'select',
    options: [
      { value: 'yes', label: 'Uploaded' },
      { value: 'no', label: 'Missing' }
    ]
  }
];
```

---

### Invoices Page

**Filter Configuration**:
```typescript
const invoiceFilters: FilterConfig[] = [
  {
    id: 'invoiceNumber',
    label: 'Invoice Number',
    type: 'text',
    placeholder: 'Search by invoice #...'
  },
  {
    id: 'partnerName',
    label: 'Partner Name',
    type: 'text',
    placeholder: 'Search partner...'
  },
  {
    id: 'status',
    label: 'Payment Status',
    type: 'multiSelect',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'cancelled', label: 'Cancelled' }
    ]
  },
  {
    id: 'amount',
    label: 'Invoice Amount (R)',
    type: 'numberRange',
    min: 0
  },
  {
    id: 'issueDate',
    label: 'Issue Date',
    type: 'dateRange'
  },
  {
    id: 'dueDate',
    label: 'Due Date',
    type: 'dateRange'
  },
  {
    id: 'paidDate',
    label: 'Paid Date',
    type: 'dateRange'
  },
  {
    id: 'month',
    label: 'Billing Month',
    type: 'select',
    options: [
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
      { value: '03', label: 'March' },
      { value: '04', label: 'April' },
      { value: '05', label: 'May' },
      { value: '06', label: 'June' },
      { value: '07', label: 'July' },
      { value: '08', label: 'August' },
      { value: '09', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' }
    ]
  }
];
```

---

### Commissions Page

**Filter Configuration**:
```typescript
const commissionFilters: FilterConfig[] = [
  {
    id: 'agentName',
    label: 'Agent Name',
    type: 'text',
    placeholder: 'Search agent...'
  },
  {
    id: 'status',
    label: 'Payment Status',
    type: 'multiSelect',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'paid', label: 'Paid' },
      { value: 'processing', label: 'Processing' }
    ]
  },
  {
    id: 'amount',
    label: 'Commission Amount (R)',
    type: 'numberRange',
    min: 0
  },
  {
    id: 'period',
    label: 'Commission Period',
    type: 'dateRange'
  },
  {
    id: 'paymentDate',
    label: 'Payment Date',
    type: 'dateRange'
  },
  {
    id: 'meetsThreshold',
    label: 'Meets R500 Threshold',
    type: 'select',
    options: [
      { value: 'yes', label: 'Yes (≥R500)' },
      { value: 'no', label: 'No (<R500)' }
    ]
  }
];
```

---

### Approvals Page

**Filter Configuration**:
```typescript
const approvalFilters: FilterConfig[] = [
  {
    id: 'type',
    label: 'Approval Type',
    type: 'multiSelect',
    options: [
      { value: 'partner', label: 'Partner Registration' },
      { value: 'agent', label: 'Agent Registration' },
      { value: 'top_up', label: 'Top-Up Request' },
      { value: 'dispute', label: 'Dispute' }
    ]
  },
  {
    id: 'status',
    label: 'Status',
    type: 'multiSelect',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' }
    ]
  },
  {
    id: 'submittedDate',
    label: 'Submitted Date',
    type: 'dateRange'
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'select',
    options: [
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' }
    ]
  },
  {
    id: 'assignedTo',
    label: 'Assigned To',
    type: 'text',
    placeholder: 'Search admin name...'
  }
];
```

---

## Usage Example

```typescript
import AdvancedFilters, { FilterConfig, FilterValues } from '../AdvancedFilters';
import { applyFilters, countActiveFilters, commonFilters } from '../../../utils/filterHelpers';

// In your component
const [filterValues, setFilterValues] = useState<FilterValues>({});
const [showFilters, setShowFilters] = useState(false);

// Define your filters
const filters: FilterConfig[] = [ /* your filter config */ ];

// Define filter logic
const filterConfig = { /* your filter functions */ };

// Apply filters
const filteredData = applyFilters(data, filterValues, filterConfig);
const activeCount = countActiveFilters(filterValues);

// Render
<AdvancedFilters
  filters={filters}
  values={filterValues}
  onChange={setFilterValues}
  onReset={() => setFilterValues({})}
  isOpen={showFilters}
  onToggle={() => setShowFilters(!showFilters)}
  activeFiltersCount={activeCount}
/>
```

---

## Benefits

1. **Consistency**: Same UI/UX across all admin pages
2. **Powerful**: Multiple filter types and combinations
3. **User-friendly**: Clear labels, placeholders, and active filter count
4. **Efficient**: Only filters that have values are applied
5. **Flexible**: Easy to add new filters or modify existing ones
6. **Professional**: Suitable for staff members managing large datasets

---

## Next Steps

1. Implement advanced filters on each admin page using this guide
2. Test filter combinations thoroughly
3. Add export functionality to export filtered results
4. Consider adding saved filter presets for common queries
5. Add filter analytics to track which filters are most used
