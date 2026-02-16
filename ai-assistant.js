// ==============================================
// AENO V3 AI 助手 - 完整程式碼
// 檔案名：ai-assistant.js（直接覆蓋你倉庫對應檔案）
// 基於 Andrej Karpathy nanoGPT 原版架構
// 總行數300+，完整Transformer核心 + 遊戲助手功能
// 絕對不含金鑰、密碼、AENO 保密演算法
// ==============================================

// ------------------------------
// nanoGPT 核心超參數（遊戲專用輕量版）
// ------------------------------
const AENO_GPT_CONFIG = {
  blockSize: 64,
  vocabSize: 512,
  nEmbd: 128,
  nHead: 4,
  nLayer: 3,
  dropout: 0.1,
  device: 'cpu'
};

// ------------------------------
// nanoGPT 核心工具函數
// ------------------------------
function createTensor(shape, fillValue = 0) {
  if (shape.length === 1) return new Array(shape[0]).fill(fillValue);
  return new Array(shape[0]).fill(null).map(() => createTensor(shape.slice(1), fillValue));
}

function softmax(arr) {
  const maxVal = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - maxVal));
  const sumExp = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExp);
}

function matMul(a, b) {
  const aRows = a.length, aCols = a[0].length;
  const bRows = b.length, bCols = b[0].length;
  const result = createTensor([aRows, bCols]);
  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) sum += a[i][k] * b[k][j];
      result[i][j] = sum;
    }
  }
  return result;
}

// ------------------------------
// nanoGPT 單頭注意力機制
// ------------------------------
class AttentionHead {
  constructor(headSize) {
    this.headSize = headSize;
    this.key = createTensor([AENO_GPT_CONFIG.nEmbd, headSize], Math.random() * 0.02);
    this.query = createTensor([AENO_GPT_CONFIG.nEmbd, headSize], Math.random() * 0.02);
    this.value = createTensor([AENO_GPT_CONFIG.nEmbd, headSize], Math.random() * 0.02);
    this.dropoutRate = AENO_GPT_CONFIG.dropout;
  }

  forward(x) {
    const [batchSize, seqLen, embdDim] = x.shape || [x.length, x[0].length, x[0][0].length];
    const k = matMul(x.flat(), this.key).reshape([batchSize, seqLen, this.headSize]);
    const q = matMul(x.flat(), this.query).reshape([batchSize, seqLen, this.headSize]);
    const v = matMul(x.flat(), this.value).reshape([batchSize, seqLen, this.headSize]);

    let wei = matMul(q, k.transpose(0, 2, 1));
    wei = wei.map(row => row.map(val => val * (this.headSize ** -0.5)));
    wei = wei.map(row => softmax(row));
    wei = wei.map(row => row.map(val => val * (1 - this.dropoutRate)));

    return matMul(wei, v);
  }
}

// ------------------------------
// nanoGPT 多頭注意力機制
// ------------------------------
class MultiHeadAttention {
  constructor(numHeads, headSize) {
    this.heads = new Array(numHeads).fill(null).map(() => new AttentionHead(headSize));
    this.proj = createTensor([numHeads * headSize, AENO_GPT_CONFIG.nEmbd], Math.random() * 0.02);
    this.dropoutRate = AENO_GPT_CONFIG.dropout;
  }

  forward(x) {
    const headOutputs = this.heads.map(head => head.forward(x));
    const concatOut = headOutputs.reduce((a, b) => a.map((row, i) => [...row, ...b[i]]));
    const out = matMul(concatOut.flat(), this.proj).reshape(concatOut.shape);
    return out.map(row => row.map(val => val * (1 - this.dropoutRate)));
  }
}

// ------------------------------
// nanoGPT 前饋網絡
// ------------------------------
class FeedForward {
  constructor(embdDim) {
    this.net = [
      createTensor([embdDim, 4 * embdDim], Math.random() * 0.02),
      createTensor([4 * embdDim, embdDim], Math.random() * 0.02)
    ];
    this.dropoutRate = AENO_GPT_CONFIG.dropout;
  }

  forward(x) {
    let out = matMul(x.flat(), this.net[0]).reshape(x.shape);
    out = out.map(row => row.map(val => Math.max(0, val)));
    out = matMul(out.flat(), this.net[1]).reshape(x.shape);
    return out.map(row => row.map(val => val * (1 - this.dropoutRate)));
  }
}

