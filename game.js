/* =========================================================
   AENO V3 - game.js (FULL VERSION)
   By ChatGPT + Peter Spec
   ========================================================= */

"use strict";

/* -----------------------------
   GLOBAL CONST / SETTINGS
------------------------------ */
const VERSION = "3.0.0";
const SAVE_KEY_PREFIX = "AENO_V3_SAVE_";
const USERS_KEY = "AENO_V3_USERS";
const SESSION_KEY = "AENO_V3_SESSION";

const DEV_USERNAME = "peter"; // 你可改成自己用戶名（黑洞權限）

// 時間流速：現實1日=遊戲100年
const REAL_SECONDS_PER_GAME_YEAR = (24 * 3600) / 100;

// 地圖
const TILE_SIZE = 32;
const MAP_W = 120;
const MAP_H = 80;

// 領土初始半徑
const START_TERRITORY_RADIUS = 10;

// 星球
const PLANETS = [
  { id: "p01", name: "Aurelia", biome: "forest" },
  { id: "p02", name: "Cryon", biome: "ice" },
  { id: "p03", name: "Dunara", biome: "desert" },
  { id: "p04", name: "Verdis", biome: "jungle" },
  { id: "p05", name: "Ferrum", biome: "iron" },
  { id: "p06", name: "Maris", biome: "ocean" },
  { id: "p07", name: "Noctis", biome: "dark" },
  { id: "p08", name: "Helion", biome: "lava" },
  { id: "p09", name: "Glacia", biome: "ice" },
  { id: "p10", name: "Gaia-2", biome: "forest" },
  { id: "p11", name: "Savana", biome: "grass" },
  { id: "p12", name: "Quartz", biome: "stone" },
  { id: "p13", name: "Riven", biome: "river" },
  { id: "p14", name: "Mossy", biome: "swamp" },
  { id: "p15", name: "Boreal", biome: "pine" },
  { id: "p16", name: "Solis", biome: "sun" },
  { id: "p17", name: "Tempest", biome: "storm" },
  { id: "p18", name: "Ashen", biome: "ash" },
  { id: "p19", name: "Titanis", biome: "rock" },
  { id: "p20", name: "Nebula", biome: "mystic" },
];

const BLACK_HOLE = { id: "bh", name: "黑洞 · 孤島", biome: "blackhole" };

// 建築定義
const BUILDINGS = {
  house: {
    id: "house",
    name: "房屋",
    icon: "🏠",
    baseCost: { wood: 30, stone: 10, coins: 20 },
    produce: { pop: 2 },
    maxLv: 10
  },
  lumber: {
    id: "lumber",
    name: "伐木場",
    icon: "🪵",
    baseCost: { wood: 40, stone: 15, coins: 25 },
    produce: { wood: 5 },
    maxLv: 10
  },
  farm: {
    id: "farm",
    name: "農田",
    icon: "🌾",
    baseCost: { wood: 35, stone: 10, coins: 20 },
    produce: { food: 5 },
    maxLv: 10
  },
  mine: {
    id: "mine",
    name: "礦場",
    icon: "⛏️",
    baseCost: { wood: 50, stone: 35, coins: 35 },
    produce: { stone: 3, iron: 2 },
    maxLv: 10
  },
  factory: {
    id: "factory",
    name: "工廠",
    icon: "⚙️",
    baseCost: { wood: 90, stone: 80, iron: 20, coins: 60 },
    produce: { coins: 10 },
    maxLv: 10
  },
  wall: {
    id: "wall",
    name: "城牆",
    icon: "🏰",
    baseCost: { wood: 60, stone: 90, coins: 50 },
    produce: {},
    maxLv: 10
  }
};

// 發音挖礦詞庫（可擴充）
const PRONOUNCE_WORDS = [
  { type: "resource", zh: "木材", en: "wood" },
  { type: "resource", zh: "石頭", en: "stone" },
  { type: "resource", zh: "鐵礦", en: "iron" },
  { type: "resource", zh: "糧食", en: "food" },
  { type: "beast", zh: "野獸", en: "beast" },
  { type: "plant", zh: "植物", en: "plant" },
  { type: "planet", zh: "星球", en: "planet" }
];

// 交易所簡化（先用固定價格）
const MARKET = {
  wood: 1,
  stone: 2,
  iron: 4,
  food: 1
};

// AENO掉落參數
const AENO_BASE_DROP = 0.0001;
const AENO_SCORE_BONUS_MULT = 0.002;

/* -----------------------------
   DOM
------------------------------ */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const elPlanetName = document.getElementById("planetName");
const elGameYear = document.getElementById("gameYear");
const elPop = document.getElementById("popCount");

const elCoins = document.getElementById("coins");
const elAeno = document.getElementById("aeno");

const elWood = document.getElementById("wood");
const elStone = document.getElementById("stone");
const elIron = document.getElementById("iron");
const elFood = document.getElementById("food");

const elHouseCount = document.getElementById("houseCount");
const elFactoryCount = document.getElementById("factoryCount");
const elRobotCount = document.getElementById("robotCount");

const togglePanelBtn = document.getElementById("togglePanelBtn");
const panel = document.getElementById("panel");
const btnHidePanel = document.getElementById("btnHidePanel");
const btnSave = document.getElementById("btnSave");

