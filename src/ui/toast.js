/* Nicht blockierende Meldungen unten rechts.
   Sie halten das Spiel nicht an, das ist Absicht. */

const LIFETIME = 9000;

export function toast(icon, text, extra = '') {
  const box = document.getElementById('toasts');
  if (!box) return;

  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `
    <div class="title-bar" style="background:linear-gradient(to right,#3a6a3a,#5a9a5a);">
      <span class="title-bar-text">Aus dem Betrieb</span>
      <div class="title-bar-controls"><div class="tb-btn">✕</div></div>
    </div>
    <div style="padding:8px;display:flex;gap:8px;align-items:flex-start;">
      <div style="font-size:22px;">${icon}</div>
      <div style="flex:1;line-height:1.45;">${text}${extra ? '<br>' + extra : ''}</div>
    </div>`;

  el.querySelector('.tb-btn').onclick = () => el.remove();
  box.appendChild(el);
  setTimeout(() => el.remove(), LIFETIME);
}