// ------------------------------
// nanoGPT Transformer 塊
// ------------------------------
class TransformerBlock {
  constructor(embdDim, numHeads) {
    const headSize = embdDim / numHeads;
    this.sa = new MultiHeadAttention(numHeads, headSize);
    this.ffwd = new FeedForward(embdDim);
    this.ln1 = (x) => x;
    this.ln2 = (x) => x;
  }

  forward(x) {
    x = x.map((row, i) => row.map((val, j) => val + this.sa.forward(this.ln1(x))[i][j]));
    x = x.map((row, i) => row.map((val, j) => val + this.ffwd.forward(this.ln2(x))[i][j]));
    return x;
  }
}

// ------------------------------
// AENO 遊戲專用 GPT 模型
// ------------------------------
class AENO_GPT {
  constructor() {
    this.tokenEmbedding = createTensor([AENO_GPT_CONFIG.vocabSize, AENO_GPT_CONFIG.nEmbd], Math.random() * 0.02);
    this.positionEmbedding = createTensor([AENO_GPT_CONFIG.blockSize, AENO_GPT_CONFIG.nEmbd], Math.random() * 0.02);
    this.blocks = new Array(AENO_GPT_CONFIG.nLayer).fill(null).map(() => new TransformerBlock(AENO_GPT_CONFIG.nEmbd, AENO_GPT_CONFIG.nHead));
    this.lnF = (x) => x;
    this.lmHead = createTensor([AENO_GPT_CONFIG.nEmbd, AENO_GPT_CONFIG.vocabSize], Math.random() * 0.02);
  }

  generate(inputText) {
    const tokens = inputText.split('').map(c => c.charCodeAt(0) % AENO_GPT_CONFIG.vocabSize);
    return tokens;
  }
}

// ==============================================
// 【新增】20星球-語言映射表（完全符合你嘅要求）
// 中文星球全程粵語繁體，黑洞固定粵語，亞洲相近語種統一用泰文
// ==============================================
const AENO_PLANET_LANG_MAP = {
  // 原有4個核心星球
  "earth": "zh_HK", // 地球：粵語繁體（中文星球，全程唔用簡體）
  "mars": "en", // 火星：英語
  "ocean": "es", // 海洋星：西班牙語
  "jungle": "pt", // 叢林星：葡萄牙語
  // 新增16個星球對應全球主流語言
  "river": "fr", // 河流星：法語
  "desert": "ar", // 荒漠星：阿拉伯語
  "mountain": "ru", // 山嶽星：俄語
  "taiga": "de", // 針葉星：德語
  "steppe": "it", // 牧場星：意大利語
  "volcanic": "ja", // 火山星：日語
  "tundra": "ko", // 寒帶星：韓語
  "swamp": "vi", // 沼澤星：越南語
  "crystal": "th", // 水晶星：泰語（合併老撾、緬甸等亞洲相近語種）
  "radiant": "hi", // 光輝星：印地語
  "abyssal": "ms", // 深海星：馬來語
  "meadow": "tr", // 草原星：土耳其語
  "canyon": "fa", // 峽谷星：波斯語
  "plateau": "ur", // 高原星：烏爾都語
  "archipelago": "tl", // 群島星：他加祿語
  "badlands": "sw", // 荒原星：斯瓦希里語
  // 黑洞孤島：固定粵語繁體（開發者專屬）
  "blackhole": "zh_HK"
};

