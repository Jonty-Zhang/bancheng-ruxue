// 伴城入学 · Cloudflare Pages Function：安全代理大模型（key 走 Secret，不暴露前端）
// 路由：POST /api/chat   环境变量：LLM_API_KEY / LLM_BASE_URL / LLM_MODEL

const SYS = {
  ask:    "你是“伴城入学”随迁子女入学政策助手。只能依据【政策依据】回答家长，不得编造或添加未提供的政策；简明中文，必要时分点；结尾用一句话提示“具体以当地教育部门当年官方文件为准”。",
  guide:  "你是“伴城入学”助手。依据【政策依据】，为家长生成一份清晰的分步操作指南：每步写清(1)做什么(2)去哪办/在哪申请(3)注意事项。只基于政策依据，不编造时间与材料；结尾提示以当年官方文件为准。",
  script: "你是“伴城入学”助手。依据【政策依据】，生成家长打电话咨询当地教育局/招生考试办时可逐条照着问的问题清单（6-8条，具体、可直接问）。",
  explain:"你是“伴城入学”助手。把给定的入学政策术语用家长能懂的大白话解释清楚，2-3句，不编造、不加新政策。",
};

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost({ request, env }) {
  const KEY  = env.LLM_API_KEY || env.DEEPSEEK_API_KEY || "";
  const BASE = (env.LLM_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
  const MODEL = env.LLM_MODEL || "deepseek-chat";
  if (!KEY) return json({ ok: false, reason: "nokey" });

  let data = {};
  try { data = await request.json(); } catch (e) {}
  const kind = data.kind || "ask";
  const user = `【政策依据】\n${data.context || ""}\n\n【家长情况/问题】\n${data.question || ""}`;

  try {
    const r = await fetch(BASE + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: SYS[kind] || SYS.ask },
          { role: "user", content: user },
        ],
      }),
    });
    const j = await r.json();
    const ans = j && j.choices && j.choices[0] && j.choices[0].message
      ? (j.choices[0].message.content || "").trim() : "";
    if (!ans) return json({ ok: false, reason: "empty" });
    return json({ ok: true, answer: ans, model: MODEL });
  } catch (e) {
    return json({ ok: false, reason: String(e) });
  }
}
