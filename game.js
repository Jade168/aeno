(() => {
  "use strict";

  const BUILDINGS = {
    house:  { name:"民房",   emoji:"🏠", cost:{wood:40,stone:20,gold:10}, prod:{gold:0.25}, hp:80, levelMax:10 },
    farm:   { name:"農田",   emoji:"🌾", cost:{wood:20,stone:10,gold:5},  prod:{gold:0.15,energy:0.05}, hp:60, levelMax:10 },
    lumber: { name:"伐木場", emoji:"🌲", cost:{wood:10,stone:20,gold:5},  prod:{wood:1.1}, hp:80, levelMax:10 },
    quarry:{ name:"礦場",   emoji:"⛏️", cost:{wood:15,stone:30,gold:10}, prod:{stone:0.9}, hp:90, levelMax:10 },
    power:  { name:"發電站", emoji:"⚡", cost:{wood:30,stone:30,gold:20}, prod:{energy:0.8}, hp:100, levelMax:10 },
    market: { name:"市場",   emoji:"🏦", cost:{wood:60,stone:40,gold:40}, prod:{gold:0.6}, hp:120, levelMax:10 },
    wall:   { name:"城牆",   emoji:"🧱", cost:{wood:25,stone:80,gold:20}, prod:{}, hp:300, levelMax:5 }
  };

  const DEFAULT_RES = { wood:120, stone:90, energy:40, gold:30, aeno:0 };
  const AI_USE_RATIO = 0.5;

  let state = JSON.parse(localStorage.getItem("AENO_SAVE")) || {
    res:{...DEFAULT_RES},
    buildings:[],
    wallHP:100, wallHPMax:100,
    time:0,
    aiEnabled:false
  };

  let buildMode = null;
  let game;
  let aiPet;

  // UI
  const $ = id => document.getElementById(id);
  const ui = {
    wood: $("wood"), stone: $("stone"), energy: $("energy"), gold: $("gold"), aeno: $("aeno"),
    assistantMsg: $("assistantMsg"),
    aiBtn: $("aiBtn")
  };

  function updateUI() {
    ui.wood.textContent = Math.floor(state.res.wood);
    ui.stone.textContent = Math.floor(state.res.stone);
    ui.energy.textContent = Math.floor(state.res.energy);
    ui.gold.textContent = Math.floor(state.res.gold);
    ui.aeno.textContent = Math.floor(state.res.aeno);
  }

  function save() {
    localStorage.setItem("AENO_SAVE", JSON.stringify(state));
  }

  function canUse(cost) {
    for (let k in cost) {
      if ((state.res[k] || 0) < cost[k] / AI_USE_RATIO) return false;
    }
    return true;
  }

  function pay(cost) {
    for (let k in cost) state.res[k] -= cost[k];
  }

  function aiBuild() {
    if (!state.aiEnabled) return;
    let list = ["lumber","quarry","power","farm","house","market","wall"];
    for (let t of list) {
      let c = BUILDINGS[t];
      if (canUse(c.cost)) {
        pay(c.cost);
        state.buildings.push({
          id:Date.now(), type:t, x:400+Math.random()*600, y:400+Math.random()*600,
          level:1, hp:c.hp, hpMax:c.hp
        });
        say(`🏗️ 幫你起咗 ${c.name}`);
        save();
        updateUI();
        return;
      }
    }
  }

  function aiUpgrade() {
    if (!state.aiEnabled) return;
    for (let b of state.buildings) {
      let def = BUILDINGS[b.type];
      if (b.level >= def.levelMax) continue;
      let mul = Math.pow(1.4, b.level);
      let cost = {};
      for (let k in def.cost) cost[k] = Math.floor(def.cost[k] * mul);
      if (canUse(cost)) {
        pay(cost);
        b.level++;
        say(`⬆️ ${def.name} 升級 Lv${b.level}`);
        save();
        updateUI();
        return;
      }
    }
  }

  function say(text) {
    ui.assistantMsg.textContent = text;
  }

  // 公開按鈕函數
  window.toggleAI = () => {
    state.aiEnabled = !state.aiEnabled;
    ui.aiBtn.textContent = state.aiEnabled ? "🤖 暫停AI" : "🤖 啟動AI";
    say(state.aiEnabled ? "✅ AI半自動啟動（淨用一半資源）" : "🛑 AI已暫停");
    save();
  };

  window.toggleBuildMenu = () => {
    let m = $("buildMenu");
    m.style.display = m.style.display == "block" ? "none" : "block";
  };

  window.toggleAssistant = () => {
    let p = $("assistantPanel");
    p.style.display = p.style.display == "block" ? "none" : "block";
  };

  window.selectBuild = (t) => {
    buildMode = t;
    $("buildMenu").style.display = "none";
    say(`🏗️ 選咗：${BUILDINGS[t].name}，點地圖放置`);
  };

  window.manualSave = () => {
    save();
    say("💾 已保存");
  };

  window.assistantAsk = (t) => {
    if (t == "what") say("我會幫你起建築同升級，淨用一半資源㗎！");
    if (t == "build") say("點🏗建築，揀完點地圖就得");
    if (t == "aeno") say("AENO係去中心化幣，獸潮同採集會挖到～");
    if (t == "beast") say("獸潮會攻擊城牆，打完有機會獎AENO！");
    if (t == "close") toggleAssistant();
  };

  // 遊戲主循環
  setInterval(() => {
    state.time++;
    // 資源增長
    for (let b of state.buildings) {
      let d = BUILDINGS[b.type];
      let mul = 1 + (b.level-1)*0.25;
      for (let k in d.prod) state.res[k] += d.prod[k] * mul;
    }
    updateUI();
    save();
  }, 1000);

  // AI 每6秒做一次
  setInterval(() => {
    aiUpgrade();
    setTimeout(aiBuild, 2000);
  }, 6000);

  // 畫面
  class Scene extends Phaser.Scene {
    constructor() { super("S"); }
    create() {
      // 地圖底
      this.add.rectangle(0,0,4000,4000,0x22cc55).setOrigin(0,0);
      // 可愛AI小動物（固定左下角，唔擋視線）
      aiPet = this.add.circle(60, this.cameras.main.height-60, 22, 0xfccb4d)
        .setScrollFactor(0)
        .setDepth(9999);
      this.add.circle(60, this.cameras.main.height-60, 18, 0xfbbf24).setScrollFactor(0).setDepth(9999);
      // 拖動地圖
      this.input.on("pointerdown", () => this.drag = true);
      this.input.on("pointerup", () => this.drag = false);
      this.input.on("pointermove", (p) => {
        if (this.drag) this.cameras.main.scrollX -= p.movementX;
        if (this.drag) this.cameras.main.scrollY -= p.movementY;
      });
      // 點地圖起建築
      this.input.on("pointerdown", (p) => {
        if (!buildMode) return;
        let x = p.worldX;
        let y = p.worldY;
        let c = BUILDINGS[buildMode];
        if (state.res.wood >= c.cost.wood && state.res.stone >= c.cost.stone && state.res.gold >= c.cost.gold) {
          pay(c.cost);
          state.buildings.push({id:Date.now(), type:buildMode, x, y, level:1, hp:c.hp, hpMax:c.hp});
          say(`✅ 起咗 ${c.name}`);
          updateUI();
          save();
        } else {
          say("❌ 資源唔夠");
        }
        buildMode = null;
      });
      updateUI();
      say("🐾 我係你可愛AI助手，隨時幫你建設！");
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    width: window.innerWidth,
    height: window.innerHeight,
    scene: Scene,
    scale: { mode: Phaser.Scale.FIT }
  };

  game = new Phaser.Game(config);

})();
