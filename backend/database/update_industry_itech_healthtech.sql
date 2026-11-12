-- Migration: Add ITech Industry, Update Healthcare to HealthTech, Update HR Tech to HRTech, Merge Finance into FinTech
-- Date: 2026-11-06

-- 1. Insert ITech industry category if not exists
INSERT INTO categories (name, slug, type, parent_id)
SELECT 'ITech', 'itech', 'industry', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'itech' OR name = 'ITech');

-- 2. Update Healthcare to HealthTech
UPDATE categories 
SET name = 'HealthTech', slug = 'healthtech', type = 'industry' 
WHERE id = 14 OR slug = 'healthcare' OR name = 'Healthcare';

-- 3. Update HR Tech to HRTech
UPDATE categories 
SET name = 'HRTech', type = 'industry' 
WHERE id = 16 OR slug = 'hr-tech' OR name = 'HR Tech';

-- 4. Reassign contents from Finance (15) to FinTech (19) and remove duplicate Finance
UPDATE contents SET category_id = 19 WHERE category_id = 15;
UPDATE contents_latest SET category_id = 19 WHERE category_id = 15;
DELETE FROM categories WHERE id = 15 AND name = 'Finance';

