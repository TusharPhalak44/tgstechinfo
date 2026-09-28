# 500 Users Transfer Instructions

## Overview
यह guide आपको 500 users को एक database से दूसरे project के database में transfer करने में मदद करेगी।

## Files Created

### 1. `insert_500_users_to_new_project.sql`
यह file में सभी 500 users की basic SQL INSERT statements हैं लेकिन password hashes placeholder हैं।

### 2. `generate_hashed_passwords_for_new_project.js`
यह Node.js script real bcrypt password hashes generate करेगा।

## Steps to Complete the Transfer

### Step 1: Generate Hashed Passwords
```bash
cd C:\xampp\htdocs\tgspublish\backend\database
node generate_hashed_passwords_for_new_project.js
```

यह `insert_500_users_hashed_new_project.sql` file generate करेगा जिसमें real bcrypt hashes होंगे।

### Step 2: Backup Target Database
```sql
-- पहले target database का backup लें
CREATE TABLE users_backup AS SELECT * FROM users;
```

### Step 3: Check Target Database Structure
```sql
-- Users table structure check
DESCRIBE users;
```

यदि आवश्यक columns नहीं हैं तो उन्हें add करें:
```sql
-- यदि country column नहीं है तो
ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT NULL AFTER company_name;

-- यदि job_title column नहीं है तो  
ALTER TABLE users ADD COLUMN job_title VARCHAR(100) DEFAULT NULL AFTER email;
```

### Step 4: Run the SQL Insert
```bash
# MySQL command line से
mysql -u your_username -p your_database < insert_500_users_hashed_new_project.sql

# या phpMyAdmin से SQL file import करें
```

### Step 5: Verify the Import
```sql
-- Count imported users
SELECT COUNT(*) FROM users;

-- Check users by country
SELECT country, COUNT(*) as user_count 
FROM users 
GROUP BY country 
ORDER BY user_count DESC;

-- Verify a few sample users
SELECT * FROM users LIMIT 10;
```

## User Distribution

The 500 users are distributed across multiple countries:
- **Australia**: ~80 users
- **Canada**: ~60 users  
- **France**: ~60 users
- **Germany**: ~60 users
- **India**: ~40 users
- **Japan**: ~60 users
- **United Kingdom**: ~60 users
- **United States**: ~40 users

## Password Format

All passwords follow the pattern: `CompanyName@2026`
Examples:
- `6senseAustralia@2026`
- `HubSpot@2026`
- `Salesforce@2026`

## Data Structure

Each user includes:
- **first_name**: Extracted from email (before @)
- **last_name**: Extracted from email (before @, after .)
- **email**: From CSV file
- **job_title**: Set to 'User'
- **company_name**: From CSV file
- **country**: From CSV file
- **password_hash**: Bcrypt hash (12 salt rounds)
- **role**: Set to 'user'
- **is_active**: Set to 1 (active)
- **created_at**: Current timestamp

## Troubleshooting

### Duplicate Email Error
यदि duplicate email error आता है:
```sql
-- Skip existing emails by using INSERT IGNORE
INSERT IGNORE INTO users ...
```

### Column Mismatch Error
यदि column mismatch error आता है:
```sql
-- Target database की structure check करें
DESCRIBE users;

-- और SQL file में columns को adjust करें
```

### Character Encoding Issues
यदि special characters (like French names) में issues हैं:
```sql
-- UTF-8 encoding ensure करें
SET NAMES utf8mb4;
```

## Additional Notes

1. **Admin Users**: `dataadmin@tgstechinfo.com` को admin role दिया गया है
2. **Null Values**: CSV में null company/country values को 'Unknown' से replace किया गया है
3. **Email Format**: सभी emails valid format में हैं
4. **Security**: Passwords bcrypt hashed हैं (12 salt rounds)

## Next Steps

After successful import:
1. Users को verify करें
2. Login functionality test करें  
3. User roles assign करें यदि आवश्यक हो
4. Email verification process implement करें यदि required हो