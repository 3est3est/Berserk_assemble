-- Revert: Remove max_crew column from missions table
ALTER TABLE missions DROP COLUMN max_crew;
