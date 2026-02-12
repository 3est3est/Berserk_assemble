-- Add max_crew column to missions table
ALTER TABLE missions ADD COLUMN max_crew INTEGER NOT NULL DEFAULT 5;
