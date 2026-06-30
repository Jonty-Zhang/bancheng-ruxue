# 部署到 Cloudflare Pages（免费 · 免备案 · 带 AI 全功能）

前端静态文件 + `functions/api/chat.js`（AI 代理）一起部署，key 用 Cloudflare Secret 保管，不暴露。

---

## 一、把代码推到 GitHub

> ⚠️ `.gitignore` 已排除 `config.txt`（里面有你的 API key）。推之前再确认一遍它不会被传上去。

在 `伴城入学` 文件夹里：
```bash
git init
git add .
git commit -m "伴城入学 · 随迁子女入学政策助手"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```
推完去 GitHub 网页确认：**看不到 config.txt** 才算安全。

## 二、连接 Cloudflare Pages

1. 登录 https://dash.cloudflare.com → 左侧 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 选刚才那个仓库。
3. 构建设置：
   - Framework preset：**None**
   - Build command：**留空**
   - Build output directory：**`/`**（根目录）
4. **Save and Deploy**。等它跑完，给你一个 `https://你的项目.pages.dev`。

## 三、配置大模型 key（环境变量 / Secret）

进入这个 Pages 项目 → **Settings** → **Environment variables** → 在 **Production** 加三个：

| 变量名 | 值 |
|---|---|
| `LLM_API_KEY` | 你的 key（sk-...） |
| `LLM_BASE_URL` | `https://apihub.agnes-ai.com/v1` |
| `LLM_MODEL` | `agnes-2.0-flash` |

> 换别的模型就改后两个（DeepSeek / Kimi / 智谱 / 通义 / OpenAI 都行，填对应 base_url 与 model）。

加完后到 **Deployments** → 最近一次 → **Retry deployment**，让变量生效。

## 四、完成 / 绑域名

- 访问 `https://你的项目.pages.dev`：`问 AI` 实时回答，key 在服务端不暴露。
- 绑自己的域名：Pages → **Custom domains** → 加域名 → 按提示在域名 DNS 加一条 **CNAME**。海外解析、**免备案**。

## 注意

- Cloudflare 免费版**大陆访问可能偏慢**（不走中国节点）；当参赛演示链接足够，面向大陆家长的正式服务则不理想。
- `/api/chat` 是公开 AI 代理，担心被盗刷可在函数里加个简单口令校验（需要就告诉我）。
- 本地开发 / 录视频仍可用 `python3 server.py`，两套后端逻辑等价。
