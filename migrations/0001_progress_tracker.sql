CREATE TABLE IF NOT EXISTS progress_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jira_key TEXT NOT NULL UNIQUE,
  jira_url TEXT NOT NULL,
  summary TEXT NOT NULL,
  jira_status TEXT NOT NULL,
  status_category TEXT NOT NULL DEFAULT '',
  tracking_group TEXT NOT NULL DEFAULT '其他／待處理',
  qa_testers TEXT NOT NULL DEFAULT '',
  test_environment TEXT NOT NULL DEFAULT 'DEV',
  environment_manual INTEGER NOT NULL DEFAULT 0,
  submitted_date TEXT NOT NULL,
  release_date TEXT,
  dev_completed_date TEXT,
  stg_completed_date TEXT,
  prod_completed_date TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS progress_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jira_key TEXT NOT NULL,
  old_status TEXT NOT NULL DEFAULT '',
  new_status TEXT NOT NULL,
  changed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_progress_items_updated_at ON progress_items(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_history_jira_key ON progress_history(jira_key, changed_at DESC);
