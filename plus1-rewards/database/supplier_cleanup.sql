-- Database function to automatically clean up expired suppliers
-- This function should be run daily via a cron job or scheduled task

-- Function to clean up expired suppliers (30+ days old)
CREATE OR REPLACE FUNCTION cleanup_expired_suppliers()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
    partner_record RECORD;
BEGIN
    -- Find partners with suppliers that are 30+ days old
    FOR partner_record IN 
        SELECT id, suppliers, suppliers_updated_at
        FROM partners 
        WHERE suppliers IS NOT NULL 
        AND suppliers != '[]'::jsonb
        AND suppliers_updated_at IS NOT NULL
        AND suppliers_updated_at <= NOW() - INTERVAL '30 days'
    LOOP
        -- Clear the suppliers and reset the timestamp
        UPDATE partners 
        SET 
            suppliers = '[]'::jsonb,
            suppliers_updated_at = NULL
        WHERE id = partner_record.id;
        
        cleanup_count := cleanup_count + 1;
        
        -- Log the cleanup (optional)
        RAISE NOTICE 'Cleaned up expired suppliers for partner ID: %', partner_record.id;
    END LOOP;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get partners with suppliers expiring soon (within 7 days)
CREATE OR REPLACE FUNCTION get_suppliers_expiring_soon()
RETURNS TABLE(
    partner_id UUID,
    shop_name TEXT,
    email TEXT,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.shop_name,
        p.email,
        (30 - EXTRACT(DAY FROM (NOW() - p.suppliers_updated_at)))::INTEGER as days_remaining
    FROM partners p
    WHERE p.suppliers IS NOT NULL 
    AND p.suppliers != '[]'::jsonb
    AND p.suppliers_updated_at IS NOT NULL
    AND p.suppliers_updated_at <= NOW() - INTERVAL '23 days'  -- 7 days before expiry
    AND p.suppliers_updated_at > NOW() - INTERVAL '30 days'   -- not yet expired
    ORDER BY p.suppliers_updated_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- To manually run cleanup: SELECT cleanup_expired_suppliers();
-- To check expiring suppliers: SELECT * FROM get_suppliers_expiring_soon();

-- To set up automatic cleanup, you would create a cron job or use a scheduler like:
-- pg_cron extension (if available):
-- SELECT cron.schedule('cleanup-suppliers', '0 2 * * *', 'SELECT cleanup_expired_suppliers();');

-- Or use an external scheduler to call: SELECT cleanup_expired_suppliers();