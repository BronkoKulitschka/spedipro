
import { VERSION } from './version.js';

const APP_KEY = 'spedipro95_v010';
const screenTitles = {
  home:'Spedipro 95 - Hauptmenü', fuhrpark:'Fuhrpark', auftraege:'Aufträge',
  touren:'Tourenplanung', personal:'Personal', werkstatt:'Werkstatt',
  kassenbuch:'Kassenbuch', kunden:'Kunden', statistik:'Statistik',
  nachrichten:'Nachrichten', niederlassungen:'Niederlassungen',
  karte:'Kartenübersicht', einstellungen:'Einstellungen'
};

let demo;
let state;
let current = 'home';

async function boot(){
  demo = await fetch('./data/demo.json').then(r=>r.json());
  state = loadState();
  render();
}
function loadState(){
  const saved = localStorage.getItem(APP_KEY);
  if(!saved) return structuredClone(demo);
  try { return {...structuredClone(demo), ...JSON.parse(saved)}; }
  catch { return structuredClone(demo); }
}
function saveState(){
  localStorage.setItem(APP_KEY, JSON.stringify(state));
}
function euro(v){ return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(v); }
function unread(){ return state.messages.filter(m=>!m.read).length; }

function chrome(body){
  const title = current==='home' ? 'SPEDIPRO 95' : `SPEDIPRO 95 · ${screenTitles[current].toUpperCase()}`;
  return `
    <div class="phone-status"><span>09:15</span><span>▮▮▮  87%</span></div>
    <div class="titlebar"><span class="truckmark">▰</span><span class="title">${title}</span>
      <div class="win-controls"><button class="win-control" data-help>?</button><button class="win-control" data-home>□</button></div>
    </div>
    <section class="content">${body}<footer class="version">Spedipro 95 · Version ${VERSION}</footer></section>
    <nav class="taskbar"><button class="start-btn" data-home>▦ Start</button><button class="task-active" data-home>${screenTitles[current]}</button></nav>
  `;
}

function home(){
  return `
  <div class="dashboard-grid">
    <div class="panel">
      <div class="panel-title">FIRMA</div>
      <div class="company-card">
        <img src="./assets/ui/niederlassungen.png" class="company-icon" alt="">
        <div><div class="company-name">${state.company.name}</div><div class="small">Hauptsitz: ${state.company.hq}</div></div>
        <div class="stats">
          <div class="stat-row"><span>Kontostand:</span><span class="money">${euro(state.company.balance)}</span></div>
          <div class="stat-row"><span>Unternehmenswert:</span><span>${euro(state.company.value)}</span></div>
          <div class="stat-row"><span>Ruf:</span><span class="stars">${'★'.repeat(state.company.reputation)}${'☆'.repeat(5-state.company.reputation)}</span></div>
          <div class="metric-grid">
            <div class="metric"><strong>${state.summary.vehicles}</strong>Fahrzeuge</div>
            <div class="metric"><strong>${state.summary.activeTours}</strong>Aktive Touren</div>
            <div class="metric"><strong>${state.summary.employees}</strong>Mitarbeiter</div>
          </div>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-title">AKTIVE TOUREN</div>
      <div class="map-wrap"><img src="./assets/ui/europe-map.png" class="route-map" alt="Europa-Karte mit aktiven Touren">
      <button class="primary-btn" data-nav="touren">⌖ TOURENPLANUNG STARTEN</button></div>
    </div>
  </div>
  <div class="menu-title">HAUPTMENÜ</div>
  <div class="menu-grid">
    ${tile('fuhrpark','FUHRPARK')}
    ${tile('auftraege','AUFTRÄGE')}
    ${tile('touren','TOURENPLANUNG')}
    ${tile('personal','PERSONAL')}
    ${tile('werkstatt','WERKSTATT')}
    ${tile('kassenbuch','KASSENBUCH')}
    ${tile('kunden','KUNDEN')}
    ${tile('statistik','STATISTIK')}
    ${tile('nachrichten','NACHRICHTEN',unread())}
    ${tile('niederlassungen','NIEDERLASSUNGEN')}
    ${tile('karte','KARTENÜBERSICHT')}
    ${tile('einstellungen','EINSTELLUNGEN')}
  </div>`;
}
function tile(id,label,badge=0){
  const icon = id==='touren' ? 'touren' : id;
  return `<button class="menu-tile" data-nav="${id}">
    ${badge?`<span class="badge">${badge}</span>`:''}<img src="./assets/ui/${icon}.png" alt=""><span class="label">${label}</span></button>`;
}
function head(title){ return `<div class="screen-head"><button class="back-btn" data-home>←</button><div class="screen-title">${title}</div></div>`; }

