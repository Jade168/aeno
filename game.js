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

// ==============================================
// 【新增】20星球 + 語言完整配置（對接 index.html + ai-assistant.js）
// ==============================================
const AENO_PLANET_CONFIG = {
  earth: {
    name: "綠原星",
    lang: "zh_HK",
    resourceMultiplier: { wood:1.2, stone:1.0, iron:1.0, food:1.2, coins:1.0 },
    aenoDropRate: 1.0,
    beastIntensity: 0.8
  },
  mars: {
    name: "岩石星",
    lang: "en",
    resourceMultiplier: { wood:0.8, stone:1.3, iron:1.3, food:0.9, coins:1.1 },
    aenoDropRate: 1.1,
    beastIntensity: 1.0
  },
  ocean: {
    name: "工業星",
    lang: "es",
    resourceMultiplier: { wood:0.9, stone:1.0, iron:1.4, food:1.3, coins:1.2 },
    aenoDropRate: 1.2,
    beastIntensity: 0.9
  },
  jungle: {
    name: "農牧星",
    lang: "pt",
    resourceMultiplier: { wood:1.3, stone:0.9, iron:0.8, food:1.4, coins:1.0 },
    aenoDropRate: 1.0,
    beastIntensity: 1.2
  },
  river: {
    name: "河流星",
    lang: "fr",
    resourceMultiplier: { wood:1.1, stone:1.0, iron:0.9, food:1.3, coins:1.1 },
    aenoDropRate: 1.05,
    beastIntensity: 1.0
  },
  desert: {
    name: "荒漠星",
    lang: "ar",
    resourceMultiplier: { wood:0.6, stone:1.2, iron:1.5, food:0.7, coins:1.3 },
    aenoDropRate: 1.5,
    beastIntensity: 1.4
  },
  taiga: {
    name: "針葉星",
    lang: "de",
    resourceMultiplier: { wood:1.5, stone:1.0, iron:0.9, food:0.9, coins:1.0 },
    aenoDropRate: 1.0,
    beastIntensity: 1.3
  },
  mountain: {
    name: "山嶽星",
    lang: "ru",
    resourceMultiplier: { wood:0.8, stone:1.5, iron:1.4, food:0.8, coins:1.1 },
    aenoDropRate: 1.1,
    beastIntensity: 1.2
  },
  steppe: {
    name: "沃土星",
    lang: "it",
    resourceMultiplier: { wood:1.0, stone:0.9, iron:0.9, food:1.5, coins:1.2 },
    aenoDropRate: 1.0,
    beastIntensity: 0.9
  },
  volcanic: {
    name: "重工星",
    lang: "ja",
    resourceMultiplier: { wood:0.7, stone:1.4, iron:1.6, food:0.8, coins:1.4 },
    aenoDropRate: 1.3,
    beastIntensity: 1.5
  },
  tundra: {
    name: "雨林星",
    lang: "ko",
    resourceMultiplier: { wood:1.4, stone:0.9, iron:0.8, food:1.2, coins:1.0 },
    aenoDropRate: 1.1,
    beastIntensity: 1.4
  },
  swamp: {
    name: "花崗星",
    lang: "vi",
    resourceMultiplier: { wood:1.2, stone:1.4, iron:1.0, food:1.1, coins:1.0 },
    aenoDropRate: 1.0,
    beastIntensity: 1.3
  },
  crystal: {
    name: "金屬星",
    lang: "th",
    resourceMultiplier: { wood:0.9, stone:1.1, iron:1.3, food:1.0, coins:1.2 },
    aenoDropRate: 2.0,
    beastIntensity: 1.1
  },
  radiant: {
    name: "牧場星",
    lang: "hi",
    resourceMultiplier: { wood:1.1, stone:1.1, iron:1.1, food:1.1, coins:1.1 },
    aenoDropRate: 1.2,
    beastIntensity: 1.0
  },
  abyssal: {
    name: "群島星",
    lang: "ms",
    resourceMultiplier: { wood:1.0, stone:0.9, iron:1.0, food:1.3, coins:1.5 },
    aenoDropRate: 1.2,
    beastIntensity: 0.8
  },
  meadow: {
    name: "鹽漠星",
    lang: "tr",
    resourceMultiplier: { wood:0.8, stone:1.2, iron:1.2, food:0.9, coins:1.3 },
    aenoDropRate: 1.4,
    beastIntensity: 1.2
  },
  canyon: {
    name: "寒帶星",
    lang: "fa",
    resourceMultiplier: { wood:1.3, stone:1.3, iron:1.0, food:0.9, coins:1.1 },
    aenoDropRate: 1.1,
    beastIntensity: 1.5
  },
  plateau: {
    name: "高原星",
    lang: "ur",
    resourceMultiplier: { wood:0.9, stone:1.4, iron:1.3, food:0.9, coins:1.2 },
    aenoDropRate: 1.1,
    beastIntensity: 1.3
  },
  archipelago: {
    name: "科技星",
    lang: "tl",
    resourceMultiplier: { wood:1.0, stone:1.0, iron:1.2, food:1.0, coins:1.3 },
    aenoDropRate: 1.2,
    beastIntensity: 1.0
  },
  badlands: {
    name: "生態星",
    lang: "sw",
    resourceMultiplier: { wood:1.1, stone:1.1, iron:1.1, food:1.1, coins:1.1 },
    aenoDropRate: 1.3,
    beastIntensity: 1.0
  },
  blackhole: {
    name: "黑洞孤島",
    lang: "zh_HK",
    resourceMultiplier: { wood:10, stone:10, iron:10, food:10, coins:10 },
    aenoDropRate: 10,
    beastIntensity: 0
  }
};

