// AENO V4.0 - 核心AI模塊+DNA進化+畫面優化+自動修復最終版
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
      const workerCount = planetSave.workers.length;
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
          .filter(b => b.level < 10)
          .sort((a, b) => {
            const aIdx = priority.indexOf(BUILD_TYPES[a.type].resource ? BUILD_TYPES[a.type].resource : a.type);
            const bIdx = priority.indexOf(BUILD_TYPES[b.type].resource ? BUILD_TYPES[b.type].resource : b.type);
            return aIdx - bIdx;
          });
        for (const b of upgradable) {
          const def = BUILD_TYPES[b.type];
          const lv = b.level;
          const cost = {
            coins: Math.floor((def.cost.coins || 0) * (0.8 + lv * 0.5)),
            wood: Math.floor((def.cost.wood || 0) * (0.7 + lv * 0.35)),
            stone: Math.floor((def.cost.stone || 0) * (0.7 + lv * 0.35)),
            iron: Math.floor((def.cost.iron || 0) * (0.7 + lv * 0.35)),
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
            const tile = this.resourceManager.findEmptyTile();
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
      "修復": () => this.repair.manualRepair(),
      "建造": (type) => {
        const tile = this.resourceManager.findEmptyTile();
        if (tile && BUILD_TYPES[type]) {
          buildAt(type, tile.x, tile.y);
          log(`✅ 已建造${BUILD_TYPES[type].name}`);
        }
      },
      "升級": (type) => {
        const building = planetSave.buildings.find(b => b.type === type && b.level < 10);
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

// 地圖配置
const MAP_W = 80;
const MAP_H = 80;
const TILE = 42;

// 建築配置
const BUILD_TYPES = {
  house: { name: "房屋", cost: { wood: 30, stone: 10, coins: 80 }, baseIncome: 3, pop: 2, type: "economy" },
  lumber: { name: "伐木場", cost: { wood: 10, stone: 5, coins: 60 }, baseIncome: 0, resource: "wood", perLevel: 1.3, type: "resource" },
  quarry: { name: "採石場", cost: { wood: 15, stone: 10, coins: 90 }, baseIncome: 0, resource: "stone", perLevel: 1.0, type: "resource" },
  mine: { name: "礦場", cost: { wood: 20, stone: 15, coins: 110 }, baseIncome: 0, resource: "iron", perLevel: 0.8, type: "resource" },
  farm: { name: "農田", cost: { wood: 20, stone: 5, coins: 70 }, baseIncome: 0, resource: "food", perLevel: 1.6, type: "resource" },
  factory: { name: "工廠", cost: { wood: 80, stone: 60, iron: 40, coins: 350 }, baseIncome: 8, type: "economy" },
  market: { name: "市場", cost: { wood: 50, stone: 30, coins: 200 }, baseIncome: 5, type: "economy" },
  wall: { name: "城牆", cost: { stone: 80, coins: 200 }, baseIncome: 0, type: "defense" }
};

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
      { id: "b_house_1", type: "house", x: 40, y: 40, level: 1, dna: AENO_AI.evolution.generateBuildingDNA() },
      { id: "b_house_2", type: "house", x: 41, y: 40, level: 1, dna: AENO_AI.evolution.generateBuildingDNA() },
      { id: "b_lumber_1", type: "lumber", x: 39, y: 41, level: 1, dna: AENO_AI.evolution.generateBuildingDNA() },
      { id: "b_quarry_1", type: "quarry", x: 42, y: 41, level: 1, dna: AENO_AI.evolution.generateBuildingDNA() },
    ],
    workers: [],
    animals: [],
    robots: [],
    map: null,
    beast: { level: 1, lastAttackYear: 0, lootUnclaimed: 0 },
    lastSeen: Date.now(),
    cameraX: 0,
    cameraY: 0,
    zoom: 1.1,
  };
}

// 存檔讀寫
function saveGlobal() {
  if (!globalSave) return;
  globalSave.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY_GLOBAL, JSON.stringify(globalSave));
}
function savePlanet() {
  if (!planetSave) return;
  planetSave.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY_PLANET_PREFIX + planetSave.planetId, JSON.stringify(planetSave));
}
function saveAll() {
  saveGlobal();
  savePlanet();
  log("✅ 已保存遊戲進度", "ok");
}
function loadGlobal() {
  const raw = localStorage.getItem(SAVE_KEY_GLOBAL);
  if (!raw) {
    globalSave = defaultGlobalSave();
    saveGlobal();
    return;
  }
  globalSave = JSON.parse(raw);
  autoBuild = globalSave.autoBuild ?? true;
  songLoop = globalSave.loopSong ?? true;
  if (ui.autoState) ui.autoState.textContent = autoBuild ? "ON" : "OFF";
  if (ui.loopState) ui.loopState.textContent = songLoop ? "ON" : "OFF";
}
function loadPlanet(planetId, seedType) {
  const raw = localStorage.getItem(SAVE_KEY_PLANET_PREFIX + planetId);
  if (!raw) {
    planetSave = defaultPlanetSave(planetId, seedType);
    initPlanetUnits();
    initPlanetMap();
    savePlanet();
    return;
  }
  planetSave = JSON.parse(raw);
  if (!planetSave.workers) planetSave.workers = [];
  if (!planetSave.animals) planetSave.animals = [];
  if (!planetSave.buildings) planetSave.buildings = [];
  // 給舊建築補DNA
  planetSave.buildings.forEach(b => {
    if (!b.dna) b.dna = AENO_AI.evolution.generateBuildingDNA();
  });
  if (!planetSave.map) initPlanetMap();
  if (planetSave.workers.length === 0) initPlanetUnits();
}

