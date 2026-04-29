let edit=false;

let template = JSON.parse(localStorage.getItem("template")) || {levels:[],cols:[]};
let data = JSON.parse(localStorage.getItem("data")) || [];

let draggedIndex = null;

/* 💾 SAVE */
function save(){
localStorage.setItem("template",JSON.stringify(template));
localStorage.setItem("data",JSON.stringify(data));
}

/* 🎁 INIT REWARDS */
if(!template.rewards){
    template.rewards = template.levels.map(()=> "");
}

/* ⭐ PRESTIGES INIT */
function ensurePrestiges(){
data.forEach(city=>{
    if(!city.prestiges){
        city.prestiges = [
            { name:"couronne", active:false },
            { name:"feu", active:false },
            { name:"étoile", active:false },
            { name:"diamant", active:false }
        ];
    }
});
}

/* 🔄 SYNC */
function sync(){
data.forEach(city=>{

while(city.cols.length < template.levels.length)
    city.cols.push([]);

while(city.cols.length > template.levels.length)
    city.cols.pop();

template.cols.forEach((col,i)=>{
    city.cols[i] = col.map((t,idx)=>({
        t: t.t,
        c: city.cols[i]?.[idx]?.c ?? false
    }));
});

});

/* SYNC REWARDS */
while(template.rewards.length < template.levels.length)
    template.rewards.push("");

while(template.rewards.length > template.levels.length)
    template.rewards.pop();
}

/* 🎮 EDIT MODE */
function toggleEdit(){
edit=!edit;
render();
}

/* ✔ TOGGLE TASK */
function toggle(ci,i,ti,e){
e.stopPropagation();
data[ci].cols[i][ti].c = !data[ci].cols[i][ti].c;
save();
render();
}

/* 📊 PROGRESSION */
function calc(city){
return template.levels.map((_,i)=>{
let col = city.cols[i] || [];
if(!col.length) return 0;
return col.filter(x=>x.c).length / col.length;
});
}

/* 🔒 LOCK */
function isLevelComplete(city,i){
let col = city.cols[i] || [];
return col.length && col.every(t=>t.c);
}

function isLevelUnlocked(city,i){
return i===0 ? true : isLevelComplete(city,i-1);
}

/* SCORE */
function cityScore(city){
let total=0, done=0;

city.cols.forEach(col=>{
    total += col.length;
    done += col.filter(t=>t.c).length;
});

return total===0 ? 0 : done/total;
}

/* 🧠 DRAG */
function setupDragAndDrop(){
if(!edit) return;

const cards=document.querySelectorAll("#template .card.draggable");

cards.forEach(card=>{
card.addEventListener("dragstart",()=>{
    draggedIndex=Number(card.dataset.index);
});

card.addEventListener("dragover",(e)=>{
    e.preventDefault();
});

card.addEventListener("drop",(e)=>{
    e.preventDefault();
    const target=Number(card.dataset.index);
    if(draggedIndex===null||draggedIndex===target) return;
    moveLevel(draggedIndex,target);
});
});
}

function moveLevel(from,to){
const level=template.levels.splice(from,1)[0];
template.levels.splice(to,0,level);

const cols=template.cols.splice(from,1)[0];
template.cols.splice(to,0,cols);

/* move rewards aussi */
const reward = template.rewards.splice(from,1)[0];
template.rewards.splice(to,0,reward);

save();
render();
}

/* ⭐ PRESTIGES */
function getPrestigeIcon(name){
const icons={
    couronne:"👑",
    feu:"🔥",
    étoile:"⭐",
    diamant:"💎"
};
return icons[name] || "●";
}

function togglePrestige(ci,i){
data[ci].prestiges[i].active = !data[ci].prestiges[i].active;
save();
render();
}

