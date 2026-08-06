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

const WEEKLY_GROUPS = new Set([
  "DEV 待測試",
  "DEV 測試中",
  "STG 待測試",
  "STG 測試中",
  "待修正",
  "待進版 PROD",
  "已完成",
  "其他／待處理"
]);

function normalizeIssueKey(value, project) {
  const raw = String(value || "").trim().toUpperCase();
  const match = raw.match(new RegExp(`^(?:${project}-)?(\\d+)$`));
  return match ? `${project}-${match[1]}` : "";
}

export function weeklyGroup(statusName, categoryKey = "") {
  const status = String(statusName || "").trim().toLowerCase();
  const category = String(categoryKey || "").trim().toLowerCase();
  if (/驗退|退回|待修|修正|重開|reopen|re-open|blocked|阻塞|駁回|失敗/.test(status)) return "待修正";
  if (/stg.*待.*測試|待.*stg.*測試/.test(status)) return "STG 待測試";
  if (/dev.*待.*測試|待.*dev.*測試/.test(status)) return "DEV 待測試";
  if (/stg|stage|測試站/.test(status)) {
    if (/完成|通過|passed|ready|待.*prod|進版|上線/.test(status)) return "待進版 PROD";
    return "STG 測試中";
  }
  if (/待.*prod|進版.*prod|ready.*prod|待上線|等待上線|預備上線|prod.*待/.test(status)) return "待進版 PROD";
  if (/dev.*(?:驗收|測試)|(?:驗收|測試).*dev|開發.*驗收/.test(status)) return "DEV 測試中";
  if (category === "done" || /已完成|已關閉|完成上線|正式上線|closed|resolved|done|released/.test(status)) return "已完成";
  return "其他／待處理";
}

async function readIssue(session, issueKey) {
  const response = await jiraFetch(
    session,
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,status`
  );
  if (response.status === 404) return { error: `${issueKey}：找不到 Jira 單` };
  if (!response.ok) return { error: `${issueKey}：${await jiraError(response, "讀取失敗")}` };
  const issue = await response.json();
  const status = String(issue?.fields?.status?.name || "狀態未設定").trim();
  const group = weeklyGroup(status, issue?.fields?.status?.statusCategory?.key);
  return {
    item: {
      key: issueKey,
      url: `${session.siteUrl}/browse/${encodeURIComponent(issueKey)}`,
      summary: String(issue?.fields?.summary || issueKey).trim(),
      status,
      group: WEEKLY_GROUPS.has(group) ? group : "其他／待處理"
    }
  };
}

export async function onRequestPost({ request, env }) {
  if (!validateSameOrigin(request)) return json({ ok: false, message: "無效的來源" }, 403);
  if (!oauthConfigured(env)) return json({ ok: false, message: oauthConfigError(env) }, 503);

  const headers = noStoreHeaders();
  try {
    const fresh = await ensureFreshSession(request, env);
    appendCookies(headers, fresh.cookies);
    if (!fresh.session) return json({ ok: false, connected: false, message: "請先連接 Jira" }, 401, headers);

    const payload = await request.json().catch(() => ({}));
    const project = projectKey(env);
    const issues = Array.from(new Set(
      (Array.isArray(payload.issues) ? payload.issues : [])
        .map((value) => normalizeIssueKey(value, project))
        .filter(Boolean)
    ));
    if (!issues.length) return json({ ok: false, message: "請輸入正確的 Jira 單號" }, 400, headers);
    if (issues.length > 30) return json({ ok: false, message: "一次最多讀取 30 筆 Jira 單" }, 400, headers);

    const results = await Promise.all(issues.map((issueKey) => readIssue(fresh.session, issueKey)));
    const items = results.flatMap((result) => result.item ? [result.item] : []);
    const errors = results.flatMap((result) => result.error ? [result.error] : []);
    return json({
      ok: true,
      connected: true,
      items,
      errors,
      count: items.length
    }, 200, headers);
  } catch (error) {
    return json({
      ok: false,
      connected: true,
      message: error instanceof Error ? error.message : "Jira 周進度讀取失敗"
    }, 500, headers);
  }
}
