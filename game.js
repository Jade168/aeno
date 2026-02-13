/************************************************************
 AENO - 卡通育成簡潔版 V3.1 (Phaser 3)
 - 現代簡約UI 不擋視線
 - 可愛小動物AI助手 Lupus Minor
 - AI半自動建築/升級 只使用50%資源
 - 玩家可手動停止AI
 - 對話框系統
 - 保留所有原版核心玩法、AEMO幣、存檔、去中心化邏輯
************************************************************/
(() => {
  "use strict";

  const GAME_VERSION = "3.1.0";
  const SAVE_KEY = "AENO_SAVE_V3";

  const WORLD_W = 3600;
  const WORLD_H = 3600;
  const TILE = 80;

  const BUILDINGS = {
    house:  { name:"民房",   emoji:"🏠", cost:{wood:40,stone:20,gold:10}, prod:{gold:0.25}, hp:80, levelMax:10 },
    farm:   { name:"農田",   emoji:"🌾", cost:{wood:20,stone:10,gold:5},  prod:{gold:0.15,energy:0.05}, hp:60, levelMax:10 },
    lumber: { name:"伐木場", emoji:"🌲", cost:{wood:10,stone:20,gold:5},  prod:{wood:1.1}, hp:80, levelMax:10 },
    quarry:{ name:"礦場",   emoji:"⛏️", cost:{wood:15,stone:30,gold:10}, prod:{stone:0.9}, hp:90, levelMax:10 },
    power:  { name:"發電站", emoji:"⚡", cost:{wood:30,stone:30,gold:20}, prod:{energy:0.8}, hp:100, levelMax:10 },
    market: { name:"市場",   emoji:"🏦", cost:{wood:60,stone:40,gold:40}, prod:{gold:0.6}, hp:120, levelMax:10 },
    wall:   { name:"城牆",   emoji:"🧱", cost:{wood:25,stone:80,gold:20}, prod:{}, hp:300, levelMax:5 }
  };

  const DEFAULT_RES = {
    wood:120, stone:90, energy:40, gold:30, aeno:0
  };

  const AI_HELPER = {
    useRatio: 0.5,
    intervalSec: 6,
    name: "Lupus Minor"
  };

  const BEAST = {
    intervalSec:70, durationSec:20, dps:1.2, retreatAt:0.4
  };

  const ROBOT = {
    intervalSec:40, maxTakeRatio:0.2
  };

  let state = {
    version: GAME_VERSION,
    res: {...DEFAULT_RES},
    buildings: [],
    wallHP:100, wallHPMax:100,
    time:0,
    aiEnabled: false,
    lastBeast:0, beastActive:false, beastTimer:0,
    lastRobot:0, robotMsg:"",
    tutorialShown: false
  };

  let buildMode = null;
  let game, sceneMain;
  let cam, worldLayer;
  let mapObjects = [];
  let animals = [];
  let villagers = [];
  let robotSprite = null;
  let aiPetSprite = null;

  // UI
  const ui = {
    wood: document.getElementById("wood"),
    stone: document.getElementById("stone"),
    energy: document.getElementById("energy"),
    gold: document.getElementById("gold"),
    aeno: document.getElementById("aeno"),
    aiChatInput: document.getElementById("aiChatInput"),
    aiChatLog: document.getElementById("aiChatLog"),
    aiToggleBtn: document.getElementById("aiToggleBtn")
  };

  window.toggleBuildMenu = () => {
    const m = document.getElementById("buildMenu");
    m.style.display = m.style.display === "flex" ? "none" : "flex";
  };

  window.toggleAIPanel = () => {
    const p = document.getElementById("aiPanel");
    p.style.display = p.style.display === "block" ? "none" : "block";
  };

  window.toggleAI = () => {
    state.aiEnabled = !state.aiEnabled;
    ui.aiToggleBtn.textContent = state.aiEnabled ? "暫停AI" : "啟動AI";
    aiSay(state.aiEnabled ? "✅ AI半自動已啟動（只會用50%資源）" : "🛑 AI已暫停");
    saveGame();
  };

  window.selectBuild = (type) => {
    if(!BUILDINGS[type]) return;
    buildMode = type;
    aiSay(`🏗 選擇：${BUILDINGS[type].name}，點地圖放置`);
    document.getElementById("buildMenu").style.display = "none";
  };

  window.manualSave = () => {
    saveGame();
    aiSay("💾 已儲存");
  };

  window.sendAIChat = () => {
    const input = ui.aiChatInput;
    const msg = input.value.trim();
    if(!msg) return;
    addChat("我", msg);
    input.value = "";

    setTimeout(() => {
      if(msg.includes("你好") || msg.includes("hi")) aiSay("你好呀主人～");
      else if(msg.includes("做咩") || msg.includes("點玩")) aiSay("我會幫你起建築同升級，淨係用一半資源㗎！");
      else if(msg.includes("停止") || msg.includes("唔好")) aiSay("😢 咁我暫停啦…");
      else if(msg.includes("繼續") || msg.includes("開啟")) aiSay("🥰 收到！我繼續幫你打理！");
      else aiSay("嗯嗯，我聽緊㗎～");
    }, 700);
  };

  function addChat(who, text) {
    const div = document.createElement("div");
    div.className = "chat-item";
    div.textContent = `[${who}] ${text}`;
    ui.aiChatLog.appendChild(div);
    ui.aiChatLog.scrollTop = ui.aiChatLog.scrollHeight;
  }

  function aiSay(text) {
    addChat(AI_HELPER.name, text);
  }

  function saveGame() {
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e){}
  }

  function loadGame() {
    try{
      const raw = localStorage.getItem(SAVE_KEY);
      if(!raw) return false;
      const data = JSON.parse(raw);
      if(!data || data.version !== GAME_VERSION) return false;
      state = data;
      return true;
    } catch(e){ return false; }
  }

  function updateHUD() {
    ui.wood.textContent = Math.floor(state.res.wood);
    ui.stone.textContent = Math.floor(state.res.stone);
    ui.energy.textContent = Math.floor(state.res.energy);
    ui.gold.textContent = Math.floor(state.res.gold);
    ui.aeno.textContent = Math.floor(state.res.aeno);
  }

  function canAfford(cost) {
    for(const k in cost) if((state.res[k]||0) < cost[k]) return false;
    return true;
  }

  function payCost(cost) {
    for(const k in cost) { state.res[k] -= cost[k]; if(state.res[k]<0) state.res[k]=0; }
  }

  function generateTerrain(scene) {
    const g = scene.add.graphics();
    g.setDepth(-10);
    g.fillStyle(0x22c55e,1);
    g.fillRect(0,0,WORLD_W,WORLD_H);

    for(let i=0;i<10;i++){
      const x=Phaser.Math.Between(200,WORLD_W-600);
      const y=Phaser.Math.Between(200,WORLD_H-600);
      const w=Phaser.Math.Between(300,650);
      const h=Phaser.Math.Between(250,550);
      g.fillStyle(0x38bdf8,1);
      g.fillRoundedRect(x,y,w,h,80);
      g.lineStyle(6,0x0ea5e9,1);
      g.strokeRoundedRect(x+8,y+8,w-16,h-16,70);
    }

    for(let i=0;i<20;i++){
      const x=Phaser.Math.Between(100,WORLD_W-200);
      const y=Phaser.Math.Between(100,WORLD_H-200);
      const r=Phaser.Math.Between(80,160);
      g.fillStyle(0x9ca3af,1);
      g.fillCircle(x,y,r);
      g.fillStyle(0x6b7280,1);
      g.fillCircle(x+r*0.25,y+r*0.15,r*0.65);
      g.fillStyle(0xffffff,0.25);
      g.fillCircle(x-r*0.25,y-r*0.25,r*0.45);
    }

    for(let i=0;i<80;i++){
      const x=Phaser.Math.Between(80,WORLD_W-80);
      const y=Phaser.Math.Between(80,WORLD_H-80);
      g.fillStyle(0x14532d,1);
      g.fillCircle(x,y,24);
      g.fillStyle(0x166534,1);
      g.fillCircle(x+10,y+6,18);
      g.fillStyle(0x065f46,1);
      g.fillCircle(x-10,y+6,18);
    }

    g.generateTexture("terrainTex",WORLD_W,WORLD_H);
    g.destroy();
    const img = scene.add.image(0,0,"terrainTex").setOrigin(0,0);
    img.setDepth(-20);
    return img;
  }

  function createCartoonAnimal(scene,x,y,type="bird"){
    const c=scene.add.container(x,y);
    const body=scene.add.circle(0,0,12,0xf59e0b).setStrokeStyle(3,0x111827);
    const head=scene.add.circle(10,-8,9,0xfbbf24).setStrokeStyle(3,0x111827);
    const eye=scene.add.circle(13,-10,2,0x111827);
    const wing=scene.add.ellipse(-5,0,18,12,0xfde68a).setStrokeStyle(2,0x111827);
    c.add([wing,body,head,eye]);
    c.setDepth(10);
    c.speed=Phaser.Math.FloatBetween(20,50);
    c.dir=Phaser.Math.FloatBetween(0,Math.PI*2);
    return c;
  }

  function createVillager(scene,x,y){
    const c=scene.add.container(x,y);
    const body=scene.add.rectangle(0,10,22,28,0x60a5fa).setStrokeStyle(3,0x111827);
    const head=scene.add.circle(0,-8,12,0xfcd34d).setStrokeStyle(3,0x111827);
    const eye1=scene.add.circle(-4,-10,2,0x111827);
    const eye2=scene.add.circle(4,-10,2,0x111827);
    const mouth=scene.add.arc(0,-5,4,0,Math.PI,false,0xef4444).setStrokeStyle(2,0x111827);
    c.add([body,head,eye1,eye2,mouth]);
    c.setDepth(11);
    c.speed=Phaser.Math.FloatBetween(12,26);
    c.dir=Phaser.Math.FloatBetween(0,Math.PI*2);
    return c;
  }

  function spawnAIPet(scene){
    const pet=scene.add.container(0,0);
    const body=scene.add.ellipse(0,0,36,28,0xfcd34d).setStrokeStyle(3,0x111827);
    const ear1=scene.add.ellipse(-12,-16,10,14,0xfbbf24).setStrokeStyle(3,0x111827);
    const ear2=scene.add.ellipse(12,-16,10,14,0xfbbf24).setStrokeStyle(3,0x111827);
    const eye1=scene.add.circle(-8,-4,3,0x111827);
    const eye2=scene.add.circle(8,-4,3,0x111827);
    const mouth=scene.add.arc(0,2,6,0,Math.PI,false,0xef4444).setStrokeStyle(2,0x111827);
    pet.add([body,ear1,ear2,eye1,eye2,mouth]);
    pet.setScale(0.6);
    pet.setDepth(999);
    aiPetSprite=pet;
    return pet;
  }

  function spawnBuilding(scene,b){
    const def=BUILDINGS[b.type];
    const c=scene.add.container(b.x,b.y);
    const base=scene.add.rectangle(0,0,66,66,0xffffff,0.9).setStrokeStyle(4,0x111827);
    const top=scene.add.rectangle(0,-10,66,26,0x93c5fd,1).setStrokeStyle(4,0x111827);
    const label=scene.add.text(-20,-18,def.emoji,{fontSize:"28px"});
    const lvl=scene.add.text(-30,22,`Lv.${b.level}`,{fontSize:"14px",fontStyle:"bold",color:"#111"});
    c.add([base,top,label,lvl]);
    c.setDepth(20);
    c.buildingId=b.id;
    base.setInteractive({useHandCursor:true});
    base.on("pointerdown",()=>{upgradeBuilding(b.id);});
    b._sprite=c;
    b._lvlText=lvl;
    return c;
  }

  function upgradeBuilding(id){
    const b=state.buildings.find(x=>x.id===id);
    if(!b)return;
    const def=BUILDINGS[b.type];
    if(b.level>=def.levelMax){aiSay("已滿級");return;}
    const factor=Math.pow(1.35,b.level);
    const cost={};
    for(const k in def.cost)cost[k]=Math.floor(def.cost[k]*factor);
    if(!canAfford(cost)){aiSay("資源唔夠");return;}
    payCost(cost);
    b.level+=1;
    b.hpMax=Math.floor(b.hpMax*1.18);
    b.hp=b.hpMax;
    if(b._lvlText)b._lvlText.setText(`Lv.${b.level}`);
    aiSay(`⬆️ ${def.name} 升級至 Lv.${b.level}`);
    saveGame();
    updateHUD();
  }

  function placeBuilding(scene,x,y,type){
    const def=BUILDINGS[type];
    if(!def)return;
    if(!canAfford(def.cost)){aiSay("資源不足");return;}
    payCost(def.cost);
    const b={
      id:"b"+Date.now()+"_"+Math.floor(Math.random()*9999),
      type,x,y,level:1,hpMax:def.hp,hp:def.hp
    };
    state.buildings.push(b);
    spawnBuilding(scene,b);
    if(type==="wall"){state.wallHPMax+=220;state.wallHP+=220;}
    saveGame();
    updateHUD();
  }

  function produceResources(dtSec){
    for(const b of state.buildings){
      const def=BUILDINGS[b.type];
      if(!def)continue;
      const lf=1+(b.level-1)*0.25;
      for(const k in def.prod){
        state.res[k]=(state.res[k]||0)+def.prod[k]*lf*dtSec;
      }
    }
    state.res.energy+=0.02*dtSec;
    for(const k in state.res)if(state.res[k]>999999999)state.res[k]=999999999;
  }

  function aiHelperTick(){
    if(!state.aiEnabled)return;
    const usable={};
    for(const k in state.res)usable[k]=state.res[k]*AI_HELPER.useRatio;
    function canUse(cost){
      for(const k in cost)if((usable[k]||0)<cost[k])return false;
      return true;
    }
    const wallPct=state.wallHPMax>0?state.wallHP/state.wallHPMax:1;
    if(wallPct<0.7){
      const c=BUILDINGS.wall;
      if(canUse(c.cost)){
        const x=Phaser.Math.Between(200,WORLD_W-200);
        const y=Phaser.Math.Between(200,WORLD_H-200);
        placeBuilding(sceneMain,x,y,"wall");
        aiSay("🧱 我幫你加強城牆");
        return;
      }
    }
    let best=null;
    let bestCost=999999;
    for(const b of state.buildings){
      const def=BUILDINGS[b.type];
      if(!def||b.level>=def.levelMax)continue;
      const f=Math.pow(1.35,b.level);
      const cost={};
      for(const k in def.cost)cost[k]=Math.floor(def.cost[k]*f);
      let sum=0;
      for(const k in cost)sum+=cost[k];
      if(sum<bestCost&&canUse(cost)){bestCost=sum;best=b;}
    }
    if(best){
      upgradeBuilding(best.id);
      aiSay("🐾 幫你升咗個建築");
      return;
    }
    const plan=["lumber","quarry","power","house","farm","market"];
    for(const t of plan){
      const c=BUILDINGS[t];
      if(canUse(c.cost)){
        const x=Phaser.Math.Between(220,WORLD_W-220);
        const y=Phaser.Math.Between(220,WORLD_H-220);
        placeBuilding(sceneMain,x,y,t);
        aiSay(`🏗️ 幫你起咗 ${c.name}`);
        return;
      }
    }
  }

  function beastTick(dtSec){
    if(!state.beastActive&&state.time-state.lastBeast>BEAST.intervalSec){
      state.beastActive=true;
      state.beastTimer=0;
      state.lastBeast=state.time;
      aiSay("🦖 獸潮來襲！");
    }
    if(!state.beastActive)return;
    state.beastTimer+=dtSec;
    state.wallHP-=BEAST.dps*dtSec;
    if(state.wallHP<0)state.wallHP=0;
    const pct=state.wallHPMax>0?state.wallHP/state.wallHPMax:1;
    if(pct<=BEAST.retreatAt){
      state.beastActive=false;
      aiSay("🌊 獸潮退咗啦！");
      if(Math.random()<0.18){
        const a=Phaser.Math.Between(1,3);
        state.res.aeno+=a;
        aiSay(`💎 獲得 AENO +${a}`);
      }
      state.res.gold+=Phaser.Math.Between(10,35);
      saveGame();
      updateHUD();
      return;
    }
    if(state.beastTimer>=BEAST.durationSec){
      state.beastActive=false;
      aiSay("🦴 獸潮完結！");
      saveGame();
    }
  }

  function robotTick(){
    if(state.time-state.lastRobot<ROBOT.intervalSec)return;
    state.lastRobot=state.time;
    const gw=Phaser.Math.Between(20,90);
    const gs=Phaser.Math.Between(15,60);
    const gg=Phaser.Math.Between(5,22);
    state.res.wood+=gw;
    state.res.stone+=gs;
    state.res.gold+=gg;
    if(Math.random()<0.12){
      const a=Phaser.Math.Between(1,2);
      state.res.aeno+=a;
      aiSay(`🤖 機器人帶回 AENO +${a}`);
    }else{
      aiSay(`🤖 機器人採集：木+${gw} 石+${gs} 金+${gg}`);
    }
    saveGame();
    updateHUD();
  }

  function moveEntities(dtSec){
    function move(e){
      e.x+=Math.cos(e.dir)*e.speed*dtSec;
      e.y+=Math.sin(e.dir)*e.speed*dtSec;
      if(Math.random()<0.02)e.dir+=Phaser.Math.FloatBetween(-0.7,0.7);
      if(e.x<80)e.dir=0;
      if(e.x>WORLD_W-80)e.dir=Math.PI;
      if(e.y<80)e.dir=Math.PI/2;
      if(e.y>WORLD_H-80)e.dir=-Math.PI/2;
      e.scaleX=1+Math.sin(state.time*3)*0.02;
      e.scaleY=1+Math.cos(state.time*3)*0.02;
    }
    animals.forEach(move);
    villagers.forEach(move);
  }

  class MainScene extends Phaser.Scene{
    constructor(){super("MainScene");}
    preload(){}
    create(){
      sceneMain=this;
      worldLayer=generateTerrain(this);
      cam=this.cameras.main;
      cam.setBounds(0,0,WORLD_W,WORLD_H);
      cam.centerOn(WORLD_W/2,WORLD_H/2);
      cam.setZoom(0.9);
      let drag=false;
      let lx=0,ly=0;
      this.input.on("pointerdown",p=>{drag=true;lx=p.x;ly=p.y;});
      this.input.on("pointerup",()=>drag=false);
      this.input.on("pointermove",p=>{
        if(!drag)return;
        cam.scrollX-=(p.x-lx)/cam.zoom;
        cam.scrollY-=(p.y-ly)/cam.zoom;
        lx=p.x; ly=p.y;
      });
      this.input.on("wheel",(p,dx,dy)=>{
        cam.zoom-=dy*0.001;
        cam.zoom=Phaser.Math.Clamp(cam.zoom,0.45,1.7);
      });
      this.input.on("pointerdown",p=>{
        if(buildMode){
          placeBuilding(this,p.worldX,p.worldY,buildMode);
          buildMode=null;
        }
      });
      spawnAIPet(this);
      if(!loadGame()){
        aiSay("🎮 新遊戲開始！我係你嘅AI助手 "+AI_HELPER.name);
      }else{
        aiSay("🔙 載入存檔成功！");
      }
      updateHUD();
      this.time.addEvent({
        delay:1000,
        callback:()=>{
          state.time+=1;
          produceResources(1);
          updateHUD();
        },
        loop:true
      });
      this.time.addEvent({
        delay:AI_HELPER.intervalSec*1000,
        callback:aiHelperTick,
        loop:true
      });
      this.time.addEvent({
        delay:1000,
        callback:()=>{beastTick(1);robotTick();},
        loop:true
      });
      for(let i=0;i<30;i++)animals.push(createCartoonAnimal(this,
        Phaser.Math.Between(100,WORLD_W-100),
        Phaser.Math.Between(100,WORLD_H-100)
      ));
      for(let i=0;i<12;i++)villagers.push(createVillager(this,
        Phaser.Math.Between(200,WORLD_W-200),
        Phaser.Math.Between(200,WORLD_H-200)
      ));
      state.buildings.forEach(b=>spawnBuilding(this,b));
    }
    update(){
      moveEntities(0.016);
      if(aiPetSprite){
        aiPetSprite.x=cam.scrollX+60;
        aiPetSprite.y=cam.scrollY+cam.height-60;
        aiPetSprite.rotation=Math.sin(state.time*2)*0.05;
      }
    }
  }

  const config={
    type:Phaser.AUTO,
    scale:{mode:Phaser.Scale.FIT,width:800,height:1280},
    physics:{default:"arcade",arcade:{gravity:{y:0}}},
    scene:[MainScene]
  };

  game=new Phaser.Game(config);
})();
