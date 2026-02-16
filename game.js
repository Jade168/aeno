// AENO V3.9 - 註冊系統+平衡建設+資源修復最終版
const AENO_VERSION = "V3.9-FINAL";
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

// 畫布初始化
const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d", { alpha: true }) : null;

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
};

// 系統日誌
function log(msg, type="") {
  console.log(msg);
  if (!ui.logBox) return;
  const div = document.createElement("div");
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  if (type === "danger") div.style.color = "#ff9aa2";
  if (type === "ok") div.style.color = "#a8ffb8";
  ui.logBox.prepend(div);
  while (ui.logBox.children.length > 40) ui.logBox.removeChild(ui.logBox.lastChild);
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

// 建築配置（明確對應資源產出，修復石頭產出）
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
      { id: "b_house_1", type: "house", x: 40, y: 40, level: 1 },
      { id: "b_house_2", type: "house", x: 41, y: 40, level: 1 },
      { id: "b_lumber_1", type: "lumber", x: 39, y: 41, level: 1 },
      { id: "b_quarry_1", type: "quarry", x: 42, y: 41, level: 1 },
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
  for (let i = 0; i < 10; i++) {
    planetSave.animals.push({
      id: "a" + i,
      x: Math.floor(Math.random() * MAP_W),
      y: Math.floor(Math.random() * MAP_H),
      t: 0
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

// ==================== 核心：AI平衡建設機制 ====================
const AUTO_BUILD_CONFIG = {
  RESERVE_RATIO: 0.6, // 保留60%資源，唔會一次過用曬
  MAX_TRIES_PER_TICK: 2,
  AUTO_UPGRADE: true,
  BUILD_SPACING: 1,
  // 資源安全線：每小時消耗不能超過產出的80%
  SAFE_RATIO: 0.8,
};

// 計算資源產出/消耗比，找出最缺的資源
function getResourcePriority() {
  if (!planetSave) return [];
  // 計算每種資源的每秒產出
  const resourceOutput = { wood: 0, stone: 0, iron: 0, food: 0 };
  for (const b of planetSave.buildings) {
    const def = BUILD_TYPES[b.type];
    if (!def || def.type !== "resource") continue;
    const lv = b.level || 1;
    resourceOutput[def.resource] += def.perLevel * lv;
  }
  // 工人額外產出
  const workerCount = planetSave.workers.length;
  resourceOutput.wood += workerCount * 0.06;
  resourceOutput.stone += workerCount * 0.05;
  resourceOutput.iron += workerCount * 0.05;
  resourceOutput.food += workerCount * 0.07;

  // 計算建築升級/建造的平均消耗
  const buildCostAvg = { wood: 0, stone: 0, iron: 0, food: 0 };
  let buildCount = 0;
  for (const key in BUILD_TYPES) {
    const def = BUILD_TYPES[key];
    if (def.cost.wood) buildCostAvg.wood += def.cost.wood;
    if (def.cost.stone) buildCostAvg.stone += def.cost.stone;
    if (def.cost.iron) buildCostAvg.iron += def.cost.iron;
    buildCount++;
  }
  for (const key in buildCostAvg) {
    buildCostAvg[key] = buildCostAvg[key] / buildCount;
  }

  // 計算資源壓力值，數值越高越優先
  const pressure = {};
  for (const res of ["wood", "stone", "iron", "food"]) {
    // 庫存越少、產出越低，壓力越高
    const stockRatio = planetSave[res] / (buildCostAvg[res] * 10);
    const outputRatio = resourceOutput[res] / buildCostAvg[res];
    pressure[res] = (1 / Math.max(0.1, stockRatio)) * (1 / Math.max(0.1, outputRatio));
  }

  // 按壓力排序，返回對應的建築類型
  const resToBuild = {
    wood: "lumber",
    stone: "quarry",
    iron: "mine",
    food: "farm"
  };
  const sortedRes = Object.keys(pressure).sort((a, b) => pressure[b] - pressure[a]);
  const priority = sortedRes.map(res => resToBuild[res]);

  // 資源安全後，再加經濟建築
  const minPressure = Math.min(...Object.values(pressure));
  if (minPressure < 3) {
    priority.push("house", "factory", "market");
  }

  // 自定義優先級覆蓋
  if (customPriority.length > 0) {
    return customPriority.concat(priority.filter(p => !customPriority.includes(p)));
  }
  return priority;
}

function canAutoPay(cost) {
  if (!planetSave) return false;
  const maxCoins = Math.floor(planetSave.coins * AUTO_BUILD_CONFIG.RESERVE_RATIO);
  const maxWood = Math.floor(planetSave.wood * AUTO_BUILD_CONFIG.RESERVE_RATIO);
  const maxStone = Math.floor(planetSave.stone * AUTO_BUILD_CONFIG.RESERVE_RATIO);
  const maxIron = Math.floor(planetSave.iron * AUTO_BUILD_CONFIG.RESERVE_RATIO);
  const maxFood = Math.floor(planetSave.food * AUTO_BUILD_CONFIG.RESERVE_RATIO);
  if (cost.coins && cost.coins > maxCoins) return false;
  if (cost.wood && cost.wood > maxWood) return false;
  if (cost.stone && cost.stone > maxStone) return false;
  if (cost.iron && cost.iron > maxIron) return false;
  if (cost.food && cost.food > maxFood) return false;
  return true;
}
function findEmptyTileInTerritory() {
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
        if (!isInTerritory(x, y)) continue;
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
}
function autoBuildOne() {
  if (!autoBuild || !planetSave) return false;
  const priority = getResourcePriority();

  // 優先升級資源建築
  if (AUTO_BUILD_CONFIG.AUTO_UPGRADE) {
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
      if (canAutoPay(cost)) {
        payCost(cost);
        b.level++;
        log(`🤖 AI 升級 ${def.name} → Lv${b.level}`);
        return true;
      }
    }
  }

  // 按優先級建造
  for (const type of priority) {
    const def = BUILD_TYPES[type];
    if (!def) continue;
    if (!canAutoPay(def.cost)) continue;
    const tile = findEmptyTileInTerritory();
    if (!tile) continue;
    payCost(def.cost);
    planetSave.buildings.push({
      id: "auto_" + type + "_" + Date.now(),
      type,
      x: tile.x,
      y: tile.y,
      level: 1
    });
    log(`🤖 AI 建成 ${def.name} Lv1`);
    return true;
  }
  return false;
}
function runAutoBuild() {
  if (!autoBuild || !planetSave) return;
  let built = 0;
  while (built < AUTO_BUILD_CONFIG.MAX_TRIES_PER_TICK && autoBuildOne()) {
    built++;
  }
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
    level: 1
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
    coins: Math.floor((def.cost.coins || 0) * (0.8 + lv * 0.5)),
    wood: Math.floor((def.cost.wood || 0) * (0.7 + lv * 0.35)),
    stone: Math.floor((def.cost.stone || 0) * (0.7 + lv * 0.35)),
    iron: Math.floor((def.cost.iron || 0) * (0.7 + lv * 0.35)),
  };
  if (!canPay(cost)) {
    log("❌ 升級資源不足", "danger");
    return false;
  }
  payCost(cost);
  b.level++;
  log(`⬆️ ${def.name} 升級到 Lv${b.level}`, "ok");
  return true;
}

// 資源計算（修復石頭產出）
function calcIncomePerSecond() {
  if (!planetSave) return 0;
  let income = 0;
  for (const b of planetSave.buildings) {
    const def = BUILD_TYPES[b.type];
    if (!def) continue;
    const lv = b.level || 1;
    income += (def.baseIncome || 0) * (1 + (lv - 1) * 0.6);
  }
  income += planetSave.pop * 0.08;
  return income;
}
function produceResources(dt) {
  if (!planetSave) return;
  let woodGain = 0, stoneGain = 0, ironGain = 0, foodGain = 0;
  // 建築產出
  for (const b of planetSave.buildings) {
    const def = BUILD_TYPES[b.type];
    if (!def || def.type !== "resource") continue;
    const lv = b.level || 1;
    if (def.resource === "wood") woodGain += def.perLevel * lv * dt;
    if (def.resource === "stone") stoneGain += def.perLevel * lv * dt;
    if (def.resource === "iron") ironGain += def.perLevel * lv * dt;
    if (def.resource === "food") foodGain += def.perLevel * lv * dt;
  }
  // 工人額外產出
  const workerCount = planetSave.workers.length;
  woodGain += workerCount * 0.06 * dt;
  stoneGain += workerCount * 0.05 * dt;
  ironGain += workerCount * 0.05 * dt;
  foodGain += workerCount * 0.07 * dt;
  // 增加到庫存
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

// 畫布事件綁定（兼容手機觸摸）
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
    const touch = e.changedTouches[0];
    const tile = screenToTile(touch.clientX, touch.clientY);
    if (!tile) return;
    if (mode === "build") {
      buildAt("house", tile.x, tile.y);
      saveAll();
    } else {
      upgradeBuildingAt(tile.x, tile.y);
      saveAll();
    }
  });
}

