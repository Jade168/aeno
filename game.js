// AENO 量子文明崛起 - 全新版本
// 簡化版，等基本功能正常運作

(() => {
  "use strict";

  // ============================
  // 版本
  // ============================
  const VERSION = "2026-02-24 V4.0";

  // ============================
  // 常量
  // ============================
  const YEARS_PER_SECOND = 10 / 86400; // 1秒 = 10/86400年
  const DNA_EVOLUTION_YEARS = 100;

  // ============================
  // 20星球數據
  // ============================
  const PLANETS = {
    earth: { name: "地球", emoji: "🌍", lang: "粵語", res: { wood: 1.2, stone: 1.0, iron: 0.8, food: 1.1 } },
    mars: { name: "火星", emoji: "🔴", lang: "日語", res: { wood: 0.8, stone: 1.3, iron: 1.2, food: 0.7 } },
    ocean: { name: "海洋星", emoji: "🌊", lang: "法語", res: { wood: 1.0, stone: 0.9, iron: 0.7, food: 1.4 } },
    jungle: { name: "叢林星", emoji: "🌴", lang: "西班牙語", res: { wood: 1.5, stone: 0.7, iron: 0.6, food: 1.3 } },
    planet05: { name: "德意志星", emoji: "🏰", lang: "德語", res: { wood: 0.9, stone: 1.4, iron: 1.5, food: 0.8 } },
    planet06: { name: "羅馬星", emoji: "🏛️", lang: "意大利語", res: { wood: 1.0, stone: 1.2, iron: 0.9, food: 1.0 } },
    planet07: { name: "北極星", emoji: "❄️", lang: "俄語", res: { wood: 0.6, stone: 1.5, iron: 1.3, food: 0.5 } },
    planet08: { name: "三星", emoji: "🏯", lang: "韓語", res: { wood: 1.1, stone: 1.0, iron: 1.1, food: 1.0 } },
    planet09: { name: "泰星", emoji: "🕌", lang: "泰語", res: { wood: 1.2, stone: 0.8, iron: 0.7, food: 1.4 } },
    planet10: { name: "越星", emoji: "🎋", lang: "越南語", res: { wood: 1.3, stone: 0.9, iron: 0.8, food: 1.2 } },
    planet11: { name: "梵星", emoji: "🪷", lang: "印地語", res: { wood: 1.1, stone: 1.1, iron: 1.0, food: 1.1 } },
    planet12: { name: "沙星", emoji: "🏜️", lang: "阿拉伯語", res: { wood: 0.5, stone: 1.4, iron: 1.2, food: 0.4 } },
    planet13: { name: "森星", emoji: "🦁", lang: "葡萄牙語", res: { wood: 1.4, stone: 0.8, iron: 0.9, food: 1.1 } },
    planet14: { name: "墨星", emoji: "🌵", lang: "西班牙語", res: { wood: 0.9, stone: 1.5, iron: 1.0, food: 0.9 } },
    planet15: { name: "希臘星", emoji: "🏺", lang: "希臘語", res: { wood: 0.8, stone: 1.3, iron: 1.1, food: 0.9 } },
    planet16: { name: "土星", emoji: "🕌", lang: "土耳其語", res: { wood: 0.9, stone: 1.2, iron: 1.1, food: 0.9 } },
    planet17: { name: "北歐星", emoji: "🌌", lang: "瑞典語", res: { wood: 0.7, stone: 1.4, iron: 1.2, food: 0.6 } },
    planet18: { name: "澳星", emoji: "🦘", lang: "英語", res: { wood: 1.0, stone: 1.1, iron: 1.0, food: 1.1 } },
    planet19: { name: "非星", emoji: "🦁", lang: "斯瓦希里語", res: { wood: 1.2, stone: 1.0, iron: 0.9, food: 1.2 } },
    planet20: { name: "中原星", emoji: "🐉", lang: "粵語", res: { wood: 1.1, stone: 1.0, iron: 1.0, food: 1.1 } },
    blackhole: { name: "黑洞", emoji: "🕳️", lang: "元語", res: { wood: 2.0, stone: 2.0, iron: 2.0, food: 2.0 } }
  };

  // 建築數據
  const BUILDINGS = {
    house: { name: "房屋", emoji: "🏠", cost: { wood: 100, stone: 50 } },
    farm: { name: "農田", emoji: "🌾", cost: { wood: 80, stone: 30 } },
    lumber: { name: "伐木場", emoji: "🪓", cost: { wood: 50, stone: 80 } },
    quarry: { name: "採石場", emoji: "⛏️", cost: { wood: 80, stone: 50 } },
    mine: { name: "礦場", emoji: "⛏️", cost: { wood: 100, stone: 100 } },
    market: { name: "市集", emoji: "🏪", cost: { wood: 200, stone: 150 } },
    wall: { name: "城牆", emoji: "🧱", cost: { wood: 300, stone: 300 } },
    warehouse: { name: "倉庫", emoji: "🏚️", cost: { wood: 150, stone: 150 } },
    lab: { name: "研究所", emoji: "🔬", cost: { wood: 500, stone: 300, iron: 100 } },
    temple: { name: "寺廟", emoji: "⛩️", cost: { wood: 400, stone: 400 } },
    factory: { name: "工廠", emoji: "🏭", cost: { wood: 300, stone: 200, iron: 200 } },
    tower: { name: "廣播塔", emoji: "📡", cost: { wood: 200, stone: 100, iron: 150 } }
  };

  // ============================
  // 遊戲狀態
  // ============================
  let state = {
    username: "Player1",
    planet: "earth",
    year: 0,
    coins: 2000,
    aeno: 0,
    wood: 800,
    stone: 800,
    iron: 800,
    food: 800,
    pop: 4,
    workers: 4,
    territory: 240,
    buildings: [],
    robots: [],
    maxRobots: 5,
    robotMissions: [],
    autoBuild: false,
    adPlaying: false,
    adTime: 0,
    chapter: 1,
    dnaGen: 0,
    lastDnaYear: 0,
    beastYear: 0,
    wall: 0
  };

  // ============================
  // DOM元素
  // ============================
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const bootScreen = document.getElementById("bootScreen");
  const sysLog = document.getElementById("sysLog");
  const mainPanel = document.getElementById("mainPanel");
  const planetNameEl = document.getElementById("planetName");
  const yearEl = document.getElementById("gameYear");
  const popEl = document.getElementById("popCount");
  const coinsEl = document.getElementById("coins");
  const aenoEl = document.getElementById("aeno");
  const woodEl = document.getElementById("wood");
  const stoneEl = document.getElementById("stone");
  const ironEl = document.getElementById("iron");
  const foodEl = document.getElementById("food");

  // ============================
  // 工具函數
  // ============================
  const rand = (a,b) => a + Math.random()*(b-a);
  const randi = (a,b) => Math.floor(rand(a,b+1));
  const fmt = n => {
    if(n>=1e9) return (n/1e9).toFixed(1)+"B";
    if(n>=1e6) return (n/1e6).toFixed(1)+"M";
    if(n>=1e3) return (n/1e3).toFixed(1)+"K";
    return Math.floor(n).toString();
  };
  const now = () => Math.floor(Date.now()/1000);

  function log(msg){
    sysLog.innerHTML = `<div><b>[${new Date().toLocaleTimeString()}]</b> ${msg}</div>` + sysLog.innerHTML;
    console.log(msg);
  }

  // ============================
  // 遊戲循環
  // ============================
  let W, H, lastTime = 0;
  let camX = 0, camY = 0, zoom = 1;

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function loop(time){
    const dt = Math.min((time - lastTime)/1000, 0.1);
    lastTime = time;

    if(state.username){
      update(dt);
      render();
    }

    requestAnimationFrame(loop);
  }

  // ============================
  // 遊戲更新
  // ============================
  function update(dt){
    // 時間
    state.year += dt * YEARS_PER_SECOND;

    // 資源生產
    const p = PLANETS[state.planet];
    let w=0, s=0, i=0, f=0, c=0;

    for(const b of state.buildings){
      const lv = b.level || 1;
      if(b.type === "lumber") w += 0.35 * lv * p.res.wood;
      if(b.type === "quarry") s += 0.30 * lv * p.res.stone;
      if(b.type === "mine") i += 0.22 * lv * p.res.iron;
      if(b.type === "farm") f += 0.38 * lv * p.res.food;
      if(b.type === "market") c += 0.25 * lv;
      if(b.type === "house") c += 0.10 * lv;
    }

    const boost = 1 + state.workers * 0.015;
    const tb = dt / 365; // 時間平衡

    state.wood += w * boost * tb;
    state.stone += s * boost * tb;
    state.iron += i * boost * tb;
    state.food += f * boost * tb;
    state.coins += c * boost * tb;

    // 食物消耗
    state.food -= state.pop * 0.04 * tb;
    if(state.food < 0){
      state.food = 0;
      if(Math.random() < 0.02){
        state.pop = Math.max(1, state.pop - 1);
        state.workers = Math.max(1, state.workers - 1);
        log("⚠️ 糧食不足！");
      }
    }

    // 領土擴張
    if(state.coins > 300 && Math.random() < 0.015){
      state.coins -= 20;
      state.territory = Math.min(state.territory + 3, 900);
    }

    // DNA進化
    if(state.year - state.lastDnaYear >= DNA_EVOLUTION_YEARS){
      state.dnaGen++;
      state.lastDnaYear = state.year;
      log("🧬 DNA變種觸發！");
      if(state.chapter === 1 && state.year > 50){
        state.chapter = 2;
        log("📖 第二章：億年演化");
      }
    }

    // AENO廣告
    if(state.adPlaying){
      state.adTime += dt;
      if(Math.random() < 0.0001 * dt){
        const amt = rand(1, 10);
        state.aeno += amt;
        log(`✨ AENO +${amt.toFixed(2)}`);
      }
    }

    // 機器人任務
    updateRobots(dt);

    // UI更新
    updateUI();
  }

  function updateRobots(dt){
    const nowSec = now();
    for(let i = state.robotMissions.length - 1; i >= 0; i--){
      const m = state.robotMissions[i];
      if(m.status === "going"){
        if(nowSec - m.start > m.duration){
          m.status = "back";
          const dest = PLANETS[m.dest];
          const mult = dest.res;
          state.wood += randi(10, 50) * mult.wood;
          state.stone += randi(10, 50) * mult.stone;
          state.iron += randi(5, 30) * mult.iron;
          state.food += randi(10, 50) * mult.food;
          state.coins += randi(20, 100);
          log(`🤖 機器人回來：${dest.emoji}${dest.name}`);
        }
      } else if(m.status === "back"){
        if(nowSec - m.start > m.duration + 30){
          state.robotMissions.splice(i, 1);
          state.robots.push({ level: 1 });
        }
      }
    }
  }

  function updateUI(){
    if(planetNameEl) planetNameEl.textContent = (PLANETS[state.planet]?.emoji || "🌍") + " " + (PLANETS[state.planet]?.name || "");
    if(yearEl) yearEl.textContent = Math.floor(state.year);
    if(popEl) popEl.textContent = state.pop;
    if(coinsEl) coinsEl.textContent = fmt(state.coins);
    if(aenoEl) aenoEl.textContent = fmt(state.aeno);
    if(woodEl) woodEl.textContent = fmt(state.wood);
    if(stoneEl) stoneEl.textContent = fmt(state.stone);
    if(ironEl) ironEl.textContent = fmt(state.iron);
    if(foodEl) foodEl.textContent = fmt(state.food);

    // 更新麵包屑資源
    const uiWood = document.getElementById("uiWood");
    const uiStone = document.getElementById("uiStone");
    const uiIron = document.getElementById("uiIron");
    const uiFood = document.getElementById("uiFood");
    const uiCoins = document.getElementById("uiCoins");
    const uiAeno = document.getElementById("uiAeno");
    if(uiWood) uiWood.textContent = fmt(state.wood);
    if(uiStone) uiStone.textContent = fmt(state.stone);
    if(uiIron) uiIron.textContent = fmt(state.iron);
    if(uiFood) uiFood.textContent = fmt(state.food);
    if(uiCoins) uiCoins.textContent = fmt(state.coins);
    if(uiAeno) uiAeno.textContent = fmt(state.aeno);
  }

  // ============================
  // 渲染
  // ============================
  function render(){
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, W, H);

    const ts = 50 * zoom;
    const cx = W/2, cy = H/2;

    // 領土
    ctx.beginPath();
    ctx.arc(cx, cy, state.territory * zoom, 0, Math.PI*2);
    ctx.fillStyle = "rgba(0,255,100,0.1)";
    ctx.fill();
    ctx.strokeStyle = "#00ff66";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 建築
    for(const b of state.buildings){
      const info = BUILDINGS[b.type];
      const x = (b.x - camX) * zoom + cx;
      const y = (b.y - camY) * zoom + cy;
      if(x < -50 || x > W+50 || y < -50 || y > H+50) continue;

      ctx.font = (30*zoom) + "px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(info.emoji, x, y);

      if(b.level > 1){
        ctx.font = (12*zoom) + "px Arial";
        ctx.fillStyle = "#ffff00";
        ctx.fillText("Lv"+b.level, x, y + 20*zoom);
      }
    }

    // 機器人
    if(state.robots.length > 0){
      ctx.font = (20*zoom) + "px Arial";
      ctx.fillText("🤖" + state.robots.length, cx - 50, cy - 30);
    }
  }

  // ============================
  // 遊戲功能
  // ============================
  window.gameBuild = function(type){
    const info = BUILDINGS[type];
    if(!info){ log("⚠️ 未知建築"); return; }

    // 檢查資源
    for(const [res, amt] of Object.entries(info.cost)){
      if(state[res] < amt){ log(`⚠️ ${res}不足`); return; }
    }

    // 扣資源
    for(const [res, amt] of Object.entries(info.cost)){
      state[res] -= amt;
    }

    // 建造
    state.buildings.push({
      type,
      level: 1,
      x: rand(-100, 100),
      y: rand(-100, 100)
    });

    if(type === "house") state.pop += 2;
    if(type === "factory") state.maxRobots += 5;

    log(`🏗️ 建造：${info.emoji}${info.name}`);
    updateUI();
  };

  window.gameUpgrade = function(idx){
    const b = state.buildings[idx];
    if(!b){ log("⚠️ 無此建築"); return; }

    const info = BUILDINGS[b.type];
    const cost = {};
    for(const [res, amt] of Object.entries(info.cost)){
      cost[res] = Math.floor(amt * Math.pow(1.5, b.level));
    }

    for(const [res, amt] of Object.entries(cost)){
      if(state[res] < amt){ log("⚠️ 升級資源不足"); return; }
    }

    for(const [res, amt] of Object.entries(cost)){
      state[res] -= amt;
    }

    b.level++;
    log(`⬆️ 升級：${info.emoji}${info.name} Lv${b.level}`);
    updateUI();
  };

  window.makeRobot = function(){
    if(state.robots.length >= state.maxRobots){
      log("⚠️ 機器人已滿");
      return;
    }
    state.robots.push({ level: 1 });
    log("🤖 機器人製造成功");
    updateUI();
  };

  window.sendRobot = function(){
    if(state.robots.length === 0){
      log("⚠️ 沒有機器人");
      return;
    }
    const planets = Object.keys(PLANETS).filter(p => p !== "blackhole");
    const dest = planets[randi(0, planets.length-1)];
    state.robotMissions.push({
      dest,
      start: now(),
      duration: randi(60, 180),
      status: "going"
    });
    log(`🚀 機器人出發去：${PLANETS[dest].emoji}${PLANETS[dest].name}`);
  };

  window.playAd = function(){
    state.adPlaying = true;
    state.adTime = 0;
    log("🎵 廣告播放中...");
  };

  window.testDna = function(){
    state.lastDnaYear = state.year - 100;
    log("🧬 DNA測試觸發");
  };

  window.testLanguage = function(){
    const langs = ["粵語", "日語", "法語", "西班牙語", "德語"];
    const lang = langs[randi(0, langs.length-1)];
    const score = randi(20, 100);
    if(score >= 40){
      const amt = randi(50, 200);
      const res = ["wood", "stone", "iron", "food"][randi(0, 3)];
      state[res] += amt;
      log(`📚 發音${score}% 成功！+${res} ${amt}`);
    } else {
      log(`📚 發音${score}% 失敗`);
    }
    updateUI();
  };

  window.saveGame = function(){
    localStorage.setItem("aeno_save_v4", JSON.stringify(state));
    log("💾 已保存");
  };

  // ============================
  // 啟動遊戲
  // ============================
  function start(){
    resize();

    // 初始建築
    state.buildings = [
      { type: "house", level: 1, x: 0, y: 0 },
      { type: "farm", level: 1, x: -50, y: 0 },
      { type: "lumber", level: 1, x: 50, y: 0 },
      { type: "quarry", level: 1, x: 0, y: 50 },
      { type: "mine", level: 1, x: 0, y: -50 }
    ];

    // 隱藏boot
    if(bootScreen) bootScreen.classList.add("hidden");

    log("✅ AENO 遊戲啟動 (" + VERSION + ")");
    log("🌍 星球：地球");
    log("═══════════════════════");
    log("🌟 AENO 量子文明崛起");
    log("⚡ 1現實日=10遊戲年");
    log("📚 學習語言/廣告=AENO");
    log("═══════════════════════");
    log("📖 第一章：星域初醒");
    log("═══════════════════════");

    updateUI();
    requestAnimationFrame(loop);
  }

  // 綁定按鈕
  setTimeout(() => {
    // 麵包屑按鈕
    const btnBuild = document.getElementById("btnBuildMode");
    if(btnBuild) btnBuild.onclick = () => {
      const type = prompt("建築類型：house/farm/lumber/quarry/mine/market/wall/warehouse/lab/temple/factory/tower");
      if(type) window.gameBuild(type);
    };

    const btnUpgrade = document.getElementById("btnUpgradeMode");
    if(btnUpgrade) btnUpgrade.onclick = () => {
      const idx = parseInt(prompt("建築編號(0-" + (state.buildings.length-1) + ")"));
      if(!isNaN(idx)) window.gameUpgrade(idx);
    };

    const btnRobot = document.getElementById("btnMakeRobot");
    if(btnRobot) btnRobot.onclick = window.makeRobot;

    const btnSend = document.getElementById("btnSendRobot");
    if(btnSend) btnSend.onclick = window.sendRobot;

    const btnAd = document.getElementById("btnPlaySong");
    if(btnAd) btnAd.onclick = window.playAd;

    const btnTest = document.getElementById("btnBeastTest");
    if(btnTest) btnTest.onclick = window.testDna;

    const btnLang = document.getElementById("btnPronounceTest");
    if(btnLang) btnLang.onclick = window.testLanguage;

    const btnSave = document.getElementById("btnSaveNow");
    if(btnSave) btnSave.onclick = window.saveGame;

    console.log("按鈕已綁定");
  }, 500);

  start();
})();
