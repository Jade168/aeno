// AENO V4.0 - 核心AI模塊+DNA進化+畫面優化+自動修復最終版
// 完整對應AENO V3策劃大綱所有系統，100%保留原有核心邏輯
// 絕對不含金鑰、密碼、AENO保密演算法
const AENO_VERSION = "V4.0-FINAL";
const SAVE_KEY_GLOBAL = "AENO_GLOBAL_SAVE";
const SAVE_KEY_PLANET_PREFIX = "AENO_PLANET_SAVE_";
const MAX_OFFLINE_HOURS = 24;
const GAME_YEARS_PER_REAL_SECOND = (10 / (24 * 3600));
const AENO_APPLY = 8000000;
const AENO_WEIGHT = 10000000;

// 全局變量
let globalSave = null;
let planetSave = null;
let lastTick = performance.now();
let mode = "build";
let adAudio = null;
let songLoop = true;
let autoBuild = true;
let customPriority = [];
let isGameStarted = false;
let isGameRunning = false;

// 畫布初始化
const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d", { alpha: true, willReadFrequently: true }) : null;

// 畫布大小調整
function resizeCanvas() {
  if (!canvas || !ctx) return;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
}
window.addEventListener("resize", resizeCanvas);

// UI元素獲取
const ui = {
  planetName: document.getElementById("planetName"),
  gameYear: document.getElementById("gameYear"),
  popCount: document.getElementById("popCount"),
  coins: document.getElementById("coins"),
  aeno: document.getElementById("aeno"),
  wood: document.getElementById("wood"),
  stone: document.getElementById("stone"),
  iron: document.getElementById("iron"),
  food: document.getElementById("food"),
  factoryCount: document.getElementById("factoryCount"),
  robotCount: document.getElementById("robotCount"),
  logBox: document.getElementById("logBox"),
  autoState: document.getElementById("autoState"),
  loopState: document.getElementById("loopState"),
  panel: document.getElementById("panel"),
  togglePanelBtn: document.getElementById("togglePanelBtn"),
  btnHidePanel: document.getElementById("btnHidePanel"),
  btnSave: document.getElementById("btnSave"),
  btnBuildMode: document.getElementById("btnBuildMode"),
  btnUpgradeMode: document.getElementById("btnUpgradeMode"),
  btnAuto: document.getElementById("btnAuto"),
  btnAdSong: document.getElementById("btnAdSong"),
  btnLoopSong: document.getElementById("btnLoopSong"),
  btnRobotSend: document.getElementById("btnRobotSend"),
  btnExchange: document.getElementById("btnExchange"),
  btnTech: document.getElementById("btnTech"),
  planetSelect: document.getElementById("planetSelect"),
  assistantInput: document.getElementById("assistantInput"),
  sendAssistant: document.getElementById("sendAssistant"),
  closeChat: document.getElementById("closeChat"),
  assistantChatBody: document.getElementById("assistantChatBody"),
};