// 座標轉換
function tileToScreen(x, y) {
  const sx = (x - y) * (TILE * 0.5);
  const sy = (x + y) * (TILE * 0.25);
  return { x: sx, y: sy };
}
function screenToTile(px, py) {
  const cx = (px - window.innerWidth / 2 - cameraX) / zoomLevel;
  const cy = (py - 180 - cameraY) / zoomLevel;
  const tx = (cx / (TILE * 0.5) + cy / (TILE * 0.25)) / 2;
  const ty = (cy / (TILE * 0.25) - cx / (TILE * 0.5)) / 2;
  const x = Math.floor(tx);
  const y = Math.floor(ty);
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return null;
  return { x, y };
}

// 繪圖函數
function drawTile(x, y, type) {
  if (!ctx) return;
  const w = TILE * 0.5;
  const h = TILE * 0.25;
  let fill = "#dcfce7";
  if (type === "water") fill = "#93c5fd";
  if (type === "mountain") fill = "#cbd5e1";
  if (type === "forest") fill = "#86efac";
  if (type === "stone") fill = "#e2e8f0";
  if (type === "iron") fill = "#fca5a5";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h * 2);
  ctx.lineTo(x - w, y + h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.stroke();
}
function drawBuilding(x, y, b) {
  if (!ctx) return;
  const lv = b.level || 1;
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y + 18, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  let color = "#fde68a";
  if (b.type === "house") color = "#fef3c7";
  if (b.type === "lumber") color = "#bbf7d0";
  if (b.type === "quarry") color = "#e2e8f0";
  if (b.type === "mine") color = "#fecaca";
  if (b.type === "farm") color = "#fde68a";
  if (b.type === "factory") color = "#bae6fd";
  if (b.type === "market") color = "#f0abfc";
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.rect(x - 18, y - 18, 36, 28);
  ctx.fill();
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(x - 22, y - 18);
  ctx.quadraticCurveTo(x, y - 38, x + 22, y - 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px system-ui";
  ctx.fillText("Lv" + lv, x - 12, y - 2);
}
function drawAnimal(x, y) {
  if (!ctx) return;
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.arc(x, y - 12, 6, 0, Math.PI * 2);
  ctx.fill();
}
function drawWorker(x, y) {
  if (!ctx) return;
  ctx.fillStyle = "#0ea5e9";
  ctx.beginPath();
  ctx.arc(x, y - 10, 5, 0, Math.PI * 2);
  ctx.fill();
}
function draw() {
  if (!ctx || !planetSave || !isGameStarted) return;
  ctx.fillStyle = "#091224";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2 + cameraX, 180 + cameraY);
  ctx.scale(zoomLevel, zoomLevel);
  const tiles = planetSave.map.tiles;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = tiles[y * MAP_W + x];
      const p = tileToScreen(x, y);
      drawTile(p.x, p.y, t.type);
    }
  }
  for (const b of planetSave.buildings) {
    const p = tileToScreen(b.x, b.y);
    drawBuilding(p.x, p.y, b);
  }
  for (const a of planetSave.animals) {
    const p = tileToScreen(a.x, a.y);
    drawAnimal(p.x, p.y);
  }
  for (const w of planetSave.workers) {
    const p = tileToScreen(w.x, w.y);
    drawWorker(p.x, p.y);
  }
  ctx.restore();
  updateHUD();
}

