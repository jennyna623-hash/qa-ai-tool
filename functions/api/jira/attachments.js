import {
  appendCookies,
  ensureFreshSession,
  jiraError,
  jiraFetch,
  json,
  noStoreHeaders,
  oauthConfigError,
  oauthConfigured,
  projectKey,
  validateSameOrigin
} from "../../_lib/jira.js";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function safeFilename(value, index, type) {
  const extensions = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
  const cleaned = String(value || "")
    .replace(/[\\/\u0000-\u001f\u007f]/g, "-")
    .trim()
    .slice(0, 180);
  return cleaned || `screenshot-${index + 1}.${extensions[type] || "png"}`;
}

function isFile(value) {
  return value && typeof value === "object" && typeof value.arrayBuffer === "function";
}

export async function onRequestPost({ request, env }) {
  if (!validateSameOrigin(request)) return json({ ok: false, message: "無效的來源" }, 403);
  if (!oauthConfigured(env)) return json({ ok: false, message: oauthConfigError(env) }, 503);

  const headers = noStoreHeaders();
  try {
    const fresh = await ensureFreshSession(request, env);
    appendCookies(headers, fresh.cookies);
    if (!fresh.session) return json({ ok: false, connected: false, message: "請先連接 Jira" }, 401, headers);

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_FILES * MAX_FILE_BYTES + 1024 * 1024) {
      return json({ ok: false, message: "附件總大小超過限制" }, 413, headers);
    }

    const form = await request.formData();
    const issueKey = String(form.get("issueKey") || "").trim().toUpperCase();
    const project = projectKey(env);
    if (!new RegExp(`^${project}-\\d+$`).test(issueKey)) {
      return json({ ok: false, message: `只能上傳到 ${project} 專案的 Jira 單` }, 400, headers);
    }

    const files = form.getAll("file").filter(isFile);
    if (!files.length) return json({ ok: false, message: "請至少加入一張截圖" }, 400, headers);
    if (files.length > MAX_FILES) return json({ ok: false, message: `最多只能上傳 ${MAX_FILES} 張截圖` }, 400, headers);

    const jiraForm = new FormData();
    files.forEach((file, index) => {
      const type = String(file.type || "").toLowerCase();
      if (!ALLOWED_TYPES.has(type)) throw new Error("附件只支援 PNG、JPG、WEBP 或 GIF 圖片");
      if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name || "截圖"} 超過 5MB`);
      jiraForm.append("file", file, safeFilename(file.name, index, type));
    });

    const response = await jiraFetch(fresh.session, `/rest/api/3/issue/${encodeURIComponent(issueKey)}/attachments`, {
      method: "POST",
      headers: { "X-Atlassian-Token": "no-check" },
      body: jiraForm
    });
    if (!response.ok) throw new Error(await jiraError(response, "Jira 附件上傳失敗"));
    const uploaded = await response.json();
    const attachments = (Array.isArray(uploaded) ? uploaded : []).map((attachment) => ({
      id: attachment.id,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size
    }));
    return json({ ok: true, connected: true, issueKey, attachments }, 201, headers);
  } catch (error) {
    return json({
      ok: false,
      connected: true,
      message: error instanceof Error ? error.message : "Jira 附件上傳失敗"
    }, 500, headers);
  }
}
