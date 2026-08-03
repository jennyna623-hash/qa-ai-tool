const STORAGE_KEY = "gsi-ai-tools-cloud-v1";
const WEEKLY_GROUPS = ["DEV 測試中", "STG 測試中", "待修正", "待進版 PROD", "已完成", "其他／待處理"];
const ASSIGNEES = ["Edward", "corey", "JOSEPH", "偉恩", "Ken", "KevinKao", "Will Zhang", "Simon Wu", "Jason hu"];
const MAX_BUG_ATTACHMENTS_PER_SECTION = 5;
const MAX_BUG_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const BUG_ATTACHMENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const SITES = [
  { url: "https://agent-bmm1-dev.gsiwl.com", env: "DEV", code: "set_r021｜R021" },
  { url: "https://agent-dobt-dev.gsiwl.com", env: "DEV", code: "okbet｜R001" },
  { url: "https://agent-gogd-dev.gsiwl.com", env: "DEV", code: "okbet｜R001" },
  { url: "https://agent-bkgd-dev.gsiwl.com", env: "DEV", code: "okbet_blackGold｜R003" },
  { url: "https://agent-fp1d-dev.gsiwl.com", env: "DEV", code: "okbet_green｜R026" },
  { url: "https://agent-dobr-dev.gsiwl.com", env: "DEV", code: "okbet_red｜R018" },
  { url: "https://agent-obrb-dev.gsiwl.com/#/Login", env: "DEV", code: "okbet_redBlack｜R020" },
  { url: "https://agent-dbod-dev.gsiwl.com", env: "DEV", code: "set50｜R015" },
  { url: "https://agent-ed03-dev.gsiwl.com", env: "DEV", code: "set_ed3｜R019" },
  { url: "https://agent-ed88-dev.gsiwl.com", env: "DEV", code: "set_ed8888｜R011" },
  { url: "https://agent-jkhd-dev.gsiwl.com", env: "DEV", code: "set_51(set_jokerhill)｜R010" },
  { url: "https://agent-r016-dev.gsiwl.com", env: "DEV", code: "set_r016" },
  { url: "https://agent-gsai-dev.gsiwl.com", env: "DEV", code: "set_r017｜R017" },
  { url: "https://agent-r022-dev.gsiwl.com", env: "DEV", code: "set_r022｜R022" },
  { url: "https://agent-r023-dev.gsiwl.com", env: "DEV", code: "set_r023" },
  { url: "https://agent-r024-dev.gsiwl.com", env: "DEV", code: "set_r024" },
  { url: "https://agent-r025-dev.gsiwl.com", env: "DEV", code: "set_r025" },
  { url: "https://agent-rysd-dev.gsiwl.com", env: "DEV", code: "set_royalslot88｜R014" },
  { url: "https://agent-d334-dev.gsiwl.com", env: "DEV", code: "set33_GREEN｜R007" },
  { url: "https://agent-skd1-dev.gsiwl.com", env: "DEV", code: "set33_RED｜R008" },
  { url: "https://agent-djpn-dev.gsiwl.com", env: "DEV", code: "set_amuse｜R013" },
  { url: "https://agent-s334.gsiwl.com", env: "STG", code: "set33_GREEN｜R007" },
  { url: "https://agent-33rd.gsiwl.com", env: "STG", code: "set33_RED｜R008" },
  { url: "https://agent-sjpn.gsiwl.com", env: "STG", code: "set_amuse｜R013" },
  { url: "https://agent-obbl.gsiwl.com", env: "STG", code: "okbet_blackGold｜R003" },
  { url: "https://agent-ps51.gsiwl.com", env: "STG", code: "set_51(set_jokerhill)｜R010" },
  { url: "https://agent-ps50.gsiwl.com", env: "STG", code: "set50｜R015" },
  { url: "https://agent-ed1d.gsiwl.com", env: "STG", code: "set_ed8888｜R011" },
  { url: "https://agent-gsi1.gsiwl.com", env: "STG", code: "okbet｜R001" },
  { url: "https://agent-gsi3.gsiwl.com", env: "STG", code: "okbet｜R001" },
  { url: "https://agent-r171.gsiwl.com", env: "STG", code: "set_r017｜R017" },
  { url: "https://agent-r017.gsiwl.com", env: "STG", code: "set_r017｜R017" },
  { url: "https://agent-gsi2.gsiwl.com", env: "STG", code: "set_r017｜R017" },
  { url: "https://agent-obrd.gsiwl.com", env: "STG", code: "okbet_red｜R018" },
  { url: "https://agent-ed3d.gsiwl.com", env: "STG", code: "set_ed3｜R019" },
  { url: "https://agent-r021.gsiwl.com", env: "STG", code: "set_r021｜R021" },
  { url: "https://agent-r020.gsiwl.com", env: "STG", code: "okbet_redBlack｜R020" },
  { url: "https://agent-obtn.gsiwl.com", env: "STG", code: "set_r022｜R022" },
  { url: "https://agent-phb1.gsiwl.com", env: "STG", code: "set_r022｜R022" },
  { url: "https://agent-obbg.gsiwl.com", env: "STG", code: "okbet_green｜R026" },
  { url: "https://agent-obtp.gsiwl.com", env: "STG", code: "R023" },
  { url: "https://agent-obbb.gsiwl.com", env: "STG", code: "R024" },
  { url: "https://agent-obgb.gsiwl.com", env: "STG", code: "R025" },
  { url: "https://agent-ed3b.gsiwl.com", env: "STG", code: "R029" },
  { url: "https://agent-r172.gsiwl.com", env: "STG", code: "R027" },
  { url: "https://agent-r17b.gsiwl.com", env: "STG", code: "R030" },
  { url: "https://agent-r17p.gsiwl.com", env: "STG", code: "R031" },
  { url: "https://agent-r321.gsiwl.com", env: "STG", code: "R032" },
  { url: "https://agent-r331.gsiwl.com", env: "STG", code: "R033" },
  { url: "https://agent-gsi1.gpsriowdl.com", env: "PROD", code: "R001" },
  { url: "https://agent-fp1a.gpsriowdl.com", env: "PROD", code: "okbet_green｜R026" },
  { url: "https://agent-skg1.gpsriowdl.com", env: "PROD", code: "set33_RED｜R008" },
  { url: "https://agent-rue1.gpsriowdl.com", env: "PROD", code: "okbet_blackGold｜R003" },
  { url: "https://agent-phb1.gpsriowdl.com", env: "PROD", code: "R022" }
];