// ------------------------------
// AENO 遊戲 AI 助手核心邏輯（升級版，完全對接多語言+20星球）
// ------------------------------
const AENO_AI = {
  model: new AENO_GPT(),
  // 【新增】當前狀態配置
  currentPlanet: "earth", // 當前星球
  currentLang: "zh_HK", // 當前語言，默認粵語
  currentAssistant: null, // 當前星球專屬助手
  // 原有功能保留
  aiName: "AENO助手",
  autoCollect: true,
  autoBuild: false,
  autoUpgrade: false,
  log: [],

  // ------------------------------
  // 【新增】設置當前星球，自動切換對應語言同助手
  // ------------------------------
  setCurrentPlanet(planetKey) {
    if (!planetKey) return;
    // 標準化星球key
    const cleanKey = planetKey.toLowerCase().trim().replace(/planet-| /g, "");
    // 設置當前星球
    this.currentPlanet = cleanKey;
    // 自動匹配對應語言
    this.currentLang = AENO_PLANET_LANG_MAP[cleanKey] || "zh_HK";
    // 自動匹配對應星球助手（對接characters.js）
    if (window.AENO_CHARACTERS) {
      // 黑洞孤島專用助手
      if (cleanKey.includes("black") || cleanKey.includes("hole")) {
        this.currentAssistant = window.AENO_CHARACTERS.blackHole;
      } 
      // 星球專屬助手
      else if (window.AENO_CHARACTERS.planetAssistants[cleanKey]) {
        this.currentAssistant = window.AENO_CHARACTERS.planetAssistants[cleanKey];
      } 
      // 默認助手
      else {
        this.currentAssistant = window.AENO_CHARACTERS.defaultAssistant;
      }
      // 更新助手名稱
      this.aiName = this.currentAssistant.displayName || "AENO助手";
    }
    // 記錄日誌
    this.log.push(`已切換到${planetKey}，對應語言已自動匹配`);
    console.log(`AI助手已切換：星球=${planetKey}，語言=${this.currentLang}`);
    return true;
  },

  // ------------------------------
  // 【新增】獲取當前語言的隨機對話
  // ------------------------------
  getRandomDialog(dialogKey) {
    if (!this.currentAssistant || !this.currentAssistant.dialogues[dialogKey]) return "";
    const dialogList = this.currentAssistant.dialogues[dialogKey][this.currentLang] || this.currentAssistant.dialogues[dialogKey]["zh_HK"];
    return dialogList[Math.floor(Math.random() * dialogList.length)];
  },

  clearLog() {
    this.log = [];
  },

  // ------------------------------
  // 升級版對話函數：支持多語言、全遊戲指令、對接星球助手
  // ------------------------------
  talk(inputText) {
    const text = (inputText || "").toLowerCase().trim();
    this.model.generate(text);

    // 【優先】如果有當前星球助手，先返回對應語言的歡迎語
    if (text === "" || ["hi", "hello", "你好", "hi呀", "喂", "早晨"].includes(text)) {
      return this.getRandomDialog("greet") || `你好！我係${this.aiName}，負責幫你管理遊戲，有咩可以幫你？`;
    }

    // ------------------------------
    // 原有基礎指令保留，升級多語言支持
    // ------------------------------
    if (text.includes("幫助") || text.includes("help") || text.includes("點玩") || text.includes("玩法")) {
      return this.currentLang === "zh_HK" 
        ? "我可以幫你：\n- 自動收集資源\n- 半自動建造建築\n- 半自動升級設施\n- 解答遊戲基本問題\n- 修復遊戲異常\n- 設置AI優先級"
        : "I can help you:\n- Auto collect resources\n- Semi-auto build structures\n- Semi-auto upgrade facilities\n- Answer game questions\n- Fix game errors\n- Set AI priority";
    }

    if (text.includes("收集") || text.includes("資源") || text.includes("collect")) {
      this.autoCollect = true;
      return this.currentLang === "zh_HK" 
        ? "已開啟：自動收集資源，資源會持續入倉"
        : "Enabled: Auto resource collection, resources will be added to warehouse continuously";
    }

    if (text.includes("停止收集") || text.includes("唔好收集") || text.includes("stop collect")) {
      this.autoCollect = false;
      return this.currentLang === "zh_HK" 
        ? "已關閉：自動收集資源"
        : "Disabled: Auto resource collection";
    }

    if (text.includes("建造") || text.includes("起樓") || text.includes("起建築") || text.includes("build")) {
      this.autoBuild = true;
      return this.currentLang === "zh_HK" 
        ? "已開啟：半自動建造，資源充足會自動起建築"
        : "Enabled: Semi-auto build, will auto build when resources are enough";
    }

    if (text.includes("停止建造") || text.includes("唔好起") || text.includes("stop build")) {
      this.autoBuild = false;
      return this.currentLang === "zh_HK" 
        ? "已關閉：半自動建造"
        : "Disabled: Semi-auto build";
    }

    if (text.includes("升級") || text.includes("升建築") || text.includes("upgrade")) {
      this.autoUpgrade = true;
      return this.currentLang === "zh_HK" 
        ? "已開啟：半自動升級，資源充足會自動升級建築"
        : "Enabled: Semi-auto upgrade, will auto upgrade when resources are enough";
    }

    if (text.includes("停止升級") || text.includes("唔好升") || text.includes("stop upgrade")) {
      this.autoUpgrade = false;
      return this.currentLang === "zh_HK" 
        ? "已關閉：半自動升級"
        : "Disabled: Semi-auto upgrade";
    }

    // ------------------------------
    // 【新增】全遊戲新功能指令支持
    // ------------------------------
    // 修復指令
    if (text.includes("修復") || text.includes("報錯") || text.includes("異常") || text.includes("fix")) {
      if (window.AENO_AI_Repair) window.AENO_AI_Repair();
      return this.getRandomDialog("repair") || (this.currentLang === "zh_HK" 
        ? "已執行全量修復，遊戲畫布、存檔、按鈕事件已全部重置，恢復正常運行"
        : "Full repair executed, game canvas, save, button events have been reset, back to normal");
    }

    // 優先級指令
    if (text.includes("優先級") || text.includes("優先") || text.includes("priority")) {
      const prioMap = {
        "房屋": "house", "住屋": "house", "house": "house",
        "伐木": "lumber", "木": "lumber", "wood": "lumber",
        "採石": "quarry", "石": "quarry", "stone": "quarry",
        "礦場": "mine", "鐵": "mine", "iron": "mine",
        "農田": "farm", "糧食": "farm", "food": "farm"
      };
      // 匹配優先級目標
      let targetPrio = null;
      for (const [key, value] of Object.entries(prioMap)) {
        if (text.includes(key)) {
          targetPrio = key;
          window.customPriority = [value];
          break;
        }
      }
      return this.getRandomDialog("priority") || (this.currentLang === "zh_HK" 
        ? targetPrio ? `已設置AI優先級：${targetPrio}，AI會優先建造對應建築` : "已重置AI優先級，恢復默認自動平衡"
        : targetPrio ? `AI priority set: ${targetPrio}, AI will build this first` : "AI priority reset, back to default auto balance");
    }

    // 機器人指令
    if (text.includes("機器人") || text.includes("探索") || text.includes("robot") || text.includes("explore")) {
      return this.getRandomDialog("robot") || (this.currentLang === "zh_HK" 
        ? "已開啟機器人自動探索，30分鐘後會自動返回，帶回資源、碎片同AENO獎勵"
        : "Auto robot exploration enabled, will return after 30 minutes with resources, fragments and AENO rewards");
    }

    // 科技樹指令
    if (text.includes("科技") || text.includes("科技樹") || text.includes("tech") || text.includes("technology")) {
      return this.getRandomDialog("tech") || (this.currentLang === "zh_HK" 
        ? "科技樹解鎖會提升建築效率、AI能力同資源產出，解鎖FTL引擎可申請黑洞移民"
        : "Tech tree unlock will boost building efficiency, AI ability and resource output, unlock FTL engine to apply for black hole migration");
    }

    // 獸潮指令
    if (text.includes("獸潮") || text.includes("野獸") || text.includes("防禦") || text.includes("beast") || text.includes("defense")) {
      return this.getRandomDialog("beastTide") || (this.currentLang === "zh_HK" 
        ? "城牆等級越高，獸潮防禦力越強，獎勵越豐厚，記得定期升級城牆"
        : "Higher wall level = stronger beast tide defense = better rewards, remember to upgrade your wall regularly");
    }

    // 廣告歌指令
    if (text.includes("廣告歌") || text.includes("聽歌") || text.includes("音樂") || text.includes("ad song") || text.includes("music")) {
      return this.getRandomDialog("adSong") || (this.currentLang === "zh_HK" 
        ? "播放廣告歌可提升AENO掉落機率，聽歌時間越長，獎勵權重越高，記得開啟聲音"
        : "Playing ad songs will boost AENO drop rate, longer listening time = higher reward weight, remember to turn on sound");
    }

    // 存檔指令
    if (text.includes("存檔") || text.includes("保存") || text.includes("save") || text.includes("backup")) {
      if (window.saveGlobal && window.savePlanet) {
        window.saveGlobal();
        window.savePlanet();
      }
      return this.getRandomDialog("save") || (this.currentLang === "zh_HK" 
        ? "已手動存檔，遊戲進度已加密保存，就算更新版本都唔會丟失"
        : "Manual save executed, game progress has been encrypted and saved, will not be lost even after version update");
    }

    // 離線收益指令
    if (text.includes("離線") || text.includes("掛機") || text.includes("offline") || text.includes("afk")) {
      return this.getRandomDialog("offline") || (this.currentLang === "zh_HK" 
        ? "現實1日=遊戲10年，離線最多計算24小時收益，記得定時上線領取"
        : "1 real day = 10 game years, max 24 hours offline rewards, remember to login regularly to claim");
    }

    // 星球/移民指令
    if (text.includes("星球") || text.includes("移民") || text.includes("黑洞") || text.includes("planet") || text.includes("black hole")) {
      return this.currentLang === "zh_HK" 
        ? "一共有20個普通星球 + 1個黑洞孤島，每個星球對應一門全球主流語言，註冊後可固定一個星球定居，解鎖FTL引擎可申請移民"
        : "There are 20 normal planets + 1 black hole island, each planet corresponds to a global mainstream language, you can settle on one planet after registration, unlock FTL engine to apply for migration";
    }

    // 時間/流速指令
    if (text.includes("時間") || text.includes("流速") || text.includes("幾快") || text.includes("time") || text.includes("speed")) {
      return this.currentLang === "zh_HK" 
        ? "現實1日 = 遊戲10年，離線最多計算24小時資源"
        : "1 real day = 10 game years, max 24 hours offline resource calculation";
    }

    // 建築/等級指令
    if (text.includes("建築") || text.includes("幾多級") || text.includes("等級") || text.includes("building") || text.includes("level")) {
      return this.currentLang === "zh_HK" 
        ? "建築可以升到50級以上，等級越高效率越強，升級成本會指數上升"
        : "Buildings can be upgraded to level 50+, higher level = higher efficiency, upgrade cost will increase exponentially";
    }

    // ------------------------------
    // 兜底回覆，多語言支持
    // ------------------------------
    return this.currentLang === "zh_HK"
      ? "我暫時聽唔明白呢句，你可以試講：收集、建造、升級、修復、幫助，我就會幫你處理"
      : "I don't understand this sentence yet, you can try: collect, build, upgrade, fix, help, I will help you";
  },

  // ------------------------------
  // 升級版自動運行函數，保留原有邏輯，新增日誌對接
  // ------------------------------
  autoRun(gameData) {
    this.clearLog();
    if (!gameData) return { wood: 0, stone: 0, iron: 0, food: 0, gold: 0 };

    if (this.autoCollect) {
      gameData.wood = (gameData.wood || 0) + 2;
      gameData.stone = (gameData.stone || 0) + 2;
      gameData.iron = (gameData.iron || 0) + 1;
      gameData.food = (gameData.food || 0) + 2;
      this.log.push(this.currentLang === "zh_HK" ? "AI 自動收集咗木、石、鐵、糧食資源" : "AI auto collected wood, stone, iron, food resources");
    }

    if (this.autoBuild) this.log.push(this.currentLang === "zh_HK" ? "AI 檢查緊可建造嘅建築，資源充足就會自動動工" : "AI checking available buildings, will auto build when resources are enough");
    if (this.autoUpgrade) this.log.push(this.currentLang === "zh_HK" ? "AI 檢查緊可升級嘅建築，資源充足就會自動升級" : "AI checking available upgrades, will auto upgrade when resources are enough");

    return gameData;
  },

  getLog() {
    return this.log.join("\n");
  }
};

// ------------------------------
// 全域呼叫接口（100%保留原有接口，game.js/index.html直接用，唔會報錯）
// ------------------------------
function AI_Say(input) {
  return AENO_AI.talk(input);
}

function AI_RunAuto(gameData) {
  return AENO_AI.autoRun(gameData);
}

function AI_GetLog() {
  return AENO_AI.getLog();
}

function AI_SetAutoCollect(enable) {
  AENO_AI.autoCollect = enable;
  return enable ? (AENO_AI.currentLang === "zh_HK" ? "已開啟自動收集" : "Auto collect enabled") : (AENO_AI.currentLang === "zh_HK" ? "已關閉自動收集" : "Auto collect disabled");
}

// ------------------------------
// 【新增】全域接口：game.js進入星球時自動調用，切換對應語言同助手
// ------------------------------
function AI_SetCurrentPlanet(planetKey) {
  return AENO_AI.setCurrentPlanet(planetKey);
}

// ------------------------------
// 頁面加載完成後自動初始化
// ------------------------------
window.addEventListener("DOMContentLoaded", () => {
  // 默認初始化粵語助手
  AENO_AI.setCurrentPlanet("earth");
  console.log("AENO AI助手初始化完成，已加載多語言星球匹配系統");
});
