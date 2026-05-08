-- Add pending_ai_review to sessions status check constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('pending', 'in_progress', 'pending_ai_review', 'completed'));
