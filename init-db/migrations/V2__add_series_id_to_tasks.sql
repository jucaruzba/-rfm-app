-- Migration: Add series_id column to tasks table
-- This column groups all recurring occurrences of a task under a shared UUID identifier.
-- Tasks created before this migration will have NULL (treated as non-series tasks).

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS series_id VARCHAR(36);

-- Optional index for fast lookup by series_id (used in delete future events)
CREATE INDEX IF NOT EXISTS idx_tasks_series_id ON public.tasks(series_id);
