-- Fix overflow issue for members who reached 100% but overflow wasn't recorded
-- This script identifies members where funded_amount > target_amount and moves excess to overflow

-- Step 1: Check current state
SELECT 
    mcp.id,
    m.first_name,
    m.last_name,
    m.cell_phone,
    mcp.target_amount,
    mcp.funded_amount,
    mcp.overflow_balance,
    mcp.status,
    (mcp.funded_amount - mcp.target_amount) as excess_amount,
    m.email,
    m.sa_id,
    m.address_line_1
FROM member_cover_plans mcp
JOIN members m ON m.id = mcp.member_id
WHERE mcp.funded_amount > mcp.target_amount
ORDER BY mcp.created_at DESC;

-- Step 2: Fix the data - move excess to overflow and cap funded_amount at target
UPDATE member_cover_plans
SET 
    overflow_balance = overflow_balance + (funded_amount - target_amount),
    funded_amount = target_amount,
    status = CASE 
        WHEN status = 'in_progress' THEN
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM members m 
                    WHERE m.id = member_cover_plans.member_id 
                    AND m.email IS NOT NULL 
                    AND m.email NOT LIKE '%@plus1rewards.local%'
                    AND m.sa_id IS NOT NULL 
                    AND m.address_line_1 IS NOT NULL
                ) THEN 'pending'
                ELSE 'suspended'
            END
        ELSE status
    END
WHERE funded_amount > target_amount;

-- Step 3: Verify the fix
SELECT 
    mcp.id,
    m.first_name,
    m.last_name,
    m.cell_phone,
    mcp.target_amount,
    mcp.funded_amount,
    mcp.overflow_balance,
    mcp.status,
    m.email,
    m.sa_id,
    m.address_line_1
FROM member_cover_plans mcp
JOIN members m ON m.id = mcp.member_id
WHERE mcp.overflow_balance > 0 OR mcp.funded_amount >= mcp.target_amount
ORDER BY mcp.created_at DESC;
