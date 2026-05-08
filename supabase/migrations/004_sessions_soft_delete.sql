ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_deleted  boolean DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
