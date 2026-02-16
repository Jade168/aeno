// AENO V3.5 - 终极修复：登录强制密码校验 + 按钮自动绑定 + 游戏正常启动
const AENO_VERSION = "V3.5-FIXED";
const SAVE_KEY_GLOBAL = "AENO_GLOBAL_SAVE";
const SAVE_KEY_PLANET_PREFIX = "AENO_PLANET_SAVE_";
const CAMERA_KEY = "AENO_CAMERA_STATE_V3";
const MAX_OFFLINE_HOURS = 24;
const GAME_YEARS_PER_REAL_SECOND = (10 / (24 * 3600));

// 阿罗币规则：800万申请、1000万权重入
const AENO_APPLY = 8000000;
const AENO_WEIGHT = 10000000;

// 全局变量
let globalSave = null;
let planetSave = null;
let isGameStarted = false;
let lastTick = performance.now();
let mode = "build";
let adAudio = null;

// 画布初始化
const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d", { alpha: true }) : null;

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
}
window.addEventListener("resize", resizeCanvas);

// UI元素获取
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
  sysLog: document.getElementById("sysLog"),

  btnSave: document.getElementById("btnSave"),
  btnBuildMode: document.getElementById("btnBuildMode"),
  btnUpgradeMode: document.getElementById("btnUpgradeMode"),
  btnAuto: document.getElementById("btnAuto"),
  autoState: document.getElementById("autoState"),
  btnAdSong: document.getElementById("btnAdSong"),
  btnLoopSong: document.getElementById("btnLoopSong"),
  loopState: document.getElementById("loopState"),
  btnRobotSend: document.getElementById("btnRobotSend"),
  btnExchange: document.getElementById("btnExchange"),
  btnTech: document.getElementById("btnTech"),
};

// 系统日志
function logSys(msg) {
  console.log(msg);
  if (!ui.sysLog) return;
  const t = new Date().toLocaleTimeString();
  ui.sysLog.innerHTML = `<div>[${t}] ${msg}</div>` + ui.sysLog.innerHTML;
}

// 随机数工具
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

// 星球生成
const PLANET_COUNT = 20;
const BLACK_HOLE_ID = "black_hole_island";
function generatePlanets() {
  const arr = [];
  for (let i = 1; i <= PLANET_COUNT; i++) {
    arr.push({
      id: "planet_" + i,
      name: "島嶼 " + i,
      seed: hashStringToSeed("AENO_PLANET_" + i),
    });
  }
  arr.push({
    id: BLACK_HOLE_ID,
    name: "黑洞 · 孤島（開發者專屬）",
    seed: hashStringToSeed("AENO_BLACKHOLE"),
    isDev: true
  });
  return arr;
}
const planets = generatePlanets();

// 地图配置
const MAP_W = 80;
const MAP_H = 80;
const TILE = 42;

// 默认存档
function defaultGlobalSave() {
  return {
    version: AENO_VERSION,
    createdAt: Date.now(),
    lastSeen: Date.now(),
    currentPlanetId: "planet_1",
    aeno: 0,
    aenoFragments: 0,
    loopSong: true,
    autoBuild: true,
    isDeveloper: false,
    blackHoleApply: [],
    blackHoleWeight: [],
    bannedTreasure: []
  };
}
function defaultPlanetSave(planetId) {
  return {
    planetId,
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
      { id: "b_house_2", type: "house", x: 41, y: 40, level: 1 }
    ],
    workers: [],
    animals: [],
    robots: [],
    map: null,
    beast: {
      level: 1,
      lastAttackYear: 0,
      lootUnclaimed: 0
    },
    lastSeen: Date.now(),
    cameraX: 0,
    cameraY: 0,
    zoom: 1.1,
  };
}

