const ACCESS_COOKIE = "gsi_jira_access";
const REFRESH_COOKIE = "gsi_jira_refresh";
const META_COOKIE = "gsi_jira_meta";
export const STATE_COOKIE = "gsi_jira_oauth_state";

const DEFAULT_SITE = "https://gamingsoft.atlassian.net";
const DEFAULT_SCOPES = "read:jira-user read:jira-work write:jira-work offline_access";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function encryptionKey(secret) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function seal(value, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(secret);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(value))
  ));
  const combined = new Uint8Array(iv.length + encrypted.length);
  combined.set(iv);
  combined.set(encrypted, iv.length);
  return base64UrlEncode(combined);
}

async function unseal(value, secret) {
  const combined = base64UrlDecode(value);
  if (combined.length <= 28) throw new Error("Invalid encrypted session");
  const iv = combined.subarray(0, 12);
  const encrypted = combined.subarray(12);
  const key = await encryptionKey(secret);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
  return JSON.parse(decoder.decode(plain));
}

export function parseCookies(request) {
  const cookies = {};
  const raw = request.headers.get("Cookie") || "";
  raw.split(";").forEach((part) => {
    const separator = part.indexOf("=");
    if (separator < 1) return;
    cookies[part.slice(0, separator).trim()] = part.slice(separator + 1).trim();
  });
  return cookies;
}

function cookie(name, value, maxAge, path = "/api/jira") {
  return `${name}=${value}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookies() {
  return [
    cookie(ACCESS_COOKIE, "", 0),
    cookie(REFRESH_COOKIE, "", 0),
    cookie(META_COOKIE, "", 0)
  ];
}

export function appendCookies(headers, values) {
  values.forEach((value) => headers.append("Set-Cookie", value));
  return headers;
}

export function oauthConfigured(env) {
  return Boolean(
    env.ATLASSIAN_CLIENT_ID &&
    env.ATLASSIAN_CLIENT_SECRET &&
    env.JIRA_SESSION_SECRET &&
    String(env.JIRA_SESSION_SECRET).length >= 32
  );
}

export function oauthConfigError(env) {
  const missing = [];
  if (!env.ATLASSIAN_CLIENT_ID) missing.push("ATLASSIAN_CLIENT_ID");
  if (!env.ATLASSIAN_CLIENT_SECRET) missing.push("ATLASSIAN_CLIENT_SECRET");
  if (!env.JIRA_SESSION_SECRET || String(env.JIRA_SESSION_SECRET).length < 32) {
    missing.push("JIRA_SESSION_SECRET（至少 32 字元）");
  }
  return missing.length ? `Cloudflare 尚未設定：${missing.join("、")}` : "";
}

export function callbackUrl(request, env) {
  return env.ATLASSIAN_CALLBACK_URL || new URL("/api/jira/oauth/callback", request.url).href;
}

export function requestedScopes(env) {
  return env.ATLASSIAN_SCOPES || DEFAULT_SCOPES;
}

export function targetSite(env) {
  return String(env.JIRA_SITE_URL || DEFAULT_SITE).replace(/\/$/, "");
}

export function projectKey(env) {
  return String(env.JIRA_PROJECT_KEY || "GSI").trim().toUpperCase();
}

export function jiraApiBase(session) {
  return `https://api.atlassian.com/ex/jira/${encodeURIComponent(session.cloudId)}`;
}

export function noStoreHeaders(extra = {}) {
  return new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    ...extra
  });
}

export function json(data, status = 200, headers = noStoreHeaders()) {
  return new Response(JSON.stringify(data), { status, headers });
}

export function validateSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

export async function sessionCookies(session, env) {
  const secret = env.JIRA_SESSION_SECRET;
  const [access, refresh, meta] = await Promise.all([
    seal({ token: session.accessToken, expiresAt: session.expiresAt }, secret),
    seal({ token: session.refreshToken || "" }, secret),
    seal({
      cloudId: session.cloudId,
      siteUrl: session.siteUrl,
      displayName: session.displayName || "",
      scope: session.scope || ""
    }, secret)
  ]);
  const maxAge = 90 * 24 * 60 * 60;
  const values = [
    cookie(ACCESS_COOKIE, access, maxAge),
    cookie(REFRESH_COOKIE, refresh, maxAge),
    cookie(META_COOKIE, meta, maxAge)
  ];
  if (values.some((value) => value.length > 3900)) {
    throw new Error("Atlassian 登入資料超過瀏覽器 Cookie 上限，請聯絡工具管理者改用 KV 儲存。");
  }
  return values;
}

