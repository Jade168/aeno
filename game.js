// game.js
// AENO Civilization - 3D Comic Full Version
// Version: 2026-02-19
// IMPORTANT: Do NOT delete features unless user approved.

(() => {
  "use strict";

  // ============================
  // DOM
  // ============================
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const bootScreen = document.getElementById("bootScreen");
  const planetSelect = document.getElementById("planetSelect");

  const btnRegister = document.getElementById("btnRegister");
  const btnLogin = document.getElementById("btnLogin");
  const btnGuest = document.getElementById("btnGuest");

  const btnConfirmPlanet = document.getElementById("btnConfirmPlanet");
  const planetPicker = document.getElementById("planetPicker");

  const loginUser = document.getElementById("loginUser");
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

  const sysLog = document.getElementById("sysLog");

  const btnBuildMode = document.getElementById("btnBuildMode");
  const btnCancelBuildMode = document.getElementById("btnCancelBuildMode");
  const btnUpgradeMode = document.getElementById("btnUpgradeMode");
  const btnCancelUpgradeMode = document.getElementById("btnCancelUpgradeMode");

  const btnRobotSend = document.getElementById("btnRobotSend");
  const btnRobotRecall = document.getElementById("btnRobotRecall");
  const btnPronTest = document.getElementById("btnPronTest");

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

  const threeToggle = document.getElementById("threeToggle");

  // ============================
  // Service Worker
  // ============================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }

  // ============================
  // Constants
  // ============================
  const VERSION = "2026-02-19";

  // Real 1 day = game 10 years
  const YEARS_PER_REAL_SECOND = 10 / 86400;

  const OFFLINE_CAP_SECONDS = 24 * 3600;

  const WORLD_SIZE = 2200;

  // ============================
  // Screen
  // ============================
  let W = 1, H = 1;
  let camX = 0, camY = 0;
  let zoom = 1;

  function resize(){
    W = canvas.width = window.innerWidth * devicePixelRatio;
    H = canvas.height = window.innerHeight * devicePixelRatio;
  }
  window.addEventListener("resize", resize);

  // ============================
  // Utils
  // ============================
  const rand = (a,b)=> a + Math.random()*(b-a);
  const randi = (a,b)=> Math.floor(rand(a,b+1));
  const clamp = (v,a,b)=> Math.max(a,Math.min(b,v));
  const nowSec = ()=> Math.floor(Date.now()/1000);

  function fmt(n){
    if(n>=1e9) return (n/1e9).toFixed(2)+"B";
    if(n>=1e6) return (n/1e6).toFixed(2)+"M";
    if(n>=1e3) return (n/1e3).toFixed(2)+"K";
    return Math.floor(n).toString();
  }

  function logSys(msg){
    if(!sysLog) return;
    const t = new Date().toLocaleTimeString();
    sysLog.innerHTML = `<div><b>[${t}]</b> ${msg}</div>` + sysLog.innerHTML;
  }

  // ============================
  // Local Storage
  // ============================
  const LS_USERS = "aeno_users_v2";
  const LS_SESSION = "aeno_session_v2";

  function loadUsers(){
    try{
      return JSON.parse(localStorage.getItem(LS_USERS)||"{}");
    }catch(e){ return {}; }
  }

  function saveUsers(obj){
    localStorage.setItem(LS_USERS, JSON.stringify(obj));
  }

  function getSession(){
    try{
      return JSON.parse(localStorage.getItem(LS_SESSION)||"null");
    }catch(e){ return null; }
  }

  function setSession(sess){
    localStorage.setItem(LS_SESSION, JSON.stringify(sess));
  }

  // ============================
  // Planet Translation Pack
  // ============================
  let PLANETS = [];

  async function loadPlanets(){
    try{
      const res = await fetch("./planets.json?ts="+Date.now());
      const data = await res.json();
      PLANETS = data.planets || [];
    }catch(e){
      PLANETS = [];
    }
  }

  function getPlanetInfo(id){
    return PLANETS.find(p=>p.id===id) || {id, name:id, language:"Unknown", locale:"en-US", flag:"🌍"};
  }

  // ============================
  // AI Brain (DNA Mutation)
  // ============================
  // DNA mutation every 100 game years.
  // (This is AI Brain logic core)
  function hashStr(s){
    let h = 2166136261;
    for(let i=0;i<s.length;i++){
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h>>>0);
  }

  function seededRand(seed){
    let t = seed >>> 0;
    return ()=>{
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ t >>> 15, 1 | t);
      r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
      return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
  }

  function genWorldSeed(username, planet){
    return `${username}::${planet}::AENO::${VERSION}`;
  }

  function genTerrain(username, planet, dnaEpoch){
    const seed = hashStr(genWorldSeed(username, planet) + "::DNA::" + dnaEpoch);
    const R = seededRand(seed);

    function sr(a,b){ return a + R()*(b-a); }
    function sri(a,b){ return Math.floor(sr(a,b+1)); }

    const animalEmojis = ["🦌","🐗","🐺","🦊","🐍","🦖","🦕","🦁","🐘","🦝","🐼","🐲"];

    const features = {
      forests: [],
      mountains: [],
      mines: [],
      rivers: [],
      animals: [],
      palette: {
        sky: `hsl(${sri(180,220)}, 80%, ${sri(85,94)}%)`,
        forest: `hsl(${sri(90,140)}, 60%, ${sri(40,55)}%)`,
        mountain: `hsl(${sri(200,240)}, 10%, ${sri(40,60)}%)`,
        mine: `hsl(${sri(20,60)}, 90%, ${sri(45,60)}%)`,
        river: `hsl(${sri(190,210)}, 85%, ${sri(45,60)}%)`
      }
    };

    // forests
    for(let i=0;i<18;i++){
      features.forests.push({
        x: sr(-WORLD_SIZE/2, WORLD_SIZE/2),
        y: sr(-WORLD_SIZE/2, WORLD_SIZE/2),
        r: sr(120, 260)
      });
    }

    // mountains
    for(let i=0;i<14;i++){
      features.mountains.push({
        x: sr(-WORLD_SIZE/2, WORLD_SIZE/2),
        y: sr(-WORLD_SIZE/2, WORLD_SIZE/2),
        r: sr(150, 290)
      });
    }

    // mines
    for(let i=0;i<12;i++){
      features.mines.push({
        x: sr(-WORLD_SIZE/2, WORLD_SIZE/2),
        y: sr(-WORLD_SIZE/2, WORLD_SIZE/2),
        r: sr(80, 150)
      });
    }

    // rivers
    for(let i=0;i<3;i++){
      const points = [];
      let px = sr(-WORLD_SIZE/2, WORLD_SIZE/2);
      let py = sr(-WORLD_SIZE/2, WORLD_SIZE/2);
      for(let k=0;k<12;k++){
        points.push({x:px,y:py});
        px += sr(-240,240);
        py += sr(-240,240);
      }
      features.rivers.push(points);
    }

    // animals
    for(let i=0;i<22;i++){
      features.animals.push({
        x: sr(-WORLD_SIZE/2, WORLD_SIZE/2),
        y: sr(-WORLD_SIZE/2, WORLD_SIZE/2),
        emoji: animalEmojis[sri(0, animalEmojis.length-1)],
        hp: sri(60,140)
      });
    }

    return features;
  }

  // ============================
  // Game State
  // ============================
  let currentUser = null;
  let state = null;
  let terrain = null;

  function makeNewState(username, planet){
    const isBlackHole = planet === "blackhole";

    return {
      version: VERSION,
      username,
      planet,
      createdAt: nowSec(),
      lastSaveAt: nowSec(),
      lastTickAt: nowSec(),

      // time
      gameYear: 0,

      // dna epoch (AI brain)
      dnaEpoch: 0,

      // economy
      coins: 2000,
      aeno: 0,

      // resources
      wood: 800,
      stone: 800,
      iron: 800,
      food: 800,

      // people
      population: 4,
      workers: 4,

      // territory
      territoryRadius: isBlackHole ? 900 : 240,

      // buildings
      buildings: [
        {type:"house", level:1, x:-60, y:40},
        {type:"house", level:1, x:60, y:40}
      ],

      // robots
      robots: 1,
      robotMissions: [],

      // beast tide
      wallIntegrity: 0,
      beastLoot: 0,

      // ad song
      adSongPlaying: false,
      adLoop: true,
      adSecondsListening: 0,

      // pronunciation learning
      pronScore: 0,
      pronQualified: false,
      translationPacks: {},

      // auto build
      autoBuild: true,

      // modes
      buildMode: false,
      upgradeMode: false,
      selectedBuildType: null,
      pendingBuildConfirm: null,

      // blackhole story flags
      blackholeUnlocked: false,

      // key system placeholder (future)
      keySystem: {
        enabled: false,
        playerKeys: [],
        motherKeyHidden: true
      }
    };
  }

  function saveGame(){
    if(!state || !currentUser) return;
    state.lastSaveAt = nowSec();
    const users = loadUsers();
    if(!users[currentUser]) return;
    users[currentUser].save = state;
    saveUsers(users);
    logSys("💾 已保存遊戲");
  }

  // ============================
  // Build System
  // ============================
  const BUILD_INFO = {
    house: { name:"房屋", emoji:"🏠", baseCost:{wood:50,stone:20,iron:0,food:10,coins:80} },
    lumber:{ name:"伐木場", emoji:"🪓", baseCost:{wood:30,stone:30,iron:10,food:0,coins:120} },
    quarry:{ name:"採石場", emoji:"🪨", baseCost:{wood:20,stone:40,iron:10,food:0,coins:140} },
    mine:  { name:"礦場", emoji:"⛏️", baseCost:{wood:20,stone:60,iron:0,food:0,coins:160} },
    farm:  { name:"農田", emoji:"🌾", baseCost:{wood:40,stone:20,iron:0,food:0,coins:110} },
    market:{ name:"市集", emoji:"🏦", baseCost:{wood:60,stone:50,iron:20,food:0,coins:200} },
    wall:  { name:"城牆", emoji:"🛡️", baseCost:{wood:80,stone:120,iron:30,food:0,coins:250} },
    lab:   { name:"研究所", emoji:"🧬", baseCost:{wood:120,stone:80,iron:60,food:0,coins:350} }
  };

  function getCost(type, level){
    const info = BUILD_INFO[type];
    const mult = 1 + (level-1)*0.45;
    return {
      wood: Math.floor(info.baseCost.wood * mult),
      stone: Math.floor(info.baseCost.stone * mult),
      iron: Math.floor(info.baseCost.iron * mult),
      food: Math.floor(info.baseCost.food * mult),
      coins: Math.floor(info.baseCost.coins * mult)
    };
  }

  function canAfford(cost){
    return (
      state.wood >= cost.wood &&
      state.stone >= cost.stone &&
      state.iron >= cost.iron &&
      state.food >= cost.food &&
      state.coins >= cost.coins
    );
  }

  function payCost(cost){
    state.wood -= cost.wood;
    state.stone -= cost.stone;
    state.iron -= cost.iron;
    state.food -= cost.food;
    state.coins -= cost.coins;
  }

  function countBuildings(type){
    return state.buildings.filter(b=>b.type===type).length;
  }

  function isInTerritory(x,y){
    return Math.hypot(x,y) <= state.territoryRadius;
  }

  function buildAt(type, x, y){
    const cost = getCost(type, 1);
    if(!canAfford(cost)){
      logSys("⚠️ 資源不足，無法建造");
      return false;
    }
    if(!isInTerritory(x,y)){
      logSys("⚠️ 超出領土，不能建築");
      return false;
    }

    payCost(cost);
    state.buildings.push({type, level:1, x, y});

    if(type==="house"){
      state.population += 2;
      state.workers += 1;
    }

    if(type==="wall"){
      state.wallIntegrity = clamp(state.wallIntegrity + 12, 0, 100);
    }

    logSys(`🏗️ 建造成功：${BUILD_INFO[type].emoji}${BUILD_INFO[type].name}`);
    return true;
  }

  function upgradeBuilding(b){
    const nextLv = b.level + 1;
    const cost = getCost(b.type, nextLv);
    if(!canAfford(cost)){
      logSys("⚠️ 升級資源不足");
      return false;
    }
    payCost(cost);
    b.level = nextLv;

    if(b.type==="house"){
      state.population += 1;
      state.workers += 1;
    }

    if(b.type==="wall"){
      state.wallIntegrity = clamp(state.wallIntegrity + 8, 0, 100);
    }

    logSys(`⬆️ 升級成功：${BUILD_INFO[b.type].emoji}${BUILD_INFO[b.type].name} Lv.${b.level}`);
    return true;
  }

  // ============================
  // Pronunciation Proof (Mock now)
  // ============================
  function doPronunciationMock(){
    const score = randi(10, 98);
    state.pronScore = score;
    state.pronQualified = score >= 40;

    const planetInfo = getPlanetInfo(state.planet);
    if(!state.translationPacks[state.planet]) state.translationPacks[state.planet] = 0;

    if(state.pronQualified){
      const packGain = randi(1, 3);
      state.translationPacks[state.planet] += packGain;
      logSys(`📢 發音測試：${score}% ✅ 合格 +翻譯包${packGain} (${planetInfo.language})`);

      // reward fragments
      const frag = randi(1, 4);
      state.beastLoot += frag;
      logSys(`🎁 你獲得碎片 +${frag}`);
    }else{
      logSys(`📢 發音測試：${score}% ❌ 未達40%（再試一次）`);
    }
  }

  // ============================
  // AENO Mining (Hidden Definition)
  // "attention + learning behavior + ads"
  // ============================
  function hiddenAenoChance(){
    let base = 0.00002;

    // ad listening boosts
    const adBoost = Math.min(1.8, 1 + (state.adSecondsListening/60)*0.02);

    // pronunciation boosts
    const pronBoost = 1 + (state.pronScore/100)*0.8;

    // infra boosts
    const infraBoost = 1 + countBuildings("market")*0.08 + countBuildings("lab")*0.05;

    // worker boosts
    const workerBoost = 1 + state.workers*0.01;

    let chance = base * adBoost * pronBoost * infraBoost * workerBoost;
    chance = Math.min(chance, 0.00035);

    return chance;
  }

  function tryMintAeno(dtSec){
    const rolls = Math.max(1, Math.floor(dtSec / 3));
    for(let i=0;i<rolls;i++){
      if(Math.random() < hiddenAenoChance()){
        const gain = 0.0008 + Math.random()*0.0014;
        state.aeno += gain;
      }
    }
  }

  // ============================
  // Robot System (20 planets random)
  // ============================
  function getPlanetPool(){
    return PLANETS.map(p=>p.id).filter(id=>id!=="blackhole");
  }

  function sendRobot(){
    if(state.robots <= state.robotMissions.length){
      logSys("⚠️ 沒有空閒機器人");
      return;
    }

    const pool = getPlanetPool();
    const dest = pool[randi(0, pool.length-1)];

    const duration = randi(40, 120);
    const endAt = nowSec() + duration;

    state.robotMissions.push({
      dest,
      endAt,
      startedAt: nowSec(),
      done:false
    });

    const info = getPlanetInfo(dest);
    logSys(`🚀 機器人出發：${info.flag} ${info.name}（約 ${duration}s）`);
  }

  function recallRobots(){
    state.robotMissions = [];
    logSys("🛰️ 所有機器人已召回");
  }

  function processRobotMissions(){
    const t = nowSec();

    for(const m of state.robotMissions){
      if(!m.done && t >= m.endAt){
        m.done = true;

        const lootWood = randi(30, 160);
        const lootStone = randi(20, 120);
        const lootIron = randi(10, 90);
        const lootFood = randi(20, 140);

        state.wood += lootWood;
        state.stone += lootStone;
        state.iron += lootIron;
        state.food += lootFood;

        const coins = randi(40, 180);
        state.coins += coins;

        const frag = randi(0, 4);
        state.beastLoot += frag;

        const info = getPlanetInfo(m.dest);
        logSys(`🤖 探索完成：${info.flag}${info.name} +木${lootWood} 石${lootStone} 鐵${lootIron} 糧${lootFood} +金${coins} +碎片${frag}`);
      }
    }

    state.robotMissions = state.robotMissions.filter(m=>!(m.done && nowSec()-m.endAt>60));
  }

  // ============================
  // Beast Tide System
  // ============================
  let beastTimer = 0;

  function beastTick(dt){
    beastTimer += dt;

    if(beastTimer >= 60){
      beastTimer = 0;

      const baseChance = 0.18 + (state.gameYear/2000)*0.10;
      const chance = clamp(baseChance, 0.18, 0.55);

      if(Math.random() < chance){
        const defended = state.wallIntegrity >= 60;

        if(defended){
          const lootCoins = randi(60, 220);
          const lootFrag = randi(2, 6);

          state.coins += lootCoins;
          state.beastLoot += lootFrag;

          logSys(`🐺 獸潮來襲！你成功防守 +金${lootCoins} +碎片${lootFrag}`);
        }else{
          const lossFood = randi(30, 120);
          state.food = Math.max(0, state.food - lossFood);

          logSys(`🐺 獸潮襲擊！防禦不足，糧食損失 -${lossFood}`);
        }
      }
    }
  }

  // ============================
  // Economy Tick
  // ============================
  function produceResources(dt){
    let woodRate = 0;
    let stoneRate = 0;
    let ironRate = 0;
    let foodRate = 0;
    let coinRate = 0;

    for(const b of state.buildings){
      const lv = b.level;

      if(b.type==="lumber") woodRate += 0.35*lv;
      if(b.type==="quarry") stoneRate += 0.30*lv;
      if(b.type==="mine") ironRate += 0.22*lv;
      if(b.type==="farm") foodRate += 0.38*lv;
      if(b.type==="market") coinRate += 0.25*lv;
      if(b.type==="house") coinRate += 0.10*lv;
    }

    const workerBoost = 1 + (state.workers*0.015);

    state.wood += woodRate * workerBoost * dt;
    state.stone += stoneRate * workerBoost * dt;
    state.iron += ironRate * workerBoost * dt;
    state.food += foodRate * workerBoost * dt;
    state.coins += coinRate * workerBoost * dt;

    const foodNeed = state.population * 0.04 * dt;
    state.food -= foodNeed;

    if(state.food < 0){
      state.food = 0;
      if(Math.random() < 0.02){
        state.population = Math.max(1, state.population-1);
        state.workers = Math.max(1, state.workers-1);
        logSys("⚠️ 糧食不足，人口減少");
      }
    }
  }

  // ============================
  // Ads Song System
  // ============================
  let adData = null;
  let audio = new Audio();
  audio.volume = 0.7;
  let currentTrackIndex = 0;

  async function loadAds(){
    try{
      const res = await fetch("./ads.json?ts="+Date.now());
      adData = await res.json();
      if(adData.defaultVolume != null){
        audio.volume = clamp(adData.defaultVolume, 0, 1);
      }
      logSys("🎵 已載入廣告歌列表");
    }catch(e){
      logSys("⚠️ ads.json 載入失敗");
    }
  }

  function playTrack(){
    if(!adData || !adData.tracks || adData.tracks.length===0){
      logSys("⚠️ 沒有廣告歌曲");
      return;
    }

    const track = adData.tracks[currentTrackIndex % adData.tracks.length];
    audio.src = track.file + "?v=" + Date.now();
    audio.loop = false;

    audio.play().then(()=>{
      state.adSongPlaying = true;
      logSys(`🎵 播放中：${track.title}`);
    }).catch(()=>{
      logSys("⚠️ 播放失敗：瀏覽器禁止自動播放（請再按一次）");
    });
  }

  audio.addEventListener("ended", ()=>{
    if(state.adLoop){
      currentTrackIndex++;
      playTrack();
    }else{
      state.adSongPlaying = false;
    }
  });

  // ============================
  // HUD Update
  // ============================
  function updateHUD(){
    const p = getPlanetInfo(state.planet);
    planetNameEl.textContent = `${p.flag} ${p.name}`;
    gameYearEl.textContent = Math.floor(state.gameYear);
    popCountEl.textContent = state.population;

    coinsEl.textContent = fmt(state.coins);
    aenoEl.textContent = state.aeno.toFixed(4);

    woodEl.textContent = fmt(state.wood);
    stoneEl.textContent = fmt(state.stone);
    ironEl.textContent = fmt(state.iron);
    foodEl.textContent = fmt(state.food);

    houseCountEl.textContent = countBuildings("house");
    robotCountEl.textContent = state.robots;
  }

  // ============================
  // 2D Map Rendering (fallback / overlay)
  // ============================
  function worldToScreen(x,y){
    return {
      x: (x - camX) * zoom + W/2,
      y: (y - camY) * zoom + H/2
    };
  }

  function screenToWorld(x,y){
    return {
      x: (x - W/2)/zoom + camX,
      y: (y - H/2)/zoom + camY
    };
  }

  function drawTerrain2D(){
    if(!terrain) return;

    ctx.fillStyle = terrain.palette.sky;
    ctx.fillRect(0,0,W,H);

    // forests
    for(const f of terrain.forests){
      const p = worldToScreen(f.x,f.y);
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = terrain.palette.forest;
      ctx.beginPath();
      ctx.arc(p.x,p.y,f.r*zoom,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // mountains
    for(const m of terrain.mountains){
      const p = worldToScreen(m.x,m.y);
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = terrain.palette.mountain;
      ctx.beginPath();
      ctx.arc(p.x,p.y,m.r*zoom,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // mines
    for(const mi of terrain.mines){
      const p = worldToScreen(mi.x,mi.y);
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = terrain.palette.mine;
      ctx.beginPath();
      ctx.arc(p.x,p.y,mi.r*zoom,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // rivers
    ctx.save();
    ctx.strokeStyle = terrain.palette.river;
    ctx.lineWidth = 18*zoom;
    ctx.globalAlpha = 0.55;
    for(const river of terrain.rivers){
      ctx.beginPath();
      for(let i=0;i<river.length;i++){
        const p = worldToScreen(river[i].x, river[i].y);
        if(i===0) ctx.moveTo(p.x,p.y);
        else ctx.lineTo(p.x,p.y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // territory shading
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,W,H);

    ctx.globalCompositeOperation = "destination-out";
    const center = worldToScreen(0,0);
    ctx.beginPath();
    ctx.arc(center.x, center.y, state.territoryRadius*zoom, 0, Math.PI*2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    // border
    ctx.save();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4*zoom;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(center.x, center.y, state.territoryRadius*zoom, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBuildings2D(){
    for(const b of state.buildings){
      const p = worldToScreen(b.x,b.y);
      const size = 36*zoom;

      ctx.save();
      ctx.fillStyle = "#ffffffdd";
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 2*zoom;

      ctx.beginPath();
      ctx.roundRect(p.x-size/2, p.y-size/2, size, size, 10*zoom);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = `${14*zoom}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(BUILD_INFO[b.type].emoji, p.x, p.y-5*zoom);

      ctx.font = `${10*zoom}px system-ui`;
      ctx.fillText("Lv."+b.level, p.x, p.y+12*zoom);
      ctx.restore();
    }
  }

  function drawAnimals2D(){
    if(!terrain) return;
    for(const a of terrain.animals){
      const p = worldToScreen(a.x,a.y);
      ctx.save();
      ctx.font = `${22*zoom}px system-ui`;
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText(a.emoji, p.x, p.y);
      ctx.restore();
    }
  }

  function render2D(){
    drawTerrain2D();
    drawBuildings2D();
    drawAnimals2D();
  }

  // ============================
  // Three.js 3D Comic Mode
  // ============================
  let threeEnabled = true;
  let scene = null;
  let camera = null;
  let renderer = null;
  let threeObjects = [];
  let threeLastBuildCount = 0;

  function initThree(){
    if(!window.THREE){
      logSys("⚠️ Three.js 未載入，使用2D模式");
      threeEnabled = false;
      return;
    }

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );

    camera.position.set(0, 180, 300);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(devicePixelRatio);

    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.zIndex = "1";

    document.body.appendChild(renderer.domElement);

    // lights
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(200, 300, 200);
    scene.add(light);

    const amb = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(amb);

    // ground
    const groundGeo = new THREE.PlaneGeometry(3000, 3000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x224466 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -2;
    scene.add(ground);

    // cute assistant 3D
    const bodyGeo = new THREE.SphereGeometry(20, 20, 20);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 22, 0);
    scene.add(body);

    const headGeo = new THREE.SphereGeometry(16, 20, 20);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 50, 0);
    scene.add(head);

    const earGeo = new THREE.SphereGeometry(6, 16, 16);
    const earMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const ear1 = new THREE.Mesh(earGeo, earMat);
    ear1.position.set(-10, 65, 0);
    scene.add(ear1);

    const ear2 = new THREE.Mesh(earGeo, earMat);
    ear2.position.set(10, 65, 0);
    scene.add(ear2);

    // eyes
    const eyeGeo = new THREE.SphereGeometry(2.5, 10, 10);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(-5, 52, 14);
    scene.add(eye1);

    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye2.position.set(5, 52, 14);
    scene.add(eye2);

    logSys("✨ Three.js 3D 模式已啟動");
  }

  function clearThreeBuildings(){
    for(const o of threeObjects){
      scene.remove(o);
    }
    threeObjects = [];
  }

  function rebuildThreeBuildings(){
    if(!scene || !state) return;

    clearThreeBuildings();

    for(const b of state.buildings){
      const geo = new THREE.BoxGeometry(30, 30, 30);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const cube = new THREE.Mesh(geo, mat);

      cube.position.set(b.x, 15, b.y);

      // color per type (comic)
      if(b.type==="house") cube.material.color.setHex(0xffddaa);
      if(b.type==="farm") cube.material.color.setHex(0xaaffaa);
      if(b.type==="mine") cube.material.color.setHex(0xcccccc);
      if(b.type==="market") cube.material.color.setHex(0xaad4ff);
      if(b.type==="wall") cube.material.color.setHex(0x999999);
      if(b.type==="lab") cube.material.color.setHex(0xffaaff);

      scene.add(cube);
      threeObjects.push(cube);
    }

    threeLastBuildCount = state.buildings.length;
  }

  function renderThree(){
    if(!renderer || !scene || !camera) return;

    if(state && state.buildings.length !== threeLastBuildCount){
      rebuildThreeBuildings();
    }

    renderer.render(scene, camera);
  }

  function setThreeEnabled(on){
    threeEnabled = on;

    if(on){
      if(!renderer){
        initThree();
        rebuildThreeBuildings();
      }
      if(renderer) renderer.domElement.style.display = "block";
      threeToggle.textContent = "💡 3D: ON";
    }else{
      if(renderer) renderer.domElement.style.display = "none";
      threeToggle.textContent = "💡 3D: OFF";
    }
  }

  threeToggle.addEventListener("click", ()=>{
    setThreeEnabled(!threeEnabled);
  });

  // ============================
  // Input
  // ============================
  let dragging = false;
  let lastTouch = null;

  canvas.addEventListener("pointerdown", (e)=>{
    dragging = true;
    lastTouch = {x:e.clientX*devicePixelRatio, y:e.clientY*devicePixelRatio};
  });

  canvas.addEventListener("pointermove", (e)=>{
    if(!dragging) return;
    const nx = e.clientX*devicePixelRatio;
    const ny = e.clientY*devicePixelRatio;
    const dx = nx - lastTouch.x;
    const dy = ny - lastTouch.y;
    lastTouch = {x:nx,y:ny};
    camX -= dx/zoom;
    camY -= dy/zoom;
  });

  canvas.addEventListener("pointerup", ()=> dragging=false);
  canvas.addEventListener("pointercancel", ()=> dragging=false);

  canvas.addEventListener("wheel", (e)=>{
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    zoom = clamp(zoom + delta, 0.55, 2.2);
  }, {passive:true});

  // build / upgrade click
  canvas.addEventListener("click", (e)=>{
    if(!state) return;

    const mx = e.clientX*devicePixelRatio;
    const my = e.clientY*devicePixelRatio;
    const w = screenToWorld(mx,my);

    if(state.upgradeMode){
      for(const b of state.buildings){
        if(Math.hypot(w.x-b.x, w.y-b.y) < 35){
          upgradeBuilding(b);
          return;
        }
      }
      logSys("⚠️ 沒有點到建築");
      return;
    }

    if(state.buildMode){
      if(!state.selectedBuildType){
        logSys("⚠️ 先選建築類型");
        return;
      }

      if(!isInTerritory(w.x,w.y)){
        logSys("⚠️ 超出領土");
        return;
      }

      state.pendingBuildConfirm = {type:state.selectedBuildType, x:w.x, y:w.y};
      logSys("📌 已選位置，雙擊確認建造");
      return;
    }
  });

  canvas.addEventListener("dblclick", (e)=>{
    if(!state) return;
    if(!state.buildMode) return;
    if(!state.pendingBuildConfirm) return;

    const mx = e.clientX*devicePixelRatio;
    const my = e.clientY*devicePixelRatio;
    const w = screenToWorld(mx,my);

    const p = state.pendingBuildConfirm;
    if(Math.hypot(w.x-p.x, w.y-p.y) < 40){
      buildAt(p.type, p.x, p.y);
      state.pendingBuildConfirm = null;
    }
  });

  // ============================
  // Panel Drag
  // ============================
  let panelDrag = false;
  let panelDragStart = null;

  panelHeader.addEventListener("pointerdown", (e)=>{
    panelDrag = true;
    panelDragStart = {
      x: e.clientX,
      y: e.clientY,
      left: mainPanel.offsetLeft,
      top: mainPanel.offsetTop
    };
    panelHeader.setPointerCapture(e.pointerId);
  });

  panelHeader.addEventListener("pointermove", (e)=>{
    if(!panelDrag) return;
    const dx = e.clientX - panelDragStart.x;
    const dy = e.clientY - panelDragStart.y;
    mainPanel.style.left = (panelDragStart.left + dx) + "px";
    mainPanel.style.top = (panelDragStart.top + dy) + "px";
    mainPanel.style.right = "auto";
  });

  panelHeader.addEventListener("pointerup", ()=>{
    panelDrag = false;
  });

  // ============================
  // Tabs
  // ============================
  tabBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      tabBtns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");

      tabPages.forEach(p=>p.classList.remove("active"));
      const target = document.getElementById(btn.dataset.tab);
      if(target) target.classList.add("active");
    });
  });

  // ============================
  // Panel Buttons
  // ============================
  let panelMinimized = false;

  panelMinBtn.addEventListener("click", ()=>{
    panelMinimized = !panelMinimized;
    if(panelMinimized){
      mainPanel.style.height = "190px";
      logSys("📌 面板已縮小");
    }else{
      mainPanel.style.height = "";
      logSys("📌 面板已還原");
    }
  });

  panelHideBtn.addEventListener("click", ()=>{
    mainPanel.classList.add("hidden");
    panelRestoreBtn.classList.remove("hidden");
    logSys("📌 面板已收起");
  });

  panelRestoreBtn.addEventListener("click", ()=>{
    mainPanel.classList.remove("hidden");
    panelRestoreBtn.classList.add("hidden");
    logSys("📌 面板已打開");
  });

  // ============================
  // Chat
  // ============================
  function addChat(msg){
    chatLog.innerHTML += `<div style="margin-bottom:6px;">${msg}</div>`;
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function openChat(){
    chatBox.classList.remove("hidden");
  }

  assistantTalkBtn.addEventListener("click", ()=>{
    openChat();
    const assistantData = window.getAssistantForPlanet(state.planet);
    const pool = assistantData.dialogues.idle || ["你好"];
    addChat("🧠 " + pool[randi(0,pool.length-1)]);
  });

  assistant.addEventListener("click", ()=>{
    openChat();
  });

  chatClose.addEventListener("click", ()=>{
    chatBox.classList.add("hidden");
  });

  chatSend.addEventListener("click", ()=>{
    const text = chatInput.value.trim();
    if(!text) return;
    chatInput.value = "";
    addChat("👤 " + text);

    const t = text.toLowerCase();

    if(t.includes("巡邏")){
      addChat("🧠 好！我會安排工人巡邏領土。");
      state.coins += 10;
    }else if(t.includes("收集")){
      addChat("🧠 工人開始收集資源。");
      state.wood += 30;
      state.stone += 20;
      state.food += 20;
    }else if(t.includes("建造")){
      addChat("🧠 你可以切換建築模式，再點領土空地建築。");
    }else if(t.includes("升級")){
      addChat("🧠 你可以切換升級模式，再點建築升級。");
    }else if(t.includes("發音") || t.includes("學習")){
      doPronunciationMock();
    }else if(t.includes("黑洞")){
      if(state.blackholeUnlocked){
        addChat("🧠 黑洞之門已開啟，你已成為候選繼承者。");
      }else{
        addChat("🧠 黑洞仍被封印，需累積文明與碎片。");
      }
    }else{
      addChat("🧠 指令收到！未來會加入更多命令。");
    }
  });

  // ============================
  // Build Buttons
  // ============================
  document.querySelectorAll(".buildBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const type = btn.dataset.build;
      state.selectedBuildType = type;
      logSys(`🏗️ 已選擇建築：${BUILD_INFO[type].emoji}${BUILD_INFO[type].name}`);
    });
  });

  btnBuildMode.addEventListener("click", ()=>{
    state.buildMode = true;
    state.upgradeMode = false;
    logSys("🏗️ 建築模式 ON（點領土空地，雙擊確認）");
  });

  btnCancelBuildMode.addEventListener("click", ()=>{
    state.buildMode = false;
    state.pendingBuildConfirm = null;
    logSys("🏗️ 建築模式 OFF");
  });

  btnUpgradeMode.addEventListener("click", ()=>{
    state.upgradeMode = true;
    state.buildMode = false;
    logSys("⬆️ 升級模式 ON（點建築升級）");
  });

  btnCancelUpgradeMode.addEventListener("click", ()=>{
    state.upgradeMode = false;
    logSys("⬆️ 升級模式 OFF");
  });

  // ============================
  // Robots Buttons
  // ============================
  btnRobotSend.addEventListener("click", sendRobot);
  btnRobotRecall.addEventListener("click", recallRobots);

  // pronunciation
  btnPronTest.addEventListener("click", doPronunciationMock);

  // ============================
  // Market
  // ============================
  function getRate(item){
    if(item==="wood") return 2;
    if(item==="stone") return 3;
    if(item==="iron") return 5;
    if(item==="food") return 2;
    return 3;
  }

  btnBuy.addEventListener("click", ()=>{
    const item = marketItem.value;
    const amt = Math.max(1, parseInt(marketAmount.value||"1"));
    const rate = getRate(item);
    const cost = amt * rate;

    if(state.coins < cost){
      logSys("⚠️ 金幣不足");
      return;
    }
    state.coins -= cost;
    state[item] += amt;
    logSys(`🏦 買入成功：${item} +${amt}（花費${cost}）`);
  });

  btnSell.addEventListener("click", ()=>{
    const item = marketItem.value;
    const amt = Math.max(1, parseInt(marketAmount.value||"1"));
    const rate = getRate(item);
    const gain = Math.floor(amt * rate * 0.7);

    if(state[item] < amt){
      logSys("⚠️ 資源不足");
      return;
    }
    state[item] -= amt;
    state.coins += gain;
    logSys(`🏦 賣出成功：${item} -${amt}（獲得${gain}）`);
  });

  // ============================
  // Ads
  // ============================
  btnPlayAd.addEventListener("click", playTrack);

  btnLoopAd.addEventListener("click", ()=>{
    state.adLoop = !state.adLoop;
    btnLoopAd.textContent = state.adLoop ? "🔁 Loop: ON" : "🔁 Loop: OFF";
    logSys("🎵 Loop：" + (state.adLoop ? "ON" : "OFF"));
  });

  // ============================
  // Auto Build
  // ============================
  function updateAutoBtn(){
    btnAutoToggle.textContent = "自動建造: " + (state.autoBuild ? "ON" : "OFF");
  }

  btnAutoToggle.addEventListener("click", ()=>{
    state.autoBuild = !state.autoBuild;
    updateAutoBtn();
    logSys("🤖 自動建造：" + (state.autoBuild ? "ON" : "OFF"));
  });

  btnAutoStopNow.addEventListener("click", ()=>{
    state.autoBuild = false;
    updateAutoBtn();
    logSys("🛑 已停止自動建造");
  });

  function aiAutoBuild(dt){
    if(!state.autoBuild) return;
    if(Math.random() > 0.03) return;

    const reserve = {wood:200,stone:200,iron:120,food:200,coins:300};

    function safeAfford(cost){
      return (
        state.wood - cost.wood >= reserve.wood &&
        state.stone - cost.stone >= reserve.stone &&
        state.iron - cost.iron >= reserve.iron &&
        state.food - cost.food >= reserve.food &&
        state.coins - cost.coins >= reserve.coins
      );
    }

    const order = ["farm","lumber","quarry","mine","market","house","wall"];

    for(const type of order){
      let need = false;

      if(type==="farm" && state.food < 500) need = true;
      if(type==="lumber" && state.wood < 500) need = true;
      if(type==="quarry" && state.stone < 500) need = true;
      if(type==="mine" && state.iron < 400) need = true;
      if(type==="market" && state.coins < 1500) need = true;
      if(type==="house" && state.population < 20) need = true;
      if(type==="wall" && state.wallIntegrity < 80) need = true;

      if(!need) continue;

      const cost = getCost(type, 1);
      if(!safeAfford(cost)) continue;

      const angle = rand(0, Math.PI*2);
      const dist = rand(40, state.territoryRadius-60);
      const x = Math.cos(angle)*dist;
      const y = Math.sin(angle)*dist;

      if(buildAt(type, x, y)){
        break;
      }
    }
  }

  // ============================
  // Save / Reset
  // ============================
  btnSaveGame.addEventListener("click", saveGame);

  btnResetGame.addEventListener("click", ()=>{
    if(confirm("確定要重置？此玩家紀錄會清空。")){
      const users = loadUsers();
      users[currentUser].save = makeNewState(currentUser, users[currentUser].planet);
      saveUsers(users);
      state = users[currentUser].save;
      terrain = genTerrain(currentUser, state.planet, state.dnaEpoch);
      rebuildThreeBuildings();
      logSys("🗑️ 已重置玩家");
    }
  });

  // ============================
  // DNA Mutation Trigger
  // ============================
  function checkDNAMutation(){
    const epoch = Math.floor(state.gameYear / 100);
    if(epoch > state.dnaEpoch){
      state.dnaEpoch = epoch;
      terrain = genTerrain(currentUser, state.planet, state.dnaEpoch);
      logSys(`🧬 DNA 變異觸發！世界進化到 Epoch ${state.dnaEpoch}`);

      // reward for witnessing evolution
      state.coins += 200;
      state.beastLoot += 2;
      logSys("🎁 AI大腦獎勵：金幣+200，碎片+2");
    }
  }

  // ============================
  // Blackhole Unlock Logic
  // ============================
  function checkBlackholeUnlock(){
    if(state.blackholeUnlocked) return;

    // unlock condition example
    if(state.aeno >= 10 || state.beastLoot >= 80){
      state.blackholeUnlocked = true;
      logSys("🕳️ 黑洞封印開始崩解！你已成為候選繼承者。");
    }
  }

  // ============================
  // Simulation
  // ============================
  function simulate(dtSec){
    if(dtSec <= 0) return;

    state.gameYear += dtSec * YEARS_PER_REAL_SECOND;

    if(state.adSongPlaying){
      state.adSecondsListening += dtSec;
    }

    produceResources(dtSec);
    processRobotMissions();
    beastTick(dtSec);
    tryMintAeno(dtSec);
    aiAutoBuild(dtSec);

    checkDNAMutation();
    checkBlackholeUnlock();
  }

  // ============================
  // Main Loop
  // ============================
  let last = performance.now();

  function loop(ts){
    const dt = (ts - last) / 1000;
    last = ts;

    if(state){
      simulate(dt);
      updateHUD();
    }

    // render
    if(state){
      render2D();
      if(threeEnabled) renderThree();
    }

    // autosave
    if(state && currentUser && Math.random() < 0.01){
      saveGame();
    }

    requestAnimationFrame(loop);
  }

  // ============================
  // Offline Progress
  // ============================
  function applyOfflineProgress(){
    const t = nowSec();
    let diff = t - state.lastTickAt;
    if(diff < 0) diff = 0;

    const capped = Math.min(diff, OFFLINE_CAP_SECONDS);

    if(capped > 10){
      logSys(`⏳ 離線收益已結算：${Math.floor(capped/60)} 分鐘（最多24小時）`);
    }

    simulate(capped);

    state.lastTickAt = t;
  }

  // ============================
  // Start Game
  // ============================
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

    terrain = genTerrain(username, state.planet, state.dnaEpoch);

    const assistantData = window.getAssistantForPlanet(state.planet);
    assistantName.textContent = assistantData.displayName;

    if(assistantData.species==="cat") assistantEmoji.textContent="🐱";
    else if(assistantData.species==="bear") assistantEmoji.textContent="🐻";
    else if(assistantData.species==="dolphin") assistantEmoji.textContent="🐬";
    else if(assistantData.species==="monkey") assistantEmoji.textContent="🐵";
    else if(assistantData.species==="dragon") assistantEmoji.textContent="🐉";
    else if(assistantData.species==="lion") assistantEmoji.textContent="🦁";
    else assistantEmoji.textContent="🐺";

    logSys("✅ 遊戲啟動成功（版本 " + VERSION + "）");

    loadAds();
    applyOfflineProgress();
    updateAutoBtn();
    updateHUD();

    initThree();
    rebuildThreeBuildings();
    setThreeEnabled(true);
  }

  // ============================
  // Login / Register
  // ============================
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

    users[u] = {
      password: p,
      planet: null,
      save: null
    };

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
    setSession({username:u});

    bootScreen.classList.add("hidden");

    if(!users[u].planet){
      planetSelect.classList.remove("hidden");
    }else{
      startGame(u);
    }
  }

  function loginGuest(){
    currentUser = "guest_" + Math.floor(Math.random()*99999);
    setSession({username: currentUser});

    const users = loadUsers();
    users[currentUser] = {
      password: "",
      planet: null,
      save: null
    };
    saveUsers(users);

    bootScreen.classList.add("hidden");
    planetSelect.classList.remove("hidden");
  }

  btnRegister.addEventListener("click", register);
  btnLogin.addEventListener("click", login);
  btnGuest.addEventListener("click", loginGuest);

  btnConfirmPlanet.addEventListener("click", ()=>{
    const planet = planetPicker.value;
    const users = loadUsers();

    if(planet==="blackhole"){
      const name = currentUser.toLowerCase();
      if(name!=="jade" && name!=="peter"){
        alert("黑洞孤島只限開發者使用。");
        return;
      }
    }

    users[currentUser].planet = planet;
    users[currentUser].save = makeNewState(currentUser, planet);
    saveUsers(users);

    planetSelect.classList.add("hidden");
    startGame(currentUser);
  });

  // ============================
  // Boot
  // ============================
  async function boot(){
    resize();

    await loadPlanets();

    // fill planet select UI
    planetPicker.innerHTML = "";
    for(const p of PLANETS){
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.flag} ${p.name} (${p.language})`;
      planetPicker.appendChild(opt);
    }

    // add blackhole option
    const bh = document.createElement("option");
    bh.value = "blackhole";
    bh.textContent = "🕳️ 黑洞孤島（開發者）";
    planetPicker.appendChild(bh);

    const sess = getSession();
    if(sess && sess.username){
      const users = loadUsers();
      if(users[sess.username]){
        currentUser = sess.username;
        bootScreen.classList.add("hidden");

        if(!users[currentUser].planet){
          planetSelect.classList.remove("hidden");
        }else{
          startGame(currentUser);
        }
      }
    }

    requestAnimationFrame(loop);
  }

  boot();

})();