const btnBuildMode = document.getElementById("btnBuildMode");
const btnUpgradeMode = document.getElementById("btnUpgradeMode");
const btnAuto = document.getElementById("btnAuto");
const elAutoState = document.getElementById("autoState");

const btnAdSong = document.getElementById("btnAdSong");
const btnLoopSong = document.getElementById("btnLoopSong");
const elLoopState = document.getElementById("loopState");

const btnRobotSend = document.getElementById("btnRobotSend");
const btnExchange = document.getElementById("btnExchange");
const btnTech = document.getElementById("btnTech");
const btnPlanetInfo = document.getElementById("btnPlanetInfo");
const btnPronounce = document.getElementById("btnPronounce");
const btnLogout = document.getElementById("btnLogout");

const sysLog = document.getElementById("sysLog");

const assistantTalkBtn = document.getElementById("assistantTalkBtn");
const chatBox = document.getElementById("chatBox");
const chatClose = document.getElementById("chatClose");
const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

const assistantFace = document.getElementById("assistantFace");
const assistantName = document.getElementById("assistantName");

const bootScreen = document.getElementById("bootScreen");
const btnRegister = document.getElementById("btnRegister");
const btnLogin = document.getElementById("btnLogin");
const bootUser = document.getElementById("bootUser");
const bootPass = document.getElementById("bootPass");
const bootMsg = document.getElementById("bootMsg");

/* -----------------------------
   CANVAS RESIZE
------------------------------ */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

/* -----------------------------
   UTILS
------------------------------ */
function logSys(msg) {
  const t = new Date().toLocaleTimeString();
  sysLog.innerHTML = `<div><b>[${t}]</b> ${msg}</div>` + sysLog.innerHTML;
}

function logChat(msg) {
  chatLog.innerHTML += `<div style="margin:6px 0;"><b>AI:</b> ${msg}</div>`;
  chatLog.scrollTop = chatLog.scrollHeight;
}