// ==================== 【核心】AENO AI模塊 ====================
const AENO_AI = {
  // 1. 資源管家AI - 嚴格遵守優先級，杜絕死循環
  resourceManager: {
    config: {
      RESERVE_RATIO: 0.6,
      MAX_TRIES_PER_TICK: 2,
      AUTO_UPGRADE: true,
      BUILD_SPACING: 1,
      SAFE_RATIO: 0.8,
    },
    // 獲取建築優先級（手動優先級 > 資源缺口優先級）
    getBuildPriority() {
      if (!planetSave) return [];
      // 手動優先級最高
      if (customPriority.length > 0) {
        const basePriority = ["lumber", "quarry", "mine", "farm", "house", "factory", "market"];
        return customPriority.concat(basePriority.filter(p => !customPriority.includes(p)));
      }
      // 自動計算資源缺口
      const resourceOutput = { wood: 0, stone: 0, iron: 0, food: 0 };
      for (const b of planetSave.buildings) {
        const def = BUILD_TYPES[b.type];
        if (!def || def.type !== "resource") continue;
        const lv = b.level || 1;
        resourceOutput[def.resource] += def.perLevel * lv;
      }
      const workerCount = planetSave.pop;
      resourceOutput.wood += workerCount * 0.06;
      resourceOutput.stone += workerCount * 0.05;
      resourceOutput.iron += workerCount * 0.05;
      resourceOutput.food += workerCount * 0.07;

      // 計算資源壓力
      const buildCostAvg = { wood: 0, stone: 0, iron: 0, food: 0 };
      let buildCount = 0;
      for (const key in BUILD_TYPES) {
        const def = BUILD_TYPES[key];
        if (def.cost.wood) buildCostAvg.wood += def.cost.wood;
        if (def.cost.stone) buildCostAvg.stone += def.cost.stone;
        if (def.cost.iron) buildCostAvg.iron += def.cost.iron;
        buildCount++;
      }
      for (const key in buildCostAvg) buildCostAvg[key] = buildCostAvg[key] / buildCount;

      const pressure = {};
      for (const res of ["wood", "stone", "iron", "food"]) {
        const stockRatio = planetSave[res] / (buildCostAvg[res] * 10);
        const outputRatio = resourceOutput[res] / buildCostAvg[res];
        pressure[res] = (1 / Math.max(0.1, stockRatio)) * (1 / Math.max(0.1, outputRatio));
      }

      const resToBuild = { wood: "lumber", stone: "quarry", iron: "mine", food: "farm" };
      const sortedRes = Object.keys(pressure).sort((a, b) => pressure[b] - pressure[a]);
      const priority = sortedRes.map(res => resToBuild[res]);

      // 資源安全後再加經濟建築
      const minPressure = Math.min(...Object.values(pressure));
      if (minPressure < 3) priority.push("house", "factory", "market");
      return priority;
    },
    // 檢查是否可以自動支付
    canAutoPay(cost) {
      if (!planetSave) return false;
      const maxCoins = Math.floor(planetSave.coins * this.config.RESERVE_RATIO);
      const maxWood = Math.floor(planetSave.wood * this.config.RESERVE_RATIO);
      const maxStone = Math.floor(planetSave.stone * this.config.RESERVE_RATIO);
      const maxIron = Math.floor(planetSave.iron * this.config.RESERVE_RATIO);
      const maxFood = Math.floor(planetSave.food * this.config.RESERVE_RATIO);
      if (cost.coins && cost.coins > maxCoins) return false;
      if (cost.wood && cost.wood > maxWood) return false;
      if (cost.stone && cost.stone > maxStone) return false;
      if (cost.iron && cost.iron > maxIron) return false;
      if (cost.food && cost.food > maxFood) return false;
      return true;
    },
    // 尋找空地
    findEmptyTile() {
      if (!planetSave) return null;
      const cx = planetSave.territoryCenter.x;
      const cy = planetSave.territoryCenter.y;
      const r = planetSave.territoryRadius;
      for (let d = 1; d <= r; d++) {
        for (let dx = -d; dx <= d; dx++) {
          for (let dy = -d; dy <= d; dy++) {
            if (Math.abs(dx) !== d && Math.abs(dy) !== d) continue;
            const x = cx + dx;
            const y = cy + dy;
            if (planetSave.buildings.some(b => b.x === x && b.y === y)) continue;
            let tooClose = false;
            for (let ox = -1; ox <= 1; ox++) {
              for (let oy = -1; oy <= 1; oy++) {
                if (ox === 0 && oy === 0) continue;
                if (planetSave.buildings.some(b => b.x === x+ox && b.y === y+oy)) {
                  tooClose = true;
                  break;
                }
              }
              if (tooClose) break;
            }
            if (!tooClose) return { x, y };
          }
        }
      }
      return null;
    },
    // 執行一次自動建造/升級
    runAutoBuildOnce() {
      if (!autoBuild || !planetSave) return false;
      const priority = this.getBuildPriority();

      // 優先升級
      if (this.config.AUTO_UPGRADE) {
        const upgradable = planetSave.buildings
          .filter(b => b.level < 100)
          .sort((a, b) => {
            const aIdx = priority.indexOf(BUILD_TYPES[a.type].resource ? BUILD_TYPES[a.type].resource : a.type);
            const bIdx = priority.indexOf(BUILD_TYPES[b.type].resource ? BUILD_TYPES[b.type].resource : b.type);
            return aIdx - bIdx;
          });
        for (const b of upgradable) {
          const def = BUILD_TYPES[b.type];
          const lv = b.level;
          const cost = {
            coins: Math.floor((def.cost.coins || 0) * Math.pow(1.5, lv)),
            wood: Math.floor((def.cost.wood || 0) * Math.pow(1.5, lv)),
            stone: Math.floor((def.cost.stone || 0) * Math.pow(1.5, lv)),
            iron: Math.floor((def.cost.iron || 0) * Math.pow(1.5, lv)),
          };
          if (this.canAutoPay(cost)) {
            payCost(cost);
            b.level++;
            // DNA突變檢測
            AENO_AI.evolution.checkBuildingMutation(b);
            log(`🤖 AI 升級 ${def.name} → Lv${b.level}`);
            return true;
          }
        }
      }

      // 新建建築
      for (const type of priority) {
        const def = BUILD_TYPES[type];
        if (!def) continue;
        if (!this.canAutoPay(def.cost)) continue;
        const tile = this.findEmptyTile();
        if (!tile) continue;
        payCost(def.cost);
        const newBuilding = {
          id: "auto_" + type + "_" + Date.now(),
          type,
          x: tile.x,
          y: tile.y,
          level: 1,
          dna: AENO_AI.evolution.generateBuildingDNA(),
        };
        planetSave.buildings.push(newBuilding);
        log(`🤖 AI 建成 ${def.name} Lv1`);
        return true;
      }
      return false;
    },
    // 執行自動建造循環
    run() {
      if (!autoBuild || !planetSave) return;
      let built = 0;
      while (built < this.config.MAX_TRIES_PER_TICK && this.runAutoBuildOnce()) {
        built++;
      }
    },
  },

  // 2. DNA進化AI - 建築、動物、植物突變進化
  evolution: {
    MUTATION_CHANCE_PER_YEAR: 0.002,
    EVOLUTION_THRESHOLD: 5,
    // 生成建築DNA
    generateBuildingDNA() {
      return {
        growthRate: 1,
        costReduction: 0,
        outputBoost: 0,
        mutationCount: 0,
        isMutated: false,
        evolutionLevel: 0,
      };
    },
    // 生成動物DNA
    generateAnimalDNA() {
      return {
        speed: 1,
        strength: 1,
        foodDrop: 1,
        woodDrop: 0,
        isHostile: false,
        evolutionLevel: 0,
        mutationCount: 0,
      };
    },
    // 檢查建築突變
    checkBuildingMutation(building) {
      if (!building.dna) building.dna = this.generateBuildingDNA();
      const roll = Math.random();
      if (roll > this.MUTATION_CHANCE_PER_YEAR * building.level) return;
      // 觸發突變
      building.dna.mutationCount++;
      building.dna.isMutated = true;
      const mutationType = Math.floor(Math.random() * 3);
      switch(mutationType) {
        case 0:
          building.dna.outputBoost += 0.2;
          log(`🧬 突變！${BUILD_TYPES[building.type].name} 產出提升20%`, "ok");
          break;
        case 1:
          building.dna.costReduction += 0.1;
          log(`🧬 突變！${BUILD_TYPES[building.type].name} 升級成本降低10%`, "ok");
          break;
        case 2:
          building.dna.growthRate += 0.3;
          log(`🧬 突變！${BUILD_TYPES[building.type].name} 等級成長速度提升30%`, "ok");
          break;
      }
      // 進化檢測
      if (building.dna.mutationCount >= this.EVOLUTION_THRESHOLD) {
        building.dna.evolutionLevel++;
        building.dna.mutationCount = 0;
        log(`✨ 進化！${BUILD_TYPES[building.type].name} 進化到 Lv${building.dna.evolutionLevel}`, "ok");
      }
    },
    // 檢查動物突變
    checkAnimalMutation(animal) {
      if (!animal.dna) animal.dna = this.generateAnimalDNA();
      const roll = Math.random();
      if (roll > this.MUTATION_CHANCE_PER_YEAR * 0.5) return;
      animal.dna.mutationCount++;
      const mutationType = Math.floor(Math.random() * 4);
      switch(mutationType) {
        case 0:
          animal.dna.speed += 0.2;
          log(`🐾 動物突變！移動速度提升20%`);
          break;
        case 1:
          animal.dna.foodDrop += 0.5;
          log(`🐾 動物突變！掉落糧食提升50%`);
          break;
        case 2:
          animal.dna.isHostile = true;
          log(`⚠️ 動物突變！變成了具有攻擊性的野獸`, "warning");
          break;
        case 3:
          animal.dna.woodDrop += 0.3;
          log(`🐾 動物突變！掉落木材提升30%`);
          break;
      }
      if (animal.dna.mutationCount >= this.EVOLUTION_THRESHOLD) {
        animal.dna.evolutionLevel++;
        animal.dna.mutationCount = 0;
        log(`✨ 動物進化！進化到 Lv${animal.dna.evolutionLevel}`, "ok");
      }
    },
    // 全局進化檢測
    runGlobalMutationCheck() {
      if (!planetSave) return;
      planetSave.buildings.forEach(b => this.checkBuildingMutation(b));
      planetSave.animals.forEach(a => this.checkAnimalMutation(a));
    },
  },

  // 3. 自檢修復AI - 自動檢測並修復遊戲問題
  repair: {
    CHECK_INTERVAL: 10000, // 每10秒檢查一次
    lastCheck: 0,
    // 檢查遊戲狀態
    checkGameState() {
      const now = Date.now();
      if (now - this.lastCheck < this.CHECK_INTERVAL) return;
      this.lastCheck = now;

      // 檢查1：遊戲循環是否停止
      if (isGameStarted && (now - lastTick > 5000)) {
        log("🔧 檢測到遊戲循環停止，自動重啟", "warning");
        this.restartGameLoop();
      }

      // 檢查2：資源死循環
      if (planetSave) {
        const resourceCheck = [
          { res: "wood", build: "lumber" },
          { res: "stone", build: "quarry" },
          { res: "iron", build: "mine" },
          { res: "food", build: "farm" },
        ];
        resourceCheck.forEach(({ res, build }) => {
          if (planetSave[res] <= 10 && !planetSave.buildings.some(b => b.type === build)) {
            log(`🔧 檢測到${res}即將耗盡且無對應建築，自動補建1個${BUILD_TYPES[build].name}`, "warning");
            const tile = AENO_AI.resourceManager.findEmptyTile();
            if (tile) {
              planetSave.buildings.push({
                id: "repair_" + build + "_" + Date.now(),
                type: build,
                x: tile.x,
                y: tile.y,
                level: 1,
                dna: this.evolution.generateBuildingDNA(),
              });
            }
          }
        });
      }

      // 檢查3：畫布黑屏/無渲染
      if (canvas && (canvas.width === 0 || canvas.height === 0)) {
        log("🔧 檢測到畫布異常，自動重置", "warning");
        resizeCanvas();
      }

      // 檢查4：存檔損壞
      if (!planetSave || !globalSave) {
        log("🔧 檢測到存檔損壞，自動恢復", "warning");
        this.restoreSave();
      }

      // 檢查5：按鈕事件丟失
      if (isGameStarted && !ui.btnSave.onclick) {
        log("🔧 檢測到按鈕事件丟失，自動重新綁定", "warning");
        rebindUIEvents();
      }
    },
    // 重啟遊戲循環
    restartGameLoop() {
      if (!isGameStarted) return;
      isGameRunning = false;
      lastTick = performance.now();
      isGameRunning = true;
      requestAnimationFrame(tick);
    },
    // 恢復存檔
    restoreSave() {
      if (!globalSave) {
        globalSave = defaultGlobalSave();
        saveGlobal();
      }
      if (!planetSave && globalSave.currentPlanetId) {
        loadPlanet(globalSave.currentPlanetId, "forest");
        savePlanet();
      }
    },
    // 手動修復指令
    manualRepair() {
      log("🔧 執行手動全量修復", "ok");
      this.restoreSave();
      resizeCanvas();
      rebindUIEvents();
      this.restartGameLoop();
      log("✅ 全量修復完成", "ok");
    },
  },

  // 4. 對話助手AI
  assistant: {
    commandMap: {
      "修復": () => AENO_AI.repair.manualRepair(),
      "建造": (type) => {
        const tile = AENO_AI.resourceManager.findEmptyTile();
        if (tile && BUILD_TYPES[type]) {
          buildAt(type, tile.x, tile.y);
          log(`✅ 已建造${BUILD_TYPES[type].name}`);
        }
      },
      "升級": (type) => {
        const building = planetSave.buildings.find(b => b.type === type && b.level < 100);
        if (building) {
          upgradeBuildingAt(building.x, building.y);
          log(`✅ 已升級${BUILD_TYPES[type].name}`);
        }
      },
      "優先級": (type) => {
        customPriority = [type];
        log(`✅ 已設置優先級為${BUILD_TYPES[type].name}`);
      },
    },
    // 處理指令
    processCommand(input) {
      input = input.trim().toLowerCase();
      this.addChatMessage("玩家", input);
      let response = "❌ 未識別指令，可用指令：修復、建造、升級、優先級";

      if (input.includes("修復")) {
        this.commandMap["修復"]();
        response = "✅ 已執行全量修復，遊戲已恢復正常";
      } else if (input.includes("建造")) {
        for (const type in BUILD_TYPES) {
          if (input.includes(BUILD_TYPES[type].name) || input.includes(type)) {
            this.commandMap["建造"](type);
            response = `✅ 已自動建造${BUILD_TYPES[type].name}`;
            break;
          }
        }
      } else if (input.includes("升級")) {
        for (const type in BUILD_TYPES) {
          if (input.includes(BUILD_TYPES[type].name) || input.includes(type)) {
            this.commandMap["升級"](type);
            response = `✅ 已自動升級${BUILD_TYPES[type].name}`;
            break;
          }
        }
      } else if (input.includes("優先級")) {
        for (const type in BUILD_TYPES) {
          if (input.includes(BUILD_TYPES[type].name) || input.includes(type)) {
            this.commandMap["優先級"](type);
            response = `✅ 已設置AI優先級為${BUILD_TYPES[type].name}`;
            break;
          }
        }
      } else if (input.includes("時間") || input.includes("流速")) {
        response = "現實1日 = 遊戲10年，離線最多計算24小時資源";
      } else if (input.includes("星球") || input.includes("移民")) {
        response = "一共有20個普通星球 + 1個黑洞孤島，註冊後固定一個星球定居";
      }

      this.addChatMessage("AI助手", response);
      return response;
    },
    // 添加聊天消息
    addChatMessage(sender, content) {
      if (!ui.assistantChatBody) return;
      const div = document.createElement("div");
      div.style.marginBottom = "8px";
      div.innerHTML = `<b>${sender}：</b>${content}`;
      ui.assistantChatBody.appendChild(div);
      ui.assistantChatBody.scrollTop = ui.assistantChatBody.scrollHeight;
    },
  },

  // 初始化AI模塊
  init() {
    this.resourceManager.repair = this.repair;
    this.resourceManager.evolution = this.evolution;
    this.repair.resourceManager = this.resourceManager;
    this.repair.evolution = this.evolution;
    this.assistant.repair = this.repair;
    this.assistant.resourceManager = this.resourceManager;
    log("🧬 AENO 核心AI模塊初始化完成", "ok");
  },
};

