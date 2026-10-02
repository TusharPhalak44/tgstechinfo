-- ============================================================================
-- SQL SCRIPT: Update & Insert Bulk Users with Valid Bcrypt Hashes
-- Project: TGS Tech Info / TGS Publishing Platform
-- ============================================================================
-- 
-- PASSWORD HASHING CRITERIA:
-- 1. Algorithm: Bcrypt (Modular Crypt Format: $2b$ or $2a$)
-- 2. Cost / Salt Rounds: 12 (as defined in backend/src/config/auth.js)
-- 3. Length: Exactly 60 characters
-- 4. One-way Hash: Cannot be decoded / decrypted. Authentication is verified
--    via bcrypt.compare(plainPassword, password_hash).
--
-- IMPORTANT NOTE ON MYSQL BUILT-IN FUNCTIONS:
-- MySQL functions like MD5(), SHA1(), SHA2(), and PASSWORD() DO NOT produce
-- Bcrypt hashes. If you use MD5 or SHA2 in an SQL INSERT or UPDATE, the backend's
-- bcrypt.compare() function will reject them with "Invalid credentials".
-- You MUST use a pre-computed Bcrypt hash string in your SQL queries.
--
-- ============================================================================

-- Example Pre-computed Bcrypt Hash for password "User@123" (12 salt rounds):
-- '$2b$12$i9DXf9nd31ZDsGsvPeqhM.gXuai.RSwIU3JlB4MjRyqFcoARrLYgS'

-- ----------------------------------------------------------------------------
-- 1. UPDATE EXISTING 500 USERS (IDs 6 to 504) TO A WORKING PASSWORD ("User@123"):
-- ----------------------------------------------------------------------------
UPDATE users 
SET 
    password_hash = '$2b$12$i9DXf9nd31ZDsGsvPeqhM.gXuai.RSwIU3JlB4MjRyqFcoARrLYgS',
    failed_login_attempts = 0,
    locked_until = NULL,
    is_active = 1
WHERE id BETWEEN 6 AND 504;

-- ----------------------------------------------------------------------------
-- 2. TEMPLATE TO INSERT NEW BULK USERS VIA SQL:
-- ----------------------------------------------------------------------------
-- Replace email, first_name, last_name, etc. as needed.
-- All users below will have password: "User@123"
INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) VALUES
('Diya', 'Patel', 'sample1@tgstechinfo.com', '$2b$12$i9DXf9nd31ZDsGsvPeqhM.gXuai.RSwIU3JlB4MjRyqFcoARrLYgS', 'user', 1),
('Arjun', 'Tiwari', 'sample2@tgstechinfo.com', '$2b$12$i9DXf9nd31ZDsGsvPeqhM.gXuai.RSwIU3JlB4MjRyqFcoARrLYgS', 'user', 1)
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    is_active = VALUES(is_active);