/* 🎨 RENDER */
function render(){
sync();
ensurePrestiges();

let t="";

/* TEMPLATE */
if(edit){
t+=`
<div class="panel">
<div class="city-wrapper"><div class="city-title">Ville modèle</div></div>

<div class="grid" style="grid-template-columns:repeat(${template.levels.length+1},1fr)">

${template.levels.map((name,i)=>`
<div class="card draggable" draggable="true" data-index="${i}">

<div class="level-header">

<div class="level-name editable" contenteditable="true"
oninput="template.levels[${i}]=this.innerText;save()">
${name}
</div>

<span class="delete-btn" onclick="deleteLevel(${i})"></span>

</div>

${template.cols[i].map((t,ti)=>`
<div class="task">
<div contenteditable="true"
oninput="template.cols[${i}][${ti}].t=this.innerText;save()">
${t.t}
</div>
<span class="deletetask-btn" onclick="deleteTask(${i},${ti})">X</span>
</div>
`).join("")}

<!-- 🎁 REWARD EDIT -->
<div class="reward-block">
<div class="reward-title">Récompense</div>
<div class="reward-input editable"
contenteditable="true"
oninput="template.rewards[${i}]=this.innerText;save()">
${template.rewards[i] || ""}
</div>
</div>

<button onclick="addTask(${i})">+ condition d'évolution</button>

</div>
`).join("")}

<div class="card add-card" onclick="addLevel()">+</div>

</div>
</div>`;
}

document.getElementById("template").innerHTML=t;

/* 🌍 CITIES */
let h="";

data.sort((a,b)=>cityScore(b)-cityScore(a));

data.forEach((city)=>{
let ci = data.indexOf(city);
let seg = calc(city);

h+=`
<div class="panel">

<div class="city-wrapper">
<div class="city-title ${edit?'editable':''}"
${edit?`contenteditable="true" oninput="data[${ci}].name=this.innerText;save()"`:""}>
${city.name}
</div>
${edit?`<span class="delete-btn" onclick="deleteCity(${ci})"></span>`:""}
</div>

<div class="progress" style="grid-template-columns:repeat(${template.levels.length},1fr)">
${seg.map(v=>`
<div class="seg">
<div class="fill" style="width:${v*100}%"></div>
</div>
`).join("")}
</div>

<div class="grid" style="grid-template-columns:repeat(${template.levels.length},1fr)">
${template.levels.map((name,i)=>`
<div class="card ${!isLevelUnlocked(city,i)?'locked':''}">

<div class="level-name">${name}</div>

${template.cols[i].map((t,ti)=>`
<div class="task">
<div class="task-left ${city.cols[i][ti]?.c?'checked':''}"
onclick="${isLevelUnlocked(city,i)?`toggle(${ci},${i},${ti},event)`:''}">
<div class="box"></div>${t.t}
</div>
</div>
`).join("")}

<!-- 🎁 REWARD VIEW -->
<div class="reward-block">
<div class="reward-title">Récompense</div>
<div class="reward-display">
${template.rewards[i] || "-"}
</div>
</div>

</div>
`).join("")}
</div>

<!-- ⭐ PRESTIGES -->
<div class="prestige">
<div class="prestige-title"><br>Prestiges</div>

<div class="prestige-list">
${city.prestiges.map((p,i)=>`
<div class="prestige-item ${p.active?'active':'inactive'}"
onclick="togglePrestige(${ci},${i})">
${getPrestigeIcon(p.name)}
</div>
`).join("")}
</div>
</div>

</div>`;
});

if(edit) h+=`<button onclick="addCity()">+ Ajouter une ville</button>`;

document.getElementById("cities").innerHTML=h;

setTimeout(setupDragAndDrop,0);
}

/* ➕ LEVEL */
function addLevel(){
template.levels.push("Palier");
template.cols.push([]);
template.rewards.push("");
save();render();
}

/* ❌ LEVEL */
function deleteLevel(i){
template.levels.splice(i,1);
template.cols.splice(i,1);
template.rewards.splice(i,1);
save();render();
}

/* ➕ TASK */
function addTask(i){
template.cols[i].push({t:"Nouvelle condition"});
save();render();
}

/* ❌ TASK */
function deleteTask(i,ti){
template.cols[i].splice(ti,1);
save();render();
}

/* ➕ CITY */
function addCity(){
let cols=template.cols.map(c=>c.map(()=>({c:false})));

data.push({
name:"Nouvelle ville",
cols,
prestiges:[
{ name:"couronne",active:false },
{ name:"feu",active:false },
{ name:"étoile",active:false },
{ name:"diamant",active:false }
]
});

save();render();
}

/* ❌ CITY */
function deleteCity(ci){
data.splice(ci,1);
save();render();
}

/* 📸 EXPORT */
function downloadPNG(){
if(!confirm("Télécharger le dashboard en PNG ?")) return;

const target=document.getElementById("capture");

html2canvas(target,{
scale:2,
useCORS:true
}).then(canvas=>{
const link=document.createElement("a");
link.download="dashboard.png";
link.href=canvas.toDataURL("image/png");
link.click();
});
}

/* 🚀 INIT */
render();