// ==================== 【工具函數】原有邏輯完全保留 ====================
// 系統日誌
function log(msg, type="") {
  console.log(msg);
  if (!ui.logBox) return;
  const div = document.createElement("div");
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  if (type === "danger") div.style.color = "#ff9aa2";
  if (type === "ok") div.style.color = "#a8ffb8";
  if (type === "warning") div.style.color = "#ffd966";
  ui.logBox.prepend(div);
  while (ui.logBox.children.length > 50) ui.logBox.removeChild(ui.logBox.lastChild);
}

// 隨機數工具
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStringToSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ==================== 【遊戲核心配置】對應策劃大綱 ====================
// 地圖配置
const MAP_W = 80;
const MAP_H = 80;
const TILE = 42;

// 建築配置（完整對應策劃大綱全建築，無限等級）
const BUILD_TYPES = {
  house: { name: "房屋", cost: { wood: 30, stone: 10, coins: 80 }, baseIncome: 3, pop: 2, type: "economy" },
  lumber: { name: "伐木場", cost: { wood: 10, stone: 5, coins: 60 }, baseIncome: 0, resource: "wood", perLevel: 1.3, type: "resource" },
  quarry: { name: "採石場", cost: { wood: 15, stone: 10, coins: 90 }, baseIncome: 0, resource: "stone", perLevel: 1.0, type: "resource" },
  mine: { name: "礦場", cost: { wood: 20, stone: 15, coins: 110 }, baseIncome: 0, resource: "iron", perLevel: 0.8, type: "resource" },
  farm: { name: "農田", cost: { wood: 20, stone: 5, coins: 70 }, baseIncome: 0, resource: "food", perLevel: 1.6, type: "resource" },
  factory: { name: "工廠", cost: { wood: 80, stone: 60, iron: 40, coins: 350 }, baseIncome: 8, type: "economy" },
  market: { name: "市場", cost: { wood: 50, stone: 30, coins: 200 }, baseIncome: 5, type: "economy" },
  wall: { name: "城牆", cost: { stone: 80, coins: 200 }, baseIncome: 0, type: "defense" },
  warehouse: { name: "倉庫", cost: { wood: 100, stone: 100, coins: 150 }, baseCapacity: 10000, type: "storage" },
  lab: { name: "研究所", cost: { wood: 300, stone: 200, iron: 150, coins: 1000 }, type: "tech" },
  exchange: { name: "交易所", cost: { wood: 500, stone: 300, iron: 200, coins: 2000 }, type: "trade" },
  adStation: { name: "廣告播放站", cost: { wood: 100, stone: 50, coins: 300 }, type: "ad" }
};

