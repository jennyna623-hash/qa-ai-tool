import {
  appendCookies,
  ensureFreshSession,
  json,
  noStoreHeaders,
  oauthConfigError,
  oauthConfigured,
  validateSameOrigin
} from "../_lib/jira.js";
import {
  databaseUnavailableMessage,
  ensureProgressSchema,
  listProgressItems,
  normalizeProgressIssue,
  progressDatabase,
  syncProgressIssue
} from "../_lib/progress.js";

async function authenticated(request, env, headers) {
  const fresh = await ensureFreshSession(request, env);
  appendCookies(headers, fresh.cookies);
  return fresh.session;
}

export async function onRequestGet({ request, env }) {
  const headers = noStoreHeaders();
  if (!oauthConfigured(env)) return json({ ok: false, message: oauthConfigError(env) }, 503, headers);
  const db = progressDatabase(env);
  if (!db) return json({ ok: false, databaseConfigured: false, message: databaseUnavailableMessage() }, 503, headers);
  try {
    const session = await authenticated(request, env, headers);
    if (!session) return json({ ok: false, connected: false, message: "請先連接 Jira" }, 401, headers);
    await ensureProgressSchema(db);
    const items = await listProgressItems(db);
    return json({ ok: true, connected: true, databaseConfigured: true, items, count: items.length }, 200, headers);
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : "讀取共用進度失敗" }, 500, headers);
  }
}

export async function onRequestPost({ request, env }) {
  if (!validateSameOrigin(request)) return json({ ok: false, message: "無效的來源" }, 403);
  const headers = noStoreHeaders();
  if (!oauthConfigured(env)) return json({ ok: false, message: oauthConfigError(env) }, 503, headers);
  const db = progressDatabase(env);
  if (!db) return json({ ok: false, databaseConfigured: false, message: databaseUnavailableMessage() }, 503, headers);
  try {
    const session = await authenticated(request, env, headers);
    if (!session) return json({ ok: false, connected: false, message: "請先連接 Jira" }, 401, headers);
    await ensureProgressSchema(db);
    const payload = await request.json().catch(() => ({}));
    const issues = Array.from(new Set(
      (Array.isArray(payload.issues) ? payload.issues : [])
        .map((value) => normalizeProgressIssue(value, env))
        .filter(Boolean)
    ));
    if (!issues.length) return json({ ok: false, message: "請輸入正確的 Jira 單號" }, 400, headers);
    if (issues.length > 30) return json({ ok: false, message: "一次最多新增 30 筆 Jira 單" }, 400, headers);

    const items = [];
    const errors = [];
    for (const issueKey of issues) {
      try {
        items.push(await syncProgressIssue(db, session, issueKey, new Date(), env));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `${issueKey}：讀取失敗`);
      }
    }
    return json({ ok: true, connected: true, items, errors, count: items.length }, 200, headers);
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : "新增 Jira 進度失敗" }, 500, headers);
  }
}
