import {
  appendCookies,
  ensureFreshSession,
  jiraError,
  jiraFetch,
  json,
  noStoreHeaders,
  oauthConfigError,
  oauthConfigured,
  plainTextToAdf,
  projectKey,
  validateSameOrigin
} from "../../_lib/jira.js";

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeIssueKey(value, project) {
  const raw = String(value || "").replace(/[‐-―－]/g, "-").trim().toUpperCase();
  if (!raw) return "";
  if (/^\d+$/.test(raw)) return `${project}-${raw}`;
  const match = raw.match(/\b[A-Z][A-Z0-9]+-\d+\b/);
  return match ? match[0] : "";
}

async function resolveIssueType(session, env, project) {
  if (env.JIRA_ISSUE_TYPE_ID) return String(env.JIRA_ISSUE_TYPE_ID);
  const response = await jiraFetch(
    session,
    `/rest/api/3/issue/createmeta/${encodeURIComponent(project)}/issuetypes?maxResults=100`
  );
  if (!response.ok) throw new Error(await jiraError(response, "無法取得 GSI 工作類型"));
  const data = await response.json();
  const values = Array.isArray(data.values)
    ? data.values
    : Array.isArray(data.issueTypes)
      ? data.issueTypes
      : [];
  const exactNames = ["漏洞", "bug", "錯誤", "缺陷"];
  const issueType = values.find((item) =>
    !item.subtask && exactNames.includes(String(item.name || "").trim().toLowerCase())
  ) || values.find((item) => !item.subtask && /bug|漏洞|錯誤|缺陷/i.test(String(item.name || "")));
  if (!issueType) {
    throw new Error("GSI 專案找不到 BUG／漏洞類型，請在 Cloudflare 設定 JIRA_ISSUE_TYPE_ID");
  }
  return issueType.id;
}

async function resolveAssignee(session, project, displayName) {
  if (!displayName || /^(自動|auto)$/i.test(displayName)) return null;
  const response = await jiraFetch(
    session,
    `/rest/api/3/user/assignable/search?project=${encodeURIComponent(project)}&query=${encodeURIComponent(displayName)}&maxResults=100`
  );
  if (!response.ok) throw new Error(await jiraError(response, `無法查詢受託人 ${displayName}`));
  const users = await response.json();
  const wanted = displayName.replace(/\s+/g, "").toLowerCase();
  const user = (Array.isArray(users) ? users : []).find((item) =>
    item.active !== false && String(item.displayName || "").replace(/\s+/g, "").toLowerCase() === wanted
  );
  if (!user?.accountId) throw new Error(`Jira 找不到可指派的受託人「${displayName}」`);
  return user.accountId;
}

async function validateParent(session, parentIssue) {
  if (!parentIssue) return;
  const response = await jiraFetch(session, `/rest/api/3/issue/${encodeURIComponent(parentIssue)}?fields=key`);
  if (!response.ok) throw new Error(await jiraError(response, `找不到主單 ${parentIssue}`));
}

async function linkParent(session, env, createdIssue, parentIssue) {
  if (!parentIssue) return;
  const response = await jiraFetch(session, "/rest/api/3/issueLink", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: { name: env.JIRA_LINK_TYPE_NAME || "Blocks" },
      inwardIssue: { key: createdIssue },
      outwardIssue: { key: parentIssue }
    })
  });
  if (!response.ok) throw new Error(await jiraError(response, `已建立 ${createdIssue}，但主單關聯失敗`));
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
    const summary = cleanText(payload.title, 255);
    const description = cleanText(payload.description, 60000);
    const assignee = cleanText(payload.assignee, 100);
    const project = projectKey(env);
    const parentIssue = normalizeIssueKey(payload.parentIssue, project);
    if (!summary || !description) return json({ ok: false, message: "標題與描述不可為空" }, 400, headers);
    if (payload.parentIssue && !parentIssue) return json({ ok: false, message: "Jira 主單格式不正確" }, 400, headers);

    const [issueTypeId, assigneeAccountId] = await Promise.all([
      resolveIssueType(fresh.session, env, project),
      resolveAssignee(fresh.session, project, assignee),
      validateParent(fresh.session, parentIssue)
    ]);

    const fields = {
      project: { key: project },
      issuetype: { id: issueTypeId },
      summary,
      description: plainTextToAdf(description)
    };
    if (assigneeAccountId) fields.assignee = { accountId: assigneeAccountId };

    const createResponse = await jiraFetch(fresh.session, "/rest/api/3/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields })
    });
    if (!createResponse.ok) throw new Error(await jiraError(createResponse, "Jira 建單失敗"));
    const created = await createResponse.json();
    const issueKey = created.key;
    const warnings = [];
    try {
      await linkParent(fresh.session, env, issueKey, parentIssue);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "主單關聯失敗");
    }

    return json({
      ok: true,
      connected: true,
      issueKey,
      issueUrl: `${fresh.session.siteUrl}/browse/${encodeURIComponent(issueKey)}`,
      warnings
    }, 201, headers);
  } catch (error) {
    return json({
      ok: false,
      connected: true,
      message: error instanceof Error ? error.message : "Jira 建單失敗"
    }, 500, headers);
  }
}