// 20個星球配置（對應策劃大綱）
const PLANET_LIST = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `星球 ${i + 1}`,
  seedType: i % 4 === 0 ? "forest" : i % 4 === 1 ? "mountain" : i % 4 === 2 ? "river" : "desert",
  resourceRate: {
    wood: 0.8 + Math.random() * 0.4,
    stone: 0.8 + Math.random() * 0.4,
    iron: 0.7 + Math.random() * 0.4,
    food: 0.8 + Math.random() * 0.4
  },
  beastLevel: 1 + Math.floor(i / 4),
  unlockLevel: i * 2
}));

// 黑洞孤島配置（開發者專用，對應策劃大綱）
const BLACK_HOLE = {
  id: 99,
  name: "黑洞孤島",
  isDeveloperOnly: true,
  resourceRate: { wood: 2, stone: 2, iron: 2, food: 2 },
  territoryFull: true
};

// 機器人系統配置（對應策劃大綱）
const ROBOT_CONFIG = {
  baseCost: { iron: 100, coins: 500 },
  maxResourceTake: 0.2,
  exploreTimeMs: 30 * 60 * 1000,
  maxCount: 10
};

// 獸潮系統配置（對應策劃大綱）
const BEAST_TIDE_CONFIG = {
  baseCycleMs: 60 * 60 * 1000,
  minWallLevel: 1,
  reward: {
    goldBase: 100,
    fragmentChance: 0.2,
    aenoChance: 0.05
  }
};

// 科技樹配置（對應策劃大綱）
const TECH_TREE = {
  agriculture: { name: "農業科技", maxLevel: 20, baseCost: { wood: 200, food: 300, coins: 500 }, effect: "農田產出提升10%/級" },
  industry: { name: "工業科技", maxLevel: 20, baseCost: { iron: 300, stone: 200, coins: 800 }, effect: "工廠產出提升10%/級" },
  defense: { name: "防禦科技", maxLevel: 20, baseCost: { stone: 400, iron: 200, coins: 600 }, effect: "城牆防禦提升15%/級" },
  aiEnhance: { name: "AI助手強化", maxLevel: 10, baseCost: { coins: 2000, iron: 500 }, effect: "AI自動建造次數+1/級" },
  robotTech: { name: "機器人科技", maxLevel: 15, baseCost: { iron: 1000, coins: 1500 }, effect: "機器人最大數量+1/級" },
  ftl: { name: "FTL超光速引擎", maxLevel: 1, baseCost: { aeno: 1000, coins: 100000 }, effect: "解鎖黑洞移民資格" },
  blackHole: { name: "黑洞科技", maxLevel: 5, baseCost: { aeno: 500, coins: 50000 }, effect: "黑洞資源產出提升20%/級" }
};

// ==================== 【存檔系統】原有邏輯補全 ====================
// 默認存檔
function defaultGlobalSave() {
  return {
    version: AENO_VERSION,
    createdAt: Date.now(),
    lastSeen: Date.now(),
    currentPlanetId: null,
    aeno: 0,
    aenoFragments: 0,
    loopSong: true,
    autoBuild: true,
    isDeveloper: false,
    blackHoleApply: [],
    blackHoleWeight: [],
    techUnlocked: {},
    robots: []
  };
}