// 存档读写
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
  logSys("✅ 已保存（全球 + 星球存檔）");
}
function loadGlobal() {
  const raw = localStorage.getItem(SAVE_KEY_GLOBAL);
  if (!raw) {
    globalSave = defaultGlobalSave();
    saveGlobal();
    return;
  }
  globalSave = JSON.parse(raw);
  if (typeof globalSave.autoBuild !== "boolean") globalSave.autoBuild = true;
  if (typeof globalSave.loopSong !== "boolean") globalSave.loopSong = true;
  if (!globalSave.currentPlanetId) globalSave.currentPlanetId = "planet_1";
  if (typeof globalSave.aeno !== "number") globalSave.aeno = 0;
  if (typeof globalSave.aenoFragments !== "number") globalSave.aenoFragments = 0;
  if (typeof globalSave.isDeveloper !== "boolean") globalSave.isDeveloper = false;
  if (!globalSave.bannedTreasure) globalSave.bannedTreasure = [];
  if (!globalSave.blackHoleApply) globalSave.blackHoleApply = [];
  if (!globalSave.blackHoleWeight) globalSave.blackHoleWeight = [];
}
function loadPlanet(planetId) {
  const raw = localStorage.getItem(SAVE_KEY_PLANET_PREFIX + planetId);
  if (!raw) {
    planetSave = defaultPlanetSave(planetId);
    initPlanetUnits();
    initPlanetMap();
    savePlanet();
    return;
  }
  planetSave = JSON.parse(raw);
  if (!planetSave.workers) planetSave.workers = [];
  if (!planetSave.animals) planetSave.animals = [];
  if (!planetSave.buildings) planetSave.buildings = [];
  if (!planetSave.beast) planetSave.beast = defaultPlanetSave(planetId).beast;
  if (!planetSave.territoryCenter) planetSave.territoryCenter = { x: 40, y: 40 };
  if (!planetSave.territoryRadius) planetSave.territoryRadius = 5;
  if (!planetSave.map) planetSave.map = null;
  if (planetSave.workers.length === 0) initPlanetUnits();
  if (!planetSave.map) initPlanetMap();
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
  const planet = planets.find(p => p.id === planetSave.planetId);
  const rng = mulberry32(planet ? planet.seed : 12345);
  const tiles = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const n = rng();
      let type = "grass";
      if (planetSave.planetId === BLACK_HOLE_ID) {
        if (n < 0.02) type = "water";
        else if (n < 0.20) type = "mountain";
        else if (n < 0.35) type = "forest";
        else if (n < 0.50) type = "stone";
        else if (n < 0.62) type = "iron";
        else type = "grass";
      } else {
        if (n < 0.07) type = "water";
        else if (n < 0.14) type = "mountain";
        else if (n < 0.30) type = "forest";
        else if (n < 0.38) type = "stone";
        else if (n < 0.46) type = "iron";
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

// 领土判断
function isInTerritory(x, y) {
  return true;
}

// 建筑配置
const BUILD_TYPES = {
  house: { name: "房屋", cost: { wood: 30, stone: 10, coins: 80 }, baseIncome: 3 },
  lumber: { name: "伐木場", cost: { wood: 10, stone: 5, coins: 60 }, baseIncome: 0 },
  quarry: { name: "採石場", cost: { wood: 15, stone: 10, coins: 90 }, baseIncome: 0 },
  mine: { name: "礦場", cost: { wood: 20, stone: 15, coins: 110 }, baseIncome: 0 },
  farm: { name: "農田", cost: { wood: 20, stone: 5, coins: 70 }, baseIncome: 1 },
  factory: { name: "工廠", cost: { wood: 80, stone: 60, iron: 40, coins: 350 }, baseIncome: 8 },
  wall: { name: "城牆", cost: { stone: 80, coins: 200 }, baseIncome: 0 },
  market: { name: "市場", cost: { wood: 50, stone: 30, coins: 200 }, baseIncome: 5 }
};

// 资源判断
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

// 自动建造配置
const AUTO_BUILD = {
  RESERVE_RATIO: 0.5,
  PRIORITY: ["house", "lumber", "quarry", "mine", "farm", "factory", "market"],
  MAX_TRIES_PER_TICK: 3,
  AUTO_UPGRADE: true,
  BUILD_SPACING: 1
};
function canAutoPay(cost) {
  if (!planetSave) return false;
  const maxCoins = Math.floor(planetSave.coins * AUTO_BUILD.RESERVE_RATIO);
  const maxWood = Math.floor(planetSave.wood * AUTO_BUILD.RESERVE_RATIO);
  const maxStone = Math.floor(planetSave.stone * AUTO_BUILD.RESERVE_RATIO);
  const maxIron = Math.floor(planetSave.iron * AUTO_BUILD.RESERVE_RATIO);
  const maxFood = Math.floor(planetSave.food * AUTO_BUILD.RESERVE_RATIO);
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
  if (!globalSave?.autoBuild || !planetSave) return false;
  if (AUTO_BUILD.AUTO_UPGRADE) {
    const upgradable = planetSave.buildings
      .filter(b => b.level < 10)
      .sort((a, b) => a.level - b.level);
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
        logSys(`🤖 AI 升級 ${def.name} → Lv${b.level}`);
        return true;
      }
    }
  }
  for (const type of AUTO_BUILD.PRIORITY) {
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
    logSys(`🤖 AI 建成 ${def.name} Lv1`);
    return true;
  }
  return false;
}
function runAutoBuild() {
  if (!globalSave?.autoBuild || !planetSave) return;
  let built = 0;
  while (built < AUTO_BUILD.MAX_TRIES_PER_TICK && autoBuildOne()) {
    built++;
  }
}

