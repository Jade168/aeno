// AENO V2 - Phaser 手遊卡通育成版
// 功能：拖動+縮放、地形（山/水/森林）、建築放置、資源自動產出、AI助手半自動建設、存檔

const SAVE_KEY = "AENO_V2_SAVE";

let selectedBuildType = null;
let aiAutoBuildEnabled = true;

let state = {
  wood: 120,
  stone: 80,
  energy: 20,
  gold: 50,
  aeno: 0,

  buildings: [],

  lastTick: Date.now()
};

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;

  try {
    const obj = JSON.parse(raw);
    if (obj && obj.buildings) {
      state = obj;
    }
  } catch (e) {}
}

function saveGame() {
  state.lastTick = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function manualSave() {
  saveGame();
  toast("💾 已保存進度！");
}

function toast(msg) {
  const panel = document.getElementById("assistantPanel");
  const msgEl = document.getElementById("assistantMsg");
  panel.style.display = "block";
  msgEl.innerText = msg;
  setTimeout(() => {}, 10);
}

function updateHUD() {
  document.getElementById("wood").innerText = Math.floor(state.wood);
  document.getElementById("stone").innerText = Math.floor(state.stone);
  document.getElementById("energy").innerText = Math.floor(state.energy);
  document.getElementById("gold").innerText = Math.floor(state.gold);
  document.getElementById("aeno").innerText = Math.floor(state.aeno);
}

function toggleBuildMenu() {
  const menu = document.getElementById("buildMenu");
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

function selectBuild(type) {
  selectedBuildType = type;
  toast("🏗 已選擇建築：" + type + "，請點地圖放置。");
}

function toggleAssistant() {
  const panel = document.getElementById("assistantPanel");
  panel.style.display = (panel.style.display === "block") ? "none" : "block";
}

function assistantAsk(topic) {
  const msg = document.getElementById("assistantMsg");

  if (topic === "close") {
    document.getElementById("assistantPanel").style.display = "none";
    return;
  }

  if (topic === "what") {
    msg.innerText =
      "你要先起民房、農田、伐木場同礦場，累積資源。之後起市場賺金幣，再慢慢升級科技！";
  }

  if (topic === "build") {
    msg.innerText =
      "按左邊【建築】→ 選建築 → 再點地圖空地放置。你可以拖動地圖同縮放。";
  }

  if (topic === "aeno") {
    msg.innerText =
      "AENO 非常稀有！礦場升級後，有低機率挖到AENO晶體。未來獸潮亦可能掉落。";
  }

  if (topic === "beast") {
    msg.innerText =
      "獸潮會周期性來襲！城牆跌到40%就會退潮。你要升級城牆同準備機器人修復。";
  }
}

function toggleAI() {
  aiAutoBuildEnabled = !aiAutoBuildEnabled;
  toast(aiAutoBuildEnabled ? "🤖 AI建設已啟用（最多用50%資源）" : "🛑 AI建設已停止");
}

// ---------------------------
// Phaser Game
// ---------------------------

loadGame();

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "phaser-container",
  backgroundColor: "#0b1220",
  physics: {
    default: "arcade",
    arcade: { debug: false }
  },
  scene: {
    preload,
    create,
    update
  },
  scale: {
    mode: Phaser.Scale.RESIZE
  }
};

const game = new Phaser.Game(config);

let cam;
let mapGroup;
let buildGroup;
let npcGroup;
let animalGroup;

let dragStart = null;
let isDragging = false;

const TILE = 64;
const MAP_W = 40;
const MAP_H = 60;

let terrain = [];

function preload() {
  // 用簡單圖形代替 sprite（之後你要真正卡通圖，我會再換成 PNG sprite）
}

function genTerrain() {
  terrain = [];
  for (let y = 0; y < MAP_H; y++) {
    const row = [];
    for (let x = 0; x < MAP_W; x++) {
      let t = "grass";

      // 河流
      if (x > 14 && x < 18 && y > 5 && y < 55) t = "water";

      // 山
      if ((x - 30) * (x - 30) + (y - 15) * (y - 15) < 70) t = "mountain";

      // 森林
      if ((x - 8) * (x - 8) + (y - 40) * (y - 40) < 120) t = "forest";

      row.push(t);
    }
    terrain.push(row);
  }
}

function tileColor(t) {
  if (t === "grass") return 0x22c55e;
  if (t === "water") return 0x38bdf8;
  if (t === "mountain") return 0x94a3b8;
  if (t === "forest") return 0x15803d;
  return 0xffffff;
}

function canBuildOn(t) {
  return (t === "grass" || t === "forest");
}

function buildCost(type) {
  const costs = {
    house: { wood: 30, stone: 10 },
    farm: { wood: 25, stone: 5 },
    lumber: { wood: 20, stone: 10 },
    quarry: { wood: 25, stone: 15 },
    power: { wood: 35, stone: 20 },
    market: { wood: 45, stone: 30 },
    wall: { wood: 40, stone: 40 }
  };
  return costs[type] || { wood: 9999, stone: 9999 };
}

function create() {
  cam = this.cameras.main;
  cam.setZoom(1);

  genTerrain();

  mapGroup = this.add.group();
  buildGroup = this.add.group();
  npcGroup = this.add.group();
  animalGroup = this.add.group();

  // 畫地圖
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = terrain[y][x];
      const rect = this.add.rectangle(
        x * TILE + TILE / 2,
        y * TILE + TILE / 2,
        TILE - 2,
        TILE - 2,
        tileColor(t)
      );

      rect.setStrokeStyle(2, 0x111827, 0.3);
      mapGroup.add(rect);

      // 水面閃爍
      if (t === "water") {
        this.tweens.add({
          targets: rect,
          alpha: { from: 0.9, to: 0.7 },
          duration: 900 + Math.random() * 700,
          yoyo: true,
          repeat: -1
        });
      }

      // 森林粒子感
      if (t === "forest") {
        rect.setFillStyle(0x15803d, 0.95);
      }
    }
  }

  // 讀取建築
  for (const b of state.buildings) {
    spawnBuilding(this, b.type, b.tx, b.ty, b.level, false);
  }

  // NPC（村民）
  for (let i = 0; i < 5; i++) {
    const npc = this.add.circle(500 + Math.random() * 200, 600 + Math.random() * 200, 12, 0xfbbf24);
    npc.setStrokeStyle(3, 0x111827, 0.8);
    npcGroup.add(npc);

    this.tweens.add({
      targets: npc,
      y: npc.y + 10,
      duration: 800 + Math.random() * 500,
      yoyo: true,
      repeat: -1
    });
  }

  // 動物（卡通圓點，下一版會換sprite）
  for (let i = 0; i < 7; i++) {
    const ani = this.add.circle(400 + Math.random() * 400, 900 + Math.random() * 400, 14, 0xfca5a5);
    ani.setStrokeStyle(3, 0x111827, 0.8);
    animalGroup.add(ani);

    this.tweens.add({
      targets: ani,
      scaleX: { from: 1.0, to: 1.05 },
      scaleY: { from: 1.0, to: 1.05 },
      duration: 900 + Math.random() * 600,
      yoyo: true,
      repeat: -1
    });
  }

  // AI助手（主角小動物）
  const assistant = this.add.circle(300, 500, 18, 0xa78bfa);
  assistant.setStrokeStyle(4, 0x111827, 0.9);
  assistant.name = "assistant";
  this.assistantSprite = assistant;

  this.tweens.add({
    targets: assistant,
    y: assistant.y - 12,
    duration: 650,
    yoyo: true,
    repeat: -1
  });

  // 拖動地圖
  this.input.on("pointerdown", (pointer) => {
    dragStart = { x: pointer.x, y: pointer.y, camX: cam.scrollX, camY: cam.scrollY };
    isDragging = false;
  });

  this.input.on("pointermove", (pointer) => {
    if (!dragStart) return;
    if (pointer.isDown) {
      const dx = pointer.x - dragStart.x;
      const dy = pointer.y - dragStart.y;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) isDragging = true;

      cam.scrollX = dragStart.camX - dx / cam.zoom;
      cam.scrollY = dragStart.camY - dy / cam.zoom;
    }
  });

  this.input.on("pointerup", (pointer) => {
    if (!dragStart) return;

    if (!isDragging && selectedBuildType) {
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      const tx = Math.floor(worldX / TILE);
      const ty = Math.floor(worldY / TILE);

      tryPlaceBuilding(this, selectedBuildType, tx, ty);
    }

    dragStart = null;
    isDragging = false;
  });

  // 滾輪縮放（電腦）
  this.input.on("wheel", (pointer, dx, dy) => {
    cam.zoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.6, 2.2);
  });

  // 定時資源產出
  this.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      tickEconomy(this);
      updateHUD();
      saveGame();
    }
  });

  // AI助手半自動建設（每20秒嘗試一次）
  this.time.addEvent({
    delay: 20000,
    loop: true,
    callback: () => {
      if (!aiAutoBuildEnabled) return;
      aiAutoBuild(this);
    }
  });

  updateHUD();
  toast("🌍 AENO V2 啟動！你可以拖動地圖、縮放、起建築。");
}

