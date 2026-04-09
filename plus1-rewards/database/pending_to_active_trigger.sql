-- Trigger to automatically set active_from and active_to when status changes from pending to active
-- This will be triggered when Day1Health updates the member_cover_plans status to 'active'

CREATE OR REPLACE FUNCTION set_active_dates_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status is changing from 'pending' to 'active'
  IF OLD.status = 'pending' AND NEW.status = 'active' THEN
    -- Set active_from to current timestamp
    NEW.active_from = NOW();
    
    -- Set active_to to 30 days from now
    NEW.active_to = NOW() + INTERVAL '30 days';
    
    -- Log this activation
    RAISE NOTICE 'Policy activated for member_cover_plan_id: %, active_from: %, active_to: %', 
                 NEW.id, NEW.active_from, NEW.active_to;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_active_dates ON member_cover_plans;

-- Create the trigger
CREATE TRIGGER trigger_set_active_dates
  BEFORE UPDATE ON member_cover_plans
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION set_active_dates_on_approval();

-- Comment on the trigger
COMMENT ON TRIGGER trigger_set_active_dates ON member_cover_plans IS 
'Automatically sets active_from and active_to dates when a policy status changes from pending to active';
