/* Fensterverwaltung im Stil von Windows 95.

   Jedes Programm meldet sich in apps/index.js an. Hier wird daraus ein
   Fenster mit Titelleiste, Schaltflächen und Eintrag in der Taskleiste.
   Auf schmalen Bildschirmen öffnen Fenster grundsätzlich bildfüllend. */

import { APPS } from '../apps/index.js';
import { HELP_FOR_APP } from '../help/topics.js';
import { S, dateText } from '../state.js';
import { esc } from '../util.js';

const open = new Map();     // key -> Fenstereintrag
let zCounter = 100;
let startMenuOpen = false;

export const isNarrow = () => window.innerWidth < 820;

/* ── Öffnen und Schließen ── */
export function openApp(appId, params = {}) {
  const app = APPS[appId];
  if (!app) return;

  const key = app.multi ? `${appId}:${params.nr ?? ''}` : appId;
  const existing = open.get(key);
  if (existing) { focus(key); restore(key); return; }

  const el = buildWindow(key, app, params);
  document.getElementById('windows').appendChild(el);

  const entry = {
    key, appId, app, params, el,
    body: el.querySelector('.win-body'),
    minimized: false,
    maximized: isNarrow() || !!app.startMaximized,
  };
  open.set(key, entry);

  entry.body.innerHTML = app.body(params);
  app.mount?.(entry.body, params);
  if (entry.maximized) applyMaximized(entry, true);

  focus(key);
  app.update?.(entry.body, params);
  renderTaskbar();
}

export function closeWindow(key) {
  const entry = open.get(key);
  if (!entry) return;
  entry.app.unmount?.(entry.body, entry.params);
  entry.el.remove();
  open.delete(key);
  renderTaskbar();
}

export function closeApp(appId) {
  for (const key of [...open.keys()]) {
    if (open.get(key).appId === appId) closeWindow(key);
  }
}

export const isOpen = appId => [...open.values()].some(e => e.appId === appId);

/* ── Zustand einzelner Fenster ── */
function focus(key) {
  const entry = open.get(key);
  if (!entry) return;
  entry.el.style.zIndex = ++zCounter;
  for (const e of open.values()) e.el.classList.toggle('inactive', e !== entry);
  renderTaskbar();
}

function minimize(key) {
  const entry = open.get(key);
  if (!entry) return;
  entry.minimized = true;
  entry.el.style.display = 'none';
  renderTaskbar();
}

function restore(key) {
  const entry = open.get(key);
  if (!entry) return;
  entry.minimized = false;
  entry.el.style.display = '';
  focus(key);
}

function toggleMaximize(key) {
  const entry = open.get(key);
  if (!entry) return;
  entry.maximized = !entry.maximized;
  applyMaximized(entry, entry.maximized);
  entry.app.resized?.(entry.body);
}

function applyMaximized(entry, on) {
  const el = entry.el;
  if (on) {
    el.dataset.rect = JSON.stringify({ x: el.offsetLeft, y: el.offsetTop,
                                       w: el.offsetWidth, h: el.offsetHeight });
    el.classList.add('maximized');
    Object.assign(el.style, { left: '0px', top: '0px', width: '100%', height: 'calc(100% - 30px)' });
  } else {
    el.classList.remove('maximized');
    const r = JSON.parse(el.dataset.rect || '{}');
    Object.assign(el.style, {
      left: (r.x ?? 40) + 'px', top: (r.y ?? 40) + 'px',
      width: (r.w ?? 520) + 'px', height: (r.h ?? 420) + 'px',
    });
  }
}

/* ── Fenster bauen ── */
let cascade = 0;

function buildWindow(key, app, params) {
  const el = document.createElement('div');
  el.className = 'win';
  el.dataset.key = key;

  const w = Math.min(app.width ?? 520, window.innerWidth - 20);
  const h = Math.min(app.height ?? 400, window.innerHeight - 60);
  const offset = (cascade++ % 6) * 24;
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.style.left = Math.max(8, Math.min(40 + offset, window.innerWidth - w - 8)) + 'px';
  el.style.top  = Math.max(8, Math.min(30 + offset, window.innerHeight - h - 40)) + 'px';

  el.innerHTML = `
    <div class="title-bar win-drag">
      <span class="title-bar-text">${app.icon} ${esc(app.title(params))}</span>
      <div class="title-bar-controls">
        ${HELP_FOR_APP[app.id] ? '<div class="tb-btn tb-help" data-act="help" title="Hilfe zu diesem Programm">?</div>' : ''}
        <div class="tb-btn" data-act="min" title="Minimieren">_</div>
        <div class="tb-btn" data-act="max" title="Vollbild">□</div>
        <div class="tb-btn" data-act="close" title="Schließen">✕</div>
      </div>
    </div>
    ${app.menu ? `<div class="menu-bar">${app.menu}</div>` : ''}
    <div class="win-body"></div>
    <div class="win-grip"></div>`;

  el.addEventListener('pointerdown', () => focus(key), true);

  const hilfe = el.querySelector('[data-act=help]');
  if (hilfe) hilfe.onclick = async e => {
    e.stopPropagation();
    const { oeffneHilfe } = await import('../apps/help.js');
    oeffneHilfe(HELP_FOR_APP[app.id]);
  };

  el.querySelector('[data-act=min]').onclick   = e => { e.stopPropagation(); minimize(key); };
  el.querySelector('[data-act=max]').onclick   = e => { e.stopPropagation(); toggleMaximize(key); };
  el.querySelector('[data-act=close]').onclick = e => { e.stopPropagation(); closeWindow(key); };

  const titleBar = el.querySelector('.win-drag');
  titleBar.addEventListener('dblclick', e => {
    if (e.target.closest('.tb-btn')) return;
    toggleMaximize(key);
  });

  makeDraggable(el, titleBar, key);
  makeResizable(el, el.querySelector('.win-grip'), key);
  return el;
}

