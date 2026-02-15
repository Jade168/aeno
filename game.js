// AENO V3 - FULL GAME.JS (NO FEATURE REMOVAL VERSION)
// IMPORTANT: DO NOT DELETE ANY LINES. PUT THIS AS WHOLE FILE.

// =========================
// CONFIG
// =========================
const AENO_VERSION = "V3.0.9-FULLLOCK";
const SAVE_KEY = "AENO_SAVE_V3";
const CAMERA_KEY = "AENO_CAMERA_STATE_V3";
const MAX_OFFLINE_HOURS = 24;

// 1 real day = 10 game years
const GAME_YEARS_PER_REAL_SECOND = (10 / (24 * 3600)); // 10 years / 86400 sec

// =========================
// CANVAS SETUP
// =========================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

function resizeCanvas() {
  canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
  canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// =========================
// UI HOOKS
// =========================
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

function logSys(msg) {
  if (!ui.sysLog) return;
  const t = new Date().toLocaleTimeString();
  ui.sysLog.innerHTML = `<div>[${t}] ${msg}</div>` + ui.sysLog.innerHTML;
}

// =========================
// RNG SEED (WORLD NEVER CHANGES)
// =========================
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

// =========================
// PLANETS (20 + BLACK HOLE)
// =========================
const PLANET_COUNT = 20;
const BLACK_HOLE_ID = "black_hole_island";

function generatePlanets() {
  const planets = [];
  for (let i = 1; i <= PLANET_COUNT; i++) {
    planets.push({
      id: "planet_" + i,
      name: "星球 " + i,
      seed: hashStringToSeed("AENO_PLANET_" + i),
      biome: (i % 5),
    });
  }
  planets.push({
    id: BLACK_HOLE_ID,
    name: "黑洞 · 孤島（開發者領）",
    seed: hashStringToSeed("AENO_BLACKHOLE"),
    biome: 99,
    isDev: true
  });
  return planets;
}
const planets = generatePlanets();

// =========================
// GAME STATE (LOCKED)
// =========================
let state = null;

function defaultState() {
  return {
    version: AENO_VERSION,
    createdAt: Date.now(),
    lastSeen: Date.now(),
    currentPlanetId: "planet_1",
    gameYear: 0,

    // economy
    coins: 2000,
    aeno: 0,
    aenoFragments: 0,

    // resources
    wood: 800,
    stone: 800,
    iron: 800,
    food: 800,

    // population
    pop: 4,

    // buildings
    buildings: [],

    // worker units
    workers: [],
    animals: [],
    robots: [],

    // AI automation
    autoBuild: true,
    aiPriority: {
      house: true,
      lumber: true,
      quarry: true,
      mine: true,
      farm: true,
      factory: false,
      wall: false,
    },

    // territory
    territoryRadius: 5, // starting radius
    territoryCenter: { x: 40, y: 40 },

    // camera
    cameraX: 0,
    cameraY: 0,
    zoom: 1.1,

    // map caches per planet
    planetMaps: {},

    // exchange
    market: {
      woodPrice: 2,
      stonePrice: 2,
      ironPrice: 4,
      foodPrice: 1,
    },

    // audio
    loopSong: true,
    lastAdRewardAt: 0,

    // progression
    tech: {
      mining: 1,
      farming: 1,
      robotics: 1,
      defense: 1,
      exchange: 1,
    },

    // beast tide
    beast: {
      level: 1,
      lastAttackYear: 0,
      lootUnclaimed: 0
    },

    // black hole access (only you)
    isDeveloper: true,
  };
}

// =========================
// SAVE / LOAD (NEVER RESET)
// =========================
function saveGame() {
  try {
    state.lastSeen = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    logSys("✅ 已保存（永久存檔）");
  } catch (e) {
    logSys("❌ 保存失敗");
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      state = defaultState();
      initWorldForPlanet(state.currentPlanetId);
      initUnits();
      saveGame();
      return;
    }

    const loaded = JSON.parse(raw);

    // MIGRATION (never wipe)
    state = defaultState();
    for (const k in loaded) state[k] = loaded[k];

    if (!state.planetMaps) state.planetMaps = {};
    if (!state.aiPriority) state.aiPriority = defaultState().aiPriority;
    if (!state.market) state.market = defaultState().market;
    if (!state.tech) state.tech = defaultState().tech;
    if (!state.beast) state.beast = defaultState().beast;

    // ensure minimum starting assets if corrupted
    state.coins = Math.max(state.coins || 0, 2000);
    state.wood = Math.max(state.wood || 0, 800);
    state.stone = Math.max(state.stone || 0, 800);
    state.iron = Math.max(state.iron || 0, 800);
    state.food = Math.max(state.food || 0, 800);
    state.pop = Math.max(state.pop || 0, 4);

    initWorldForPlanet(state.currentPlanetId);
    if (!state.workers || state.workers.length === 0) initUnits();

    applyOfflineProgress();
    saveGame();

    logSys("📦 存檔載入成功（不會重開局）");
  } catch (e) {
    state = defaultState();
    initWorldForPlanet(state.currentPlanetId);
    initUnits();
    saveGame();
  }
}