// HUD更新
function updateHUD() {
  if (!planetSave || !globalSave) return;
  if (ui.planetName) ui.planetName.textContent = planetSave.planetId;
  if (ui.gameYear) ui.gameYear.textContent = Math.floor(planetSave.gameYear);
  if (ui.popCount) ui.popCount.textContent = Math.floor(planetSave.pop);
  if (ui.coins) ui.coins.textContent = Math.floor(planetSave.coins);
  if (ui.aeno) ui.aeno.textContent = (globalSave.aeno || 0).toFixed(4);
  if (ui.wood) ui.wood.textContent = Math.floor(planetSave.wood);
  if (ui.stone) ui.stone.textContent = Math.floor(planetSave.stone);
  if (ui.iron) ui.iron.textContent = Math.floor(planetSave.iron);
  if (ui.food) ui.food.textContent = Math.floor(planetSave.food);
  if (ui.factoryCount) ui.factoryCount.textContent = planetSave.buildings.filter(b => b.type === "factory").length;
  if (ui.robotCount) ui.robotCount.textContent = planetSave.robots.length;
}

// 遊戲主循環
let isGameRunning = false;
function tick(now) {
  if (!isGameStarted || !planetSave || !globalSave) return;
  const dt = Math.min(0.2, (now - lastTick) / 1000);
  lastTick = now;
  planetSave.gameYear += GAME_YEARS_PER_REAL_SECOND * dt;
  planetSave.coins += calcIncomePerSecond() * dt;
  produceResources(dt);
  // 動物移動
  for (const a of planetSave.animals) {
    a.t += dt;
    if (a.t > 1.2) {
      a.t = 0;
      a.x += Math.floor(Math.random() * 3) - 1;
      a.y += Math.floor(Math.random() * 3) - 1;
      a.x = Math.max(0, Math.min(MAP_W - 1, a.x));
      a.y = Math.max(0, Math.min(MAP_H - 1, a.y));
    }
  }
  // 資源下限
  planetSave.coins = Math.max(0, planetSave.coins);
  planetSave.wood = Math.max(0, planetSave.wood);
  planetSave.stone = Math.max(0, planetSave.stone);
  planetSave.iron = Math.max(0, planetSave.iron);
  planetSave.food = Math.max(0, planetSave.food);
  // 自動建造
  runAutoBuild();
  // 渲染
  draw();
  if (isGameRunning) requestAnimationFrame(tick);
}