function defaultPlanetSave(planetId, seedType) {
  return {
    planetId,
    seedType,
    gameYear: 0,
    coins: 2000,
    wood: 800,
    stone: 800,
    iron: 800,
    food: 800,
    pop: 4,
    territoryRadius: 5,
    territoryCenter: { x: 40, y: 40 },
    buildings: [
      { id: "b_house_1", type: "house", x: 39, y: 39, level: 2, dna: AENO_AI.evolution.generateBuildingDNA() },
      { id: "b_house_2", type: "house", x: 41, y: 39, level: 2, dna: AENO_AI.evolution.generateBuildingDNA() }
    ],
    animals: Array.from({ length: 20 }, (_, i) => ({
      id: "animal_" + i,
      x: Math.floor(Math.random() * 80),
      y: Math.floor(Math.random() * 80),
      dna: AENO_AI.evolution.generateAnimalDNA()
    })),
    beastTide: {
      lastTriggerTime: Date.now(),
      isActive: false,
      winCount: 0
    },
    mineVeins: Array.from({ length: 10 }, (_, i) => ({
      id: "vein_" + i,
      x: Math.floor(Math.random() * 80),
      y: Math.floor(Math.random() * 80),
      type: ["iron", "gold", "stone"][Math.floor(Math.random() * 3)],
      amount: 1000 + Math.random() * 5000,
      exhausted: false
    }))
  };
}

// 存檔/讀檔函數
function saveGlobal() {
  if (!globalSave) return;
  globalSave.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY_GLOBAL, JSON.stringify(globalSave));
}

function loadGlobal() {
  const saved = localStorage.getItem(SAVE_KEY_GLOBAL);
  if (saved) {
    globalSave = JSON.parse(saved);
    autoBuild = globalSave.autoBuild;
    songLoop = globalSave.loopSong;
    return true;
  }
  globalSave = defaultGlobalSave();
  saveGlobal();
  return false;
}

function savePlanet() {
  if (!planetSave || !globalSave) return;
  const key = SAVE_KEY_PLANET_PREFIX + planetSave.planetId;
  localStorage.setItem(key, JSON.stringify(planetSave));
}

function loadPlanet(planetId, seedType) {
  const key = SAVE_KEY_PLANET_PREFIX + planetId;
  const saved = localStorage.getItem(key);
  if (saved) {
    planetSave = JSON.parse(saved);
    return true;
  }
  planetSave = defaultPlanetSave(planetId, seedType);
  savePlanet();
  return false;
}

// 離線進度計算（對應策劃大綱）
function calculateOfflineProgress() {
  if (!planetSave || !globalSave) return;
  const now = Date.now();
  const offlineMs = now - globalSave.lastSeen;
  const maxOfflineMs = MAX_OFFLINE_HOURS * 60 * 60 * 1000;
  const validMs = Math.min(offlineMs, maxOfflineMs);
  const gameYearsPassed = validMs / 1000 * GAME_YEARS_PER_REAL_SECOND;

  if (gameYearsPassed <= 0) return;

  // 離線資源產出
  produceResources(gameYearsPassed);
  planetSave.gameYear += gameYearsPassed;

  // 百年進化檢查
  const lastEvolutionYear = Math.floor((planetSave.gameYear - gameYearsPassed) / 100);
  const currentEvolutionYear = Math.floor(planetSave.gameYear / 100);
  if (currentEvolutionYear > lastEvolutionYear) {
    AENO_AI.evolution.runGlobalMutationCheck();
    log(`✨ 遊戲度過${currentEvolutionYear * 100}年，世界發生進化！`, "ok");
  }

  log(`📅 你離線咗${Math.floor(offlineMs / 3600000)}小時，遊戲度過${gameYearsPassed.toFixed(1)}年，資源已自動收集`, "ok");
}

// ==================== 【遊戲核心玩法邏輯】對應策劃大綱全系統 ====================
// 資源生產
function produceResources(years) {
  if (!planetSave) return;
  const planet = PLANET_LIST.find(p => p.id === planetSave.planetId) || PLANET_LIST[0];
  const resourceRate = planet.resourceRate;

  // 建築產出計算
  for (const b of planetSave.buildings) {
    const def = BUILD_TYPES[b.type];
    if (!def) continue;
    const lv = b.level;
    const dnaBoost = b.dna?.outputBoost || 0;
    const levelMultiplier = 1 + lv * 0.1;

    // 資源建築
    if (def.type === "resource" && def.resource) {
      const output = def.perLevel * lv * levelMultiplier * resourceRate[def.resource] * (1 + dnaBoost) * years;
      planetSave[def.resource] += output;
    }

    // 經濟建築
    if (def.type === "economy" && def.baseIncome) {
      const income = def.baseIncome * lv * levelMultiplier * (1 + dnaBoost) * years;
      planetSave.coins += income;
    }

    // 人口計算
    if (def.type === "economy" && def.pop) {
      planetSave.pop = Math.max(planetSave.pop, def.pop * lv);
    }
  }

  // 資源上限（倉庫）
  const warehouse = planetSave.buildings.find(b => b.type === "warehouse");
  if (warehouse) {
    const maxCapacity = BUILD_TYPES.warehouse.baseCapacity * Math.pow(1.5, warehouse.level);
    ["wood", "stone", "iron", "food"].forEach(res => {
      planetSave[res] = Math.min(planetSave[res], maxCapacity);
    });
  }
}

// 支付成本
function payCost(cost) {
  if (!planetSave) return false;
  for (const [res, amount] of Object.entries(cost)) {
    if (planetSave[res] < amount) return false;
  }
  for (const [res, amount] of Object.entries(cost)) {
    planetSave[res] -= amount;
  }
  return true;
}

// 建造建築
function buildAt(type, x, y) {
  const def = BUILD_TYPES[type];
  if (!def || !planetSave) return false;
  if (planetSave.buildings.some(b => b.x === x && b.y === y)) return false;
  if (!payCost(def.cost)) return false;

  const newBuilding = {
    id: "b_" + type + "_" + Date.now(),
    type,
    x,
    y,
    level: 1,
    dna: AENO_AI.evolution.generateBuildingDNA(),
  };
  planetSave.buildings.push(newBuilding);
  log(`✅ 已建造${def.name} Lv1`, "ok");
  return true;
}

// 升級建築
function upgradeBuildingAt(x, y) {
  const building = planetSave?.buildings.find(b => b.x === x && b.y === y);
  if (!building) return false;
  const def = BUILD_TYPES[building.type];
  if (!def) return false;

  const lv = building.level;
  const costReduction = building.dna?.costReduction || 0;
  const cost = {};
  for (const [res, base] of Object.entries(def.cost)) {
    cost[res] = Math.floor(base * Math.pow(1.5, lv) * (1 - costReduction));
  }

  if (!payCost(cost)) return false;
  building.level++;
  AENO_AI.evolution.checkBuildingMutation(building);
  log(`✅ 已升級${def.name} → Lv${building.level}`, "ok");
  return true;
}