function tryPlaceBuilding(scene, type, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return;

  const t = terrain[ty][tx];
  if (!canBuildOn(t)) {
    toast("❌ 呢度唔可以建築（地形唔合適）");
    return;
  }

  for (const b of state.buildings) {
    if (b.tx === tx && b.ty === ty) {
      toast("❌ 呢個位置已經有建築");
      return;
    }
  }

  const cost = buildCost(type);

  if (state.wood < cost.wood || state.stone < cost.stone) {
    toast("❌ 資源不足，起唔到建築");
    return;
  }

  state.wood -= cost.wood;
  state.stone -= cost.stone;

  spawnBuilding(scene, type, tx, ty, 1, true);

  selectedBuildType = null;
  toast("✅ 建築完成！你可以繼續起其他建築。");
}

function spawnBuilding(scene, type, tx, ty, level, pushState) {
  const x = tx * TILE + TILE / 2;
  const y = ty * TILE + TILE / 2;

  let color = 0xffffff;
  let label = "";

  if (type === "house") { color = 0xf97316; label = "🏠"; }
  if (type === "farm") { color = 0xfacc15; label = "🌾"; }
  if (type === "lumber") { color = 0x16a34a; label = "🌲"; }
  if (type === "quarry") { color = 0x64748b; label = "⛏️"; }
  if (type === "power") { color = 0x60a5fa; label = "⚡"; }
  if (type === "market") { color = 0xf472b6; label = "🏦"; }
  if (type === "wall") { color = 0x9ca3af; label = "🧱"; }

  const base = scene.add.rectangle(x, y, 52, 52, color);
  base.setStrokeStyle(4, 0x111827, 0.85);
  base.setDepth(y);

  const text = scene.add.text(x - 14, y - 18, label, {
    fontSize: "26px",
    fontStyle: "bold"
  });
  text.setDepth(y + 1);

  const lvl = scene.add.text(x - 18, y + 10, "Lv." + level, {
    fontSize: "12px",
    fontStyle: "bold",
    color: "#111827"
  });
  lvl.setDepth(y + 2);

  // 卡通彈跳動畫
  base.scale = 0.2;
  text.scale = 0.2;
  lvl.scale = 0.2;

  scene.tweens.add({
    targets: [base, text, lvl],
    scale: 1,
    duration: 300,
    ease: "Back.Out"
  });

  buildGroup.addMultiple([base, text, lvl]);

  if (pushState) {
    state.buildings.push({ type, tx, ty, level: 1 });
  }
}

