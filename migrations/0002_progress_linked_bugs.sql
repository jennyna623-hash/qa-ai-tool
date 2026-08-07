ALTER TABLE progress_items ADD COLUMN linked_bugs_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE progress_items ADD COLUMN linked_bug_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE progress_items ADD COLUMN regression_bug_count INTEGER NOT NULL DEFAULT 0;
