# AI 工具 Cloud V1

這是從本機 `localhost:8787` 工具拆出的第一個雲端版本。原本的 PowerShell 工具不會被修改。

## V1 已提供

- BUG 標題與 Jira 描述產生
- 只有會員端 `https://gsi2.gsiwl.com/` 自動使用 `[新架構]` 標題；其他 R017 站點使用 `[R017]`
- 固定受託人清單，預設 Edward
- 受託人與主單不寫入描述
- 會員密碼為選填；如有輸入會以明文寫入 Jira BUG 描述，且不保存於瀏覽器設定或程式碼
- BUG 操作步驟預設從 `1.` 開始，按 Enter 自動接續下一個編號
- Jira BUG 建立成功後，自動產生「標題連結＋Telegram 處理人員＋排查說明」回報草稿，支援編輯及富文字複製
- 周進度輸入 Jira 單號後，自動讀取標題、狀態與分類，也可手動新增「標題＋連結」；彙整區只保留分類、數量與工作連結，不輸出日期、人員或細項進度，並可複製為 Notion 相容格式；填寫人可選 Jenny、Ben 或 Guan
- 每位同事的瀏覽器個人設定
- Cloudflare Pages Function 健康檢查
- Atlassian OAuth 2.0 安全連接
- Jira GSI BUG 自動建立、受託人指派及主單關聯
- 鏈接主單預設使用 `is blocked by` 關係
- 問題描述會由 BUG 標題自動產生，描述順序固定為「基本信息 → 問題描述 → 操作步驟 → 實際結果 → 預期結果」
- 實際結果與預期結果皆為圖文內容區，可直接貼上或拖曳圖片；預覽與 Jira 描述會保留文字、圖片的交錯順序，並保留 Jira 附件
- Jira 草稿的描述區塊會直接顯示圖文預覽，方便建單前確認圖片位置
- 需求單回報可一次輸入最多 20 筆 Jira 單號，逐筆讀取標題、參與人員與關聯 BUG，支援 DEV／STG 完成與驗退文案、合併草稿、Telegram 帳號對照、編輯及富文字複製
- 周進度可重新向 Jira 讀取既有項目的最新標題與狀態，自動重新分類及彙整；讀取失敗的項目會保留原資料

## 尚待串接

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
- Jira Token
- Cloudflare API Token
- 正式站帳號密碼

正式串接的金鑰必須使用 Cloudflare Secrets。建議再以 Cloudflare Access 限制公司成員登入。

## 官方文件

- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/)
- [Cloudflare Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
