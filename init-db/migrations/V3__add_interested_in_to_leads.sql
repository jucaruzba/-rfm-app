-- Migration: Add interested_in column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS interested_in VARCHAR(255);
