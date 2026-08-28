/* Einstellungen: Zeitverhältnis, Geschwindigkeit, Datenquellen. */

import { TIME, AUTOBAHNEN, RULES } from '../config.js';
import { S, dateText, fullDate } from '../state.js';
import { esc } from '../util.js';
import { setSpeed, setRatio, realMinutesPerGameDay } from '../sim/clock.js';
import { loadFirms } from '../data/overpass.js';
import { refillOffers } from '../sim/orders.js';
import { drawFirms } from '../ui/map.js';
import { toast } from '../ui/toast.js';
import { log } from '../state.js';
import { VERSION, BUILD, CODENAME } from '../version.js';
import { saveGame, clearSave, saveInfo } from '../sim/save.js';
import { PRESETS, ladeHintergrund, speichereHintergrund, wendeAn, bildLaden } from '../ui/wallpaper.js';
import { MODI, ARTEN, ladeEinstellung, speichereEinstellung,
         erlaubnisStand, frageErlaubnis, probemeldung,
         moeglich, warumNicht, meldeSystemAn,
         alsAppInstalliert, teiltHerkunft } from '../ui/notify.js';
import { onTick } from '../ui/wm.js';

export const SettingsApp = {
  id: 'settings', icon: '⚙️', title: () => 'Einstellungen',
  width: 400, height: 430, desktop: true,

  body: () => `
    <div class="pad">
      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Betriebsuhr</div>
        <div class="inset-box" style="text-align:center;padding:8px;margin-bottom:8px;">
          <div style="font-size:17px;font-weight:bold;" id="stClock">—</div>
          <div class="muted" id="stState">—</div>
        </div>
        <div class="flex-row" style="margin-bottom:6px;">
          ${TIME.SPEEDS.map(s => `<button class="btn btn-sm" data-speed="${s}">
            ${s === 0 ? '❚❚' : s + '×'}</button>`).join('')}
        </div>
        <div class="muted" style="font-size:10px;">Leertaste hält an und lässt weiterlaufen.</div>
      </div>

      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Zeitverhältnis</div>
        <div style="margin-bottom:6px;">Spielminuten je echter Minute bei 1×:</div>
        <div class="flex-row" style="flex-wrap:wrap;">
          ${TIME.RATIOS.map(r => `<button class="btn btn-sm" data-ratio="${r}">1 : ${r}</button>`).join('')}
        </div>
        <div class="muted" style="font-size:10px;margin-top:6px;" id="stRatioNote">—</div>
      </div>

      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Benachrichtigungen</div>
        <div class="muted" style="font-size:10px;margin-bottom:6px;">
          Meldungen des Browsers, wenn das Fenster im Hintergrund liegt.
          Im Vordergrund genügen die Einblendungen unten rechts.
        </div>

        <div style="font-size:10px;font-weight:bold;margin-bottom:3px;">
          Fertige Touren
        </div>
        ${Object.entries(MODI).map(([key, m]) => `
          <label class="flex-row" style="gap:5px;align-items:flex-start;margin-bottom:4px;">
            <input type="radio" name="nfModus" value="${key}" style="margin-top:2px;">
            <span style="font-size:10px;">
              <strong>${m.name}</strong><br>
              <span class="muted">${m.text}</span>
            </span>
          </label>`).join('')}

        <div style="font-size:10px;font-weight:bold;margin:8px 0 3px;">
          Weitere Meldungen
        </div>
        <div id="nfArten">
          ${Object.entries(ARTEN).map(([key, a]) => `
            <label class="flex-row" style="gap:5px;align-items:flex-start;margin-bottom:3px;">
              <input type="checkbox" data-nf="${key}" style="margin-top:2px;">
              <span style="font-size:10px;">
                <strong>${a.name}</strong><br>
                <span class="muted">${a.text}</span>
              </span>
            </label>`).join('')}
        </div>

        <div class="flex-row" style="margin-top:8px;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-sm" id="nfErlaubnis">Erlaubnis erteilen</button>
          <button class="btn btn-sm" id="nfProbe">Probemeldung</button>
        </div>
        <div class="muted" style="font-size:10px;margin-top:4px;" id="nfNote">—</div>
      </div>

      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Hintergrund</div>
        <div class="muted" style="font-size:10px;margin-bottom:6px;">
          Gilt für die Arbeitsfläche und als Untergrund im Fuhrpark.
        </div>
        <div class="hg-gitter" id="stHg">
          ${Object.entries(PRESETS).map(([key, p]) => `
            <button class="hg-feld" data-hg="${key}" title="${p.name}">
              <span class="hg-vorschau" style="background-image:${
                 p.css.startsWith('#') ? `linear-gradient(${p.css}, ${p.css})` : p.css
               };background-size:${p.size || 'auto'};"></span>
              <span class="hg-name">${p.name}</span>
            </button>`).join('')}
        </div>
        <div class="flex-row" style="margin-top:8px;flex-wrap:wrap;gap:6px;">
          <label class="btn btn-sm" style="cursor:pointer;">
            eigenes Bild wählen
            <input type="file" id="stBild" accept="image/*" style="display:none;">
          </label>
          <button class="btn btn-sm" id="stBildWeg">zurücksetzen</button>
        </div>
        <div class="muted" style="font-size:10px;margin-top:4px;" id="stHgNote">—</div>
      </div>

      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Spielstand</div>
        <div class="muted" style="font-size:10px;line-height:1.5;margin-bottom:6px;">
          Wird alle zwanzig Sekunden und beim Verlassen der Seite im Browser
          gesichert. Beim nächsten Öffnen wird die fehlende Zeit nachgerechnet.
        </div>
        <div id="stSave" style="margin-bottom:6px;">—</div>
        <div class="flex-row">
          <button class="btn btn-sm" id="stSaveNow">jetzt sichern</button>
          <button class="btn btn-sm" id="stSaveDrop">löschen</button>
        </div>
      </div>

      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Programmstand</div>
        <table class="win-table">
          <tr><td>Version</td><td style="text-align:right"><strong>${VERSION}</strong></td></tr>
          <tr><td>Ausgabe</td><td style="text-align:right">${CODENAME}</td></tr>
          <tr><td>Stand</td><td style="text-align:right">${BUILD}</td></tr>
        </table>
        <div class="muted" style="font-size:10px;margin-top:6px;">
          Stimmt die Nummer nicht mit der erwarteten überein, hat der Browser
          noch den alten Stand. Seite mit gedrückter Umschalttaste neu laden
          oder den Verlauf für diese Seite löschen.
        </div>
      </div>

      <div class="raised-box">
        <div class="section-title">Datenquellen</div>
        <div style="line-height:1.6;">
          Karte und Kundschaft: OpenStreetMap, ODbL.<br>
          <span class="muted" id="stFirms">—</span><br>
          Straßenführung: OSRM-Demoserver.<br>
          <span class="muted" id="stRouter">—</span><br>
          Baustellen: Autobahn GmbH des Bundes.<br>
          <span class="muted" id="stTraffic">—</span>
        </div>
        <div class="flex-row" style="margin-top:8px;">
          <button class="btn btn-sm" id="stReload">Betriebe neu laden</button>
          <span class="muted" style="font-size:10px;" id="stReloadNote"></span>
        </div>
      </div>
    </div>`,

  mount(el) {
    el.querySelector('#stBild').addEventListener('change', ev => {
      const datei = ev.target.files?.[0];
      if (!datei) return;
      el.querySelector('#stHgNote').textContent = 'Bild wird verkleinert …';

      bildLaden(datei, ergebnis => {
        if (ergebnis.ok) {
          toast('🖼️', 'Neuer Hintergrund gesetzt.',
                `<span class="muted">${ergebnis.groesse} Bildpunkte</span>`);
        } else {
          toast('⚠️', 'Hintergrund nicht übernommen.',
                `<span class="muted">${ergebnis.grund}</span>`);
        }
        hinweisHintergrund(el);
      });
      ev.target.value = '';
    });

    el.addEventListener('click', e => {
      const speed = e.target.closest('button[data-speed]');
      if (speed) { setSpeed(Number(speed.dataset.speed)); onTick(); return; }
      const ratio = e.target.closest('button[data-ratio]');
      if (ratio) { setRatio(Number(ratio.dataset.ratio)); onTick(); return; }
      if (e.target.closest('#stReload')) { reload(el); return; }

      if (e.target.closest('#stSaveNow')) {
        const done = saveGame();
        toast(done ? '💾' : '⚠️',
              done ? 'Spielstand gesichert.' : 'Sichern nicht möglich.',
              done ? '' : '<span class="muted">Der Browser erlaubt keinen Speicher.</span>');
        return;
      }

      if (e.target.closest('#nfErlaubnis')) {
        /* Der Browser fragt nur auf eine unmittelbare Nutzerhandlung
           hin. Deshalb steht der Aufruf direkt im Klick. */
        if (!moeglich()) {
          toast('⚠️', 'Benachrichtigungen nicht verfügbar.',
                      `<span class="muted">${esc(warumNicht())}</span>`);
          return;
        }

        const stand = erlaubnisStand();
        if (stand === 'erlaubt') {
          toast('🔔', 'Die Erlaubnis liegt bereits vor.');
          hinweisMeldungen(el);
          return;
        }
        if (stand === 'verweigert') {
          toast('⚠️', 'Der Browser hat Benachrichtigungen abgelehnt.',
                      '<span class="muted">Das lässt sich nur in den '
                    + 'Browsereinstellungen für diese Seite ändern.</span>');
          return;
        }

        frageErlaubnis().then(async antwort => {
          if (antwort === 'erlaubt') {
            await meldeSystemAn();
            toast('🔔', 'Erlaubnis erteilt.',
                        '<span class="ok">Meldungen kommen jetzt an.</span>');
          } else if (antwort === 'ungefragt') {
            /* Der Browser hat die Frage gar nicht gestellt. Auf einer
               geteilten Domäne entscheidet oft eine andere dort
               installierte App darüber. */
            toast('⚠️', 'Der Browser hat nicht gefragt.',
                        '<span class="muted">Die Erlaubnis wird an anderer '
                      + 'Stelle verwaltet — siehe Hinweis unten.</span>');
          } else {
            toast('🔔', 'Keine Erlaubnis erteilt.',
                        '<span class="muted">Es bleibt bei den Einblendungen '
                      + 'im Fenster.</span>');
          }
          hinweisMeldungen(el);
          onTick();
        });
        return;
      }

      if (e.target.closest('#nfProbe')) {
        const ergebnis = probemeldung();
        if (ergebnis.ok) {
          toast('🔔', 'Probemeldung gesendet.',
                      '<span class="muted">Auf dem Handy erscheint sie in der '
                    + 'Leiste, sobald du das Fenster verlässt.</span>');
        } else {
          toast('⚠️', 'Probemeldung nicht möglich.',
                      `<span class="muted">${esc(ergebnis.grund)}</span>`);
        }
        return;
      }

      const hg = e.target.closest('button[data-hg]');
      if (hg) {
        const wahl = { art: 'preset', wert: hg.dataset.hg };
        speichereHintergrund(wahl);
        wendeAn(wahl);
        hinweisHintergrund(el);
        return;
      }

      if (e.target.closest('#stBildWeg')) {
        const wahl = { art: 'preset', wert: 'teal' };
        speichereHintergrund(wahl);
        wendeAn(wahl);
        hinweisHintergrund(el);
        toast('🖼️', 'Hintergrund zurückgesetzt.');
        return;
      }

      if (e.target.closest('#stSaveDrop')) {
        clearSave();
        toast('🗑️', 'Gespeicherter Stand gelöscht.',
              '<span class="muted">Der laufende Betrieb bleibt bestehen.</span>');
      }
    });

    /* Benachrichtigungen: Auswahl übernehmen und sichern. */
    el.addEventListener('change', e => {
      const modus = e.target.closest('input[name=nfModus]');
      const art = e.target.closest('input[data-nf]');
      if (!modus && !art) return;

      const wahl = ladeEinstellung();
      if (modus) wahl.modus = modus.value;
      if (art) wahl[art.dataset.nf] = art.checked;

      speichereEinstellung(wahl);
      hinweisMeldungen(el);
    });
  },

  update(el) {
    el.querySelector('#stClock').textContent = dateText();
    el.querySelector('#stState').textContent =
      (S.running ? 'Betrieb läuft' : 'angehalten') + ' · ' + fullDate();

    el.querySelectorAll('[data-speed]').forEach(b =>
      b.classList.toggle('pressed', Number(b.dataset.speed) === S.speed));
    el.querySelectorAll('[data-ratio]').forEach(b =>
      b.classList.toggle('pressed', Number(b.dataset.ratio) === S.ratio));

    const hours = realMinutesPerGameDay() / 60;
    el.querySelector('#stRatioNote').textContent =
      `Ein Spieltag dauert damit bei der gewählten Stufe etwa `
      + (hours >= 1 ? `${hours.toFixed(1)} Stunden` : `${Math.round(hours * 60)} Minuten`)
      + ' echter Zeit.';

    hinweisHintergrund(el);
    hinweisMeldungen(el);

    const info = saveInfo();
    el.querySelector('#stSave').innerHTML = info
      ? `Zuletzt gesichert: <strong>${info.savedAt.toLocaleString('de-DE')}</strong>`
      : '<span class="muted">Noch nichts gesichert.</span>';

    el.querySelector('#stFirms').textContent =
      `${S.firms.length} Betriebe um ${S.depot.name} · Quelle: ${S.dataInfo.firms}`;
    el.querySelector('#stRouter').textContent = esc(S.dataInfo.router);
    el.querySelector('#stTraffic').textContent =
      `${S.traffic.length} Einträge auf ${AUTOBAHNEN.length} Autobahnen, `
      + `${S.stats.jams} Stellen bisher auf euren Strecken.`;
  },
};

