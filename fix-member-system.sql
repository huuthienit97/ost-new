-- Fix member management system by updating database structure
-- Remove any remaining NULL division_id values
UPDATE members SET division_id = 1 WHERE division_id IS NULL;

-- Ensure all members have proper division assignments
UPDATE members SET division_id = 1 WHERE division_id = 0 OR division_id IS NULL;

-- Verify data integrity
SELECT COUNT(*) as total_members, 
       COUNT(division_id) as members_with_division
FROM members 
WHERE is_active = true;