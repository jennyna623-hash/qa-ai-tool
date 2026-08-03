import {
  STATE_COOKIE,
  callbackUrl,
  oauthConfigError,
  oauthConfigured,
  requestedScopes
} from "../../../_lib/jira.js";

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet({ request, env }) {
  if (!oauthConfigured(env)) {
    return new Response(oauthConfigError(env), {
      status: 503,
      headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const state = randomState();
  const authorize = new URL("https://auth.atlassian.com/authorize");
  authorize.searchParams.set("audience", "api.atlassian.com");
  authorize.searchParams.set("client_id", env.ATLASSIAN_CLIENT_ID);
  authorize.searchParams.set("scope", requestedScopes(env));
  authorize.searchParams.set("redirect_uri", callbackUrl(request, env));
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("prompt", "consent");

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      "Cache-Control": "no-store",
      "Set-Cookie": `${STATE_COOKIE}=${state}; Path=/api/jira/oauth/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    }
  });
}
