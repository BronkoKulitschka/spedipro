
import {VERSION} from './version.js';
const data=await fetch('./data/game.json').then(r=>r.json());
let current='home';
const items=[
 ['fuhrpark','FUHRPARK'],['auftraege','AUFTRÄGE'],['touren','TOURENPLANUNG'],
 ['personal','PERSONAL'],['werkstatt','WERKSTATT'],['kassenbuch','KASSENBUCH'],
 ['kunden','KUNDEN'],['statistik','STATISTIK'],['nachrichten','NACHRICHTEN'],
 ['niederlassungen','NIEDERLASSUNGEN'],['karte','KARTENÜBERSICHT'],['einstellungen','EINSTELLUNGEN']
];
const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n);

function home(){
 return `<main class="app">
   <div class="titlebar">
    <img src="./assets/ui/titletruck.png" alt=""><span class="title">SPEDIPRO 95</span>
    <button class="ctrl" data-help>?</button><button class="ctrl" data-close>×</button><span class="clock">09:15</span>
   </div>
   <section class="window">
    <div class="company-head">
      <img src="./assets/ui/company.png" alt="">
      <div><div class="company-name">${data.company.name}</div><div class="hq">Hauptsitz: ${data.company.hq}</div></div>
    </div>
    <div class="finance">
      <div class="finance-row"><span>Kontostand:</span><span class="value green">${euro(data.company.balance)}</span></div>
      <div class="finance-row"><span>Unternehmenswert:</span><span class="value">${euro(data.company.value)}</span></div>
      <div class="finance-row"><span>Ruf:</span><span class="value stars">★★★★<span class="off">☆</span></span></div>
      <div class="metrics">
        <div class="metric">Fahrzeuge:<b>${data.summary.vehicles}</b></div>
        <div class="metric">Aktive Touren:<b>${data.summary.activeTours}</b></div>
        <div class="metric">Mitarbeiter:<b>${data.summary.employees}</b></div>
      </div>
    </div>
    <div class="section-title">AKTIVE TOUREN</div>
    <img class="map" src="./assets/ui/map.png" alt="Aktive Touren in Europa">
    <div class="plan-row"><button class="plan-btn" data-go="touren"><img src="./assets/ui/planicon.png" alt="">TOURENPLANUNG STARTEN</button></div>
   </section>
   <section class="menu">
    ${items.map(([id,label])=>`<button class="tile" data-go="${id}">
      <span class="label">${label}</span><img src="./assets/ui/${id}.png" alt="">
      ${id==='nachrichten'?`<span class="badge">${data.messages}</span>`:''}
    </button>`).join('')}
   </section>
   <div class="statusbar"><span class="dot"></span>Verbunden mit Spedipro-Netz<span class="signal">▂▄▆█</span></div>
 </main>`;
}
function sub(id){
 const title=items.find(x=>x[0]===id)?.[1]??id.toUpperCase();
 return `<main class="sub"><div class="subhead"><button class="back" data-home>←</button>SPEDIPRO 95 · ${title}</div>
 <section class="panel"><h2>${title}</h2><p>Bereich geöffnet. Die Fachlogik folgt in einem eigenen kleinen Entwicklungsschritt.</p><p>Version ${VERSION}</p></section></main>`;
}
function render(){
 document.querySelector('#app').innerHTML=current==='home'?home():sub(current);
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{current=b.dataset.go;render();scrollTo(0,0)});
 document.querySelector('[data-home]')?.addEventListener('click',()=>{current='home';render();scrollTo(0,0)});
 document.querySelector('[data-help]')?.addEventListener('click',()=>alert(`Spedipro 95\nVersion ${VERSION}`));
 document.querySelector('[data-close]')?.addEventListener('click',()=>alert('Spedipro 95 läuft als Web-App.'));
}
render();
