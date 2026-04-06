# South African Address Format Guide

## Updated Forms
✅ **Agent Add Partner Form** (`/agent/add-shop`)
✅ **Partner Registration Form** (`/partner/register`)

## Required Address Format

### Structure
```
[Unit/Shop Number], [Street Name], [Suburb], [City], [Province]
```

### Examples

**Grocery Store:**
- **Address:** `123 Voortrekker Road, Bellville, Cape Town, Western Cape`
- **Postal Code:** `7530`

**Shopping Centre:**
- **Address:** `Shop 15, Cavendish Square Shopping Centre, Dreyer Street, Claremont, Cape Town, Western Cape`
- **Postal Code:** `7708`

**Street Address:**
- **Address:** `456 Long Street, City Bowl, Cape Town, Western Cape`
- **Postal Code:** `8001`

**Industrial Area:**
- **Address:** `Unit 3A, Montague Gardens Industrial Park, Montague Gardens, Cape Town, Western Cape`
- **Postal Code:** `7441`

## Form Fields Added

### 1. Agent Add Partner Form
- ✅ Added `postal_code` field with validation
- ✅ Updated address placeholder with proper format
- ✅ Added format guidance text
- ✅ 4-digit postal code validation

### 2. Partner Registration Form  
- ✅ Added `postalCode` field with validation
- ✅ Updated address placeholder with proper format
- ✅ Added format guidance text
- ✅ 4-digit postal code validation

## Validation Rules

### Address Field
- **Required:** Yes
- **Format:** Street Number, Street Name, Suburb, City, Province
- **Example:** `123 Voortrekker Road, Bellville, Cape Town, Western Cape`

### Postal Code Field
- **Required:** Yes
- **Format:** 4 digits only
- **Pattern:** `\d{4}`
- **Examples:** `7530`, `7708`, `8001`

## Common South African Postal Codes

| Area | Postal Code |
|------|-------------|
| Cape Town CBD | 8001 |
| Bellville | 7530 |
| Claremont | 7708 |
| Woodstock | 7925 |
| Parow | 7500 |
| Goodwood | 7460 |
| Rondebosch | 7700 |
| Observatory | 7925 |
| Salt River | 7925 |
| Mowbray | 7700 |

## Benefits

1. **Map Integration:** Proper addresses ensure partners appear correctly on the map
2. **Geocoding:** Structured addresses can be easily converted to coordinates
3. **Consistency:** Standardized format across all partner registrations
4. **Validation:** Postal codes help verify address accuracy
5. **Search:** Better search functionality for members finding partners

## Database Impact

Partners created with this format will:
- Display correctly on the Find Partner map
- Have proper coordinates when geocoded
- Be searchable by location
- Show complete address information