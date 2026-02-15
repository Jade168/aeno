/* =========================================================
   AENO V3 - Mobile Portrait Cartoon Empire
   - Canvas 2D (NO Phaser)
   - Login/Register Local Save
   - Planet locked per account
   - 20 planets for robots, Black Hole island only dev
   - Time speed: 1 day real = 10 years game
   - Offline simulation max 24 hours
   - Auto-build controlled (won't burn all resources)
   - Click territory empty tile => quick build popup
   - Upgrade infinite levels
   - Pronunciation mining simulation (40% pass)
   - AENO hidden formula mapping
   - Terrain: forest, river, mountain, ore nodes, animals
   - Zoom/drag strong support
========================================================= */

"use strict";

/* =========================
   VERSION
========================= */
const GAME_VERSION = "AENO-V3.1.0";
const VER_UI = document.getElementById("verText");
if (VER_UI) VER_UI.textContent = GAME_VERSION;

/* =========================
   DOM
========================= */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

const bootScreen = document.getElementById("bootScreen");

const loginScreen = document.getElementById("loginScreen");
const planetSelectScreen = document.getElementById("planetSelectScreen");

const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const btnRegister = document.getElementById("btnRegister");
const btnLogin = document.getElementById("btnLogin");

const planetGrid = document.getElementById("planetGrid");
const btnConfirmPlanet = document.getElementById("btnConfirmPlanet");

const assistantTalkBtn = document.getElementById("assistantTalkBtn");
const assistantNameEl = document.getElementById("assistantName");
const assistantBodyEl = document.getElementById("assistantBody");

const chatBox = document.getElementById("chatBox");
const chatClose = document.getElementById("chatClose");
const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

const mainPanel = document.getElementById("mainPanel");
const panelHeader = document.getElementById("panelHeader");
const panelMinBtn = document.getElementById("panelMinBtn");
const panelHideBtn = document.getElementById("panelHideBtn");
const panelRestoreBtn = document.getElementById("panelRestoreBtn");

const tabBtns = document.querySelectorAll(".tabBtn");
const tabPages = document.querySelectorAll(".tabPage");

const uiPlanet = document.getElementById("uiPlanet");
const uiYear = document.getElementById("uiYear");
const uiPop = document.getElementById("uiPop");
const uiWorkers = document.getElementById("uiWorkers");
const uiCoins = document.getElementById("uiCoins");
const uiAeno = document.getElementById("uiAeno");
const uiWood = document.getElementById("uiWood");
const uiStone = document.getElementById("uiStone");
const uiIron = document.getElementById("uiIron");
const uiFood = document.getElementById("uiFood");

const btnToggleAuto = document.getElementById("btnToggleAuto");
const autoTxt = document.getElementById("autoTxt");
const btnSaveNow = document.getElementById("btnSaveNow");

const buildList = document.getElementById("buildList");

const btnUpgradeMode = document.getElementById("btnUpgradeMode");
const btnExitUpgrade = document.getElementById("btnExitUpgrade");
const upgradeInfo = document.getElementById("upgradeInfo");

const btnRobotExplore = document.getElementById("btnRobotExplore");
const btnRobotRecall = document.getElementById("btnRobotRecall");
const robotStatus = document.getElementById("robotStatus");

const marketRes = document.getElementById("marketRes");
const marketQty = document.getElementById("marketQty");
const btnBuy = document.getElementById("btnBuy");
const btnSell = document.getElementById("btnSell");
const marketInfo = document.getElementById("marketInfo");

const techList = document.getElementById("techList");

const pronounceTarget = document.getElementById("pronounceTarget");
const pronounceInput = document.getElementById("pronounceInput");
const btnPronounceTest = document.getElementById("btnPronounceTest");
const btnPronounceNext = document.getElementById("btnPronounceNext");
const pronounceResult = document.getElementById("pronounceResult");

const btnPlayAd = document.getElementById("btnPlayAd");
const btnToggleLoop = document.getElementById("btnToggleLoop");
const loopTxt = document.getElementById("loopTxt");
const adStatus = document.getElementById("adStatus");
const adAudio = document.getElementById("adAudio");

const sysLog = document.getElementById("sysLog");

/* =========================
   CANVAS RESIZE
========================= */
function resizeCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* =========================
   UTILS
========================= */
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rand(a, b) { return a + Math.random() * (b - a); }
function randi(a, b) { return Math.floor(rand(a, b)); }
function now() { return Date.now(); }

function formatAeno(x){
  return (Math.floor(x * 10000) / 10000).toFixed(4);
}

function logSys(msg){
  const t = new Date().toLocaleTimeString();
  const line = `[${t}] ${msg}`;
  console.log(line);
  if(sysLog){
    sysLog.innerHTML = `<div>${escapeHtml(line)}</div>` + sysLog.innerHTML;
  }
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

/* =========================
   GAME CONSTANTS
========================= */
const TILE = 46;

const WORLD_W = 80;
const WORLD_H = 80;

const TERRAIN = {
  GRASS: 0,
  FOREST: 1,
  RIVER: 2,
  MOUNTAIN: 3,
  ORE: 4,
  DESERT: 5
};

const BUILDINGS = {
  HOUSE: "house",
  FARM: "farm",
  LUMBER: "lumber",
  MINE: "mine",
  QUARRY: "quarry",
  FACTORY: "factory",
  MARKET: "market",
  WALL: "wall",
  TOWER: "tower"
};

const BUILD_META = {
  [BUILDINGS.HOUSE]: {
    name: "🏠 房屋",
    baseCost: { coins: 120, wood: 40, stone: 10, iron: 0, food: 0 },
    desc: "增加人口上限 + 稅收",
    require: null
  },
  [BUILDINGS.FARM]: {
    name: "🌾 農田",
    baseCost: { coins: 80, wood: 20, stone: 0, iron: 0, food: 0 },
    desc: "產出糧食",
    require: null
  },
  [BUILDINGS.LUMBER]: {
    name: "🪓 伐木場",
    baseCost: { coins: 100, wood: 30, stone: 0, iron: 0, food: 0 },
    desc: "必須靠近森林，產出木材",
    require: "forest"
  },
  [BUILDINGS.MINE]: {
    name: "⛏️ 鐵礦場",
    baseCost: { coins: 160, wood: 40, stone: 10, iron: 0, food: 0 },
    desc: "必須靠近礦脈，產出鐵",
    require: "ore"
  },
  [BUILDINGS.QUARRY]: {
    name: "🪨 石礦場",
    baseCost: { coins: 140, wood: 30, stone: 0, iron: 0, food: 0 },
    desc: "靠近山地產石",
    require: "mountain"
  },
  [BUILDINGS.FACTORY]: {
    name: "🏭 工廠",
    baseCost: { coins: 420, wood: 100, stone: 80, iron: 50, food: 0 },
    desc: "產出金幣與機器人零件",
    require: null
  },
  [BUILDINGS.MARKET]: {
    name: "🏦 市場",
    baseCost: { coins: 260, wood: 60, stone: 40, iron: 0, food: 0 },
    desc: "提高交易效率",
    require: null
  },
  [BUILDINGS.WALL]: {
    name: "🧱 城牆",
    baseCost: { coins: 90, wood: 0, stone: 40, iron: 0, food: 0 },
    desc: "防禦（獸潮需要 100% 城牆才觸發）",
    require: null
  },
  [BUILDINGS.TOWER]: {
    name: "🏰 箭塔",
    baseCost: { coins: 140, wood: 20, stone: 40, iron: 10, food: 0 },
    desc: "防禦與警戒",
    require: null
  }
};

/* =========================
   TECH TREE
========================= */
const TECHS = [
  { id:"agri1", name:"🌾 農業 I", cost: 200, desc:"農田 +25% 產出", effect:{ farm:1.25 } },
  { id:"wood1", name:"🪵 林業 I", cost: 240, desc:"伐木場 +25% 產出", effect:{ lumber:1.25 } },
  { id:"mine1", name:"⛏️ 採礦 I", cost: 260, desc:"礦場 +25% 產出", effect:{ mine:1.25, quarry:1.25 } },
  { id:"tax1", name:"🪙 稅制 I", cost: 300, desc:"房屋稅收 +30%", effect:{ tax:1.3 } },
  { id:"robot1", name:"🤖 機器人 I", cost: 520, desc:"探索效率 +30%", effect:{ robot:1.3 } }
];

/* =========================
   PLANETS
========================= */
const PLANETS = [
  { id:"terra", name:"Terra", theme:"grass", bonus:{ food:1.1 } },
  { id:"verdia", name:"Verdia", theme:"forest", bonus:{ wood:1.2 } },
  { id:"ferros", name:"Ferros", theme:"ore", bonus:{ iron:1.2 } },
  { id:"sahar", name:"Sahar", theme:"desert", bonus:{ coins:1.15 } },
  { id:"glacia", name:"Glacia", theme:"river", bonus:{ food:1.05, stone:1.05 } },
  { id:"montis", name:"Montis", theme:"mountain", bonus:{ stone:1.2 } },
  { id:"noctis", name:"Noctis", theme:"dark", bonus:{ aenoChance:1.05 } },
  { id:"aurora", name:"Aurora", theme:"color", bonus:{ coins:1.1 } }
];

// Robots explore pool (20 planets)
const ROBOT_PLANETS = [
  "Terra-I","Terra-II","Verdia-X","Ferros-V","Sahar-A","Glacia-B","Montis-C","Noctis-D",
  "Orion-E","Luma-F","Hydra-G","Draco-H","Vega-I","Nyx-J","Eden-K","Nova-L","Sol-M",
  "Arca-N","Zeno-O","Mythos-P"
];

// Black hole island (developer)
const BLACK_HOLE = { id:"blackhole", name:"Black Hole - Dev Island" };

/* =========================
   SAVE SYSTEM
========================= */
const SAVE_KEY = "AENO_V3_SAVE_USERS";

function loadAllUsers(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return {};
    return JSON.parse(raw);
  }catch(e){
    return {};
  }
}