// 星球初始化
function initPlanetUnits() {
  planetSave.workers = [];
  for (let i = 0; i < 4; i++) {
    planetSave.workers.push({
      id: "w" + i,
      x: planetSave.territoryCenter.x + (i % 2),
      y: planetSave.territoryCenter.y + Math.floor(i / 2),
    });
  }
  planetSave.animals = [];
  for (let i = 0; i < 15; i++) {
    planetSave.animals.push({
      id: "a" + i,
      x: Math.floor(Math.random() * MAP_W),
      y: Math.floor(Math.random() * MAP_H),
      t: 0,
      dna: AENO_AI.evolution.generateAnimalDNA(),
    });
  }
}
function initPlanetMap() {
  const seed = hashStringToSeed(planetSave.planetId + "_" + planetSave.seedType);
  const rng = mulberry32(seed);
  const tiles = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const n = rng();
      let type = "grass";
      if (planetSave.seedType === "blackhole") {
        if (n < 0.02) type = "water";
        else if (n < 0.20) type = "mountain";
        else if (n < 0.35) type = "forest";
        else if (n < 0.50) type = "stone";
        else if (n < 0.62) type = "iron";
        else type = "grass";
      } else {
        if (planetSave.seedType === "forest" && n < 0.45) type = "forest";
        else if (planetSave.seedType === "rock" && n < 0.4) type = "stone";
        else if (planetSave.seedType === "iron" && n < 0.35) type = "iron";
        else if (planetSave.seedType === "farm" && n < 0.4) type = "grass";
        else {
          if (n < 0.07) type = "water";
          else if (n < 0.14) type = "mountain";
          else if (n < 0.30) type = "forest";
          else if (n < 0.38) type = "stone";
          else if (n < 0.46) type = "iron";
        }
      }
      tiles.push({ x, y, type });
    }
  }
  const cx = planetSave.territoryCenter.x;
  const cy = planetSave.territoryCenter.y;
  function setTile(x, y, type) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
    tiles[y * MAP_W + x].type = type;
  }
  setTile(cx + 2, cy, "forest");
  setTile(cx - 2, cy, "forest");
  setTile(cx, cy + 2, "stone");
  setTile(cx, cy - 2, "iron");
  planetSave.map = { tiles };
}

// 領土判斷
function isInTerritory(x, y) {
  return true;
}

// 資源判斷
function canPay(cost) {
  if (!planetSave) return false;
  if (cost.coins && planetSave.coins < cost.coins) return false;
  if (cost.wood && planetSave.wood < cost.wood) return false;
  if (cost.stone && planetSave.stone < cost.stone) return false;
  if (cost.iron && planetSave.iron < cost.iron) return false;
  if (cost.food && planetSave.food < cost.food) return false;
  return true;
}
function payCost(cost) {
  if (cost.coins) planetSave.coins -= cost.coins;
  if (cost.wood) planetSave.wood -= cost.wood;
  if (cost.stone) planetSave.stone -= cost.stone;
  if (cost.iron) planetSave.iron -= cost.iron;
  if (cost.food) planetSave.food -= cost.food;
}

// 手動建造/升級
function buildAt(type, x, y) {
  if (!isInTerritory(x, y)) {
    log("❌ 非領土範圍，不能建築", "danger");
    return false;
  }
  const def = BUILD_TYPES[type];
  if (!def) return false;
  if (!canPay(def.cost)) {
    log("❌ 資源不足", "danger");
    return false;
  }
  if (planetSave.buildings.some(b => b.x === x && b.y === y)) {
    log("❌ 此格已有建築", "danger");
    return false;
  }
  payCost(def.cost);
  planetSave.buildings.push({
    id: "b_" + type + "_" + Date.now(),
    type,
    x,
    y,
    level: 1,
    dna: AENO_AI.evolution.generateBuildingDNA(),
  });
  log(`🏗️ 建成 ${def.name} Lv1`, "ok");
  return true;
}
function upgradeBuildingAt(x, y) {
  const b = planetSave.buildings.find(bb => bb.x === x && bb.y === y);
  if (!b) {
    log("❌ 沒有建築可以升級", "danger");
    return false;
  }
  if (b.level >= 10) {
    log("ℹ️ 已達最高等級 Lv10");
    return false;
  }
  const def = BUILD_TYPES[b.type];
  const lv = b.level;
  const cost = {
    coins: Math.floor((def.cost.coins || 0) * (0.8 + lv * 0.5) * (1 - (b.dna?.costReduction || 0))),
    wood: Math.floor((def.cost.wood || 0) * (0.7 + lv * 0.35) * (1 - (b.dna?.costReduction || 0))),
    stone: Math.floor((def.cost.stone || 0) * (0.7 + lv * 0.35) * (1 - (b.dna?.costReduction || 0))),
    iron: Math.floor((def.cost.iron || 0) * (0.7 + lv * 0.35) * (1 - (b.dna?.costReduction || 0))),
  };
  if (!canPay(cost)) {
    log("❌ 升級資源不足", "danger");
    return false;
  }
  payCost(cost);
  b.level++;
  // DNA突變檢測
  AENO_AI.evolution.checkBuildingMutation(b);
  log(`⬆️ ${def.name} 升級到 Lv${b.level}`, "ok");
  return true;
}

