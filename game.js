// game.js
// AENO 3D漫畫版（完整可跑）
// 功能：登入註冊 / 選星球永久定居 / 3D地形 / 拖動縮放 / 建築 / 升級 / 交易 / 機器人探索 / 語言發音系統(模擬) / DNA變異 / 獸潮 / 音樂廣告獎勵 / autosave

(() => {
  "use strict";

  // ==========================
  // Utils
  // ==========================
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));

  function now() { return Date.now(); }

  function formatNum(n){
    if (n >= 1e9) return (n/1e9).toFixed(2)+"B";
    if (n >= 1e6) return (n/1e6).toFixed(2)+"M";
    if (n >= 1e3) return (n/1e3).toFixed(2)+"K";
    return Math.floor(n).toString();
  }

  function safeName(s){
    return (s||"").trim().replace(/[^a-zA-Z0-9_]/g,"").slice(0,18);
  }

  function logLine(msg){
    const box = $("sysLog");
    const t = new Date().toLocaleTimeString();
    box.innerHTML = `<div>【${t}】${msg}</div>` + box.innerHTML;
  }

  // ==========================
  // Boot UI
  // ==========================
  const bootFill = $("bootBarFill");
  const bootMsg = $("bootMsg");
  function bootProgress(p, msg){
    bootFill.style.width = `${clamp(p,0,100)}%`;
    if(msg) bootMsg.textContent = msg;
  }

  // ==========================
  // Game constants
  // ==========================
  const SAVE_KEY_PREFIX = "AENO_SAVE_USER_";
  const SESSION_KEY = "AENO_SESSION";

  const GAME_RULES = {
    // 現實 1日 = 遊戲10年（隱藏）
    yearsPerRealSecond: (10 / (24*60*60)), // 10 years per 86400 sec
    mutationEveryYears: 100,
    starting: {
      coins: 2000,
      wood: 800,
      stone: 800,
      iron: 800,
      food: 800,
      gem: 20,
      aeno: 0.0,
      pop: 12,
      robots: 1
    },
    autoBuildReserve: {
      coins: 500,
      wood: 200,
      stone: 200,
      iron: 100,
      food: 100
    }
  };

  // ==========================
  // Building definitions
  // ==========================
  const BUILDINGS = [
    {
      id:"hut",
      name:"🏠 木屋",
      desc:"增加人口上限 + 少量食物",
      cost:{ wood:80, stone:20, coins:60 },
      prod:{ food:0.15, pop:0.02 },
      maxLevel:20,
      model:"house"
    },
    {
      id:"farm",
      name:"🌾 農田",
      desc:"穩定生產糧食",
      cost:{ wood:50, stone:30, coins:50 },
      prod:{ food:0.40 },
      maxLevel:25,
      model:"farm"
    },
    {
      id:"lumber",
      name:"🪵 伐木場",
      desc:"生產木材",
      cost:{ wood:60, stone:40, coins:80 },
      prod:{ wood:0.35 },
      maxLevel:25,
      model:"lumber"
    },
    {
      id:"quarry",
      name:"🪨 採石場",
      desc:"生產石材",
      cost:{ wood:50, stone:70, coins:90 },
      prod:{ stone:0.30 },
      maxLevel:25,
      model:"quarry"
    },
    {
      id:"mine",
      name:"⛏️ 鐵礦場",
      desc:"生產鐵",
      cost:{ wood:80, stone:100, coins:120 },
      prod:{ iron:0.22 },
      maxLevel:25,
      model:"mine"
    },
    {
      id:"factory",
      name:"🏭 工廠",
      desc:"消耗石鐵→產出寶石(慢)",
      cost:{ wood:120, stone:150, iron:90, coins:220 },
      prod:{ gem:0.03 },
      consume:{ stone:0.10, iron:0.08 },
      maxLevel:15,
      model:"factory"
    },
    {
      id:"tower",
      name:"🛡️ 防禦塔",
      desc:"降低獸潮損失 + 增加掉落",
      cost:{ wood:60, stone:140, iron:60, coins:160 },
      prod:{ defense:0.25 },
      maxLevel:20,
      model:"tower"
    }
  ];

  const TECHS = [
    {
      id:"tech_robot1",
      name:"🤖 機器人引擎",
      desc:"探索速度提升 +10%",
      cost:{ coins:400, iron:200 },
      effect:(S)=>{ S.tech.robotSpeed = 1.10; }
    },
    {
      id:"tech_market1",
      name:"🏦 市場經濟",
      desc:"交易稅降低",
      cost:{ coins:600, stone:300 },
      effect:(S)=>{ S.tech.marketTax = 0.06; }
    },
    {
      id:"tech_defense1",
      name:"🛡️ 防禦研究",
      desc:"獸潮損失降低",
      cost:{ coins:700, iron:250, stone:250 },
      effect:(S)=>{ S.tech.defenseBonus = 0.15; }
    },
    {
      id:"tech_lang1",
      name:"🗣️ 語言模組",
      desc:"發音合格獎勵提高",
      cost:{ coins:500, food:400 },
      effect:(S)=>{ S.tech.langBonus = 0.15; }
    }
  ];

  // ==========================
  // State
  // ==========================
  let session = null;

  let S = null; // player state
  let selectedBuildingId = null;
  let selectedObject = null;

  let lastTickTime = now();
  let lastSaveTime = now();

  // market dynamic
  let marketBase = {
    wood: 2.0,
    stone: 2.2,
    iron: 3.0,
    food: 1.8,
    gem: 18.0
  };

  // ==========================
  // Three.js world
  // ==========================
  let renderer, scene, camera, controls;
  let worldGroup, groundMesh, waterMesh;
  let buildingGroup, decoGroup, animalGroup;

  let worldSeed = 12345;
  let show3D = true;

  // touch camera drag/zoom (fallback)
  let isDragging = false;
  let dragStart = {x:0,y:0};
  let camStart = {x:0,y:0,z:0};

  // ==========================
  // Init UI
  // ==========================
  function initUI(){
    // assistant
    $("assistantFace").textContent = window.AENO_CHARACTERS.mainAssistant.face;
    $("assistantName").textContent = window.AENO_CHARACTERS.mainAssistant.name;

    $("assistantTalkBtn").onclick = () => {
      $("chatBox").classList.remove("hidden");
    };
    $("chatClose").onclick = () => $("chatBox").classList.add("hidden");

    $("chatSend").onclick = () => {
      const text = $("chatInput").value.trim();
      $("chatInput").value = "";
      if(!text) return;
      chatSay("你", text);
      processChatCommand(text);
    };

    $("chatInput").addEventListener("keydown",(e)=>{
      if(e.key==="Enter") $("chatSend").click();
    });

    // tabs
    document.querySelectorAll(".tabBtn").forEach(btn=>{
      btn.onclick = ()=>{
        document.querySelectorAll(".tabBtn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        const id = btn.dataset.tab;
        document.querySelectorAll(".tabPage").forEach(p=>p.classList.remove("active"));
        $(id).classList.add("active");
      };
    });

    // panel drag move
    makeDraggablePanel();

    $("panelHideBtn").onclick = ()=>{
      $("mainPanel").classList.add("hidden");
      $("panelRestoreBtn").classList.remove("hidden");
    };

    $("panelRestoreBtn").onclick = ()=>{
      $("mainPanel").classList.remove("hidden");
      $("panelRestoreBtn").classList.add("hidden");
    };

    $("panelMinBtn").onclick = ()=>{
      const panel = $("mainPanel");
      if(panel.style.height === "70px"){
        panel.style.height = "560px";
      }else{
        panel.style.height = "70px";
      }
    };

    $("btnToggle3D").onclick = ()=>{
      show3D = !show3D;
      $("ui3dState").textContent = show3D ? "ON" : "OFF";
      if(renderer) renderer.domElement.style.display = show3D ? "block" : "none";
    };

    // home buttons
    $("btnSaveNow").onclick = ()=> saveGame(true);

    $("btnAutoBuild").onclick = ()=>{
      S.autoBuild = !S.autoBuild;
      $("uiAutoBuild").textContent = S.autoBuild ? "ON" : "OFF";
      logLine(`自動建造：${S.autoBuild ? "開啟" : "關閉"}`);
    };

    $("btnPlaySong").onclick = ()=> playSongReward();
    $("btnWatchAd").onclick = ()=> watchAdReward();

    $("btnBeastTest").onclick = ()=> triggerBeastWave(true);
    $("btnPronounceTest").onclick = ()=> startPronounceTest({
      item:"wood",
      fromPlanet: pickRandomPlanetExcept(S.planetId).id
    });

    // market
    $("btnBuy").onclick = ()=> marketBuySell("buy");
    $("btnSell").onclick = ()=> marketBuySell("sell");

    // robot
    $("btnMakeRobot").onclick = ()=> makeRobot();
    $("btnSendRobot").onclick = ()=> sendRobotExplore();

    // build
    $("btnUpgradeSelected").onclick = ()=> upgradeSelectedBuilding();
    $("btnRemoveSelected").onclick = ()=> removeSelectedBuilding();

    // language
    $("btnLangStart").onclick = ()=> startPronounceTestFromQueue();
    $("btnLangSkip").onclick = ()=> skipPronounceTest();

    // prevent UI causing accidental reload
    window.addEventListener("beforeunload", ()=> saveGame(false));
  }

  function chatSay(who, text){
    const log = $("chatLog");
    const line = document.createElement("div");
    line.style.marginBottom = "6px";
    line.innerHTML = `<b>${who}：</b> ${escapeHtml(text)}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, m => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      "\"":"&quot;",
      "'":"&#039;"
    }[m]));
  }

  function processChatCommand(text){
    const t = text.toLowerCase();
    if(t.includes("help") || t.includes("幫助")){
      chatSay("AENO", "你可以輸入：status / save / robot / market / year");
      return;
    }
    if(t==="status"){
      chatSay("AENO", `你有 ${formatNum(S.coins)} 金幣，AENO=${S.aeno.toFixed(4)}，寶石=${formatNum(S.gem)}。`);
      return;
    }
    if(t==="save"){
      saveGame(true);
      chatSay("AENO", "已保存。");
      return;
    }
    if(t==="robot"){
      chatSay("AENO", `你有 ${S.robots} 個機器人，其中探索中 ${S.exploring.length}。`);
      return;
    }
    if(t==="market"){
      chatSay("AENO", "交易所可買賣木石鐵糧寶石，價格會波動。");
      return;
    }
    if(t==="year"){
      chatSay("AENO", `目前年份：${Math.floor(S.year)}。`);
      return;
    }

    chatSay("AENO", "我收到啦～你可以問我：status / save / robot / market / year");
  }

  // ==========================
  // Login + Planet choose
  // ==========================
  function initLogin(){
    $("btnLogin").onclick = ()=>{
      const name = safeName($("loginName").value);
      const pass = ($("loginPass").value || "").trim();

      if(!name || name.length < 3){
        alert("名稱至少3個字母/數字");
        return;
      }
      if(!pass || pass.length < 2){
        alert("密碼太短");
        return;
      }

      const key = SAVE_KEY_PREFIX + name;
      const raw = localStorage.getItem(key);

      if(raw){
        // existing user
        const data = JSON.parse(raw);
        if(data.pass !== pass){
          alert("密碼錯誤");
          return;
        }
        session = { name, pass };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        loadGame(name);
        startGame();
      }else{
        // new user -> choose planet
        session = { name, pass };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        showPlanetChoose();
      }
    };

    $("btnGuest").onclick = ()=>{
      session = { name:"Guest"+randi(1000,9999), pass:"guest" };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      showPlanetChoose(true);
    };
  }

  function showPlanetChoose(isGuest=false){
    $("loginScreen").classList.add("hidden");
    $("planetScreen").classList.remove("hidden");

    const list = $("planetList");
    list.innerHTML = "";

    window.PLANET_DATA.forEach(p=>{
      const btn = document.createElement("button");
      btn.className = "planetBtn";
      btn.innerHTML = `${p.flag} ${p.name}<br/><span style="font-size:11px;opacity:.75;">${p.lang}</span>`;
      btn.onclick = ()=>{
        if(!confirm(`確定選擇【${p.name}】？\n（永久定居，不能更改）`)) return;

        createNewGame(session.name, session.pass, p.id);
        saveGame(true);

        $("planetScreen").classList.add("hidden");
        startGame();
      };
      list.appendChild(btn);
    });

    if(isGuest){
      logLine("訪客模式：資料只存在本機瀏覽器。");
    }
  }

  // ==========================
  // Create new game state
  // ==========================
  function createNewGame(name, pass, planetId){
    const seed = randi(100000,999999);

    S = {
      version: 1,
      name,
      pass,
      planetId,
      createdAt: now(),

      year: 0,
      lastRealTime: now(),
      lastMutationYear: 0,

      coins: GAME_RULES.starting.coins,
      wood: GAME_RULES.starting.wood,
      stone: GAME_RULES.starting.stone,
      iron: GAME_RULES.starting.iron,
      food: GAME_RULES.starting.food,
      gem: GAME_RULES.starting.gem,
      aeno: GAME_RULES.starting.aeno,
      shards: 0,

      pop: GAME_RULES.starting.pop,
      robots: GAME_RULES.starting.robots,

      exploring: [],

      autoBuild: true,

      tech: {
        robotSpeed: 1.0,
        marketTax: 0.10,
        defenseBonus: 0.0,
        langBonus: 0.0,
        unlocked: {}
      },

      // DNA mutation seeds
      dna: {
        seed,
        floraSeed: seed + 11,
        faunaSeed: seed + 22,
        buildSeed: seed + 33,
        terrainSeed: seed + 44
      },

      // building placed list
      buildings: [],

      // language queue
      pronounceQueue: [],

      // world camera
      cam: { x: 0, y: 30, z: 40 }
    };

    // initial settlement buildings
    placeBuildingAuto("hut", -6, 0);
    placeBuildingAuto("hut", -3, 0);
    placeBuildingAuto("farm", 3, 2);
    placeBuildingAuto("lumber", 6, -2);

    logLine(`玩家【${name}】創建成功，定居：${getPlanetById(planetId).name}`);
    logLine("初始資源已發放：每樣800 + 金幣2000。");
  }

  // ==========================
  // Load game
  // ==========================
  function loadGame(name){
    const key = SAVE_KEY_PREFIX + name;
    const raw = localStorage.getItem(key);
    if(!raw){
      alert("找不到存檔");
      return;
    }
    S = JSON.parse(raw);

    // upgrade safety
    if(!S.tech) S.tech = { robotSpeed:1, marketTax:0.10, defenseBonus:0, langBonus:0, unlocked:{} };
    if(!S.exploring) S.exploring = [];
    if(!S.buildings) S.buildings = [];
    if(!S.pronounceQueue) S.pronounceQueue = [];
    if(!S.cam) S.cam = { x:0, y:30, z:40 };

    logLine(`載入存檔成功：${S.name} @ ${getPlanetById(S.planetId).name}`);
  }

  // ==========================
  // Save
  // ==========================
  function saveGame(showToast){
    if(!S) return;

    S.lastRealTime = now();

    const key = SAVE_KEY_PREFIX + S.name;
    localStorage.setItem(key, JSON.stringify(S));

    if(showToast){
      logLine("💾 已保存遊戲。");
    }
  }

  // ==========================
  // Planet helpers
  // ==========================
  function getPlanetById(id){
    return window.PLANET_DATA.find(p=>p.id===id) || window.PLANET_DATA[0];
  }

  function pickRandomPlanetExcept(exceptId){
    const arr = window.PLANET_DATA.filter(p=>p.id!==exceptId);
    return arr[randi(0, arr.length-1)];
  }

  // ==========================
  // Three.js setup
  // ==========================
  function initThree(){
    const canvas = $("gameCanvas");

    renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xeaf6ff, 30, 160);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 400);
    camera.position.set(S.cam.x, S.cam.y, S.cam.z);

    // light
    const hemi = new THREE.HemisphereLight(0xffffff, 0x88aaff, 1.0);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(30, 60, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 200;
    scene.add(sun);

    // group
    worldGroup = new THREE.Group();
    scene.add(worldGroup);

    buildingGroup = new THREE.Group();
    decoGroup = new THREE.Group();
    animalGroup = new THREE.Group();

    worldGroup.add(decoGroup);
    worldGroup.add(buildingGroup);
    worldGroup.add(animalGroup);

    // controls
    if(THREE.OrbitControls){
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = true;
      controls.enableRotate = false;
      controls.minDistance = 15;
      controls.maxDistance = 120;
      controls.target.set(0,0,0);
      controls.update();
    }

    // terrain
    generateTerrain();

    // decor
    generateDecor();

    // animals
    spawnAnimals();

    // buildings
    rebuildBuildings3D();

    window.addEventListener("resize", ()=>{
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
    });

    // click pick buildings
    renderer.domElement.addEventListener("pointerdown", onWorldPointerDown);

    // fallback drag (if OrbitControls not working)
    renderer.domElement.addEventListener("pointerdown", (e)=>{
      if(controls) return;
      isDragging = true;
      dragStart.x = e.clientX;
      dragStart.y = e.clientY;
      camStart.x = camera.position.x;
      camStart.z = camera.position.z;
    });

    renderer.domElement.addEventListener("pointermove", (e)=>{
      if(controls) return;
      if(!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      camera.position.x = camStart.x - dx * 0.06;
      camera.position.z = camStart.z + dy * 0.06;
    });

    renderer.domElement.addEventListener("pointerup", ()=>{
      isDragging = false;
    });

    renderer.domElement.addEventListener("wheel",(e)=>{
      if(controls) return;
      camera.position.y = clamp(camera.position.y + e.deltaY*0.02, 12, 90);
    }, { passive:true });

    // touch pinch zoom fallback
    let lastDist = 0;
    renderer.domElement.addEventListener("touchmove",(e)=>{
      if(controls) return;
      if(e.touches.length === 2){
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if(lastDist>0){
          const diff = dist - lastDist;
          camera.position.y = clamp(camera.position.y - diff*0.03, 12, 90);
        }
        lastDist = dist;
      }
    }, { passive:true });

    renderer.domElement.addEventListener("touchend",()=>{
      lastDist = 0;
    });

    // show3D
    $("ui3dState").textContent = show3D ? "ON" : "OFF";
  }

  function generateTerrain(){
    if(groundMesh) worldGroup.remove(groundMesh);
    if(waterMesh) worldGroup.remove(waterMesh);

    const size = 120;
    const seg = 70;

    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI/2);

    // apply height map using seed
    const pos = geo.attributes.position;
    const seed = S.dna.terrainSeed + Math.floor(S.year/100);

    for(let i=0;i<pos.count;i++){
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = terrainNoise(x, z, seed);
      pos.setY(i, h);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x8de3b6,
      roughness: 0.9,
      metalness: 0.0
    });

    groundMesh = new THREE.Mesh(geo, mat);
    groundMesh.receiveShadow = true;
    worldGroup.add(groundMesh);

    // water plane
    const wGeo = new THREE.PlaneGeometry(size, size, 1, 1);
    wGeo.rotateX(-Math.PI/2);
    const wMat = new THREE.MeshStandardMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.0
    });
    waterMesh = new THREE.Mesh(wGeo, wMat);
    waterMesh.position.y = -0.8;
    worldGroup.add(waterMesh);
  }

  function terrainNoise(x,z,seed){
    // cartoon noise (cheap deterministic)
    const v = Math.sin((x*0.12 + seed)*0.9) + Math.cos((z*0.13 + seed)*0.8);
    const v2 = Math.sin((x*0.05 + z*0.08 + seed)*1.2);
    const h = (v*1.2 + v2*2.0);
    const hill = Math.max(0, h);
    return hill * 1.2;
  }

  function clearGroup(g){
    while(g.children.length){
      const c = g.children.pop();
      c.geometry && c.geometry.dispose && c.geometry.dispose();
      c.material && c.material.dispose && c.material.dispose();
    }
  }

  function generateDecor(){
    clearGroup(decoGroup);

    // trees / rocks / mines
    const floraSeed = S.dna.floraSeed + Math.floor(S.year/100);
    const faunaSeed = S.dna.faunaSeed + Math.floor(S.year/100);

    for(let i=0;i<80;i++){
      const x = rand(-45,45);
      const z = rand(-45,45);
      const y = sampleHeight(x,z);

      if(y < -0.4) continue;

      const n = Math.sin((x+floraSeed)*0.3) + Math.cos((z+floraSeed)*0.25);

      if(n > 0.8){
        decoGroup.add(makeTree(x,y,z, floraSeed));
      }else if(n < -0.6){
        decoGroup.add(makeRock(x,y,z, faunaSeed));
      }else if(n > 0.3 && Math.random()<0.08){
        decoGroup.add(makeOre(x,y,z));
      }
    }

    // river strip (fake)
    const riverGeo = new THREE.BoxGeometry(80, 0.15, 6);
    const riverMat = new THREE.MeshStandardMaterial({ color:0x55bbff, transparent:true, opacity:0.65 });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.position.set(0, -0.3, 10);
    river.receiveShadow = true;
    decoGroup.add(river);

    // territory shadow
    const shadowGeo = new THREE.RingGeometry(14, 60, 64);
    const shadowMat = new THREE.MeshBasicMaterial({
      color:0x000000,
      transparent:true,
      opacity:0.28,
      side:THREE.DoubleSide
    });
    const ring = new THREE.Mesh(shadowGeo, shadowMat);
    ring.rotation.x = -Math.PI/2;
    ring.position.y = -0.25;
    decoGroup.add(ring);
  }

  function makeTree(x,y,z,seed){
    const trunkGeo = new THREE.CylinderGeometry(0.25,0.35,2.2,6);
    const trunkMat = new THREE.MeshStandardMaterial({ color:0x8b5a2b, roughness:0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.castShadow = true;

    const crownGeo = new THREE.SphereGeometry(1.3, 8, 8);
    const crownMat = new THREE.MeshStandardMaterial({ color:0x22c55e, roughness:0.8 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 1.6;
    crown.castShadow = true;

    const g = new THREE.Group();
    g.add(trunk);
    g.add(crown);
    g.position.set(x,y,z);

    const s = 0.7 + (Math.sin((x+z+seed)*0.2)*0.15);
    g.scale.set(s,s,s);

    return g;
  }

  function makeRock(x,y,z,seed){
    const geo = new THREE.DodecahedronGeometry(0.9, 0);
    const mat = new THREE.MeshStandardMaterial({ color:0x94a3b8, roughness:1.0 });
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.position.set(x,y+0.4,z);
    m.rotation.y = Math.sin((x+seed)*0.2);
    return m;
  }

  function makeOre(x,y,z){
    const g = new THREE.Group();

    const baseGeo = new THREE.BoxGeometry(1.0,0.8,1.0);
    const baseMat = new THREE.MeshStandardMaterial({ color:0x64748b, roughness:0.9 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.castShadow = true;
    g.add(base);

    const gemGeo = new THREE.OctahedronGeometry(0.45, 0);
    const gemMat = new THREE.MeshStandardMaterial({ color:0xfbbf24, roughness:0.2, metalness:0.3 });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.y = 0.8;
    gem.castShadow = true;
    g.add(gem);

    g.position.set(x,y+0.4,z);
    return g;
  }

  function spawnAnimals(){
    clearGroup(animalGroup);

    for(let i=0;i<10;i++){
      const x = rand(-18,18);
      const z = rand(-18,18);
      const y = sampleHeight(x,z);
      if(y < -0.2) continue;

      const a = makeCartoonAnimal(i);
      a.position.set(x,y+0.2,z);
      animalGroup.add(a);
    }
  }

  function makeCartoonAnimal(i){
    // cute animal: body + head + ears
    const g = new THREE.Group();

    const bodyGeo = new THREE.SphereGeometry(0.9, 12, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness:0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.scale.set(1.2,0.9,1.0);
    g.add(body);

    const headGeo = new THREE.SphereGeometry(0.65, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfff1c7, roughness:0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0,0.8,0.8);
    head.castShadow = true;
    g.add(head);

    const earGeo = new THREE.ConeGeometry(0.18,0.5,8);
    const earMat = new THREE.MeshStandardMaterial({ color:0xffd4d4, roughness:0.8 });

    const ear1 = new THREE.Mesh(earGeo, earMat);
    ear1.position.set(0.25,1.35,0.85);
    ear1.rotation.x = Math.PI*0.05;
    ear1.castShadow = true;

    const ear2 = ear1.clone();
    ear2.position.x = -0.25;

    g.add(ear1);
    g.add(ear2);

    g.userData = { type:"animal", id:i, t:Math.random()*10 };

    return g;
  }

  function sampleHeight(x,z){
    // approximate terrain height by using same noise function
    return terrainNoise(x,z,S.dna.terrainSeed + Math.floor(S.year/100));
  }

  // ==========================
  // Building 3D models
  // ==========================
  function rebuildBuildings3D(){
    clearGroup(buildingGroup);

    S.buildings.forEach(b=>{
      const obj = makeBuildingModel(b);
      obj.position.set(b.x, sampleHeight(b.x,b.z)+0.05, b.z);
      obj.userData.buildingId = b.uid;
      buildingGroup.add(obj);
    });
  }

  function makeBuildingModel(b){
    const def = BUILDINGS.find(x=>x.id===b.type);
    const lv = b.level || 1;

    const g = new THREE.Group();

    // base
    const baseGeo = new THREE.CylinderGeometry(1.2,1.5,0.5,8);
    const baseMat = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.9 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);

    if(def.model === "house"){
      const boxGeo = new THREE.BoxGeometry(2.0,1.4,2.0);
      const boxMat = new THREE.MeshStandardMaterial({ color:0xfef3c7, roughness:0.85 });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = 1.0;
      box.castShadow = true;
      g.add(box);

      const roofGeo = new THREE.ConeGeometry(1.6,1.0,4);
      const roofMat = new THREE.MeshStandardMaterial({ color:0xf97316, roughness:0.8 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 2.2;
      roof.rotation.y = Math.PI/4;
      roof.castShadow = true;
      g.add(roof);
    }

    if(def.model === "farm"){
      const fieldGeo = new THREE.BoxGeometry(2.8,0.3,2.8);
      const fieldMat = new THREE.MeshStandardMaterial({ color:0x86efac, roughness:0.95 });
      const field = new THREE.Mesh(fieldGeo, fieldMat);
      field.position.y = 0.5;
      field.castShadow = true;
      g.add(field);

      const plantGeo = new THREE.CylinderGeometry(0.1,0.1,1.0,6);
      const plantMat = new THREE.MeshStandardMaterial({ color:0x22c55e, roughness:0.8 });
      for(let i=0;i<8;i++){
        const p = new THREE.Mesh(plantGeo, plantMat);
        p.position.set(rand(-1.1,1.1), 1.1, rand(-1.1,1.1));
        p.castShadow = true;
        g.add(p);
      }
    }

    if(def.model === "lumber"){
      const hutGeo = new THREE.BoxGeometry(2.2,1.2,2.2);
      const hutMat = new THREE.MeshStandardMaterial({ color:0xfef9c3, roughness:0.9 });
      const hut = new THREE.Mesh(hutGeo, hutMat);
      hut.position.y = 0.9;
      hut.castShadow = true;
      g.add(hut);

      const logGeo = new THREE.CylinderGeometry(0.2,0.2,2.0,8);
      const logMat = new THREE.MeshStandardMaterial({ color:0x8b5a2b, roughness:0.95 });
      const log = new THREE.Mesh(logGeo, logMat);
      log.rotation.z = Math.PI/2;
      log.position.set(0,0.7,1.4);
      log.castShadow = true;
      g.add(log);
    }

    if(def.model === "quarry"){
      const pitGeo = new THREE.BoxGeometry(2.6,0.8,2.6);
      const pitMat = new THREE.MeshStandardMaterial({ color:0x94a3b8, roughness:0.95 });
      const pit = new THREE.Mesh(pitGeo, pitMat);
      pit.position.y = 0.7;
      pit.castShadow = true;
      g.add(pit);
    }

    if(def.model === "mine"){
      const mGeo = new THREE.BoxGeometry(2.4,1.0,2.4);
      const mMat = new THREE.MeshStandardMaterial({ color:0xcbd5e1, roughness:0.9 });
      const m = new THREE.Mesh(mGeo, mMat);
      m.position.y = 0.8;
      m.castShadow = true;
      g.add(m);

      const oreGeo = new THREE.OctahedronGeometry(0.55, 0);
      const oreMat = new THREE.MeshStandardMaterial({ color:0x60a5fa, roughness:0.2, metalness:0.2 });
      const ore = new THREE.Mesh(oreGeo, oreMat);
      ore.position.set(0,1.4,0);
      ore.castShadow = true;
      g.add(ore);
    }

    if(def.model === "factory"){
      const boxGeo = new THREE.BoxGeometry(2.8,2.0,2.0);
      const boxMat = new THREE.MeshStandardMaterial({ color:0xa7f3d0, roughness:0.8 });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = 1.3;
      box.castShadow = true;
      g.add(box);

      const chimGeo = new THREE.CylinderGeometry(0.25,0.35,2.2,8);
      const chimMat = new THREE.MeshStandardMaterial({ color:0x334155, roughness:0.9 });
      const chim = new THREE.Mesh(chimGeo, chimMat);
      chim.position.set(0.9,2.2,0.0);
      chim.castShadow = true;
      g.add(chim);
    }

    if(def.model === "tower"){
      const tGeo = new THREE.CylinderGeometry(0.7,1.0,3.2,10);
      const tMat = new THREE.MeshStandardMaterial({ color:0xfde68a, roughness:0.9 });
      const t = new THREE.Mesh(tGeo, tMat);
      t.position.y = 1.8;
      t.castShadow = true;
      g.add(t);

      const headGeo = new THREE.ConeGeometry(1.1,1.2,8);
      const headMat = new THREE.MeshStandardMaterial({ color:0xef4444, roughness:0.85 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 3.6;
      head.castShadow = true;
      g.add(head);
    }

    // level scaling
    const scale = 1 + (lv-1)*0.04;
    g.scale.set(scale, scale, scale);

    // label marker (small sphere)
    const markGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const markMat = new THREE.MeshStandardMaterial({ color:0x38bdf8 });
    const mark = new THREE.Mesh(markGeo, markMat);
    mark.position.y = 4.0;
    g.add(mark);

    g.userData = { type:"building", uid:b.uid };

    return g;
  }

  // ==========================
  // Building placement
  // ==========================
  function placeBuildingAuto(type, x, z){
    const uid = "b"+randi(100000,999999)+"_"+now();
    S.buildings.push({
      uid,
      type,
      x,
      z,
      level: 1
    });
  }

  function canAfford(cost){
    for(const k in cost){
      if(S[k] === undefined) continue;
      if(S[k] < cost[k]) return false;
    }
    return true;
  }

  function payCost(cost){
    for(const k in cost){
      if(S[k] === undefined) continue;
      S[k] -= cost[k];
    }
  }

  function addResource(obj){
    for(const k in obj){
      if(S[k] === undefined) continue;
      S[k] += obj[k];
    }
  }

  function buildUIList(){
    const box = $("buildList");
    box.innerHTML = "";

    BUILDINGS.forEach(b=>{
      const btn = document.createElement("button");
      btn.innerHTML = `${b.name}<br/><span style="font-size:11px;opacity:.75;">${b.desc}</span>`;
      btn.onclick = ()=>{
        selectedBuildingId = b.id;
        logLine(`已選擇建築：${b.name}`);
      };
      box.appendChild(btn);
    });
  }

  function buildTechList(){
    const box = $("techList");
    box.innerHTML = "";

    TECHS.forEach(t=>{
      const btn = document.createElement("button");
      const ok = !!S.tech.unlocked[t.id];
      btn.innerHTML = ok
        ? `✅ ${t.name}<br/><span style="font-size:11px;opacity:.7;">已解鎖</span>`
        : `${t.name}<br/><span style="font-size:11px;opacity:.7;">${t.desc}</span>`;

      btn.onclick = ()=>{
        if(S.tech.unlocked[t.id]){
          logLine(`科技已解鎖：${t.name}`);
          return;
        }
        if(!canAfford(t.cost)){
          alert("資源不足");
          return;
        }
        payCost(t.cost);
        S.tech.unlocked[t.id] = true;
        t.effect(S);
        logLine(`🧬 科技解鎖：${t.name}`);
        buildTechList();
      };

      box.appendChild(btn);
    });
  }

  // ==========================
  // World click picking
  // ==========================
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onWorldPointerDown(e){
    // prevent clicking through UI
    const uiRoot = $("uiRoot");
    const rect = uiRoot.getBoundingClientRect();
    if(e.clientX >= rect.left && e.clientY >= rect.top){
      // ok
    }

    const canvas = renderer.domElement;
    const r = canvas.getBoundingClientRect();

    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // check building click
    const intersects = raycaster.intersectObjects(buildingGroup.children, true);

    if(intersects.length > 0){
      let obj = intersects[0].object;
      while(obj && !obj.userData.uid && obj.parent) obj = obj.parent;

      if(obj && obj.userData.uid){
        selectedObject = obj;
        const uid = obj.userData.uid;
        const b = S.buildings.find(x=>x.uid===uid);
        if(b){
          const def = BUILDINGS.find(x=>x.id===b.type);
          logLine(`選中建築：${def.name} Lv.${b.level}`);
        }
        return;
      }
    }

    // build placement on ground
    if(selectedBuildingId){
      const groundHits = raycaster.intersectObject(groundMesh);
      if(groundHits.length > 0){
        const p = groundHits[0].point;

        // territory radius check (player territory inside 14)
        const dist = Math.sqrt(p.x*p.x + p.z*p.z);
        if(dist > 14){
          logLine("❌ 這裡不是你的領土（黑影外區）。");
          return;
        }

        placeBuildingAt(selectedBuildingId, p.x, p.z);
        selectedBuildingId = null;
      }
    }
  }

  function placeBuildingAt(type, x, z){
    const def = BUILDINGS.find(b=>b.id===type);
    if(!def) return;

    if(!canAfford(def.cost)){
      alert("資源不足，無法建造");
      return;
    }

    payCost(def.cost);

    const uid = "b"+randi(100000,999999)+"_"+now();
    const b = { uid, type, x, z, level:1 };
    S.buildings.push(b);

    const obj = makeBuildingModel(b);
    obj.position.set(x, sampleHeight(x,z)+0.05, z);
    buildingGroup.add(obj);

    logLine(`🏗️ 建造成功：${def.name}`);
  }

  function upgradeSelectedBuilding(){
    if(!selectedObject){
      alert("請先點選建築");
      return;
    }

    const uid = selectedObject.userData.uid;
    const b = S.buildings.find(x=>x.uid===uid);
    if(!b) return;

    const def = BUILDINGS.find(x=>x.id===b.type);
    if(!def) return;

    if(b.level >= def.maxLevel){
      alert("已達最高等級");
      return;
    }

    // upgrade cost grows
    const mul = 1 + (b.level*0.35);
    const cost = {};
    for(const k in def.cost){
      cost[k] = Math.floor(def.cost[k] * mul);
    }

    if(!canAfford(cost)){
      alert("資源不足，無法升級");
      return;
    }

    payCost(cost);
    b.level++;

    rebuildBuildings3D();
    logLine(`⬆️ 升級成功：${def.name} Lv.${b.level}`);
  }

  function removeSelectedBuilding(){
    if(!selectedObject){
      alert("請先點選建築");
      return;
    }

    const uid = selectedObject.userData.uid;
    const idx = S.buildings.findIndex(x=>x.uid===uid);
    if(idx<0) return;

    S.buildings.splice(idx,1);
    rebuildBuildings3D();
    selectedObject = null;

    logLine("🧨 已拆除建築。");
  }

  // ==========================
  // Production tick
  // ==========================
  function computeProduction(dt){
    // dt in seconds
    let prod = { wood:0, stone:0, iron:0, food:0, gem:0, pop:0, defense:0 };
    let consume = { stone:0, iron:0 };

    S.buildings.forEach(b=>{
      const def = BUILDINGS.find(x=>x.id===b.type);
      if(!def) return;

      const lv = b.level || 1;
      const scale = 1 + (lv-1)*0.22;

      if(def.prod){
        for(const k in def.prod){
          prod[k] += def.prod[k] * scale;
        }
      }

      if(def.consume){
        for(const k in def.consume){
          consume[k] += def.consume[k] * scale;
        }
      }
    });

    // apply consume (cannot go negative)
    for(const k in consume){
      const need = consume[k] * dt;
      if(S[k] < need){
        // factory stalls if not enough
        if(k==="stone" || k==="iron"){
          // reduce gem output proportionally
          const ratio = S[k] / need;
          prod.gem *= ratio;
          consume.stone *= ratio;
          consume.iron *= ratio;
        }
      }
    }

    // apply
    S.wood += prod.wood * dt;
    S.stone += prod.stone * dt;
    S.iron += prod.iron * dt;
    S.food += prod.food * dt;

    // gem limited daily-ish (soft cap)
    S.gem += prod.gem * dt;
    S.gem = Math.min(S.gem, 2000);

    // consume
    S.stone = Math.max(0, S.stone - consume.stone*dt);
    S.iron = Math.max(0, S.iron - consume.iron*dt);

    // population
    S.pop += prod.pop * dt;
    S.pop = Math.min(S.pop, 999999);

    // passive coins from pop
    S.coins += (0.06 + S.pop*0.001) * dt;

    // clamp
    S.wood = Math.min(S.wood, 5000000);
    S.stone = Math.min(S.stone, 5000000);
    S.iron = Math.min(S.iron, 5000000);
    S.food = Math.min(S.food, 5000000);
    S.coins = Math.min(S.coins, 20000000);

    // defense value store (for beast wave)
    S.defensePower = prod.defense;
  }

  // ==========================
  // Time system
  // ==========================
  function updateTime(dt){
    // dt seconds real
    const yearsAdd = dt * GAME_RULES.yearsPerRealSecond;
    S.year += yearsAdd;

    // mutation check
    if(Math.floor(S.year / GAME_RULES.mutationEveryYears) > Math.floor(S.lastMutationYear / GAME_RULES.mutationEveryYears)){
      triggerMutation();
      S.lastMutationYear = S.year;
    }
  }

  function triggerMutation(){
    // AI brain mutation tick
    S.dna.floraSeed += randi(5, 50);
    S.dna.faunaSeed += randi(5, 50);
    S.dna.buildSeed += randi(5, 50);
    S.dna.terrainSeed += randi(5, 50);

    logLine("🧬 DNA變異發生：植物/動物/建築風格已進化！");
    chatSay("AENO", "🧬 DNA變異已觸發！星球外觀開始改變～");

    // regenerate terrain/decor/animals
    generateTerrain();
    generateDecor();
    spawnAnimals();
    rebuildBuildings3D();

    // market drift
    driftMarket();
  }

  // ==========================
  // Market
  // ==========================
  function driftMarket(){
    Object.keys(marketBase).forEach(k=>{
      marketBase[k] *= rand(0.90, 1.12);
      marketBase[k] = clamp(marketBase[k], 0.5, 50);
    });
    logLine("📈 市場波動：價格已更新。");
  }

  function getMarketPrice(item){
    const base = marketBase[item] || 2;
    const chaos = Math.sin((S.year + item.length)*0.3) * 0.25;
    return Math.max(0.2, base * (1 + chaos));
  }

  function refreshMarketUI(){
    const items = ["wood","stone","iron","food","gem"];
    let html = "";
    items.forEach(it=>{
      html += `【${it}】= ${getMarketPrice(it).toFixed(2)} 金幣/單位<br/>`;
    });
    html += `<br/>交易稅：${Math.floor(S.tech.marketTax*100)}%`;
    $("marketPriceBox").innerHTML = html;
  }

  function marketBuySell(mode){
    const item = $("marketItem").value;
    const amt = Math.max(1, parseInt($("marketAmount").value||"1"));
    const price = getMarketPrice(item);
    const tax = S.tech.marketTax;

    if(mode==="buy"){
      const cost = amt * price * (1+tax);
      if(S.coins < cost){
        alert("金幣不足");
        return;
      }
      S.coins -= cost;
      S[item] += amt;
      logLine(`🟢 買入 ${amt} ${item}，花費 ${cost.toFixed(0)} 金幣`);
    }else{
      if(S[item] < amt){
        alert("資源不足");
        return;
      }
      const gain = amt * price * (1-tax);
      S[item] -= amt;
      S.coins += gain;
      logLine(`🔴 賣出 ${amt} ${item}，獲得 ${gain.toFixed(0)} 金幣`);
    }

    refreshMarketUI();
  }

  // ==========================
  // Robot system
  // ==========================
  function makeRobot(){
    const cost = { coins: 500, iron: 120, gem: 4 };
    if(!canAfford(cost)){
      alert("資源不足，無法製造機器人");
      return;
    }
    payCost(cost);
    S.robots++;
    logLine("🤖 製造成功：機器人 +1");
  }

  function sendRobotExplore(){
    if(S.exploring.length >= S.robots){
      alert("沒有空閒機器人");
      return;
    }

    const p = pickRandomPlanetExcept(S.planetId);

    const time = Math.floor(rand(20, 50) / S.tech.robotSpeed); // seconds
    const job = {
      id: "exp_"+now()+"_"+randi(100,999),
      planetId: p.id,
      start: now(),
      end: now() + time*1000
    };

    S.exploring.push(job);
    logLine(`🚀 機器人已出發 → ${p.name} (${p.lang})，預計 ${time}s 回來`);
    updateRobotStatus();
  }

  function updateRobotStatus(){
    $("uiExploring").textContent = S.exploring.length;
  }

  function robotTick(){
    const t = now();
    const done = S.exploring.filter(j=>t >= j.end);
    if(done.length===0) return;

    S.exploring = S.exploring.filter(j=>t < j.end);

    done.forEach(j=>{
      const planet = getPlanetById(j.planetId);

      // random resource
      const items = ["wood","stone","iron","food","gem"];
      const item = items[randi(0, items.length-1)];
      const amount = randi(30, 120);

      S[item] += amount;

      logLine(`🤖 探索完成：${planet.name} 帶回 ${amount} ${item}`);

      // add pronounce task
      S.pronounceQueue.push({
        item,
        fromPlanet: planet.id
      });

      $("langBox").innerHTML = `🎁 新任務：讀出「${item}」的 ${planet.lang} 名稱。<br/>按「開始測試」即可。`;
    });

    updateRobotStatus();
  }

  // ==========================
  // Pronunciation system (simulation)
  // ==========================
  let activePronounce = null;

  function startPronounceTestFromQueue(){
    if(activePronounce){
      alert("已有測試進行中");
      return;
    }
    if(S.pronounceQueue.length === 0){
      alert("暫無語言任務，派機器人探索先。");
      return;
    }
    const task = S.pronounceQueue.shift();
    startPronounceTest(task);
  }

  function startPronounceTest(task){
    activePronounce = task;

    const planet = getPlanetById(task.fromPlanet);
    const wordMap = window.LANGUAGE_WORDS[task.item] || {};
    const langWord = wordMap[planet.langCode] || wordMap["en"] || task.item;

    const msg =
      `🗣️ Proof of Pronunciation\n\n`+
      `星球：${planet.name} ${planet.flag}\n`+
      `語言：${planet.lang}\n\n`+
      `請讀出：${langWord}\n\n`+
      `（暫時用隨機評分模擬，之後會加 STT）`;

    alert(msg);

    // simulate score
    const score = randi(10, 95);
    const pass = score >= 40;

    let shardGain = pass ? randi(2,6) : randi(0,2);
    shardGain += Math.floor(shardGain * S.tech.langBonus);

    S.shards += shardGain;

    // AENO chance
    let aenoChance = pass ? (0.04 + score/2000) : 0.01;
    aenoChance += S.tech.langBonus;

    if(Math.random() < aenoChance){
      const aenoGain = (0.0008 + score/200000);
      S.aeno += aenoGain;
      logLine(`🟡 發音成功(${score}%)：掉落 AENO +${aenoGain.toFixed(4)}`);
    }

    logLine(`🗣️ 發音評分：${score}% → ${pass ? "合格" : "不合格"}，碎片 +${shardGain}`);

    $("langBox").innerHTML =
      `星球：${planet.name} ${planet.flag}<br/>`+
      `資源：${task.item}<br/>`+
      `分數：${score}% (${pass ? "合格" : "不合格"})<br/>`+
      `碎片：+${shardGain}<br/>`+
      `（分數越高越容易掉 AENO）`;

    activePronounce = null;
  }

  function skipPronounceTest(){
    if(S.pronounceQueue.length>0){
      const task = S.pronounceQueue.shift();
      logLine(`⏭️ 已跳過語言任務：${task.item}`);
    }else{
      logLine("⏭️ 沒有可跳過的語言任務。");
    }
  }

  // ==========================
  // Ads + Song reward
  // ==========================
  let adsData = null;

  async function loadAds(){
    try{
      const res = await fetch("ads.json");
      adsData = await res.json();
    }catch(e){
      adsData = { songs:[], ads:[] };
    }
  }

  function playSongReward(){
    if(!adsData || !adsData.songs || adsData.songs.length===0){
      alert("找不到歌曲資料，請確認 assets/song1.mp3 等存在");
      return;
    }

    const song = adsData.songs[randi(0, adsData.songs.length-1)];
    const player = $("songPlayer");

    player.src = song.file;
    player.volume = 0.75;
    player.play().catch(()=>{});

    const coins = song.rewardCoins || 50;
    const shard = song.rewardShard || 3;

    S.coins += coins;
    S.shards += shard;

    // chance aeno
    if(Math.random() < 0.05){
      const g = 0.0012;
      S.aeno += g;
      logLine(`🎵 播放歌曲：${song.title} → 金幣+${coins} 碎片+${shard} AENO+${g.toFixed(4)}`);
    }else{
      logLine(`🎵 播放歌曲：${song.title} → 金幣+${coins} 碎片+${shard}`);
    }

    $("assistantAdFlag").classList.remove("hidden");
    setTimeout(()=> $("assistantAdFlag").classList.add("hidden"), 1500);
  }

  function watchAdReward(){
    if(!adsData || !adsData.ads || adsData.ads.length===0){
      alert("ads.json 沒有廣告資料");
      return;
    }

    const ad = adsData.ads[randi(0, adsData.ads.length-1)];
    alert(`📺 ${ad.title}\n\n（模擬廣告播放 3 秒）`);

    const coins = ad.rewardCoins || 120;
    const shard = ad.rewardShard || 8;

    S.coins += coins;
    S.shards += shard;

    // aeno chance higher
    if(Math.random() < 0.10){
      const g = 0.0020;
      S.aeno += g;
      logLine(`📺 廣告獎勵：${ad.title} → 金幣+${coins} 碎片+${shard} AENO+${g.toFixed(4)}`);
    }else{
      logLine(`📺 廣告獎勵：${ad.title} → 金幣+${coins} 碎片+${shard}`);
    }

    $("assistantAdFlag").classList.remove("hidden");
    setTimeout(()=> $("assistantAdFlag").classList.add("hidden"), 1500);
  }

  // ==========================
  // Beast wave
  // ==========================
  function triggerBeastWave(force=false){
    // calculate wave strength
    const wave = Math.floor(S.year/50) + 1;
    const baseLoss = wave * 40;

    const towerDefense = S.defensePower || 0;
    const techDef = S.tech.defenseBonus || 0;

    const reduce = clamp(towerDefense*0.15 + techDef, 0, 0.7);
    const loss = Math.floor(baseLoss * (1-reduce));

    // apply loss
    S.food = Math.max(0, S.food - loss);
    S.wood = Math.max(0, S.wood - Math.floor(loss*0.6));

    // reward shards
    let shardGain = Math.floor(wave*6 * (1 + towerDefense*0.2));
    shardGain = Math.min(shardGain, 200);

    S.shards += shardGain;

    // aeno chance
    if(Math.random() < 0.12){
      const g = 0.002 + wave/10000;
      S.aeno += g;
      logLine(`🐺 獸潮襲擊！損失糧-${loss} 木-${Math.floor(loss*0.6)} 碎片+${shardGain} AENO+${g.toFixed(4)}`);
    }else{
      logLine(`🐺 獸潮襲擊！損失糧-${loss} 木-${Math.floor(loss*0.6)} 碎片+${shardGain}`);
    }

    chatSay("AENO", "🐺 獸潮來襲！記得建防禦塔！");
  }

  // ==========================
  // Auto build AI
  // ==========================
  function autoBuildTick(){
    if(!S.autoBuild) return;

    // do not spam build too often
    if(Math.random() > 0.02) return;

    // keep reserves
    const R = GAME_RULES.autoBuildReserve;
    if(S.coins < R.coins) return;
    if(S.wood < R.wood) return;
    if(S.stone < R.stone) return;

    // choose building based on need
    let choice = "farm";
    if(S.food < 400) choice = "farm";
    else if(S.wood < 400) choice = "lumber";
    else if(S.stone < 400) choice = "quarry";
    else if(S.iron < 300) choice = "mine";
    else if(S.gem < 60) choice = "factory";
    else choice = (Math.random()<0.5) ? "hut" : "tower";

    const def = BUILDINGS.find(x=>x.id===choice);
    if(!def) return;

    if(!canAfford(def.cost)) return;

    // random position in territory
    const angle = rand(0, Math.PI*2);
    const radius = rand(2, 13);
    const x = Math.cos(angle)*radius;
    const z = Math.sin(angle)*radius;

    placeBuildingAt(choice, x, z);
  }

  // ==========================
  // Panel draggable
  // ==========================
  function makeDraggablePanel(){
    const panel = $("mainPanel");
    const header = $("panelHeader");

    let dragging = false;
    let sx=0, sy=0;
    let px=0, py=0;

    header.addEventListener("pointerdown",(e)=>{
      dragging = true;
      header.setPointerCapture(e.pointerId);
      sx = e.clientX;
      sy = e.clientY;

      const rect = panel.getBoundingClientRect();
      px = rect.left;
      py = rect.top;

      header.style.cursor = "grabbing";
    });

    header.addEventListener("pointermove",(e)=>{
      if(!dragging) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;

      let nx = px + dx;
      let ny = py + dy;

      nx = clamp(nx, 0, window.innerWidth - 140);
      ny = clamp(ny, 0, window.innerHeight - 120);

      panel.style.left = nx+"px";
      panel.style.top = ny+"px";
      panel.style.right = "auto";
    });

    header.addEventListener("pointerup",()=>{
      dragging = false;
      header.style.cursor = "grab";
    });
  }

  // ==========================
  // UI refresh
  // ==========================
  function refreshUI(){
    const planet = getPlanetById(S.planetId);

    $("uiPlanetName").textContent = `${planet.flag} ${planet.name}`;
    $("uiYear").textContent = Math.floor(S.year);
    $("uiPop").textContent = formatNum(S.pop);

    $("uiCoins").textContent = formatNum(S.coins);
    $("uiAeno").textContent = S.aeno.toFixed(4);
    $("uiGem").textContent = formatNum(S.gem);

    $("uiWood").textContent = formatNum(S.wood);
    $("uiStone").textContent = formatNum(S.stone);
    $("uiIron").textContent = formatNum(S.iron);
    $("uiFood").textContent = formatNum(S.food);

    $("uiRobots").textContent = S.robots;
    $("uiExploring").textContent = S.exploring.length;

    $("uiAutoBuild").textContent = S.autoBuild ? "ON" : "OFF";

    refreshMarketUI();
  }

  // ==========================
  // Main loop
  // ==========================
  function animate(){
    requestAnimationFrame(animate);

    const t = now();
    let dt = (t - lastTickTime) / 1000;
    lastTickTime = t;

    dt = clamp(dt, 0, 0.2);

    updateTime(dt);
    computeProduction(dt);

    robotTick();
    autoBuildTick();

    // random beast wave
    if(Math.random() < 0.0008){
      triggerBeastWave(false);
    }

    // save camera
    if(camera){
      S.cam.x = camera.position.x;
      S.cam.y = camera.position.y;
      S.cam.z = camera.position.z;
    }

    // autosave every 20s
    if(t - lastSaveTime > 20000){
      saveGame(false);
      lastSaveTime = t;
    }

    // animate animals bobbing
    animalGroup.children.forEach(a=>{
      if(!a.userData) return;
      a.userData.t += dt;
      a.position.y = sampleHeight(a.position.x, a.position.z) + 0.2 + Math.sin(a.userData.t*2.0)*0.15;
      a.rotation.y += dt*0.3;
    });

    if(controls){
      controls.update();
    }

    refreshUI();

    if(renderer && show3D){
      renderer.render(scene, camera);
    }
  }

  // ==========================
  // Start game
  // ==========================
  async function startGame(){
    $("bootScreen").classList.add("hidden");
    $("loginScreen").classList.add("hidden");
    $("planetScreen").classList.add("hidden");

    buildUIList();
    buildTechList();

    await loadAds();

    initThree();
    updateRobotStatus();

    logLine("✅ 遊戲已啟動（3D漫畫版）");
    chatSay("AENO", "歡迎返嚟～我係你嘅私人AI伴生體 AENO 🦊");
    chatSay("AENO", "你定居咗一個星球，但機器人可以探索其他20星球。");

    animate();
  }

  // ==========================
  // Boot flow
  // ==========================
  async function boot(){
    bootProgress(5, "讀取系統...");

    initUI();
    initLogin();

    bootProgress(20, "檢查登入...");
    const sessRaw = localStorage.getItem(SESSION_KEY);

    if(sessRaw){
      session = JSON.parse(sessRaw);
      if(session && session.name){
        bootProgress(40, "載入存檔...");
        const key = SAVE_KEY_PREFIX + session.name;
        const raw = localStorage.getItem(key);

        if(raw){
          S = JSON.parse(raw);
          bootProgress(60, "恢復世界...");
          setTimeout(()=>{
            bootProgress(90, "啟動中...");
            $("bootScreen").classList.add("hidden");
            startGame();
          }, 350);
          return;
        }
      }
    }

    bootProgress(70, "等待玩家登入...");
    setTimeout(()=>{
      $("bootScreen").classList.add("hidden");
      $("loginScreen").classList.remove("hidden");
    }, 400);
  }

  boot();

})();