// 領土擴張（對應策劃大綱）
function expandTerritory(useAENO = false) {
  if (!planetSave) return false;
  const expandCost = {
    coins: Math.floor(500 * Math.pow(1.3, planetSave.territoryRadius - 5))
  };

  if (useAENO) {
    expandCost.aeno = Math.floor(10 * Math.pow(1.3, planetSave.territoryRadius - 5));
    if (globalSave.aeno < expandCost.aeno) return false;
    globalSave.aeno -= expandCost.aeno;
  } else {
    if (planetSave.coins < expandCost.coins) return false;
    planetSave.coins -= expandCost.coins;
  }

  planetSave.territoryRadius += 1;
  log(`✅ 領土擴張成功！當前半徑：${planetSave.territoryRadius}`, "ok");
  return true;
}

// 機器人系統（對應策劃大綱）
function sendRobot(planetId) {
  if (!globalSave || !planetSave) return false;
  const targetPlanet = PLANET_LIST.find(p => p.id === planetId);
  if (!targetPlanet) return false;

  const robotCount = globalSave.robots.length;
  const maxRobots = ROBOT_CONFIG.maxCount + (globalSave.techUnlocked.robotTech || 0);
  if (robotCount >= maxRobots) return false;

  const cost = {
    iron: ROBOT_CONFIG.baseCost.iron * (robotCount + 1),
    coins: ROBOT_CONFIG.baseCost.coins * (robotCount + 1)
  };
  if (!payCost(cost)) return false;

  // 抽取最多20%資源作為成本
  const resourceTake = {};
  ["wood", "stone", "iron", "food"].forEach(res => {
    resourceTake[res] = Math.floor(planetSave[res] * ROBOT_CONFIG.maxResourceTake);
    planetSave[res] -= resourceTake[res];
  });

  const newRobot = {
    id: "robot_" + Date.now(),
    targetPlanetId: planetId,
    sendTime: Date.now(),
    returnTime: Date.now() + ROBOT_CONFIG.exploreTimeMs,
    resourceTake,
    returned: false
  };
  globalSave.robots.push(newRobot);
  log(`🤖 已派遣機器人前往${targetPlanet.name}，預計30分鐘後返回`, "ok");
  return true;
}

function checkRobotReturn() {
  if (!globalSave || !planetSave) return;
  const now = Date.now();
  globalSave.robots.forEach(robot => {
    if (robot.returned || now < robot.returnTime) return;
    robot.returned = true;
    const targetPlanet = PLANET_LIST.find(p => p.id === robot.targetPlanetId);
    const rewardMultiplier = 1 + (targetPlanet.beastLevel * 0.2);

    // 帶回資源
    ["wood", "stone", "iron", "food"].forEach(res => {
      const reward = Math.floor(robot.resourceTake[res] * rewardMultiplier * (0.8 + Math.random() * 0.6));
      planetSave[res] += reward;
    });

    // 碎片/AENO獎勵
    const fragmentRoll = Math.random();
    if (fragmentRoll < BEAST_TIDE_CONFIG.reward.fragmentChance) {
      globalSave.aenoFragments += 1 + Math.floor(Math.random() * 3);
    }
    const aenoRoll = Math.random();
    if (aenoRoll < BEAST_TIDE_CONFIG.reward.aenoChance) {
      globalSave.aeno += 1;
      log(`✨ 機器人帶回了AENO！`, "ok");
    }

    log(`🤖 機器人從${targetPlanet.name}返回，帶回了大量資源！`, "ok");
  });

  // 清理已返回的機器人
  globalSave.robots = globalSave.robots.filter(r => !r.returned);
}

// 獸潮系統（對應策劃大綱）
function checkBeastTide() {
  if (!planetSave) return;
  const now = Date.now();
  const wallLevel = planetSave.buildings.filter(b => b.type === "wall").reduce((sum, b) => sum + b.level, 0);
  const { beastTide } = planetSave;

  if (wallLevel < BEAST_TIDE_CONFIG.minWallLevel || beastTide.isActive) return;
  const cycleMs = BEAST_TIDE_CONFIG.baseCycleMs * (1 - wallLevel * 0.01);
  if (now - beastTide.lastTriggerTime < cycleMs) return;

  // 觸發獸潮
  beastTide.isActive = true;
  beastTide.lastTriggerTime = now;
  log(`⚠️ 獸潮來襲！準備防禦！`, "warning");
}

function completeBeastTide(win = true) {
  if (!planetSave || !planetSave.beastTide.isActive) return;
  const { beastTide } = planetSave;
  beastTide.isActive = false;

  if (win) {
    beastTide.winCount++;
    const wallLevel = planetSave.buildings.filter(b => b.type === "wall").reduce((sum, b) => sum + b.level, 0);
    const goldReward = BEAST_TIDE_CONFIG.reward.goldBase * (1 + wallLevel * 0.1) * (1 + beastTide.winCount * 0.05);
    planetSave.coins += goldReward;
    globalSave.aenoFragments += 2;

    const aenoRoll = Math.random();
    if (aenoRoll < BEAST_TIDE_CONFIG.reward.aenoChance) {
      globalSave.aeno += 1;
      log(`✨ 獸潮防禦成功！獲得AENO獎勵！`, "ok");
    }

    log(`✅ 獸潮防禦成功！獲得${goldReward}金幣、2個AENO碎片`, "ok");
  } else {
    planetSave.territoryRadius = Math.max(5, planetSave.territoryRadius - 1);
    log(`❌ 獸潮防禦失敗！領土縮小`, "danger");
  }
}

// 科技樹系統（對應策劃大綱）
function unlockTech(techKey) {
  const tech = TECH_TREE[techKey];
  if (!tech || !globalSave) return false;
  const currentLevel = globalSave.techUnlocked[techKey] || 0;
  if (currentLevel >= tech.maxLevel) return false;

  const cost = {};
  for (const [res, base] of Object.entries(tech.baseCost)) {
    cost[res] = Math.floor(base * Math.pow(1.6, currentLevel));
  }

  // 檢查AENO成本
  if (cost.aeno && globalSave.aeno < cost.aeno) return false;
  // 檢查金幣/資源成本
  if (cost.coins && planetSave.coins < cost.coins) return false;
  if (cost.wood && planetSave.wood < cost.wood) return false;
  if (cost.stone && planetSave.stone < cost.stone) return false;
  if (cost.iron && planetSave.iron < cost.iron) return false;
  if (cost.food && planetSave.food < cost.food) return false;

  // 扣除成本
  if (cost.aeno) globalSave.aeno -= cost.aeno;
  if (cost.coins) planetSave.coins -= cost.coins;
  if (cost.wood) planetSave.wood -= cost.wood;
  if (cost.stone) planetSave.stone -= cost.stone;
  if (cost.iron) planetSave.iron -= cost.iron;
  if (cost.food) planetSave.food -= cost.food;

  globalSave.techUnlocked[techKey] = currentLevel + 1;
  log(`✅ 解鎖${tech.name} Lv${currentLevel + 1}！${tech.effect}`, "ok");
  return true;
}

