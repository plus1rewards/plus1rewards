# Partner Recruitment with Digital Signature - Test Guide

## Quick Start

### Prerequisites
- Agent account with `status = 'active'`
- Supabase project with `documents` storage bucket
- Browser with canvas support (all modern browsers)

### Test Flow

#### 1. Login as Agent
```
URL: /agent/login
Email: [agent email]
Password: [agent password]
```

#### 2. Navigate to Add Partner Shop
```
From: Agent Dashboard
Click: "Add Partner Shop" button
URL: /agent/add-shop
```

#### 3. Fill Partner Details (Step 1)
```
Business Name: "Test Shop Johannesburg"
Contact Person: "John Manager"
Category: "Retail"
Phone: "011 555 1234"
Email: "shop@test.co.za"
Address: "123 Main Street, Johannesburg"
Cashback %: "5"
Click: "Continue to Agreement"
```

**Expected Result:**
- Partner record created in database with status `pending`
- Progress bar shows Step 1 complete
- Transitions to Step 2 (Agreement)

#### 4. Review Agreement & Sign (Step 2)
```
Read: Full agreement text
Verify: Partner details shown correctly
Verify: Cashback breakdown correct (1% system, 1% agent, 3% member)
Sign: Draw signature on canvas
Click: "Sign & Continue"
```

**Expected Result:**
- Signature captured as PNG
- Progress bar shows Step 2 complete
- Transitions to Step 3 (Confirmation)

#### 5. Confirm Connection (Step 3)
```
Verify: All partner details displayed
Verify: Signature proof message shown
Verify: Admin approval message shown
Check: Confirmation checkbox
Click: "Confirm & Complete"
```

**Expected Result:**
- Signature uploaded to Supabase Storage
- Signature URL stored in `partners.signature_url`
- `partner_agent_links` record created
- Success notification displayed
- Redirected to Agent Dashboard
- New partner appears in "My Partner Shops" list

## Database Verification

### Check Partner Record
```sql
SELECT id, shop_name, responsible_person, cashback_percent, status, signature_url, created_at
FROM partners
WHERE shop_name = 'Test Shop Johannesburg'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- `status` = `pending`
- `signature_url` = URL to PNG file in storage
- `created_at` = recent timestamp

### Check Partner-Agent Link
```sql
SELECT pal.id, pal.partner_id, pal.agent_id, pal.status, pal.linked_at
FROM partner_agent_links pal
JOIN partners p ON pal.partner_id = p.id
WHERE p.shop_name = 'Test Shop Johannesburg'
ORDER BY pal.linked_at DESC
LIMIT 1;
```

**Expected:**
- `status` = `active`
- `linked_at` = recent timestamp
- `agent_id` = current agent's ID

### Check Storage File
```
Bucket: documents
Path: partner-signatures/{partner_id}_{timestamp}.png
Expected: PNG image file with signature
```

## Test Cases

### TC-1: Valid Partner Recruitment
**Steps:**
1. Fill all required fields with valid data
2. Proceed through all 3 steps
3. Sign agreement
4. Confirm connection

**Expected:** Partner created, linked, signature stored

### TC-2: Invalid Cashback Percentage
**Steps:**
1. Enter cashback < 3% or > 40%
2. Click "Continue to Agreement"

**Expected:** Error notification "Cashback must be between 3% and 40%"

### TC-3: Missing Required Fields
**Steps:**
1. Leave required field empty
2. Click "Continue to Agreement"

**Expected:** Browser validation prevents submission

### TC-4: Signature Not Provided
**Steps:**
1. Proceed to Step 2
2. Don't draw signature
3. Try to click "Sign & Continue"

**Expected:** Button disabled, cannot proceed

### TC-5: Clear Signature
**Steps:**
1. Draw signature
2. Click "Clear Signature"
3. Verify canvas is empty

**Expected:** Canvas cleared, button disabled again

### TC-6: Back Navigation
**Steps:**
1. Complete Step 1
2. Click "Back to Details"
3. Verify form data preserved

**Expected:** Returns to Step 1, form data intact

### TC-7: Dashboard Redirect
**Steps:**
1. Complete all 3 steps
2. Wait for success notification
3. Verify redirect to dashboard

**Expected:** Redirected to /agent/dashboard, new partner visible

### TC-8: Touch Signature (Mobile)
**Steps:**
1. On mobile device, proceed to Step 2
2. Draw signature with finger
3. Proceed to completion

**Expected:** Signature captured correctly on touch

## Troubleshooting

### Signature Not Uploading
**Check:**
- Supabase storage bucket `documents` exists
- Storage permissions allow uploads
- Network connection is active
- Browser console for errors

**Solution:**
```
1. Verify bucket exists: Supabase Dashboard > Storage
2. Check RLS policies allow uploads
3. Check CORS settings
4. Retry upload
```

### Partner Not Appearing in Dashboard
**Check:**
- Partner record created (check database)
- partner_agent_links record created
- Agent ID matches current agent
- Page refreshed after redirect

**Solution:**
```
1. Verify partner_agent_links.agent_id matches current agent
2. Refresh dashboard page
3. Check browser console for errors
4. Verify RLS policies
```

### Signature URL Not Stored
**Check:**
- Storage upload succeeded
- Public URL generated correctly
- Database update succeeded

**Solution:**
```
1. Check Supabase Storage for file
2. Verify file is public
3. Check database update query
4. Check browser console for errors
```

### Canvas Not Drawing
**Check:**
- Browser supports canvas
- Canvas element is visible
- Touch/mouse events firing

**Solution:**
```
1. Try different browser
2. Check browser console for errors
3. Verify canvas dimensions
4. Try mouse instead of touch (or vice versa)
```

## Performance Metrics

### Expected Load Times
- Step 1 (Details): < 1 second
- Step 2 (Agreement): < 2 seconds
- Step 3 (Confirmation): < 3 seconds
- Signature Upload: < 5 seconds
- Total Flow: < 15 seconds

### File Sizes
- Signature PNG: 10-50 KB (typical)
- Agreement Text: ~2 KB
- Form Data: ~1 KB

## Regression Testing

After any changes to:
- `AgentAddPartner.tsx`
- `partners` table schema
- `partner_agent_links` table schema
- Supabase storage configuration

Run full test flow to verify:
1. All 3 steps work correctly
2. Database records created properly
3. Signature uploads successfully
4. Dashboard displays new partner
5. No console errors

## Sign-Off Checklist

- [ ] All test cases pass
- [ ] Database records verified
- [ ] Storage file verified
- [ ] Dashboard displays partner
- [ ] No console errors
- [ ] Mobile signature works
- [ ] Back navigation works
- [ ] Error handling works
- [ ] Notifications display correctly
- [ ] Performance acceptable

## Notes

- Signature data is stored as PNG image
- Timestamp included in filename for uniqueness
- Partner status remains `pending` until admin approval
- Agent can see partner in dashboard immediately
- Commission tracking begins after admin approval
