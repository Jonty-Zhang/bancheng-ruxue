// 伴城入学 · Cloudflare Pages Function：返回当前模型与配置状态
// 路由：GET /api/config
export async function onRequestGet({ env }) {
  const MODEL = env.LLM_MODEL || "deepseek-chat";
  const hasKey = !!(env.LLM_API_KEY || env.DEEPSEEK_API_KEY);
  return new Response(JSON.stringify({ model: MODEL, hasKey }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
