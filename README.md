# AI 工具 Cloud V1

這是從本機 `localhost:8787` 工具拆出的第一個雲端版本。原本的 PowerShell 工具不會被修改。

## V1 已提供

- BUG 標題與 Jira 描述產生
- 只有會員端 `https://gsi2.gsiwl.com/` 自動使用 `[新架構]` 標題；其他 R017 站點使用 `[R017]`
- 固定受託人清單，預設 Edward
- 受託人與主單不寫入描述
- 周進度項目、手動分類與彙整
- 每位同事的瀏覽器個人設定
- Cloudflare Pages Function 健康檢查
- Atlassian OAuth 2.0 安全連接
- Jira GSI BUG 自動建立、受託人指派及主單關聯
- 實際結果與預期結果各自支援貼圖、拖曳或選檔；建單後圖片顯示於對應描述區塊，並保留 Jira 附件

## 尚待串接

- Notion Integration／OAuth
- Jira／Notion 周進度自動讀取與分類
- 原本依賴本機 Chrome 的網站自動登入

## Cloudflare Pages 建議設定

將程式碼放到 GitHub 私人 Repository 後，在 Cloudflare 建立 Pages 專案：

- Framework preset：`None`
- Root directory：留空（Repository 根目錄就是本專案）
- Build command：留空
- Build output directory：`public`

Cloudflare 會把專案根目錄的 `functions` 自動建立成 Pages Functions。

## Jira OAuth 設定

在 Atlassian Developer Console 建立 OAuth 2.0 (3LO) integration：

- Callback URL：`https://qa-ai-tool.pages.dev/api/jira/oauth/callback`
- Jira platform API scopes：`read:jira-user`、`read:jira-work`、`write:jira-work`
- 工具授權網址還會要求 `offline_access`，讓 Jira 登入可安全續期

接著在 Cloudflare Pages 專案加入加密 Secrets：

- `ATLASSIAN_CLIENT_ID`
- `ATLASSIAN_CLIENT_SECRET`
- `JIRA_SESSION_SECRET`（至少 32 個隨機字元）

選用變數：

- `ATLASSIAN_CALLBACK_URL`：預設依目前網站產生
- `JIRA_SITE_URL`：預設 `https://gamingsoft.atlassian.net`
- `JIRA_PROJECT_KEY`：預設 `GSI`
- `JIRA_ISSUE_TYPE_ID`：未設定時自動尋找「漏洞／Bug」類型
- `JIRA_LINK_TYPE_NAME`：預設 `Blocks`，對應既有「is blocked by」主單關聯

## 本機預覽

純前端可使用任何靜態網站伺服器預覽 `public`。若要同時測試 `/api/health`，請安裝相依套件後執行：

```powershell
npm install
npm run dev
```

## 安全規則

請勿提交以下內容到 GitHub：

- `.env`、`.dev.vars`
- Jira／Notion Token
- Cloudflare API Token
- 正式站帳號密碼

正式串接的金鑰必須使用 Cloudflare Secrets。建議再以 Cloudflare Access 限制公司成員登入。

## 官方文件

- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/)
- [Cloudflare Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
