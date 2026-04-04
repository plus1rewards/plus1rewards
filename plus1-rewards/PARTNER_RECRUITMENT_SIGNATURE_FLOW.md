# Partner Shop Recruitment with Digital Signature Flow

## Overview

This document describes the complete Partner Shop Recruitment flow with digital signature capture, which provides proof that a partner shop owner has agreed to be connected to a specific agent.

## Business Flow

### Step 1: Agent Enters Partner Details
- Agent navigates to "Add Partner Shop" from their dashboard
- Fills in partner shop information:
  - Business name
  - Contact person
  - Phone number
  - Email
  - Physical address
  - Category
  - Cashback percentage (3-40%)
- Partner record is created in the database with status `pending`

### Step 2: Partner Agreement & Digital Signature
- Partner is presented with the Plus1 Rewards Partner Agreement
- Agreement includes:
  - Cashback structure breakdown (1% system, 1% agent, remainder to member)
  - Payment terms (monthly invoicing, 7-day payment window)
  - Partner obligations (accurate transaction processing, KYC compliance)
  - Account approval requirements
  - Termination clauses
  - Data protection commitments
- Partner digitally signs the agreement using canvas-based signature capture
- Signature is captured as PNG image data

### Step 3: Confirmation & Connection
- Partner confirms: "I agree that [Contact Person] from [Shop Name] has digitally signed this agreement"
- System uploads signature to Supabase Storage (`documents` bucket)
- Signature URL is stored in `partners.signature_url`
- `partner_agent_links` record is created with:
  - `partner_id`: The newly created partner
  - `agent_id`: The recruiting agent
  - `status`: `active`
  - `linked_at`: Current timestamp
- Success notification is shown
- Agent is redirected to dashboard

## Database Schema

### Key Tables

#### `partners` table
- `id` (UUID): Primary key
- `shop_name` (text): Business name
- `phone` (text): Contact phone
- `email` (text, nullable): Contact email
- `address` (text): Physical address
- `category` (text, nullable): Business category
- `cashback_percent` (numeric): Cashback rate (3-40%)
- `responsible_person` (text): Contact person name
- `signature_url` (text, nullable): **NEW** - URL to signed agreement
- `status` (text): `pending`, `active`, `suspended`, `rejected`
- `created_at` (timestamp): Record creation time
- `updated_at` (timestamp): Last update time

#### `partner_agent_links` table
- `id` (UUID): Primary key
- `partner_id` (UUID): Foreign key to partners
- `agent_id` (UUID): Foreign key to agents
- `linked_at` (timestamp): When the link was created
- `status` (text): `active` or `inactive`

### Storage

#### Supabase Storage
- **Bucket**: `documents`
- **Path Pattern**: `partner-signatures/{partner_id}_{timestamp}.png`
- **File Type**: PNG image (canvas signature)
- **Access**: Public URL stored in `partners.signature_url`

## Technical Implementation

### Component: `AgentAddPartner.tsx`

#### State Management
```typescript
const [step, setStep] = useState<'details' | 'agreement' | 'confirmation'>('details');
const [form, setForm] = useState<FormData>({ /* partner details */ });
const [signatureData, setSignatureData] = useState<string | null>(null);
const [partnerCreated, setPartnerCreated] = useState<any>(null);
const [hasSignature, setHasSignature] = useState(false);
```

#### Step 1: Details Form
- Validates all required fields
- Creates partner record in database
- Transitions to agreement step

#### Step 2: Agreement & Signature
- Displays full agreement text
- Canvas-based signature capture
- Mouse and touch support
- Clear signature button
- Validates signature exists before proceeding

#### Step 3: Confirmation
- Shows summary of partner details
- Displays signature proof confirmation
- Requires checkbox confirmation
- Uploads signature to storage
- Creates partner_agent_links record
- Stores signature URL in partner record

### Key Functions

#### `handleDetailsSubmit()`
- Validates cashback percentage (3-40%)
- Creates partner record with status `pending`
- Stores partner data in state
- Transitions to agreement step

