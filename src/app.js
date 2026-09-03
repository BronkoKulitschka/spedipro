
import {VERSION} from './version.js';
const KEY='spedipro95-011'; let base=await fetch('./data/game.json').then(r=>r.json());
let state=JSON.parse(localStorage.getItem(KEY)||JSON.stringify(base)); let view='home';
const menu=[
['fuhrpark','FUHRPARK','🚛'],['auftraege','AUFTRÄGE','📋'],['touren','TOURENPLANUNG','🗺️'],
['personal','PERSONAL','👷'],['werkstatt','WERKSTATT','🔧'],['kassenbuch','KASSENBUCH','🧮'],
['kunden','KUNDEN','🤝'],['statistik','STATISTIK','📊'],['nachrichten','NACHRICHTEN','✉️'],
['niederlassungen','NIEDERLASSUNGEN','🏭'],['karte','KARTENÜBERSICHT','🌍'],['einstellungen','EINSTELLUNGEN','⚙️']];
const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n);
const unread=()=>state.messages.filter(x=>!x.read).length;
function shell(inner){return `<div class="game"><div class="titlebar"><span class="logo">🚚</span><span class="name">SPEDIPRO 95</span><button class="tb" id="help">?</button><button class="tb" id="close">×</button><span class="clock">09:15</span></div>${inner}<div class="statusbar"><span class="dot"></span>Verbunden mit Spedipro-Netz <span class="signal">▂▄▆█</span></div></div>`}
function home(){return `<div class="window">
<div class="company-top"><div class="building">🏢</div><div><div class="company-name">${state.company.name}</div><div class="hq">Hauptsitz: ${state.company.hq}</div></div></div>
<div class="company-stats"><div class="stat"><span>Kontostand:</span><span class="v green">${euro(state.company.balance)}</span></div><div class="stat"><span>Unternehmenswert:</span><span class="v">${euro(state.company.value)}</span></div><div class="stat"><span>Ruf:</span><span class="v stars">★★★★<span class="off">☆</span></span></div>
<div class="counts"><div class="count">Fahrzeuge:<strong>${state.summary.vehicles}</strong></div><div class="count">Aktive Touren:<strong>${state.summary.activeTours}</strong></div><div class="count">Mitarbeiter:<strong>${state.summary.employees}</strong></div></div></div>
<div class="section-title">AKTIVE TOUREN</div><img class="map" src="./assets/ui/europe-map-reference.jpg"><div class="plan-wrap"><button class="plan" data-go="touren">🗺️ &nbsp; TOURENPLANUNG STARTEN</button></div></div>
<div class="grid">${menu.map(([id,l,i])=>`<button class="tile" data-go="${id}"><span class="label">${l}</span><span class="ico">${i}</span>${id==='nachrichten'?`<span class="badge">${unread()}</span>`:''}</button>`).join('')}</div>`}
function sub(){let label=menu.find(x=>x[0]===view)?.[1]||view.toUpperCase(); let body='';
if(view==='nachrichten') body=state.messages.map((m,i)=>`<div class="card"><b>${m.from}</b><br>${m.text}<button data-read="${i}">${m.read?'ALS UNGELESEN':'ALS GELESEN'}</button></div>`).join('');
else if(view==='einstellungen') body=`<div class="card"><b>Version ${VERSION}</b><br><br>Dieser Bildschirm ist bereits erreichbar und damit kein toter Button.<button id="reset">SPIELSTAND ZURÜCKSETZEN</button></div>`;
else body=`<div class="card"><b>${label}</b><br><br>Bereich geöffnet. Die Fachlogik wird in einem eigenen kleinen Entwicklungsschritt ergänzt.</div>`;
return `<div class="sub"><button class="back" id="back">← HAUPTMENÜ</button><h2>${label}</h2>${body}</div>`}
function render(){document.querySelector('#app').innerHTML=shell(view==='home'?home():sub()); bind()}
function bind(){document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{view=b.dataset.go;render()});document.querySelector('#back')?.addEventListener('click',()=>{view='home';render()});document.querySelector('#help').onclick=()=>alert('Spedipro 95 · Version '+VERSION);document.querySelector('#close').onclick=()=>alert('Spedipro 95 bleibt geöffnet.');document.querySelectorAll('[data-read]').forEach(b=>b.onclick=()=>{let i=+b.dataset.read;state.messages[i].read=!state.messages[i].read;localStorage.setItem(KEY,JSON.stringify(state));render()});document.querySelector('#reset')?.addEventListener('click',()=>{localStorage.removeItem(KEY);state=structuredClone(base);view='home';render()})}
render();