// 手动建造/升级
function buildAt(type, x, y) {
  if (!isInTerritory(x, y)) {
    logSys("❌ 非領土範圍，不能建築");
    return false;
  }
  const def = BUILD_TYPES[type];
  if (!def) return false;
  if (!canPay(def.cost)) {
    logSys("❌ 資源不足");
    return false;
  }
  if (planetSave.buildings.some(b => b.x === x && b.y === y)) {
    logSys("❌ 此格已有建築");
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
  logSys(`🏗️ 建成 ${def.name} Lv1`);
  return true;
}
function upgradeBuildingAt(x, y) {
  const b = planetSave.buildings.find(bb => bb.x === x && bb.y === y);
  if (!b) {
    logSys("❌ 沒有建築可以升級");
    return false;
  }
  if (b.level >= 10) {
    logSys("ℹ️ 已達最高 Lv10");
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
    logSys("❌ 升級資源不足");
    return false;
  }
  payCost(cost);
  b.level++;
  logSys(`⬆️ ${def.name} 升級到 Lv${b.level}`);
  return true;
}

// 资源计算
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
  for (const b of planetSave.buildings) {
    const lv = b.level || 1;
    if (b.type === "lumber") woodGain += 1.3 * lv;
    if (b.type === "quarry") stoneGain += 1.0 * lv;
    if (b.type === "mine") ironGain += 0.8 * lv;
    if (b.type === "farm") foodGain += 1.6 * lv;
  }
  woodGain += planetSave.workers.length * 0.06;
  stoneGain += planetSave.workers.length * 0.05;
  ironGain += planetSave.workers.length * 0.05;
  foodGain += planetSave.workers.length * 0.07;
  planetSave.wood += woodGain * dt;
  planetSave.stone += stoneGain * dt;
  planetSave.iron += ironGain * dt;
  planetSave.food += foodGain * dt;
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
  logSys(`🕒 離線補算 ${Math.floor(used / 3600)} 小時（上限24h）`);
}