function genericList(title, items, renderer){
  return head(title)+`<div class="list">${items.map(renderer).join('')}</div>`;
}
function screen(){
  switch(current){
    case 'home': return home();
    case 'fuhrpark':
      return genericList('FUHRPARK',state.fleet,(x,i)=>`<div class="row-card"><div class="row-line"><strong>${x.name}</strong><span class="status">${x.status}</span></div><div>${x.plate} · ${x.location}</div><div class="action-row"><button data-detail="fleet:${i}">DETAILS</button></div></div>`);
    case 'auftraege':
      return genericList('AUFTRÄGE',state.orders,(x,i)=>`<div class="row-card"><div class="row-line"><strong>${x.id}</strong><span>${euro(x.pay)}</span></div><div>${x.route}</div><div>${x.cargo}</div><div class="action-row"><button data-order="${i}" ${x.status!=='Offen'?'disabled':''}>${x.status==='Offen'?'ANNEHMEN':x.status.toUpperCase()}</button></div></div>`);
    case 'touren':
      return head('TOURENPLANUNG')+`<div class="panel"><div class="panel-title">EUROPA-KARTE</div><div class="map-wrap"><img class="route-map" src="./assets/ui/europe-map.png" alt=""></div></div>`+
        genericList('AKTIVE TOUREN',state.activeTours,x=>`<div class="row-card"><div class="row-line"><strong>${x.id}</strong><span class="status">${x.status}</span></div><div>${x.from} → ${x.to}</div><div>${x.vehicle}</div></div>`).replace(head('AKTIVE TOUREN'),'');
    case 'personal':
      return genericList('PERSONAL',state.staff,x=>`<div class="row-card"><div class="row-line"><strong>${x.name}</strong><span class="status">${x.status}</span></div><div>${x.role}</div></div>`);
    case 'werkstatt':
      return head('WERKSTATT')+`<div class="row-card"><strong>Scania S 500</strong><div>HU / Wartung fällig</div><div class="action-row"><button data-repair>WARTUNG BEAUFTRAGEN</button></div></div>`;
    case 'kassenbuch':
      return genericList('KASSENBUCH',state.ledger,x=>`<div class="row-card"><div class="row-line"><strong>${x.label}</strong><span class="${x.amount>=0?'money':'danger'}">${euro(x.amount)}</span></div></div>`);
    case 'kunden':
      return genericList('KUNDEN',[['Meyer GmbH','A-Kunde'],['NordCargo AG','B-Kunde'],['Hanse Logistik','A-Kunde']],x=>`<div class="row-card"><div class="row-line"><strong>${x[0]}</strong><span>${x[1]}</span></div></div>`);
    case 'statistik':
      return head('STATISTIK')+`<div class="panel"><div class="panel-title">AKTUELL</div><div class="company-card"><div class="stats">
        <div class="stat-row"><span>Fahrzeuge</span><strong>${state.summary.vehicles}</strong></div>
        <div class="stat-row"><span>Aktive Touren</span><strong>${state.summary.activeTours}</strong></div>
        <div class="stat-row"><span>Mitarbeiter</span><strong>${state.summary.employees}</strong></div>
        <div class="stat-row"><span>Kontostand</span><strong class="money">${euro(state.company.balance)}</strong></div></div></div></div>`;
    case 'nachrichten':
      return head('NACHRICHTEN')+`<div class="action-row"><button data-readall>ALLE ALS GELESEN MARKIEREN</button></div><div class="list" style="margin-top:6px">${state.messages.map((m,i)=>`<div class="row-card"><div class="row-line"><strong>${m.from}</strong><span>${m.read?'gelesen':'NEU'}</span></div><div>${m.text}</div><div class="action-row"><button data-msg="${i}">${m.read?'ALS UNGELESEN':'ALS GELESEN'}</button></div></div>`).join('')}</div>`;
    case 'niederlassungen':
      return genericList('NIEDERLASSUNGEN',state.branches,x=>`<div class="row-card"><strong>${x}</strong><div>Standort aktiv</div></div>`);
    case 'karte':
      return head('KARTENÜBERSICHT')+`<div class="panel"><div class="panel-title">EUROPA</div><div class="map-wrap"><img class="route-map" src="./assets/ui/europe-map.png" alt=""></div></div><div class="notice">Die erste Version zeigt bereits dieselbe Kartenansicht wie das Hauptmenü. Die echte Städtedatenbank wird im nächsten kleinen Schritt angebunden.</div>`;
    case 'einstellungen':
      const s=state.settings||{sound:true,compact:false};
      return head('EINSTELLUNGEN')+`<div class="panel"><div class="panel-title">SPIEL & OPTIONEN</div>
      <label class="toggle"><span>Sound</span><input type="checkbox" data-setting="sound" ${s.sound?'checked':''}></label>
      <label class="toggle"><span>Kompakte Listen</span><input type="checkbox" data-setting="compact" ${s.compact?'checked':''}></label>
      <div style="padding:8px"><button class="classic-btn" data-reset>DEMO-SPIELSTAND ZURÜCKSETZEN</button></div></div>`;
  }
}

