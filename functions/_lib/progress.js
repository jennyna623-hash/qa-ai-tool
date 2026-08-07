import { jiraError, jiraFetch, projectKey } from "./jira.js";

const PROGRESS_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS progress_items (
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
  )`,
  `CREATE TABLE IF NOT EXISTS progress_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jira_key TEXT NOT NULL,
    old_status TEXT NOT NULL DEFAULT '',
    new_status TEXT NOT NULL,
    changed_at TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_progress_items_updated_at ON progress_items(updated_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_progress_history_jira_key ON progress_history(jira_key, changed_at DESC)"
];

let schemaReady = false;
let cachedQaTesterFieldId = "";
let qaTesterFieldLookupDone = false;

export function progressDatabase(env) {
  return env.PROGRESS_DB || null;
}

export async function ensureProgressSchema(db) {
  if (schemaReady) return;
  await db.batch(PROGRESS_SCHEMA_STATEMENTS.map((statement) => db.prepare(statement)));
  schemaReady = true;
}

export function taipeiDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function normalizeProgressIssue(value, env) {
  const project = projectKey(env);
  const raw = String(value || "").trim().toUpperCase();
  const explicit = raw.match(new RegExp(`${project}-(\\d+)`));
  const numberOnly = raw.match(/^\d+$/);
  if (explicit) return `${project}-${explicit[1]}`;
  if (numberOnly) return `${project}-${numberOnly[0]}`;
  return "";
}

export function trackingGroup(statusName, categoryKey = "") {
  const status = String(statusName || "").trim().toLowerCase();
  const category = String(categoryKey || "").trim().toLowerCase();
  if (/驗退|退回|待修|修正|重開|reopen|re-open|blocked|阻塞|駁回|失敗/.test(status)) return "待修正";
  if (/待\s*進版\s*stg|進版\s*stg|ready\s*(?:for\s*)?stg|stg\s*ready/.test(status)) return "待進版STG";
  if (/stg.*待.*測試|待.*stg.*測試/.test(status)) return "STG 待測試";
  if (/dev.*待.*測試|待.*dev.*測試/.test(status)) return "DEV 待測試";
  if (/stg|stage|測試站/.test(status)) {
    if (/完成|通過|passed|ready|待.*prod|進版|上線/.test(status)) return "待進版 PROD";
    return "STG 測試中";
  }
  if (/待.*prod|進版.*prod|ready.*prod|待上線|等待上線|預備上線|prod.*待/.test(status)) return "待進版 PROD";
  if (/dev.*(?:驗收|測試)|(?:驗收|測試).*dev|開發.*驗收/.test(status)) return "DEV 測試中";
  if (category === "done" || /已完成|已關閉|完成上線|正式上線|closed|resolved|done|released/.test(status)) return "已完成";
  return "其他／待處理";
}

function inferredEnvironment(group) {
  if (group === "已完成") return "PROD";
  if (["STG 待測試", "STG 測試中", "待進版 PROD"].includes(group)) return "STG";
  return "DEV";
}

function reachedDevComplete(group) {
  return ["待進版STG", "STG 待測試", "STG 測試中", "待進版 PROD", "已完成"].includes(group);
}

function reachedStgComplete(group) {
  return ["待進版 PROD", "已完成"].includes(group);
}

function reachedProdComplete(group) {
  return group === "已完成";
}

function jiraPeople(value) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return Array.from(new Set(values.map((person) => {
    if (typeof person === "string") return person.trim();
    return String(person?.displayName || person?.name || person?.value || "").trim();
  }).filter(Boolean))).join("、");
}

async function qaTesterFieldId(session, env) {
  const configured = String(env?.JIRA_QA_TESTER_FIELD_ID || "").trim();
  if (configured) return configured;
  if (qaTesterFieldLookupDone) return cachedQaTesterFieldId;
  qaTesterFieldLookupDone = true;
  try {
    const response = await jiraFetch(session, "/rest/api/3/field");
    if (!response.ok) return "";
    const fields = await response.json();
    const matched = (Array.isArray(fields) ? fields : []).find((field) => {
      const name = String(field?.name || "").replace(/\s+/g, "").toLowerCase();
      return name === "qa測試人員" || name === "qa測試人" || name === "qa人員";
    });
    cachedQaTesterFieldId = String(matched?.id || "").trim();
  } catch {
    cachedQaTesterFieldId = "";
  }
  return cachedQaTesterFieldId;
}

