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

const REPORT_STAGES = new Set(["DEV", "STG", "DEV_REJECT", "STG_REJECT"]);
const STG_CC = ["@sallywu0413", "@chu0114", "@tea418", "@ggjggj0128"];
const TELEGRAM_MENTIONS = [
  [/^Sim Yeh(?:\s|$)/i, "@shibayeh868"],
  [/^Edward(?:\s|$)/i, "@edward61211"],
  [/^Simon Wu(?:\s|$)/i, "@shinjuwu"],
  [/^Corey(?:\s|$)/i, "@corey810125"],
  [/^JOSEPH(?:\s|$)/i, "@theodennnnn"],
  [/^Ken(?:\s|$)/i, "@kenyu123"],
  [/^(?:Wayne|偉恩)(?:\s|$)/i, "@wayne1106"],
  [/^Will(?:\s|$)/i, "@WillZhang0121"],
  [/^Kevin(?:\s*Kao)?(?:\s|$)/i, "@shengxiang"],
  [/^(?:Shun Yang|shun)(?:\s|$)/i, "@shunwuse"],
  [/^OdinHusky(?:\s|$)/i, "@odinhusky0923"]
];

function normalizeIssueKey(value, project) {
  const raw = String(value || "").trim().toUpperCase();
  const match = raw.match(new RegExp(`^(?:${project}-)?(\\d+)$`));
  return match ? `${project}-${match[1]}` : "";
}

function markdownLabel(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/]/g, "\\]");
}

function participantName(value) {
  if (typeof value === "string") return value.trim();
  return String(value?.displayName || "").trim();
}

function telegramMention(name) {
  return TELEGRAM_MENTIONS.find(([pattern]) => pattern.test(name))?.[1] || "";
}

function relatedBugs(fields, siteUrl) {
  const candidates = [];
  (Array.isArray(fields?.issuelinks) ? fields.issuelinks : []).forEach((link) => {
    if (link?.outwardIssue) candidates.push(link.outwardIssue);
    if (link?.inwardIssue) candidates.push(link.inwardIssue);
  });
  (Array.isArray(fields?.subtasks) ? fields.subtasks : []).forEach((issue) => candidates.push(issue));

  const seen = new Set();
  return candidates.flatMap((candidate) => {
    const key = String(candidate?.key || "").trim().toUpperCase();
    const summary = String(candidate?.fields?.summary || "").trim();
    const issueType = String(candidate?.fields?.issuetype?.name || "").trim();
    const isBug = /bug|defect|漏洞|錯誤|缺陷/i.test(issueType) || /^\s*\[\s*BUG/i.test(summary);
    if (!key || seen.has(key) || !isBug) return [];
    seen.add(key);
    return [{ key, summary: summary || key, url: `${siteUrl}/browse/${encodeURIComponent(key)}` }];
  });
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
    const issueKey = normalizeIssueKey(payload.issue, project);
    const stage = String(payload.stage || "DEV").trim().toUpperCase();
    if (!issueKey) return json({ ok: false, message: "請輸入正確的 Jira 單號" }, 400, headers);
    if (!REPORT_STAGES.has(stage)) return json({ ok: false, message: "狀態只支援 DEV已完成、STG已完成、DEV驗退或 STG驗退" }, 400, headers);

    const response = await jiraFetch(
      fresh.session,
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,customfield_10926,issuelinks,subtasks`
    );
    if (response.status === 404) return json({ ok: false, message: `找不到 ${issueKey}，請確認單號` }, 404, headers);
    if (!response.ok) throw new Error(await jiraError(response, "Jira 資料讀取失敗"));
    const issue = await response.json();
    const summary = String(issue?.fields?.summary || "").trim();
    if (!summary) return json({ ok: false, message: `${issueKey} 沒有可讀取的標題` }, 422, headers);

    const participants = Array.from(new Set(
      (Array.isArray(issue.fields?.customfield_10926) ? issue.fields.customfield_10926 : [])
        .map(participantName)
        .filter(Boolean)
    ));
    const mentions = [];
    const unmappedParticipants = [];
    participants.forEach((name) => {
      const mention = telegramMention(name);
      if (mention) {
        if (!mentions.includes(mention)) mentions.push(mention);
      } else {
        unmappedParticipants.push(name);
      }
    });

    const bugs = relatedBugs(issue.fields, fresh.session.siteUrl);
    const link = `[${markdownLabel(summary)}](${fresh.session.siteUrl}/browse/${encodeURIComponent(issueKey)})`;
    let statusText = "";
    let ccText = "";
    if (stage === "DEV") {
      statusText = "請協助進版STG，可以驗收請通知";
      if (mentions.length) ccText = `CC: ${mentions.join(" ")}`;
    } else if (stage === "STG") {
      statusText = "STG已完成，可進行後續安排";
      ccText = `CC: ${STG_CC.join(" ")}`;
    } else if (stage === "DEV_REJECT") {
      statusText = "DEV驗退";
      if (mentions.length) ccText = `CC: ${mentions.join(" ")}`;
    } else {
      statusText = "STG驗退";
      if (mentions.length) ccText = `CC: ${mentions.join(" ")}`;
    }

    const lines = [link, "", statusText];
    if (ccText) lines.push(ccText);
    if (stage.endsWith("_REJECT")) {
      lines.push("", "BUG列表");
      if (bugs.length) {
        bugs.forEach((bug, index) => lines.push(`${index + 1}. [${markdownLabel(bug.summary)}](${bug.url})`));
      } else {
        lines.push("目前未找到關聯 BUG 單");
      }
    }

    return json({
      ok: true,
      connected: true,
      issue: issueKey,
      summary,
      stage,
      participants,
      mentions,
      unmappedParticipants,
      link,
      statusText,
      ccText,
      relatedBugs: bugs,
      bugCount: bugs.length,
      content: lines.join("\n")
    }, 200, headers);
  } catch (error) {
    return json({
      ok: false,
      connected: true,
      message: error instanceof Error ? error.message : "Jira 資料讀取失敗"
    }, 500, headers);
  }
}