function saveAllUsers(obj){
  localStorage.setItem(SAVE_KEY, JSON.stringify(obj));
}

function hashPass(p){
  // simple hash (not secure) - placeholder
  let h = 0;
  for(let i=0;i<p.length;i++){
    h = ((h<<5)-h) + p.charCodeAt(i);
    h |= 0;
  }
  return "H" + Math.abs(h);
}

/* =========================
   GAME STATE
========================= */
let CURRENT_USER = null;
let CURRENT_DATA = null;

let running = false;

const state = {
  camera: {
    x: 0,
    y: 0,
    zoom: 1.0
  },
  input: {
    dragging: false,
    lastX: 0,
    lastY: 0,
    pinchDist: 0,
    pinchZoom: 1
  },
  ui: {
    buildMode: false,
    upgradeMode: false,
    selectedBuild: null,
    loopSong: true,
    autoBuild: true
  }
};

/* =========================
   WORLD DATA
========================= */
function createEmptyWorld(seedTheme){
  const terrain = [];
  for(let y=0;y<WORLD_H;y++){
    const row = [];
    for(let x=0;x<WORLD_W;x++){
      row.push(TERRAIN.GRASS);
    }
    terrain.push(row);
  }

  // Base terrain generation
  for(let y=0;y<WORLD_H;y++){
    for(let x=0;x<WORLD_W;x++){
      let t = TERRAIN.GRASS;

      if(seedTheme === "forest"){
        if(Math.random() < 0.35) t = TERRAIN.FOREST;
      } else if(seedTheme === "ore"){
        if(Math.random() < 0.12) t = TERRAIN.ORE;
        if(Math.random() < 0.10) t = TERRAIN.MOUNTAIN;
      } else if(seedTheme === "desert"){
        if(Math.random() < 0.45) t = TERRAIN.DESERT;
      } else if(seedTheme === "mountain"){
        if(Math.random() < 0.35) t = TERRAIN.MOUNTAIN;
        if(Math.random() < 0.12) t = TERRAIN.ORE;
      } else if(seedTheme === "river"){
        if(Math.random() < 0.18) t = TERRAIN.RIVER;
        if(Math.random() < 0.12) t = TERRAIN.FOREST;
      } else if(seedTheme === "dark"){
        if(Math.random() < 0.15) t = TERRAIN.MOUNTAIN;
        if(Math.random() < 0.12) t = TERRAIN.ORE;
        if(Math.random() < 0.15) t = TERRAIN.FOREST;
      } else {
        if(Math.random() < 0.20) t = TERRAIN.FOREST;
        if(Math.random() < 0.08) t = TERRAIN.RIVER;
        if(Math.random() < 0.10) t = TERRAIN.MOUNTAIN;
        if(Math.random() < 0.06) t = TERRAIN.ORE;
      }

      rowSet(terrain, x, y, t);
    }
  }

  // River lines
  for(let i=0;i<3;i++){
    let rx = randi(0, WORLD_W);
    let ry = randi(0, WORLD_H);
    for(let k=0;k<120;k++){
      rowSet(terrain, rx, ry, TERRAIN.RIVER);
      rx += randi(-1, 2);
      ry += randi(-1, 2);
      rx = clamp(rx, 0, WORLD_W-1);
      ry = clamp(ry, 0, WORLD_H-1);
    }
  }

  // Forest clusters
  for(let i=0;i<10;i++){
    let cx = randi(0, WORLD_W);
    let cy = randi(0, WORLD_H);
    for(let k=0;k<180;k++){
      const dx = randi(-2, 3);
      const dy = randi(-2, 3);
      const x = clamp(cx+dx,0,WORLD_W-1);
      const y = clamp(cy+dy,0,WORLD_H-1);
      if(Math.random() < 0.75) rowSet(terrain, x, y, TERRAIN.FOREST);
    }
  }

  // Mountains clusters
  for(let i=0;i<8;i++){
    let cx = randi(0, WORLD_W);
    let cy = randi(0, WORLD_H);
    for(let k=0;k<140;k++){
      const dx = randi(-2, 3);
      const dy = randi(-2, 3);
      const x = clamp(cx+dx,0,WORLD_W-1);
      const y = clamp(cy+dy,0,WORLD_H-1);
      if(Math.random() < 0.65) rowSet(terrain, x, y, TERRAIN.MOUNTAIN);
      if(Math.random() < 0.22) rowSet(terrain, x, y, TERRAIN.ORE);
    }
  }

  return {
    terrain,
    buildings: [],
    animals: [],
    territory: [],
    oreNodes: []
  };
}

function rowSet(grid,x,y,v){
  if(grid[y] && grid[y][x] !== undefined) grid[y][x] = v;
}

/* =========================
   TERRITORY
========================= */
function initTerritory(world){
  const terr = [];
  for(let y=0;y<WORLD_H;y++){
    const row = [];
    for(let x=0;x<WORLD_W;x++){
      row.push(false);
    }
    terr.push(row);
  }
  world.territory = terr;
}

function claimTerritory(world, cx, cy, radius){
  for(let y=cy-radius;y<=cy+radius;y++){
    for(let x=cx-radius;x<=cx+radius;x++){
      if(x<0||y<0||x>=WORLD_W||y>=WORLD_H) continue;
      const dx = x - cx;
      const dy = y - cy;
      if(dx*dx + dy*dy <= radius*radius){
        world.territory[y][x] = true;
      }
    }
  }
}

function isTerritory(world, x, y){
  if(x<0||y<0||x>=WORLD_W||y>=WORLD_H) return false;
  return !!world.territory[y][x];
}

/* =========================
   BUILDINGS
========================= */
function getBuildingAt(world, tx, ty){
  return world.buildings.find(b => b.x===tx && b.y===ty) || null;
}

function canPlaceBuilding(world, type, tx, ty){
  if(tx<0||ty<0||tx>=WORLD_W||ty>=WORLD_H) return { ok:false, reason:"超出地圖" };
  if(!isTerritory(world, tx, ty)) return { ok:false, reason:"不是領土" };
  if(getBuildingAt(world, tx, ty)) return { ok:false, reason:"已有建築" };

  const meta = BUILD_META[type];
  if(!meta) return { ok:false, reason:"未知建築" };

  // Terrain requirement
  if(meta.require === "forest"){
    if(!nearTerrain(world, tx, ty, TERRAIN.FOREST, 2)) return { ok:false, reason:"伐木場必須靠近森林" };
  }
  if(meta.require === "ore"){
    if(!nearTerrain(world, tx, ty, TERRAIN.ORE, 2)) return { ok:false, reason:"礦場必須靠近礦脈" };
  }
  if(meta.require === "mountain"){
    if(!nearTerrain(world, tx, ty, TERRAIN.MOUNTAIN, 2)) return { ok:false, reason:"石礦場必須靠近山地" };
  }

  return { ok:true, reason:"OK" };
}