// =========================
// WORLD MAP GENERATION (FOREVER SAME PER PLANET)
// =========================
const MAP_W = 80;
const MAP_H = 80;
const TILE = 42;

function initWorldForPlanet(planetId) {
  if (!state.planetMaps[planetId]) {
    const planet = planets.find(p => p.id === planetId);
    const seed = planet ? planet.seed : 12345;
    const rng = mulberry32(seed);

    const tiles = [];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const n = rng();

        let type = "grass";
        if (n < 0.07) type = "water";
        else if (n < 0.13) type = "mountain";
        else if (n < 0.30) type = "forest";
        else if (n < 0.36) type = "stone";
        else if (n < 0.42) type = "iron";

        tiles.push({ x, y, type });
      }
    }

    // force at least some resources around center
    const cx = state.territoryCenter.x;
    const cy = state.territoryCenter.y;
    function setTile(x, y, type) {
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
      tiles[y * MAP_W + x].type = type;
    }
    setTile(cx + 2, cy, "forest");
    setTile(cx - 2, cy, "forest");
    setTile(cx, cy + 2, "stone");
    setTile(cx, cy - 2, "iron");

    state.planetMaps[planetId] = { tiles };
  }
}

// =========================
// TERRITORY
// =========================
function isInTerritory(x, y) {
  const dx = x - state.territoryCenter.x;
  const dy = y - state.territoryCenter.y;
  return Math.sqrt(dx * dx + dy * dy) <= state.territoryRadius;
}

// =========================
// UNITS INIT
// =========================
function initUnits() {
  state.workers = [];
  for (let i = 0; i < 4; i++) {
    state.workers.push({
      id: "w" + i,
      x: state.territoryCenter.x + (i % 2),
      y: state.territoryCenter.y + Math.floor(i / 2),
      task: "idle",
      target: null
    });
  }

  // animals roaming
  state.animals = [];
  for (let i = 0; i < 8; i++) {
    state.animals.push({
      id: "a" + i,
      x: Math.floor(Math.random() * MAP_W),
      y: Math.floor(Math.random() * MAP_H),
      t: 0
    });
  }

  // start with 2 houses
  if (!state.buildings || state.buildings.length === 0) {
    state.buildings = [
      { id: "b_house_1", type: "house", x: state.territoryCenter.x, y: state.territoryCenter.y, level: 1 },
      { id: "b_house_2", type: "house", x: state.territoryCenter.x + 1, y: state.territoryCenter.y, level: 1 }
    ];
  }
}

// =========================
// BUILDINGS DATA
// =========================
const BUILD_TYPES = {
  house: { name: "房屋", cost: { wood: 30, stone: 10, coins: 100 }, baseIncome: 2 },
  lumber: { name: "伐木場", cost: { wood: 10, stone: 5, coins: 80 }, baseIncome: 0 },
  quarry: { name: "採石場", cost: { wood: 15, stone: 10, coins: 120 }, baseIncome: 0 },
  mine: { name: "礦場", cost: { wood: 20, stone: 15, coins: 150 }, baseIncome: 0 },
  farm: { name: "農田", cost: { wood: 20, stone: 5, coins: 90 }, baseIncome: 1 },
  factory: { name: "工廠", cost: { wood: 80, stone: 60, iron: 40, coins: 400 }, baseIncome: 5 },
  wall: { name: "城牆", cost: { stone: 80, coins: 250 }, baseIncome: 0 },
};

function canPay(cost) {
  if (cost.coins && state.coins < cost.coins) return false;
  if (cost.wood && state.wood < cost.wood) return false;
  if (cost.stone && state.stone < cost.stone) return false;
  if (cost.iron && state.iron < cost.iron) return false;
  if (cost.food && state.food < cost.food) return false;
  return true;
}

