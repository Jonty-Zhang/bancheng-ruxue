/* 伴城入学 · 引擎：政策库 + 规则推演 + 任意大模型（经后端代理） */

/* ============ 1. 8 城政策库（已核实，每城挂官方来源） ============ */
const CITY = {
  "北京": {tag:"四证审核", lvl:"市级框架 + 各区细则（以东城区为例）",
    jzz:"北京市居住证，办证须早于入学前一年 5/1、地址在本区且持续有效",
    sb:"最近一年连续按月缴纳、补缴无效（各区月数不同）",
    zf:"在京实际住所：房产证，或租赁合同 + 一年以上完税证明",
    jf:"无统一积分制，'四证'审核准入", gb:"区教委统筹安排，或政府购买民办学位",
    zk:"block", src:"https://jw.beijing.gov.cn/xxgk/2024zcwj/2024xzgfwj/202603/t20260327_4567670.html"},
  "上海": {tag:"居住证积分", lvl:"市级统一（居住证积分为核心）",
    jzz:"父母一方持有效《上海市居住证》；孩子本人持居住证/居住登记凭证",
    sb:"一年内职工社保满 6 个月（不含补缴），或连续 3 年灵活就业登记",
    zf:"在沪合法稳定住所证明",
    jf:"义务教育入学不卡 120 分；120 分卡在中考能否报普高", gb:"区教育部门按资源统筹安排",
    zk:"jifen120", src:"http://www.shmeea.edu.cn/page/09000/20250430/19296.html"},
  "广州": {tag:"积分制", lvl:"市级框架 + 各区积分线",
    jzz:"《广东省居住证》连续满 1 年（截止当年 8/31）",
    sb:"任一险种即可，缴纳年限计入积分", zf:"合法稳定住所（计入积分）",
    jf:"保障性入学 + 积分制，各区自划录取线", gb:"积分录取为主，辅以政府购买民办学位",
    zk:"xueji", src:"https://gzzk.gz.gov.cn/gkmlpt/content/10/10114/post_10114429.html"},
  "深圳": {tag:"积分制", lvl:"市级框架 + 各区积分线（以罗湖为例）",
    jzz:"深圳经济特区居住证 + 连续居住满 1 年",
    sb:"养老 + 医疗连续满 1 年、补缴不计", zf:"房产，或租赁（红本租赁凭证）→ 决定可申请片区",
    jf:"各区积分制，按分排序", gb:"积分高低录取，未达线转民办或回原籍",
    zk:"social3", src:"https://www.sz.gov.cn/zfgb/zcjd/content/post_9447983.html"},
  "苏州": {tag:"积分制", lvl:"市区统一积分入学",
    jzz:"《江苏省居住证》+ 连续合法居住满 6 个月",
    sb:"申请时在苏州市区参加城镇职工社保", zf:"以居住证 + 连续居住时长衡量（购房另有规则）",
    jf:"积分制（基础分 + 附加分），各区按学位划线", gb:"积分排名靠前者优先安排公办",
    zk:"tbd", src:"https://www.suzhou.gov.cn/szsrmzf/mszx/202506/9667ed5a017d4a089dbc6d7039a16306.shtml"},
  "成都": {tag:"材料/积分双轨", lvl:"市级统一（材料 / 积分 双轨）",
    jzz:"《四川省居住证》（材料申请需满 6 个月）",
    sb:"材料轨：养老保险连续满半年且申请当月在缴", zf:"合法稳定住所（积分轨计分）",
    jf:"双轨：材料申请，或积分申请（积分≥10，养老≥5、住所≥5）", gb:"区（市）县教育部门统筹安排",
    zk:"loose", src:"https://www.cdzk.cn/cont/52/2025/3/12/23002.shtml"},
  "东莞": {tag:"积分制", lvl:"市级统一积分入读",
    jzz:"父母一方持有效《广东省居住证》（含电子居住证）",
    sb:"在莞社保年限（积分项）", zf:"在莞居所情况（积分项）",
    jf:"积分四项：居住证年限 / 社保年限 / 纳税 / 居所", gb:"积分录取公办；未入选民办有学位补贴",
    zk:"juzhu3", src:"https://edu.dg.gov.cn/gkmlpt/content/4/4354/post_4354618.html"},
  "武汉": {tag:"统筹安排", lvl:"市级统一（流程相对简洁）",
    jzz:"武汉市居住证",
    sb:"原文不要求社保，只需合法稳定就业材料（劳动合同/经营许可证）", zf:"以居住证对应的居住地为准",
    jf:"无积分制", gb:"居住证所在区教育局统筹安排",
    zk:"loose", src:"https://jyj.wuhan.gov.cn/zfxxgk/fdzdgknr/gysyjs/sqznrx/202503/t20250320_2554911.shtml"}
};

