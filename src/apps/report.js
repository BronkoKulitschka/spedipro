/* Bericht über die Zeit, in der nicht gespielt wurde. */

import { S } from '../state.js';
import { fmt, num } from '../util.js';

function dauer(minuten) {
  const h = minuten / 60;
  if (h < 1)  return `${Math.round(minuten)} Minuten`;
  if (h < 48) return `${h.toFixed(1)} Stunden`;
  return `${(h / 24).toFixed(1)} Tage`;
}

export const ReportApp = {
  id: 'report', icon: '📨', title: () => 'Während deiner Abwesenheit',
  width: 400, height: 360, hidden: true,

  body: () => {
    const r = S.lastReport;
    if (!r) return '<div class="pad muted">Kein Bericht vorhanden.</div>';

    return `
    <div class="pad">
      <div class="inset-box" style="margin-bottom:8px;line-height:1.6;">
        Der Betrieb ist <strong>${dauer(r.appliedMinutes)}</strong> Spielzeit
        weitergelaufen, das sind ${r.days} Tag${r.days === 1 ? '' : 'e'}.
        ${r.truncated ? '<br><span class="warn">Länger als fünf Spieltage wird nicht nachgerechnet.</span>' : ''}
      </div>

      <table class="win-table" style="margin-bottom:8px;">
        <tr><td>Zustellungen</td><td style="text-align:right">${num(r.tours)}</td></tr>
        <tr><td>gefahrene km</td><td style="text-align:right">${num(r.km)} km</td></tr>
        <tr><td>Frachterlöse</td><td style="text-align:right" class="money">${fmt(r.revenue)}</td></tr>
        <tr><td>Veränderung Kasse</td>
            <td style="text-align:right" class="${r.balance >= 0 ? 'money' : 'debt'}">${fmt(r.balance)}</td></tr>
        <tr><td>Kontostand jetzt</td>
            <td style="text-align:right" class="${r.moneyNow >= 0 ? 'money' : 'debt'}">${fmt(r.moneyNow)}</td></tr>
      </table>

      <div class="raised-box">
        <div class="section-title">Lage im Hof</div>
        ${r.rolling} LKW unterwegs, ${r.inWorkshop} in der Werkstatt.
        ${r.tours === 0
          ? '<div class="muted" style="margin-top:6px;">Nichts gefahren — ohne Automatik warten die Fahrzeuge auf deine Disposition. Das Häkchen steht im Fuhrpark.</div>'
          : ''}
      </div>
    </div>`;
  },
};