function render(){
  document.getElementById('app').innerHTML = chrome(screen());
  bind();
}
function nav(to){ current=to; render(); window.scrollTo(0,0); }

function bind(){
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));
  document.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>nav('home'));
  document.querySelectorAll('[data-help]').forEach(b=>b.onclick=()=>alert('Spedipro 95 · Version '+VERSION+'\\nErste lauffähige Smartphone-Version.'));
  document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>{
    const idx=Number(b.dataset.detail.split(':')[1]); const v=state.fleet[idx];
    alert(`${v.name}\\nKennzeichen: ${v.plate}\\nStatus: ${v.status}\\nStandort: ${v.location}`);
  });
  document.querySelectorAll('[data-order]').forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.order); if(state.orders[i].status!=='Offen') return;
    state.orders[i].status='Angenommen'; saveState(); render();
  });
  const rep=document.querySelector('[data-repair]');
  if(rep) rep.onclick=()=>{
    if(state.workshopOrdered){ alert('Wartung ist bereits beauftragt.'); return; }
    state.workshopOrdered=true; state.company.balance-=1850; state.ledger.unshift({label:'Wartung Scania S 500',amount:-1850});
    saveState(); rep.textContent='WARTUNG BEAUFTRAGT'; rep.disabled=true;
  };
  document.querySelectorAll('[data-msg]').forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.msg); state.messages[i].read=!state.messages[i].read; saveState(); render();
  });
  const ra=document.querySelector('[data-readall]');
  if(ra) ra.onclick=()=>{state.messages.forEach(m=>m.read=true); saveState(); render();};
  document.querySelectorAll('[data-setting]').forEach(i=>i.onchange=()=>{
    state.settings=state.settings||{sound:true,compact:false}; state.settings[i.dataset.setting]=i.checked; saveState();
  });
  const reset=document.querySelector('[data-reset]');
  if(reset) reset.onclick=()=>{ if(confirm('Demo-Spielstand wirklich zurücksetzen?')){state=structuredClone(demo);saveState();nav('home');}};
}
boot();
