(() => {
  "use strict";

  // =========================
  // 基本設定
  // =========================
  const VERSION = "3.0.0";
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const bootScreen = document.getElementById("bootScreen");

  const statGold = document.getElementById("statGold");
  const statAeno = document.getElementById("statAeno");
  const statWood = document.getElementById("statWood");
  const statStone = document.getElementById("statStone");
  const statIron = document.getElementById("statIron");
  const statFood = document.getElementById("statFood");
  const statPop = document.getElementById("statPop");
  const statTerritory = document.getElementById("statTerritory");
  const statCivil = document.getElementById("statCivil");
  const statBeast = document.getElementById("statBeast");

  const sysLog = document.getElementById("sysLog");

  const assistantTalkBtn = document.getElementById("assistantTalkBtn");
  const chatBox = document.getElementById("chatBox");
  const chatClose = document.getElementById("chatClose");
  const chatSend = document.getElementById("chatSend");
  const chatInput = document.getElementById("chatInput");
  const chatLog = document.getElementById("chatLog");

  const btnSaveNow = document.getElementById("btnSaveNow");
  const btnReset = document.getElementById("btnReset");

  const btnExpand = document.getElementById("btnExpand");
  const btnZoomReset = document.getElementById("btnZoomReset");
  const btnAutoOn = document.getElementById("btnAutoOn");
  const btnAutoOff = document.getElementById("btnAutoOff");

  const btnPlayAd = document.getElementById("btnPlayAd");
  const btnStopAd = document.getElementById("btnStopAd");
  const adAudio = document.getElementById("adAudio");

  const marketItem = document.getElementById("marketItem");
  const marketQty = document.getElementById("marketQty");
  const btnBuy = document.getElementById("btnBuy");
  const btnSell = document.getElementById("btnSell");
  const marketPriceHint = document.getElementById("marketPriceHint");

  const panel = document.getElementById("mainPanel");
  const panelHeader = document.getElementById("panelHeader");
  const panelMinBtn = document.getElementById("panelMinBtn");
  const panelHideBtn = document.getElementById("panelHideBtn");
  const panelRestoreBtn = document.getElementById("panelRestoreBtn");

  // =========================
  // Canvas Resize
  // =========================
  function resize() {
    canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
    canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
  }
  window.addEventListener("resize", resize);
  resize();

  // =========================
  // 隨機工具（保密用）
  // =========================
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // =========================
  // 地圖設定
  // =========================
  const MAP_W = 50;
  const MAP_H = 50;

  const TILE = 64;
  const ISO_ANGLE = Math.PI / 6;
  const COS = Math.cos(ISO_ANGLE);
  const SIN = Math.sin(ISO_ANGLE);

  let cameraX = 0;
  let cameraY = 0;
  let zoom = 1.0;

  const ZOOM_MIN = 0.35;
  const ZOOM_MAX = 2.2;

  // =========================
  // 遊戲資料
  // =========================
  const STORAGE_KEY = "AENO_V3_SAVE";

  let game = null;

  const DEFAULT_SAVE = () => ({
    version: VERSION,
    seed: "AENO-" + Math.floor(Math.random() * 99999999),
    lastTick: Date.now(),

    autoMode: true,

    resources: {
      gold: 800,
      aeno: 0,
      wood: 50,
      stone: 20,
      iron: 0,
      food: 60
    },

    stats: {
      population: 4,
      territory: 9,
      civil: 15,
      wall: 0
    },

    buildings: {
      house: 2,
      farm: 1,
      lumber: 1,
      quarry: 0,
      mine: 0,
      factory: 0,
      wall: 0,
      robot: 0
    },

    tech: {
      tools: 0,
      agri: 0,
      mining: 0,
      robotics: 0,
      economy: 0
    },

    ad: {
      listeningSeconds: 0,
      todayScore: 0
    },

    world: {
      explored: [],
      beastsKilled: 0,
      lootPending: 0
    },

    market: {
      wood: 5,
      stone: 7,
      iron: 15,
      food: 4,
      lastUpdate: Date.now()
    },

    buildQueue: []
  });

  function log(msg) {
    const time = new Date().toLocaleTimeString();
    sysLog.innerHTML = `<div>🕒 ${time} - ${msg}</div>` + sysLog.innerHTML;
  }

  // =========================
  // 保存/讀取
  // =========================
  function saveGame() {
    game.lastTick = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    log("已保存遊戲");
  }

  function loadGame() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVE();

    try {
      const data = JSON.parse(raw);
      if (!data.resources || !data.stats) return DEFAULT_SAVE();
      return data;
    } catch {
      return DEFAULT_SAVE();
    }
  }

  // =========================
  // 離線補算
  // =========================
  function offlineProgress() {
    const now = Date.now();
    const dt = Math.max(0, now - game.lastTick);
    const seconds = Math.floor(dt / 1000);

    if (seconds <= 2) return;

    const maxSeconds = 3600 * 8;
    const safeSec = Math.min(seconds, maxSeconds);

    for (let i = 0; i < safeSec; i++) {
      tickLogic(1, true);
    }

    log(`離線補算完成：${safeSec} 秒`);
  }

  // =========================
  // 地圖 tile
  // =========================
  const TILE_TYPES = {
    grass: 0,
    forest: 1,
    mountain: 2,
    river: 3
  };

  let map = [];

  function generateMap() {
    const seedFn = xmur3(game.seed);
    const rand = mulberry32(seedFn());

    map = [];
    for (let y = 0; y < MAP_H; y++) {
      const row = [];
      for (let x = 0; x < MAP_W; x++) {
        let t = TILE_TYPES.grass;

        const r = rand();
        if (r < 0.18) t = TILE_TYPES.forest;
        else if (r < 0.26) t = TILE_TYPES.mountain;
        else if (r < 0.30) t = TILE_TYPES.river;

        row.push(t);
      }
      map.push(row);
    }

    // 保證起點附近一定有森林
    for (let y = 20; y < 28; y++) {
      for (let x = 20; x < 28; x++) {
        if (Math.random() < 0.45) map[y][x] = TILE_TYPES.forest;
      }
    }

    // 保證中心有草地可建
    for (let y = 22; y < 26; y++) {
      for (let x = 22; x < 26; x++) {
        map[y][x] = TILE_TYPES.grass;
      }
    }

    log("世界生成完成（森林/山脈/河流已存在）");
  }

  // =========================
  // 建築位置（中心城市）
  // =========================
  const townCenter = { x: 24, y: 24 };

  const placedBuildings = [];

  function rebuildPlacedBuildings() {
    placedBuildings.length = 0;

    const add = (type, count) => {
      for (let i = 0; i < count; i++) {
        placedBuildings.push({
          type,
          x: townCenter.x + ((i % 3) - 1),
          y: townCenter.y + (Math.floor(i / 3) - 1)
        });
      }
    };

    add("house", game.buildings.house);
    add("farm", game.buildings.farm);
    add("lumber", game.buildings.lumber);
    add("quarry", game.buildings.quarry);
    add("mine", game.buildings.mine);
    add("factory", game.buildings.factory);
    add("wall", game.buildings.wall);
    add("robot", game.buildings.robot);
  }

  // =========================
  // ISO座標
  // =========================
  function gridToScreen(gx, gy) {
    const x = (gx - gy) * (TILE * COS);
    const y = (gx + gy) * (TILE * SIN);
    return {
      x: x * zoom + cameraX,
      y: y * zoom + cameraY
    };
  }

  // =========================
  // 繪圖：tile
  // =========================
  function drawTile(gx, gy, type) {
    const p = gridToScreen(gx, gy);
    const cx = p.x;
    const cy = p.y;

    const w = TILE * COS * zoom;
    const h = TILE * SIN * zoom;

    let fill = "#dcfce7";
    let stroke = "#bbf7d0";

    if (type === TILE_TYPES.forest) {
      fill = "#bbf7d0";
      stroke = "#86efac";
    }
    if (type === TILE_TYPES.mountain) {
      fill = "#e2e8f0";
      stroke = "#cbd5e1";
    }
    if (type === TILE_TYPES.river) {
      fill = "#bfdbfe";
      stroke = "#93c5fd";
    }

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2 * zoom;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + w, cy + h);
    ctx.lineTo(cx, cy + 2 * h);
    ctx.lineTo(cx - w, cy + h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // tile decorations
    if (type === TILE_TYPES.forest) {
      drawTree(cx, cy + h);
    } else if (type === TILE_TYPES.mountain) {
      drawMountain(cx, cy + h);
    } else if (type === TILE_TYPES.river) {
      drawWater(cx, cy + h);
    }
  }

  function drawTree(x, y) {
    const size = 10 * zoom;
    ctx.fillStyle = "#92400e";
    ctx.fillRect(x - size / 2, y + 10 * zoom, size, 18 * zoom);

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(x, y, 18 * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(x - 6 * zoom, y - 8 * zoom, 8 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMountain(x, y) {
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(x, y - 18 * zoom);
    ctx.lineTo(x - 22 * zoom, y + 18 * zoom);
    ctx.lineTo(x + 22 * zoom, y + 18 * zoom);
    ctx.closePath();
    ctx.fill();
  }

  function drawWater(x, y) {
    ctx.fillStyle = "rgba(59,130,246,0.6)";
    ctx.beginPath();
    ctx.ellipse(x, y + 6 * zoom, 18 * zoom, 10 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // =========================
  // 建築繪圖（卡通版）
  // =========================
  function drawBuilding(b) {
    const p = gridToScreen(b.x, b.y);
    const x = p.x;
    const y = p.y + 10 * zoom;

    if (b.type === "house") drawHouse(x, y);
    if (b.type === "farm") drawFarm(x, y);
    if (b.type === "lumber") drawLumber(x, y);
    if (b.type === "quarry") drawQuarry(x, y);
    if (b.type === "mine") drawMine(x, y);
    if (b.type === "factory") drawFactory(x, y);
    if (b.type === "wall") drawWall(x, y);
    if (b.type === "robot") drawRobotCenter(x, y);
  }

  function shadow(x, y, w, h) {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(x, y, w * zoom, h * zoom, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHouse(x, y) {
    shadow(x, y + 42 * zoom, 42, 16);

    const bodyGrad = ctx.createLinearGradient(x, y, x, y + 60 * zoom);
    bodyGrad.addColorStop(0, "#fef3c7");
    bodyGrad.addColorStop(1, "#fde68a");

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(x - 38 * zoom, y, 76 * zoom, 50 * zoom, 10 * zoom);
    ctx.fill();

    const roofGrad = ctx.createLinearGradient(x, y - 40 * zoom, x, y);
    roofGrad.addColorStop(0, "#fbbf24");
    roofGrad.addColorStop(1, "#f59e0b");

    ctx.fillStyle = roofGrad;
    ctx.beginPath();
    ctx.moveTo(x - 46 * zoom, y);
    ctx.quadraticCurveTo(x, y - 46 * zoom, x + 46 * zoom, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#92400e";
    ctx.beginPath();
    ctx.roundRect(x - 10 * zoom, y + 24 * zoom, 20 * zoom, 26 * zoom, 6 * zoom);
    ctx.fill();

    ctx.fillStyle = "#bfdbfe";
    ctx.beginPath();
    ctx.arc(x - 18 * zoom, y + 18 * zoom, 8 * zoom, 0, Math.PI * 2);
    ctx.arc(x + 18 * zoom, y + 18 * zoom, 8 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFarm(x, y) {
    shadow(x, y + 42 * zoom, 45, 16);

    ctx.fillStyle = "#fef9c3";
    ctx.beginPath();
    ctx.roundRect(x - 44 * zoom, y + 18 * zoom, 88 * zoom, 38 * zoom, 12 * zoom);
    ctx.fill();

    ctx.fillStyle = "#a16207";
    for (let i = -3; i <= 3; i++) {
      ctx.fillRect(x + i * 12 * zoom, y + 22 * zoom, 4 * zoom, 32 * zoom);
    }

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(x - 28 * zoom, y + 12 * zoom, 12 * zoom, 0, Math.PI * 2);
    ctx.arc(x + 28 * zoom, y + 12 * zoom, 12 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLumber(x, y) {
    shadow(x, y + 42 * zoom, 45, 16);

    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.roundRect(x - 40 * zoom, y + 10 * zoom, 80 * zoom, 46 * zoom, 14 * zoom);
    ctx.fill();

    ctx.fillStyle = "#92400e";
    ctx.fillRect(x - 30 * zoom, y + 30 * zoom, 60 * zoom, 10 * zoom);

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(x + 28 * zoom, y + 10 * zoom, 14 * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = `${14 * zoom}px system-ui`;
    ctx.fillText("🪓", x - 10 * zoom, y + 34 * zoom);
  }

  function drawQuarry(x, y) {
    shadow(x, y + 42 * zoom, 45, 16);

    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.roundRect(x - 42 * zoom, y + 10 * zoom, 84 * zoom, 46 * zoom, 14 * zoom);
    ctx.fill();

    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.arc(x - 18 * zoom, y + 30 * zoom, 12 * zoom, 0, Math.PI * 2);
    ctx.arc(x + 18 * zoom, y + 28 * zoom, 10 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMine(x, y) {
    shadow(x, y + 42 * zoom, 45, 16);

    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.roundRect(x - 42 * zoom, y + 12 * zoom, 84 * zoom, 44 * zoom, 14 * zoom);
    ctx.fill();

    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.arc(x, y + 34 * zoom, 16 * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(x + 18 * zoom, y + 20 * zoom, 6 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFactory(x, y) {
    shadow(x, y + 42 * zoom, 45, 16);

    ctx.fillStyle = "#dbeafe";
    ctx.beginPath();
    ctx.roundRect(x - 44 * zoom, y + 10 * zoom, 88 * zoom, 46 * zoom, 14 * zoom);
    ctx.fill();

    ctx.fillStyle = "#60a5fa";
    ctx.fillRect(x - 34 * zoom, y + 18 * zoom, 18 * zoom, 38 * zoom);
    ctx.fillRect(x - 10 * zoom, y + 26 * zoom, 18 * zoom, 30 * zoom);
    ctx.fillRect(x + 14 * zoom, y + 20 * zoom, 18 * zoom, 36 * zoom);

    ctx.fillStyle = "#fbbf24";
    ctx.font = `${14 * zoom}px system-ui`;
    ctx.fillText("AD", x + 22 * zoom, y + 20 * zoom);
  }

  function drawWall(x, y) {
    shadow(x, y + 42 * zoom, 50, 16);

    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.roundRect(x - 50 * zoom, y + 20 * zoom, 100 * zoom, 30 * zoom, 12 * zoom);
    ctx.fill();

    ctx.fillStyle = "#94a3b8";
    for (let i = -4; i <= 4; i++) {
      ctx.fillRect(x + i * 12 * zoom, y + 20 * zoom, 4 * zoom, 30 * zoom);
    }
  }

  function drawRobotCenter(x, y) {
    shadow(x, y + 42 * zoom, 45, 16);

    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.roundRect(x - 42 * zoom, y + 10 * zoom, 84 * zoom, 46 * zoom, 14 * zoom);
    ctx.fill();

    ctx.fillStyle = "#0ea5e9";
    ctx.beginPath();
    ctx.arc(x, y + 30 * zoom, 18 * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x - 8 * zoom, y + 26 * zoom, 4 * zoom, 0, Math.PI * 2);
    ctx.arc(x + 8 * zoom, y + 26 * zoom, 4 * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fbbf24";
    ctx.font = `${14 * zoom}px system-ui`;
    ctx.fillText("🤖", x - 10 * zoom, y + 50 * zoom);
  }

  // =========================
  // UI Tabs
  // =========================
  const tabBtns = document.querySelectorAll(".tabBtn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tabPage").forEach((p) => p.classList.remove("active"));
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  // =========================
  // Panel Drag
  // =========================
  let dragPanel = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  panelHeader.addEventListener("pointerdown", (e) => {
    dragPanel = true;
    dragOffsetX = e.clientX - panel.offsetLeft;
    dragOffsetY = e.clientY - panel.offsetTop;
    panelHeader.setPointerCapture(e.pointerId);
  });

  panelHeader.addEventListener("pointermove", (e) => {
    if (!dragPanel) return;
    const nx = e.clientX - dragOffsetX;
    const ny = e.clientY - dragOffsetY;

    panel.style.left = clamp(nx, 5, window.innerWidth - panel.offsetWidth - 5) + "px";
    panel.style.top = clamp(ny, 5, window.innerHeight - panel.offsetHeight - 5) + "px";
    panel.style.right = "auto";
  });

  panelHeader.addEventListener("pointerup", () => {
    dragPanel = false;
  });

  panelMinBtn.addEventListener("click", () => {
    panel.style.height = "120px";
  });

  panelHideBtn.addEventListener("click", () => {
    panel.classList.add("hidden");
    panelRestoreBtn.classList.remove("hidden");
  });

  panelRestoreBtn.addEventListener("click", () => {
    panel.classList.remove("hidden");
    panelRestoreBtn.classList.add("hidden");
    panel.style.height = "560px";
  });

  // =========================
  // Chat UI
  // =========================
  function addChat(who, msg) {
    const div = document.createElement("div");
    div.innerHTML = `<b>${who}：</b>${msg}`;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  assistantTalkBtn.addEventListener("click", () => {
    chatBox.classList.toggle("hidden");
    if (!chatBox.classList.contains("hidden")) {
      addChat("助手", "我已經準備好幫你自動收資源、起建築、升級。你可以輸入指令。");
    }
  });

  chatClose.addEventListener("click", () => {
    chatBox.classList.add("hidden");
  });

  chatSend.addEventListener("click", () => {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = "";
    addChat("玩家", text);
    handleCommand(text);
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      chatSend.click();
    }
  });

  function handleCommand(text) {
    const t = text.toLowerCase();

    if (t.includes("停止") || t.includes("off")) {
      game.autoMode = false;
      addChat("助手", "收到！已停止自動建築/升級，但資源仍會自動收集。");
      return;
    }

    if (t.includes("自動") || t.includes("on")) {
      game.autoMode = true;
      addChat("助手", "已啟動自動模式，我會幫你安排建築與升級。");
      return;
    }

    if (t.includes("收集")) {
      addChat("助手", "我已經自動收集資源中（每秒）。");
      return;
    }

    if (t.includes("建造") || t.includes("建築")) {
      game.buildQueue.push({ type: "house", t: Date.now() });
      addChat("助手", "我已加入建築隊列：房屋");
      return;
    }

    if (t.includes("升級")) {
      addChat("助手", "升級系統已開啟（自動模式會自己升級）。");
      return;
    }

    if (t.includes("巡邏")) {
      addChat("助手", "巡邏中…若文明度滿100%會開始獸潮防守。");
      return;
    }

    addChat("助手", "我聽唔明，但你可以試：建造 / 升級 / 收集 / 巡邏 / 停止自動");
  }

  // =========================
  // 建築按鈕
  // =========================
  document.querySelectorAll(".buildBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.build;
      game.buildQueue.push({ type, t: Date.now() });
      log(`已排程建築：${type}`);
    });
  });

  // =========================
  // Tech Buttons
  // =========================
  document.querySelectorAll(".techBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tech = btn.dataset.tech;
      const cost = 200 + game.tech[tech] * 250;

      if (game.resources.gold < cost) {
        log("金幣不足，無法研究科技");
        return;
      }

      game.resources.gold -= cost;
      game.tech[tech] += 1;
      log(`科技升級成功：${tech} Lv.${game.tech[tech]}`);
    });
  });

  // =========================
  // Market
  // =========================
  function updateMarketPrices() {
    const now = Date.now();
    if (now - game.market.lastUpdate < 60000) return;

    const seedFn = xmur3(game.seed + now);
    const rand = mulberry32(seedFn());

    ["wood", "stone", "iron", "food"].forEach((k) => {
      const base = game.market[k];
      const delta = (rand() - 0.5) * 2;
      game.market[k] = Math.max(1, Math.round(base + delta));
    });

    game.market.lastUpdate = now;
  }

  function refreshMarketHint() {
    marketPriceHint.textContent =
      `木:${game.market.wood} 金 | 石:${game.market.stone} 金 | 鐵:${game.market.iron} 金 | 食:${game.market.food} 金`;
  }

  btnBuy.addEventListener("click", () => {
    const item = marketItem.value;
    const qty = Math.max(1, Math.floor(Number(marketQty.value || 1)));
    const price = game.market[item] * qty;

    if (game.resources.gold < price) {
      log("金幣不足，買入失敗");
      return;
    }

    game.resources.gold -= price;
    game.resources[item] += qty;
    log(`買入成功：${item} x${qty}`);
  });

  btnSell.addEventListener("click", () => {
    const item = marketItem.value;
    const qty = Math.max(1, Math.floor(Number(marketQty.value || 1)));
    if (game.resources[item] < qty) {
      log("資源不足，賣出失敗");
      return;
    }

    const price = game.market[item] * qty;
    game.resources[item] -= qty;
    game.resources.gold += price;
    log(`賣出成功：${item} x${qty}`);
  });

  // =========================
  // Ad music (測試音樂)
  // =========================
  let adPlaying = false;
  let adTimer = null;

  function startAd() {
    if (adPlaying) return;
    adPlaying = true;

    // 測試音源（可換成廣告商URL）
    adAudio.src = "https://cdn.pixabay.com/download/audio/2022/03/15/audio_7f7b2fbe11.mp3?filename=future-bass-beat-117858.mp3";
    adAudio.volume = 0.55;

    adAudio.play().catch(() => {
      log("瀏覽器禁止自動播放，請再按一次播放");
    });

    log("開始播放廣告歌曲（AENO算法開始計算）");

    if (adTimer) clearInterval(adTimer);
    adTimer = setInterval(() => {
      game.ad.listeningSeconds += 1;
    }, 1000);
  }

  function stopAd() {
    adPlaying = false;
    adAudio.pause();
    if (adTimer) clearInterval(adTimer);
    adTimer = null;
    log("已停止廣告歌曲");
  }

  btnPlayAd.addEventListener("click", startAd);
  btnStopAd.addEventListener("click", stopAd);

  // =========================
  // Zoom & Expand
  // =========================
  btnZoomReset.addEventListener("click", () => {
    zoom = 1.0;
    cameraX = canvas.width / 2;
    cameraY = 120;
  });

  btnExpand.addEventListener("click", () => {
    const cost = Math.floor(250 + game.stats.territory * 18);

    if (game.resources.gold < cost) {
      log("金幣不足，無法擴土");
      return;
    }

    game.resources.gold -= cost;
    game.stats.territory += 2;
    game.stats.civil += 1;

    log(`領土擴大成功 (+2)，花費 ${cost} 金`);
  });

  btnAutoOn.addEventListener("click", () => {
    game.autoMode = true;
    log("自動模式 ON");
  });

  btnAutoOff.addEventListener("click", () => {
    game.autoMode = false;
    log("自動模式 OFF（資源仍自動收集）");
  });

  // =========================
  // Touch Zoom (Pinch)
  // =========================
  let touchMode = false;
  let lastDist = 0;

  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      touchMode = true;
      lastDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    if (!touchMode) return;
    if (e.touches.length !== 2) return;

    e.preventDefault();

    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );

    const diff = dist - lastDist;
    lastDist = dist;

    zoom += diff * 0.002;
    zoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    touchMode = false;
  });

  // =========================
  // 滑動地圖（拖動）
  // =========================
  let draggingMap = false;
  let lastPX = 0;
  let lastPY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    draggingMap = true;
    lastPX = e.clientX;
    lastPY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!draggingMap) return;
    const dx = e.clientX - lastPX;
    const dy = e.clientY - lastPY;
    lastPX = e.clientX;
    lastPY = e.clientY;

    cameraX += dx * devicePixelRatio;
    cameraY += dy * devicePixelRatio;
  });

  canvas.addEventListener("pointerup", () => {
    draggingMap = false;
  });

  // =========================
  // AENO 算法（已隱藏映射）
  // =========================
  function secretAenoCore() {
    // 不寫死規則
    const now = Date.now();
    const mix = game.seed + "|" + game.ad.listeningSeconds + "|" + game.stats.population + "|" + game.stats.civil + "|" + now;

    const seedFn = xmur3(mix);
    const rand = mulberry32(seedFn());

    // 成本因素（文明/人口/建築維護）
    const maintenance = (game.stats.population * 0.00003) + (Object.values(game.buildings).reduce((a,b)=>a+b,0) * 0.00002);

    // 學習因素（科技等級影響）
    const learning = (game.tech.tools + game.tech.agri + game.tech.mining + game.tech.robotics + game.tech.economy) * 0.00004;

    // 廣告聽歌因素（每秒加權，但含salt）
    const adFactor = Math.min(1.0, game.ad.listeningSeconds / 120) * (0.00018 + learning);

    // 野獸碎片因素
    const beastFactor = (game.world.beastsKilled * 0.000002);

    // 隨機salt（不可讀）
    const salt = (rand() * 0.00005);

    // 結果（極細增量）
    let aenoDelta = adFactor + beastFactor + salt - maintenance;

    if (aenoDelta < 0) aenoDelta = 0;

    return aenoDelta;
  }

  // =========================
  // tick：每秒資源/自動建築/獸潮
  // =========================
  function tickLogic(dtSec = 1, silent = false) {
    updateMarketPrices();

    // 食物產出
    const farmBoost = 1 + game.tech.agri * 0.08;
    game.resources.food += game.buildings.farm * 0.12 * farmBoost * dtSec;

    // 木材產出（伐木場 + 森林存在加成）
    const forestBoost = 1.0;
    const lumberBoost = 1 + game.tech.tools * 0.06;
    game.resources.wood += game.buildings.lumber * 0.14 * forestBoost * lumberBoost * dtSec;

    // 石頭
    const quarryBoost = 1 + game.tech.mining * 0.07;
    game.resources.stone += game.buildings.quarry * 0.10 * quarryBoost * dtSec;

    // 鐵礦
    game.resources.iron += game.buildings.mine * 0.06 * quarryBoost * dtSec;

    // 金幣（人口工作 + 工廠）
    const ecoBoost = 1 + game.tech.economy * 0.08;
    game.resources.gold += (game.stats.population * 0.04 + game.buildings.factory * 0.18) * ecoBoost * dtSec;

    // AENO 增量（隱藏算法）
    const aenoDelta = secretAenoCore() * dtSec;
    game.resources.aeno += aenoDelta;

    // 文明度上升
    const civilUp = (game.buildings.house * 0.0008 + game.buildings.factory * 0.0012) * dtSec;
    game.stats.civil = clamp(game.stats.civil + civilUp, 0, 100);

    // 人口增長（有食物才增）
    if (game.resources.food > game.stats.population * 4) {
      if (Math.random() < 0.002 * dtSec) {
        game.stats.population += 1;
        if (!silent) log("人口增加 +1");
      }
    }

    // 自動建築（助手核心）
    if (game.autoMode) {
      autoAssistantBuild(dtSec, silent);
    }

    // 獸潮（文明100% 才開始）
    if (game.stats.civil >= 100) {
      if (Math.random() < 0.0025 * dtSec) {
        const loot = Math.floor(30 + Math.random() * 80);
        game.world.beastsKilled += 1;
        game.world.lootPending += loot;

        if (!silent) log(`⚔️ 獸潮來襲！擊退成功，掉落碎片 +${loot}`);
      }
    }

    // 自動收取戰利品
    if (game.world.lootPending > 0) {
      const take = Math.min(game.world.lootPending, 4);
      game.world.lootPending -= take;
      game.resources.gold += take * 0.6;
    }

    // 修正資源下限
    Object.keys(game.resources).forEach((k) => {
      if (game.resources[k] < 0) game.resources[k] = 0;
    });
  }

  function autoAssistantBuild(dtSec, silent) {
    // 先確保有農田
    if (game.buildings.farm < 1) {
      tryBuild("farm", silent);
      return;
    }

    // 確保有伐木場（避免木材不足）
    if (game.buildings.lumber < 1) {
      tryBuild("lumber", silent);
      return;
    }

    // 人口越多需要房屋
    if (game.buildings.house < Math.ceil(game.stats.population / 2)) {
      tryBuild("house", silent);
      return;
    }

    // 逐步開礦
    if (game.buildings.quarry < 1 && game.stats.territory >= 9) {
      tryBuild("quarry", silent);
      return;
    }

    if (game.buildings.mine < 1 && game.buildings.quarry >= 1) {
      tryBuild("mine", silent);
      return;
    }

    // 工廠
    if (game.buildings.factory < 1 && game.buildings.mine >= 1) {
      tryBuild("factory", silent);
      return;
    }

    // 城牆（文明度越高越需要）
    if (game.buildings.wall < 1 && game.stats.civil > 60) {
      tryBuild("wall", silent);
      return;
    }

    // 機器人中心（後期）
    if (game.buildings.robot < 1 && game.tech.robotics >= 1) {
      tryBuild("robot", silent);
      return;
    }

    // 自動擴土（用金幣）
    if (game.resources.gold > 1000 && Math.random() < 0.002 * dtSec) {
      game.resources.gold -= 250;
      game.stats.territory += 1;
      if (!silent) log("🏞️ 助手自動擴大領土 +1");
    }

    // 處理玩家排程建築
    if (game.buildQueue.length > 0) {
      const job = game.buildQueue.shift();
      tryBuild(job.type, silent);
    }
  }

  function tryBuild(type, silent) {
    const cost = getBuildCost(type);

    if (
      game.resources.gold < cost.gold ||
      game.resources.wood < cost.wood ||
      game.resources.stone < cost.stone ||
      game.resources.iron < cost.iron ||
      game.resources.food < cost.food
    ) {
      if (!silent) log(`資源不足：無法建造 ${type}`);
      return false;
    }

    game.resources.gold -= cost.gold;
    game.resources.wood -= cost.wood;
    game.resources.stone -= cost.stone;
    game.resources.iron -= cost.iron;
    game.resources.food -= cost.food;

    game.buildings[type] += 1;
    game.stats.civil += 0.8;

    rebuildPlacedBuildings();

    if (!silent) log(`🏗️ 建造成功：${type} +1`);
    return true;
  }

  function getBuildCost(type) {
    const base = {
      house: { gold: 120, wood: 35, stone: 10, iron: 0, food: 10 },
      farm: { gold: 100, wood: 20, stone: 0, iron: 0, food: 0 },
      lumber: { gold: 120, wood: 10, stone: 10, iron: 0, food: 0 },
      quarry: { gold: 180, wood: 10, stone: 20, iron: 0, food: 0 },
      mine: { gold: 240, wood: 20, stone: 30, iron: 0, food: 0 },
      factory: { gold: 350, wood: 40, stone: 50, iron: 10, food: 0 },
      wall: { gold: 300, wood: 10, stone: 80, iron: 10, food: 0 },
      robot: { gold: 600, wood: 50, stone: 80, iron: 40, food: 0 }
    };

    const lv = game.buildings[type] || 0;
    const scale = 1 + lv * 0.18;

    return {
      gold: Math.floor(base[type].gold * scale),
      wood: Math.floor(base[type].wood * scale),
      stone: Math.floor(base[type].stone * scale),
      iron: Math.floor(base[type].iron * scale),
      food: Math.floor(base[type].food * scale)
    };
  }

  // =========================
  // UI 更新
  // =========================
  function updateUI() {
    statGold.textContent = Math.floor(game.resources.gold);
    statAeno.textContent = game.resources.aeno.toFixed(6);
    statWood.textContent = Math.floor(game.resources.wood);
    statStone.textContent = Math.floor(game.resources.stone);
    statIron.textContent = Math.floor(game.resources.iron);
    statFood.textContent = Math.floor(game.resources.food);

    statPop.textContent = game.stats.population;
    statTerritory.textContent = game.stats.territory;
    statCivil.textContent = Math.floor(game.stats.civil) + "%";

    if (game.stats.civil >= 100) {
      statBeast.textContent = `⚔️ 進行中（擊殺:${game.world.beastsKilled}）`;
    } else {
      statBeast.textContent = `未啟動（需100%文明）`;
    }

    refreshMarketHint();
  }

  // =========================
  // 繪圖主循環
  // =========================
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = "#eaf6ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // tile
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        drawTile(x, y, map[y][x]);
      }
    }

    // buildings
    placedBuildings.forEach(drawBuilding);

    // 顯示文明中心提示
    const p = gridToScreen(townCenter.x, townCenter.y);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.font = `${16 * zoom}px system-ui`;
    ctx.fillText("🏛️ 中央城鎮", p.x - 40 * zoom, p.y - 20 * zoom);

    requestAnimationFrame(draw);
  }

  // =========================
  // 主循環 Tick
  // =========================
  function gameLoop() {
    tickLogic(1, false);
    updateUI();
  }

  // =========================
  // 保存按鈕
  // =========================
  btnSaveNow.addEventListener("click", () => saveGame());

  btnReset.addEventListener("click", () => {
    if (!confirm("確定清除存檔？")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  // =========================
  // 自動保存
  // =========================
  setInterval(saveGame, 30000);

  // =========================
  // 初始化
  // =========================
  function init() {
    game = loadGame();

    cameraX = canvas.width / 2;
    cameraY = 140;

    generateMap();
    rebuildPlacedBuildings();

    offlineProgress();

    updateUI();

    setInterval(gameLoop, 1000);

    requestAnimationFrame(draw);

    // boot hide
    setTimeout(() => {
      bootScreen.style.display = "none";
      log("遊戲載入完成");
      addChat("助手", "已啟動！我會自動收資源與建築。你可以播放廣告歌曲來獲得 AENO。");
    }, 600);

    // 強制更新 Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js?v=" + Date.now()).then((reg) => {
        reg.update();
      });
    }
  }

  init();
})();

// =====================================================
// AENO V3 PATCH: 防止切走/回來跳去選星球 & 鏡頭跳位
// =====================================================

// ⚠️ 如果你原本變量名唔係呢幾個，改成你實際使用的：
// cameraX / cameraY / zoomLevel / currentPlanetId

function AENO_saveCameraState() {
  try {
    const camState = {
      cameraX: (typeof cameraX === "number") ? cameraX : 0,
      cameraY: (typeof cameraY === "number") ? cameraY : 0,
      zoomLevel: (typeof zoomLevel === "number") ? zoomLevel : 1,
      currentPlanetId: (typeof currentPlanetId === "string") ? currentPlanetId : "planet_1",
      ts: Date.now()
    };
    localStorage.setItem("AENO_CAMERA_STATE_V3", JSON.stringify(camState));
  } catch (e) {}
}

function AENO_loadCameraState() {
  try {
    const raw = localStorage.getItem("AENO_CAMERA_STATE_V3");
    if (!raw) return;

    const s = JSON.parse(raw);

    if (typeof s.cameraX === "number") cameraX = s.cameraX;
    if (typeof s.cameraY === "number") cameraY = s.cameraY;
    if (typeof s.zoomLevel === "number") zoomLevel = s.zoomLevel;
    if (typeof s.currentPlanetId === "string") currentPlanetId = s.currentPlanetId;
  } catch (e) {}
}

// 防止某些版本 init() 強行 reset planet/camera
window.addEventListener("load", () => {
  setTimeout(() => {
    AENO_loadCameraState();
  }, 200);
});

// 手機切走、鎖屏、切 App
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    AENO_saveCameraState();
    if (typeof saveGame === "function") saveGame();
  } else {
    setTimeout(() => {
      AENO_loadCameraState();
    }, 50);
  }
});

// iOS / Android 常用
window.addEventListener("pagehide", () => {
  AENO_saveCameraState();
  if (typeof saveGame === "function") saveGame();
});

// 保險
window.addEventListener("beforeunload", () => {
  AENO_saveCameraState();
  if (typeof saveGame === "function") saveGame();
});

// 每 10 秒自動存一次鏡頭，防止崩潰/閃退
setInterval(() => {
  AENO_saveCameraState();
}, 10000);