function rand(seed) {
  // xorshift
  let x = seed || 123456789;
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;
  return Math.abs(x) / 0x7fffffff;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function deepCopy(o) {
  return JSON.parse(JSON.stringify(o));
}

function hashStringToInt(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* -----------------------------
   ACCOUNT SYSTEM (LOCAL)
------------------------------ */
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function setUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(username) {
  localStorage.setItem(SESSION_KEY, username);
}

function getSession() {
  return localStorage.getItem(SESSION_KEY) || "";
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function registerUser(username, password) {
  username = (username || "").trim().toLowerCase();
  password = (password || "").trim();

  if (!username || username.length < 3) return "用戶名最少3個字";
  if (!password || password.length < 3) return "密碼最少3個字";

  const users = getUsers();
  if (users[username]) return "此用戶名已存在";

  users[username] = {
    passwordHash: hashStringToInt(password + "|salt|" + username),
    createdAt: Date.now(),
    mainPlanet: PLANETS[Math.floor(Math.random() * PLANETS.length)].id,
  };

  setUsers(users);
  return "";
}

function loginUser(username, password) {
  username = (username || "").trim().toLowerCase();
  password = (password || "").trim();

  const users = getUsers();
  if (!users[username]) return "用戶不存在";

  const h = hashStringToInt(password + "|salt|" + username);
  if (h !== users[username].passwordHash) return "密碼錯誤";

  return "";
}

/* -----------------------------
   SAVE SYSTEM
------------------------------ */
function saveKey(username) {
  return SAVE_KEY_PREFIX + username;
}

function loadSave(username) {
  try {
    const raw = localStorage.getItem(saveKey(username));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeSave(username, state) {
  localStorage.setItem(saveKey(username), JSON.stringify(state));
}

/* -----------------------------
   WORLD GEN
------------------------------ */
function genWorld(seed, biome) {
  const s = hashStringToInt(seed + "|" + biome);
  const world = {
    seed,
    biome,
    tiles: [],
    animals: [],
    rivers: []
  };

  // tiles: 0 grass, 1 water, 2 mountain, 3 forest, 4 ore
  for (let y = 0; y < MAP_H; y++) {
    world.tiles[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      const n = rand(s + x * 999 + y * 777);

      let t = 0; // grass
      if (n < 0.08) t = 1; // water
      else if (n < 0.14) t = 2; // mountain
      else if (n < 0.30) t = 3; // forest
      else if (n > 0.94) t = 4; // ore

      // biome tuning
      if (biome === "desert") {
        if (t === 1) t = 0;
        if (t === 3) t = 0;
        if (n > 0.90) t = 4;
      }
      if (biome === "ocean") {
        if (n < 0.25) t = 1;
      }
      if (biome === "ice") {
        if (t === 1) t = 1;
        if (t === 3 && n < 0.20) t = 0;
      }
      if (biome === "lava") {
        if (n < 0.12) t = 2;
        if (n < 0.06) t = 4;
      }
      if (biome === "blackhole") {
        if (n < 0.20) t = 2;
        if (n < 0.06) t = 4;
      }

      world.tiles[y][x] = t;
    }
  }

  // generate rivers
  for (let r = 0; r < 3; r++) {
    let rx = Math.floor(rand(s + 9000 + r * 111) * MAP_W);
    let ry = Math.floor(rand(s + 9100 + r * 222) * MAP_H);

    const path = [];
    for (let i = 0; i < 180; i++) {
      path.push({ x: rx, y: ry });
      world.tiles[ry][rx] = 1;

      const d = rand(s + 9200 + i * 333 + r * 555);
      if (d < 0.25) rx++;
      else if (d < 0.5) rx--;
      else if (d < 0.75) ry++;
      else ry--;

      rx = clamp(rx, 1, MAP_W - 2);
      ry = clamp(ry, 1, MAP_H - 2);
    }
    world.rivers.push(path);
  }

  // animals
  for (let i = 0; i < 25; i++) {
    const ax = Math.floor(rand(s + 20000 + i * 999) * MAP_W);
    const ay = Math.floor(rand(s + 21000 + i * 777) * MAP_H);
    if (world.tiles[ay][ax] !== 1) {
      world.animals.push({ x: ax, y: ay, t: (i % 3) });
    }
  }

  return world;
}

/* -----------------------------
   GAME STATE
------------------------------ */
let username = "";
let userMainPlanet = "";
let currentPlanet = "";
let world = null;

let state = null;

function newGameState(seedPlanetId) {
  return {
    version: VERSION,
    createdAt: Date.now(),
    lastRealTime: Date.now(),

    // time
    gameYear: 0,

    // resources
    coins: 100,
    aeno: 0.0,
    wood: 120,
    stone: 80,
    iron: 20,
    food: 100,

    pop: 10,
    robots: 1,

    // map
    territory: {
      cx: Math.floor(MAP_W / 2),
      cy: Math.floor(MAP_H / 2),
      radius: START_TERRITORY_RADIUS
    },

    buildings: [], // {x,y,type,lv}

    // modes
    mode: "build", // build / upgrade
    autoBuild: true,
    autoPriorities: ["house", "lumber", "farm"],

    // ad music
    loopSong: true,
    lastAdRewardAt: 0,

    // pronounce mining
    pronounceHistory: [],

    // planet lock
    mainPlanet: seedPlanetId,

    // black hole unlock
    blackHoleUnlocked: false
  };
}

/* -----------------------------
   GAME INIT / LOAD
------------------------------ */
function initForUser(u) {
  username = u;
  const users = getUsers();
  userMainPlanet = users[u].mainPlanet;

  const save = loadSave(username);
  if (save) {
    state = save;
    if (!state.mainPlanet) state.mainPlanet = userMainPlanet;
    logSys("✅ 已載入玩家存檔");
  } else {
    state = newGameState(userMainPlanet);
    logSys("✨ 新玩家建立新世界");
    writeSave(username, state);
  }

  // 玩家只能入自己主星球
  currentPlanet = state.mainPlanet;

  // world gen based on user + planet
  const planetObj = PLANETS.find(p => p.id === currentPlanet) || PLANETS[0];
  world = genWorld(username + "|" + currentPlanet, planetObj.biome);

  elPlanetName.textContent = planetObj.name;
  bootScreen.style.display = "none";

  // assistant
  if (window.AENO_CHARACTERS && window.AENO_CHARACTERS.length > 0) {
    const idx = Math.floor(Math.random() * window.AENO_CHARACTERS.length);
    assistantFace.textContent = window.AENO_CHARACTERS[idx].face;
    assistantName.textContent = window.AENO_CHARACTERS[idx].name;
  }

  // offline progress
  applyOfflineProgress();

  updateUI();
  logSys("🌍 主星球鎖定：" + planetObj.name);
}

/* -----------------------------
   OFFLINE PROGRESS
------------------------------ */
function applyOfflineProgress() {
  const now = Date.now();
  const dt = (now - (state.lastRealTime || now)) / 1000;
  if (dt <= 5) {
    state.lastRealTime = now;
    return;
  }

  // dt seconds => game years
  const gainedYears = dt / REAL_SECONDS_PER_GAME_YEAR;

  state.gameYear += gainedYears;

  // passive production based on buildings
  let addWood = 0, addStone = 0, addIron = 0, addFood = 0, addCoins = 0, addPop = 0;

  for (const b of state.buildings) {
    const def = BUILDINGS[b.type];
    if (!def) continue;

    const mult = 1 + (b.lv - 1) * 0.55;
    const years = gainedYears;

    if (def.produce.wood) addWood += def.produce.wood * mult * years;
    if (def.produce.stone) addStone += def.produce.stone * mult * years;
    if (def.produce.iron) addIron += def.produce.iron * mult * years;
    if (def.produce.food) addFood += def.produce.food * mult * years;
    if (def.produce.coins) addCoins += def.produce.coins * mult * years;
    if (def.produce.pop) addPop += def.produce.pop * mult * years;
  }

  // cap pop growth
  state.pop += Math.floor(addPop * 0.02);

  state.wood += Math.floor(addWood);
  state.stone += Math.floor(addStone);
  state.iron += Math.floor(addIron);
  state.food += Math.floor(addFood);
  state.coins += Math.floor(addCoins);

  state.lastRealTime = now;
  logSys(`⏳ 離線補算：+${gainedYears.toFixed(1)} 年`);
}

/* -----------------------------
   UI UPDATE
------------------------------ */
function countBuildings(type) {
  return state.buildings.filter(b => b.type === type).length;
}

function updateUI() {
  elGameYear.textContent = Math.floor(state.gameYear);
  elPop.textContent = Math.floor(state.pop);

  elCoins.textContent = Math.floor(state.coins);
  elAeno.textContent = state.aeno.toFixed(4);

  elWood.textContent = Math.floor(state.wood);
  elStone.textContent = Math.floor(state.stone);
  elIron.textContent = Math.floor(state.iron);
  elFood.textContent = Math.floor(state.food);

  elHouseCount.textContent = countBuildings("house");
  elFactoryCount.textContent = countBuildings("factory");
  elRobotCount.textContent = state.robots;

  elAutoState.textContent = state.autoBuild ? "ON" : "OFF";
  elLoopState.textContent = state.loopSong ? "ON" : "OFF";
}

/* -----------------------------
   CAMERA / INPUT
------------------------------ */
let camX = MAP_W * TILE_SIZE / 2;
let camY = MAP_H * TILE_SIZE / 2;
let zoom = 1;

let dragging = false;
let lastTouch = null;

function screenToWorld(px, py) {
  const wx = (px - canvas.width / 2) / zoom + camX;
  const wy = (py - canvas.height / 2) / zoom + camY;
  return { wx, wy };
}

function worldToTile(wx, wy) {
  return {
    tx: Math.floor(wx / TILE_SIZE),
    ty: Math.floor(wy / TILE_SIZE)
  };
}

function isInTerritory(tx, ty) {
  const dx = tx - state.territory.cx;
  const dy = ty - state.territory.cy;
  return (dx * dx + dy * dy) <= (state.territory.radius * state.territory.radius);
}

canvas.addEventListener("mousedown", (e) => {
  dragging = true;
  lastTouch = { x: e.clientX, y: e.clientY };
});

window.addEventListener("mouseup", () => {
  dragging = false;
  lastTouch = null;
});

window.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastTouch.x;
  const dy = e.clientY - lastTouch.y;
  camX -= dx / zoom;
  camY -= dy / zoom;
  lastTouch = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const z = e.deltaY > 0 ? 0.92 : 1.08;
  zoom = clamp(zoom * z, 0.5, 2.5);
}, { passive: false });

// mobile touch drag/zoom
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    dragging = true;
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2) {
    dragging = false;
    lastTouch = {
      d: Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
    };
  }
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();

  if (e.touches.length === 1 && dragging) {
    const dx = e.touches[0].clientX - lastTouch.x;
    const dy = e.touches[0].clientY - lastTouch.y;
    camX -= dx / zoom;
    camY -= dy / zoom;
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2) {
    const nd = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );

    const ratio = nd / lastTouch.d;
    zoom = clamp(zoom * ratio, 0.5, 2.5);
    lastTouch.d = nd;
  }
}, { passive: false });