export async function readProgressIssue(session, issueKey, env = {}) {
  const qaField = await qaTesterFieldId(session, env);
  const requestedFields = ["summary", "status", qaField].filter(Boolean).join(",");
  const response = await jiraFetch(
    session,
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=${encodeURIComponent(requestedFields)}`
  );
  if (response.status === 404) throw new Error(`${issueKey}：找不到 Jira 單`);
  if (!response.ok) throw new Error(`${issueKey}：${await jiraError(response, "讀取失敗")}`);
  const issue = await response.json();
  const status = String(issue?.fields?.status?.name || "狀態未設定").trim();
  const statusCategory = String(issue?.fields?.status?.statusCategory?.key || "").trim();
  return {
    jiraKey: issueKey,
    jiraUrl: `${session.siteUrl}/browse/${encodeURIComponent(issueKey)}`,
    summary: String(issue?.fields?.summary || issueKey).trim(),
    jiraStatus: status,
    statusCategory,
    trackingGroup: trackingGroup(status, statusCategory),
    qaTesters: qaField ? jiraPeople(issue?.fields?.[qaField]) : ""
  };
}

export async function syncProgressIssue(db, session, issueKey, now = new Date(), env = {}) {
  const jira = await readProgressIssue(session, issueKey, env);
  const existing = await db.prepare("SELECT * FROM progress_items WHERE jira_key = ?").bind(issueKey).first();
  const today = taipeiDate(now);
  const changedAt = now.toISOString();
  const group = jira.trackingGroup;
  const environmentManual = Number(existing?.environment_manual || 0);
  const environment = environmentManual
    ? String(existing?.test_environment || "DEV")
    : inferredEnvironment(group);
  const submittedDate = String(existing?.submitted_date || today);
  const devCompletedDate = String(existing?.dev_completed_date || (reachedDevComplete(group) ? today : "")) || null;
  const stgCompletedDate = String(existing?.stg_completed_date || (reachedStgComplete(group) ? today : "")) || null;
  const prodCompletedDate = String(existing?.prod_completed_date || (reachedProdComplete(group) ? today : "")) || null;
  const releaseDate = String(existing?.release_date || (reachedProdComplete(group) ? today : "")) || null;

  await db.prepare(`
    INSERT INTO progress_items (
      jira_key, jira_url, summary, jira_status, status_category, tracking_group, qa_testers,
      test_environment, environment_manual, submitted_date, release_date,
      dev_completed_date, stg_completed_date, prod_completed_date, note, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(jira_key) DO UPDATE SET
      jira_url = excluded.jira_url,
      summary = excluded.summary,
      jira_status = excluded.jira_status,
      status_category = excluded.status_category,
      tracking_group = excluded.tracking_group,
      qa_testers = excluded.qa_testers,
      test_environment = excluded.test_environment,
      environment_manual = excluded.environment_manual,
      submitted_date = excluded.submitted_date,
      release_date = excluded.release_date,
      dev_completed_date = excluded.dev_completed_date,
      stg_completed_date = excluded.stg_completed_date,
      prod_completed_date = excluded.prod_completed_date,
      note = excluded.note,
      updated_at = excluded.updated_at
  `).bind(
    jira.jiraKey,
    jira.jiraUrl,
    jira.summary,
    jira.jiraStatus,
    jira.statusCategory,
    group,
    jira.qaTesters,
    environment,
    environmentManual,
    submittedDate,
    releaseDate,
    devCompletedDate,
    stgCompletedDate,
    prodCompletedDate,
    String(existing?.note || ""),
    String(existing?.created_at || changedAt),
    changedAt
  ).run();

  if (existing && String(existing.jira_status || "") !== jira.jiraStatus) {
    await db.prepare(
      "INSERT INTO progress_history (jira_key, old_status, new_status, changed_at) VALUES (?, ?, ?, ?)"
    ).bind(issueKey, String(existing.jira_status || ""), jira.jiraStatus, changedAt).run();
  }
  return db.prepare("SELECT * FROM progress_items WHERE jira_key = ?").bind(issueKey).first();
}

export async function listProgressItems(db) {
  const result = await db.prepare(
    "SELECT * FROM progress_items ORDER BY CASE WHEN tracking_group = '已完成' THEN 1 ELSE 0 END, updated_at DESC, id DESC"
  ).all();
  return Array.isArray(result.results) ? result.results : [];
}

export function databaseUnavailableMessage() {
  return "共用進度資料庫尚未完成設定，請先在 Cloudflare 綁定 PROGRESS_DB。";
}
