(()=>{
"use strict";
const GAME_VERSION="3.0.0";
const SAVE_KEY="AENO_SAVE_V3";
const WORLD_W=3600,WORLD_H=3600,TILE=80;
const BUILDINGS={
house:{name:"民房",emoji:"🏠",cost:{wood:40,stone:20,gold:10},prod:{gold:0.25},hp:80,levelMax:10},
farm:{name:"農田",emoji:"🌾",cost:{wood:20,stone:10,gold:5},prod:{gold:0.15,energy:0.05},hp:60,levelMax:10},
lumber:{name:"伐木場",emoji:"🌲",cost:{wood:10,stone:20,gold:5},prod:{wood:1.1},hp:80,levelMax:10},
quarry:{name:"礦場",emoji:"⛏️",cost:{wood:15,stone:30,gold:10},prod:{stone:0.9},hp:90,levelMax:10},
power:{name:"發電站",emoji:"⚡",cost:{wood:30,stone:30,gold:20},prod:{energy:0.8},hp:100,levelMax:10},
market:{name:"市場",emoji:"🏦",cost:{wood:60,stone:40,gold:40},prod:{gold:0.6},hp:120,levelMax:10},
wall:{name:"城牆",emoji:"🧱",cost:{wood:25,stone:80,gold:20},prod:{},hp:300,levelMax:5}
};
const DEFAULT_RES={wood:120,stone:90,energy:40,gold:30,aeno:0};
const AI_HELPER={enabled:false,useRatio:0.5,intervalSec:6,name:"Lupus Minor"};
const BEAST={intervalSec:70,durationSec:20,dps:1.2,retreatAt:0.4};
const ROBOT={intervalSec:40,maxTakeRatio:0.2};
let state={
version:GAME_VERSION,res:{...DEFAULT_RES},buildings:[],wallHP:100,wallHPMax:100,
time:0,aiEnabled:false,lastBeast:0,beastActive:false,beastTimer:0,
lastRobot:0,robotMsg:"",tutorialShown:false
};
let buildMode=null;
let game,sceneMain;
let cam,worldLayer;
let mapObjects=[],animals=[],villagers=[],robotSprite=null;
let charMgr,player;
const ui={
wood:document.getElementById("wood"),
stone:document.getElementById("stone"),
energy:document.getElementById("energy"),
gold:document.getElementById("gold"),
aeno:document.getElementById("aeno"),
assistantPanel:document.getElementById("assistantPanel"),
assistantMsg:document.getElementById("assistantMsg"),
buildMenu:document.getElementById("buildMenu")
};
window.toggleBuildMenu=()=>{ui.buildMenu.style.display=ui.buildMenu.style.display==="block"?"none":"block";};
window.toggleAssistant=()=>{ui.assistantPanel.style.display=ui.assistantPanel.style.display==="block"?"none":"block";};
window.toggleAI=()=>{
state.aiEnabled=!state.aiEnabled;
showAssistantMessage(state.aiEnabled?"🤖 AI建設已啟動！":"🛑 AI建設已停止！");
saveGame();
};
window.selectBuild=(t)=>{if(BUILDINGS[t]){buildMode=t;showAssistantMessage(`🏗 選擇：${BUILDINGS[t].emoji} ${BUILDINGS[t].name}`);ui.buildMenu.style.display="none";}};
window.manualSave=()=>{saveGame();showAssistantMessage("💾 已保存！");};
window.assistantAsk=(t)=>{
if(t==="close"){ui.assistantPanel.style.display="none";return;}
const ans={
what:"起資源建築→升級→守城牆→拿AENO",
build:"🏗 揀建築→點地圖放置",
aeno:"獸潮同機器人會出AENO",
beast:"獸潮會攻擊城牆，40%會退走"
};
showAssistantMessage(ans[t]||"我仲學緊～");
};
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch(e){}}
function loadGame(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY));if(d&&d.version===GAME_VERSION){state=d;return true;}}catch(e){}return false;}
function updateHUD(){
ui.wood.textContent=Math.floor(state.res.wood);
ui.stone.textContent=Math.floor(state.res.stone);
ui.energy.textContent=Math.floor(state.res.energy);
ui.gold.textContent=Math.floor(state.res.gold);
ui.aeno.textContent=Math.floor(state.res.aeno);
}
function showAssistantMessage(m){ui.assistantPanel.style.display="block";ui.assistantMsg.textContent=m;}
function canAfford(c){for(let k in c)if((state.res[k]||0)<c[k])return false;return true;}
function payCost(c){for(let k in c){state.res[k]-=c[k];if(state.res[k]<0)state.res[k]=0;}}
function generateTerrain(scene){
const g=scene.add.graphics();g.setDepth(-10);
g.fillStyle(0x22c55e,1);g.fillRect(0,0,WORLD_W,WORLD_H);
for(let i=0;i<10;i++){
const x=Phaser.Math.Between(200,WORLD_W-600);
const y=Phaser.Math.Between(200,WORLD_H-600);
const w=Phaser.Math.Between(300,650),h=Phaser.Math.Between(250,550);
g.fillStyle(0x38bdf8,1);g.fillRoundedRect(x,y,w,h,80);
g.lineStyle(6,0x0ea5e9,1);g.strokeRoundedRect(x+8,y+8,w-16,h-16,70);
}
for(let i=0;i<20;i++){
const x=Phaser.Math.Between(100,WORLD_W-200);
const y=Phaser.Math.Between(100,WORLD_H-200);
const r=Phaser.Math.Between(80,160);
g.fillStyle(0x9ca3af,1);g.fillCircle(x,y,r);
g.fillStyle(0x6b7280,1);g.fillCircle(x+r*0.25,y+r*0.15,r*0.65);
g.fillStyle(0xffffff,0.25);g.fillCircle(x-r*0.25,y-r*0.25,r*0.45);
}
for(let i=0;i<80;i++){
const x=Phaser.Math.Between(80,WORLD_W-80);
const y=Phaser.Math.Between(80,WORLD_H-80);
g.fillStyle(0x14532d,1);g.fillCircle(x,y,24);
g.fillStyle(0x166534,1);g.fillCircle(x+10,y+6,18);
g.fillStyle(0x065f46,1);g.fillCircle(x-10,y+6,18);
}
g.generateTexture("terrain",WORLD_W,WORLD_H);g.destroy();
return scene.add.image(0,0,"terrain").setOrigin(0,0).setDepth(-20);
}
function createCartoonAnimal(scene,x,y){
const c=scene.add.container(x,y);
const b=scene.add.circle(0,0,12,0xf59e0b).setStrokeStyle(3,0x111827);
const h=scene.add.circle(10,-8,9,0xfbbf24).setStrokeStyle(3,0x111827);
const e=scene.add.circle(13,-10,2,0x111827);
const w=scene.add.ellipse(-5,0,18,12,0xfde68a).setStrokeStyle(2,0x111827);
c.add([w,b,h,e]);c.setDepth(10);
c.speed=Phaser.Math.FloatBetween(20,50);
c.dir=Phaser.Math.FloatBetween(0,Math.PI*2);
return c;
}
function createVillager(scene,x,y){
const c=scene.add.container(x,y);
const b=scene.add.rectangle(0,10,22,28,0x60a5fa).setStrokeStyle(3,0x111827);
const h=scene.add.circle(0,-8,12,0xfcd34d).setStrokeStyle(3,0x111827);
const e1=scene.add.circle(-4,-10,2,0x111827);
const e2=scene.add.circle(4,-10,2,0x111827);
const m=scene.add.arc(0,-5,4,0,Math.PI,false,0xef4444).setStrokeStyle(2,0x111827);
c.add([b,h,e1,e2,m]);c.setDepth(11);
c.speed=Phaser.Math.FloatBetween(12,26);
c.dir=Phaser.Math.FloatBetween(0,Math.PI*2);
return c;
}
function spawnBuilding(scene,b){
const def=BUILDINGS[b.type];
const c=scene.add.container(b.x,b.y);
const base=scene.add.rectangle(0,0,66,66,0xffffff,0.9).setStrokeStyle(4,0x111827);
const top=scene.add.rectangle(0,-10,66,26,0x93c5fd,1).setStrokeStyle(4,0x111827);
const lab=scene.add.text(-20,-18,def.emoji,{fontSize:"28px"});
const lvl=scene.add.text(-30,22,`Lv.${b.level}`,{fontSize:"14px",fontWeight:"bold",color:"#111827"});
c.add([base,top,lab,lvl]);c.setDepth(20);
base.setInteractive({useHandCursor:true});
base.on("pointerdown",()=>upgradeBuilding(b.id));
b._sprite=c;b._lvl=lvl;
return c;
}
function upgradeBuilding(id){
const b=state.buildings.find(x=>x.id===id);if(!b)return;
const def=BUILDINGS[b.type];if(b.level>=def.levelMax){showAssistantMessage("已滿級");return;}
const f=Math.pow(1.35,b.level);
const cost={};for(let k in def.cost)cost[k]=Math.floor(def.cost[k]*f);
if(!canAfford(cost)){showAssistantMessage("資源不足");return;}
payCost(cost);
b.level++;
b.hpMax=Math.floor(b.hpMax*1.18);b.hp=b.hpMax;
if(b._lvl)b._lvl.setText(`Lv.${b.level}`);
showAssistantMessage(`⬆️ ${def.emoji} 升級至 Lv.${b.level}`);
saveGame();updateHUD();
}
function placeBuilding(scene,x,y,type){
const def=BUILDINGS[type];if(!def)return;
if(!canAfford(def.cost)){showAssistantMessage("資源不足");return;}
payCost(def.cost);
const b={
id:"b"+Date.now()+"_"+Math.floor(Math.random()*9999),
type,x,y,level:1,hpMax:def.hp,hp:def.hp
};
state.buildings.push(b);
spawnBuilding(scene,b);
if(type==="wall"){state.wallHPMax+=220;state.wallHP+=220;}
saveGame();updateHUD();
}
function produceResources(dt){
state.buildings.forEach(b=>{
const def=BUILDINGS[b.type];if(!def)return;
const f=1+(b.level-1)*0.25;
for(let k in def.prod)state.res[k]=(state.res[k]||0)+def.prod[k]*f*dt;
});
state.res.energy+=0.02*dt;
for(let k in state.res)if(state.res[k]>999999999)state.res[k]=999999999;
}
function aiHelperTick(){
if(!state.aiEnabled)return;
const use={};for(let k in state.res)use[k]=state.res[k]*AI_HELPER.useRatio;
const canUse=(c)=>{for(let k in c)if((use[k]||0)<c[k])return false;return true;};
const plan=["lumber","quarry","power","house","farm","market"];
const wp=state.wallHPMax>0?state.wallHP/state.wallHPMax:1;
if(wp<0.7&&canUse(BUILDINGS.wall.cost)){
const x=Phaser.Math.Between(200,WORLD_W-200);
const y=Phaser.Math.Between(200,WORLD_H-200);
placeBuilding(sceneMain,x,y,"wall");
showAssistantMessage("🧱 AI幫你起城牆");
return;
}
let best=null,min=Infinity;
state.buildings.forEach(b=>{
const def=BUILDINGS[b.type];if(!def||b.level>=def.levelMax)return;
const f=Math.pow(1.35,b.level);
const c={};for(let k in def.cost)c[k]=Math.floor(def.cost[k]*f);
const s=Object.values(c).reduce((a,n)=>a+n,0);
if(s<min&&canUse(c)){min=s;best=b;}
});
if(best){upgradeBuilding(best.id);showAssistantMessage("🐾 AI幫你升級");return;}
for(let t of plan){
if(canUse(BUILDINGS[t].cost)){
const x=Phaser.Math.Between(220,WORLD_W-220);
const y=Phaser.Math.Between(220,WORLD_H-220);
placeBuilding(sceneMain,x,y,t);
showAssistantMessage(`🐾 AI起咗 ${BUILDINGS[t].emoji}`);
return;
}
}
}
function beastTick(dt){
if(!state.beastActive&&state.time-state.lastBeast>BEAST.intervalSec){
state.beastActive=true;state.beastTimer=0;state.lastBeast=state.time;
showAssistantMessage("🦖 獸潮來襲！");
}
if(!state.beastActive)return;
state.beastTimer+=dt;
state.wallHP-=BEAST.dps*dt;if(state.wallHP<0)state.wallHP=0;
const p=state.wallHPMax>0?state.wallHP/state.wallHPMax:1;
if(p<=BEAST.retreatAt){
state.beastActive=false;
showAssistantMessage("🌊 獸潮退走！");
if(Math.random()<0.18){const a=Phaser.Math.Between(1,3);state.res.aeno+=a;showAssistantMessage(`💎 AENO +${a}`);}
state.res.gold+=Phaser.Math.Between(10,35);
saveGame();updateHUD();
return;
}
if(state.beastTimer>=BEAST.durationSec){state.beastActive=false;showAssistantMessage("🦴 獸潮完結！");saveGame();}
}
function robotTick(){
if(state.time-state.lastRobot<ROBOT.intervalSec)return;
state.lastRobot=state.time;
const gw=Phaser.Math.Between(20,90);
const gs=Phaser.Math.Between(15,60);
const gg=Phaser.Math.Between(5,22);
state.res.wood+=gw;state.res.stone+=gs;state.res.gold+=gg;
let m=`🤖 機器人帶回：木+${gw} 石+${gs} 金+${gg}`;
if(Math.random()<0.12){const a=Phaser.Math.Between(1,2);state.res.aeno+=a;m+=` +AENO ${a}`;}
showAssistantMessage(m);
saveGame();updateHUD();
if(sceneMain){
if(robotSprite)robotSprite.destroy();
robotSprite=sceneMain.add.container(
Phaser.Math.Between(200,WORLD_W-200),
Phaser.Math.Between(200,WORLD_H-200)
);
const b=sceneMain.add.rectangle(0,0,26,22,0xe5e7eb).setStrokeStyle(3,0x111827);
const e1=sceneMain.add.circle(-6,-3,3,0x111827);
const e2=sceneMain.add.circle(6,-3,3,0x111827);
const an=sceneMain.add.rectangle(0,-18,4,10,0x9ca3af).setStrokeStyle(2,0x111827);
const t=sceneMain.add.circle(0,-24,5,0xf97316).setStrokeStyle(2,0x111827);
robotSprite.add([b,e1,e2,an,t]);robotSprite.setDepth(12);
sceneMain.tweens.add({targets:robotSprite,y:"-=10",duration:400,yoyo:true,repeat:5});
}
}
function moveEntities(dt){
animals.forEach(e=>{
e.x+=Math.cos(e.dir)*e.speed*dt;
e.y+=Math.sin(e.dir)*e.speed*dt;
if(Math.random()<0.02)e.dir+=Phaser.Math.FloatBetween(-0.7,0.7);
if(e.x<80)e.dir=0;if(e.x>WORLD_W-80)e.dir=Math.PI;
if(e.y<80)e.dir=Math.PI/2;if(e.y>WORLD_H-80)e.dir=-Math.PI/2;
e.scaleX=1+Math.sin(state.time*3)*0.02;
e.scaleY=1+Math.cos(state.time*3)*0.02;
});
villagers.forEach(e=>{
e.x+=Math.cos(e.dir)*e.speed*dt;
e.y+=Math.sin(e.dir)*e.speed*dt;
if(Math.random()<0.02)e.dir+=Phaser.Math.FloatBetween(-0.7,0.7);
if(e.x<80)e.dir=0;if(e.x>WORLD_W-80)e.dir=Math.PI;
if(e.y<80)e.dir=Math.PI/2;if(e.y>WORLD_H-80)e.dir=-Math.PI/2;
e.scaleX=1+Math.sin(state.time*3)*0.02;
e.scaleY=1+Math.cos(state.time*3)*0.02;
});
}
class MainScene extends Phaser.Scene{
constructor(){super("MainScene");}
create(){
sceneMain=this;
charMgr=new CharacterManager(this);
worldLayer=generateTerrain(this);
cam=this.cameras.main;
cam.setBounds(0,0,WORLD_W,WORLD_H);
cam.centerOn(WORLD_W/2,WORLD_H/2);
cam.setZoom(0.9);
let drag=false,lx=0,ly=0;
this.input.on("pointerdown",p=>{drag=true;lx=p.x;ly=p.y;});
this.input.on("pointerup",()=>drag=false);
this.input.on("pointermove",p=>{
if(!drag)return;
cam.scrollX-=(p.x-lx)/cam.zoom;
cam.scrollY-=(p.y-ly)/cam.zoom;
lx=p.x;ly=p.y;
});
this.input.on("wheel",(p,dx,dy)=>{
cam.zoom-=dy*0.001;
cam.zoom=Phaser.Math.Clamp(cam.zoom,0.45,1.7);
});
this.input.on("pointerdown",p=>{
const wx=p.worldX,wy=p.worldY;
if(buildMode){placeBuilding(this,wx,wy,buildMode);buildMode=null;}
});
for(let i=0;i<15;i++){
const x=Phaser.Math.Between(100,WORLD_W-100);
const y=Phaser.Math.Between(100,WORLD_H-100);
animals.push(createCartoonAnimal(this,x,y));
}
for(let i=0;i<8;i++){
const x=Phaser.Math.Between(200,WORLD_W-200);
const y=Phaser.Math.Between(200,WORLD_H-200);
villagers.push(createVillager(this,x,y));
}
player=charMgr.createAnimeCharacter(WORLD_W/2,WORLD_H/2);
this.cursors=this.input.keyboard.createCursorKeys();
if(!loadGame()){
placeBuilding(this,WORLD_W/2-100,WORLD_H/2,"house");
placeBuilding(this,WORLD_W/2+100,WORLD_H/2,"farm");
}else{
state.buildings.forEach(b=>spawnBuilding(this,b));
}
updateHUD();
if(!state.tutorialShown){
showAssistantMessage("👋 歡迎來到AENO！");
state.tutorialShown=true;
saveGame();
}
}
update(t,delta){
const dt=delta/1000;
state.time+=dt;
produceResources(dt);
moveEntities(dt);
if(Math.floor(state.time)%AI_HELPER.intervalSec===0)aiHelperTick();
beastTick(dt);
robotTick();
updateHUD();
if(this.cursors.left.isDown)player.x-=3;
if(this.cursors.right.isDown)player.x+=3;
if(this.cursors.up.isDown)player.y-=3;
if(this.cursors.down.isDown)player.y+=3;
}
}
const cfg={
type:Phaser.AUTO,
width:window.innerWidth,
height:window.innerHeight,
parent:"phaser-container",
backgroundColor:"#0b1220",
scene:MainScene,
physics:{default:"arcade",arcade:{gravity:{y:0},debug:false}}
};
game=new Phaser.Game(cfg);
window.addEventListener("resize",()=>{if(game)game.resize(window.innerWidth,window.innerHeight);});
})();
