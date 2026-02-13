/************************************************************
 AENO - 手遊卡通育成版 V3 (Phaser 3)
 - 直屏、可拖動縮放
 - 卡通地形（山/水/森林）
 - 動物/村民走動
 - 資源自動產出
 - AI 助手半自動建設/升級（最多用50%資源）
 - 獸潮自動週期
 - 機器人採集（簡化版）
 - LocalStorage 存檔
 ************************************************************/

(() => {
  "use strict";

  // -------------------------
  // 版本控制（只改這個就會觸發更新存檔結構）
  // -------------------------
  const GAME_VERSION = "3.0.0";

  // -------------------------
  // LocalStorage Key
  // -------------------------
  const SAVE_KEY = "AENO_SAVE_V3";

  // -------------------------
  // 遊戲世界設定
  // -------------------------
  const WORLD_W = 3600;
  const WORLD_H = 3600;
  const TILE = 80;

  // -------------------------
  // 建築資料
  // -------------------------
  const BUILDINGS = {
    house: {
      name: "民房",
      emoji: "🏠",
      cost: { wood: 40, stone: 20, gold: 10 },
      prod: { gold: 0.25 },
      hp: 80,
      levelMax: 10
    },
    farm: {
      name: "農田",
      emoji: "🌾",
      cost: { wood: 20, stone: 10, gold: 5 },
      prod: { gold: 0.15, energy: 0.05 },
      hp: 60,
      levelMax: 10
    },
    lumber: {
      name: "伐木場",
      emoji: "🌲",
      cost: { wood: 10, stone: 20, gold: 5 },
      prod: { wood: 1.1 },
      hp: 80,
      levelMax: 10
    },
    quarry: {
      name: "礦場",
      emoji: "⛏️",
      cost: { wood: 15, stone: 30, gold: 10 },
      prod: { stone: 0.9 },
      hp: 90,
      levelMax: 10
    },
    power: {
      name: "發電站",
      emoji: "⚡",
      cost: { wood: 30, stone: 30, gold: 20 },
      prod: { energy: 0.8 },
      hp: 100,
      levelMax: 10
    },
    market: {
      name: "市場",
      emoji: "🏦",
      cost: { wood: 60, stone: 40, gold: 40 },
      prod: { gold: 0.6 },
      hp: 120,
      levelMax: 10
    },
    wall: {
      name: "城牆",
      emoji: "🧱",
      cost: { wood: 25, stone: 80, gold: 20 },
      prod: {},
      hp: 300,
      levelMax: 5
    }
  };

  // -------------------------
  // 初始資源（首次新檔）
  // -------------------------
  const DEFAULT_RES = {
    wood: 120,
    stone: 90,
    energy: 40,
    gold: 30,
    aeno: 0
  };

  // -------------------------
  // AI助手設定
  // -------------------------
  const AI_HELPER = {
    enabled: false,
    useRatio: 0.5, // 只可用50%資源
    intervalSec: 6,
    name: "Lupus Minor"
  };

  // -------------------------
  // 獸潮設定
  // -------------------------
  const BEAST = {
    intervalSec: 70,     // 每70秒一波（示範版，未來可改成公式）
    durationSec: 20,     // 持續20秒
    dps: 1.2,            // 每秒扣城牆耐久
    retreatAt: 0.4       // 低於40%退潮
  };

  // -------------------------
  // 機器人設定
  // -------------------------
  const ROBOT = {
    intervalSec: 40,
    maxTakeRatio: 0.2 // 最多抽取20%
  };

  // -------------------------
  // 遊戲狀態
  // -------------------------
  let state = {
    version: GAME_VERSION,
    res: { ...DEFAULT_RES },
    buildings: [],
    wallHP: 100,
    wallHPMax: 100,
    time: 0,
    aiEnabled: false,
    lastBeast: 0,
    beastActive: false,
    beastTimer: 0,
    lastRobot: 0,
    robotMsg: "",
    tutorialShown: false
  };

  // 建築放置模式
  let buildMode = null;

  // Phaser 對象
  let game, sceneMain;
  let cam, worldLayer;
  let mapObjects = [];
  let animals = [];
  let villagers = [];
  let robotSprite = null;

  // UI
  const ui = {
    wood: document.getElementById("wood"),
    stone: document.getElementById("stone"),
    energy: document.getElementById("energy"),
    gold: document.getElementById("gold"),
    aeno: document.getElementById("aeno"),
    assistantPanel: document.getElementById("assistantPanel"),
    assistantMsg: document.getElementById("assistantMsg"),
    buildMenu: document.getElementById("buildMenu")
  };

  // -------------------------
  // 對外暴露給 index.html 的按鈕事件
  // -------------------------
  window.toggleBuildMenu = () => {
    ui.buildMenu.style.display = ui.buildMenu.style.display === "block" ? "none" : "block";
  };

  window.toggleAssistant = () => {
    ui.assistantPanel.style.display = ui.assistantPanel.style.display === "block" ? "none" : "block";
  };

  window.toggleAI = () => {
    state.aiEnabled = !state.aiEnabled;
    showAssistantMessage(state.aiEnabled
      ? "🤖 AI建設已啟動！我會幫你半自動起建築/升級，但只會用最多 50% 資源。"
      : "🛑 AI建設已停止！所有建設交返你控制。"
    );
    saveGame();
  };

  window.selectBuild = (type) => {
    if (!BUILDINGS[type]) return;
    buildMode = type;
    showAssistantMessage(`🏗 已選擇建築：${BUILDINGS[type].emoji} ${BUILDINGS[type].name}，請點地圖空地放置。`);
    ui.buildMenu.style.display = "none";
  };

  window.manualSave = () => {
    saveGame();
    showAssistantMessage("💾 已保存！你關網頁都唔會重置。");
  };

  window.assistantAsk = (type) => {
    if (type === "close") {
      ui.assistantPanel.style.display = "none";
      return;
    }

    const answers = {
      what: "你要做嘅就係：起伐木場/礦場→起發電站→起市場→升級→等獸潮→收集戰利品。",
      build: "按左邊🏗建築 → 揀建築 → 再點地圖放置。之後可點建築升級。",
      aeno: "AENO 主要由獸潮戰利品、機器人探索、以及高級礦產事件中獲得（未來會更完整）。",
      beast: "獸潮會定期攻城！城牆跌到 40% 會自動退潮。你要維修城牆，保持 100% 才可以安全。"
    };

    showAssistantMessage(answers[type] || "我仲學緊，遲啲會更聰明～");
  };

  // -------------------------
  // 存檔
  // -------------------------
  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Save failed:", e);
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data || data.version !== GAME_VERSION) return false;

      state = data;
      return true;
    } catch (e) {
      console.warn("Load failed:", e);
      return false;
    }
  }

  // -------------------------
  // UI 更新
  // -------------------------
  function updateHUD() {
    ui.wood.textContent = Math.floor(state.res.wood);
    ui.stone.textContent = Math.floor(state.res.stone);
    ui.energy.textContent = Math.floor(state.res.energy);
    ui.gold.textContent = Math.floor(state.res.gold);
    ui.aeno.textContent = Math.floor(state.res.aeno);
  }

  function showAssistantMessage(msg) {
    ui.assistantPanel.style.display = "block";
    ui.assistantMsg.textContent = msg;
  }

  // -------------------------
  // 資源消耗檢查
  // -------------------------
  function canAfford(cost) {
    for (const k in cost) {
      if ((state.res[k] || 0) < cost[k]) return false;
    }
    return true;
  }

  function payCost(cost) {
    for (const k in cost) {
      state.res[k] -= cost[k];
      if (state.res[k] < 0) state.res[k] = 0;
    }
  }

  // -------------------------
  // 地形生成（卡通風）
  // -------------------------
  function generateTerrain(scene) {
    const g = scene.add.graphics();
    g.setDepth(-10);

    // 草地底色
    g.fillStyle(0x22c55e, 1);
    g.fillRect(0, 0, WORLD_W, WORLD_H);

    // 水域
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(200, WORLD_W - 600);
      const y = Phaser.Math.Between(200, WORLD_H - 600);
      const w = Phaser.Math.Between(300, 650);
      const h = Phaser.Math.Between(250, 550);

      g.fillStyle(0x38bdf8, 1);
      g.fillRoundedRect(x, y, w, h, 80);

      g.lineStyle(6, 0x0ea5e9, 1);
      g.strokeRoundedRect(x + 8, y + 8, w - 16, h - 16, 70);
    }

    // 山
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(100, WORLD_W - 200);
      const y = Phaser.Math.Between(100, WORLD_H - 200);
      const r = Phaser.Math.Between(80, 160);

      g.fillStyle(0x9ca3af, 1);
      g.fillCircle(x, y, r);

      g.fillStyle(0x6b7280, 1);
      g.fillCircle(x + r * 0.25, y + r * 0.15, r * 0.65);

      g.fillStyle(0xffffff, 0.25);
      g.fillCircle(x - r * 0.25, y - r * 0.25, r * 0.45);
    }

    // 森林
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(80, WORLD_W - 80);
      const y = Phaser.Math.Between(80, WORLD_H - 80);

      g.fillStyle(0x14532d, 1);
      g.fillCircle(x, y, 24);

      g.fillStyle(0x166534, 1);
      g.fillCircle(x + 10, y + 6, 18);

      g.fillStyle(0x065f46, 1);
      g.fillCircle(x - 10, y + 6, 18);
    }

    g.generateTexture("terrainTex", WORLD_W, WORLD_H);
    g.destroy();

    const img = scene.add.image(0, 0, "terrainTex").setOrigin(0, 0);
    img.setDepth(-20);
    return img;
  }

  // -------------------------
  // 生成卡通角色（動物/村民）
  // -------------------------
  function createCartoonAnimal(scene, x, y, type = "bird") {
    const container = scene.add.container(x, y);

    const body = scene.add.circle(0, 0, 12, 0xf59e0b).setStrokeStyle(3, 0x111827);
    const head = scene.add.circle(10, -8, 9, 0xfbbf24).setStrokeStyle(3, 0x111827);

    const eye = scene.add.circle(13, -10, 2, 0x111827);
    const wing = scene.add.ellipse(-5, 0, 18, 12, 0xfde68a).setStrokeStyle(2, 0x111827);

    container.add([wing, body, head, eye]);

    container.setDepth(10);
    container.speed = Phaser.Math.FloatBetween(20, 50);
    container.dir = Phaser.Math.FloatBetween(0, Math.PI * 2);

    return container;
  }

  function createVillager(scene, x, y) {
    const c = scene.add.container(x, y);

    const body = scene.add.rectangle(0, 10, 22, 28, 0x60a5fa).setStrokeStyle(3, 0x111827);
    const head = scene.add.circle(0, -8, 12, 0xfcd34d).setStrokeStyle(3, 0x111827);

    const eye1 = scene.add.circle(-4, -10, 2, 0x111827);
    const eye2 = scene.add.circle(4, -10, 2, 0x111827);
    const mouth = scene.add.arc(0, -5, 4, 4, 0, 180, false, 0xef4444).setStrokeStyle(2, 0x111827);

    c.add([body, head, eye1, eye2, mouth]);
    c.setDepth(11);

    c.speed = Phaser.Math.FloatBetween(12, 26);
    c.dir = Phaser.Math.FloatBetween(0, Math.PI * 2);

    return c;
  }

  // -------------------------
  // 建築生成（卡通方塊 + emoji）
  // -------------------------
  function spawnBuilding(scene, b) {
    const def = BUILDINGS[b.type];
    const container = scene.add.container(b.x, b.y);

    const base = scene.add.rectangle(0, 0, 66, 66, 0xffffff, 0.9)
      .setStrokeStyle(4, 0x111827);

    const top = scene.add.rectangle(0, -10, 66, 26, 0x93c5fd, 1)
      .setStrokeStyle(4, 0x111827);

    const label = scene.add.text(-20, -18, def.emoji, {
      fontFamily: "Arial",
      fontSize: "28px"
    });

    const lvl = scene.add.text(-30, 22, `Lv.${b.level}`, {
      fontFamily: "Arial",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#111827"
    });

    container.add([base, top, label, lvl]);
    container.setDepth(20);

    container.buildingId = b.id;
    container.isBuilding = true;

    // 點擊建築升級
    base.setInteractive({ useHandCursor: true });
    base.on("pointerdown", () => {
      upgradeBuilding(b.id);
    });

    b._sprite = container;
    b._lvlText = lvl;

    return container;
  }

  function upgradeBuilding(id) {
    const b = state.buildings.find(x => x.id === id);
    if (!b) return;

    const def = BUILDINGS[b.type];
    if (b.level >= def.levelMax) {
      showAssistantMessage("📌 已經升到最高級啦！");
      return;
    }

    // 升級成本：每級乘 1.35
    const factor = Math.pow(1.35, b.level);
    const cost = {};
    for (const k in def.cost) cost[k] = Math.floor(def.cost[k] * factor);

    if (!canAfford(cost)) {
      showAssistantMessage(`❌ 升級資源不足！需要：木${cost.wood||0} 石${cost.stone||0} 金${cost.gold||0}`);
      return;
    }

    payCost(cost);
    b.level += 1;

    // HP 增加
    b.hpMax = Math.floor(b.hpMax * 1.18);
    b.hp = b.hpMax;

    if (b._lvlText) b._lvlText.setText(`Lv.${b.level}`);

    showAssistantMessage(`⬆️ ${def.emoji} ${def.name} 升級成功！現在 Lv.${b.level}`);
    saveGame();
    updateHUD();
  }

  // -------------------------
  // 建築放置
  // -------------------------
  function placeBuilding(scene, x, y, type) {
    const def = BUILDINGS[type];
    if (!def) return;

    if (!canAfford(def.cost)) {
      showAssistantMessage(`❌ 資源不足，無法建造 ${def.name}`);
      return;
    }

    payCost(def.cost);

    const b = {
      id: "b" + Date.now() + "_" + Math.floor(Math.random() * 9999),
      type,
      x,
      y,
      level: 1,
      hpMax: def.hp,
      hp: def.hp
    };

    state.buildings.push(b);
    spawnBuilding(scene, b);

    // 城牆更新（如果建造城牆）
    if (type === "wall") {
      state.wallHPMax += 220;
      state.wallHP += 220;
    }

    saveGame();
    updateHUD();
  }

  // -------------------------
  // 資源自動產出（每秒）
  // -------------------------
  function produceResources(dtSec) {
    for (const b of state.buildings) {
      const def = BUILDINGS[b.type];
      if (!def) continue;

      const levelFactor = 1 + (b.level - 1) * 0.25;

      for (const k in def.prod) {
        state.res[k] = (state.res[k] || 0) + def.prod[k] * levelFactor * dtSec;
      }
    }

    // 自然慢慢補能量（少少）
    state.res.energy += 0.02 * dtSec;

    // 資源上限保護（避免爆炸）
    for (const k in state.res) {
      if (state.res[k] > 999999999) state.res[k] = 999999999;
    }
  }

  // -------------------------
  // AI助手：半自動建設 + 升級
  // -------------------------
  function aiHelperTick() {
    if (!state.aiEnabled) return;

    // 只可以用最多 50% 資源
    const usable = {};
    for (const k in state.res) usable[k] = state.res[k] * AI_HELPER.useRatio;

    function canAffordUsable(cost) {
      for (const k in cost) {
        if ((usable[k] || 0) < cost[k]) return false;
      }
      return true;
    }

    // 建設優先順序
    const plan = ["lumber", "quarry", "power", "house", "farm", "market"];

    // 若城牆太低，優先補城牆（升級/補建）
    const wallPercent = state.wallHPMax > 0 ? state.wallHP / state.wallHPMax : 1;
    if (wallPercent < 0.7) {
      // 嘗試建造城牆
      const cost = BUILDINGS.wall.cost;
      if (canAffordUsable(cost)) {
        const x = Phaser.Math.Between(200, WORLD_W - 200);
        const y = Phaser.Math.Between(200, WORLD_H - 200);
        placeBuilding(sceneMain, x, y, "wall");
        showAssistantMessage("🧱 AI助手：城牆不足，我幫你加固啦！");
        return;
      }
    }

    // 嘗試升級一個建築（最便宜升級優先）
    let best = null;
    let bestCost = Infinity;

    for (const b of state.buildings) {
      const def = BUILDINGS[b.type];
      if (!def) continue;
      if (b.level >= def.levelMax) continue;

      const factor = Math.pow(1.35, b.level);
      const cost = {};
      for (const k in def.cost) cost[k] = Math.floor(def.cost[k] * factor);

      let sum = 0;
      for (const k in cost) sum += cost[k];

      if (sum < bestCost && canAffordUsable(cost)) {
        bestCost = sum;
        best = b;
      }
    }

    if (best) {
      upgradeBuilding(best.id);
      showAssistantMessage(`🐾 ${AI_HELPER.name}：我幫你升級咗一座建築！`);
      return;
    }

    // 若無可升級，就建新建築
    for (const t of plan) {
      const cost = BUILDINGS[t].cost;
      if (canAffordUsable(cost)) {
        const x = Phaser.Math.Between(220, WORLD_W - 220);
        const y = Phaser.Math.Between(220, WORLD_H - 220);
        placeBuilding(sceneMain, x, y, t);
        showAssistantMessage(`🐾 ${AI_HELPER.name}：我幫你起咗 ${BUILDINGS[t].emoji} ${BUILDINGS[t].name}`);
        return;
      }
    }
  }

  // -------------------------
  // 獸潮系統
  // -------------------------
  function beastTick(dtSec) {
    // 觸發
    if (!state.beastActive && (state.time - state.lastBeast) > BEAST.intervalSec) {
      state.beastActive = true;
      state.beastTimer = 0;
      state.lastBeast = state.time;
      showAssistantMessage("🦖 獸潮來襲！！快守住城牆！！");
    }

    if (!state.beastActive) return;

    state.beastTimer += dtSec;

    // 扣城牆
    state.wallHP -= BEAST.dps * dtSec;
    if (state.wallHP < 0) state.wallHP = 0;

    // 低於40%退潮
    const percent = state.wallHPMax > 0 ? state.wallHP / state.wallHPMax : 1;
    if (percent <= BEAST.retreatAt) {
      state.beastActive = false;
      showAssistantMessage("🌊 獸潮退走了！你可以按提示收集野獸屍體（未來會加按鈕）。");

      // 獸潮獎勵：少量AENO機率
      const chance = 0.18;
      if (Math.random() < chance) {
        const gain = Phaser.Math.Between(1, 3);
        state.res.aeno += gain;
        showAssistantMessage(`💎 你從獸潮戰利品中挖到 AENO +${gain}！`);
      }

      // 同時掉落金幣
      state.res.gold += Phaser.Math.Between(10, 35);

      saveGame();
      updateHUD();
      return;
    }

    // 持續時間完結
    if (state.beastTimer >= BEAST.durationSec) {
      state.beastActive = false;
      showAssistantMessage("🦴 獸潮暫時完結，你守住了基地！");
      saveGame();
    }
  }

  // -------------------------
  // 機器人採集（簡化版：會出現並帶資源返嚟）
  // -------------------------
  function robotTick() {
    if ((state.time - state.lastRobot) < ROBOT.intervalSec) return;

    state.lastRobot = state.time;

    // 抽取上限 20%（模擬）
    const takeWood = Math.floor(state.res.wood * 0.05);
    const takeStone = Math.floor(state.res.stone * 0.04);

    // 其實係帶返資源（遊戲設定：去星球採集返嚟）
    const gainWood = Phaser.Math.Between(20, 90);
    const gainStone = Phaser.Math.Between(15, 60);
    const gainGold = Phaser.Math.Between(5, 22);

    state.res.wood += gainWood;
    state.res.stone += gainStone;
    state.res.gold += gainGold;

    // 小機率獲得 AENO
    if (Math.random() < 0.12) {
      const a = Phaser.Math.Between(1, 2);
      state.res.aeno += a;
      showAssistantMessage(`🤖 機器人探索成功！帶回資源 +AENO ${a}`);
    } else {
      showAssistantMessage(`🤖 機器人探索成功！木+${gainWood} 石+${gainStone} 金+${gainGold}`);
    }

    saveGame();
    updateHUD();

    // 視覺上生成一隻小機器人跑過
    if (sceneMain) {
      if (robotSprite) robotSprite.destroy();

      robotSprite = sceneMain.add.container(
        Phaser.Math.Between(200, WORLD_W - 200),
        Phaser.Math.Between(200, WORLD_H - 200)
      );

      const body = sceneMain.add.rectangle(0, 0, 26, 22, 0xe5e7eb).setStrokeStyle(3, 0x111827);
      const eye1 = sceneMain.add.circle(-6, -3, 3, 0x111827);
      const eye2 = sceneMain.add.circle(6, -3, 3, 0x111827);
      const antenna = sceneMain.add.rectangle(0, -18, 4, 10, 0x9ca3af).setStrokeStyle(2, 0x111827);
      const tip = sceneMain.add.circle(0, -24, 5, 0xf97316).setStrokeStyle(2, 0x111827);

      robotSprite.add([body, eye1, eye2, antenna, tip]);
      robotSprite.setDepth(12);

      sceneMain.tweens.add({
        targets: robotSprite,
        y: robotSprite.y - 10,
        duration: 400,
        yoyo: true,
        repeat: 5
      });
    }
  }

  // -------------------------
  // 角色移動
  // -------------------------
  function moveEntities(dtSec) {
    function moveOne(e) {
      e.x += Math.cos(e.dir) * e.speed * dtSec;
      e.y += Math.sin(e.dir) * e.speed * dtSec;

      // 轉向
      if (Math.random() < 0.02) {
        e.dir += Phaser.Math.FloatBetween(-0.7, 0.7);
      }

      // 邊界反彈
      if (e.x < 80) e.dir = 0;
      if (e.x > WORLD_W - 80) e.dir = Math.PI;
      if (e.y < 80) e.dir = Math.PI / 2;
      if (e.y > WORLD_H - 80) e.dir = -Math.PI / 2;

      // 小跳動動畫
      e.scaleX = 1 + Math.sin(state.time * 3) * 0.02;
      e.scaleY = 1 + Math.cos(state.time * 3) * 0.02;
    }

    animals.forEach(moveOne);
    villagers.forEach(moveOne);
  }

  // -------------------------
  // Phaser 主場景
  // -------------------------
  class MainScene extends Phaser.Scene {
    constructor() {
      super("MainScene");
    }

    preload() {}

    create() {
      sceneMain = this;

      // 地形
      worldLayer = generateTerrain(this);

      // Camera
      cam = this.cameras.main;
      cam.setBounds(0, 0, WORLD_W, WORLD_H);
      cam.centerOn(WORLD_W / 2, WORLD_H / 2);
      cam.setZoom(0.9);

      // 拖動
      let drag = false;
      let lastX = 0, lastY = 0;

      this.input.on("pointerdown", (p) => {
        drag = true;
        lastX = p.x;
        lastY = p.y;
      });

      this.input.on("pointerup", () => drag = false);

      this.input.on("pointermove", (p) => {
        if (!drag) return;
        if (p.isDown) {
          cam.scrollX -= (p.x - lastX) / cam.zoom;
          cam.scrollY -= (p.y - lastY) / cam.zoom;
          lastX = p.x;
          lastY = p.y;
        }
      });

      // 滾輪縮放（手機雙指 zoom 由瀏覽器處理，Phaser 仍可支援）
      this.input.on("wheel", (pointer, dx, dy) => {
        cam.zoom -= dy * 0.001;
        cam.zoom = Phaser.Math.Clamp(cam.zoom, 0.45, 1.7);
      });

      // 點地圖放建築
      this.input.on("pointerdown", (p) => {
        const wx = p.worldX;
        const wy = p.worldY;

        if (buildMode) {
       