#### `handleSignAgreement()`
- Converts canvas to PNG data URL
- Stores signature data in state
- Transitions to confirmation step

#### `handleConfirmConnection()`
- Converts signature data URL to blob
- Uploads blob to Supabase Storage
- Gets public URL from storage
- Updates partner record with signature_url
- Creates partner_agent_links record
- Shows success notification
- Redirects to dashboard

#### Canvas Signature Functions
- `initializeCanvas()`: Sets up canvas context and drawing style
- `startDrawing()`: Begins signature capture
- `draw()`: Draws on canvas as user moves mouse/touch
- `stopDrawing()`: Ends signature capture
- `clearSignature()`: Clears canvas for redraw

## User Experience

### Progress Indicator
- Visual 3-step progress bar
- Shows current step and completed steps
- Helps user understand where they are in the process

### Navigation
- "Back to Details" button on agreement step
- "Back to Signature" button on confirmation step
- "Back to Dashboard" button in header (cancels entire flow)

### Validation
- Required fields marked with asterisks
- Cashback percentage validated (3-40%)
- Signature required before proceeding
- Checkbox confirmation required on final step

### Notifications
- Success notification on completion
- Error notifications for any failures
- Auto-dismiss after 5 seconds

## Security Considerations

### Signature Proof
- Digital signature serves as proof of agreement
- Stored as immutable PNG file in Supabase Storage
- URL stored in database for audit trail
- Timestamp included in filename for uniqueness

### Data Protection
- Partner data stored in Supabase with RLS policies
- Signature files stored in documents bucket
- Agent can only see their own recruited partners
- Admin can view all partner-agent links

### Validation
- Cashback percentage constrained to 3-40%
- Phone number format validation
- Email format validation
- Required fields enforced

## Admin Approval Process

After partner recruitment with signature:
1. Partner record created with status `pending`
2. Admin reviews partner details and signature
3. Admin approves or rejects partner
4. If approved, status changes to `active`
5. Partner can then process member transactions
6. Agent begins earning commissions

## Commission Tracking

Once partner is approved:
- Transactions are recorded in `transactions` table
- Agent commission (1%) is calculated per transaction
- Monthly commissions aggregated in `agent_commissions` table
- Agent can view commission breakdown in dashboard

## Testing Checklist

- [ ] Agent can navigate to "Add Partner Shop"
- [ ] Form validation works (required fields, cashback range)
- [ ] Partner record is created with status `pending`
- [ ] Agreement displays correctly with partner details
- [ ] Signature canvas works with mouse input
- [ ] Signature canvas works with touch input
- [ ] Clear signature button resets canvas
- [ ] Cannot proceed without signature
- [ ] Confirmation step shows all details
- [ ] Checkbox confirmation is required
- [ ] Signature uploads to storage successfully
- [ ] Signature URL is stored in partner record
- [ ] partner_agent_links record is created
- [ ] Success notification displays
- [ ] Agent is redirected to dashboard
- [ ] Partner appears in agent's dashboard
- [ ] Admin can see signature URL in partner details
- [ ] Partner status is `pending` until admin approval

## Future Enhancements

1. **Email Notifications**
   - Send partner agreement to email
   - Send admin notification of new recruitment
   - Send approval notification to agent

2. **Signature Verification**
   - Add timestamp to signature
   - Add agent name to signature
   - Add partner name to signature

3. **Audit Trail**
   - Log all signature events
   - Track signature uploads
   - Track approval/rejection

4. **Mobile Optimization**
   - Improve touch signature capture
   - Add stylus support
   - Optimize canvas size for mobile

5. **Document Management**
   - Generate PDF with signature
   - Email PDF to partner
   - Store PDF in addition to PNG

## Related Files

- `src/pages/AgentAddPartner.tsx` - Main component
- `src/pages/AgentDashboard.tsx` - Agent dashboard (shows recruited partners)
- `src/components/Notification.tsx` - Notification system
- `src/lib/supabase.ts` - Supabase client configuration
- Database schema: `partner_agent_links`, `partners` tables