const byId = (id) => document.getElementById(id);
const state = loadState();
let toastTimer;
let jiraConnection = { configured: false, connected: false };
let bugAttachments = [];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      defaultAssignee: saved.defaultAssignee || "Edward",
      jiraBaseUrl: saved.jiraBaseUrl || "https://gamingsoft.atlassian.net",
      weekly: saved.weekly && typeof saved.weekly === "object" ? saved.weekly : {}
    };
  } catch {
    return { defaultAssignee: "Edward", jiraBaseUrl: "https://gamingsoft.atlassian.net", weekly: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function unique(values) {
  return Array.from(new Set(values));
}

function fillSelect(select, values, selected) {
  select.textContent = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  if (values.includes(selected)) select.value = selected;
}

function deriveMemberUrl(agentUrl) {
  try {
    const url = new URL(agentUrl);
    url.hostname = url.hostname.replace(/^agent-/, "").replace(/-dev(?=\.)/, "");
    url.pathname = "/";
    url.hash = "";
    url.search = "";
    return url.toString();
  } catch {
    return "";
  }
}

function refreshBugSites(preferredSite) {
  const env = byId("bugEnv").value;
  const codes = unique(SITES.filter((site) => site.env === env).map((site) => site.code));
  const fallback = env === "STG" && codes.includes("set_r017｜R017") ? "set_r017｜R017" : codes[0];
  fillSelect(byId("bugSite"), codes, preferredSite || byId("bugSite").value || fallback);
  refreshBugUrls();
}

function refreshBugUrls(preferredUrl) {
  const env = byId("bugEnv").value;
  const code = byId("bugSite").value;
  const matches = SITES.filter((site) => site.env === env && site.code === code);
  const select = byId("bugAgentUrl");
  select.textContent = "";
  matches.forEach((site) => {
    const option = document.createElement("option");
    option.value = site.url;
    option.textContent = site.url;
    select.appendChild(option);
  });
  if (preferredUrl && matches.some((site) => site.url === preferredUrl)) select.value = preferredUrl;
  byId("bugMemberUrl").value = deriveMemberUrl(select.value);
}

function getTitleSiteLabel(siteCode, memberUrl) {
  const code = siteCode.includes("｜") ? siteCode.split("｜").pop().trim() : siteCode.trim();
  if (code !== "R017") return code;
  try {
    return new URL(memberUrl).hostname.toLowerCase() === "gsi2.gsiwl.com" ? "新架構" : code;
  } catch {
    return code;
  }
}

function normalizeIssueNumber(value) {
  const match = String(value || "").match(/(?:GSI-)?(\d+)/i);
  return match ? match[1] : "";
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderBugAttachmentSection(section) {
  const list = byId(section === "expected" ? "bugExpectedScreenshotList" : "bugActualScreenshotList");
  list.textContent = "";
  bugAttachments.filter((attachment) => attachment.section === section).forEach((attachment) => {
    const item = document.createElement("article");
    item.className = "screenshot-item";

    const image = document.createElement("img");
    image.src = attachment.previewUrl;
    image.alt = attachment.file.name;

    const copy = document.createElement("div");
    copy.className = "screenshot-item-copy";
    const name = document.createElement("strong");
    name.textContent = attachment.file.name;
    const size = document.createElement("small");
    size.textContent = formatFileSize(attachment.file.size);
    copy.append(name, size);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "screenshot-remove";
    remove.setAttribute("aria-label", `移除 ${attachment.file.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      URL.revokeObjectURL(attachment.previewUrl);
      bugAttachments = bugAttachments.filter((itemValue) => itemValue.id !== attachment.id);
      renderBugAttachmentSection(section);
      renderBugOutputPreview();
      updateBugMeta();
    });

    item.append(image, copy, remove);
    list.appendChild(item);
  });
}

function renderBugAttachments() {
  renderBugAttachmentSection("actual");
  renderBugAttachmentSection("expected");
}

function addBugAttachments(files, section = "actual") {
  let added = 0;
  let rejectedMessage = "";
  for (const file of Array.from(files || [])) {
    const sectionCount = bugAttachments.filter((attachment) => attachment.section === section).length;
    if (sectionCount >= MAX_BUG_ATTACHMENTS_PER_SECTION) {
      rejectedMessage = `每個結果區塊最多只能加入 ${MAX_BUG_ATTACHMENTS_PER_SECTION} 張截圖`;
      break;
    }
    if (!BUG_ATTACHMENT_TYPES.has(String(file.type || "").toLowerCase())) {
      rejectedMessage = "只支援 PNG、JPG、WEBP 或 GIF 圖片";
      continue;
    }
    if (file.size > MAX_BUG_ATTACHMENT_BYTES) {
      rejectedMessage = `${file.name || "截圖"} 超過 5MB`;
      continue;
    }
    const duplicate = bugAttachments.some((item) =>
      item.section === section && item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified
    );
    if (duplicate) continue;
    bugAttachments.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      section,
      file,
      previewUrl: URL.createObjectURL(file)
    });
    added += 1;
  }
  renderBugAttachments();
  renderBugOutputPreview();
  updateBugMeta();
  if (added) showToast(`已加入 ${added} 張截圖`);
  else if (rejectedMessage) showToast(rejectedMessage);
}

function clearBugAttachments() {
  bugAttachments.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
  bugAttachments = [];
  byId("bugActualScreenshotInput").value = "";
  byId("bugExpectedScreenshotInput").value = "";
  renderBugAttachments();
}

function updateBugMeta() {
  const parent = normalizeIssueNumber(byId("bugParent").value);
  const actualCount = bugAttachments.filter((attachment) => attachment.section === "actual").length;
  const expectedCount = bugAttachments.filter((attachment) => attachment.section === "expected").length;
  byId("bugMeta").textContent = `受託人：${byId("bugAssignee").value}｜鏈接主單：${parent ? `is blocked by GSI-${parent}` : "未設定"}｜實際結果圖片：${actualCount} 張｜預期結果圖片：${expectedCount} 張`;
}

function appendPreviewSection(preview, title, text, attachments = []) {
  const section = document.createElement("section");
  section.className = "description-preview-section";
  const heading = document.createElement("h4");
  heading.textContent = title;
  section.appendChild(heading);

  const copy = document.createElement("p");
  copy.className = "description-preview-copy";
  copy.textContent = text || "—";
  section.appendChild(copy);

  if (attachments.length) {
    const gallery = document.createElement("div");
    gallery.className = "description-preview-gallery";
    attachments.forEach((attachment, index) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.src = attachment.previewUrl;
      image.alt = attachment.file.name || `${title}圖片 ${index + 1}`;
      const caption = document.createElement("figcaption");
      caption.textContent = attachment.file.name || `${title}圖片 ${index + 1}`;
      figure.append(image, caption);
      gallery.appendChild(figure);
    });
    section.appendChild(gallery);
  }
  preview.appendChild(section);
}

function renderBugOutputPreview() {
  const preview = byId("bugOutputPreview");
  if (!preview) return;
  preview.textContent = "";
  if (!byId("bugOutputContent").value) {
    const empty = document.createElement("p");
    empty.className = "description-preview-empty";
    empty.textContent = "產生內容後，文字與使用的圖片會顯示在這裡。";
    preview.appendChild(empty);
    return;
  }

  const basicInfo = [
    `環境：${byId("bugEnv").value}`,
    `版型：${byId("bugSite").value}`,
    `代理端地址：${byId("bugAgentUrl").value}`,
    `會員端地址：${byId("bugMemberUrl").value}`,
    `會員帳號：${byId("bugMemberAccount").value.trim()}　　會員密碼：${byId("bugMemberPassword").value.trim()}`
  ].join("\n");
  appendPreviewSection(preview, "基本信息", basicInfo);
  appendPreviewSection(preview, "操作步驟", byId("bugSteps").value.trim());
  appendPreviewSection(
    preview,
    "實際結果",
    byId("bugActual").value.trim(),
    bugAttachments.filter((attachment) => attachment.section === "actual")
  );
  appendPreviewSection(
    preview,
    "預期結果",
    byId("bugExpected").value.trim(),
    bugAttachments.filter((attachment) => attachment.section === "expected")
  );
}

function buildBugOutput() {
  const env = byId("bugEnv").value;
  const site = byId("bugSite").value;
  const agentUrl = byId("bugAgentUrl").value;
  const memberUrl = byId("bugMemberUrl").value;
  const account = byId("bugMemberAccount").value.trim();
  const password = byId("bugMemberPassword").value.trim();
  const assignee = byId("bugAssignee").value;
  const parent = normalizeIssueNumber(byId("bugParent").value);
  const seed = byId("bugTitleSeed").value.trim();
  const steps = byId("bugSteps").value.trim();
  const actual = byId("bugActual").value.trim();
  const expected = byId("bugExpected").value.trim();
  const title = `[BUG][${env}][${getTitleSiteLabel(site, memberUrl)}]${seed}`;
  const content = [
    "基本信息",
    `環境：${env}`,
    `版型：${site}`,
    `代理端地址：${agentUrl}`,
    `會員端地址：${memberUrl}`,
    `會員帳號：${account}　　會員密碼：${password}`,
    "",
    "操作步驟：",
    steps,
    "",
    "實際結果：",
    actual,
    "",
    "預期結果：",
    expected
  ].join("\n");
  byId("bugOutputTitle").value = title;
  byId("bugOutputContent").value = content;
  renderBugOutputPreview();
  byId("bugOutputState").textContent = "已產生";
  byId("bugOutputState").classList.add("ready");
  updateBugMeta();
  byId("jiraCreateResult").classList.add("hidden");
  byId("jiraCreateResult").textContent = "";
  showToast("Jira 草稿已產生");
}

function resetBug() {
  ["bugTitleSeed", "bugSteps", "bugActual", "bugExpected", "bugParent"].forEach((id) => { byId(id).value = ""; });
  byId("bugOutputTitle").value = "";
  byId("bugOutputContent").value = "";
  renderBugOutputPreview();
  byId("bugOutputState").textContent = "尚未產生";
  byId("bugOutputState").classList.remove("ready");
  clearBugAttachments();
  updateBugMeta();
  byId("jiraCreateResult").classList.add("hidden");
}

function renderJiraConnection() {
  const card = byId("jiraConnectionCard");
  const dot = byId("jiraConnectionDot");
  const title = byId("jiraConnectionTitle");
  const text = byId("jiraConnectionText");
  const connect = byId("jiraConnect");
  const disconnect = byId("jiraDisconnect");
  card.classList.toggle("connected", jiraConnection.connected);
  card.classList.toggle("not-configured", !jiraConnection.configured);
  dot.classList.toggle("connected", jiraConnection.connected);
  connect.classList.toggle("hidden", jiraConnection.connected);
  disconnect.classList.toggle("hidden", !jiraConnection.connected);

  if (jiraConnection.connected) {
    title.textContent = "Jira 已連接";
    text.textContent = `${jiraConnection.displayName || "目前帳號"}｜${jiraConnection.projectKey || "GSI"}`;
    connect.disabled = false;
    return;
  }
  if (!jiraConnection.configured) {
    title.textContent = "Jira 尚未完成設定";
    text.textContent = jiraConnection.message || "需要先設定 Atlassian OAuth";
    connect.disabled = false;
    return;
  }
  title.textContent = "Jira 尚未連接";
  text.textContent = `連接 ${jiraConnection.siteUrl || "gamingsoft.atlassian.net"} 後可直接建單`;
  connect.disabled = false;
}

async function checkJiraConnection() {
  try {
    const response = await fetch("/api/jira/status", { headers: { Accept: "application/json" }, cache: "no-store" });
    const data = await response.json();
    jiraConnection = { ...data, configured: Boolean(data.configured), connected: Boolean(data.connected) };
  } catch {
    jiraConnection = {
      configured: false,
      connected: false,
      message: "本機靜態預覽不含 Jira 後端；請使用 Cloudflare 線上版"
    };
  }
  renderJiraConnection();
}

function connectJira() {
  if (!jiraConnection.configured) {
    showToast(jiraConnection.message || "Cloudflare 尚未設定 Atlassian OAuth");
    return;
  }
  window.location.href = "/api/jira/oauth/start";
}

async function disconnectJira() {
  const response = await fetch("/api/jira/disconnect", {
    method: "POST",
    headers: { Accept: "application/json" }
  }).catch(() => null);
  if (!response?.ok) {
    showToast("無法中斷 Jira，請稍後重試");
    return;
  }
  jiraConnection.connected = false;
  renderJiraConnection();
  showToast("已中斷 Jira");
}

function renderJiraResult(data) {
  const result = byId("jiraCreateResult");
  result.textContent = "";
  result.classList.remove("hidden", "error");
  if (!data.ok) {
    result.classList.add("error");
    result.textContent = data.message || "Jira 建單失敗";
    return;
  }
  const strong = document.createElement("strong");
  strong.textContent = `${data.issueKey} 建立成功`;
  const link = document.createElement("a");
  link.href = data.issueUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "開啟 Jira 單";
  result.append(strong, link);
  if (data.attachmentCount) {
    const attachment = document.createElement("small");
    attachment.textContent = `已上傳 ${data.attachmentCount} 張附件；${data.embeddedCount || 0} 張已顯示於對應結果`;
    result.appendChild(attachment);
  }
  if (Array.isArray(data.warnings) && data.warnings.length) {
    const warning = document.createElement("small");
    warning.textContent = data.warnings.join("；");
    result.appendChild(warning);
  }
}

async function createJiraIssue() {
  if (!jiraConnection.connected) {
    if (jiraConnection.configured) connectJira();
    else showToast(jiraConnection.message || "請先完成 Jira OAuth 設定");
    return;
  }
  if (!byId("bugOutputTitle").value || !byId("bugOutputContent").value) buildBugOutput();

  const button = byId("jiraCreateIssue");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "建立中…";
  byId("jiraCreateResult").classList.add("hidden");
  try {
    const parent = normalizeIssueNumber(byId("bugParent").value);
    const response = await fetch("/api/jira/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        title: byId("bugOutputTitle").value,
        description: byId("bugOutputContent").value,
        assignee: byId("bugAssignee").value,
        parentIssue: parent ? `GSI-${parent}` : ""
      })
    });
    const data = await response.json().catch(() => ({ ok: false, message: `Jira 建單失敗（HTTP ${response.status}）` }));
    if (response.status === 401) {
      jiraConnection.connected = false;
      renderJiraConnection();
    }
    if (data.ok && bugAttachments.length) {
      button.textContent = "上傳附件…";
      const attachmentBody = new FormData();
      attachmentBody.append("issueKey", data.issueKey);
      attachmentBody.append("description", byId("bugOutputContent").value);
      bugAttachments.forEach((attachment) => {
        const field = attachment.section === "expected" ? "expectedFile" : "actualFile";
        attachmentBody.append(field, attachment.file, attachment.file.name);
      });
      const attachmentResponse = await fetch("/api/jira/attachments", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: attachmentBody
      });
      const attachmentData = await attachmentResponse.json().catch(() => ({ ok: false, message: `附件上傳失敗（HTTP ${attachmentResponse.status}）` }));
      if (attachmentResponse.status === 401) {
        jiraConnection.connected = false;
        renderJiraConnection();
      }
      if (attachmentData.ok) {
        data.attachmentCount = attachmentData.attachments?.length || bugAttachments.length;
        data.embeddedCount = attachmentData.embeddedCount || 0;
        if (Array.isArray(attachmentData.warnings)) data.warnings = [...(data.warnings || []), ...attachmentData.warnings];
      }
      else data.warnings = [...(data.warnings || []), attachmentData.message || "附件上傳失敗"];
    }
    renderJiraResult(data);
    showToast(data.ok ? `${data.issueKey} 建立成功` : (data.message || "Jira 建單失敗"));
  } catch {
    renderJiraResult({ ok: false, message: "無法連線到 Jira 後端，請稍後重試" });
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function consumeJiraRedirectResult() {
  const url = new URL(window.location.href);
  const result = url.searchParams.get("jira");
  if (!result) return;
  const message = url.searchParams.get("jira_message");
  showToast(result === "connected" ? "Jira 已成功連接" : (message || "Jira 連接失敗"));
  url.searchParams.delete("jira");
  url.searchParams.delete("jira_message");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

async function copyValue(id) {
  const field = byId(id);
  const value = field?.value || field?.textContent || "";
  if (!value) {
    showToast("目前沒有可複製的內容");
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    field.focus();
    field.select?.();
    document.execCommand("copy");
  }
  showToast("已複製到剪貼簿");
}

function getWeekDates(value) {
  const base = value ? new Date(`${value}T12:00:00`) : new Date();
  const offset = base.getDay() === 0 ? -6 : 1 - base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() + offset);
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shortDate(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function currentWeekKey() {
  return dateKey(getWeekDates(byId("weeklyDate").value)[0]);
}

function currentWeeklyData() {
  const key = currentWeekKey();
  if (!state.weekly[key]) state.weekly[key] = { reporter: "", items: [], output: "" };
  return state.weekly[key];
}

function extractSources(raw) {
  const sources = [];
  const jiraMatches = String(raw || "").match(/(?:https?:\/\/[^\s]*\/browse\/)?GSI-\d+|\b\d+\b/gi) || [];
  jiraMatches.forEach((match) => {
    const number = normalizeIssueNumber(match);
    if (number) sources.push({ type: "jira", key: `GSI-${number}`, url: `${state.jiraBaseUrl.replace(/\/$/, "")}/browse/GSI-${number}` });
  });
  const urlMatches = String(raw || "").match(/https?:\/\/[^\s<>"]+/gi) || [];
  urlMatches.forEach((url) => {
    if (/notion\.(?:com|site)/i.test(url)) sources.push({ type: "notion", key: "Notion", url: url.replace(/[),，。]+$/, "") });
  });
  return sources.filter((source, index, all) => all.findIndex((item) => item.url === source.url) === index);
}

function addWeeklySources() {
  const sources = extractSources(byId("weeklySources").value);
  if (!sources.length) {
    showToast("請輸入 Jira 單號或 Notion 網址");
    return;
  }
  const data = currentWeeklyData();
  let added = 0;
  sources.forEach((source) => {
    if (data.items.some((item) => item.url === source.url)) return;
    data.items.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      ...source,
      summary: source.type === "jira" ? `${source.key}｜待讀取 Jira 標題` : "Notion｜待讀取頁面標題",
      status: "待串接 API",
      group: "其他／待處理"
    });
    added += 1;
  });
  byId("weeklySources").value = "";
  saveWeeklyForm();
  renderWeeklyBoard();
  generateWeeklyOutput();
  showToast(added ? `已加入 ${added} 筆資料` : "清單中已有相同資料");
}

function renderWeeklyBoard() {
  const board = byId("weeklyBoard");
  const data = currentWeeklyData();
  board.textContent = "";
  WEEKLY_GROUPS.forEach((group) => {
    const section = document.createElement("section");
    section.className = "weekly-group";
    const items = data.items.filter((item) => item.group === group);
    const head = document.createElement("div");
    head.className = "weekly-group-head";
    const title = document.createElement("h3");
    title.textContent = group;
    const count = document.createElement("span");
    count.className = "weekly-count";
    count.textContent = items.length;
    head.append(title, count);
    section.appendChild(head);
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "weekly-empty";
      empty.textContent = "目前無項目";
      section.appendChild(empty);
    } else {
      const list = document.createElement("div");
      list.className = "weekly-items";
      items.forEach((item) => list.appendChild(createWeeklyItem(item)));
      section.appendChild(list);
    }
    board.appendChild(section);
  });
}

function createWeeklyItem(item) {
  const wrap = document.createElement("div");
  wrap.className = "weekly-item";
  const top = document.createElement("div");
  top.className = "weekly-item-top";
  const source = document.createElement("a");
  source.className = "weekly-source";
  source.href = item.url;
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  source.textContent = item.key;
  const remove = document.createElement("button");
  remove.className = "remove-item";
  remove.type = "button";
  remove.textContent = "移除";
  remove.addEventListener("click", () => {
    const data = currentWeeklyData();
    data.items = data.items.filter((entry) => entry.id !== item.id);
    saveWeeklyForm();
    renderWeeklyBoard();
    generateWeeklyOutput();
  });
  top.append(source, remove);
  wrap.appendChild(top);

  const summaryLabel = document.createElement("label");
  summaryLabel.textContent = "標題";
  const summary = document.createElement("input");
  summary.value = item.summary;
  summary.addEventListener("input", () => { item.summary = summary.value; saveWeeklyForm(); });
  summaryLabel.appendChild(summary);

  const statusLabel = document.createElement("label");
  statusLabel.textContent = "狀態";
  const status = document.createElement("input");
  status.value = item.status;
  status.addEventListener("input", () => { item.status = status.value; saveWeeklyForm(); });
  statusLabel.appendChild(status);

  const groupLabel = document.createElement("label");
  groupLabel.textContent = "分類";
  const groupSelect = document.createElement("select");
  fillSelect(groupSelect, WEEKLY_GROUPS, item.group);
  groupSelect.addEventListener("change", () => {
    item.group = groupSelect.value;
    saveWeeklyForm();
    renderWeeklyBoard();
    generateWeeklyOutput();
  });
  groupLabel.appendChild(groupSelect);
  wrap.append(summaryLabel, statusLabel, groupLabel);
  return wrap;
}

function saveWeeklyForm() {
  const data = currentWeeklyData();
  data.reporter = byId("weeklyReporter").value.trim();
  data.output = byId("weeklyOutput").value;
  saveState();
}

function loadWeekly() {
  const dates = getWeekDates(byId("weeklyDate").value);
  const data = currentWeeklyData();
  byId("weeklyReporter").value = data.reporter || "";
  byId("weeklyOutput").value = data.output || "";
  byId("weeklyRange").textContent = `${shortDate(dates[0])}－${shortDate(dates[4])}`;
  renderWeeklyBoard();
}

function generateWeeklyOutput() {
  const data = currentWeeklyData();
  const dates = getWeekDates(byId("weeklyDate").value);
  const lines = [`${shortDate(dates[0])}-${shortDate(dates[4])}`];
  const reporter = byId("weeklyReporter").value.trim();
  if (reporter) lines.push("", `人員｜${reporter}`);
  WEEKLY_GROUPS.forEach((group) => {
    const items = data.items.filter((item) => item.group === group);
    if (!items.length) return;
    lines.push("", `${group}（${items.length}）`);
    items.forEach((item, index) => lines.push(`${index + 1}. ${item.summary || item.key}｜${item.status || "狀態未填"}`));
  });
  byId("weeklyOutput").value = lines.join("\n");
  saveWeeklyForm();
}

function clearWeekly() {
  if (!window.confirm("確定清空本周資料嗎？")) return;
  state.weekly[currentWeekKey()] = { reporter: "", items: [], output: "" };
  saveState();
  loadWeekly();
  showToast("已清空本周資料");
}

function initializeAssignees() {
  fillSelect(byId("bugAssignee"), ASSIGNEES, state.defaultAssignee);
  fillSelect(byId("defaultAssignee"), ASSIGNEES, state.defaultAssignee);
  const people = byId("peopleList");
  ASSIGNEES.forEach((name) => {
    const chip = document.createElement("span");
    chip.className = "person-chip";
    chip.textContent = name;
    people.appendChild(chip);
  });
}

function saveSettings(event) {
  event.preventDefault();
  state.defaultAssignee = byId("defaultAssignee").value;
  state.jiraBaseUrl = byId("jiraBaseUrl").value.trim().replace(/\/$/, "") || "https://gamingsoft.atlassian.net";
  byId("bugAssignee").value = state.defaultAssignee;
  saveState();
  byId("settingsMessage").textContent = "已儲存；下次開啟會自動套用。";
  showToast("同事設定已儲存");
}

async function checkHealth() {
  const result = byId("healthResult");
  result.textContent = "檢查中...";
  try {
    const response = await fetch("/api/health", { headers: { Accept: "application/json" } });
    const data = await response.json();
    result.textContent = JSON.stringify(data, null, 2);
  } catch {
    result.textContent = "目前使用靜態預覽，Pages Function 會在 Cloudflare 或 Wrangler 環境中啟用。";
  }
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    const view = byId(`view-${button.dataset.view}`);
    view.classList.add("active");
    byId("pageTitle").textContent = view.dataset.title;
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", () => copyValue(button.dataset.copy)));
byId("bugForm").addEventListener("submit", (event) => { event.preventDefault(); buildBugOutput(); });
byId("bugReset").addEventListener("click", resetBug);
byId("bugEnv").addEventListener("change", () => refreshBugSites());
byId("bugSite").addEventListener("change", () => refreshBugUrls());
byId("bugAgentUrl").addEventListener("change", () => { byId("bugMemberUrl").value = deriveMemberUrl(byId("bugAgentUrl").value); });
byId("bugAssignee").addEventListener("change", updateBugMeta);
byId("bugParent").addEventListener("input", updateBugMeta);
function bindScreenshotDrop(section, dropId, inputId) {
  const drop = byId(dropId);
  const input = byId(inputId);
  drop.addEventListener("click", () => input.click());
  drop.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  });
  input.addEventListener("change", (event) => {
    addBugAttachments(event.target.files, section);
    event.target.value = "";
  });
  drop.addEventListener("dragover", (event) => {
    event.preventDefault();
    drop.classList.add("dragging");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragging"));
  drop.addEventListener("drop", (event) => {
    event.preventDefault();
    drop.classList.remove("dragging");
    addBugAttachments(event.dataTransfer?.files, section);
  });
}

bindScreenshotDrop("actual", "bugActualScreenshotDrop", "bugActualScreenshotInput");
bindScreenshotDrop("expected", "bugExpectedScreenshotDrop", "bugExpectedScreenshotInput");
document.addEventListener("paste", (event) => {
  if (!byId("view-bug").classList.contains("active")) return;
  const files = Array.from(event.clipboardData?.items || [])
    .filter((item) => item.kind === "file" && String(item.type || "").startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (!files.length) return;
  const target = event.target instanceof Element ? event.target : document.activeElement;
  const section = target?.id === "bugExpected" || target?.closest?.('[data-screenshot-section="expected"]')
    ? "expected"
    : target?.id === "bugActual" || target?.closest?.('[data-screenshot-section="actual"]')
      ? "actual"
      : "";
  if (!section) {
    showToast("請先點選實際結果或預期結果，再貼上圖片");
    return;
  }
  event.preventDefault();
  addBugAttachments(files, section);
});
byId("jiraConnect").addEventListener("click", connectJira);
byId("jiraDisconnect").addEventListener("click", disconnectJira);
byId("jiraCreateIssue").addEventListener("click", createJiraIssue);
byId("openJiraCreate").addEventListener("click", () => window.open(`${state.jiraBaseUrl.replace(/\/$/, "")}/secure/CreateIssue.jspa`, "_blank", "noopener"));
byId("weeklyAdd").addEventListener("click", addWeeklySources);
byId("weeklyClear").addEventListener("click", clearWeekly);
byId("weeklyGenerate").addEventListener("click", generateWeeklyOutput);
byId("weeklyDate").addEventListener("change", loadWeekly);
byId("weeklyReporter").addEventListener("input", saveWeeklyForm);
byId("weeklyOutput").addEventListener("input", saveWeeklyForm);
byId("settingsForm").addEventListener("submit", saveSettings);
byId("healthCheck").addEventListener("click", checkHealth);

initializeAssignees();
updateBugMeta();
consumeJiraRedirectResult();
byId("jiraBaseUrl").value = state.jiraBaseUrl;
refreshBugSites("set_r017｜R017");
refreshBugUrls("https://agent-gsi2.gsiwl.com");
byId("weeklyDate").value = dateKey(new Date());
loadWeekly();
checkJiraConnection();