/* ============ 2. 中考可否报普高：规则推演 ============ */
const TG = {xueji:"孩子有本市 3 年完整初中学籍", social3:"父母社保累计满 3 年",
            juzhu3:"父母居住证累计满 3 年", jf120:"父母居住证积分满 120 分"};
const NEED = {block:[], jifen120:["jf120"], social3:["xueji","social3"],
              juzhu3:["xueji","juzhu3"], xueji:["xueji"], loose:[], tbd:["xueji"]};

function verdict(city, o){
  const t = CITY[city].zk;
  if(t==="block") return {r:"red", h:"普通随迁子女仅可报中职",
    d:"在北京，普通进城务工随迁子女不可报考普通高中，普高仅限“九类人”等特定情形；即便报中职，也需社保满 3 年、稳定职业满 3 年、初中连续 3 年学籍。"};
  if(t==="jifen120") return o.jf120 ? {r:"green", h:"可在沪中考、报普通高中",
    d:"父母居住证积分满 120 分，孩子可在上海参加中考并报考普通高中。"} : {r:"red", h:"目前仅可报中职",
    d:"居住证积分未满 120 分，孩子只能报中高职贯通 / 普通中专 / 职校；上海另设“中职自主招收随迁子女”通道。"};
  if(t==="social3") return (o.xueji&&o.social3) ? {r:"green", h:"可报公办普通高中",
    d:"满足 3 年完整学籍 + 父母社保累计满 3 年，可参加深圳划线录取、报考公办普高。"} : {r:"amber", h:"高门槛，暂不满足",
    d:"报公办普高需：3 年完整初中学籍 + 父母社保（养老/医疗任一）累计满 3 年 + 居住证及稳定职业住所；否则仅民办普高补录或中职。"};
  if(t==="juzhu3") return (o.xueji&&o.juzhu3) ? {r:"green", h:"可报公办普通高中",
    d:"满足 3 年完整学籍 + 父母居住证累计满 3 年，通过资格认定后可报公办普高。"} : {r:"amber", h:"高门槛，暂不满足",
    d:"报公办普高需资格认定：3 年完整初中学籍 + 父母居住证累计满 3 年 + 社保（广东满 3 年或东莞满 1 年）。"};
  if(t==="xueji") return o.xueji ? {r:"green", h:"可报公办普通高中",
    d:"具广州 3 年完整初中学籍 + 父母持有效《广东省居住证》即可报公办普高，不要求社保年限——相对宽松。"} : {r:"blue", h:"差“完整学籍”这一步",
    d:"报公办普高需广州 3 年完整初中学籍 + 父母有效居住证。"};
  if(t==="loose") return {r:"green", h:"可参加中考、报普通高中",
    d:"有本市学籍即可参加中考、报考普通高中，公开文件未见居住证/社保年限等额外门槛（门槛较低）。"};
  if(t==="tbd") return o.xueji ? {r:"green", h:"与本市考生同等报考",
    d:"有苏州初中学籍的随迁子女，与本市考生同等享受报考高中段学校的权利。"} : {r:"blue", h:"以取得本市学籍为准",
    d:"在苏州市区就读初中并取得学籍，即与本市考生同等报考；精确门槛待向苏州市教育考试院确认。"};
}

