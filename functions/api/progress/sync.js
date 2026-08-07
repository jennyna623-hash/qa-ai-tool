import {
  appendCookies,
  ensureFreshSession,
  json,
  noStoreHeaders,
  oauthConfigError,
  oauthConfigured,
  validateSameOrigin
} from "../../_lib/jira.js";
import {
  databaseUnavailableMessage,
  ensureProgressSchema,
  listProgressItems,
  normalizeProgressIssue,
  progressDatabase,
  syncProgressIssue
} from "../../_lib/progress.js";

const MAX_SYNC_BATCH_SIZE = 5;

export async function onRequestPost({ request, env }) {
  if (!validateSameOrigin(request)) return json({ ok: false, message: "無效的來源" }, 403);
  const headers = noStoreHeaders();
  if (!oauthConfigured(env)) return json({ ok: false, message: oauthConfigError(env) }, 503, headers);
  const db = progressDatabase(env);
  if (!db) return json({ ok: false, databaseConfigured: false, message: databaseUnavailableMessage() }, 503, headers);
  try {
    const fresh = await ensureFreshSession(request, env);
    appendCookies(headers, fresh.cookies);
    if (!fresh.session) return json({ ok: false, connected: false, message: "請先連接 Jira" }, 401, headers);
    await ensureProgressSchema(db);
    const payload = await request.json().catch(() => ({}));
    const current = await listProgressItems(db);
    const currentKeys = new Set(current.map((item) => item.jira_key));
    const requested = Array.from(new Set(
      (Array.isArray(payload.issues) ? payload.issues : [])
        .map((value) => normalizeProgressIssue(value, env))
        .filter((issueKey) => issueKey && currentKeys.has(issueKey))
    ));
    if (requested.length > MAX_SYNC_BATCH_SIZE) {
      return json({ ok: false, message: `每批最多同步 ${MAX_SYNC_BATCH_SIZE} 筆 Jira` }, 400, headers);
    }
    const targets = requested.length
      ? requested
      : current.slice(0, MAX_SYNC_BATCH_SIZE).map((item) => item.jira_key);
    const errors = [];
    let synced = 0;
    for (const issueKey of targets) {
      try {
        await syncProgressIssue(db, fresh.session, issueKey, new Date(), env);
        synced += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `${issueKey}：同步失敗`);
      }
    }
    const items = await listProgressItems(db);
    return json({
      ok: true,
      connected: true,
      items,
      errors,
      synced,
      count: items.length,
      batchSize: targets.length,
      maxBatchSize: MAX_SYNC_BATCH_SIZE
    }, 200, headers);
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : "Jira 自動同步失敗" }, 500, headers);
  }
}
