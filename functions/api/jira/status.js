import {
  appendCookies,
  ensureFreshSession,
  json,
  noStoreHeaders,
  oauthConfigError,
  oauthConfigured,
  projectKey,
  targetSite
} from "../../_lib/jira.js";

export async function onRequestGet({ request, env }) {
  const headers = noStoreHeaders();
  if (!oauthConfigured(env)) {
    return json({
      ok: true,
      configured: false,
      connected: false,
      message: oauthConfigError(env),
      siteUrl: targetSite(env),
      projectKey: projectKey(env)
    }, 200, headers);
  }

  try {
    const result = await ensureFreshSession(request, env);
    appendCookies(headers, result.cookies);
    if (!result.session) {
      return json({
        ok: true,
        configured: true,
        connected: false,
        siteUrl: targetSite(env),
        projectKey: projectKey(env)
      }, 200, headers);
    }
    return json({
      ok: true,
      configured: true,
      connected: true,
      displayName: result.session.displayName,
      siteUrl: result.session.siteUrl,
      projectKey: projectKey(env)
    }, 200, headers);
  } catch (error) {
    return json({
      ok: false,
      configured: true,
      connected: false,
      message: error instanceof Error ? error.message : "Jira 登入已失效，請重新連接"
    }, 401, headers);
  }
}