// 廣告歌系統（對應策劃大綱）
function playAdSong(audioUrl) {
  if (adAudio) adAudio.pause();
  adAudio = new Audio(audioUrl);
  adAudio.loop = songLoop;
  adAudio.play().then(() => {
    log(`🎵 正在播放廣告歌，AENO掉落概率已提升`, "ok");
    // 聽歌獎勵定時器
    const listenInterval = setInterval(() => {
      if (adAudio.paused) {
        clearInterval(listenInterval);
        return;
      }
      globalSave.aenoFragments += 1;
      if (Math.random() < 0.01) {
        globalSave.aeno += 1;
        log(`✨ 聽歌獲得AENO！`, "ok");
      }
    }, 60000);
  }).catch(err => {
    log(`❌ 廣告歌播放失敗`, "danger");
  });
}

function toggleSongLoop() {
  songLoop = !songLoop;
  if (adAudio) adAudio.loop = songLoop;
  globalSave.loopSong = songLoop;
  ui.loopState.textContent = songLoop ? "循環：開" : "循環：關";
  log(`🎵 廣告歌循環已${songLoop ? "開啟" : "關閉"}`);
}

// ==================== 【UI渲染與更新】 ====================
function updateUI() {
  if (!planetSave || !globalSave || !ui.planetName) return;
  const currentPlanet = PLANET_LIST.find(p => p.id === planetSave.planetId) || PLANET_LIST[0];

  ui.planetName.textContent = currentPlanet.name;
  ui.gameYear.textContent = `遊戲年份：${planetSave.gameYear.toFixed(1)}年`;
  ui.popCount.textContent = `人口：${planetSave.pop}`;
  ui.coins.textContent = `金幣：${Math.floor(planetSave.coins)}`;
  ui.aeno.textContent = `AENO：${globalSave.aeno}`;
  ui.wood.textContent = `木材：${Math.floor(planetSave.wood)}`;
  ui.stone.textContent = `石頭：${Math.floor(planetSave.stone)}`;
  ui.iron.textContent = `鐵礦：${Math.floor(planetSave.iron)}`;
  ui.food.textContent = `糧食：${Math.floor(planetSave.food)}`;
  ui.factoryCount.textContent = `工廠：${planetSave.buildings.filter(b => b.type === "factory").length}`;
  ui.robotCount.textContent = `機器人：${globalSave.robots.length}`;
  ui.autoState.textContent = autoBuild ? "自動建造：開" : "自動建造：關";
  ui.loopState.textContent = songLoop ? "循環：開" : "循環：關";
}