/* Betriebe erneut abfragen, ohne das Spiel zu unterbrechen. */
async function reload(el) {
  const button = el.querySelector('#stReload');
  const note   = el.querySelector('#stReloadNote');
  button.disabled = true;

  note.textContent = 'Abfrage läuft, das kann dauern …';
  const { firms, source } = await loadFirms(S.depot, text => { note.textContent = text.trim(); });
  S.firms = firms;
  S.dataInfo.firms = source;
  S.offers = [];
  refillOffers();
  drawFirms();

  note.textContent = `${firms.length} Betriebe · ${source}`;
  log(`Betriebe neu geladen: ${firms.length} aus ${source}.`);
  toast('🔄', `<strong>${firms.length} Betriebe</strong> geladen.`,
        `<span class="muted">Quelle: ${source}</span>`);
  button.disabled = false;
  onTick();
}

/* Zeigt, welcher Hintergrund gerade eingestellt ist. */
function hinweisHintergrund(el) {
  const wahl = ladeHintergrund();
  const note = el.querySelector('#stHgNote');
  if (note) {
    note.textContent = wahl.art === 'bild'
      ? `Eigenes Bild${wahl.name ? ': ' + wahl.name : ''}`
      : `Voreinstellung: ${PRESETS[wahl.wert]?.name || 'Türkis'}`;
  }
  el.querySelectorAll('[data-hg]').forEach(b =>
    b.classList.toggle('gewaehlt', wahl.art === 'preset' && b.dataset.hg === wahl.wert));
}

