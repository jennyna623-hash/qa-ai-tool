import {
  appendCookies,
  clearSessionCookies,
  json,
  noStoreHeaders,
  validateSameOrigin
} from "../../_lib/jira.js";

export async function onRequestPost({ request }) {
  if (!validateSameOrigin(request)) return json({ ok: false, message: "無效的來源" }, 403);
  const headers = noStoreHeaders();
  appendCookies(headers, clearSessionCookies());
  return json({ ok: true, connected: false }, 200, headers);
}
