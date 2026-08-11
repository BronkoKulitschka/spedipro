/* Tagesansicht: Datum, Fahrverbote, Lenk- und Ruhezeiten aller Fahrer.

   Der Balken zeigt den laufenden Tag von 0 bis 24 Uhr. Die gefüllte Fläche
   ist die verbrauchte Tageslenkzeit, der Strich markiert die aktuelle
   Uhrzeit. */

import { DRIVE } from '../config.js';
import { S, now, fullDate, clockText, driveStatus, banReason,
         holidayNow, weekendNow, bannedFor, driverOf } from '../state.js';
import { esc } from '../util.js';

const std = min => {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return m ? `${h}:${String(m).padStart(2, '0')} h` : `${h} h`;
};

export const DailyApp = {
    id: 'daily', icon: '📅', title: () => 'Tagesansicht',
  kurz: 'Tages-\nansicht', desktop: true,
  width: 430, height: 430, desktop: true,

  body: () => `
    <div class="col fill">
      <div class="pad" style="padding-bottom:6px;">
        <div class="inset-box" style="text-align:center;padding:8px;">
          <div style="font-size:13px;font-weight:bold;" id="dyDate">—</div>
          <div style="font-size:20px;font-weight:bold;" id="dyClock">—</div>
          <div id="dyKind" class="muted">—</div>
        </div>
        <div id="dyBan" style="margin-top:6px;"></div>
      </div>

      <div class="bar-note">Lenkzeiten · ${std(DRIVE.MAX_STINT)} am Stück,
        dann ${DRIVE.BREAK} min Pause · ${std(DRIVE.MAX_DAY)} am Tag,
        dann ${std(DRIVE.DAILY_REST)} Ruhe</div>

      <div class="inset-box scroll fill" id="dyList" style="padding:4px;"></div>
    </div>`,

  update(el) {
    const jetzt = now();
    el.querySelector('#dyDate').textContent  = fullDate();
    el.querySelector('#dyClock').textContent = clockText();

    const feiertag = holidayNow();
    el.querySelector('#dyKind').textContent =
      feiertag ? feiertag : weekendNow() ? 'Wochenende' : 'Werktag';

    const ban = banReason();
    el.querySelector('#dyBan').innerHTML = ban
      ? `<div class="raised-box" style="border-left:4px solid #806000;">
           <strong>🚫 Fahrverbot</strong> — ${esc(ban)}, bis 22 Uhr.<br>
           <span class="muted" style="font-size:10px;">
             Schwere Fahrzeuge bleiben stehen. Der Kurier 3.5 darf fahren.</span>
         </div>`
      : '';

    const list = el.querySelector('#dyList');
    const minute = jetzt.getUTCHours() * 60 + jetzt.getUTCMinutes();
    const jetztAnteil = (minute / 1440 * 100).toFixed(1);

    list.innerHTML = S.trucks.map(truck => {
      const status = driveStatus(truck);
      const genutzt = Math.min(100, truck.today / DRIVE.MAX_DAY * 100);
      const bis = Math.max(0, DRIVE.MAX_DAY - truck.today);
      const bisPause = Math.max(0, DRIVE.MAX_STINT - truck.stint);

      const farbe = {
        frei: 'ok', pause: 'warn', ruhe: 'warn', rampe: 'muted',
        anfahrt: 'warn', verbot: 'bad', werkstatt: 'bad', ausgefahren: 'warn',
      }[status.code] || 'muted';

      return `
      <div class="truck-row">
        <div class="flex-row" style="justify-content:space-between;">
          <span><strong>${esc(driverOf(truck).name)}</strong>
            <span class="muted">· LKW ${truck.nr}</span></span>
          <span class="${farbe}" style="font-size:10px;">${esc(status.text)}</span>
        </div>

        <div class="dayline">
          <div class="dayline-fill" style="width:${genutzt}%"></div>
          <div class="dayline-now" style="left:${jetztAnteil}%"></div>
        </div>

        <div class="flex-row" style="justify-content:space-between;font-size:10px;">
          <span class="muted">gefahren ${std(truck.today)} von ${std(DRIVE.MAX_DAY)}</span>
          <span class="muted">${status.code === 'frei'
            ? `noch ${std(bisPause)} bis zur Pause`
            : bis > 0 ? `${std(bis)} Rest heute` : 'Tag beendet'}</span>
        </div>
        ${bannedFor(truck) ? '<div class="bad" style="font-size:10px;">steht wegen Fahrverbot</div>' : ''}
      </div>`;
    }).join('');
  },
};
