-- Seed Landing Page content type
-- This allows content created with the HTML Builder to be categorised as a Landing Page,
-- which drives the /content/:slug standalone renderer on the public site.

INSERT IGNORE INTO content_types (name, slug)
VALUES ('Landing Page', 'landing-page');