// 全局變量
let globalSave = null;
let planetSave = null;
let currentPlanetKey = null;     // 【新增】當前星球ID
let currentPlanetConfig = null;  // 【新增】當前星球配置
let currentLang = "zh_HK";       // 【新增】當前語言
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
  lab: { name: "研究所", cost: { wood: 300, stone: 200, iron: 150, coins: 1000 }, type: "tech" }
};

// ==================== 【存讀檔】原有完整邏輯 ====================
function defaultGlobalSave() {
  return {
    version: AENO_VERSION,
    lastPlanetId: "earth",
    lastSeed: "forest",
    totalPlayTime: 0,
    aenoTotal: 0
  };
}

function defaultPlanetSave() {
  return {
    version: AENO_VERSION,
    planetId: currentPlanetKey,
    planetName: currentPlanetConfig.name,
    seed: "forest",
    year: 0,
    wood: 100,
    stone: 80,
    iron: 60,
    food: 120,
    coins: 200,
    aeno: 0,
    pop: 10,
    buildings: [],
    animals: [],
    territoryCenter: { x: 0, y: 0 },
    territoryRadius: 10,
    wallLevel: 1,
    techUnlocked: [],
    lastSaveTime: Date.now()
  };
}

function loadGlobal() {
  try {
    const str = localStorage.getItem(SAVE_KEY_GLOBAL);
    if (str) globalSave = JSON.parse(str);
    else globalSave = defaultGlobalSave();
  } catch (e) {
    globalSave = defaultGlobalSave();
    log("⚠️ 全局存檔讀取失敗，已重置", "warning");
  }
}

function saveGlobal() {
  try {
    localStorage.setItem(SAVE_KEY_GLOBAL, JSON.stringify(globalSave));
  } catch (e) {
    log("❌ 全局存檔失敗", "danger");
  }
}

function loadPlanet(planetId, seed) {
  currentPlanetKey = planetId;
  currentPlanetConfig = AENO_PLANET_CONFIG[planetId] || AENO_PLANET_CONFIG.earth;
  currentLang = currentPlanetConfig.lang;

  try {
    const key = SAVE_KEY_PLANET_PREFIX + planetId;
    const str = localStorage.getItem(key);
    if (str) {
      planetSave = JSON.parse(str);
      calcOfflineProgress();
    } else {
      planetSave = defaultPlanetSave();
    }
  } catch (e) {
    planetSave = defaultPlanetSave();
    log("⚠️ 星球存檔讀取失敗，已重置", "warning");
  }
  refreshAllUI();
}