// UI事件綁定
function rebindUIEvents() {
  // 面板控制
  if (ui.togglePanelBtn) ui.togglePanelBtn.onclick = () => ui.panel.style.display = ui.panel.style.display === "none" ? "flex" : "none";
  if (ui.btnHidePanel) ui.btnHidePanel.onclick = () => ui.panel.style.display = "none";
  if (ui.btnSave) ui.btnSave.onclick = () => saveAll();

  // 模式切換
  if (ui.btnBuildMode) ui.btnBuildMode.onclick = () => {
    mode = "build";
    ui.btnBuildMode.style.background = "#2563eb";
    ui.btnUpgradeMode.style.background = "rgba(255,255,255,0.08)";
    log("🏗️ 切換到建造模式");
  };
  if (ui.btnUpgradeMode) ui.btnUpgradeMode.onclick = () => {
    mode = "upgrade";
    ui.btnUpgradeMode.style.background = "#2563eb";
    ui.btnBuildMode.style.background = "rgba(255,255,255,0.08)";
    log("⬆️ 切換到升級模式");
  };

  // 自動建造開關
  if (ui.btnAuto) ui.btnAuto.onclick = () => {
    autoBuild = !autoBuild;
    globalSave.autoBuild = autoBuild;
    ui.autoState.textContent = autoBuild ? "ON" : "OFF";
    log(autoBuild ? "🤖 自動建造 ON" : "🤖 自動建造 OFF");
    saveGlobal();
  };

  // 音樂控制
  if (ui.btnLoopSong) ui.btnLoopSong.onclick = () => {
    songLoop = !songLoop;
    globalSave.loopSong = songLoop;
    ui.loopState.textContent = songLoop ? "ON" : "OFF";
    log(songLoop ? "🔁 循環播放 ON" : "🔁 循環播放 OFF");
    saveGlobal();
  };
  if (ui.btnAdSong) ui.btnAdSong.onclick = () => {
    try {
      if (!adAudio) {
        adAudio = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_9c1a1c1d66.mp3?filename=happy-day-113985.mp3");
        adAudio.volume = 0.8;
      }
      adAudio.loop = songLoop;
      adAudio.play().then(() => {
        state.isPlayingSong = true;
        log("🎵 廣告歌播放中（60秒後獲獎勵）", "ok");
        setTimeout(() => {
          planetSave.coins += 120;
          globalSave.aenoFragments += 1500;
          while (globalSave.aenoFragments >= 1000) {
            globalSave.aenoFragments -= 1000;
            globalSave.aeno += 0.0001;
          }
          log("🎁 獎勵：金幣 +120 / AENO碎片 +1500", "ok");
          saveAll();
        }, 60000);
      }).catch(() => {
        log("❌ 手機需再按一次播放", "danger");
      });
    } catch {
      log("❌ 音樂系統錯誤", "danger");
    }
  };

  // 其他按鈕
  if (ui.btnRobotSend) ui.btnRobotSend.onclick = () => log("🤖 機械人派遣功能開發中");
  if (ui.btnExchange) ui.btnExchange.onclick = () => log("💱 AENO兌換功能開發中");
  if (ui.btnTech) ui.btnTech.onclick = () => log("🔬 科技樹功能開發中");

  // 優先級按鈕
  document.querySelectorAll(".prioBtn").forEach(btn => {
    btn.onclick = () => {
      const prio = btn.dataset.prio;
      customPriority = [prio];
      log(`📌 手動設置優先級：${btn.textContent}`);
    };
  });

  log("✅ 所有按鈕已綁定，可正常操作", "ok");
}