canvas.addEventListener("touchend", () => {
  dragging = false;
  lastTouch = null;
});

canvas.addEventListener("click", (e) => {
  const p = screenToWorld(e.clientX, e.clientY);
  const t = worldToTile(p.wx, p.wy);

  if (t.tx < 0 || t.ty < 0 || t.tx >= MAP_W || t.ty >= MAP_H) return;

  if (!isInTerritory(t.tx, t.ty)) {
    logSys("⚠️ 不是領土，不能建築！");
    return;
  }

  const existing = state.buildings.find(b => b.x === t.tx && b.y === t.ty);

  if (state.mode === "build") {
    if (existing) {
      logSys("⚠️ 這裡已經有建築");
      return;
    }
    openBuildMenu(t.tx, t.ty);
  } else if (state.mode === "upgrade") {
    if (!existing) {
      logSys("⚠️ 這裡沒有建築可以升級");
      return;
    }
    upgradeBuilding(existing);
  }
});

/* -----------------------------
   BUILD / UPGRADE
------------------------------ */
function costFor(def, lv) {
  const mult = 1 + (lv - 1) * 0.8;
  const c = {};
  for (const k in def.baseCost) {
    c[k] = Math.floor(def.baseCost[k] * mult);
  }
  return c;
}

function canAfford(cost) {
  if (cost.wood && state.wood < cost.wood) return false;
  if (cost.stone && state.stone < cost.stone) return false;
  if (cost.iron && state.iron < cost.iron) return false;
  if (cost.food && state.food < cost.food) return false;
  if (cost.coins && state.coins < cost.coins) return false;
  return true;
}

function payCost(cost) {
  if (cost.wood) state.wood -= cost.wood;
  if (cost.stone) state.stone -= cost.stone;
  if (cost.iron) state.iron -= cost.iron;
  if (cost.food) state.food -= cost.food;
  if (cost.coins) state.coins -= cost.coins;
}

