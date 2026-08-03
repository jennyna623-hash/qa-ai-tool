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

## 尚待串接

- Atlassian OAuth 與 Jira REST API
- Notion Integration／OAuth
- Jira 自動建立、選擇受託人、關聯主單及圖片附件
- Jira／Notion 周進度自動讀取與分類
- 原本依賴本機 Chrome 的網站自動登入

## Cloudflare Pages 建議設定

將程式碼放到 GitHub 私人 Repository 後，在 Cloudflare 建立 Pages 專案：

- Framework preset：`None`
- Root directory：`cloud-app`
- Build command：留空
- Build output directory：`public`

Cloudflare 會把專案根目錄的 `functions` 自動建立成 Pages Functions。

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