export async function readSession(request, env) {
  if (!oauthConfigured(env)) return null;
  const cookies = parseCookies(request);
  if (!cookies[ACCESS_COOKIE] || !cookies[META_COOKIE]) return null;
  try {
    const [access, refresh, meta] = await Promise.all([
      unseal(cookies[ACCESS_COOKIE], env.JIRA_SESSION_SECRET),
      cookies[REFRESH_COOKIE]
        ? unseal(cookies[REFRESH_COOKIE], env.JIRA_SESSION_SECRET)
        : Promise.resolve({ token: "" }),
      unseal(cookies[META_COOKIE], env.JIRA_SESSION_SECRET)
    ]);
    if (!access.token || !meta.cloudId || !meta.siteUrl) return null;
    return {
      accessToken: access.token,
      expiresAt: Number(access.expiresAt || 0),
      refreshToken: refresh.token || "",
      cloudId: meta.cloudId,
      siteUrl: meta.siteUrl,
      displayName: meta.displayName || "",
      scope: meta.scope || ""
    };
  } catch {
    return null;
  }
}

async function tokenRequest(body) {
  const response = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.error_description || data.message || data.error || `HTTP ${response.status}`;
    throw new Error(`Atlassian 授權失敗：${detail}`);
  }
  return data;
}

export async function exchangeAuthorizationCode(code, request, env) {
  return tokenRequest({
    grant_type: "authorization_code",
    client_id: env.ATLASSIAN_CLIENT_ID,
    client_secret: env.ATLASSIAN_CLIENT_SECRET,
    code,
    redirect_uri: callbackUrl(request, env)
  });
}

export async function ensureFreshSession(request, env) {
  const current = await readSession(request, env);
  if (!current) return { session: null, cookies: [] };
  if (current.expiresAt > Date.now() + 120000) return { session: current, cookies: [] };
  if (!current.refreshToken) return { session: null, cookies: clearSessionCookies() };

  const refreshed = await tokenRequest({
    grant_type: "refresh_token",
    client_id: env.ATLASSIAN_CLIENT_ID,
    client_secret: env.ATLASSIAN_CLIENT_SECRET,
    refresh_token: current.refreshToken
  });
  const session = {
    ...current,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token || current.refreshToken,
    expiresAt: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
    scope: refreshed.scope || current.scope
  };
  return { session, cookies: await sessionCookies(session, env) };
}

export async function accessibleResources(accessToken) {
  const response = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) throw new Error(`無法讀取 Jira 網站（HTTP ${response.status}）`);
  return Array.isArray(data) ? data : [];
}

export async function jiraFetch(session, path, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  headers.set("Accept", "application/json");
  const response = await fetch(`${jiraApiBase(session)}${path}`, { ...init, headers });
  return response;
}

export async function jiraError(response, fallback = "Jira 操作失敗") {
  const data = await response.json().catch(() => ({}));
  const messages = [];
  if (Array.isArray(data.errorMessages)) messages.push(...data.errorMessages);
  if (data.errors && typeof data.errors === "object") messages.push(...Object.values(data.errors));
  if (data.message) messages.push(data.message);
  return `${fallback}：${messages.filter(Boolean).join("；") || `HTTP ${response.status}`}`;
}

export function plainTextToAdf(value) {
  const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
  const headings = new Set(["基本信息", "問題描述：", "操作步驟：", "實際結果：", "預期結果："]);
  return {
    type: "doc",
    version: 1,
    content: lines.map((line) => {
      if (headings.has(line.trim())) {
        return {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: line.trim().replace(/：$/, "") }]
        };
      }
      return {
        type: "paragraph",
        content: line ? [{ type: "text", text: line }] : []
      };
    })
  };
}

function headingText(node) {
  if (node?.type !== "heading" || !Array.isArray(node.content)) return "";
  return node.content.map((item) => item?.text || "").join("").trim();
}

function externalImageNode(image) {
  return {
    type: "mediaSingle",
    attrs: { layout: "center", width: 80 },
    content: [{
      type: "media",
      attrs: {
        type: "external",
        url: image.url,
        alt: image.filename || "結果截圖"
      }
    }]
  };
}

export function plainTextToAdfWithImages(value, imagesBySection = {}) {
  const document = plainTextToAdf(value);
  const sectionImages = new Map([
    ["實際結果", Array.isArray(imagesBySection.actual) ? imagesBySection.actual : []],
    ["預期結果", Array.isArray(imagesBySection.expected) ? imagesBySection.expected : []]
  ]);
  const content = [];
  let activeSection = "";

  const appendActiveImages = () => {
    const images = sectionImages.get(activeSection) || [];
    images.forEach((image) => content.push(externalImageNode(image)));
  };

  document.content.forEach((node) => {
    const nextHeading = headingText(node);
    if (nextHeading) {
      appendActiveImages();
      activeSection = nextHeading;
    }
    content.push(node);
  });
  appendActiveImages();
  return { ...document, content };
}

export function redirectToApp(request, result, message = "") {
  const url = new URL("/", request.url);
  url.searchParams.set("jira", result);
  if (message) url.searchParams.set("jira_message", message.slice(0, 300));
  return Response.redirect(url.toString(), 302);
}