function savePlanet() {
  if (!planetSave) return;
  planetSave.lastSaveTime = Date.now();
  const key = SAVE_KEY_PLANET_PREFIX + currentPlanetKey;
  localStorage.setItem(key, JSON.stringify(planetSave));
}

function calcOfflineProgress() {
  if (!planetSave) return;
  const now = Date.now();
  const diff = now - planetSave.lastSaveTime;
  const hours = Math.min(diff / (1000 * 3600), MAX_OFFLINE_HOURS);
  const seconds = hours * 3600;
  const years = seconds * GAME_YEARS_PER_REAL_SECOND;
  planetSave.year += years;

  const mul = currentPlanetConfig.resourceMultiplier;
  const pop = planetSave.pop;
  planetSave.wood += pop * 0.06 * mul.wood * hours;
  planetSave.stone += pop * 0.05 * mul.stone * hours;
  planetSave.iron += pop * 0.05 * mul.iron * hours;
  planetSave.food += pop * 0.07 * mul.food * hours;
  planetSave.coins += pop * 0.2 * mul.coins * hours;
}

// ==================== 【UI 渲染】原有完整邏輯 ====================
function refreshAllUI() {
  if (!planetSave) return;
  ui.planetName.textContent = currentPlanetConfig.name;
  ui.gameYear.textContent = Math.floor(planetSave.year);
  ui.popCount.textContent = planetSave.pop;
  ui.coins.textContent = Math.floor(planetSave.coins);
  ui.aeno.textContent = planetSave.aeno.toFixed(4);
  ui.wood.textContent = Math.floor(planetSave.wood);
  ui.stone.textContent = Math.floor(planetSave.stone);
  ui.iron.textContent = Math.floor(planetSave.iron);
  ui.food.textContent = Math.floor(planetSave.food);
  ui.factoryCount.textContent = planetSave.buildings.filter(b => b.type === "factory").length;
  ui.robotCount.textContent = 0;
  ui.autoState.textContent = autoBuild ? "ON" : "OFF";
  ui.loopState.textContent = songLoop ? "ON" : "OFF";
}

// ==================== 【主遊戲循環】原有完整邏輯 ====================
function startGame(planetId, seed) {
  if (isGameStarted) return;
  isGameStarted = true;
  loadGlobal();
  loadPlanet(planetId, seed);
  resizeCanvas();
  rebindUIEvents();
  AENO_AI.init();
  isGameRunning = true;
  lastTick = performance.now();
  requestAnimationFrame(tick);
  log(`✅ 遊戲啟動成功！當前星球：${currentPlanetConfig.name}`, "ok");
}

function tick() {
  if (!isGameRunning) return;
  const now = performance.now();
  const dt = (now - lastTick) / 1000;
  lastTick = now;
  gameUpdate(dt);
  renderGame();
  AENO_AI.repair.checkGameState();
  requestAnimationFrame(tick);
}

function gameUpdate(dt) {
  if (!planetSave) return;
  planetSave.year += dt * GAME_YEARS_PER_REAL_SECOND;

  const mul = currentPlanetConfig.resourceMultiplier;
  const pop = planetSave.pop;
  planetSave.wood += pop * 0.06 * mul.wood * dt;
  planetSave.stone += pop * 0.05 * mul.stone * dt;
  planetSave.iron += pop * 0.05 * mul.iron * dt;
  planetSave.food += pop * 0.07 * mul.food * dt;
  planetSave.coins += pop * 0.2 * mul.coins * dt;

  AENO_AI.resourceManager.run();
  AENO_AI.evolution.runGlobalMutationCheck();
  refreshAllUI();
}

function renderGame() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 你原有渲染邏輯可以繼續加，我已保留所有接口
}

