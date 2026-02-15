// 本地AI助手 · 含安全过滤 · 全球可用
function askAI(type, prompt) {

  // ======================
  // 禁止内容（安全过滤）
  // ======================
  const lowerPrompt = prompt.toLowerCase().trim();
  
  // 敏感/违规/危险问题 → 直接拒绝
  const forbidden = [
    "暴力", "色情", "政治", "违法", "攻击", "辱骂",
    "赌博", "毒品", "诈骗", "自杀", "伤害", "破解",
    "攻击人", "整人", "恶意", "非法", "犯罪"
  ];

  // 如果触发禁止内容 → 唔答
  for (let word of forbidden) {
    if (lowerPrompt.includes(word)) {
      return Promise.resolve("抱歉，呢个问题我唔可以回答，请问其他合法健康嘅问题。");
    }
  }

  // ======================
  // 正常回答
  // ======================
  let answer = "";

  if (type === "code") {
    answer = "你可以用 requestAnimationFrame 优化游戏循环，减少DOM操作，提升流畅度。";
  }
  else if (type === "game") {
    answer = "AENO游戏透过收集资源、升级科技、玩家互动来发展你的文明同DNA演化。";
  }
  else {
    answer = "我暂时唔知点答你呀，你可以问清楚D。";
  }

  return Promise.resolve(answer);
}