function payCost(cost) {
  if (cost.coins) state.coins -= cost.coins;
  if (cost.wood) state.wood -= cost.wood;
  if (cost.stone) state.stone -= cost.stone;
  if (cost.iron) state.iron -= cost.iron;
  if (cost.food) state.food -= cost.food;
}

// =========================
// BUILD / UPGRADE
// =========================
function buildAt(type, x, y) {
  if (!isInTerritory(x, y)) {
    logSys("❌ 非領土範圍，不能建築");
    return false;
  }
  const def = BUILD_TYPES[type];
  if (!def) return false;

  if (!canPay(def.cost)) {
    logSys("❌ 資源不足，不能建築");
    return false;
  }

  // prevent overlap
  for (const b of state.buildings) {
    if (b.x === x && b.y === y) {
      logSys("❌ 此格已有建築");
      return false;
    }
  }

  payCost(def.cost);
  state.buildings.push({
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
  const b = state.buildings.find(bb => bb.x === x && bb.y === y);
  if (!b) {
    logSys("❌ 沒有建築可以升級");
    return false;
  }

  if (b.level >= 10) {
    logSys("ℹ️ 已達最高等級 Lv10");
    return false;
  }

  const def = BUILD_TYPES[b.type];
  const cost = {
    coins: Math.floor((def.cost.coins || 0) * (0.6 + b.level * 0.35)),
    wood: Math.floor((def.cost.wood || 0) * (0.5 + b.level * 0.25)),
    stone: Math.floor((def.cost.stone || 0) * (0.5 + b.level * 0.25)),
    iron: Math.floor((def.cost.iron || 0) * (0.5 + b.level * 0.25)),
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

// =========================
// ECONOMY (COINS SOURCE FIX)
// =========================
function calcIncomePerSecond() {
  let income = 0;

  for (const b of state.buildings) {
    const def = BUILD_TYPES[b.type];
    if (!def) continue;
    const lv = b.level || 1;

    // base income coins
    income += (def.baseIncome || 0) * (1 + (lv - 1) * 0.55);
  }

  // population tax
  income += state.pop * 0.05;

  // factory boost
  const factoryCount = state.buildings.filter(b => b.type === "factory").length;
  income += factoryCount * 0.8;

  return income;
}

function produceResources(dt) {
  // dt in seconds
  let woodGain = 0, stoneGain = 0, ironGain = 0, foodGain = 0;

  for (const b of state.buildings) {
    const lv = b.level || 1;
    if (b.type === "lumber") woodGain += 1.2 * lv;
    if (b.type === "quarry") stoneGain += 0.9 * lv;
    if (b.type === "mine") ironGain += 0.65 * lv;
    if (b.type === "farm") foodGain += 1.4 * lv;
  }

  // workers bonus
  woodGain += state.workers.length * 0.05;
  stoneGain += state.workers.length * 0.04;
  ironGain += state.workers.length * 0.03;
  foodGain += state.workers.length * 0.06;

  state.wood += woodGain * dt;
  state.stone += stoneGain * dt;
  state.iron += ironGain * dt;
  state.food += foodGain * dt;
}

// =========================
// TIME SYSTEM FIX
// =========================
let lastTick = performance.now();

function tick(now) {
  const dt = Math.min(0.2, (now - lastTick) / 1000);
  lastTick = now;

  // year progress
  state.gameYear += GAME_YEARS_PER_REAL_SECOND * dt;

  // income
  state.coins += calcIncomePerSecond() * dt;

  // resources
  produceResources(dt);

  // animals roam
  updateAnimals(dt);

  // beast tide
  beastTide(dt);

  // AI automation
  aiAutoBuild(dt);

  // clamp
  clampState();

  // render
  draw();

  requestAnimationFrame(tick);
}

function clampState() {
  state.coins = Math.max(0, state.coins);
  state.wood = Math.max(0, state.wood);
  state.stone = Math.max(0, state.stone);
  state.iron = Math.max(0, state.iron);
  state.food = Math.max(0, state.food);
}

// =========================
// ANIMALS
// =========================
function updateAnimals(dt) {
  for (const a of state.animals) {
    a.t += dt;
    if (a.t > 1.2) {
      a.t = 0;
      a.x += Math.floor(Math.random() * 3) - 1;
      a.y += Math.floor(Math.random() * 3) - 1;
      a.x = Math.max(0, Math.min(MAP_W - 1, a.x));
      a.y = Math.max(0, Math.min(MAP_H - 1, a.y));
    }
  }
}

// =========================
// BEAST TIDE (ONLY AFTER CITY 100%)
// =========================
function isCityComplete() {
  // city complete means at least:
  // 6 houses + 1 wall + 1 factory
  const houses = state.buildings.filter(b => b.type === "house").length;
  const walls = state.buildings.filter(b => b.type === "wall").length;
  const factories = state.buildings.filter(b => b.type === "factory").length;
  return houses >= 6 && walls >= 1 && factories >= 1;
}

function beastTide(dt) {
  if (!isCityComplete()) return;

  const year = state.gameYear;
  if (year - state.beast.lastAttackYear > (12 + Math.random() * 8)) {
    state.beast.lastAttackYear = year;

    // loot fragments + coins
    const loot = Math.floor(50 + state.beast.level * 25);
    state.beast.lootUnclaimed += loot;

    state.beast.level++;
    logSys(`🐲 獸潮來襲！擊退後掉落野蠻碎片 ${loot}（可領取）`);
  }
}

// =========================
// AENO ALGORITHM (HIDDEN STYLE)
// =========================
function AENO_hiddenMintFromLearning(score, seconds) {
  // score: 0..1, seconds: watch time
  // hidden mapping: not explicit binary mapping, uses salted hash
  const salt = (state.currentPlanetId + "|" + Math.floor(state.gameYear) + "|" + state.pop);
  const seed = hashStringToSeed(salt);
  const rng = mulberry32(seed);

  const base = rng() * 0.004;
  const learnFactor = Math.pow(score, 1.6) * 0.012;
  const timeFactor = Math.min(1, seconds / 60) * 0.006;

  const frag = (base + learnFactor + timeFactor) * 1000;
  return frag;
}

// fragments -> AENO (slow)
function convertFragmentsToAeno() {
  while (state.aenoFragments >= 1000) {
    state.aenoFragments -= 1000;
    state.aeno += 0.0001;
  }
}

// =========================
// AI AUTO BUILD (NO WASTE)
// =========================
let aiCooldown = 0;

function aiAutoBuild(dt) {
  if (!state.autoBuild) return;

  aiCooldown -= dt;
  if (aiCooldown > 0) return;

  aiCooldown = 2.5; // every 2.5 sec decide

  // don't waste: keep reserve
  const reserveCoins = 300;
  const reserveWood = 80;
  const reserveStone = 60;

  if (state.coins < reserveCoins) return;
  if (state.wood < reserveWood) return;
  if (state.stone < reserveStone) return;

  // choose priorities (multi)
  const prio = state.aiPriority;

  // expand if too full
  if (state.buildings.length > 18 && state.coins > 600) {
    expandTerritoryAuto();
  }

  // build in order
  if (prio.house) {
    const houses = state.buildings.filter(b => b.type === "house").length;
    if (houses < 6) return aiBuildNear("house");
  }

  if (prio.lumber) {
    const lumber = state.buildings.filter(b => b.type === "lumber").length;
    if (lumber < 2) return aiBuildOnTile("lumber", "forest");
  }

  if (prio.quarry) {
    const quarry = state.buildings.filter(b => b.type === "quarry").length;
    if (quarry < 2) return aiBuildOnTile("quarry", "stone");
  }

  if (prio.mine) {
    const mine = state.buildings.filter(b => b.type === "mine").length;
    if (mine < 2) return aiBuildOnTile("mine", "iron");
  }

  if (prio.farm) {
    const farm = state.buildings.filter(b => b.type === "farm").length;
    if (farm < 2) return aiBuildNear("farm");
  }

  if (prio.factory) {
    const factory = state.buildings.filter(b => b.type === "factory").length;
    if (factory < 1) return aiBuildNear("factory");
  }

  if (prio.wall) {
    const wall = state.buildings.filter(b => b.type === "wall").length;
    if (wall < 1) return aiBuildNear("wall");
  }

  // upgrade instead of spam lv1
  aiUpgradeRandom();
}

function aiBuildNear(type) {
  for (let dy = -state.territoryRadius; dy <= state.territoryRadius; dy++) {
    for (let dx = -state.territoryRadius; dx <= state.territoryRadius; dx++) {
      const x = state.territoryCenter.x + dx;
      const y = state.territoryCenter.y + dy;
      if (!isInTerritory(x, y)) continue;
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;

      if (!state.buildings.some(b => b.x === x && b.y === y)) {
        return buildAt(type, x, y);
      }
    }
  }
  return false;
}

function aiBuildOnTile(type, tileType) {
  const map = state.planetMaps[state.currentPlanetId].tiles;
  for (let dy = -state.territoryRadius; dy <= state.territoryRadius; dy++) {
    for (let dx = -state.territoryRadius; dx <= state.territoryRadius; dx++) {
      const x = state.territoryCenter.x + dx;
      const y = state.territoryCenter.y + dy;
      if (!isInTerritory(x, y)) continue;
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;

      const t = map[y * MAP_W + x];
      if (t.type !== tileType) continue;

      if (!state.buildings.some(b => b.x === x && b.y === y)) {
        return buildAt(type, x, y);
      }
    }
  }
  return false;
}

function aiUpgradeRandom() {
  // upgrade lowest level building first
  let target = null;
  for (const b of state.buildings) {
    if (!target || (b.level < target.level)) target = b;
  }
  if (!target) return false;
  return upgradeBuildingAt(target.x, target.y);
}

function expandTerritoryAuto() {
  const cost = Math.floor(200 + state.territoryRadius * 90);
  if (state.coins >= cost) {
    state.coins -= cost;
    state.territoryRadius += 1;
    logSys(`🗺️ 領土擴張成功（消耗金幣 ${cost}）`);
  }
}

// =========================
// OFFLINE PROGRESS (MAX 24H)
// =========================
function applyOfflineProgress() {
  const now = Date.now();
  const last = state.lastSeen || now;
  let diff = (now - last) / 1000;
  if (diff < 0) diff = 0;

  const max = MAX_OFFLINE_HOURS * 3600;
  const used = Math.min(diff, max);

  if (used < 5) return;

  // apply year progression
  state.gameYear += GAME_YEARS_PER_REAL_SECOND * used;

  // coins
  state.coins += calcIncomePerSecond() * used;

  // resources
  produceResources(used);

  // AI auto-build only first 10 minutes offline to prevent full waste
  if (state.autoBuild) {
    const sim = Math.min(used, 600);
    const loops = Math.floor(sim / 3);
    for (let i = 0; i < loops; i++) {
      aiAutoBuild(3);
    }
  }

  logSys(`🕒 離線補算 ${Math.floor(used / 3600)} 小時（上限 24h）`);
}

// =========================
// INPUT / CAMERA / ZOOM
// =========================
let cameraX = state ? state.cameraX : 0;
let cameraY = state ? state.cameraY : 0;
let zoomLevel = state ? state.zoom : 1.1;

let dragging = false;
let dragStart = { x: 0, y: 0 };
let camStart = { x: 0, y: 0 };

canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  dragStart.x = e.clientX;
  dragStart.y = e.clientY;
  camStart.x = cameraX;
  camStart.y = cameraY;
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  cameraX = camStart.x + dx;
  cameraY = camStart.y + dy;
});

canvas.addEventListener("pointerup", (e) => {
  dragging = false;
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = Math.sign(e.deltaY);
  zoomLevel += -delta * 0.1;
  zoomLevel = Math.max(0.5, Math.min(2.6, zoomLevel));
}, { passive: false });

// =========================
// BUILD MODE / UPGRADE MODE
// =========================
let mode = "build";

if (ui.btnBuildMode) ui.btnBuildMode.onclick = () => { mode = "build"; logSys("🏗️ 建築模式"); };
if (ui.btnUpgradeMode) ui.btnUpgradeMode.onclick = () => { mode = "upgrade"; logSys("⬆️ 升級模式"); };

canvas.addEventListener("click", (e) => {
  const tile = screenToTile(e.clientX, e.clientY);
  if (!tile) return;

  if (mode === "build") {
    // simple build menu: build house by default if empty
    if (!isInTerritory(tile.x, tile.y)) {
      logSys("❌ 非領土範圍");
      return;
    }

    // default: build house if no building
    if (!state.buildings.some(b => b.x === tile.x && b.y === tile.y)) {
      buildAt("house", tile.x, tile.y);
      saveGame();
    } else {
      logSys("ℹ️ 此格已有建築");
    }
  }

  if (mode === "upgrade") {
    upgradeBuildingAt(tile.x, tile.y);
    saveGame();
  }
});

// =========================
// TILE TRANSFORM
// =========================
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

// =========================
// DRAW
// =========================
function draw() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.save();
  ctx.translate(window.innerWidth / 2 + cameraX, 180 + cameraY);
  ctx.scale(zoomLevel, zoomLevel);

  const map = state.planetMaps[state.currentPlanetId].tiles;

  // draw tiles back to front
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = map[y * MAP_W + x];
      const p = tileToScreen(x, y);
      drawTile(p.x, p.y, t.type, isInTerritory(x, y));
    }
  }

  // draw buildings
  for (const b of state.buildings) {
    const p = tileToScreen(b.x, b.y);
    drawBuilding(p.x, p.y, b);
  }

  // draw animals
  for (const a of state.animals) {
    const p = tileToScreen(a.x, a.y);
    drawAnimal(p.x, p.y);
  }

  // draw workers
  for (const w of state.workers) {
    const p = tileToScreen(w.x, w.y);
    drawWorker(p.x, p.y);
  }

  ctx.restore();

  updateHUD();
}

