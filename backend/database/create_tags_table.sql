-- Create tags table to store all unique tags
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_slug (slug),
    INDEX idx_usage_count (usage_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extract existing tags from contents table and populate tags table
INSERT INTO tags (name, slug, usage_count)
SELECT 
    TRIM(tag) as name,
    LOWER(REPLACE(TRIM(tag), ' ', '-')) as slug,
    COUNT(*) as usage_count
FROM (
    SELECT 
        SUBSTRING_INDEX(SUBSTRING_INDEX(tags, ',', n.n), ',', -1) as tag
    FROM contents 
    CROSS JOIN (
        SELECT 1 as n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
        UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
        UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16
        UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
    ) n
    WHERE tags IS NOT NULL 
    AND tags != ''
    AND n.n <= LENGTH(tags) - LENGTH(REPLACE(tags, ',', '')) + 1
    AND SUBSTRING_INDEX(SUBSTRING_INDEX(tags, ',', n.n), ',', -1) != ''
) as extracted_tags
WHERE tag IS NOT NULL
AND tag != ''
GROUP BY TRIM(tag)
ON DUPLICATE KEY UPDATE 
    usage_count = usage_count + VALUES(usage_count),
    updated_at = CURRENT_TIMESTAMP;

-- Also handle JSON array format tags
INSERT INTO tags (name, slug, usage_count)
SELECT 
    TRIM(JSON_UNQUOTE(tag)) as name,
    LOWER(REPLACE(TRIM(JSON_UNQUOTE(tag)), ' ', '-')) as slug,
    COUNT(*) as usage_count
FROM (
    SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(tags, CONCAT('$[', n.n, ']'))) as tag
    FROM contents 
    CROSS JOIN (
        SELECT 0 as n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 
        UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
        UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
        UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
        UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
    ) n
    WHERE tags IS NOT NULL 
    AND tags != ''
    AND JSON_VALID(tags)
    AND JSON_UNQUOTE(JSON_EXTRACT(tags, CONCAT('$[', n.n, ']'))) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(tags, CONCAT('$[', n.n, ']'))) != ''
) as json_tags
WHERE tag IS NOT NULL
AND tag != ''
GROUP BY TRIM(JSON_UNQUOTE(tag))
ON DUPLICATE KEY UPDATE 
    usage_count = usage_count + VALUES(usage_count),
    updated_at = CURRENT_TIMESTAMP;

-- Verify the tags table
SELECT * FROM tags ORDER BY usage_count DESC;