// 資源計算
function calcIncomePerSecond() {
  if (!planetSave) return 0;
  let income = 0;
  for (const b of planetSave.buildings) {
    const def = BUILD_TYPES[b.type];
    if (!def) continue;
    const lv = b.level || 1;
    const boost = 1 + (b.dna?.outputBoost || 0);
    income += (def.baseIncome || 0) * (1 + (lv - 1) * 0.6) * boost;
  }
  income += planetSave.pop * 0.08;
  return income;
}
function produceResources(dt) {
  if (!planetSave) return;
  let woodGain = 0, stoneGain = 0, ironGain = 0, foodGain = 0;
  for (const b of planetSave.buildings) {
    const def = BUILD_TYPES[b.type];
    if (!def || def.type !== "resource") continue;
    const lv = b.level || 1;
    const boost = 1 + (b.dna?.outputBoost || 0);
    if (def.resource === "wood") woodGain += def.perLevel * lv * dt * boost;
    if (def.resource === "stone") stoneGain += def.perLevel * lv * dt * boost;
    if (def.resource === "iron") ironGain += def.perLevel * lv * dt * boost;
    if (def.resource === "food") foodGain += def.perLevel * lv * dt * boost;
  }
  const workerCount = planetSave.workers.length;
  woodGain += workerCount * 0.06 * dt;
  stoneGain += workerCount * 0.05 * dt;
  ironGain += workerCount * 0.05 * dt;
  foodGain += workerCount * 0.07 * dt;
  planetSave.wood += Math.floor(woodGain);
  planetSave.stone += Math.floor(stoneGain);
  planetSave.iron += Math.floor(ironGain);
  planetSave.food += Math.floor(foodGain);
}
function applyOfflineProgress() {
  if (!planetSave) return;
  const now = Date.now();
  const last = planetSave.lastSeen || now;
  let diff = (now - last) / 1000;
  if (diff < 0) diff = 0;
  const max = MAX_OFFLINE_HOURS * 3600;
  const used = Math.min(diff, max);
  if (used < 5) return;
  planetSave.gameYear += GAME_YEARS_PER_REAL_SECOND * used;
  planetSave.coins += calcIncomePerSecond() * used;
  produceResources(used);
  log(`🕒 離線補算 ${Math.floor(used / 3600)} 小時（上限24h）`);
}

// 相機控制
let cameraX = 0;
let cameraY = 0;
let zoomLevel = 1.1;
let dragging = false;
let dragStart = { x: 0, y: 0 };
let camStart = { x: 0, y: 0 };

function loadCamera() {
  if (!planetSave) return;
  cameraX = planetSave.cameraX || 0;
  cameraY = planetSave.cameraY || 0;
  zoomLevel = planetSave.zoom || 1.1;
}
function saveCamera() {
  if (!planetSave) return;
  planetSave.cameraX = cameraX;
  planetSave.cameraY = cameraY;
  planetSave.zoom = zoomLevel;
}

// 畫布事件綁定
if (canvas) {
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    camStart.x = cameraX;
    camStart.y = cameraY;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    cameraX = camStart.x + (e.clientX - dragStart.x);
    cameraY = camStart.y + (e.clientY - dragStart.y);
  });
  canvas.addEventListener("pointerup", () => dragging = false);
  canvas.addEventListener("pointercancel", () => dragging = false);

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    zoomLevel += -delta * 0.15;
    zoomLevel = Math.max(0.3, Math.min(3.0, zoomLevel));
  }, { passive: false });

  canvas.addEventListener("click", (e) => {
    e.preventDefault();
    if (!isGameStarted) return;
    const tile = screenToTile(e.clientX, e.clientY);
    if (!tile) return;
    if (mode === "build") {
      buildAt("house", tile.x, tile.y);
      saveAll();
    } else {
      upgradeBuildingAt(tile.x, tile.y);
      saveAll();
    }
  });
  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (!isGameStarted) return;
    const touch = e.changedTou