/* Zustand der Benachrichtigungen herstellen und erklären. */
function hinweisMeldungen(el) {
  const wahl = ladeEinstellung();
  const stand = erlaubnisStand();

  el.querySelectorAll('input[name=nfModus]').forEach(r => {
    r.checked = r.value === wahl.modus;
  });
  el.querySelectorAll('input[data-nf]').forEach(c => {
    c.checked = !!wahl[c.dataset.nf];
    c.disabled = wahl.modus === 'aus';
  });

  const knopf = el.querySelector('#nfErlaubnis');
  const note = el.querySelector('#nfNote');
  if (!note) return;

  /* Der Knopf bleibt immer bedienbar: Ein grauer Knopf ohne Erklärung
     wirkt kaputt. Stattdessen sagt eine Meldung, woran es liegt. */
  if (knopf) knopf.disabled = false;

  if (!moeglich()) {
    note.innerHTML = `<span class="warn">${esc(warumNicht())}</span> `
                   + 'Die Einblendungen im Fenster erscheinen weiterhin.';
  } else if (stand === 'erlaubt') {
    note.innerHTML = '<span class="ok">✔ Erlaubnis erteilt.</span> '
                   + 'Meldungen erscheinen, sobald das Fenster im Hintergrund liegt.';
    if (knopf) knopf.textContent = 'Erlaubnis liegt vor';
  } else if (stand === 'verweigert') {
    note.innerHTML = '<span class="warn">Der Browser hat Benachrichtigungen abgelehnt.</span> '
                   + 'Zum Ändern: in der Adressleiste auf das Schlosssymbol tippen, '
                   + 'dann unter den Berechtigungen dieser Seite.';
  } else {
    note.innerHTML = 'Noch keine Erlaubnis erteilt — ohne sie bleibt es bei den '
                   + 'Einblendungen im Fenster.'
      + (teiltHerkunft() && !alsAppInstalliert()
          ? '<br><br><strong>Wenn der Knopf nichts bewirkt:</strong> Auf '
          + 'github.io teilen sich alle Projekte eines Kontos dieselbe '
          + 'Adresse. Die Erlaubnis gilt deshalb für alle zusammen und kann '
          + 'von einer anderen dort installierten App verwaltet werden.'
          + '<br>Zwei Wege: In den Browsereinstellungen unter '
          + '<em>Berechtigungen</em> die Benachrichtigungen für diese Seite '
          + 'zurücksetzen — oder das Spiel über das Browsermenü '
          + '<em>Zum Startbildschirm hinzufügen</em>. Als eigene App bekommt '
          + 'es einen eigenen Eintrag in den Systemeinstellungen.'
          : '');
  }
}