function openBuildMenu(tx, ty) {
  // 簡化用 prompt (避免UI過大)
  const options = Object.values(BUILDINGS).map(b => `${b.icon}${b.id}`).join(", ");
  const ans = prompt(
    `建築列表:\n${options}\n\n輸入建築ID: (house/lumber/farm/mine/factory/wall)`
  );

  if (!ans) return;
  const id = ans.trim().toLowerCase();
  const def = BUILDINGS[id];
  if (!def) {
    logSys("❌ 無此建築");
    return;
  }

  const cost = costFor(def, 1);
  if (!canAfford(cost)) {
    logSys("❌ 資源不足，無法建築");
    return;
  }

  payCost(cost);
  state.buildings.push({ x: tx, y: ty, type: id, lv: 1 });

  logSys(`✅ 建造 ${def.icon}${def.name} (Lv1)`);
  updateUI();
}

function upgradeBuilding(b) {
  const def = BUILDINGS[b.type];
  if (!def) return;

  if (b.lv >= def.maxLv) {
    logSys("⚠️ 已達最高等級");
    return;
  }

  const nextLv = b.lv + 1;
  const cost = costFor(def, nextLv);

  if (!canAfford(cost)) {
    logSys("❌ 升級資源不足");
    return;
  }

  payCost(cost);
  b.lv = nextLv;

  logSys(`⬆️ ${def.icon}${def.name} 升級到 Lv${b.lv}`);
  updateUI();
}

/* -----------------------------
   AUTO BUILD AI
------------------------------ */
function aiAutoBuildTick() {
  if (!state.autoBuild) return;

  // AI不可以亂花晒資源：保留最低
  const reserve = {
    wood: 80,
    stone: 60,
    iron: 20,
    food: 60,
    coins: 80
  };

  function safeAfford(cost) {
    if (cost.wood && state.wood - cost.wood < reserve.wood) return false;
    if (cost.stone && state.stone - cost.stone < reserve.stone) return false;
    if (cost.iron && state.iron - cost.iron < reserve.iron) return false;
    if (cost.food && state.food - cost.food < reserve.food) return false;
    if (cost.coins && state.coins - cost.coins < reserve.coins) return false;
    return true;
  }

  // 找空地
  const empties = [];
  for (let i = 0; i < 120; i++) {
    const rx = state.territory.cx + Math.floor((Math.random() - 0.5) * state.territory.radius * 2);
    const ry = state.territory.cy + Math.floor((Math.random() - 0.5) * state.territory.radius * 2);

    if (rx < 1 || ry < 1 || rx >= MAP_W - 1 || ry >= MAP_H - 1) continue;
    if (!isInTerritory(rx, ry)) continue;
    if (state.buildings.find(b => b.x === rx && b.y === ry)) continue;

    empties.push({ x: rx, y: ry });
  }

  if (empties.length <= 0) return;

  // 多優先順序
  for (const prio of state.autoPriorities) {
    const def = BUILDINGS[prio];
    if (!def) continue;

    const cost = costFor(def, 1);
    if (!safeAfford(cost)) continue;

    // build
    const pos = empties[Math.floor(Math.random() * empties.length)];
    payCost(cost);
    state.buildings.push({ x: pos.x, y: pos.y, type: prio, lv: 1 });

    logSys(`🤖 AI助手建造：${def.icon}${def.name}`);
    updateUI();
    return;
  }
}

/* -----------------------------
   ECONOMY TICK
------------------------------ */
function productionTick(dtYears) {
  // dtYears: game years delta

  let addWood = 0, addStone = 0, addIron = 0, addFood = 0, addCoins = 0;

  for (const b of state.buildings) {
    const def = BUILDINGS[b.type];
    if (!def) continue;

    const mult = 1 + (b.lv - 1) * 0.55;

    if (def.produce.wood) addWood += def.produce.wood * mult * dtYears;
    if (def.produce.stone) addStone += def.produce.stone * mult * dtYears;
    if (def.produce.iron) addIron += def.produce.iron * mult * dtYears;
    if (def.produce.food) addFood += def.produce.food * mult * dtYears;
    if (def.produce.coins) addCoins += def.produce.coins * mult * dtYears;
  }

  // population consume food
  const consumeFood = state.pop * 0.03 * dtYears;
  state.food -= consumeFood;

  if (state.food < 0) {
    state.food = 0;
    state.pop -= 0.1 * dtYears;
    if (state.pop < 1) state.pop = 1;
  }

  state.wood += addWood;
  state.stone += addStone;
  state.iron += addIron;
  state.food += addFood;
  state.coins += addCoins;

  // cap
  state.wood = Math.min(state.wood, 9999999);
  state.stone = Math.min(state.stone, 9999999);
  state.iron = Math.min(state.iron, 9999999);
  state.food = Math.min(state.food, 9999999);
  state.coins = Math.min(state.coins, 9999999);
}

