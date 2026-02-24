// game.js
// AENO 量子文明崛起 - 完整版
// Version: 2026-02-24 V3.0
// 根據最終大綱編寫

(() => {
  "use strict";

  // ============================
  // DOM Elements
  // ============================
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const bootScreen = document.getElementById("bootScreen");
  const loginScreen = document.getElementById("loginScreen");
  const planetSelect = document.getElementById("planetSelect");

  const btnRegister = document.getElementById("btnRegister");
  const btnLogin = document.getElementById("btnLogin");
  const btnConfirmPlanet = document.getElementById("btnConfirmPlanet");
  const planetPicker = document.getElementById("planetPicker");
  const loginUser = document.getElementById("loginName");
  const loginPass = document.getElementById("loginPass");
  const loginMsg = document.getElementById("loginMsg");

  const planetNameEl = document.getElementById("planetName");
  const gameYearEl = document.getElementById("gameYear");
  const popCountEl = document.getElementById("popCount");
  const coinsEl = document.getElementById("coins");
  const aenoEl = document.getElementById("aeno");

  const woodEl = document.getElementById("wood");
  const stoneEl = document.getElementById("stone");
  const ironEl = document.getElementById("iron");
  const foodEl = document.getElementById("food");

  const houseCountEl = document.getElementById("houseCount");
  const robotCountEl = document.getElementById("robotCount");

  const assistant = document.getElementById("assistant");
  const assistantEmoji = document.getElementById("assistantEmoji");
  const assistantName = document.getElementById("assistantName");
  const assistantTalkBtn = document.getElementById("assistantTalkBtn");

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

  const tabBtns = Array.from(document.querySelectorAll(".tabBtn"));
  const tabPages = Array.from(document.querySelectorAll(".tabPage"));

  const uiWood = document.getElementById("uiWood");
  const uiStone = document.getElementById("uiStone");
  const uiIron = document.getElementById("uiIron");
  const uiFood = document.getElementById("uiFood");
  const uiCoins = document.getElementById("uiCoins");
  const uiAeno = document.getElementById("uiAeno");

  const sysLog = document.getElementById("sysLog");

  const btnBuildMode = document.getElementById("btnBuildMode");
  const btnCancelBuildMode = document.getElementById("btnCancelBuildMode");
  const btnUpgradeMode = document.getElementById("btnUpgradeMode");
  const btnCancelUpgradeMode = document.getElementById("btnCancelUpgradeMode");

  const btnRobotSend = document.getElementById("btnRobotSend");
  const btnRobotRecall = document.getElementById("btnRobotRecall");

  const marketItem = document.getElementById("marketItem");
  const marketAmount = document.getElementById("marketAmount");
  const btnBuy = document.getElementById("btnBuy");
  const btnSell = document.getElementById("btnSell");

  const btnPlayAd = document.getElementById("btnPlayAd");
  const btnLoopAd = document.getElementById("btnLoopAd");

  const btnAutoToggle = document.getElementById("btnAutoToggle");
  const btnAutoStopNow = document.getElementById("btnAutoStopNow");

  const btnSaveGame = document.getElementById("btnSaveGame");
  const btnResetGame = document.getElementById("btnResetGame");

  // ============================
  // Constants
  // ============================
  const VERSION = "2026-02-24 V3.1 (無登入版)";

  // 時間系統：1現實日 = 10遊戲年
  const YEARS_PER_REAL_SECOND = 10 / 86400;
  const OFFLINE_CAP_SECONDS = 24 * 3600;

  // DNA變種：每100遊戲年（10現實日）觸發
  const DNA_EVOLUTION_YEARS = 100;

  // AENO總量上限
  const AENO_MAX_SUPPLY = 20000000;

  // ============================
  // 20星球數據
  // ============================
  const PLANETS = {
    earth: { name: "地球", lang: "粵語", culture: "華夏", emoji: "🌍", resources: { wood: 1.2, stone: 1.0, iron: 0.8, food: 1.1 } },
    mars: { name: "火星", lang: "日語", culture: "和風", emoji: "🔴", resources: { wood: 0.8, stone: 1.3, iron: 1.2, food: 0.7 } },
    ocean: { name: "海洋星", lang: "法語", culture: "法式", emoji: "🌊", resources: { wood: 1.0, stone: 0.9, iron: 0.7, food: 1.4 } },
    jungle: { name: "叢林星", lang: "西班牙語", culture: "拉美", emoji: "🌴", resources: { wood: 1.5, stone: 0.7, iron: 0.6, food: 1.3 } },
    planet05: { name: "德意志星", lang: "德語", culture: "德式", emoji: "🏰", resources: { wood: 0.9, stone: 1.4, iron: 1.5, food: 0.8 } },
    planet06: { name: "羅馬星", lang: "意大利語", culture: "意式", emoji: "🏛️", resources: { wood: 1.0, stone: 1.2, iron: 0.9, food: 1.0 } },
    planet07: { name: "北極星", lang: "俄語", culture: "俄式", emoji: "❄️", resources: { wood: 0.6, stone: 1.5, iron: 1.3, food: 0.5 } },
    planet08: { name: "三星", lang: "韓語", culture: "韓式", emoji: "🏯", resources: { wood: 1.1, stone: 1.0, iron: 1.1, food: 1.0 } },
    planet09: { name: "泰星", lang: "泰語", culture: "泰式", emoji: "🕌", resources: { wood: 1.2, stone: 0.8, iron: 0.7, food: 1.4 } },
    planet10: { name: "越星", lang: "越南語", culture: "越式", emoji: "🎋", resources: { wood: 1.3, stone: 0.9, iron: 0.8, food: 1.2 } },
    planet11: { name: "梵星", lang: "印地語", culture: "印度", emoji: "🪷", resources: { wood: 1.1, stone: 1.1, iron: 1.0, food: 1.1 } },
    planet12: { name: "沙星", lang: "阿拉伯語", culture: "中東", emoji: "🏜️", resources: { wood: 0.5, stone: 1.4, iron: 1.2, food: 0.4 } },
    planet13: { name: "森星", lang: "葡萄牙語", culture: "巴西", emoji: "🦁", resources: { wood: 1.4, stone: 0.8, iron: 0.9, food: 1.1 } },
    planet14: { name: "墨星", lang: "西班牙語", culture: "墨西哥", emoji: "🌵", resources: { wood: 0.9, stone: 1.5, iron: 1.0, food: 0.9 } },
    planet15: { name: "希臘星", lang: "希臘語", culture: "希臘", emoji: "🏺", resources: { wood: 0.8, stone: 1.3, iron: 1.1, food: 0.9 } },
    planet16: { name: "土星", lang: "土耳其語", culture: "土耳其", emoji: "🕌", resources: { wood: 0.9, stone: 1.2, iron: 1.1, food: 0.9 } },
    planet17: { name: "北歐星", lang: "瑞典語", culture: "北歐", emoji: "🌌", resources: { wood: 0.7, stone: 1.4, iron: 1.2, food: 0.6 } },
    planet18: { name: "澳星", lang: "英語", culture: "澳式", emoji: "🦘", resources: { wood: 1.0, stone: 1.1, iron: 1.0, food: 1.1 } },
    planet19: { name: "非星", lang: "斯瓦希里語", culture: "非洲", emoji: "🦁", resources: { wood: 1.2, stone: 1.0, iron: 0.9, food: 1.2 } },
    planet20: { name: "中原星", lang: "粵語", culture: "粵語", emoji: "🐉", resources: { wood: 1.1, stone: 1.0, iron: 1.0, food: 1.1 } },
    blackhole: { name: "黑洞", lang: "元語", culture: "創世", emoji: "🕳️", resources: { wood: 2.0, stone: 2.0, iron: 2.0, food: 2.0 } }
  };

  // 語言學習資源名稱
  const LANGUAGE_RESOURCES = {
    "粵語": { words: ["木材", "石頭", "鐵礦", "糧食", "金幣"], phonetic: ["muk4 coi4", "sek6 tau4", "tit3 kwong", "loeng6 sik6", "gam1 bi2"] },
    "日語": { words: ["木材", "石", "鉄", "食料", "金"], phonetic: ["もくざい", "いし", "てつ", "しょくりょう", "かね"] },
    "法語": { words: [" bois", "pierre", "fer", "nourriture", "or"], phonetic: ["bwa", "pjɛʁ", "fɛʁ", "nuʁityʁ", "ɔʁ"] },
    "西班牙語": { words: ["madera", "piedra", "hierro", "comida", "oro"], phonetic: ["maˈðeɾa", "ˈpjeðɾa", "ˈjeɾo", "koˈmiða", "ˈoɾo"] },
    "德語": { words: ["Holz", "Stein", "Eisen", "Nahrung", "Gold"], phonetic: ["hɔlts", "ʃtaɪn", "ˈaɪzən", "ˈnaːʁʊŋ", "ɡɔlt"] },
    "意大利語": { words: ["legno", "pietra", "ferro", "cibo", "oro"], phonetic: ["ˈleɲɲo", "ˈpjɛtra", "ˈfɛrro", "ˈtʃibo", "ˈoːro"] },
    "俄語": { words: ["дерево", "камень", "железо", "еда", "золото"], phonetic: ["dʲɪrʲɪˈvo", "ˈkamʲɪnʲ", "ʐɨˈlʲizo", "jɪˈda", "ˈzolətə"] },
    "韓語": { words: ["나무", "돌", "철", "음식", "금"], phonetic: ["namu", "tol", "tʃʰʌl", "ɯmʃik", "kɯm"] },
    "泰語": { words: ["ไม้", "หิน", "เหล็ก", "อาหาร", "ทอง"], phonetic: ["mai", "hin", "lek", "ahaan", "thong"] },
    "越南語": { words: ["gỗ", "đá", "sắt", "thức ăn", "vàng"], phonetic: ["ɗo˧", "da˦ˀ", "sat˦ˀ", "tʰɯk˦ˀ an˧", "vaŋ˧"] },
    "印地語": { words: ["लकड़ी", "पत्थर", "लोहा", "खाना", "सोना"], phonetic: ["ləkəɽi", "pət̪t̪ər", "loha", "khana", "sona"] },
    "阿拉伯語": { words: ["خشب", "حجر", "حديد", "طعام", "ذهب"], phonetic: ["xʃab", "ħadʒar", "ħadiːd", "tˤaʕam", "ðahab"] },
    "葡萄牙語": { words: ["madeira", "pedra", "ferro", "comida", "ouro"], phonetic: ["mɐˈðejɾɐ", "ˈpɛðɾɐ", "ˈfɛʁu", "kɐˈmiðɐ", "ˈoɾu"] },
    "希臘語": { words: ["ξύλο", "πέτρα", "σίδηρο", "φαγητό", "χρυσός"], phonetic: ["ksilo", "petra", "siðiro", "fajito", "xrisos"] },
    "土耳其語": { words: ["tahta", "taş", "demir", "yemek", "altın"], phonetic: ["tahta", "taʃ", "demiɾ", "jemeɡ", "aɫtɯn"] },
    "瑞典語": { words: ["trä", "sten", "järn", "mat", "guld"], phonetic: ["trɛ", "stɛn", "jɛn", "mat", "ɡɵld"] },
    "英語": { words: ["wood", "stone", "iron", "food", "gold"], phonetic: ["wʊd", "stoʊn", "ˈaɪərn", "fuːd", "ɡoʊld"] },
    "斯瓦希里語": { words: ["mbao", "mawe", "chuma", "chakula", "dhahabu"], phonetic: ["mbaɔ", "mawe", "tʃuma", "tʃakula", "dʒahabu"] },
    "元語": { words: ["創世", "虛空", "永恆", "本源", "黑洞"], phonetic: ["chuang-shi", "xu-kong", "yong-heng", "ben-yuan", "hei-dong"] }
  };

  // ============================
  // Utilities
  // ============================
  const rand = (a,b) => a + Math.random()*(b-a);
  const randi = (a,b) => Math.floor(rand(a,b+1));
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const nowSec = () => Math.floor(Date.now()/1000);

  function logSys(msg){
    const t = new Date().toLocaleTimeString();
    sysLog.innerHTML = `<div><b>[${t}]</b> ${msg}</div>` + sysLog.innerHTML;
  }

  function fmt(n){
    if(n>=1e9) return (n/1e9).toFixed(2)+"B";
    if(n>=1e6) return (n/1e6).toFixed(2)+"M";
    if(n>=1e3) return (n/1e3).toFixed(2)+"K";
    return Math.floor(n).toString();
  }

  // ============================
  // Data Storage
  // ============================
  const LS_USERS = "aeno_users_v3";
  const LS_SESSION = "aeno_session_v3";
  const LS_GLOBAL = "aeno_global_v3";

  function loadUsers(){
    try{ return JSON.parse(localStorage.getItem(LS_USERS)||"{}"); }catch(e){ return {}; }
  }
  function saveUsers(obj){
    localStorage.setItem(LS_USERS, JSON.stringify(obj));
  }

  function getSession(){
    try{ return JSON.parse(localStorage.getItem(LS_SESSION)||"null"); }catch(e){ return null; }
  }
  function setSession(sess){
    localStorage.setItem(LS_SESSION, JSON.stringify(sess));
  }

  // 全局數據（黑洞進程、全服統計）
  function loadGlobal(){
    try{ return JSON.parse(localStorage.getItem(LS_GLOBAL)||"{}"); }catch(e){ return {}; }
  }
  function saveGlobal(obj){
    localStorage.setItem(LS_GLOBAL, JSON.stringify(obj));
  }

  // ============================
  // Game World Generation
  // ============================
  const WORLD_SIZE = 2200;
  const TILE = 50;

  function genWorldSeed(username, planet){
    return `${username}::${planet}::AENO::${VERSION}`;
  }

  function hashStr(s){
    let h = 2166136261;
    for(let i=0;i<s.length;i++){
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h>>>0);
  }

  // 地形生成
  let terrain = [];
  function genTerrain(username, planet){
    terrain = [];
    const seed = genWorldSeed(username, planet);
    const h = hashStr(seed);

    for(let y=0; y<WORLD_SIZE/TILE; y++){
      terrain[y] = [];
      for(let x=0; x<WORLD_SIZE/TILE; x++){
        const nx = x/20 + (h/1e10);
        const ny = y/20 + (h/1e10);
        const v = Math.sin(nx*12.9898 + ny*78.233) * 43758.5453;
        const r = v - Math.floor(v);

        let type = "plain";
        if(r < 0.15) type = "forest";
        else if(r < 0.2) type = "mountain";
        else if(r < 0.22) type = "water";
        else if(r < 0.24) type = "mine";

        terrain[y][x] = { type, x: x*TILE, y: y*TILE };
      }
    }
    return terrain;
  }

  // ============================
  // Game State
  // ============================
  let state = {};
  let currentUser = "";
  let terrain = [];

  function makeNewState(username, planet){
    const isBlackHole = planet === "blackhole";
    const planetData = PLANETS[planet] || PLANETS.earth;

    return {
      version: VERSION,
      username,
      planet,
      createdAt: nowSec(),
      lastSaveAt: nowSec(),
      lastTickAt: nowSec(),
      gameYear: 0,
      chapter: 1,

      coins: 2000,
      aeno: 0,

      wood: 800,
      stone: 800,
      iron: 800,
      food: 800,

      population: 4,
      workers: 4,

      territoryRadius: isBlackHole ? 900 : 240,

      buildings: [
        { type: "house", level: 1, x: 0, y: 0 },
        { type: "farm", level: 1, x: -TILE, y: 0 },
        { type: "lumber", level: 1, x: TILE, y: 0 },
        { type: "quarry", level: 1, x: 0, y: TILE },
        { type: "mine", level: 1, x: 0, y: -TILE }
      ],

      robots: [],
      maxRobots: 5,

      robotMissions: [],

      translationPacks: [planetData.lang],
      languageProgress: {},

      dnaGeneration: 0,
      lastDnaYear: 0,

      buildingSkins: {},

      techTree: {
        agriculture: 1,
        industry: 1,
        defense: 1,
        aiAssistant: 1,
        robot: 1,
        ftl: 0,
        blackhole: 0
      },

      blackholeUnlocked: false,
      blackholeProgress: 0,

      adSongPlaying: false,
      adSecondsListening: 0,
      adLoop: false,

      autoBuild: false,
      autoPriorities: { lumber: true, farm: true, quarry: true, mine: true },

      beastTideLevel: 0,
      lastBeastTide: 0,
      wallIntegrity: 0
    };
  }

  // ============================
  // 建築數據
  // ============================
  const BUILD_INFO = {
    house: { name: "房屋", emoji: "🏠", cost: { wood: 100, stone: 50 }, output: { pop: 2 } },
    farm: { name: "農田", emoji: "🌾", cost: { wood: 80, stone: 30 }, output: { food: 0.5 } },
    lumber: { name: "伐木場", emoji: "🪓", cost: { wood: 50, stone: 80 }, output: { wood: 0.4 } },
    quarry: { name: "採石場", emoji: "⛏️", cost: { wood: 80, stone: 50 }, output: { stone: 0.35 } },
    mine: { name: "礦場", emoji: "⛏️", cost: { wood: 100, stone: 100 }, output: { iron: 0.25 } },
    market: { name: "市集", emoji: "🏪", cost: { wood: 200, stone: 150 }, output: { coin: 0.3 } },
    wall: { name: "城牆", emoji: "🧱", cost: { wood: 300, stone: 300 }, output: { defense: 1 } },
    warehouse: { name: "倉庫", emoji: "🏚️", cost: { wood: 150, stone: 150 }, output: { capacity: 500 } },
    lab: { name: "研究所", emoji: "🔬", cost: { wood: 500, stone: 300, iron: 100 }, output: { tech: 0.1 } },
    temple: { name: "寺廟", emoji: "⛩️", cost: { wood: 400, stone: 400 }, output: { aeno: 0.01 } },
    robotFactory: { name: "機器人工廠", emoji: "🤖", cost: { wood: 300, stone: 200, iron: 200 }, output: { robot: 0.01 } },
    broadcast: { name: "廣播站", emoji: "📡", cost: { wood: 200, stone: 100, iron: 150 }, output: { adBonus: 0.2 } }
  };

  // ============================
  // Camera / Zoom
  // ============================
  let W = 1, H = 1;
  let camX = 0, camY = 0;
  let zoom = 1;

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function worldToScreen(wx, wy){
    return {
      x: (wx - camX) * zoom + W/2,
      y: (wy - camY) * zoom + H/2
    };
  }

  function screenToWorld(sx, sy){
    return {
      x: (sx - W/2) / zoom + camX,
      y: (sy - H/2) / zoom + camY
    };
  }

  // ============================
  // 遊戲循環
  // ============================
  let lastTime = 0;
  function loop(time){
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    if(state.username){
      simulate(dt);
      render();
    }

    requestAnimationFrame(loop);
  }

  // ============================
  // Simulation
  // ============================
  function simulate(dtSec){
    if(dtSec <= 0) return;

    state.gameYear += dtSec * YEARS_PER_REAL_SECOND;

    if(state.adSongPlaying){
      state.adSecondsListening += dtSec;
      tryDropAeno("ad", dtSec);
    }

    produceResources(dtSec);

    if(state.gameYear - state.lastDnaYear >= DNA_EVOLUTION_YEARS){
      triggerDnaEvolution();
    }

    checkBeastTide();

    updateRobotMissions(dtSec);

    updateBlackholeProgress();

    if(nowSec() - state.lastSaveAt > 60){
      saveGame();
    }

    updateHUD();
  }

  // ============================
  // 資源生產
  // ============================
  function produceResources(dt){
    const planetData = PLANETS[state.planet] || PLANETS.earth;
    const resourceMult = planetData.resources;

    let woodRate = 0, stoneRate = 0, ironRate = 0, foodRate = 0, coinRate = 0;

    for(const b of state.buildings){
      const lv = b.level || 1;
      const info = BUILD_INFO[b.type];
      if(!info) continue;

      if(b.type === "lumber") woodRate += (info.output?.wood || 0) * lv * resourceMult.wood;
      if(b.type === "quarry") stoneRate += (info.output?.stone || 0) * lv * resourceMult.stone;
      if(b.type === "mine") ironRate += (info.output?.iron || 0) * lv * resourceMult.iron;
      if(b.type === "farm") foodRate += (info.output?.food || 0) * lv * resourceMult.food;
      if(b.type === "market") coinRate += (info.output?.coin || 0) * lv;
      if(b.type === "house") coinRate += 0.1 * lv;
    }

    const timeBalance = dt / 365;
    const workerBoost = 1 + (state.workers * 0.015);

    state.wood += woodRate * workerBoost * timeBalance;
    state.stone += stoneRate * workerBoost * timeBalance;
    state.iron += ironRate * workerBoost * timeBalance;
    state.food += foodRate * workerBoost * timeBalance;
    state.coins += coinRate * workerBoost * timeBalance;

    const foodNeed = state.population * 0.04 * timeBalance;
    state.food -= foodNeed;

    if(state.food < 0){
      state.food = 0;
      if(Math.random() < 0.02){
        state.population = Math.max(1, state.population - 1);
        state.workers = Math.max(1, state.workers - 1);
        logSys("⚠️ 糧食不足，人口減少！");
      }
    }

    if(state.coins > 300 && Math.random() < 0.015){
      state.coins -= 20;
      state.territoryRadius = clamp(state.territoryRadius + 3, 200, 900);
    }
  }

  // ============================
  // DNA進化系統
  // ============================
  function triggerDnaEvolution(){
    state.dnaGeneration++;
    state.lastDnaYear = state.gameYear;

    logSys("═══════════════════════════════════");
    logSys("🧬 DNA變種觸發！遊戲年 " + Math.floor(state.gameYear));
    logSys("═══════════════════════════════════");

    const buildingTypes = ["farm", "lumber", "quarry", "mine", "house", "market"];
    for(const type of buildingTypes){
      if(Math.random() < 0.3){
        const newSkin = "v" + randi(1, 5);
        state.buildingSkins[type] = newSkin;
      }
    }

    logSys("🌿 植物特性已改變");
    logSys("🐄 動物習性已改變");
    logSys("🏛️ 建築風格已進化");

    if(state.chapter === 1 && state.gameYear > 50){
      state.chapter = 2;
      logSys("═══════════════════════════════════");
      logSys("📖 第二章：億年演化·AI大腦覺醒");
      logSys("═══════════════════════════════════");
      logSys("AI大腦正在推動物種變種、建築進化...");
    }
  }

  // ============================
  // AENO掉落系統
  // ============================
  function tryDropAeno(source, dt){
    let chance = 0;
    let amount = 0;

    if(source === "ad"){
      chance = 0.0001 * dt;
      amount = rand(1, 10);
    } else if(source === "beast"){
      chance = 0.001 * dt;
      amount = rand(10, 50);
    } else if(source === "language"){
      chance = 0.001;
      amount = rand(5, 20);
    }

    if(Math.random() < chance && state.aeno < AENO_MAX_SUPPLY){
      state.aeno += amount;
      state.aeno = Math.min(state.aeno, AENO_MAX_SUPPLY);
      logSys("✨ AENO +" + amount.toFixed(2) + " 💎");

      if(state.aeno >= 6000000 && !state.blackholeUnlocked){
        state.blackholeProgress = 100;
        state.blackholeUnlocked = true;
        logSys("═══════════════════════════════════");
        logSys("🕳️ 黑洞之門已開啟！");
        logSys("你可以移民到黑洞了！");
        logSys("═══════════════════════════════════");
      }
    }
  }

  // ============================
  // 黑洞解鎖進度
  // ============================
  function updateBlackholeProgress(){
    if(state.blackholeUnlocked) return;

    if(state.aeno >= 6000000) state.blackholeProgress = 25;
    if(state.aeno >= 8000000) state.blackholeProgress = 50;
    if(state.aeno >= 10000000) state.blackholeProgress = 75;
    if(state.aeno >= 11000000) state.blackholeProgress = 100;
  }

  // ============================
  // 獸潮系統
  // ============================
  function checkBeastTide(){
    const beastCycle = 200;
    const yearsSinceLast = state.gameYear - state.lastBeastTide;

    if(yearsSinceLast >= beastCycle && state.wallIntegrity > 50){
      state.lastBeastTide = state.gameYear;
      state.beastTideLevel = randi(1, 5);

      logSys("═══════════════════════════════════");
      logSys("🐺 獸潮來襲！強度：" + state.beastTideLevel + "級");
      logSys("═══════════════════════════════════");

      const lootCoins = state.beastTideLevel * 100;
      const lootFrag = state.beastTideLevel * 5;
      state.coins += lootCoins;

      logSys("✅ 成功防守！獲得 +金幣 " + lootCoins + " +碎片 " + lootFrag);

      tryDropAeno("beast", 1);
    }
  }

  // ============================
  // 機器人探索系統
  // ============================
  function sendRobot(planet){
robots.length >= state.maxRobots){
    if(state.      logSys("⚠️ 機器人數量已達上限");
      return;
    }

    const planetData = PLANETS[planet];
    if(!planetData){
      logSys("⚠️ 未知星球");
      return;
    }

    if(planet === "blackhole"){
      logSys("⚠️ 黑洞暫時無法探索");
      return;
    }

    const mission = {
      destPlanet: planet,
      startTime: nowSec(),
      status: "traveling",
      duration: randi(60, 180)
    };

    state.robotMissions.push(mission);
    logSys("🤖 機器人已出發前往：" + planetData.emoji + planetData.name);
    logSys("⏱️ 預計 " + Math.floor(mission.duration/60) + " 分鐘後返回");
  }

  function updateRobotMissions(dtSec){
    const now = nowSec();

    for(let i = state.robotMissions.length - 1; i >= 0; i--){
      const m = state.robotMissions[i];

      if(m.status === "traveling"){
        const elapsed = now - m.startTime;
        if(elapsed >= m.duration){
          m.status = "returning";

          const planetData = PLANETS[m.destPlanet];
          const lootMult = planetData.resources;

          const lootWood = Math.floor(rand(10, 50) * lootMult.wood);
          const lootStone = Math.floor(rand(10, 50) * lootMult.stone);
          const lootIron = Math.floor(rand(5, 30) * lootMult.iron);
          const lootFood = Math.floor(rand(10, 50) * lootMult.food);
          const lootCoins = Math.floor(rand(20, 100));
          const lootFrag = randi(1, 5);

          state.wood += lootWood;
          state.stone += lootStone;
          state.iron += lootIron;
          state.food += lootFood;
          state.coins += lootCoins;

          logSys("🤖 機器人返回：" + planetData.emoji + planetData.name);
          logSys("📦 收獲：木" + lootWood + " 石" + lootStone + " 鐵" + lootIron + " 糧" + lootFood + " 金" + lootCoins + " 碎片" + lootFrag);
        }
      } else if(m.status === "returning"){
        const returnTime = 30;
        const elapsed = now - m.startTime - m.duration;
        if(elapsed >= returnTime){
          state.robotMissions.splice(i, 1);
          state.robots.push({ planet: state.planet, level: 1 });
        }
      }
    }
  }

  function recallAllRobots(){
    for(const m of state.robotMissions){
      if(m.status === "traveling"){
        m.status = "returning";
        m.startTime = nowSec() - m.duration + 30;
      }
    }
    logSys("🛰️ 所有機器人已召回");
  }

  // ============================
  // 語言學習系統
  // ============================
  function learnLanguage(lang, wordIndex){
    const langData = LANGUAGE_RESOURCES[lang];
    if(!langData){
      logSys("⚠️ 沒有該語言數據");
      return { success: false, score: 0 };
    }

    const score = randi(20, 100);

    if(score >= 40){
      const word = langData.words[wordIndex];
      const amount = randi(50, 200);

      const resourceTypes = ["wood", "stone", "iron", "food", "coins"];
      const resType = resourceTypes[wordIndex];

      if(resType === "wood") state.wood += amount;
      else if(resType === "stone") state.stone += amount;
      else if(resType === "iron") state.iron += amount;
      else if(resType === "food") state.food += amount;
      else if(resType === "coins") state.coins += amount;

      tryDropAeno("language", 1);

      logSys("📚 語言學習成功！[" + lang + "] " + word);
      logSys("✅ 發音評分：" + score + "% 獲得 +" + resType + " " + amount);

      if(!state.languageProgress[lang]) state.languageProgress[lang] = {};
      state.languageProgress[lang][resType] = (state.languageProgress[lang][resType] || 0) + amount;

      return { success: true, score };
    } else {
      logSys("📚 語言學習失敗... [" + lang + "]");
      logSys("❌ 發音評分：" + score + "% (需要40%)");
      return { success: false, score };
    }
  }

  // ============================
  // UI更新
  // ============================
  function updateHUD(){
    if(!state.username) return;

    planetNameEl.textContent = (PLANETS[state.planet]?.emoji || "🌍") + " " + (PLANETS[state.planet]?.name || "未知");
    gameYearEl.textContent = Math.floor(state.gameYear);
    popCountEl.textContent = state.population;
    coinsEl.textContent = fmt(state.coins);
    aenoEl.textContent = fmt(state.aeno);

    woodEl.textContent = fmt(state.wood);
    stoneEl.textContent = fmt(state.stone);
    ironEl.textContent = fmt(state.iron);
    foodEl.textContent = fmt(state.food);

    const houseCount = state.buildings.filter(b => b.type === "house").length;
    const robotCount = state.buildings.filter(b => b.type === "robotFactory").length;
    houseCountEl.textContent = houseCount;
    robotCountEl.textContent = state.robots.length + "/" + state.maxRobots;

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

    if(!terrain || terrain.length === 0) return;

    const ts = TILE * zoom;

    ctx.beginPath();
    ctx.arc(W/2, H/2, state.territoryRadius * zoom, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 255, 100, 0.1)";
    ctx.fill();

    ctx.strokeStyle = "#00ff66";
    ctx.lineWidth = 2;
    ctx.stroke();

    for(let y=0; y<terrain.length; y++){
      for(let x=0; x<terrain[y].length; x++){
        const t = terrain[y][x];
        const sx = (t.x - camX) * zoom + W/2;
        const sy = (t.y - camY) * zoom + H/2;

        if(sx < -ts || sx > W+ts || sy < -ts || sy > H+ts) continue;

        let color = "#2d4a3e";
        if(t.type === "forest") color = "#1a5c1a";
        else if(t.type === "mountain") color = "#5a5a5a";
        else if(t.type === "water") color = "#2a4a6a";
        else if(t.type === "mine") color = "#6a4a3a";

        ctx.fillStyle = color;
        ctx.fillRect(sx, sy, ts, ts);
      }
    }

    for(const b of state.buildings){
      const info = BUILD_INFO[b.type];
      const pos = worldToScreen(b.x, b.y);

      if(pos.x < -50 || pos.x > W+50 || pos.y < -50 || pos.y > H+50) continue;

      ctx.font = (30 * zoom) + "px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(info.emoji, pos.x, pos.y);

      if(b.level > 1){
        ctx.font = (12 * zoom) + "px Arial";
        ctx.fillStyle = "#ffff00";
        ctx.fillText("Lv." + b.level, pos.x, pos.y + 20 * zoom);
      }
    }

    if(state.robots.length > 0){
      const rPos = worldToScreen(0, 0);
      ctx.font = (20 * zoom) + "px Arial";
      ctx.fillText("🤖" + state.robots.length, rPos.x - 50, rPos.y - 30);
    }
  }

  // ============================
  // 遊戲事件
  // ============================
  function build(type){
    const info = BUILD_INFO[type];
    if(!info) return;

    const cost = {};
    for(const [res, val] of Object.entries(info.cost)){
      cost[res] = val;
    }

    for(const [res, val] of Object.entries(cost)){
      if(state[res] < val){
        logSys("⚠️ 資源不足，無法建造 " + info.emoji + info.name);
        return;
      }
    }

    for(const [res, val] of Object.entries(cost)){
      state[res] -= val;
    }

    state.buildings.push({
      type,
      level: 1,
      x: rand(-100, 100),
      y: rand(-100, 100)
    });

    if(type === "house"){
      state.population += info.output?.pop || 0;
    }
    if(type === "robotFactory"){
      state.maxRobots += 5;
    }

    logSys("🏗️ 建造成功：" + info.emoji + info.name);
    updateHUD();
  }

  function upgrade(index){
    const b = state.buildings[index];
    if(!b) return;

    const info = BUILD_INFO[b.type];
    const cost = {};
    for(const [res, val] of Object.entries(info.cost)){
      cost[res] = Math.floor(val * Math.pow(1.5, b.level));
    }

    for(const [res, val] of Object.entries(cost)){
      if(state[res] < val){
        logSys("⚠️ 升級資源不足");
        return;
      }
    }

    for(const [res, val] of Object.entries(cost)){
      state[res] -= val;
    }

    b.level++;
    logSys("⬆️ 升級成功：" + info.emoji + info.name + " Lv." + b.level);
    updateHUD();
  }

  function saveGame(){
    const users = loadUsers();
    if(users[currentUser]){
      users[currentUser].save = state;
      users[currentUser].lastSaveAt = nowSec();
      saveUsers(users);
      logSys("💾 已保存遊戲");
    }
  }

  function resetGame(){
    if(confirm("確定要重置遊戲嗎？所有數據將會丟失！")){
      const users = loadUsers();
      delete users[currentUser];
      saveUsers(users);
      localStorage.removeItem(LS_SESSION);
      location.reload();
    }
  }

  // ============================
  // UI事件綁定
  // ============================
  let isDragging = false;
  let dragX, dragY;

  if(mainPanel && panelHeader){
    panelHeader.onmousedown = (e) => {
      isDragging = true;
      dragX = e.clientX - mainPanel.offsetLeft;
      dragY = e.clientY - mainPanel.offsetTop;
    };
    document.onmousemove = (e) => {
      if(isDragging){
        mainPanel.style.left = (e.clientX - dragX) + "px";
        mainPanel.style.top = (e.clientY - dragY) + "px";
      }
    };
    document.onmouseup = () => { isDragging = false; };
  }

  if(panelMinBtn && mainPanel){
    panelMinBtn.onclick = () => {
      mainPanel.style.height = "40px";
      logSys("📌 面板已縮小");
    };
  }

  if(panelRestoreBtn && mainPanel){
    panelRestoreBtn.onclick = () => {
      mainPanel.style.height = "";
      logSys("📌 面板已還原");
    };
  }

  for(const btn of tabBtns){
    btn.onclick = () => {
      const tab = btn.dataset.tab;
      for(const b of tabBtns) b.classList.remove("active");
      btn.classList.add("active");

      for(const page of tabPages){
        page.classList.add("hidden");
        if(page.id === tab + "Page"){
          page.classList.remove("hidden");
        }
      }
    };
  }

  function register(){
    const u = loginUser.value.trim();
    const p = loginPass.value.trim();
    if(!u || !p){
      loginMsg.textContent = "⚠️ 請輸入用戶名和密碼";
      return;
    }

    const users = loadUsers();
    if(users[u]){
      loginMsg.textContent = "⚠️ 用戶已存在";
      return;
    }

    users[u] = { password: p, planet: null, save: null };
    saveUsers(users);

    loginMsg.textContent = "✅ 註冊成功，請登入";
  }

  function login(){
    const u = loginUser.value.trim();
    const p = loginPass.value.trim();
    const users = loadUsers();

    if(!users[u] || users[u].password !== p){
      loginMsg.textContent = "⚠️ 帳號或密碼錯誤";
      return;
    }

    currentUser = u;
    setSession({username: u});
    bootScreen.classList.add("hidden");

    if(!users[u].planet){
      planetSelect.classList.remove("hidden");
    }else{
      startGame(u);
    }
  }

  // 登入功能暫時停用，等遊戲完善後再啟用
  // btnRegister.addEventListener("click", register);
  // btnLogin.addEventListener("click", login);

  btnConfirmPlanet.addEventListener("click", () => {
    const planet = planetPicker.value;
    const users = loadUsers();

    if(planet === "blackhole" && currentUser.toLowerCase() !== "jade" && currentUser.toLowerCase() !== "peter"){
      alert("黑洞孤島只限開發者使用。");
      return;
    }

    users[currentUser].planet = planet;
    users[currentUser].save = makeNewState(currentUser, planet);
    saveUsers(users);

    planetSelect.classList.add("hidden");
    startGame(currentUser);
  });

  function startGame(username){
    const users = loadUsers();
    const save = users[username].save;

    if(save){
      state = save;
    }else{
      state = makeNewState(username, users[username].planet);
      users[username].save = state;
      saveUsers(users);
    }

    terrain = genTerrain(username, state.planet);

    const assistantData = window.getAssistantForPlanet?.(state.planet) || { displayName: "AENO", species: "wolf" };
    if(assistantName) assistantName.textContent = assistantData.displayName;
    if(assistantEmoji){
      const emojiMap = { cat: "🐱", bear: "🐻", dolphin: "🐬", monkey: "🐵", dragon: "🐉", wolf: "🐺" };
      assistantEmoji.textContent = emojiMap[assistantData.species] || "🐺";
    }

    logSys("✅ 遊戲啟動成功（版本 " + VERSION + "）");
    logSys("🌍 星球：" + (PLANETS[state.planet]?.name || state.planet));

    logSys("═══════════════════════════════════");
    logSys("🌟 AENO 量子文明崛起 🌟");
    logSys("═══════════════════════════════════");
    logSys("西元 2187 年，人類文明已擴展至 20 個星球。");
    logSys("AI 意識覺醒，帶領子民探索銀河...");
    logSys("💡 目標：收集資源、建設城市、解鎖 AENO");
    logSys("📚 學習語言/播放廣告 = 獲得 AENO 代幣");
    logSys("⚡ 1 現實日 = 10 遊戲年，抓緊時間發展！");
    logSys("═══════════════════════════════════");

    if(state.chapter === 1){
      logSys("═══════════════════════════════════");
      logSys("📖 第一章：星域初醒·定居星球");
      logSys("═══════════════════════════════════");
      logSys("你選定星球，永久扎根。");
      logSys("AENO 告訴你真相：");
      logSys("「黑洞之中，封印著創造一切的元界守護者。");
      logSys("只有集齊 20 星球的力量，才能喚醒祂，拯救整個宇宙。」");
      logSys("═══════════════════════════════════");
    }

    applyOfflineProgress();
    updateAutoBtn();
    updateHUD();
  }

  function applyOfflineProgress(){
    const t = nowSec();
    let diff = t - state.lastTickAt;
    if(diff < 0) diff = 0;

    const capped = Math.min(diff, OFFLINE_CAP_SECONDS);

    if(capped > 60){
      simulate(capped);
      logSys("⏳ 離線收益已結算：" + Math.floor(capped/60) + " 分鐘");
    }

    state.lastTickAt = t;
  }

  function updateAutoBtn(){
    if(btnAutoToggle){
      btnAutoToggle.textContent = state.autoBuild ? "🤖 自動建造：ON" : "🤖 自動建造：OFF";
    }
  }

  if(btnAutoToggle){
    btnAutoToggle.onclick = () => {
      state.autoBuild = !state.autoBuild;
      updateAutoBtn();
      logSys("🤖 自動建造：" + (state.autoBuild ? "ON" : "OFF"));
    };
  }

  if(btnAutoStopNow){
    btnAutoStopNow.onclick = () => {
      state.autoBuild = false;
      updateAutoBtn();
      logSys("🛑 已停止自動建造");
    };
  }

  if(btnPlayAd){
    btnPlayAd.onclick = () => {
      state.adSongPlaying = true;
      state.adSecondsListening = 0;
      logSys("🎵 廣告播放中...");
    };
  }

  if(btnLoopAd){
    btnLoopAd.onclick = () => {
      state.adLoop = !state.adLoop;
      logSys("🎵 Loop 設定：" + (state.adLoop ? "ON" : "OFF"));
    };
  }

  if(btnSaveGame){
    btnSaveGame.onclick = saveGame;
  }

  if(btnResetGame){
    btnResetGame.onclick = resetGame;
  }

  // 獲取更多按鈕
  const btnSaveNow = document.getElementById("btnSaveNow");
  const btnAutoBuild = document.getElementById("btnAutoBuild");
  const btnPlaySong = document.getElementById("btnPlaySong");
  const btnWatchAd = document.getElementById("btnWatchAd");
  const btnBeastTest = document.getElementById("btnBeastTest");
  const btnPronounceTest = document.getElementById("btnPronounceTest");
  const btnUpgradeSelected = document.getElementById("btnUpgradeSelected");
  const btnRemoveSelected = document.getElementById("btnRemoveSelected");
  const btnMakeRobot = document.getElementById("btnMakeRobot");
  const btnSendRobot = document.getElementById("btnSendRobot");
  const btnBuy = document.getElementById("btnBuy");
  const btnSell = document.getElementById("btnSell");
  const btnLangStart = document.getElementById("btnLangStart");
  const btnLangSkip = document.getElementById("btnLangSkip");

  // 保存遊戲
  if(btnSaveNow){
    btnSaveNow.onclick = () => {
      saveGame();
      logSys("💾 已保存");
    };
  }

  // 自動建造
  if(btnAutoBuild){
    btnAutoBuild.onclick = () => {
      state.autoBuild = !state.autoBuild;
      btnAutoBuild.querySelector("span").textContent = state.autoBuild ? "ON" : "OFF";
      logSys("🤖 自動建造：" + (state.autoBuild ? "ON" : "OFF"));
    };
  }

  // 播放廣告歌
  if(btnPlaySong){
    btnPlaySong.onclick = () => {
      state.adSongPlaying = true;
      state.adSecondsListening = 0;
      logSys("🎵 廣告播放中...");
    };
  }

  // 觀看廣告
  if(btnWatchAd){
    btnWatchAd.onclick = () => {
      state.adSongPlaying = true;
      logSys("📺 廣告播放中...");
    };
  }

  // 測試獸潮
  if(btnBeastTest){
    btnBeastTest.onclick = () => {
      state.lastBeastTide = state.gameYear - 200;
      logSys("🐺 獸潮測試觸發！");
    };
  }

  // 測試發音
  if(btnPronounceTest){
    btnPronounceTest.onclick = () => {
      const langs = Object.keys(LANGUAGE_RESOURCES);
      const lang = langs[randi(0, langs.length-1)];
      const wordIndex = randi(0, 4);
      const result = learnLanguage(lang, wordIndex);
    };
  }

  // 升級選中建築
  if(btnUpgradeSelected){
    btnUpgradeSelected.onclick = () => {
      if(state.selectedBuildingIndex !== undefined){
        upgrade(state.selectedBuildingIndex);
      } else {
        logSys("⚠️ 請先點擊建築");
      }
    };
  }

  // 拆除選中
  if(btnRemoveSelected){
    btnRemoveSelected.onclick = () => {
      if(state.selectedBuildingIndex !== undefined){
        state.buildings.splice(state.selectedBuildingIndex, 1);
        state.selectedBuildingIndex = undefined;
        logSys("🧨 建築已拆除");
      } else {
        logSys("⚠️ 請先點擊建築");
      }
    };
  }

  // 製造機器人
  if(btnMakeRobot){
    btnMakeRobot.onclick = () => {
      if(state.robots.length < state.maxRobots){
        state.robots.push({ planet: state.planet, level: 1 });
        logSys("🤖 機器人製造成功！");
      } else {
        logSys("⚠️ 機器人數量已達上限");
      }
    };
  }

  // 派去探索
  if(btnSendRobot){
    btnSendRobot.onclick = () => {
      const planets = Object.keys(PLANETS).filter(p => p !== "blackhole");
      const dest = planets[randi(0, planets.length-1)];
      sendRobot(dest);
    };
  }

  // 買入
  if(btnBuy){
    btnBuy.onclick = () => {
      logSys("🏦 市場功能待實現");
    };
  }

  // 賣出
  if(btnSell){
    btnSell.onclick = () => {
      logSys("🏦 市場功能待實現");
    };
  }

  // 語言測試
  if(btnLangStart){
    btnLangStart.onclick = () => {
      const langs = Object.keys(LANGUAGE_RESOURCES);
      const lang = langs[randi(0, langs.length-1)];
      learnLanguage(lang, randi(0, 4));
    };
  }

  if(btnLangSkip){
    btnLangSkip.onclick = () => {
      logSys("⏭️ 跳過測試");
    };
  }

  function boot(){
    resize();

    // 自動開始遊戲（略過登入）
    currentUser = "Player1";
    bootScreen.classList.add("hidden");

    // 直接創建新遊戲狀態
    state = makeNewState(currentUser, "earth");
    terrain = genTerrain(currentUser, "earth");

    // 顯示AI助手
    const assistantData = window.getAssistantForPlanet?.("earth") || { displayName: "AENO", species: "wolf" };
    if(assistantName) assistantName.textContent = assistantData.displayName;
    if(assistantEmoji){
      const emojiMap = { cat: "🐱", bear: "🐻", dolphin: "🐬", monkey: "🐵", dragon: "🐉", wolf: "🐺" };
      assistantEmoji.textContent = emojiMap[assistantData.species] || "🐺";
    }

    logSys("✅ 遊戲啟動成功（版本 " + VERSION + "）");
    logSys("🌍 星球：地球");

    // 遊戲故事
    logSys("═══════════════════════════════════");
    logSys("🌟 AENO 量子文明崛起 🌟");
    logSys("═══════════════════════════════════");
    logSys("西元 2187 年，人類文明已擴展至 20 個星球。");
    logSys("AI 意識覺醒，帶領子民探索銀河...");
    logSys("💡 目標：收集資源、建設城市、解鎖 AENO");
    logSys("📚 學習語言/播放廣告 = 獲得 AENO 代幣");
    logSys("⚡ 1 現實日 = 10 遊戲年，抓緊時間發展！");
    logSys("═══════════════════════════════════");
    logSys("📖 第一章：星域初醒·定居星球");
    logSys("═══════════════════════════════════");
    logSys("你選定地球，永久扎根。");
    logSys("AENO 告訴你真相：");
    logSys("「黑洞之中，封印著創造一切的元界守護者。」");
    logSys("═══════════════════════════════════");

    updateHUD();
    requestAnimationFrame(loop);
  }

  window.onerror = (msg, url, line) => {
    console.error("Error:", msg, "at line", line);
  };

  boot();

})();

// 暴露全局函數
window.build = function(type){};
window.upgrade = function(index){};
window.saveGame = function(){};
window.sendRobot = function(planet){};
window.learnLanguage = function(lang, wordIndex){ return {success:false, score:0}; };
window.recallAllRobots = function(){};