function checklist(city){
  const d = CITY[city];
  const list = ["父母及孩子户口簿、父母身份证", "孩子出生证明 / 预防接种证",
                "居住证：" + d.jzz, "就业 / 社保：" + d.sb, "住房：" + d.zf];
  if(d.jf.indexOf("无")!==0) list.push("积分申请相关材料：" + d.jf);
  return list;
}

/* ============ 3. 状态 + 选购式磁贴 ============ */
const $ = id => document.getElementById(id);
const SEL = {city:"北京", stage:"yiwu", cond:{}};
const CHK = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9.5l3.2 3.2L14 6" stroke="#0071e3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function renderCityTiles(){
  $("city-tiles").innerHTML = Object.keys(CITY).map(c=>
    `<button class="tile${c===SEL.city?' sel':''}" data-c="${c}"><div class="t-name">${c}</div><div class="t-sub">${CITY[c].tag}</div></button>`).join("");
}
function renderStageTiles(){
  const s=[["yiwu","幼升小 / 小升初","义务教育入学"],["zhongkao","中考升学","能不能上普高"]];
  $("stage-tiles").innerHTML = s.map(x=>
    `<button class="tile${x[0]===SEL.stage?' sel':''}" data-s="${x[0]}"><div class="t-name">${x[1]}</div><div class="t-sub">${x[2]}</div></button>`).join("");
}
function renderCondTiles(){
  const g=$("cond-group");
  if(SEL.stage!=="zhongkao"){ g.style.display="none"; return; }
  g.style.display="block";
  const keys = NEED[CITY[SEL.city].zk] || [];
  $("cond-tiles").innerHTML = keys.length
    ? keys.map(k=>`<button class="tile cond${SEL.cond[k]?' sel':''}" data-k="${k}"><span class="ck"></span><span>${TG[k]}</span></button>`).join("")
    : `<div class="muted">这座城市中考门槛较低，无需额外条件</div>`;
}

function badgeClass(r){return {red:"b-red",amber:"b-amber",blue:"b-blue",green:"b-green"}[r]}
function render(){
  const city=SEL.city, stage=SEL.stage, d=CITY[city];
  let h = `<div class="city-meta">${city} · ${d.lvl}</div>`;
  if(stage === "yiwu"){
    const rows = [["居住证",d.jzz],["社保 / 就业",d.sb],["住房",d.zf],["积分制",d.jf],["公办学位",d.gb]];
    h += `<div class="verdict-h">义务教育入学，这座城要你证明：</div>`;
    rows.forEach(r=>{h += `<div class="field-row"><div><div class="k">${r[0]}</div><div class="v">${r[1]}</div></div></div>`});
    h += `<div class="verdict-h" style="font-size:17px;margin-top:18px">该准备的材料</div><div class="checklist">`;
    checklist(city).forEach(c=>{h += `<div class="ci">${CHK}<span>${c}</span></div>`});
    h += `</div>`;
  } else {
    const v = verdict(city, SEL.cond);
    h += `<div class="verdict-h">中考能不能在${city}读普通高中？</div>`;
    h += `<span class="badge ${badgeClass(v.r)}">${v.h}</span><div class="verdict-d">${v.d}</div>`;
  }
  h += `<div class="src">政策原文来源：<a href="${d.src}" target="_blank" rel="noopener">${city}教育/招考官方文件 ›</a></div>`;
  $("result").innerHTML = h;
}

