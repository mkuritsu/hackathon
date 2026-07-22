-- Users register with an email (login stays username-only). The daily report
-- is emailed to every registered user's address.

ALTER TABLE users ADD COLUMN email TEXT;
