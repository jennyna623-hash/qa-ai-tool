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
  progressDatabase
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
    const payload = await request.json().catch(() => ({}));
    const id = Number(payload.id || 0);
    if (!Number.isInteger(id) || id < 1) return json({ ok: false, message: "進度項目不存在" }, 400, headers);
    const result = await db.prepare("DELETE FROM progress_items WHERE id = ?").bind(id).run();
    return json({ ok: true, deleted: Number(result.meta?.changes || 0) }, 200, headers);
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : "移除進度失敗" }, 500, headers);
  }
}