function drawTile(x, y, type, inTerritory) {
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

  // border
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.stroke();

  // territory shading
  if (!inTerritory) {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();
  }
}

function drawBuilding(x, y, b) {
  // cute 3D building style
  const lv = b.level || 1;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y + 18, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // body
  let color = "#fde68a";
  if (b.type === "house") color = "#fef3c7";
  if (b.type === "lumber") color = "#bbf7d0";
  if (b.type === "quarry") color = "#e2e8f0";
  if (b.type === "mine") color = "#fecaca";
  if (b.type === "farm") color = "#fde68a";
  if (b.type === "factory") color = "#bae6fd";
  if (b.type === "wall") color = "#cbd5e1";

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 18, y - 18, 36, 28, 8);
  ctx.fill();

  // roof
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(x - 22, y - 18);
  ctx.quadraticCurveTo(x, y - 38, x + 22, y - 18);
  ctx.closePath();
  ctx.fill();

  // level label
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 10px system-ui";
  ctx.fillText("Lv" + lv, x - 12, y - 2);
}

function drawAnimal(x, y) {
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.arc(x, y - 12, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawWorker(x, y) {
  ctx.fillStyle = "#0ea5e9";
  ctx.beginPath();
  ctx.arc(x, y - 10, 5, 0, Math.PI * 2);
  ctx.fill();
}

// =========================
// HUD UPDATE
// =========================
function updateHUD() {
  const planet = planets.find(p => p.id === state.currentPlanetId);
  if (ui.planetName) ui.planetName.textContent = planet ? planet.name : "?";

  if (ui.gameYear) ui.gameYear.textContent = Math.floor(state.gameYear);
  if (ui.popCount) ui.popCount.textContent = Math.floor(state.pop);

  if (ui.coins) ui.coins.textContent = Math.floor(state.coins);
  if (ui.aeno) ui.aeno.textContent = state.aeno.toFixed(4);

  if (ui.wood) ui.wood.textContent = Math.floor(state.wood);
  if (ui.stone) ui.stone.textContent = Math.floor(state.stone);
  if (ui.iron) ui.iron.textContent = Math.floor(state.iron);
  if (ui.food) ui.food.textContent = Math.floor(state.food);

  if (ui.factoryCount) ui.factoryCount.textContent = state.buildings.filter(b => b.type === "factory").length;
  if (ui.robotCount) ui.robotCount.textContent = state.robots.length;
}

// =========================
// UI BUTTONS
// =========================
if (ui.btnSave) ui.btnSave.onclick = () => saveGame();

if (ui.btnAuto) ui.btnAuto.onclick = () => {
  state.autoBuild = !state.autoBuild;
  if (ui.autoState) ui.autoState.textContent = state.autoBuild ? "ON" : "OFF";
  logSys(state.autoBuild ? "🤖 自動建造已開啟" : "🛑 自動建造已關閉");
  saveGame();
};

if (ui.btnLoopSong) ui.btnLoopSong.onclick = () => {
  state.loopSong = !state.loopSong;
  if (ui.loopState) ui.loopState.textContent = state.loopSong ? "ON" : "OFF";
  logSys(state.loopSong ? "🔁 Loop 開啟" : "⏹️ Loop 關閉");
  saveGame();
};

if (ui.btnAdSong) ui.btnAdSong.onclick = () => {
  playAdSongReward();
};

if (ui.btnRobotSend) ui.btnRobotSend.onclick = () => {
  robotExploreEvent();
};

if (ui.btnExchange) ui.btnExchange.onclick = () => {
  logSys("🏦 交易所（UI已存在，下一版加買賣按鍵）");
};

if (ui.btnTech) ui.btnTech.onclick = () => {
  logSys("🧬 科技樹（UI已存在，下一版加研究按鍵）");
};

// =========================
// AD SONG AUDIO (LONGER + REWARD)
// =========================
let adAudio = null;

function playAdSongReward() {
  try {
    if (!adAudio) {
      adAudio = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_9c1a1c1d66.mp3?filename=happy-day-113985.mp3");
      adAudio.loop = state.loopSong;
      adAudio.volume = 0.8;
    }
    adAudio.loop = state.loopSong;

    adAudio.play().then(() => {
      logSys("🎵 廣告歌播放中…（播放60秒後獲獎勵）");
      rewardAfterSeconds(60);
    }).catch(() => {
      logSys("❌ 音樂播放失敗（手機需手動再按一次）");
    });
  } catch (e) {
    logSys("❌ 音樂系統錯誤");
  }
}

function rewardAfterSeconds(sec) {
  const now = Date.now();
  if (now - state.lastAdRewardAt < 60000) {
    logSys("⏳ 獎勵冷卻中（每60秒一次）");
    return;
  }

  setTimeout(() => {
    const score = 0.55 + Math.random() * 0.4;
    const frag = AENO_hiddenMintFromLearning(score, sec);

    state.aenoFragments += frag;
    convertFragmentsToAeno();

    const coinReward = Math.floor(80 + Math.random() * 60);
    state.coins += coinReward;

    state.lastAdRewardAt = Date.now();

    logSys(`🎁 廣告獎勵：金幣 +${coinReward}，AENO碎片 +${Math.floor(frag)}`);
    saveGame();
  }, sec * 1000);
}

// =========================
// ROBOT EVENT (NPC RAID / NOT REAL PLAYERS)
// =========================
function robotExploreEvent() {
  if (state.coins < 200) {
    logSys("❌ 派機器人需要 200 金幣");
    return;
  }

  state.coins -= 200;
  logSys("🚀 機器人出發探索…");

  setTimeout(() => {
    const r = Math.random();

    if (r < 0.25) {
      // NPC raid
      const lossWood = Math.floor(state.wood * 0.2);
      const lossFood = Math.floor(state.food * 0.1);
      state.wood -= lossWood;
      state.food -= lossFood;
      logSys(`⚠️ 遭遇野蠻機器人掠奪：木 -${lossWood}，糧 -${lossFood}`);
    } else {
      const gainStone = 40 + Math.floor(Math.random() * 80);
      const gainIron = 20 + Math.floor(Math.random() * 50);
      state.stone += gainStone;
      state.iron += gainIron;
      logSys(`🤖 探索成功：石 +${gainStone}，鐵 +${gainIron}`);
    }

    saveGame();
  }, 2500);
}

// =========================
// CAMERA STATE SAVE (FIX "BACK TO PLANET MENU")
// =========================
function saveCameraState() {
  try {
    const cam = {
      cameraX,
      cameraY,
      zoomLevel,
      planet: state.currentPlanetId,
      ts: Date.now()
    };
    localStorage.setItem(CAMERA_KEY, JSON.stringify(cam));
  } catch (e) {}
}

function loadCameraState() {
  try {
    const raw = localStorage.getItem(CAMERA_KEY);
    if (!raw) return;
    const cam = JSON.parse(raw);

    if (typeof cam.cameraX === "number") cameraX = cam.cameraX;
    if (typeof cam.cameraY === "number") cameraY = cam.cameraY;
    if (typeof cam.zoomLevel === "number") zoomLevel = cam.zoomLevel;

    if (typeof cam.planet === "string") state.currentPlanetId = cam.planet;
  } catch (e) {}
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    saveCameraState();
    saveGame();
  } else {
    setTimeout(() => {
      loadCameraState();
    }, 80);
  }
});

window.addEventListener("pagehide", () => {
  saveCameraState();
  saveGame();
});

// =========================
// START
// =========================
loadGame();
loadCameraState();
requestAnimationFrame(tick);

// auto save every 20 sec
setInterval(() => {
  saveCameraState();
  saveGame();
}, 20000);