/* -----------------------------
   ROBOT EXPLORE (20 PLANETS)
------------------------------ */
function robotExplore() {
  if (state.robots <= 0) {
    logSys("❌ 沒有機器人");
    return;
  }

  const planet = PLANETS[Math.floor(Math.random() * PLANETS.length)];

  // random resource reward
  const r = Math.random();
  let reward = { wood: 0, stone: 0, iron: 0, food: 0, coins: 0 };

  if (r < 0.25) reward.wood = 80 + Math.floor(Math.random() * 60);
  else if (r < 0.50) reward.food = 80 + Math.floor(Math.random() * 60);
  else if (r < 0.75) reward.stone = 60 + Math.floor(Math.random() * 60);
  else reward.iron = 30 + Math.floor(Math.random() * 40);

  // add coins
  reward.coins = 30 + Math.floor(Math.random() * 40);

  state.wood += reward.wood;
  state.stone += reward.stone;
  state.iron += reward.iron;
  state.food += reward.food;
  state.coins += reward.coins;

  // AENO chance based on last pronunciation score
  let lastScore = 0;
  if (state.pronounceHistory.length > 0) {
    lastScore = state.pronounceHistory[state.pronounceHistory.length - 1].score;
  }

  let chance = 0.05 + (lastScore / 100) * 0.30;
  if (Math.random() < chance) {
    const drop = AENO_BASE_DROP + (lastScore * AENO_SCORE_BONUS_MULT * 0.0001);
    state.aeno += drop;
    logSys(`🚀 機器人探索 ${planet.name} 成功！獲得資源 + 掉落AENO ${drop.toFixed(5)}`);
  } else {
    logSys(`🚀 機器人探索 ${planet.name} 成功！獲得資源`);
  }

  updateUI();
}

/* -----------------------------
   AD SONG SYSTEM
------------------------------ */
let audio = null;

function playAdSong() {
  try {
    if (!audio) {
      audio = new Audio("./ad_song.mp3"); // 如果無檔案會fail，但不影響遊戲
      audio.loop = state.loopSong;
    }

    audio.loop = state.loopSong;
    audio.currentTime = 0;

    audio.play().then(() => {
      logSys("🎵 廣告歌播放中...");
      giveAdReward();
    }).catch(() => {
      logSys("⚠️ 無法自動播放（瀏覽器限制），請再按一次");
    });

  } catch (e) {
    logSys("⚠️ 播放失敗：缺少 ad_song.mp3");
  }
}

function giveAdReward() {
  const now = Date.now();
  if (now - state.lastAdRewardAt < 60000) {
    logSys("⏳ 1分鐘內只可領一次廣告獎勵");
    return;
  }
  state.lastAdRewardAt = now;

  // reward
  const coins = 50 + Math.floor(Math.random() * 60);
  const wood = 30 + Math.floor(Math.random() * 30);

  state.coins += coins;
  state.wood += wood;

  // tiny aeno chance
  if (Math.random() < 0.10) {
    state.aeno += 0.0002;
    logSys(`🎁 廣告獎勵：+${coins}金幣 +${wood}木 +0.0002 AENO`);
  } else {
    logSys(`🎁 廣告獎勵：+${coins}金幣 +${wood}木`);
  }

  updateUI();
}

/* -----------------------------
   PRONUNCIATION MINING
------------------------------ */
function pronounceMining() {
  const word = PRONOUNCE_WORDS[Math.floor(Math.random() * PRONOUNCE_WORDS.length)];

  // 暫時用文字模擬
  const input = prompt(
    `🗣️ 發音挖礦 (模擬)\n\n請輸入你讀出的英文：\n【${word.zh}】英文是：${word.en}\n\n輸入你讀到的字 (例如: wood)`
  );

  if (!input) return;

  const typed = input.trim().toLowerCase();
  const correct = word.en.toLowerCase();

  // score simulate
  let score = 0;
  if (typed === correct) score = 100;
  else {
    // similarity rough
    let same = 0;
    for (let i = 0; i < Math.min(typed.length, correct.length); i++) {
      if (typed[i] === correct[i]) same++;
    }
    score = Math.floor((same / correct.length) * 100);
  }

  state.pronounceHistory.push({
    t: Date.now(),
    zh: word.zh,
    en: word.en,
    input: typed,
    score
  });

  if (score < 40) {
    logSys(`❌ 發音不合格 (${score}%)，必須≥40%`);
    updateUI();
    return;
  }

  // reward fragments + chance aeno
  const fragments = 1 + Math.floor(score / 25);
  const coins = 10 + Math.floor(score / 4);

  state.coins += coins;

  // aeno drop
  const chance = 0.05 + (score / 100) * 0.40;
  if (Math.random() < chance) {
    const drop = AENO_BASE_DROP + (score * AENO_SCORE_BONUS_MULT * 0.0001);
    state.aeno += drop;
    logSys(`🗣️ 合格(${score}%)！獲得碎片x${fragments} +${coins}金幣 +AENO ${drop.toFixed(5)}`);
  } else {
    logSys(`🗣️ 合格(${score}%)！獲得碎片x${fragments} +${coins}金幣`);
  }

  updateUI();
}

/* -----------------------------
   PANEL / BUTTON EVENTS
------------------------------ */
togglePanelBtn.onclick = () => {
  panel.classList.toggle("hidden");
};

btnHidePanel.onclick = () => {
  panel.classList.add("hidden");
};

btnSave.onclick = () => {
  writeSave(username, state);
  logSys("💾 已保存");
};

btnBuildMode.onclick = () => {
  state.mode = "build";
  logSys("🏗️ 已切換：建築模式");
};

