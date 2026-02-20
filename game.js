// game.js
// AENO Stable Login Version

(() => {
"use strict";

/* =========================
   BASIC UTIL
========================= */
const $ = id => document.getElementById(id);
const randi = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

/* =========================
   STORAGE
========================= */
const SAVE_PREFIX="AENO_USER_";
let S=null;
let session=null;

/* =========================
   LOGIN
========================= */
function initLogin(){

$("btnLogin").onclick=()=>{

const name=$("loginName").value.trim();
const pass=$("loginPass").value.trim();

if(name.length<3){alert("名稱至少3字");return;}
if(pass.length<2){alert("密碼太短");return;}

const raw=localStorage.getItem(SAVE_PREFIX+name);

if(raw){
const data=JSON.parse(raw);
if(data.pass!==pass){alert("密碼錯誤");return;}
S=data;
startGame();
}else{
createNewGame(name,pass);
startGame();
}
};
}

function createNewGame(name,pass){

S={
name,
pass,
year:0,
coins:2000,
wood:800,
stone:800,
iron:800,
food:800,
gem:20,
robots:1,
buildings:[],
exploring:[]
};

saveGame();
}

/* =========================
   SAVE
========================= */
function saveGame(){
if(!S)return;
localStorage.setItem(SAVE_PREFIX+S.name,JSON.stringify(S));
}

/* =========================
   GAME START
========================= */
function startGame(){

$("loginScreen").style.display="none";
$("gameScreen").style.display="block";

initThree();
initUI();

}

/* =========================
   THREE BASIC WORLD
========================= */
let scene,camera,renderer,ground;

function initThree(){

const canvas=$("gameCanvas");

renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);

scene=new THREE.Scene();
scene.background=new THREE.Color(0xbde0fe);

camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,500);
camera.position.set(0,40,60);

const light=new THREE.DirectionalLight(0xffffff,1);
light.position.set(20,50,20);
scene.add(light);

const amb=new THREE.AmbientLight(0xffffff,0.6);
scene.add(amb);

const geo=new THREE.PlaneGeometry(100,100,20,20);
geo.rotateX(-Math.PI/2);
const mat=new THREE.MeshStandardMaterial({color:0x8de3b6});
ground=new THREE.Mesh(geo,mat);
scene.add(ground);

animate();
}

function animate(){
requestAnimationFrame(animate);
renderer.render(scene,camera);
}

/* =========================
   UI
========================= */
function initUI(){

$("btnBuildHouse").onclick=()=>build("house");
$("btnUpgrade").onclick=upgradeSelected;
$("btnRobot").onclick=makeRobot;
$("btnSendRobot").onclick=sendRobotExplore;
$("btnBuyWood").onclick=()=>trade("wood","buy");
$("btnSellWood").onclick=()=>trade("wood","sell");

refreshUI();
}

function refreshUI(){
$("uiCoins").textContent=Math.floor(S.coins);
$("uiWood").textContent=Math.floor(S.wood);
$("uiStone").textContent=Math.floor(S.stone);
$("uiIron").textContent=Math.floor(S.iron);
$("uiFood").textContent=Math.floor(S.food);
$("uiGem").textContent=Math.floor(S.gem);
$("uiRobots").textContent=S.robots;
}

/* =========================
   BUILDING
========================= */
let selected=null;

function build(type){

if(S.wood<100){alert("木材不足");return;}
S.wood-=100;

const mesh=new THREE.Mesh(
new THREE.BoxGeometry(4,4,4),
new THREE.MeshStandardMaterial({color:0xfef3c7})
);

mesh.position.set(randi(-20,20),2,randi(-20,20));
scene.add(mesh);

S.buildings.push({level:1});
selected=mesh;

saveGame();
refreshUI();
}

function upgradeSelected(){
if(!selected)return;
if(S.stone<50){alert("石材不足");return;}
S.stone-=50;
selected.scale.multiplyScalar(1.2);
saveGame();
refreshUI();
}

/* =========================
   MARKET
========================= */
function trade(item,mode){

const price=5;

if(mode==="buy"){
if(S.coins<price){alert("金幣不足");return;}
S.coins-=price;
S[item]+=1;
}else{
if(S[item]<1){alert("不足");return;}
S[item]-=1;
S.coins+=price;
}

saveGame();
refreshUI();
}

/* =========================
   ROBOT
========================= */
function makeRobot(){
if(S.iron<50){alert("鐵不足");return;}
S.iron-=50;
S.robots++;
saveGame();
refreshUI();
}

function sendRobotExplore(){

if(S.robots<=S.exploring.length){
alert("沒有空閒機器人");
return;
}

S.exploring.push({done:Date.now()+5000});

setTimeout(()=>{
S.wood+=50;
S.gem+=1;
S.exploring.pop();
saveGame();
refreshUI();
alert("機器人帶回資源！");
},5000);

}

/* =========================
   BOOT
========================= */
function boot(){
initLogin();
}

boot();

})();