function nearTerrain(world, tx, ty, terrainType, dist){
  for(let y=ty-dist;y<=ty+dist;y++){
    for(let x=tx-dist;x<=tx+dist;x++){
      if(x<0||y<0||x>=WORLD_W||y>=WORLD_H) continue;
      if(world.terrain[y][x] === terrainType) return true;
    }
  }
  return false;
}

function calcBuildCost(type, level){
  const meta = BUILD_META[type];
  const mult = Math.pow(1.55, level-1);
  return {
    coins: Math.floor(meta.baseCost.coins * mult),
    wood: Math.floor(meta.baseCost.wood * mult),
    stone: Math.floor(meta.baseCost.stone * mult),
    iron: Math.floor(meta.baseCost.iron * mult),
    food: Math.floor(meta.baseCost.food * mult)
  };
}

function canAfford(cost){
  const inv = CURRENT_DATA.inv;
  if(inv.coins < cost.coins) return false;
  if(inv.wood < cost.wood) return false;
  if(inv.stone < cost.stone) return false;
  if(inv.iron < cost.iron) return false;
  if(inv.food < cost.food) return false;
  return true;
}

function payCost(cost){
  const inv = CURRENT_DATA.inv;
  inv.coins -= cost.coins;
  inv.wood -= cost.wood;
  inv.stone -= cost.stone;
  inv.iron -= cost.iron;
  inv.food -= cost.food;
}

function placeBuilding(type, tx, ty){
  const world = CURRENT_DATA.world;
  const check = canPlaceBuilding(world, type, tx, ty);
  if(!check.ok){
    logSys("❌ 無法建造：" + check.reason);
    return false;
  }

  const cost = calcBuildCost(type, 1);
  if(!canAfford(cost)){
    logSys("❌ 資源不足，無法建造 " + BUILD_META[type].name);
    return false;
  }

  payCost(cost);

  world.buildings.push({
    id: "B" + now() + "_" + Math.random().toString(16).slice(2),
    type,
    x: tx,
    y: ty,
    level: 1
  });

  logSys("🏗️ 建造完成：" + BUILD_META[type].name + ` (${tx},${ty})`);
  return true;
}

function upgradeBuilding(b){
  const nextLv = b.level + 1;
  const cost = calcBuildCost(b.type, nextLv);
  if(!canAfford(cost)){
    logSys("❌ 升級失敗：資源不足");
    return false;
  }
  payCost(cost);
  b.level = nextLv;
  logSys(`⬆️ 升級成功：${BUILD_META[b.type].name} Lv.${b.level}`);
  return true;
}

/* =========================
   ANIMALS
========================= */
const ANIMAL_TYPES = [
  { id:"boar", name:"野豬", icon:"🐗" },
  { id:"wolf", name:"狼", icon:"🐺" },
  { id:"deer", name:"鹿", icon:"🦌" },
  { id:"bear", name:"熊", icon:"🐻" },
  { id:"fox", name:"狐狸", icon:"🦊" }
];

function spawnAnimals(world){
  world.animals = [];
  for(let i=0;i<24;i++){
    const ax = randi(0, WORLD_W);
    const ay = randi(0, WORLD_H);
    const a = ANIMAL_TYPES[randi(0, ANIMAL_TYPES.length)];
    world.animals.push({
      type: a.id,
      name: a.name,
      icon: a.icon,
      x: ax,
      y: ay,
      vx: rand(-0.5,0.5),
      vy: rand(-0.5,0.5)
    });
  }
}

function updateAnimals(dt){
  const world = CURRENT_DATA.world;
  for(const a of world.animals){
    if(Math.random() < 0.02){
      a.vx = rand(-0.6,0.6);
      a.vy = rand(-0.6,0.6);
    }
    a.x += a.vx * dt * 0.002;
    a.y += a.vy * dt * 0.002;

    a.x = clamp(a.x, 0, WORLD_W-1);
    a.y = clamp(a.y, 0, WORLD_H-1);
  }
}

/* =========================
   MARKET PRICES
========================= */
function getMarketPrice(res){
  // dynamic pseudo prices
  const t = CURRENT_DATA.time.gameYear;
  const wave = Math.sin(t / 7) * 0.2 + 1;
  const base = {
    wood: 3,
    stone: 4,
    iron: 7,
    food: 2
  }[res] || 5;

  return Math.max(1, Math.floor(base * wave));
}

/* =========================
   PRONUNCIATION MINING
========================= */
const PRONOUNCE_WORDS = [
  { type:"resource", word:"wood", display:"木材 (wood)" },
  { type:"resource", word:"stone", display:"石頭 (stone)" },
  { type:"resource", word:"iron", display:"鐵礦 (iron)" },
  { type:"resource", word:"food", display:"糧食 (food)" },
  { type:"animal", word:"wolf", display:"狼 (wolf)" },
  { type:"animal", word:"bear", display:"熊 (bear)" },
  { type:"plant", word:"forest", display:"森林 (forest)" },
  { type:"plant", word:"river", display:"河流 (river)" }
];

function nextPronounceTarget(){
  const idx = randi(0, PRONOUNCE_WORDS.length);
  CURRENT_DATA.pronounce.target = PRONOUNCE_WORDS[idx];
  CURRENT_DATA.pronounce.lastScore = null;
}

function calcPronounceScore(input, targetWord){
  // simple similarity scoring
  input = (input||"").toLowerCase().trim();
  targetWord = (targetWord||"").toLowerCase().trim();
  if(!input) return 0;

  let match = 0;
  const maxLen = Math.max(input.length, targetWord.length);

  for(let i=0;i<Math.min(input.length,targetWord.length);i++){
    if(input[i] === targetWord[i]) match++;
  }

  let score = (match / maxLen) * 100;

  // random noise to simulate speech scoring
  score += rand(-12, 12);
  score = clamp(score, 0, 100);

  return Math.floor(score);
}

/* =========================
   AENO HIDDEN MAPPING
   (NOT direct formula)
========================= */
const SECRET_MAP = {
  // letters 11-20 => represent bits mapping (obfuscated)
  // k=1, l=2, m=3 ... t=10 but hidden usage
  "k": 1, "l": 2, "m": 3, "n": 4, "o": 5,
  "p": 6, "q": 7, "r": 8, "s": 9, "t": 10
};

function hiddenAenoFactor(score, focusSeconds, adSeconds){
  // score: 0-100
  // focusSeconds: time in pronounce
  // adSeconds: ad listened

  // generate pseudo key
  const key = "klmnopqrst".split("");
  const a = SECRET_MAP[key[randi(0, key.length)]];
  const b = SECRET_MAP[key[randi(0, key.length)]];
  const c = SECRET_MAP[key[randi(0, key.length)]];
  const d = SECRET_MAP[key[randi(0, key.length)]];

  const base = (a * b + c) / (d + 1);

  // AENO should be slow
  let gain = 0;

  // pass >=40
  if(score >= 40){
    const quality = (score - 40) / 60; // 0..1
    const attention = clamp((focusSeconds / 12), 0.2, 1.2);
    const ads = clamp((adSeconds / 30), 0.0, 1.2);

    gain = (base * 0.00003) * (0.4 + quality) * attention * (0.6 + ads);
  } else {
    gain = 0;
  }

  // extremely small random
  gain *= rand(0.7, 1.3);

  // clamp to avoid fast inflation
  gain = clamp(gain, 0, 0.0022);

  return gain;
}

/* =========================
   AD AUDIO (No copyright)
========================= */
const AD_SONG_URL = "https://cdn.pixabay.com/download/audio/2022/10/25/audio_0b2a5b1f63.mp3?filename=calm-ambient-113997.mp3";
let adStartTime = 0;

