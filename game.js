// game.js
// AENO Civilization - Full Version
// Version: 2026-02-15
// Important: Do NOT delete features unless user approved.

(() => {
  "use strict";

  // ============================
  // DOM
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
  // Service Worker register
  // ============================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }

  // ============================
  // Constants
  // ============================
  const VERSION = "2026-02-15";

  // Game time: 1 real day = 10 in-game years
  // 1 day = 86400 sec -> 10 years -> 10*365 = 3650 days in game
  // We'll store gameYear as floating
  const YEARS_PER_REAL_SECOND = 10 / 86400; // years per second

  const OFFLINE_CAP_SECONDS = 24 * 3600; // 24 hours offline max

  // Camera / zoom
  let W = 1, H = 1;
  let camX = 0, camY = 0;
  let zoom = 1;

  // ============================
  // Utilities
  // ============================
  const rand = (a,b)=> a + Math.random()*(b-a);
  const randi = (a,b)=> Math.floor(rand(a,b+1));
  const clamp = (v,a,b)=> Math.max(a,Math.min(b,v));
  const nowSec = ()=> Math.floor(Date.now()/1000);

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
  const LS_USERS = "aeno_users_v1";
  const LS_SESSION = "aeno_session_v1";

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
  // Game World Generation
  // ============================
  const WORLD_SIZE = 2200; // map size
  const TILE = 50;

  function genWorldSeed(username, planet){
    // stable seed string
    return `${username}::${planet}::AENO::${VERSION}`;
  }

  // pseudo hash
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

  function genTerrain(username, planet){
    const seed = hashStr(genWorldSeed(username, planet));
    const R = seededRand(seed);

    const features = {
      forests: [],
      rivers: [],
      mountains: [],
      mines: [],
      animals: []
    };

    // forests
    for(let i=0;i<18;i++){
      features.forests.push({
        x: rand(-WORLD_SIZE/2, WORLD_SIZE/2),
        y: rand(-WORLD_SIZE/2, WORLD_SIZE/2),
        r: rand(140, 260)
      });
    }

    // mountains
    for(let i=0;i<14;i++){
      features.mountains.push({
        x: rand(-WORLD_SIZE/2, WORLD_SIZE/2),
        y: rand(-WORLD_SIZE/2, WORLD_SIZE/2),
        r: rand(160, 280)
      });
    }

    // mines
    for(let i=0;i<12;i++){
      features.mines.push({
        x: rand(-WORLD_SIZE/2, WORLD_SIZE/2),
        y: rand(-WORLD_SIZE/2, WORLD_SIZE/2),
        r: rand(90, 150)
      });
    }

    // river path
    for(let i=0;i<3;i++){
      const points = [];
      let px = rand(-WORLD_SIZE/2, WORLD_SIZE/2);
      let py = rand(-WORLD_SIZE/2, WORLD_SIZE/2);
      for(let k=0;k<12;k++){
        points.push({x:px,y:py});
        px += rand(-240,240);
        py += rand(-240,240);
      }
      features.rivers.push(points);
    }

    // animals
    const animalEmojis = ["�陁�","����","��𡉼","�陁�","����","�陁�","�陁�","�陁�","����"];
    for(let i=0;i<22;i++){
      features.animals.push({
        x: rand(-WORLD_SIZE/2, WORLD_SIZE/2),
        y: rand(-WORLD_SIZE/2, WORLD_SIZE/2),
        emoji: animalEmojis[randi(0, animalEmojis.length-1)],
        hp: randi(60,140)
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

      // wall integrity for beast tide trigger
      wallIntegrity: 0, // 0-100
      beastLoot: 0,

      // auto build addon
      autoBuild: true,
      autoPriorities: {
        house:true,
        lumber:true,
        quarry:true,
        mine:true,
        farm:true,
        market:true,
        wall:true,
        lab:false
      },

      // build modes
      buildMode: false,
      upgradeMode: false,

      // ad song
      adSongPlaying: false,
      adLoop: true,
      adSecondsListening: 0,

      // pronunciation
      pronScore: 0,
      pronQualified: false,

      // ui
      selectedBuildType: null,
      pendingBuildConfirm: null,

      // debug
      flags: {
        firstBootDone: false
      }
    };
  }

  function saveGame(){
    if(!state || !currentUser) return;
    state.lastSaveAt = nowSec();
    const users = loadUsers();
    users[currentUser].save = state;
    saveUsers(users);
    logSys("��𠒣 撌脖�嘥�㗛�𦠜�蝝���");
  }

  function loadGame(username){
    const users = loadUsers();
    if(!users[username]) return null;
    return users[username].save || null;
  }

  // ============================
  // Build / Upgrade System
  // ============================
  const BUILD_INFO = {
    house: {
      name:"��撅�",
      emoji:"����",
      baseCost:{wood:50,stone:20,iron:0,food:10,coins:80},
      produces:{coins:2},
      popAdd:2
    },
    lumber: {
      name:"隡鞉銁�聦",
      emoji:"�𡝭�",
      baseCost:{wood:30,stone:30,iron:10,food:0,coins:120},
      produces:{wood:6}
    },
    quarry: {
      name:"�繧�𨺗�聦",
      emoji:"�𡝭�",
      baseCost:{wood:20,stone:40,iron:10,food:0,coins:140},
      produces:{stone:5}
    },
    mine: {
      name:"蝷血聦",
      emoji:"��𧶏��",
      baseCost:{wood:20,stone:60,iron:0,food:0,coins:160},
      produces:{iron:4}
    },
    farm: {
      name:"颲脩眎",
      emoji:"��駠",
      baseCost:{wood:40,stone:20,iron:0,food:0,coins:110},
      produces:{food:6}
    },
    market: {
      name:"撣���",
      emoji:"��𡖂",
      baseCost:{wood:60,stone:50,iron:20,food:0,coins:200},
      produces:{coins:6}
    },
    wall: {
      name:"��𡒊�",
      emoji:"��椘儭�",
      baseCost:{wood:80,stone:120,iron:30,food:0,coins:250},
      produces:{defense:5}
    },
    lab: {
      name:"��𠉛弦��",
      emoji:"�榀�",
      baseCost:{wood:120,stone:80,iron:60,food:0,coins:350},
      produces:{tech:1}
    }
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

  function isInTerritory(x,y){
    const d = Math.hypot(x, y);
    return d <= state.territoryRadius;
  }

  function buildAt(type, x, y){
    const cost = getCost(type, 1);
    if(!canAfford(cost)){
      logSys(`��𩤃�� 鞈��𣂷�滩雲嚗𣬚�⊥�訫遣�� ${BUILD_INFO[type].emoji}${BUILD_INFO[type].name}`);
      return false;
    }

    if(!isInTerritory(x,y)){
      logSys("��𩤃�� 銝齿糓��睃�毺���㵪�䔶�滩�賢遣蝭�");
      return false;
    }

    payCost(cost);
    state.buildings.push({type, level:1, x, y});

    if(type==="house"){
      state.population += BUILD_INFO.house.popAdd;
      state.workers += 1;
    }

    logSys(`���梹�� 撱粹�䭾�𣂼����${BUILD_INFO[type].emoji}${BUILD_INFO[type].name}`);
    return true;
  }

  function upgradeBuilding(b){
    const nextLv = b.level + 1;
    const cost = getCost(b.type, nextLv);
    if(!canAfford(cost)){
      logSys("��𩤃�� ����朞���𣂷�滩雲");
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

    logSys(`漎�儭� ����𡁏�𣂼����${BUILD_INFO[b.type].emoji}${BUILD_INFO[b.type].name} Lv.${b.level}`);
    return true;
  }

  function countBuildings(type){
    return state.buildings.filter(b=>b.type===type).length;
  }

  // ============================
  // AENO Hidden Mining Algorithm
  // ============================
  // IMPORTANT: user閬�瘙�靽嘥�嚗䔶�滚虾�凒�𦻖憿舐內�砍��
  // �躰ㄐ雿輻鍂摮埈�齿�惩�瘛瑟�嚗��漤＊蝷箏祕��𥟇彍摮梹��
  function hiddenAenoChance(){
    // Inputs:
    // - adSecondsListening
    // - pronScore
    // - buildings count
    // - workers
    // - online time tick

    // Obfuscation mapping
    // K->1, L->0 style (not obvious)
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const map = {};
    for(let i=0;i<alphabet.length;i++){
      map[alphabet[i]] = (i % 10);
    }

    const A = map["K"]; // 0-9
    const B = map["L"];
    const C = map["M"];
    const D = map["N"];
    const E = map["O"];

    const base = 0.00002 + (A*0.000001);
    const adBoost = Math.min(1.6, 1 + (state.adSecondsListening/60)*0.015 + (B*0.001));
    const pronBoost = 1 + (state.pronScore/100)*0.7 + (C*0.001);

    const infra = 1 + (countBuildings("market")*0.08) + (countBuildings("lab")*0.05) + (D*0.0005);
    const workerBoost = 1 + (state.workers*0.01) + (E*0.0002);

    let chance = base * adBoost * pronBoost * infra * workerBoost;

    // cap to avoid too fast
    chance = Math.min(chance, 0.00035);

    return chance;
  }

  function tryMintAeno(dtSec){
    // dtSec is seconds elapsed in simulation
    const rolls = Math.max(1, Math.floor(dtSec / 3));
    for(let i=0;i<rolls;i++){
      const chance = hiddenAenoChance();
      if(Math.random() < chance){
        // small mint
        const gain = 0.0008 + Math.random()*0.0014;
        state.aeno += gain;
      }
    }
  }

  // ============================
  // Pronunciation (Mock)
  // ============================
  function doPronunciationMock(){
    // simulate a pronunciation score 0-100
    const score = randi(10, 95);
    state.pronScore = score;
    state.pronQualified = score >= 40;

    if(state.pronQualified){
      logSys(`��𤙥 �䔄�𨺗皜祈岫嚗�${score}% �� ���聢嚗㇁ENO ��㕑氜璈毺���𣂼���头);
    }else{
      logSys(`��𤙥 �䔄�𨺗皜祈岫嚗�${score}% ��� �𧊋��40%嚗��见�滩岫嚗头);
    }
  }

  // ============================
  // Robot Exploration System
  // ============================
  const PLANET_POOL = [
    "earth","mars","ocean","jungle",
    "planet05","planet06","planet07","planet08",
    "planet09","planet10","planet11","planet12",
    "planet13","planet14","planet15","planet16",
    "planet17","planet18","planet19","planet20"
  ];

  function sendRobot(){
    if(state.robots <= state.robotMissions.length){
      logSys("��𩤃�� 瘝埝�厩征��埝�笔膥鈭�");
      return;
    }

    const dest = PLANET_POOL[randi(0, PLANET_POOL.length-1)];
    const duration = randi(40, 120); // seconds
    const endAt = nowSec() + duration;

    state.robotMissions.push({
      dest,
      endAt,
      startedAt: nowSec(),
      done:false
    });

    logSys(`��� 璈笔膥鈭箏歇�枂�䔄�䔝蝝ｇ��${dest}嚗�� ${duration}s嚗头);
  }

  function recallRobots(){
    state.robotMissions = [];
    logSys("��𤌴儭� ����㗇�笔膥鈭箏歇�𡢢���");
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

        // fragments & coins
        const coins = randi(40, 180);
        state.coins += coins;

        // beast fragments
        const frag = randi(0, 4);
        state.beastLoot += frag;

        logSys(`�鴂� �䔝蝝Ｗ�峕�琜��${m.dest} +�銁${lootWood} �𨺗${lootStone} �閠${lootIron} 蝟�${lootFood} +���${coins} +蝣𡒊��${frag}`);
      }
    }

    // cleanup old missions
    state.robotMissions = state.robotMissions.filter(m=>!(m.done && nowSec()-m.endAt>60));
  }

  // ============================
  // Beast Tide System
  // ============================
  let beastTimer = 0;

  function beastTick(dt){
    // Only if wall is 100%
    if(state.wallIntegrity < 100) return;

    beastTimer += dt;
    if(beastTimer >= 60){
      beastTimer = 0;

      // chance
      if(Math.random() < 0.35){
        const lootCoins = randi(60, 220);
        const lootFrag = randi(1, 6);

        state.coins += lootCoins;
        state.beastLoot += lootFrag;

        logSys(`��𡉼 �桊瞏桐�镼莎�雿䭾�𣂼�罸俈摰��𣬚㬢敺� +���${lootCoins} +蝣𡒊��${lootFrag}`);
      }
    }
  }

  // ============================
  // Auto Build Addon (AI)
  // ============================
  let autoTimer = 0;

  function aiAutoBuild(dt){
    if(!state.autoBuild) return;

    autoTimer += dt;
    if(autoTimer < 8) return;
    autoTimer = 0;

    // Reserve resources (prevent AI ruin player)
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

    // build if low houses / low food / etc
    const prios = Object.keys(state.autoPriorities).filter(k=>state.autoPriorities[k]);

    for(const type of prios){
      // Decide need
      let need = false;

      if(type==="house" && state.population < 20) need = true;
      if(type==="farm" && state.food < 500) need = true;
      if(type==="lumber" && state.wood < 500) need = true;
      if(type==="quarry" && state.stone < 500) need = true;
      if(type==="mine" && state.iron < 400) need = true;
      if(type==="market" && state.coins < 1500) need = true;
      if(type==="wall" && state.wallIntegrity < 100) need = true;
      if(type==="lab" && state.aeno > 1.0) need = true;

      if(!need) continue;

      const cost = getCost(type, 1);
      if(!safeAfford(cost)) continue;

      // build near center random
      const angle = rand(0, Math.PI*2);
      const dist = rand(40, state.territoryRadius-60);
      const x = Math.cos(angle)*dist;
      const y = Math.sin(angle)*dist;

      if(buildAt(type, x, y)){
        // expand territory slightly with coins cost
        if(state.coins > 400){
          state.coins -= 60;
          state.territoryRadius = clamp(state.territoryRadius + 8, 200, 900);
        }
        break;
      }
    }
  }

  // ============================
  // Economy Tick
  // ============================
  function produceResources(dt){
    // production per second from buildings
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
      if(b.type==="house") coinRate += 0.10*lv; // tax
    }

    // workers boost
    const workerBoost = 1 + (state.workers*0.015);

    // 1 real day = 10 game years = 3650 game days
    // divide by 365 to balance production per game year
    const timeBalance = dt / 365;

    state.wood += woodRate * workerBoost * timeBalance;
    state.stone += stoneRate * workerBoost * timeBalance;
    state.iron += ironRate * workerBoost * timeBalance;
    state.food += foodRate * workerBoost * timeBalance;
    state.coins += coinRate * workerBoost * timeBalance;

    // food consumption - balanced with time flow
    const foodNeed = state.population * 0.04 * timeBalance;
    state.food -= foodNeed;

    if(state.food < 0){
      state.food = 0;
      // starvation reduces growth
      if(Math.random() < 0.02){
        state.population = Math.max(1, state.population-1);
        state.workers = Math.max(1, state.workers-1);
        logSys("��𩤃�� 蝟折�煺�滩雲嚗䔶犖�藁皜𥕦��");
      }
    }

    // passive territory expand by activity
    if(state.coins > 300 && Math.random() < 0.015){
      state.coins -= 20;
      state.territoryRadius = clamp(state.territoryRadius + 3, 200, 900);
    }
  }

  // ============================
  // Ad Song System
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
      logSys("��𦄡 撌脰�匧�亙誨��𦠜���𡑒”");
    }catch(e){
      logSys("��𩤃�� ads.json 頛匧�亙仃��梹���𧢲炎�䰻瑼娍����");
    }
  }

  function playTrack(){
    if(!adData || !adData.tracks || adData.tracks.length===0){
      logSys("��𩤃�� 瘝埝�匧誨��𦠜�峕𤩅");
      return;
    }

    const track = adData.tracks[currentTrackIndex % adData.tracks.length];
    audio.src = track.file + "?v=" + Date.now();
    audio.loop = false;

    audio.play().then(()=>{
      state.adSongPlaying = true;
      logSys(`��𦄡 �偘�𦆮銝哨��${track.title}`);
    }).catch(()=>{
      logSys("��𩤃�� �偘�𦆮憭望�梹�𡁶�讛汗�膥蝳�甇Ｚ䌊��閙偘�𦆮嚗��见�齿�劐�甈⊥偘�𦆮嚗�");
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
  // UI Update
  // ============================
  function updateHUD(){
    planetNameEl.textContent = state.planet;
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

    uiWood.textContent = fmt(state.wood);
    uiStone.textContent = fmt(state.stone);
    uiIron.textContent = fmt(state.iron);
    uiFood.textContent = fmt(state.food);
    uiCoins.textContent = fmt(state.coins);
    uiAeno.textContent = state.aeno.toFixed(4);
  }

  // ============================
  // Rendering
  // ============================
  function resize(){
    W = canvas.width = window.innerWidth * devicePixelRatio;
    H = canvas.height = window.innerHeight * devicePixelRatio;
  }
  window.addEventListener("resize", resize);

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

  function drawTerrain(){
    // background
    ctx.fillStyle = "#eaf6ff";
    ctx.fillRect(0,0,W,H);

    // grid faint
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#93c5fd";
    for(let gx=-WORLD_SIZE;gx<=WORLD_SIZE;gx+=TILE){
      const p1 = worldToScreen(gx, -WORLD_SIZE);
      const p2 = worldToScreen(gx, WORLD_SIZE);
      ctx.beginPath();
      ctx.moveTo(p1.x,p1.y);
      ctx.lineTo(p2.x,p2.y);
      ctx.stroke();
    }
    for(let gy=-WORLD_SIZE;gy<=WORLD_SIZE;gy+=TILE){
      const p1 = worldToScreen(-WORLD_SIZE, gy);
      const p2 = worldToScreen(WORLD_SIZE, gy);
      ctx.beginPath();
      ctx.moveTo(p1.x,p1.y);
      ctx.lineTo(p2.x,p2.y);
      ctx.stroke();
    }
    ctx.restore();

    // forests
    for(const f of terrain.forests){
      const p = worldToScreen(f.x,f.y);
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "#22c55e";
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
      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.arc(p.x,p.y,m.r*zoom,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // mines
    for(const mi of terrain.mines){
      const p = worldToScreen(mi.x,mi.y);
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(p.x,p.y,mi.r*zoom,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // rivers
    ctx.save();
    ctx.strokeStyle = "#0ea5e9";
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

    // territory shading (outside is dark)
    ctx.save();
    ctx.globalAlpha = 0.40;
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,W,H);

    ctx.globalCompositeOperation = "destination-out";
    const center = worldToScreen(0,0);
    ctx.beginPath();
    ctx.arc(center.x, center.y, state.territoryRadius*zoom, 0, Math.PI*2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    // territory border
    ctx.save();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4*zoom;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(center.x, center.y, state.territoryRadius*zoom, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBuildings(){
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

  function drawAnimals(){
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

  function drawAssistantBody(){
    // assistant on map (not UI)
    const x = 0;
    const y = -100;
    const p = worldToScreen(x,y);

    ctx.save();

    // body
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y+25*zoom, 26*zoom, 32*zoom, 0, 0, Math.PI*2);
    ctx.fill();

    // head
    ctx.beginPath();
    ctx.ellipse(p.x, p.y-10*zoom, 28*zoom, 28*zoom, 0, 0, Math.PI*2);
    ctx.fill();

    // ears
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.ellipse(p.x-18*zoom, p.y-30*zoom, 10*zoom, 14*zoom, 0.3, 0, Math.PI*2);
    ctx.ellipse(p.x+18*zoom, p.y-30*zoom, 10*zoom, 14*zoom, -0.3, 0, Math.PI*2);
    ctx.fill();

    // eyes
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(p.x-10*zoom, p.y-12*zoom, 3.5*zoom, 0, Math.PI*2);
    ctx.arc(p.x+10*zoom, p.y-12*zoom, 3.5*zoom, 0, Math.PI*2);
    ctx.fill();

    // mouth
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2*zoom;
    ctx.beginPath();
    ctx.arc(p.x, p.y-3*zoom, 8*zoom, 0, Math.PI);
    ctx.stroke();

    // arms
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 4*zoom;
    ctx.beginPath();
    ctx.moveTo(p.x-20*zoom, p.y+20*zoom);
    ctx.lineTo(p.x-35*zoom, p.y+30*zoom);
    ctx.moveTo(p.x+20*zoom, p.y+20*zoom);
    ctx.lineTo(p.x+35*zoom, p.y+30*zoom);
    ctx.stroke();

    // legs
    ctx.beginPath();
    ctx.moveTo(p.x-10*zoom, p.y+50*zoom);
    ctx.lineTo(p.x-15*zoom, p.y+70*zoom);
    ctx.moveTo(p.x+10*zoom, p.y+50*zoom);
    ctx.lineTo(p.x+15*zoom, p.y+70*zoom);
    ctx.stroke();

    // ad shirt slot (future)
    ctx.fillStyle = "rgba(251,191,36,0.85)";
    ctx.beginPath();
    ctx.roundRect(p.x-18*zoom, p.y+15*zoom, 36*zoom, 20*zoom, 6*zoom);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = `${9*zoom}px system-ui`;
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText("AD", p.x, p.y+25*zoom);

    ctx.restore();
  }

  function render(){
    drawTerrain();
    drawBuildings();
    drawAnimals();
    drawAssistantBody();
  }

  // ============================
  // Input / Touch
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

  // click build / upgrade
  canvas.addEventListener("click", (e)=>{
    const mx = e.clientX*devicePixelRatio;
    const my = e.clientY*devicePixelRatio;
    const w = screenToWorld(mx,my);

    // upgrade mode
    if(state.upgradeMode){
      for(const b of state.buildings){
        if(Math.hypot(w.x-b.x, w.y-b.y) < 35){
          upgradeBuilding(b);
          return;
        }
      }
      logSys("��𩤃�� 瘝埝�厰�𧼮�撱箇��");
      return;
    }

    // build mode requires selection
    if(state.buildMode){
      if(!state.selectedBuildType){
        logSys("��𩤃�� ��銁撱箇�厰𢒰�踎�豢��遣蝭厰�𧼮��");
        return;
      }

      if(!isInTerritory(w.x,w.y)){
        logSys("��𩤃�� 銝齿糓��睃�毺���㵪�䔶�滩�賢遣蝭�");
        return;
      }

      state.pendingBuildConfirm = {type:state.selectedBuildType, x:w.x, y:w.y};
      logSys(`���� 撌脤�豢���滨蔭嚗諹�见�齿活暺墧�羓㮾��䔶�滨蔭蝣箄�滚遣�𩤃��${BUILD_INFO[state.selectedBuildType].emoji}${BUILD_INFO[state.selectedBuildType].name}`);
      return;
    }

    // normal mode quick build popup simulation
    if(isInTerritory(w.x,w.y)){
      logSys("���� ��鞟內嚗帋�惩虾隞亙���𥕦遣蝭㗇芋撘𧶏�𣬚�嗅�屸�䂿征�𧑐撱箇�剹��");
    }else{
      logSys("��𩤃�� ��鮋�睃�笔����");
    }
  });

  // confirm build if clicked twice
  canvas.addEventListener("dblclick", (e)=>{
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
  // Panel buttons
  // ============================
  let panelMinimized = false;

  panelMinBtn.addEventListener("click", ()=>{
    panelMinimized = !panelMinimized;
    if(panelMinimized){
      mainPanel.style.height = "180px";
      logSys("���� �𢒰�踎撌脩葬撠�");
    }else{
      mainPanel.style.height = "";
      logSys("���� �𢒰�踎撌脤�����");
    }
  });

  panelHideBtn.addEventListener("click", ()=>{
    mainPanel.classList.add("hidden");
    panelRestoreBtn.classList.remove("hidden");
    logSys("���� �𢒰�踎撌脫𤣰韏�");
  });

  panelRestoreBtn.addEventListener("click", ()=>{
    mainPanel.classList.remove("hidden");
    panelRestoreBtn.classList.add("hidden");
    logSys("���� �𢒰�踎撌脫�㯄��");
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
    const pool = assistantData.dialogues.idle || ["雿惩末"];
    addChat("�榀� " + pool[randi(0,pool.length-1)]);
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
    addChat("��𪈠 " + text);

    const t = text.toLowerCase();

    if(t.includes("撌⊿��")){
      addChat("�榀� 憟踝���烐�摰㗇�鍦極鈭箏楚�誯�睃�麄��");
      state.coins += 10;
    }else if(t.includes("�𤣰��")){
      addChat("�榀� 撌乩犖��见�𧢲𤣰��鞈��僐��");
      state.wood += 30;
      state.stone += 20;
      state.food += 20;
    }else if(t.includes("撱粹��")){
      addChat("�榀� 雿惩虾隞亙���𥕦遣蝭㗇芋撘𧶏���漤�鮋�睃�毺征�𧑐撱箇�剹��");
    }else if(t.includes("�����")){
      addChat("�榀� 雿惩虾隞亙���𥕦���𡁏芋撘𧶏���漤�𧼮遣蝭匧���𠾼��");
    }else if(t.includes("�䔄�𨺗") || t.includes("摮貊��")){
      doPronunciationMock();
    }else{
      addChat("�榀� ���誘�𤣰��嚗��𧊋靘�����惩�交凒憭𡁜𦶢隞扎��");
    }
  });

  // ============================
  // Build Buttons
  // ============================
  document.querySelectorAll(".buildBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const type = btn.dataset.build;
      state.selectedBuildType = type;
      logSys(`���梹�� 撌脤�豢��遣蝭㚁��${BUILD_INFO[type].emoji}${BUILD_INFO[type].name}嚗��钅�鮋�睃�毺征�𧑐嚗头);
    });
  });

  btnBuildMode.addEventListener("click", ()=>{
    state.buildMode = true;
    state.upgradeMode = false;
    logSys("���梹�� 撱箇�㗇芋撘� ON嚗��鮋�睃�毺征�𧑐嚗屸�蹱�羓Ⅱ隤㵪��");
  });

  btnCancelBuildMode.addEventListener("click", ()=>{
    state.buildMode = false;
    state.pendingBuildConfirm = null;
    logSys("���梹�� 撱箇�㗇芋撘� OFF");
  });

  btnUpgradeMode.addEventListener("click", ()=>{
    state.upgradeMode = true;
    state.buildMode = false;
    logSys("漎�儭� ����𡁏芋撘� ON嚗��𧼮遣蝭匧���𡄯��");
  });

  btnCancelUpgradeMode.addEventListener("click", ()=>{
    state.upgradeMode = false;
    logSys("漎�儭� ����𡁏芋撘� OFF");
  });

  // ============================
  // Robots
  // ============================
  btnRobotSend.addEventListener("click", sendRobot);
  btnRobotRecall.addEventListener("click", recallRobots);

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
      logSys("��𩤃�� ��穃馳銝滩雲嚗𣬚�⊥�閗眺��");
      return;
    }
    state.coins -= cost;
    state[item] += amt;
    logSys(`��𡖂 鞎瑕�交�𣂼����${item} +${amt}嚗��鞎駁�穃馳 ${cost}嚗头);
  });

  btnSell.addEventListener("click", ()=>{
    const item = marketItem.value;
    const amt = Math.max(1, parseInt(marketAmount.value||"1"));
    const rate = getRate(item);
    const gain = Math.floor(amt * rate * 0.7);

    if(state[item] < amt){
      logSys("��𩤃�� 鞈��𣂷�滩雲嚗𣬚�⊥�閗都�枂");
      return;
    }
    state[item] -= amt;
    state.coins += gain;
    logSys(`��𡖂 鞈�枂��𣂼����${item} -${amt}嚗�㬢敺烾�穃馳 ${gain}嚗头);
  });

  // ============================
  // Ads Song
  // ============================
  btnPlayAd.addEventListener("click", ()=>{
    playTrack();
  });

  btnLoopAd.addEventListener("click", ()=>{
    state.adLoop = !state.adLoop;
    btnLoopAd.textContent = state.adLoop ? "��� Loop: ON" : "��� Loop: OFF";
    logSys("��𦄡 Loop 閮剖�𡄯��" + (state.adLoop ? "ON" : "OFF"));
  });

  // ============================
  // Auto Build
  // ============================
  function updateAutoBtn(){
    btnAutoToggle.textContent = "�䌊��訫遣��: " + (state.autoBuild ? "ON" : "OFF");
  }

  btnAutoToggle.addEventListener("click", ()=>{
    state.autoBuild = !state.autoBuild;
    updateAutoBtn();
    logSys("�鴂� �䌊��訫遣�𩤃��" + (state.autoBuild ? "ON" : "OFF"));
  });

  btnAutoStopNow.addEventListener("click", ()=>{
    state.autoBuild = false;
    updateAutoBtn();
    logSys("���� 撌脣�𨀣迫�䌊��訫遣��");
  });

  document.querySelectorAll(".prioBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const key = btn.dataset.prio;
      state.autoPriorities[key] = !state.autoPriorities[key];
      btn.style.opacity = state.autoPriorities[key] ? "1" : "0.35";
      logSys(`�鴂� AI�芸����${key} = ${state.autoPriorities[key] ? "ON" : "OFF"}`);
    });
  });

  // ============================
  // Save / Reset
  // ============================
  btnSaveGame.addEventListener("click", saveGame);

  btnResetGame.addEventListener("click", ()=>{
    if(confirm("蝣箏�朞���滨蔭嚗�迨�焵摰嗥�����皜�蝛箝��")){
      const users = loadUsers();
      users[currentUser].save = makeNewState(currentUser, users[currentUser].planet);
      saveUsers(users);
      state = users[currentUser].save;
      terrain = genTerrain(currentUser, state.planet);
      logSys("���𡢅�� 撌脤�滨蔭�𦠜�");
    }
  });

  // ============================
  // Login / Register
  // ============================
  function register(){
    const u = loginUser.value.trim();
    const p = loginPass.value.trim();
    if(!u || !p){
      loginMsg.textContent = "��𩤃�� 隢贝撓�亦鍂����滚���蝣�";
      return;
    }

    const users = loadUsers();
    if(users[u]){
      loginMsg.textContent = "��𩤃�� �鍂��撌脣�睃銁";
      return;
    }

    users[u] = {
      password: p,
      planet: null,
      save: null
    };
    saveUsers(users);

    loginMsg.textContent = "�� 閮餃�𦠜�𣂼���諹�讠蒈��";
  }

  function login(){
    const u = loginUser.value.trim();
    const p = loginPass.value.trim();
    const users = loadUsers();

    if(!users[u] || users[u].password !== p){
      loginMsg.textContent = "��𩤃�� 撣唾���硋�蝣潮𥲤隤�";
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

  btnRegister.addEventListener("click", register);
  btnLogin.addEventListener("click", login);

  btnConfirmPlanet.addEventListener("click", ()=>{
    const planet = planetPicker.value;
    const users = loadUsers();

    // blackhole restriction (only developer name allow)
    if(planet==="blackhole" && currentUser.toLowerCase()!=="jade" && currentUser.toLowerCase()!=="peter"){
      alert("暺烐�𧼮迨撜嗅蘨��鞾�讠䔄��雿輻鍂��");
      return;
    }

    users[currentUser].planet = planet;
    users[currentUser].save = makeNewState(currentUser, planet);
    saveUsers(users);

    planetSelect.classList.add("hidden");
    startGame(currentUser);
  });

  // ============================
  // Start Game
  // ============================
  function applyOfflineProgress(){
    const t = nowSec();
    let diff = t - state.lastTickAt;
    if(diff < 0) diff = 0;

    const capped = Math.min(diff, OFFLINE_CAP_SECONDS);

    if(capped > 10){
      logSys(`�𢰧 �𣪧蝺𡁏𤣰��𠰴歇蝯鞟�梹��${Math.floor(capped/60)} ����矋���憭�24撠𤩺�嚗头);
    }

    // simulate offline
    simulate(capped);

    state.lastTickAt = t;
  }

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

    // assistant UI
    const assistantData = window.getAssistantForPlanet(state.planet);
    assistantName.textContent = assistantData.displayName;

    if(assistantData.species==="cat") assistantEmoji.textContent="��躼";
    else if(assistantData.species==="bear") assistantEmoji.textContent="��𣸮";
    else if(assistantData.species==="dolphin") assistantEmoji.textContent="��𨯬";
    else if(assistantData.species==="monkey") assistantEmoji.textContent="��閠";
    else if(assistantData.species==="dragon") assistantEmoji.textContent="����";
    else assistantEmoji.textContent="��𡉼";

    logSys("�� �𦠜���笔�閙�𣂼������𧋦 " + VERSION + "嚗�");
    logSys("���� ��毺�嚗�" + state.planet);

    // �𦠜���鈭见之蝬�
    logSys("��鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥��");
    logSys("���� AENO ��誩�鞉���𤾸�𥡝絲 ����");
    logSys("��鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥��");
    logSys("镼踹�� 2187 撟湛�䔶犖憿墧���𤾸歇�楲撅閗秐 20 �𧢲�毺���");
    logSys("AI �讛�䁅死�𡜐��葆��睃�鞉�烐䔝蝝ａ�瘝�...");
    logSys("��働 �𤌍璅辷�𡁏𤣰��鞈��僐��撱箄身��𤾸���閫��� AENO");
    logSys("���� 摮貊�坿�噼�/�偘�𦆮撱��� = �㬢敺� AENO 隞�馳");
    logSys("�黾 1 �𣶹撖行𠯫 = 10 �𦠜�撟湛�峕�梶�𦠜���梶䔄撅𤏪�");
    logSys("��鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥�鐥��");

    // 憿舐內��毺�摰�風��甇∟�舘�𦠜��
    const welcomeMessages = assistantData.dialogues?.idle || [];
    if(welcomeMessages.length > 0){
      logSys("����������������������");
      logSys(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]);
      logSys("����������������������");
    }

    loadAds();
    applyOfflineProgress();
    updateAutoBtn();
    updateHUD();
  }

  // ============================
  // Simulation
  // ============================
  function simulate(dtSec){
    if(dtSec <= 0) return;

    // time advance
    state.gameYear += dtSec * YEARS_PER_REAL_SECOND;

    // listening ad
    if(state.adSongPlaying){
      state.adSecondsListening += dtSec;
    }

    // production
    produceResources(dtSec);

    // robots
    processRobotMissions();

    // beast tide
    beastTick(dtSec);

    // AENO mint attempt
    tryMintAeno(dtSec);

    // AI auto build
    aiAutoBuild(dtSec);
  }

  // ============================
  // Main Loop
  // ============================
  let last = performance.now();

  function loop(ts){
    const dt = (ts - last) / 1000;
    last = ts;

    simulate(dt);

    render();
    updateHUD();

    // autosave every 30 seconds
    if(Math.random() < 0.01){
      saveGame();
    }

    requestAnimationFrame(loop);
  }

  // ============================
  // Boot Session Auto Login
  // ============================
  function boot(){
    resize();

    // 直接開始遊戲（略過登入）
    currentUser = "Player1";
    bootScreen.classList.add("hidden");

    // 直接創建新遊戲
    const users = loadUsers();
    users[currentUser] = { password: "temp", planet: "earth", save: null };
    saveUsers(users);

    startGame(currentUser);

    requestAnimationFrame(loop);
  }

  boot();

})();