function makeDraggable(el, handle, key) {
  let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;

  handle.addEventListener('pointerdown', e => {
    if (e.target.closest('.tb-btn')) return;
    const entry = open.get(key);
    if (entry?.maximized || isNarrow()) return;
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    ox = el.offsetLeft; oy = el.offsetTop;
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener('pointermove', e => {
    if (!dragging) return;
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    el.style.left = Math.max(-el.offsetWidth + 80, Math.min(maxX, ox + e.clientX - sx)) + 'px';
    el.style.top  = Math.max(0, Math.min(maxY, oy + e.clientY - sy)) + 'px';
  });

  handle.addEventListener('pointerup',     () => { dragging = false; });
  handle.addEventListener('pointercancel', () => { dragging = false; });
}

function makeResizable(el, grip, key) {
  let sx = 0, sy = 0, ow = 0, oh = 0, sizing = false;

  grip.addEventListener('pointerdown', e => {
    const entry = open.get(key);
    if (entry?.maximized || isNarrow()) return;
    sizing = true;
    sx = e.clientX; sy = e.clientY;
    ow = el.offsetWidth; oh = el.offsetHeight;
    grip.setPointerCapture(e.pointerId);
    e.stopPropagation();
  });

  grip.addEventListener('pointermove', e => {
    if (!sizing) return;
    el.style.width  = Math.max(260, ow + e.clientX - sx) + 'px';
    el.style.height = Math.max(160, oh + e.clientY - sy) + 'px';
  });

  const stop = () => {
    if (!sizing) return;
    sizing = false;
    open.get(key)?.app.resized?.(open.get(key).body);
  };
  grip.addEventListener('pointerup', stop);
  grip.addEventListener('pointercancel', stop);
}

/* ── Taktaufruf: nur sichtbare Fenster aktualisieren ── */
export function onTick() {
  for (const entry of open.values()) {
    if (!entry.minimized) entry.app.update?.(entry.body, entry.params);
  }
  const clock = document.getElementById('tbClock');
  if (clock) clock.textContent = dateText();
  const speed = document.getElementById('tbSpeed');
  if (speed) speed.textContent = S.running ? `▶ ${S.speed}×` : '❚❚';
}

/* ── Taskleiste und Startmenü ── */
export function renderTaskbar() {
  const bar = document.getElementById('tbApps');
  if (!bar) return;

  bar.innerHTML = [...open.values()].map(e => `
    <span class="tb-entry">
      <button class="btn taskbar-app ${e.minimized ? '' : 'pressed'}" data-key="${e.key}">
        ${e.app.icon} <span class="tb-label">${esc(e.app.title(e.params))}</span>
      </button>
      <button class="btn tb-close" data-close="${e.key}" title="Schließen">✕</button>
    </span>`).join('');

  bar.querySelectorAll('[data-key]').forEach(b => {
    b.onclick = () => {
      const entry = open.get(b.dataset.key);
      if (!entry) return;
      entry.minimized ? restore(entry.key) : minimize(entry.key);
    };
  });

  bar.querySelectorAll('[data-close]').forEach(b => {
    b.onclick = e => { e.stopPropagation(); closeWindow(b.dataset.close); };
  });
}

export function toggleStartMenu(force) {
  startMenuOpen = force ?? !startMenuOpen;
  const menu = document.getElementById('startMenu');
  if (!menu) return;
  menu.style.display = startMenuOpen ? 'flex' : 'none';
  document.getElementById('startBtn')?.classList.toggle('pressed', startMenuOpen);
}

export function startMenuHtml() {
  const items = Object.values(APPS).filter(a => !a.hidden).map(a => `
    <div class="start-item" data-app="${a.id}">
      <span class="start-icon">${a.icon}</span>
      <span>${a.title({})}</span>
    </div>`).join('');

  return `
    <div class="start-strip">SpeditionsPro<span>95</span></div>
    <div class="start-list">
      ${items}
      <div class="start-sep"></div>
      <div class="start-item" data-app="tutorial">
        <span class="start-icon">🎓</span><span>Einführung</span>
      </div>
      <div class="start-item" data-app="__closeall">
        <span class="start-icon">🧹</span><span>Alle Fenster schließen</span>
      </div>
    </div>`;
}

export function closeAll() {
  for (const key of [...open.keys()]) closeWindow(key);
}
