-- Run this in Supabase SQL Editor
-- Adds clinic_code column to doctors table

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_code TEXT UNIQUE;

-- Auto-generate codes for existing doctors
UPDATE doctors 
SET clinic_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8))
WHERE clinic_code IS NULL;