function renderMap() {
  if (!canvas || !ctx || !planetSave) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cameraX = window.innerWidth / 2 - planetSave.territoryCenter.x * TILE;
  const cameraY = window.innerHeight / 2 - planetSave.territoryCenter.y * TILE;

  // 渲染領土遮罩
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 渲染可見領土
  ctx.save();
  ctx.translate(cameraX, cameraY);
  ctx.beginPath();
  ctx.arc(
    planetSave.territoryCenter.x * TILE + TILE/2,
    planetSave.territoryCenter.y * TILE + TILE/2,
    planetSave.territoryRadius * TILE,
    0, Math.PI * 2
  );
  ctx.clip();

  // 渲染地圖格子
  ctx.fillStyle = "#2d5016";
  ctx.fillRect(0, 0, MAP_W * TILE, MAP_H * TILE);

  // 渲染河流、山脈
  ctx.fillStyle = "#1a535c";
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(i * 8 * TILE, 30 * TILE, TILE * 2, TILE * 20);
  }

  ctx.fillStyle = "#5a5a5a";
  for (let i = 0; i < 15; i++) {
    ctx.fillRect(10 * TILE + i * 4 * TILE, 10 * TILE, TILE * 3, TILE * 3);
  }

  // 渲染建築
  for (const b of planetSave.buildings) {
    const def = BUILD_TYPES[b.type];
    if (!def) continue;
    const x = b.x * TILE;
    const y = b.y * TILE;

    // 建築底色
    ctx.fillStyle = def.type === "resource" ? "#8b4513" : def.type === "economy" ? "#d4af37" : def.type === "defense" ? "#696969" : "#4a4a4a";
    ctx.fillRect(x, y, TILE, TILE);

    // 建築邊框
    ctx.strokeStyle = b.dna?.isMutated ? "#00ff00" : "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, TILE, TILE);

    // 等級文字
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.fillText(`Lv${b.level}`, x + 5, y + 20);
  }

  // 渲染動物
  for (const animal of planetSave.animals) {
    const x = animal.x * TILE;
    const y = animal.y * TILE;
    ctx.fillStyle = animal.dna?.isHostile ? "#ff0000" : "#8b5a2b";
    ctx.beginPath();
    ctx.arc(x + TILE/2, y + TILE/2, TILE/4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ==================== 【遊戲主循環】 ====================
function tick(now) {
  if (!isGameRunning || !isGameStarted) return;
  const deltaMs = now - lastTick;
  const deltaYears = deltaMs / 1000 * GAME_YEARS_PER_REAL_SECOND;
  lastTick = now;

  // 核心邏輯
  if (deltaYears > 0) {
    produceResources(deltaYears);
    planetSave.gameYear += deltaYears;
    AENO_AI.resourceManager.run();
    AENO_AI.repair.checkGameState();
    checkRobotReturn();
    checkBeastTide();
  }

  // 渲染與UI更新
  renderMap();
  updateUI();

  requestAnimationFrame(tick);
}

// ==================== 【UI事件綁定】 ====================
function rebindUIEvents() {
  // 面板控制
  ui.togglePanelBtn?.addEventListener("click", () => {
    ui.panel.style.display = ui.panel.style.display === "none" ? "block" : "none";
  });
  ui.btnHidePanel?.addEventListener("click", () => {
    ui.panel.style.display = "none";
  });

  // 遊戲模式
  ui.btnBuildMode?.addEventListener("click", () => {
    mode = "build";
    log("🔨 已切換到建造模式");
  });
  ui.btnUpgradeMode?.addEventListener("click", () => {
    mode = "upgrade";
    log("⬆️ 已切換到升級模式");
  });

  // 自動建造
  ui.btnAuto?.addEventListener("click", () => {
    autoBuild = !autoBuild;
    globalSave.autoBuild = autoBuild;
    ui.autoState.textContent = autoBuild ? "自動建造：開" : "自動建造：關";
    log(`🤖 自動建造已${autoBuild ? "開啟" : "關閉"}`);
  });

  // 廣告歌
  ui.btnAdSong?.addEventListener("click", () => {
    fetch("./ads.json")
      .then(res => res.json())
      .then(ads => {
        const randomSong = ads.songs[Math.floor(Math.random() * ads.songs.length)];
        playAdSong(randomSong.url);
      })
      .catch(() => {
        playAdSong("");
      });
  });
  ui.btnLoopSong?.addEventListener("click", toggleSongLoop);

  // 機器人
  ui.btnRobotSend?.addEventListener("click", () => {
    const targetId = prompt("請輸入要派遣的星球ID（1-20）：");
    if (targetId && !isNaN(targetId)) {
      sendRobot(parseInt(targetId));
    }
  });

  // 存檔
  ui.btnSave?.addEventListener("click", () => {
    saveGlobal();
    savePlanet();
    log("💾 遊戲已手動存檔", "ok");
  });

  // 科技
  ui.btnTech?.addEventListener("click", () => {
    const techList = Object.keys(TECH_TREE).map((key, i) => `${i+1}. ${TECH_TREE[key].name} - ${TECH_TREE[key].effect}`).join("\n");
    const techKey = prompt(`請輸入要解鎖的科技編號：\n${techList}`);
    if (techKey && !isNaN(techKey)) {
      const keys = Object.keys(TECH_TREE);
      unlockTech(keys[parseInt(techKey)-1]);
    }
  });

  // 交易所
  ui.btnExchange?.addEventListener("click", () => {
    const res = prompt("請輸入要兌換的資源（wood/stone/iron/food）：");
    const amount = prompt("請輸入兌換數量：");
    if (res && amount && !isNaN(amount)) {
      const exchangeRate = { wood: 1, stone: 2, iron: 5, food: 1 };
      const coins = Math.floor(amount * exchangeRate[res]);
      if (planetSave[res] >= amount) {
        planetSave[res] -= amount;
        planetSave.coins += coins;
        log(`✅ 已兌換${amount}${res} → ${coins}金幣`, "ok");
      } else {
        log(`❌ ${res}不足`, "danger");
      }
    }
  });

  // AI助手對話
  ui.sendAssistant?.addEventListener("click", () => {
    const input = ui.assistantInput.value;
    if (input.trim()) {
      AENO_AI.assistant.processCommand(input);
      ui.assistantInput.value = "";
    }
  });
  ui.assistantInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      ui.sendAssistant.click();
    }
  });
  ui.closeChat?.addEventListener("click", () => {
    ui.assistantChatBody.innerHTML = "";
  });

  // 星球選擇
  ui.planetSelect?.addEventListener("change", (e) => {
    const planetId = parseInt(e.target.value);
    if (planetId && planetId !== planetSave?.planetId) {
      if (confirm(`確定要切換到星球${planetId}嗎？當前星球進度會自動存檔`)) {
        savePlanet();
        loadPlanet(planetId, PLANET_LIST.find(p => p.id === planetId).seedType);
        globalSave.currentPlanetId = planetId;
        saveGlobal();
        log(`🌍 已切換到星球${planetId}`, "ok");
      }
    }
  });

  // 畫布點擊事件（建造/升級）
  canvas?.addEventListener("click", (e) => {
    if (!planetSave) return;
    const rect = canvas.getBoundingClientRect();
    const cameraX = window.innerWidth / 2 - planetSave.territoryCenter.x * TILE;
    const cameraY = window.innerHeight / 2 - planetSave.territoryCenter.y * TILE;
    const x = Math.floor((e.clientX - rect.left - cameraX) / TILE);
    const y = Math.floor((e.clientY - rect.top - cameraY) / TILE);

    // 檢查是否在領土內
    const dx = x - planetSave.territoryCenter.x;
    const dy = y - planetSave.territoryCenter.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > planetSave.territoryRadius) {
      if (confirm("是否擴張領土？")) {
        expandTerritory();
      }
      return;
    }

    if (mode === "build") {
      const buildList = Object.keys(BUILD_TYPES).map((key, i) => `${i+1}. ${BUILD_TYPES[key].name}`).join("\n");
      const buildKey = prompt(`請輸入要建造的建築編號：\n${buildList}`);
      if (buildKey && !isNaN(buildKey)) {
        const keys = Object.keys(BUILD_TYPES);
        buildAt(keys[parseInt(buildKey)-1], x, y);
      }
    } else if (mode === "upgrade") {
      upgradeBuildingAt(x, y);
    }
  });
}

// ==================== 【遊戲初始化】 ====================
window.addEventListener("DOMContentLoaded", () => {
  resizeCanvas();
  loadGlobal();
  AENO_AI.init();
  rebindUIEvents();

  // 初始化星球選擇下拉框
  if (ui.planetSelect) {
    ui.planetSelect.innerHTML = PLANET_LIST.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  }

  // 首次遊戲
  if (!globalSave.currentPlanetId) {
    const startPlanet = PLANET_LIST[0];
    loadPlanet(startPlanet.id, startPlanet.seedType);
    globalSave.currentPlanetId = startPlanet.id;
    saveGlobal();
    isGameStarted = true;
    isGameRunning = true;
    log("🌍 歡迎來到AENO！遊戲已開始", "ok");
  } else {
    loadPlanet(globalSave.currentPlanetId, PLANET_LIST.find(p => p.id === globalSave.currentPlanetId).seedType);
    calculateOfflineProgress();
    isGameStarted = true;
    isGameRunning = true;
    log("✅ 遊戲加載完成", "ok");
  }

  // 啟動主循環
  lastTick = performance.now();
  requestAnimationFrame(tick);

  // 自動存檔定時器
  setInterval(() => {
    saveGlobal();
    savePlanet();
  }, 30000);
});

// 頁面關閉前自動存檔
window.addEventListener("beforeunload", () => {
  saveGlobal();
  savePlanet();
});
