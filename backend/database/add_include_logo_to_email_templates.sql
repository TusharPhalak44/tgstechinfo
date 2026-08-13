-- Add include_logo column to email_templates table
-- This allows templates to optionally include the company logo from branding
ALTER TABLE email_templates 
ADD COLUMN include_logo BOOLEAN DEFAULT FALSE AFTER is_active;

-- Add comment for documentation
ALTER TABLE email_templates 
MODIFY COLUMN include_logo BOOLEAN DEFAULT FALSE COMMENT 'Whether to include company logo from branding in the email';