/* =========================
   ROBOT SYSTEM
========================= */
function robotExplore(){
  const data = CURRENT_DATA;
  if(data.robot.active){
    logSys("🤖 機器人已在探索中。");
    return;
  }
  if(data.inv.robotParts < 1 && data.inv.robots < 1){
    logSys("❌ 你沒有機器人。工廠可產出機器人。");
    return;
  }

  // consume 1 robot if available
  if(data.inv.robots <= 0){
    logSys("❌ 機器人不足。");
    return;
  }

  data.inv.robots -= 1;

  const planetName = ROBOT_PLANETS[randi(0, ROBOT_PLANETS.length)];
  data.robot.active = true;
  data.robot.target = planetName;
  data.robot.startAt = now();
  data.robot.duration = 1000 * randi(60, 160); // 1~2.5 mins
  data.robot.reward = null;

  logSys("🚀 機器人已出發探索：" + planetName);
}

function robotRecall(){
  const data = CURRENT_DATA;
  if(!data.robot.active){
    logSys("🤖 沒有機器人在外。");
    return;
  }

  const elapsed = now() - data.robot.startAt;
  if(elapsed < data.robot.duration){
    logSys("🤖 機器人未完成探索，提前召回只能帶回少量資源。");
  }

  const ratio = clamp(elapsed / data.robot.duration, 0.1, 1.0);

  const techBonus = getTechEffect("robot") || 1;

  const wood = Math.floor(rand(20, 70) * ratio * techBonus);
  const stone = Math.floor(rand(10, 55) * ratio * techBonus);
  const iron = Math.floor(rand(6, 35) * ratio * techBonus);
  const food = Math.floor(rand(10, 60) * ratio * techBonus);
  const shards = Math.floor(rand(1, 8) * ratio);

  CURRENT_DATA.inv.wood += wood;
  CURRENT_DATA.inv.stone += stone;
  CURRENT_DATA.inv.iron += iron;
  CURRENT_DATA.inv.food += food;
  CURRENT_DATA.inv.shards += shards;

  // return robot
  CURRENT_DATA.inv.robots += 1;

  data.robot.active = false;
  logSys(`📦 機器人帶回：木${wood} 石${stone} 鐵${iron} 糧${food} 碎片${shards}`);
}

/* =========================
   TECH EFFECT
========================= */
function getTechEffect(key){
  const tech = CURRENT_DATA.tech;
  let mul = 1;
  for(const t of TECHS){
    if(tech.unlocked.includes(t.id)){
      if(t.effect[key]) mul *= t.effect[key];
    }
  }
  return mul;
}

/* =========================
   AUTO BUILD SYSTEM
   (SAFE MODE, won't burn all)
========================= */
function autoBuildTick(){
  const data = CURRENT_DATA;
  if(!state.ui.autoBuild) return;

  // Do not spam
  if(now() - data.auto.lastBuildAt < 6000) return;

  // Keep minimum reserve
  const inv = data.inv;
  const reserveCoins = 150;
  const reserveWood = 80;

  if(inv.coins < reserveCoins) return;
  if(inv.wood < reserveWood) return;

  // Basic logic: ensure 2 farms, 1 lumber, 1 quarry, 1 mine, then houses
  const counts = countBuildings();

  let target = null;

  if(counts.farm < 2) target = BUILDINGS.FARM;
  else if(counts.lumber < 1) target = BUILDINGS.LUMBER;
  else if(counts.quarry < 1) target = BUILDINGS.QUARRY;
  else if(counts.mine < 1) target = BUILDINGS.MINE;
  else if(counts.house < 4) target = BUILDINGS.HOUSE;
  else if(counts.factory < 1) target = BUILDINGS.FACTORY;
  else if(counts.market < 1) target = BUILDINGS.MARKET;
  else if(Math.random() < 0.35) target = BUILDINGS.HOUSE;
  else if(Math.random() < 0.50) target = BUILDINGS.FARM;
  else target = BUILDINGS.LUMBER;

  // Find best tile in territory
  const world = data.world;

  for(let tries=0; tries<180; tries++){
    const tx = randi(0, WORLD_W);
    const ty = randi(0, WORLD_H);
    if(!isTerritory(world, tx, ty)) continue;
    if(getBuildingAt(world, tx, ty)) continue;

    const check = canPlaceBuilding(world, target, tx, ty);
    if(check.ok){
      const ok = placeBuilding(target, tx, ty);
      if(ok){
        data.auto.lastBuildAt = now();
        return;
      }
    }
  }
}

/* =========================
   COUNT BUILDINGS
========================= */
function countBuildings(){
  const world = CURRENT_DATA.world;
  const c = {
    house:0,farm:0,lumber:0,mine:0,quarry:0,factory:0,market:0,wall:0,tower:0
  };
  for(const b of world.buildings){
    if(c[b.type] !== undefined) c[b.type]++;
  }
  return c;
}

/* =========================
   OFFLINE SIMULATION
========================= */
function simulateOffline(){
  const data = CURRENT_DATA;
  const last = data.time.lastReal;
  const cur = now();
  let dt = cur - last;
  if(dt <= 0) return;

  const maxOffline = 24 * 3600 * 1000; // 24 hours
  dt = Math.min(dt, maxOffline);

  // convert to game years
  // 1 day = 10 years
  const yearsPerMs = 10 / (24 * 3600 * 1000);
  const addYears = dt * yearsPerMs;

  data.time.gameYear += addYears;

  // simulate production
  simulateProduction(dt);

  data.time.lastReal = cur;

  logSys(`⏱️ 離線結算：+${addYears.toFixed(2)} 年（最多 24h）`);
}

/* =========================
   PRODUCTION SYSTEM
========================= */
function simulateProduction(dt){
  const data = CURRENT_DATA;
  const world = data.world;

  const counts = countBuildings();

  // base rates per second
  let foodRate = counts.farm * 0.18;
  let woodRate = counts.lumber * 0.14;
  let stoneRate = counts.quarry * 0.12;
  let ironRate = counts.mine * 0.08;

  // apply tech
  foodRate *= getTechEffect("farm");
  woodRate *= getTechEffect("lumber");
  stoneRate *= getTechEffect("quarry");
  ironRate *= getTechEffect("mine");

  // planet bonus
  const p = PLANETS.find(x=>x.id===data.planetId);
  if(p && p.bonus){
    if(p.bonus.food) foodRate *= p.bonus.food;
    if(p.bonus.wood) woodRate *= p.bonus.wood;
    if(p.bonus.stone) stoneRate *= p.bonus.stone;
    if(p.bonus.iron) ironRate *= p.bonus.iron;
  }

  const seconds = dt / 1000;

  data.inv.food += Math.floor(foodRate * seconds);
  data.inv.wood += Math.floor(woodRate * seconds);
  data.inv.stone += Math.floor(stoneRate * seconds);
  data.inv.iron += Math.floor(ironRate * seconds);

  // coins income: houses tax + factory profit
  let taxRate = counts.house * 0.08;
  taxRate *= getTechEffect("tax");
  let factoryRate = counts.factory * 0.16;

  // desert bonus
  if(p && p.bonus && p.bonus.coins) {
    taxRate *= p.bonus.coins;
    factoryRate *= p.bonus.coins;
  }

  data.inv.coins += Math.floor((taxRate + factoryRate) * seconds);

  // factory produce robots slowly
  if(counts.factory > 0){
    data.factory.acc += seconds * (0.012 * counts.factory);
    while(data.factory.acc >= 1){
      data.factory.acc -= 1;
      data.inv.robots += 1;
      logSys("🤖 工廠生產了一台機器人！");
    }
  }

  // territory expansion (workers auto)
  territoryExpandTick(seconds);
}

/* =========================
   TERRITORY EXPANSION
   - workers expand using coins slowly
========================= */
function territoryExpandTick(seconds){
  const data = CURRENT_DATA;
  const world = data.world;

  // expansion budget
  data.territory.acc += seconds * (0.05 + data.pop.workers * 0.015);

  if(data.territory.acc < 1) return;

  while(data.territory.acc >= 1){
    data.territory.acc -= 1;

    // cost
    const costCoins = 12;
    if(data.inv.coins < costCoins) return;

    data.inv.coins -= costCoins;

    // expand from center
    const cx = data.base.x;
    const cy = data.base.y;

    const rx = cx + randi(-data.territory.radius-2, data.territory.radius+3);
    const ry = cy + randi(-data.territory.radius-2, data.territory.radius+3);

    if(rx<0||ry<0||rx>=WORLD_W||ry>=WORLD_H) continue;

    // expand radius slowly
    if(Math.random() < 0.12){
      data.territory.radius += 1;
      claimTerritory(world, cx, cy, data.territory.radius);
      logSys("🗺️ 領土擴大！半徑：" + data.territory.radius);
    } else {
      world.territory[ry][rx] = true;
    }
  }
}