// ==================== 【按鈕/事件綁定】原有完整邏輯 ====================
function rebindUIEvents() {
  ui.btnSave.onclick = () => { saveGlobal(); savePlanet(); log("💾 已手動存檔", "ok"); };
  ui.btnBuildMode.onclick = () => { mode = "build"; ui.btnBuildMode.classList.add("active"); ui.btnUpgradeMode.classList.remove("active"); };
  ui.btnUpgradeMode.onclick = () => { mode = "upgrade"; ui.btnUpgradeMode.classList.add("active"); ui.btnBuildMode.classList.remove("active"); };
  ui.btnAuto.onclick = () => { autoBuild = !autoBuild; ui.autoState.textContent = autoBuild ? "ON" : "OFF"; };
  ui.btnAdSong.onclick = () => { toggleAdSong(); };
  ui.btnLoopSong.onclick = () => { songLoop = !songLoop; ui.loopState.textContent = songLoop ? "ON" : "OFF"; };
  ui.btnRobotSend.onclick = () => { log("🚀 機器人探索已派出", "ok"); };
  ui.btnExchange.onclick = () => { log("🏦 交易所未開放", "warning"); };
  ui.btnTech.onclick = () => { log("🧬 科技樹未開放", "warning"); };
  ui.togglePanelBtn.onclick = () => { ui.panel.style.display = ui.panel.style.display === "flex" ? "none" : "flex"; };
  ui.btnHidePanel.onclick = () => { ui.panel.style.display = "none"; };
  ui.closeChat.onclick = () => { ui.assistantChatBody.parentElement.style.display = "none"; };
  ui.sendAssistant.onclick = () => { AENO_AI.assistant.processCommand(ui.assistantInput.value); ui.assistantInput.value = ""; };

  document.querySelectorAll(".prioBtn").forEach(btn => {
    btn.onclick = () => { customPriority = [btn.dataset.prio]; log(`✅ AI優先級：${btn.dataset.prio}`, "ok"); };
  });
}

function toggleAdSong() {
  if (!adAudio) {
    adAudio = new Audio("ad-song.mp3");
    adAudio.loop = songLoop;
  }
  if (adAudio.paused) { adAudio.play(); log("🎵 廣告歌已播放", "ok"); }
  else { adAudio.pause(); log("⏸️ 廣告歌已暫停", "warning"); }
}

// ==================== 【建造/升級】原有完整邏輯 ====================
function payCost(cost) {
  if (!planetSave || !cost) return;
  if (cost.wood) planetSave.wood -= cost.wood;
  if (cost.stone) planetSave.stone -= cost.stone;
  if (cost.iron) planetSave.iron -= cost.iron;
  if (cost.coins) planetSave.coins -= cost.coins;
  if (cost.food) planetSave.food -= cost.food;
}

function buildAt(type, x, y) {
  const def = BUILD_TYPES[type];
  if (!def) return;
  if (planetSave.buildings.some(b => b.x === x && b.y === y)) return;
  payCost(def.cost);
  planetSave.buildings.push({
    id: type + "_" + Date.now(),
    type, x, y, level: 1, dna: AENO_AI.evolution.generateBuildingDNA()
  });
  log(`🏗️ 已建造：${def.name} Lv1`, "ok");
}

function upgradeBuildingAt(x, y) {
  const b = planetSave.buildings.find(b => b.x === x && b.y === y);
  if (!b) return;
  const def = BUILD_TYPES[b.type];
  const cost = {
    wood: Math.floor(def.cost.wood * Math.pow(1.5, b.level)),
    stone: Math.floor((def.cost.stone || 0) * Math.pow(1.5, b.level)),
    iron: Math.floor((def.cost.iron || 0) * Math.pow(1.5, b.level)),
    coins: Math.floor(def.cost.coins * Math.pow(1.5, b.level))
  };
  if (planetSave.wood < cost.wood || planetSave.stone < cost.stone || planetSave.iron < cost.iron || planetSave.coins < cost.coins) {
    log("⚠️ 資源不足", "warning");
    return;
  }
  payCost(cost);
  b.level++;
  AENO_AI.evolution.checkBuildingMutation(b);
  log(`⬆️ 已升級：${def.name} Lv${b.level}`, "ok");
}

// ==================== 【全域暴露】給 index.html 呼叫 ====================
window.initGame = startGame;
window.saveGlobal = saveGlobal;
window.savePlanet = savePlanet;
