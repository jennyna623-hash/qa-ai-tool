import {
  STATE_COOKIE,
  accessibleResources,
  appendCookies,
  exchangeAuthorizationCode,
  jiraFetch,
  parseCookies,
  redirectToApp,
  sessionCookies,
  targetSite
} from "../../../_lib/jira.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const cookies = parseCookies(request);
  const expectedState = cookies[STATE_COOKIE];

  if (url.searchParams.get("error")) {
    return redirectToApp(request, "error", url.searchParams.get("error_description") || "使用者取消 Jira 授權");
  }
  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return redirectToApp(request, "error", "Jira 授權驗證失敗，請重新連接");
  }

  try {
    const token = await exchangeAuthorizationCode(code, request, env);
    const resources = await accessibleResources(token.access_token);
    const wanted = targetSite(env).toLowerCase();
    const resource = resources.find((item) => String(item.url || "").replace(/\/$/, "").toLowerCase() === wanted);
    if (!resource) {
      throw new Error(`授權帳號無法存取 ${targetSite(env)}，請在 Atlassian 授權畫面選擇正確網站`);
    }

    const session = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token || "",
      expiresAt: Date.now() + Number(token.expires_in || 3600) * 1000,
      scope: token.scope || "",
      cloudId: resource.id,
      siteUrl: String(resource.url || targetSite(env)).replace(/\/$/, ""),
      displayName: ""
    };

    const profileResponse = await jiraFetch(session, "/rest/api/3/myself");
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      session.displayName = profile.displayName || "";
    }

    const headers = new Headers({
      Location: new URL("/?jira=connected", request.url).toString(),
      "Cache-Control": "no-store"
    });
    appendCookies(headers, await sessionCookies(session, env));
    headers.append("Set-Cookie", `${STATE_COOKIE}=; Path=/api/jira/oauth/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return new Response(null, { status: 302, headers });
  } catch (error) {
    return redirectToApp(request, "error", error instanceof Error ? error.message : "Jira 授權失敗");
  }
}