/* =========================
   BEAST TIDE (only if walls 100%)
========================= */
function beastTideCheck(){
  const data = CURRENT_DATA;
  const world = data.world;

  const counts = countBuildings();

  // require wall
  if(counts.wall < 18) return;

  if(now() - data.beast.lastAt < 90000) return; // 90 sec

  if(Math.random() < 0.15){
    data.beast.lastAt = now();

    const lootCoins = randi(60, 160);
    const lootShards = randi(2, 8);

    data.inv.coins += lootCoins;
    data.inv.shards += lootShards;

    logSys(`🐺 獸潮來襲！你防守成功，獲得金幣+${lootCoins} 碎片+${lootShards}`);
  }
}

/* =========================
   UI UPDATE
========================= */
function updateUI(){
  if(!CURRENT_DATA) return;
  uiPlanet.textContent = CURRENT_DATA.planetName;
  uiYear.textContent = Math.floor(CURRENT_DATA.time.gameYear);
  uiPop.textContent = CURRENT_DATA.pop.total;
  uiWorkers.textContent = CURRENT_DATA.pop.workers;

  uiCoins.textContent = CURRENT_DATA.inv.coins;
  uiAeno.textContent = formatAeno(CURRENT_DATA.inv.aeno);

  uiWood.textContent = CURRENT_DATA.inv.wood;
  uiStone.textContent = CURRENT_DATA.inv.stone;
  uiIron.textContent = CURRENT_DATA.inv.iron;
  uiFood.textContent = CURRENT_DATA.inv.food;

  autoTxt.textContent = state.ui.autoBuild ? "ON" : "OFF";

  loopTxt.textContent = state.ui.loopSong ? "ON" : "OFF";

  if(CURRENT_DATA.robot.active){
    const remain = Math.max(0, (CURRENT_DATA.robot.duration - (now()-CURRENT_DATA.robot.startAt))/1000);
    robotStatus.textContent = `🚀 探索中：${CURRENT_DATA.robot.target}（剩餘 ${remain.toFixed(0)} 秒）`;
  } else {
    robotStatus.textContent = "尚未派出。";
  }

  // Pronounce UI
  if(CURRENT_DATA.pronounce.target){
    pronounceTarget.textContent = CURRENT_DATA.pronounce.target.display;
  }
}

/* =========================
   BUILD UI LIST
========================= */
function renderBuildButtons(){
  buildList.innerHTML = "";
  for(const key of Object.keys(BUILD_META)){
    const meta = BUILD_META[key];
    const btn = document.createElement("button");
    btn.className = "buildBtn";
    btn.innerHTML = `${meta.name}<div style="font-size:11px;opacity:.8;margin-top:4px;">${meta.desc}</div>`;
    btn.onclick = ()=>{
      state.ui.buildMode = true;
      state.ui.upgradeMode = false;
      state.ui.selectedBuild = key;
      logSys("🏗️ 建築模式：選擇 " + meta.name + "，再點領土空地放置。");
    };
    buildList.appendChild(btn);
  }
}

/* =========================
   TECH UI
========================= */
function renderTechButtons(){
  techList.innerHTML = "";
  for(const t of TECHS){
    const btn = document.createElement("button");
    btn.className = "techBtn";
    const unlocked = CURRENT_DATA.tech.unlocked.includes(t.id);

    btn.innerHTML = `${unlocked ? "✅ " : ""}${t.name}
      <div style="font-size:11px;opacity:.8;margin-top:4px;">${t.desc}</div>
      <div style="font-size:11px;font-weight:900;margin-top:4px;">成本：${t.cost} 金幣</div>
    `;

    btn.onclick = ()=>{
      if(unlocked){
        logSys("✅ 已解鎖科技：" + t.name);
        return;
      }
      if(CURRENT_DATA.inv.coins < t.cost){
        logSys("❌ 金幣不足，無法研究：" + t.name);
        return;
      }
      CURRENT_DATA.inv.coins -= t.cost;
      CURRENT_DATA.tech.unlocked.push(t.id);
      logSys("🧬 科技解鎖：" + t.name);
      renderTechButtons();
      saveUser();
    };

    techList.appendChild(btn);
  }
}

/* =========================
   PANEL DRAG / MINIMIZE
========================= */
let panelDragging = false;
let panelDragOffX = 0;
let panelDragOffY = 0;

panelHeader.addEventListener("pointerdown",(e)=>{
  panelDragging = true;
  panelHeader.setPointerCapture(e.pointerId);
  panelDragOffX = e.clientX - mainPanel.offsetLeft;
  panelDragOffY = e.clientY - mainPanel.offsetTop;
});

panelHeader.addEventListener("pointermove",(e)=>{
  if(!panelDragging) return;
  const x = e.clientX - panelDragOffX;
  const y = e.clientY - panelDragOffY;

  mainPanel.style.left = clamp(x, 0, window.innerWidth - mainPanel.offsetWidth) + "px";
  mainPanel.style.top = clamp(y, 0, window.innerHeight - mainPanel.offsetHeight) + "px";
  mainPanel.style.right = "auto";
});

panelHeader.addEventListener("pointerup",(e)=>{
  panelDragging = false;
});

panelMinBtn.onclick = ()=>{
  if(mainPanel.style.height === "120px"){
    mainPanel.style.height = "420px";
    logSys("📌 面板恢復。");
  } else {
    mainPanel.style.height = "120px";
    logSys("📌 面板縮小。");
  }
};

panelHideBtn.onclick = ()=>{
  mainPanel.classList.add("hidden");
  panelRestoreBtn.classList.remove("hidden");
};

panelRestoreBtn.onclick = ()=>{
  mainPanel.classList.remove("hidden");
  panelRestoreBtn.classList.add("hidden");
};

/* =========================
   TABS
========================= */
tabBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    tabBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    const id = btn.dataset.tab;
    tabPages.forEach(p=>{
      p.classList.remove("active");
      if(p.id === id) p.classList.add("active");
    });
  });
});

