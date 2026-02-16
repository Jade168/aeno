// ==============================================
// AENO V3 AI 助手 - 完整程式碼
// 純輔助功能，不含任何金鑰、密碼、AENO 保密演算法
// 可直接覆蓋貼入倉庫 AI 檔案
// ==============================================

const AENO_AI = {
  aiName: "AENO助手",
  autoCollect: true,
  autoBuild: false,
  autoUpgrade: false,
  log: [],

  clearLog() {
    this.log = [];
  }
};

AENO_AI.talk = function (inputText) {
  let text = (inputText || "").toLowerCase().trim();

  if (text === "" || text === "hi" || text === "hello" || text === "你好") {
    return "你好！我係AENO助手，負責幫你管理遊戲。";
  }

  if (text.includes("幫助") || text.includes("help") || text.includes("點玩")) {
    return (
      "我可以幫你：\n" +
      "- 自動收集資源\n" +
      "- 半自動建造\n" +
      "- 半自動升級\n" +
      "- 回答遊戲基本問題"
    );
  }

  if (text.includes("收集") || text.includes("資源")) {
    this.autoCollect = true;
    return "已開啟：自動收集資源";
  }

  if (text.includes("停止收集") || text.includes("唔好收集")) {
    this.autoCollect = false;
    return "已關閉：自動收集資源";
  }

  if (text.includes("建造") || text.includes("起樓")) {
    this.autoBuild = true;
    return "已開啟：半自動建造";
  }

  if (text.includes("升級")) {
    this.autoUpgrade = true;
    return "已開啟：半自動升級";
  }

  if (text.includes("時間") || text.includes("幾快")) {
    return "現實1日 = 遊戲10年，離線最多計24小時";
  }

  if (text.includes("星球") || text.includes("移民")) {
    return "一共有20個普通星球 + 1個黑洞孤島";
  }

  if (text.includes("建築") || text.includes("幾多級")) {
    return "建築可以升到50級以上，成本指數上升";
  }

  if (text.includes("離線") || text.includes("離開")) {
    return "離線超過14日，領地會凍結隱藏";
  }

  return "我聽唔明白呢句，你可以試講：收集、建造、升級、幫助";
};

AENO_AI.autoRun = function (gameData) {
  this.clearLog();

  if (!gameData) return { wood: 0, stone: 0, iron: 0, food: 0 };

  if (this.autoCollect) {
    gameData.wood = (gameData.wood || 0) + 1;
    gameData.stone = (gameData.stone || 0) + 1;
    gameData.iron = (gameData.iron || 0) + 1;
    gameData.food = (gameData.food || 0) + 1;
    this.log.push("AI 自動收集資源");
  }

  if (this.autoBuild) {
    this.log.push("AI 準備建造");
  }

  if (this.autoUpgrade) {
    this.log.push("AI 準備升級");
  }

  return gameData;
};

AENO_AI.getLog = function () {
  return this.log.join("\n");
};

// 全域呼叫接口
function AI_Say(input) {
  return AENO_AI.talk(input);
}

function AI_RunAuto(gameData) {
  return AENO_AI.autoRun(gameData);
}

function AI_GetLog() {
  return AENO_AI.getLog();
}
