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
  progressDatabase,
  syncProgressIssue
} from "../../_lib/progress.js";

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
    const current = await listProgressItems(db);
    const errors = [];
    let synced = 0;
    for (const item of current.slice(0, 200)) {
      try {
        await syncProgressIssue(db, fresh.session, item.jira_key, new Date(), env);
        synced += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `${item.jira_key}：同步失敗`);
      }
    }
    const items = await listProgressItems(db);
    return json({ ok: true, connected: true, items, errors, synced, count: items.length }, 200, headers);
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : "Jira 自動同步失敗" }, 500, headers);
  }
}