/* =========================
   CHAT / ASSISTANT
========================= */
function addChat(text, from="AI"){
  const div = document.createElement("div");
  div.style.marginBottom = "6px";
  div.innerHTML = `<b>${escapeHtml(from)}:</b> ${escapeHtml(text)}`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

assistantTalkBtn.onclick = ()=>{
  chatBox.classList.toggle("hidden");
  if(!chatBox.classList.contains("hidden")){
    addChat("我係你的助手 🦊。你可以輸入：巡邏 / 收集 / 建造 / 升級 / 停止自動 / 開啟自動 / 保存", "AI");
  }
};

chatClose.onclick = ()=> chatBox.classList.add("hidden");

chatSend.onclick = ()=> {
  const txt = chatInput.value.trim();
  if(!txt) return;
  chatInput.value = "";
  addChat(txt, "你");
  handleCommand(txt);
};

chatInput.addEventListener("keydown",(e)=>{
  if(e.key === "Enter") chatSend.click();
});

function handleCommand(txt){
  const t = txt.toLowerCase();

  if(t.includes("保存") || t.includes("save")){
    saveUser();
    addChat("已保存。", "AI");
    return;
  }

  if(t.includes("停止") || t.includes("off")){
    state.ui.autoBuild = false;
    addChat("自動建造已停止。", "AI");
    logSys("🤖 自動建造 OFF");
    return;
  }

  if(t.includes("開啟") || t.includes("on")){
    state.ui.autoBuild = true;
    addChat("自動建造已開啟。", "AI");
    logSys("🤖 自動建造 ON");
    return;
  }

  if(t.includes("巡邏")){
    addChat("我會巡邏領土，並優先保護資源點。", "AI");
    logSys("🦊 AI助手：巡邏中...");
    return;
  }

  if(t.includes("收集")){
    addChat("我會安排工人自動收集資源（已啟用自動生產）。", "AI");
    logSys("🦊 AI助手：資源收集中...");
    return;
  }

  if(t.includes("建造")){
    addChat("我會按策略建造：農田→伐木→礦場→房屋→工廠。", "AI");
    state.ui.autoBuild = true;
    logSys("🦊 AI助手：建造策略啟動。");
    return;
  }

  if(t.includes("升級")){
    addChat("我會優先升級工廠與房屋（資源足夠時）。", "AI");
    CURRENT_DATA.auto.preferUpgrade = true;
    return;
  }

  addChat("我未理解，你可以試：保存 / 停止自動 / 開啟自動 / 巡邏 / 收集 / 建造 / 升級", "AI");
}

/* =========================
   BUTTONS
========================= */
btnToggleAuto.onclick = ()=>{
  state.ui.autoBuild = !state.ui.autoBuild;
  logSys("🤖 自動建造：" + (state.ui.autoBuild ? "ON" : "OFF"));
  updateUI();
};

btnSaveNow.onclick = ()=>{
  saveUser();
  logSys("💾 手動保存完成。");
};

btnUpgradeMode.onclick = ()=>{
  state.ui.upgradeMode = true;
  state.ui.buildMode = false;
  state.ui.selectedBuild = null;
  logSys("⬆️ 升級模式已開啟：點擊建築即可升級。");
};

btnExitUpgrade.onclick = ()=>{
  state.ui.upgradeMode = false;
  logSys("⬆️ 升級模式已退出。");
};

btnRobotExplore.onclick = ()=>{
  robotExplore();
  saveUser();
};

btnRobotRecall.onclick = ()=>{
  robotRecall();
  saveUser();
};

btnBuy.onclick = ()=>{
  const res = marketRes.value;
  const qty = Math.max(1, parseInt(marketQty.value||"1",10));
  const price = getMarketPrice(res);
  const cost = price * qty;

  if(CURRENT_DATA.inv.coins < cost){
    logSys("❌ 金幣不足，無法買入。");
    return;
  }
  CURRENT_DATA.inv.coins -= cost;
  CURRENT_DATA.inv[res] += qty;
  logSys(`🏦 買入 ${res} x${qty}（花費 ${cost} 金幣）`);
  saveUser();
};

btnSell.onclick = ()=>{
  const res = marketRes.value;
  const qty = Math.max(1, parseInt(marketQty.value||"1",10));
  if(CURRENT_DATA.inv[res] < qty){
    logSys("❌ 資源不足，無法賣出。");
    return;
  }
  const price = getMarketPrice(res);
  const gain = Math.floor(price * qty * 0.85);

  CURRENT_DATA.inv[res] -= qty;
  CURRENT_DATA.inv.coins += gain;
  logSys(`🏦 賣出 ${res} x${qty}（獲得 ${gain} 金幣）`);
  saveUser();
};

btnPronounceNext.onclick = ()=>{
  nextPronounceTarget();
  pronounceInput.value = "";
  pronounceResult.textContent = "等待測試...";
  saveUser();
};

btnPronounceTest.onclick = ()=>{
  const target = CURRENT_DATA.pronounce.target;
  if(!target){
    nextPronounceTarget();
    return;
  }

  const input = pronounceInput.value;
  const score = calcPronounceScore(input, target.word);

  CURRENT_DATA.pronounce.lastScore = score;
  CURRENT_DATA.pronounce.lastAt = now();

  if(score < 40){
    pronounceResult.textContent = `❌ 評分：${score}%（未達 40%）`;
    logSys(`🎙️ 發音失敗：${target.display} 分數 ${score}%`);
    saveUser();
    return;
  }

  // reward shards always if pass
  const shardGain = randi(1, 4);
  CURRENT_DATA.inv.shards += shardGain;

  // aeno chance
  const focusSeconds = 8 + rand(0, 10);
  const adSeconds = CURRENT_DATA.ads.totalListenSeconds;

  const gain = hiddenAenoFactor(score, focusSeconds, adSeconds);

  if(gain > 0 && Math.random() < (0.35 + (score/200))){
    CURRENT_DATA.inv.aeno += gain;
    logSys(`🟡 AENO 掉落！+${formatAeno(gain)}（語言挖礦）`);
  }

  pronounceResult.textContent = `✅ 評分：${score}%（合格）｜碎片 +${shardGain}`;
  logSys(`🎙️ 發音成功：${target.display} 分數 ${score}% 碎片+${shardGain}`);

  saveUser();
};

btnPlayAd.onclick = ()=>{
  playAdSong();
};

btnToggleLoop.onclick = ()=>{
  state.ui.loopSong = !state.ui.loopSong;
  adAudio.loop = state.ui.loopSong;
  updateUI();
  saveUser();
};

function playAdSong(){
  try{
    adAudio.src = AD_SONG_URL;
    adAudio.loop = state.ui.loopSong;
    adAudio.volume = 0.75;

    adAudio.play().then(()=>{
      adStartTime = now();
      adStatus.textContent = "🎵 播放中...";
      logSys("🎵 廣告歌播放開始（注意力挖礦成本啟動）");
    }).catch(()=>{
      adStatus.textContent = "❌ 無法播放（瀏覽器限制）";
      logSys("❌ 廣告歌無法播放：可能需要用戶先點擊一次畫面。");
    });

  }catch(e){
    logSys("❌ 播放錯誤：" + e.message);
  }
}

adAudio.addEventListener("ended", ()=>{
  if(adStartTime){
    const sec = (now()-adStartTime)/1000;
    CURRENT_DATA.ads.totalListenSeconds += sec;
    logSys(`🎵 廣告歌結束：聆聽 ${sec.toFixed(0)} 秒`);
    adStartTime = 0;
    saveUser();
  }
});

adAudio.addEventListener("pause", ()=>{
  if(adStartTime){
    const sec = (now()-adStartTime)/1000;
    CURRENT_DATA.ads.totalListenSeconds += sec;
    logSys(`🎵 廣告歌暫停：已聽 ${sec.toFixed(0)} 秒`);
    adStartTime = 0;
    saveUser();
  }
});

/* =========================
   CLICK BUILD POPUP
========================= */
let clickPopup = null;

function openBuildPopup(screenX, screenY, tileX, tileY){
  closeBuildPopup();

  clickPopup = document.createElement("div");
  clickPopup.style.position = "absolute";
  clickPopup.style.left = screenX + "px";
  clickPopup.style.top = screenY + "px";
  clickPopup.style.zIndex = 999;
  clickPopup.style.pointerEvents = "auto";
  clickPopup.style.background = "rgba(255,255,255,.92)";
  clickPopup.style.border = "2px solid #93c5fd";
  clickPopup.style.borderRadius = "16px";
  clickPopup.style.padding = "10px";
  clickPopup.style.boxShadow = "0 10px 22px rgba(0,0,0,.18)";
  clickPopup.style.width = "210px";
  clickPopup.style.fontSize = "12px";

  const title = document.createElement("div");
  title.style.fontWeight = "1000";
  title.style.marginBottom = "6px";
  title.textContent = `🏗️ 建築 (${tileX},${tileY})`;
  clickPopup.appendChild(title);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✖";
  closeBtn.style.position = "absolute";
  closeBtn.style.right = "8px";
  closeBtn.style.top = "6px";
  closeBtn.style.border = "none";
  closeBtn.style.borderRadius = "10px";
  closeBtn.style.padding = "4px 8px";
  closeBtn.style.background = "#ef4444";
  closeBtn.style.color = "white";
  closeBtn.style.fontWeight = "1000";
  closeBtn.onclick = ()=> closeBuildPopup();
  clickPopup.appendChild(closeBtn);

  for(const k of Object.keys(BUILD_META)){
    const meta = BUILD_META[k];
    const cost = calcBuildCost(k, 1);

    const btn = document.createElement("button");
    btn.style.width = "100%";
    btn.style.marginTop = "6px";
    btn.style.border = "none";
    btn.style.borderRadius = "14px";
    btn.style.padding = "10px";
    btn.style.fontWeight = "1000";
    btn.style.background = "#38bdf8";
    btn.style.color = "white";
    btn.style.cursor = "pointer";
    btn.innerHTML = `${meta.name}<div style="font-size:11px;opacity:.85;margin-top:3px;">🪙${cost.coins} 🪵${cost.wood} 🪨${cost.stone} ⛏️${cost.iron}</div>`;

    btn.onclick = ()=>{
      const ok = placeBuilding(k, tileX, tileY);
      if(ok){
        closeBuildPopup();
        saveUser();
      }
    };

    clickPopup.appendChild(btn);
  }

  document.body.appendChild(clickPopup);
}

function closeBuildPopup(){
  if(clickPopup){
    clickPopup.remove();
    clickPopup = null;
  }
}

/* =========================
   INPUT CAMERA
========================= */
function screenToWorld(sx, sy){
  const cam = state.camera;
  const wx = (sx - cam.x) / cam.zoom;
  const wy = (sy - cam.y) / cam.zoom;
  return { wx, wy };
}

function worldToTile(wx, wy){
  const tx = Math.floor(wx / TILE);
  const ty = Math.floor(wy / TILE);
  return { tx, ty };
}

canvas.addEventListener("pointerdown",(e)=>{
  state.input.dragging = true;
  state.input.lastX = e.clientX;
  state.input.lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove",(e)=>{
  if(!state.input.dragging) return;
  const dx = e.clientX - state.input.lastX;
  const dy = e.clientY - state.input.lastY;

  state.input.lastX = e.clientX;
  state.input.lastY = e.clientY;

  state.camera.x += dx;
  state.camera.y += dy;
});

canvas.addEventListener("pointerup",(e)=>{
  state.input.dragging = false;

  // click action (if small move)
  const dist = Math.hypot(e.clientX - state.input.lastX, e.clientY - state.input.lastY);
  if(dist < 8){
    handleCanvasClick(e.clientX, e.clientY);
  }
});

canvas.addEventListener("wheel",(e)=>{
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.08 : 0.08;
  state.camera.zoom = clamp(state.camera.zoom + delta, 0.55, 2.3);
},{ passive:false });

let touchPinch = false;
let pinchStartDist = 0;
let pinchStartZoom = 1;

canvas.addEventListener("touchstart",(e)=>{
  if(e.touches.length === 2){
    touchPinch = true;
    pinchStartDist = touchDist(e.touches[0], e.touches[1]);
    pinchStartZoom = state.camera.zoom;
  }
},{ passive:false });

canvas.addEventListener("touchmove",(e)=>{
  if(touchPinch && e.touches.length === 2){
    e.preventDefault();
    const d = touchDist(e.touches[0], e.touches[1]);
    const ratio = d / pinchStartDist;
    state.camera.zoom = clamp(pinchStartZoom * ratio, 0.55, 2.3);
  }
},{ passive:false });

canvas.addEventListener("touchend",(e)=>{
  if(e.touches.length < 2) touchPinch = false;
});

function touchDist(a,b){
  return Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
}

function handleCanvasClick(sx, sy){
  if(!CURRENT_DATA) return;

  const { wx, wy } = screenToWorld(sx, sy);
  const { tx, ty } = worldToTile(wx, wy);

  const world = CURRENT_DATA.world;

  // upgrade mode
  const b = getBuildingAt(world, tx, ty);
  if(state.ui.upgradeMode && b){
    upgradeBuilding(b);
    saveUser();
    return;
  }

  // build mode selected
  if(state.ui.buildMode && state.ui.selectedBuild){
    const ok = placeBuilding(state.ui.selectedBuild, tx, ty);
    if(ok) saveUser();
    return;
  }

  // default: if empty territory => popup
  if(isTerritory(world, tx, ty) && !b){
    openBuildPopup(sx, sy, tx, ty);
  } else if(!isTerritory(world, tx, ty)){
    logSys("⚫ 非領土區域，不能建築。");
  }
}

/* =========================
   RENDERING
========================= */
function draw(){
  if(!CURRENT_DATA) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  const cam = state.camera;
  const world = CURRENT_DATA.world;

  // background sky
  ctx.fillStyle = "#eaf6ff";
  ctx.fillRect(0,0,window.innerWidth,window.innerHeight);

  // map
  const startX = Math.floor((-cam.x) / (TILE * cam.zoom)) - 2;
  const startY = Math.floor((-cam.y) / (TILE * cam.zoom)) - 2;
  const endX = startX + Math.ceil(window.innerWidth / (TILE * cam.zoom)) + 4;
  const endY = startY + Math.ceil(window.innerHeight / (TILE * cam.zoom)) + 4;

  for(let y=startY;y<endY;y++){
    for(let x=startX;x<endX;x++){
      if(x<0||y<0||x>=WORLD_W||y>=WORLD_H) continue;

      const sx = cam.x + x * TILE * cam.zoom;
      const sy = cam.y + y * TILE * cam.zoom;
      const size = TILE * cam.zoom;

      // terrain color
      const t = world.terrain[y][x];
      let col = "#bbf7d0";

      if(t === TERRAIN.FOREST) col = "#86efac";
      if(t === TERRAIN.RIVER) col = "#93c5fd";
      if(t === TERRAIN.MOUNTAIN) col = "#cbd5e1";
      if(t === TERRAIN.ORE) col = "#d1d5db";
      if(t === TERRAIN.DESERT) col = "#fde68a";

      ctx.fillStyle = col;
      ctx.fillRect(sx, sy, size, size);

      // grid line
      ctx.strokeStyle = "rgba(0,0,0,.05)";
      ctx.strokeRect(sx, sy, size, size);

      // non-territory dark overlay
      if(!isTerritory(world, x, y)){
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.fillRect(sx, sy, size, size);
      }

      // terrain icons
      if(cam.zoom > 0.85){
        if(t === TERRAIN.FOREST){
          drawText("🌲", sx+size*0.25, sy+size*0.15, 18*cam.zoom);
        }
        if(t === TERRAIN.RIVER){
          drawText("💧", sx+size*0.25, sy+size*0.15, 16*cam.zoom);
        }
        if(t === TERRAIN.MOUNTAIN){
          drawText("⛰️", sx+size*0.15, sy+size*0.15, 16*cam.zoom);
        }
        if(t === TERRAIN.ORE){
          drawText("🪨", sx+size*0.25, sy+size*0.15, 15*cam.zoom);
        }
      }
    }
  }

  // buildings
  for(const b of world.buildings){
    const sx = cam.x + b.x * TILE * cam.zoom;
    const sy = cam.y + b.y * TILE * cam.zoom;
    const size = TILE * cam.zoom;

    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.fillRect(sx+4, sy+4, size-8, size-8);

    ctx.strokeStyle = "rgba(0,0,0,.15)";
    ctx.strokeRect(sx+4, sy+4, size-8, size-8);

    let icon = "🏠";
    if(b.type===BUILDINGS.FARM) icon="🌾";
    if(b.type===BUILDINGS.LUMBER) icon="🪓";
    if(b.type===BUILDINGS.MINE) icon="⛏️";
    if(b.type===BUILDINGS.QUARRY) icon="🪨";
    if(b.type===BUILDINGS.FACTORY) icon="🏭";
    if(b.type===BUILDINGS.MARKET) icon="🏦";
    if(b.type===BUILDINGS.WALL) icon="🧱";
    if(b.type===BUILDINGS.TOWER) icon="🏰";

    drawText(icon, sx+size*0.20, sy+size*0.12, 18*cam.zoom);

    if(cam.zoom > 0.85){
      drawText("Lv."+b.level, sx+size*0.15, sy+size*0.62, 11*cam.zoom, "#0f172a");
    }
  }

  // animals
  for(const a of world.animals){
    const sx = cam.x + a.x * TILE * cam.zoom;
    const sy = cam.y + a.y * TILE * cam.zoom;
    drawText(a.icon, sx, sy, 18*cam.zoom);
  }

  // base marker
  const bx = CURRENT_DATA.base.x;
  const by = CURRENT_DATA.base.y;
  const bsx = cam.x + bx*TILE*cam.zoom;
  const bsy = cam.y + by*TILE*cam.zoom;
  drawText("🏰", bsx, bsy, 22*cam.zoom);

  // zoom info small
  ctx.fillStyle = "rgba(0,0,0,.45)";
  ctx.font = "bold 12px system-ui";
  ctx.fillText("Zoom: "+state.camera.zoom.toFixed(2), 10, window.innerHeight-12);
}

function drawText(text, x, y, size=16, color="#111"){
  ctx.fillStyle = color;
  ctx.font = `${size}px system-ui`;
  ctx.fillText(text, x, y+size);
}

/* =========================
   MAIN LOOP
========================= */
let lastFrame = now();

function loop(){
  if(!running) return;

  const t = now();
  const dt = t - lastFrame;
  lastFrame = t;

  // time progression real->game
  const yearsPerMs = 10 / (24 * 3600 * 1000);
  CURRENT_DATA.time.gameYear += dt * yearsPerMs;

  // production
  simulateProduction(dt);

  // auto build
  autoBuildTick();

  // animals move
  updateAnimals(dt);

  // beast tide
  beastTideCheck();

  // robot auto finish
  if(CURRENT_DATA.robot.active){
    if(now() - CURRENT_DATA.robot.startAt >= CURRENT_DATA.robot.duration){
      logSys("🤖 機器人探索完成，可回收資源。");
      robotRecall();
      saveUser();
    }
  }

  // update UI
  updateUI();

  // draw
  draw();

  // autosave interval
  if(now() - CURRENT_DATA.time.lastAutoSave > 12000){
    CURRENT_DATA.time.lastAutoSave = now();
    saveUser();
  }

  requestAnimationFrame(loop);
}

/* =========================
   SAVE CURRENT USER
========================= */
function saveUser(){
  if(!CURRENT_USER || !CURRENT_DATA) return;

  const users = loadAllUsers();
  users[CURRENT_USER].data = CURRENT_DATA;
  users[CURRENT_USER].lastSaved = now();
  saveAllUsers(users);
}

/* =========================
   CREATE NEW PLAYER DATA
========================= */
function createNewPlayerData(planetId){
  const planet = PLANETS.find(p=>p.id===planetId);

  const world = createEmptyWorld(planet.theme);
  initTerritory(world);

  // base position center-ish
  const baseX = randi(20, 60);
  const baseY = randi(20, 60);

  // initial territory
  claimTerritory(world, baseX, baseY, 6);

  // animals
  spawnAnimals(world);

  const data = {
    version: GAME_VERSION,
    planetId: planet.id,
    planetName: planet.name,

    inv: {
      coins: 2000,
      wood: 800,
      stone: 800,
      iron: 800,
      food: 800,
      aeno: 0.0000,
      shards: 0,
      robots: 0,
      robotParts: 0
    },

    pop: {
      total: 4,
      workers: 4
    },

    base: { x: baseX, y: baseY },

    territory: {
      radius: 6,
      acc: 0
    },

    factory: { acc: 0 },

    auto: {
      lastBuildAt: 0,
      preferUpgrade: false
    },

    tech: {
      unlocked: []
    },

    robot: {
      active: false,
      target: null,
      startAt: 0,
      duration: 0,
      reward: null
    },

    pronounce: {
      target: null,
      lastScore: null,
      lastAt: 0
    },

    ads: {
      totalListenSeconds: 0
    },

    beast: {
      lastAt: 0
    },

    time: {
      gameYear: 0,
      lastReal: now(),
      lastAutoSave: now()
    },

    world
  };

  // initial buildings: 2 houses
  world.buildings.push({ id:"init1", type:BUILDINGS.HOUSE, x: baseX, y: baseY, level:1 });
  world.buildings.push({ id:"init2", type:BUILDINGS.HOUSE, x: baseX+1, y: baseY, level:1 });

  logSys("🎁 開局：資源800、金幣2000、工人4、房屋2");

  nextPronounceTarget();
  return data;
}

/* =========================
   LOGIN / REGISTER FLOW
========================= */
function showLogin(){
  loginScreen.classList.remove("hidden");
  planetSelectScreen.classList.add("hidden");
}

function showPlanetSelect(){
  planetSelectScreen.classList.remove("hidden");
  loginScreen.classList.add("hidden");
}

function hideAllOverlays(){
  loginScreen.classList.add("hidden");
  planetSelectScreen.classList.add("hidden");
}

function renderPlanetSelect(){
  planetGrid.innerHTML = "";
  let selected = null;

  for(const p of PLANETS){
    const btn = document.createElement("button");
    btn.className = "planetBtn";
    btn.innerHTML = `🌍 <b>${p.name}</b><div style="font-size:11px;opacity:.85;margin-top:3px;">加成：${Object.keys(p.bonus).join(", ")}</div>`;

    btn.onclick = ()=>{
      document.querySelectorAll(".planetBtn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      selected = p.id;
      CURRENT_DATA = CURRENT_DATA || {};
      CURRENT_DATA.planetId = selected;
    };

    planetGrid.appendChild(btn);
  }

  btnConfirmPlanet.onclick = ()=>{
    if(!selected){
      alert("請選擇星球");
      return;
    }

    // lock planet
    const users = loadAllUsers();
    users[CURRENT_USER].planetLocked = selected;
    users[CURRENT_USER].data = createNewPlayerData(selected);
    saveAllUsers(users);

    CURRENT_DATA = users[CURRENT_USER].data;
    hideAllOverlays();
    startGame();
  };
}

btnRegister.onclick = ()=>{
  const u = loginUser.value.trim();
  const p = loginPass.value.trim();
  if(u.length < 3 || p.length < 4){
    alert("用戶名至少3字，密碼至少4字");
    return;
  }

  const users = loadAllUsers();
  if(users[u]){
    alert("此用戶已存在");
    return;
  }

  users[u] = {
    passHash: hashPass(p),
    createdAt: now(),
    planetLocked: null,
    data: null
  };

  saveAllUsers(users);

  alert("註冊成功，請登入");
};

btnLogin.onclick = ()=>{
  const u = loginUser.value.trim();
  const p = loginPass.value.trim();
  const users = loadAllUsers();

  if(!users[u]){
    alert("用戶不存在");
    return;
  }
  if(users[u].passHash !== hashPass(p)){
    alert("密碼錯誤");
    return;
  }

  CURRENT_USER = u;

  // If no planet locked => select
  if(!users[u].planetLocked){
    showPlanetSelect();
    renderPlanetSelect();
    return;
  }

  // load data or create if missing
  if(!users[u].data){
    users[u].data = createNewPlayerData(users[u].planetLocked);
    saveAllUsers(users);
  }

  CURRENT_DATA = users[u].data;

  hideAllOverlays();
  startGame();
};

/* =========================
   START GAME
========================= */
function startGame(){
  // offline simulate
  simulateOffline();

  // setup assistant name
  if(window.AENO_CHARACTERS && window.AENO_CHARACTERS.length){
    const c = window.AENO_CHARACTERS[randi(0, window.AENO_CHARACTERS.length)];
    assistantNameEl.textContent = c.name;
    assistantBodyEl.querySelector(".assistantHead").textContent = c.icon;
  } else {
    assistantNameEl.textContent = "AenoFox";
  }

  // camera center to base
  state.camera.zoom = 1.05;
  state.camera.x = window.innerWidth/2 - CURRENT_DATA.base.x*TILE*state.camera.zoom;
  state.camera.y = window.innerHeight/2 - CURRENT_DATA.base.y*TILE*state.camera.zoom;

  // build UI
  renderBuildButtons();
  renderTechButtons();

  // pron target
  if(!CURRENT_DATA.pronounce.target) nextPronounceTarget();

  // panel default location
  mainPanel.style.left = "auto";
  mainPanel.style.top = "8px";
  mainPanel.style.right = "8px";

  // hide boot
  bootScreen.classList.add("hidden");

  running = true;
  lastFrame = now();
  logSys("✅ 遊戲開始：" + CURRENT_DATA.planetName);
  requestAnimationFrame(loop);
}

/* =========================
   INIT
========================= */
function init(){
  // service worker
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }

  // show login
  showLogin();

  // boot delay
  setTimeout(()=>{
    bootScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
  }, 800);

  // auto UI refresh
  setInterval(()=>{
    if(CURRENT_DATA){
      updateUI();
    }
  }, 800);

  logSys("🚀 AENO V3 載入完成。");
}

init();