/* ============ 4. 普高门槛阶梯 ============ */
const LADDER = [
  {c:"#bf2c2c", ic:"⛔", h:"基本封死", cities:["北京"], p:"普通随迁子女仅可报中职，普高仅限“九类人”。"},
  {c:"#bf2c2c", ic:"①②⓪", h:"高积分墙", cities:["上海"], p:"父母居住证积分须满 120 分，否则只能读中职。"},
  {c:"#cf8a1a", ic:"3", h:"三年门槛", cities:["深圳","东莞"], p:"需 3 年完整学籍，再加父母社保满 3 年（深圳）或居住证满 3 年（东莞）。"},
  {c:"#1a7a4d", ic:"✓", h:"相对宽松", cities:["广州","武汉","成都","苏州"], p:"有本市完整学籍（广州另需父母有效居住证）即可报普高，不卡社保年限。"}
];
function renderLadder(){
  $("ladder-list").innerHTML = LADDER.map((t,i)=>`
    <div class="tier"><div class="tier-no" style="background:${t.c}">${i+1}</div>
      <div style="flex:1"><h4>${t.h}</h4><p>${t.p}</p>
        <div class="cities">${t.cities.map(c=>`<span class="cpill">${c}</span>`).join("")}</div></div></div>`).join("");
}

/* ============ 5. 政策白话 ============ */
const TERMS = [
  {t:"统筹安排", title:"不保证进你家门口那所学校", p:"政府按片区空余学位统一分配——你符合条件能进公办，但具体哪所由教育部门安排，不一定是离家最近、最想去的那所。"},
  {t:"积分入学", title:"按分数排队抢公办学位", p:"把居住证年限、社保年限、住房、纳税等折算成分数，分高的先录取公办。分不够，就只能等统筹或读民办。"},
  {t:"随迁子女资格审核", title:"先证明“你确实稳定生活在这”", p:"教育部门核验你的居住证、就业社保、住房等材料，确认孩子真的随父母在本地长期生活，才有资格申请本地学位。"},
  {t:"政策性照顾 / 优录", title:"满足条件可优先或加分", p:"部分城市对符合条件的随迁子女在录取上给予照顾（如武汉）。具体怎么照顾，看当年当地文件。"}
];
function renderPlain(){
  $("plain-cards").innerHTML = TERMS.map(x=>`<div class="card"><div class="term">${x.t}</div><h4>${x.title}</h4><p>${x.p}</p></div>`).join("");
}

/* ============ 6. 数据来源 ============ */
function renderSources(){
  $("sources-list").innerHTML = Object.keys(CITY).map(c=>
    `<div><b style="color:#1d1d1f">${c}</b> — <a href="${CITY[c].src}" target="_blank" rel="noopener">官方政策原文 ›</a></div>`).join("")
    + `<div style="margin-top:14px;color:#86868b">全国背景：国家统计局 / UNICEF / UNFPA《2020 中国儿童人口状况》、教育部《2024 全国教育事业发展统计公报》。政策背景：国务院《关于推行常住地提供基本公共服务的实施意见》（2026.05.22）。</div>`;
}