function tickEconomy(scene) {
  let woodGain = 0;
  let stoneGain = 0;
  let energyGain = 0;
  let goldGain = 0;

  for (const b of state.buildings) {
    const lv = b.level || 1;

    if (b.type === "farm") goldGain += 0.4 * lv;
    if (b.type === "lumber") woodGain += 1.2 * lv;
    if (b.type === "quarry") stoneGain += 1.0 * lv;
    if (b.type === "power") energyGain += 0.8 * lv;
    if (b.type === "market") goldGain += 1.2 * lv;
    if (b.type === "house") goldGain += 0.2 * lv;
  }

  state.wood += woodGain;
  state.stone += stoneGain;
  state.energy += energyGain;
  state.gold += goldGain;

  // 超低機率 AENO 掉落（暫代）
  if (Math.random() < 0.005) {
    state.aeno += 1;
    toast("💎 你挖到一粒 AENO！");
  }
}

function aiAutoBuild(scene) {
  // AI只能用50%資源
  const woodLimit = state.wood * 0.5;
  const stoneLimit = state.stone * 0.5;

  const buildOrder = ["lumber", "quarry", "farm", "house", "power", "market", "wall"];

  for (const type of buildOrder) {
    const cost = buildCost(type);
    if (cost.wood <= woodLimit && cost.stone <= stoneLimit) {
      // 找空地
      for (let i = 0; i < 200; i++) {
        const tx = 5 + Math.floor(Math.random() * (MAP_W - 10));
        const ty = 5 + Math.floor(Math.random() * (MAP_H - 10));

        if (!canBuildOn(terrain[ty][tx])) continue;

        let occupied = false;
        for (const b of state.buildings) {
          if (b.tx === tx && b.ty === ty) { occupied = true; break; }
        }
        if (occupied) continue;

        state.wood -= cost.wood;
        state.stone -= cost.stone;

        spawnBuilding(scene, type, tx, ty, 1, true);
        toast("🐾 AI助手幫你起咗：" + type + "（只用50%資源規則）");
        return;
      }
    }
  }

  toast("🐾 AI助手：資源不足，暫時唔起建築。");
}

function update() {
  // 村民隨機走動
  npcGroup.getChildren().forEach(npc => {
    npc.x += (Math.random() - 0.5) * 1.2;
    npc.y += (Math.random() - 0.5) * 1.2;
  });

  // 動物隨機走動
  animalGroup.getChildren().forEach(a => {
    a.x += (Math.random() - 0.5) * 1.0;
    a.y += (Math.random() - 0.5) * 1.0;
  });

  // AI助手跟住玩家基地中心漂移
  if (this.assistantSprite) {
    this.assistantSprite.x += (Math.random() - 0.5) * 0.6;
    this.assistantSprite.y += (Math.random() - 0.5) * 0.6;
  }
}

// 手機雙指縮放（簡易）
let lastDist = null;
window.addEventListener("touchmove", (e) => {
  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (lastDist !== null) {
      const delta = dist - lastDist;
      const scene = game.scene.scenes[0];
      if (scene && scene.cameras && scene.cameras.main) {
        scene.cameras.main.zoom = Phaser.Math.Clamp(scene.cameras.main.zoom + delta * 0.001, 0.6, 2.2);
      }
    }
    lastDist = dist;
  }
}, { passive: true });

window.addEventListener("touchend", () => {
  lastDist = null;
});

// 每30秒自動保存
setInterval(() => {
  saveGame();
}, 30000);

// 初次HUD更新
setInterval(() => updateHUD(), 500);
