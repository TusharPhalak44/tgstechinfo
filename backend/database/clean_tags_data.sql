-- Clean up tags data - remove brackets and quotes
UPDATE tags 
SET name = TRIM(REPLACE(REPLACE(REPLACE(name, '[', ''), ']', ''), '"', '')),
    slug = LOWER(REPLACE(REPLACE(REPLACE(slug, '[', ''), ']', ''), '"', ''))
WHERE name LIKE '[%' OR name LIKE '"%';

-- Remove empty tags
DELETE FROM tags WHERE name = '' OR name IS NULL OR name = '[]';

-- Update usage counts based on actual content
UPDATE tags t 
SET usage_count = (
    SELECT COUNT(*) 
    FROM contents c 
    WHERE c.tags LIKE CONCAT('%', t.name, '%') 
       OR c.tags LIKE CONCAT('%["', t.name, '"%')
       OR c.tags LIKE CONCAT('%["', t.name, ']%')
);

-- Verify cleaned data
SELECT * FROM tags ORDER BY usage_count DESC LIMIT 20;