btnUpgradeMode.onclick = () => {
  state.mode = "upgrade";
  logSys("⬆️ 已切換：升級模式");
};

btnAuto.onclick = () => {
  state.autoBuild = !state.autoBuild;
  logSys("🤖 自動建造：" + (state.autoBuild ? "ON" : "OFF"));
  updateUI();
};

btnLoopSong.onclick = () => {
  state.loopSong = !state.loopSong;
  if (audio) audio.loop = state.loopSong;
  logSys("🔁 Loop：" + (state.loopSong ? "ON" : "OFF"));
  updateUI();
};

btnAdSong.onclick = () => {
  playAdSong();
};

btnRobotSend.onclick = () => {
  robotExplore();
};

btnExchange.onclick = () => {
  const ans = prompt(
    `🏦 交易所 (簡化)\n價格：木=${MARKET.wood} 金幣 / 石=${MARKET.stone} / 鐵=${MARKET.iron} / 糧=${MARKET.food}\n\n輸入格式：sell wood 50\n或 buy iron 10`
  );
  if (!ans) return;

  const parts = ans.trim().toLowerCase().split(/\s+/);
  if (parts.length !== 3) {
    logSys("❌ 格式錯誤");
    return;
  }

  const action = parts[0];
  const res = parts[1];
  const amt = parseInt(parts[2]);

  if (!MARKET[res] || isNaN(amt) || amt <= 0) {
    logSys("❌ 參數錯誤");
    return;
  }

  const price = MARKET[res] * amt;

  if (action === "sell") {
    if (state[res] < amt) {
      logSys("❌ 資源不足");
      return;
    }
    state[res] -= amt;
    state.coins += price;
    logSys(`🏦 賣出 ${res} x${amt}，獲得 ${price} 金幣`);
  } else if (action === "buy") {
    if (state.coins < price) {
      logSys("❌ 金幣不足");
      return;
    }
    state.coins -= price;
    state[res] += amt;
    logSys(`🏦 買入 ${res} x${amt}，花費 ${price} 金幣`);
  } else {
    logSys("❌ 只能 buy 或 sell");
    return;
  }

  updateUI();
};

btnTech.onclick = () => {
  alert("🧬 科技樹：下一版加入（會影響AI、礦場效率、機器人成功率、黑洞資格）");
};

btnPlanetInfo.onclick = () => {
  alert(
    `🪐 星球系統：\n玩家只能有主星球（防止亂跳bug）\n\n🤖 機器人會隨機去20星球探索。\n\n黑洞孤島：暫時只有開發者可進。`
  );
};

btnPronounce.onclick = () => {
  pronounceMining();
};

btnLogout.onclick = () => {
  writeSave(username, state);
  clearSession();
  location.reload();
};

/* -----------------------------
   PRIORITY BUTTONS (MULTI SELECT)
------------------------------ */
document.querySelectorAll(".prioBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    const prio = btn.dataset.prio;
    if (!prio) return;

    const idx = state.autoPriorities.indexOf(prio);
    if (idx >= 0) {
      state.autoPriorities.splice(idx, 1);
      btn.style.opacity = "0.45";
      logSys("❌ 移除AI優先：" + prio);
    } else {
      state.autoPriorities.push(prio);
      btn.style.opacity = "1";
      logSys("✅ 加入AI優先：" + prio);
    }
  });
});

/* -----------------------------
   CHAT AI SIMPLE
------------------------------ */
assistantTalkBtn.onclick = () => {
  chatBox.classList.toggle("hidden");
};

chatClose.onclick = () => {
  chatBox.classList.add("hidden");
};

chatSend.onclick = () => {
  const txt = chatInput.value.trim();
  if (!txt) return;
  chatInput.value = "";

  chatLog.innerHTML += `<div style="margin:6px 0;"><b>你:</b> ${txt}</div>`;

  const t = txt.toLowerCase();

  if (t.includes("巡邏")) {
    logChat("我已派出偵察隊巡邏領土。領土邊界安全。");
  } else if (t.includes("收集")) {
    logChat("我建議你派機器人探索，收集更多資源。");
  } else if (t.includes("建造")) {
    logChat("你可以切換到🏗️建築模式，點領土空地建築。");
  } else if (t.includes("升級")) {
    logChat("切換到⬆️升級模式，點建築即可升級到10級。");
  } else if (t.includes("aeno")) {
    logChat("AENO挖礦方式：注意力 + 學習行為（發音挖礦）= 真資產成本。");
  } else {
    logChat("我明白。你可以叫我：建造、升級、派機器人、發音挖礦。");
  }
};

