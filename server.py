#!/usr/bin/env python3
# 伴城入学 · 轻量后端：托管网页 + 安全代理 DeepSeek（API key 不暴露前端）
# 运行： DEEPSEEK_API_KEY=你的key  python3 server.py
#       然后浏览器打开 http://localhost:8000
# 不配 key 也能跑（AI 功能走前端离线兜底，规则推演不受影响）
import os, json, mimetypes, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8000"))

# ===== 接任意 OpenAI 兼容的大模型（DeepSeek / Kimi / 智谱GLM / 通义千问 / OpenAI / OpenRouter / 本地Ollama …）=====
# 配置优先级：环境变量 > config.txt > 默认（DeepSeek）
def load_config():
    cfg = {"api_key": "", "base_url": "https://api.deepseek.com", "model": "deepseek-chat"}
    cf = os.path.join(ROOT, "config.txt")
    if os.path.isfile(cf):
        for line in open(cf, encoding="utf-8"):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1); k, v = k.strip(), v.strip()
            if k in cfg and v:
                cfg[k] = v
    if not cfg["api_key"] and os.path.isfile(os.path.join(ROOT, "key.txt")):
        cfg["api_key"] = open(os.path.join(ROOT, "key.txt"), encoding="utf-8").read().strip()
    cfg["api_key"]  = os.environ.get("LLM_API_KEY")  or os.environ.get("DEEPSEEK_API_KEY") or cfg["api_key"]
    cfg["base_url"] = os.environ.get("LLM_BASE_URL") or cfg["base_url"]
    cfg["model"]    = os.environ.get("LLM_MODEL")    or cfg["model"]
    return cfg

CFG      = load_config()
API_KEY  = CFG["api_key"].strip()
BASE_URL = CFG["base_url"].rstrip("/")
MODEL    = CFG["model"]

SYS = {
 "ask":    "你是“伴城入学”随迁子女入学政策助手。只能依据【政策依据】回答家长，不得编造或添加未提供的政策；简明中文，必要时分点；结尾用一句话提示“具体以当地教育部门当年官方文件为准”。",
 "guide":  "你是“伴城入学”助手。依据【政策依据】，为家长生成一份清晰的分步操作指南：每步写清(1)做什么(2)去哪办/在哪申请(3)注意事项。只基于政策依据，不编造时间与材料；结尾提示以当年官方文件为准。",
 "script": "你是“伴城入学”助手。依据【政策依据】，生成家长打电话咨询当地教育局/招生考试办时可逐条照着问的问题清单（6-8条，具体、可直接问）。",
 "explain":"你是“伴城入学”助手。把给定的入学政策术语用家长能懂的大白话解释清楚，2-3句，不编造、不加新政策。",
}

def llm(messages):
    body = json.dumps({"model": MODEL, "messages": messages, "temperature": 0.3}).encode()
    req = urllib.request.Request(
        BASE_URL + "/chat/completions", data=body,
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + API_KEY})
    with urllib.request.urlopen(req, timeout=60) as r:
        j = json.loads(r.read().decode())
    return j["choices"][0]["message"]["content"].strip()

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        b = body if isinstance(body, bytes) else body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_POST(self):
        if self.path != "/api/chat":
            return self._send(404, json.dumps({"ok": False, "reason": "not found"}))
        n = int(self.headers.get("Content-Length", 0))
        data = json.loads(self.rfile.read(n) or b"{}")
        if not API_KEY:
            return self._send(200, json.dumps({"ok": False, "reason": "nokey"}))
        kind = data.get("kind", "ask")
        user = f"【政策依据】\n{data.get('context','')}\n\n【家长情况/问题】\n{data.get('question','')}"
        try:
            ans = llm([{"role": "system", "content": SYS.get(kind, SYS["ask"])},
                       {"role": "user", "content": user}])
            self._send(200, json.dumps({"ok": True, "answer": ans, "model": MODEL}))
        except Exception as e:
            self._send(200, json.dumps({"ok": False, "reason": str(e)}))

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/config":
            return self._send(200, json.dumps({"model": MODEL, "hasKey": bool(API_KEY)}))
        if path == "/":
            path = "/index.html"
        fp = os.path.normpath(os.path.join(ROOT, path.lstrip("/")))
        if not fp.startswith(ROOT) or not os.path.isfile(fp):
            return self._send(404, "not found", "text/plain; charset=utf-8")
        ctype = mimetypes.guess_type(fp)[0] or "application/octet-stream"
        with open(fp, "rb") as f:
            self._send(200, f.read(), ctype)

    def log_message(self, *a):
        pass

if __name__ == "__main__":
    if API_KEY:
        print(f"伴城入学 已启动 → http://localhost:{PORT}   （模型 {MODEL} @ {BASE_URL}，AI 实时生成）")
    else:
        print(f"伴城入学 已启动 → http://localhost:{PORT}   （未配置 key，AI 走离线兜底）")
    ThreadingHTTPServer(("", PORT), Handler).serve_forever()