/* ============ 7. AI 助手（任意大模型，经后端 /api/chat；离线兜底） ============ */
function cityContext(city){
  const d = CITY[city];
  return `城市：${city}（${d.lvl}）\n居住证：${d.jzz}\n社保/就业：${d.sb}\n住房：${d.zf}\n积分制：${d.jf}\n公办学位安排：${d.gb}\n政策来源：${d.src}`;
}
async function aiCall(kind, context, question){
  try{
    const r = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({kind,context,question})});
    return await r.json();
  }catch(e){ return {ok:false,reason:"offline"}; }
}
function mdToHtml(t){
  let s = String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  s = s.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/(?<!\*)\*(?!\*)(.+?)\*/g,"<i>$1</i>");
  s = s.replace(/^#{1,4}\s*(.+)$/gm,'<div class="md-h">$1</div>');
  s = s.replace(/^\s*[-•]\s+(.+)$/gm,'<div class="md-li">$1</div>');
  s = s.replace(/\n{2,}/g,"<br><br>").replace(/\n/g,"<br>");
  return s;
}
function aiShow(html){ $("ai-out").innerHTML = html; }
function aiResult(text, model){
  const tag = model ? `由 AI 生成 · 基于官方政策库`
                    : `基于官方政策库整理`;
  aiShow(`<span class="tag">${tag}</span>${mdToHtml(text)}`);
}
function guideFallback(city){
  const d = CITY[city];
  return ["1. 办居住证：" + d.jzz, "2. 备齐就业 / 社保：" + d.sb, "3. 准备住房材料：" + d.zf,
    "4. 关注当年报名通知（多在 3–5 月），按当地平台网上报名、上传材料",
    (d.jf.indexOf("无")===0 ? "5. 按“四证 / 材料”审核提交，等待审核结果" : "5. 提交积分申请，关注积分公示与排名"),
    "6. 等待学位安排：" + d.gb, "（具体时间与材料以 " + city + " 教育部门当年官方文件为准）"].join("\n");
}
function scriptFallback(city){
  return ["打给 " + city + " 教育局 / 招生办，可以这样逐条问：",
    "1. 孩子打算在 " + city + " 入学，按现在政策需要满足哪些条件？",
    "2. 居住证要提前多久办？社保要连续缴多久、能不能补缴？",
    "3. 租房没有备案能不能申请？住在亲戚家行不行？", "4. 今年的报名时间和报名入口是什么？",
    "5. 如果积分不够 / 材料不全，孩子会被怎么安排？", "6. 将来中考能不能报普通高中，需要什么条件？"].join("\n");
}
async function runAI(kind){
  const city = SEL.city, stage = SEL.stage;
  let q;
  if(kind==="guide")  q = `孩子学段：${stage==="yiwu"?"幼升小/小升初":"中考升学"}。请给出在${city}的下一步操作指南。`;
  else if(kind==="script") q = `请生成在${city}打电话咨询的问题清单。`;
  else { q = ($("ai-q").value||"").trim(); if(!q){ $("ai-q").focus(); return; } }
  aiShow(`<div class="ai-loading">正在生成…</div>`);
  const res = await aiCall(kind, cityContext(city), q);
  if(res && res.ok){ aiResult(res.answer, res.model || "AI"); }
  else{
    const fb = kind==="guide" ? guideFallback(city) : kind==="script" ? scriptFallback(city)
             : "可参考上方该城市的政策门槛与官方来源链接；如需个案判断，建议拨打当地教育局咨询电话核实。";
    aiResult(fb, null);
  }
}

/* 主界面入口：滚到问答框并聚焦 */
function goAsk(){
  document.getElementById("ask").scrollIntoView({behavior:"smooth", block:"center"});
  setTimeout(()=>{ const q=$("ai-q"); if(q) q.focus(); }, 520);
}

/* ============ 8. 初始化 ============ */
function init(){
  renderCityTiles(); renderStageTiles(); renderCondTiles(); render();
  renderLadder(); renderPlain(); renderSources();
  $("city-tiles").addEventListener("click",e=>{const b=e.target.closest("[data-c]");if(!b)return;
    SEL.city=b.dataset.c; SEL.cond={}; renderCityTiles(); renderCondTiles(); render(); aiShow("");});
  $("stage-tiles").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;
    SEL.stage=b.dataset.s; SEL.cond={}; renderStageTiles(); renderCondTiles(); render(); aiShow("");});
  $("cond-tiles").addEventListener("click",e=>{const b=e.target.closest("[data-k]");if(!b)return;
    const k=b.dataset.k; SEL.cond[k]=!SEL.cond[k]; renderCondTiles(); render();});
  $("btn-guide").addEventListener("click",()=>runAI("guide"));
  $("btn-script").addEventListener("click",()=>runAI("script"));
  $("btn-ask").addEventListener("click",()=>runAI("ask"));
  $("ai-q").addEventListener("keydown",e=>{ if(e.key==="Enter") runAI("ask"); });
}
init();