// 绘图工具
function drawRoundedRect(x, y, w, h, r) {
  if (!ctx) return;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// 相机控制
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

// 画布事件绑定
if (canvas) {
  canvas.addEventListener("pointerdown", (e) => {
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
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    zoomLevel += -delta * 0.15;
    zoomLevel = Math.max(0.3, Math.min(3.0, zoomLevel));
  }, { passive: false });
}

// 坐标转换
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

// 绘图函数
function drawTile(x, y, type, inTerritory) {
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
  if (b.type === "wall") color = "#cbd5e1";
  if (b.type === "market") color = "#f0abfc";
  ctx.fillStyle = color;
  drawRoundedRect(x - 18, y - 18, 36, 28, 8);
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
  if (!ctx || !planetSave || !globalSave || !isGameStarted) return;
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.save();
  ctx.translate(window.innerWidth / 2 + cameraX, 180 + cameraY);
  ctx.scale(zoomLevel, zoomLevel);
  const tiles = planetSave.map.tiles;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = tiles[y * MAP_W + x];
      const p = tileToScreen(x, y);
      drawTile(p.x, p.y, t.type, isInTerritory(x, y));
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
  const planet = planets.find(p => p.id === planetSave.planetId);
  if (ui.planetName) ui.planetName.textContent = planet ? planet.name : "?";
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
  if (ui.autoState) ui.autoState.textContent = globalSave.autoBuild ? "ON" : "OFF";
  if (ui.loopState) ui.loopState.textContent = globalSave.loopSong ? "ON" : "OFF";
}

// 游戏主循环
function tick(now) {
  if (!isGameStarted || !planetSave || !globalSave) return;
  const dt = Math.min(0.2, (now - lastTick) / 1000);
  lastTick = now;
  planetSave.gameYear += GAME_YEARS_PER_REAL_SECOND * dt;
  planetSave.coins += calcIncomePerSecond() * dt;
  produceResources(dt);
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
  planetSave.coins = Math.max(0, planetSave.coins);
  planetSave.wood = Math.max(0, planetSave.wood);
  planetSave.stone = Math.max(0, planetSave.stone);
  planetSave.iron = Math.max(0, planetSave.iron);
  planetSave.food = Math.max(0, planetSave.food);
  runAutoBuild();
  draw();
  requestAnimationFrame(tick);
}

// UI事件绑定（登录成功后执行）
function rebindUIEvents() {
  if (ui.btnSave) ui.btnSave.onclick = () => saveAll();
  if (ui.btnAuto) ui.btnAuto.onclick = () => {
    globalSave.autoBuild = !globalSave.autoBuild;
    logSys(globalSave.autoBuild ? "🤖 自動建造 ON" : "🛑 自動建造 OFF");
    saveAll();
  };
  if (ui.btnLoopSong) ui.btnLoopSong.onclick = () => {
    globalSave.loopSong = !globalSave.loopSong;
    logSys(globalSave.loopSong ? "🔁 Loop ON" : "⏹️ Loop OFF");
    saveAll();
  };
  if (ui.btnBuildMode) ui.btnBuildMode.onclick = () => { mode = "build"; logSys("🏗️ 建築模式"); };
  if (ui.btnUpgradeMode) ui.btnUpgradeMode.onclick = () => { mode = "upgrade"; logSys("⬆️ 升級模式"); };
  if (ui.btnAdSong) ui.btnAdSong.onclick = () => {
    try {
      if (!adAudio) {
        adAudio = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_9c1a1c1d66.mp3?filename=happy-day-113985.mp3");
        adAudio.volume = 0.8;
      }
      adAudio.loop = globalSave.loopSong;
      adAudio.play().then(() => {
        logSys("🎵 廣告歌播放中（60秒後獲獎勵）");
        setTimeout(() => {
          planetSave.coins += 120;
          globalSave.aenoFragments += 1500;
          while (globalSave.aenoFragments >= 1000) {
            globalSave.aenoFragments -= 1000;
            globalSave.aeno += 0.0001;
          }
          logSys("🎁 獎勵：金幣 +120 / AENO碎片 +1500");
          saveAll();
        }, 60000);
      }).catch(() => {
        logSys("❌ Chrome 手機需再按一次播放");
      });
    } catch {
      logSys("❌ 音樂系統錯誤");
    }
  };
  if (canvas) {
    canvas.onclick = function(e) {
      const tile = screenToTile(e.clientX, e.clientY);
      if (!tile) return;
      if (mode === "build") {
        buildAt("house", tile.x, tile.y);
        saveAll();
      } else {
        upgradeBuildingAt(tile.x, tile.y);
        saveAll();
      }
    };
  }
  logSys("✅ 所有按鈕已綁定，可正常操作");
}

// 黑洞资格检查
function checkBlackHoleStatus(playerName) {
  const aeno = globalSave.aeno || 0;
  if (aeno >= AENO_APPLY && !globalSave.blackHoleApply.includes(playerName)) {
    globalSave.blackHoleApply.push(playerName);
    logSys(`📝 ${playerName} 達 800萬 AENO，已加入黑洞申請列表`);
  }
  if (aeno >= AENO_WEIGHT && !globalSave.blackHoleWeight.includes(playerName)) {
    globalSave.blackHoleWeight.push(playerName);
    logSys(`🔑 ${playerName} 達 1000萬 AENO，獲黑洞權重入資格`);
  }
  saveGlobal();
}

// 核心登录函数（强制用户名+密码）
function login(username, password) {
  // 严格校验：用户名和密码都不能为空
  if (!username || username.trim() === "") {
    alert("❌ 請輸入用戶名");
    logSys("❌ 登入失敗：未輸入用戶名");
    return false;
  }
  if (!password || password.trim() === "") {
    alert("❌ 請輸入密碼");
    logSys("❌ 登入失敗：未輸入密碼");
    return false;
  }

  // 加载存档
  loadGlobal();

  // 开发者账号处理
  if (username === "阿勒頓") {
    globalSave.isDeveloper = true;
    globalSave.currentPlanetId = BLACK_HOLE_ID;
    logSys("👑 歡回開發者：阿勒頓 → 黑洞孤島");
  } else {
    globalSave.isDeveloper = false;
    logSys("👤 玩家登入：" + username);
    checkBlackHoleStatus(username);
  }

  // 保存数据
  saveGlobal();
  loadPlanet(globalSave.currentPlanetId);
  loadCamera();
  applyOfflineProgress();
  saveAll();

  // 绑定所有游戏按钮
  rebindUIEvents();

  // 启动游戏
  isGameStarted = true;
  resizeCanvas();
  lastTick = performance.now();
  requestAnimationFrame(tick);

  // 隐藏登录框，显示游戏
  const loginBox = document.getElementById("loginBox");
  const gameBox = document.getElementById("gameBox");
  if (loginBox) loginBox.style.display = "none";
  if (gameBox) gameBox.style.display = "block";

  logSys("✅ 登入成功！遊戲已正常啟動");
  alert("✅ 登入成功！開始遊戲啦");
  return true;
}

// 页面加载完成后，自动绑定登录按钮
window.addEventListener("DOMContentLoaded", () => {
  // 自动获取登录页面的元素
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");

  // 绑定登录按钮点击事件
  if (loginBtn) {
    loginBtn.onclick = () => {
      const username = usernameInput ? usernameInput.value : "";
      const password = passwordInput ? passwordInput.value : "";
      login(username, password);
    };
  }

  // 绑定回车登录
  if (passwordInput) {
    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const username = usernameInput ? usernameInput.value : "";
        const password = passwordInput.value;
        login(username, password);
      }
    });
  }

  logSys("🔒 遊戲已加載，請輸入用戶名和密碼登入");
});

// 页面隐藏/关闭时自动保存
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