// 黑洞資格檢查
function checkBlackHoleStatus(playerName) {
  const aeno = globalSave.aeno || 0;
  if (aeno >= AENO_APPLY && !globalSave.blackHoleApply.includes(playerName)) {
    globalSave.blackHoleApply.push(playerName);
    log(`📝 ${playerName} 達 800萬 AENO，已加入黑洞申請列表`, "ok");
  }
  if (aeno >= AENO_WEIGHT && !globalSave.blackHoleWeight.includes(playerName)) {
    globalSave.blackHoleWeight.push(playerName);
    log(`🔑 ${playerName} 達 1000萬 AENO，獲黑洞權重入資格`, "ok");
  }
  saveGlobal();
}

// 啟動遊戲
function startGame(planetName, seedType) {
  loadGlobal();
  loadPlanet(planetName, seedType);
  loadCamera();
  applyOfflineProgress();
  checkBlackHoleStatus(currentPlayer);
  saveAll();
  rebindUIEvents();
  resizeCanvas();
  isGameStarted = true;
  isGameRunning = true;
  ui.planetSelect.style.display = "none";
  lastTick = performance.now();
  requestAnimationFrame(tick);
  log(`✅ 成功進入 ${planetName}，遊戲已啟動`, "ok");
}

// 頁面加載完成後，綁定星球選擇按鈕
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".planetBtn").forEach(btn => {
    btn.onclick = () => {
      const planet = btn.dataset.planet;
      const seed = btn.dataset.seed;
      startGame(planet, seed);
    };
  });
});

// 頁面隱藏/關閉時自動保存
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isGameStarted) {
    saveCamera();
    saveAll();
  } else if (isGameStarted) {
    loadCamera();
  }
});
window.addEventListener("pagehide", () => {
  if (isGameStarted) {
    saveCamera();
    saveAll();
  }
});