/* -----------------------------
   RENDER
------------------------------ */
function tileColor(t) {
  // 0 grass, 1 water, 2 mountain, 3 forest, 4 ore
  if (world.biome === "blackhole") {
    if (t === 0) return "#111827";
    if (t === 1) return "#0b1220";
    if (t === 2) return "#374151";
    if (t === 3) return "#1f2937";
    if (t === 4) return "#fbbf24";
  }

  if (t === 0) return "#86efac"; // grass
  if (t === 1) return "#60a5fa"; // water
  if (t === 2) return "#94a3b8"; // mountain
  if (t === 3) return "#22c55e"; // forest
  if (t === 4) return "#fbbf24"; // ore
  return "#ddd";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#eaf6ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const startX = camX - canvas.width / 2 / zoom;
  const startY = camY - canvas.height / 2 / zoom;
  const endX = camX + canvas.width / 2 / zoom;
  const endY = camY + canvas.height / 2 / zoom;

  const tx0 = clamp(Math.floor(startX / TILE_SIZE) - 1, 0, MAP_W - 1);
  const ty0 = clamp(Math.floor(startY / TILE_SIZE) - 1, 0, MAP_H - 1);
  const tx1 = clamp(Math.floor(endX / TILE_SIZE) + 1, 0, MAP_W - 1);
  const ty1 = clamp(Math.floor(endY / TILE_SIZE) + 1, 0, MAP_H - 1);

  // draw tiles
  for (let y = ty0; y <= ty1; y++) {
    for (let x = tx0; x <= tx1; x++) {
      const wx = x * TILE_SIZE;
      const wy = y * TILE_SIZE;

      const sx = (wx - camX) * zoom + canvas.width / 2;
      const sy = (wy - camY) * zoom + canvas.height / 2;

      ctx.fillStyle = tileColor(world.tiles[y][x]);
      ctx.fillRect(sx, sy, TILE_SIZE * zoom, TILE_SIZE * zoom);

      // non-territory shadow
      if (!isInTerritory(x, y)) {
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fillRect(sx, sy, TILE_SIZE * zoom, TILE_SIZE * zoom);
      }
    }
  }

  // animals
  for (const a of world.animals) {
    const wx = a.x * TILE_SIZE + TILE_SIZE / 2;
    const wy = a.y * TILE_SIZE + TILE_SIZE / 2;
    const sx = (wx - camX) * zoom + canvas.width / 2;
    const sy = (wy - camY) * zoom + canvas.height / 2;

    if (sx < -50 || sy < -50 || sx > canvas.width + 50 || sy > canvas.height + 50) continue;

    ctx.font = `${18 * zoom}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(a.t === 0 ? "🐗" : a.t === 1 ? "🦊" : "🦌", sx, sy);
  }

  // buildings
  for (const b of state.buildings) {
    const def = BUILDINGS[b.type];
    if (!def) continue;

    const wx = b.x * TILE_SIZE + TILE_SIZE / 2;
    const wy = b.y * TILE_SIZE + TILE_SIZE / 2;
    const sx = (wx - camX) * zoom + canvas.width / 2;
    const sy = (wy - camY) * zoom + canvas.height / 2;

    ctx.font = `${20 * zoom}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.icon, sx, sy);

    // lv
    ctx.font = `${10 * zoom}px system-ui`;
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Lv" + b.lv, sx, sy + 14 * zoom);
  }

  // territory circle indicator
  const tcx = state.territory.cx * TILE_SIZE + TILE_SIZE / 2;
  const tcy = state.territory.cy * TILE_SIZE + TILE_SIZE / 2;
  const sx = (tcx - camX) * zoom + canvas.width / 2;
  const sy = (tcy - camY) * zoom + canvas.height / 2;

  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx, sy, state.territory.radius * TILE_SIZE * zoom, 0, Math.PI * 2);
  ctx.stroke();

  requestAnimationFrame(draw);
}

/* -----------------------------
   GAME LOOP
------------------------------ */
let lastFrame = Date.now();

function tick() {
  const now = Date.now();
  const dtSec = (now - lastFrame) / 1000;
  lastFrame = now;

  const dtYears = dtSec / REAL_SECONDS_PER_GAME_YEAR;
  state.gameYear += dtYears;

  productionTick(dtYears);

  // auto build every ~3 seconds
  if (Math.random() < dtSec / 3.0) {
    aiAutoBuildTick();
  }

  // unlock black hole milestone (example)
  if (!state.blackHoleUnlocked && state.aeno >= 6.0) {
    state.blackHoleUnlocked = true;
    logSys("🌌 黑洞系統已啟動（6 AENO 里程碑）");
  }

  // autosave every 25 sec
  if (Math.random() < dtSec / 25) {
    writeSave(username, state);
  }

  updateUI();
  requestAnimationFrame(tick);
}

/* -----------------------------
   BOOT LOGIN EVENTS
------------------------------ */
btnRegister.onclick = () => {
  const u = bootUser.value;
  const p = bootPass.value;
  const err = registerUser(u, p);
  if (err) {
    bootMsg.textContent = err;
    return;
  }
  bootMsg.style.color = "#22c55e";
  bootMsg.textContent = "✅ 註冊成功，請登入";
};

btnLogin.onclick = () => {
  const u = bootUser.value.trim().toLowerCase();
  const p = bootPass.value;
  const err = loginUser(u, p);
  if (err) {
    bootMsg.style.color = "#ef4444";
    bootMsg.textContent = err;
    return;
  }
  setSession(u);
  initForUser(u);
};

/* -----------------------------
   AUTO SESSION
------------------------------ */
(function autoStart() {
  const sess = getSession();
  if (sess) {
    initForUser(sess);
  } else {
    bootScreen.style.display = "flex";
  }
})();

/* -----------------------------
   START LOOP
------------------------------ */
draw();
tick();
