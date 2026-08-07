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

const ENVIRONMENTS = new Set(["DEV", "STG", "PROD"]);

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
    const testEnvironment = String(payload.testEnvironment || "").trim().toUpperCase();
    const note = String(payload.note || "").trim().slice(0, 1000);
    if (!Number.isInteger(id) || id < 1) return json({ ok: false, message: "進度項目不存在" }, 400, headers);
    if (!ENVIRONMENTS.has(testEnvironment)) return json({ ok: false, message: "提測環境只支援 DEV、STG 或 PROD" }, 400, headers);
    await db.prepare(`
      UPDATE progress_items
      SET test_environment = ?, environment_manual = 1, note = ?, updated_at = ?
      WHERE id = ?
    `).bind(testEnvironment, note, new Date().toISOString(), id).run();
    const item = await db.prepare("SELECT * FROM progress_items WHERE id = ?").bind(id).first();
    if (!item) return json({ ok: false, message: "找不到要更新的進度項目" }, 404, headers);
    return json({ ok: true, item }, 200, headers);
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : "更新進度失敗" }, 500, headers);
  }
}
