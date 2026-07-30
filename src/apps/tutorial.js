/* Einführung für den ersten Betrieb.

   Ein schmales Fenster, das Schritt für Schritt begleitet. Es prüft
   selbst, ob ein Schritt erledigt ist, und geht dann weiter. Nichts
   davon ist Pflicht — überspringen geht jederzeit. */

import { S } from '../state.js';
import { esc } from '../util.js';
import { openApp, onTick, closeApp } from '../ui/wm.js';
import { oeffneHilfe } from './help.js';
import { automatikFrei } from '../sim/progress.js';

const SCHRITTE = [
  {
    id: 'willkommen',
    titel: 'Willkommen im Betrieb',
    text: 'Du hast eine Spedition übernommen: ein Fahrzeug, ein Fahrer, 50.000 € auf dem Konto. '
        + 'Diese Einführung begleitet dich durch die ersten Schritte.',
    hinweis: 'Es gibt kein Zeitlimit und kein Verlieren. Nimm dir Zeit.',
    knopf: 'Los geht es',
    fertig: () => false,
  },
  {
    id: 'dispo',
    titel: 'Der erste Auftrag',
    text: 'Öffne die Disposition. Links liegt die Karte, rechts die offenen Anfragen. '
        + 'Wähle oben ein Fahrzeug und schicke es mit „sofort" auf eine Fracht.',
    hinweis: 'Passt eine Sendung nicht auf das Fahrzeug, steht der Grund an Stelle des Knopfes.',
    app: 'dispo',
    fertig: () => S.trucks.some(t => t.phase === 'driving' || t.phase === 'planning'),
  },
  {
    id: 'uhr',
    titel: 'Die Betriebsuhr',
    text: 'Der LKW rollt jetzt über die Karte. Die Uhr läuft in Echtzeit — voreingestellt sind '
        + 'drei Spielminuten je echter Minute. In den Einstellungen kannst du das ändern, '
        + 'mit 2× oder 4× geht es schneller.',
    hinweis: 'Die Leertaste hält an und lässt weiterlaufen.',
    app: 'settings',
    fertig: () => S.speed > 1 || S.ratio > 3 || S.stats.tours > 0,
  },
  {
    id: 'zustellung',
    titel: 'Die erste Zustellung',
    text: 'Warte, bis der Fahrer angekommen ist. An der Rampe steht er dann eine Stunde zum Entladen. '
        + 'Danach bleibt er dort — es gibt keine Zwangsrückfahrt.',
    hinweis: 'Nimm den nächsten Auftrag von dort aus. Leerfahrten kosten nur Geld.',
    fertig: () => S.stats.tours >= 1,
  },
  {
    id: 'kasse',
    titel: 'Was ist hängengeblieben?',
    text: 'Öffne die Kasse. Dort steht jede Buchung einzeln: Fracht grün, Diesel und Fixkosten rot. '
        + 'Ein Fahrzeug kostet 550 € am Tag, ob es fährt oder nicht.',
    hinweis: 'Ein LKW ohne Auftrag verliert Geld. Das ist der wichtigste Satz des Spiels.',
    app: 'finance',
    fertig: () => S.stats.tours >= 2,
  },
  {
    id: 'ladeliste',
    titel: 'Mehrere Sendungen zusammenlegen',
    text: 'Zurück in der Disposition: Sammle mit „+ laden" zwei oder drei Sendungen auf ein Fahrzeug '
        + 'und starte sie als eine Tour. Die Balken zeigen Stellplätze und Nutzlast, '
        + 'bei jeder weiteren Sendung den Umweg.',
    hinweis: 'Sammelverkehr spart Rampenzeit: 33 statt 60 Minuten je Stopp.',
    app: 'dispo',
    fertig: () => S.trucks.some(t => t.tour && t.tour.etappen.length > 1),
  },
  {
    id: 'stufe',
    titel: 'Der Betrieb wächst',
    text: 'Nach zwölf Zustellungen und einem zweiten Fahrzeug erreichst du Stufe 2 und schaltest '
        + 'die Automatik frei. Ab dann suchen sich Fahrzeuge selbst Aufträge — und der Betrieb '
        + 'läuft auch weiter, wenn du das Fenster schließt.',
    hinweis: 'Fahrzeuge kaufst du im Fuhrpark über den Fahrzeughandel.',
    app: 'progress',
    fertig: () => automatikFrei(),
  },
  {
    id: 'ende',
    titel: 'Das war der Anfang',
    text: 'Den Rest findest du in der Hilfe: Verträge und Marktlage, Lenkzeiten und Fahrverbote, '
        + 'Güterklassen, Fahrerschulung. Jedes Programm hat ein ? in der Titelleiste.',
    hinweis: 'Viel Vergnügen. Der Betrieb läuft, so lange du magst.',
    knopf: 'Fertig',
    fertig: () => false,
  },
];

export const TutorialApp = {
  id: 'tutorial', icon: '🎓', title: () => 'Einführung', hidden: true,
  width: 340, height: 330,

  body: () => `
    <div class="col fill">
      <div class="tut-kopf">
        <span id="tutSchritt">Schritt 1</span>
        <div class="prog" style="height:8px;margin-top:3px;">
          <div class="prog-fill" id="tutBalken"></div>
        </div>
      </div>
      <div class="pad fill scroll">
        <div style="font-size:13px;font-weight:bold;margin-bottom:6px;" id="tutTitel">—</div>
        <div style="line-height:1.6;" id="tutText">—</div>
        <div class="hilfe-tipp" style="margin-top:8px;" id="tutHinweis"></div>
        <div class="ok" id="tutErledigt" style="margin-top:8px;font-weight:bold;display:none;">
          ✔ Erledigt
        </div>
      </div>
      <div class="bar-note flex-row" style="justify-content:space-between;gap:4px;">
        <button class="btn btn-sm" id="tutSkip">überspringen</button>
        <span class="flex-row" style="gap:4px;">
          <button class="btn btn-sm" id="tutApp">Fenster öffnen</button>
          <button class="btn btn-sm btn-default" id="tutWeiter">weiter</button>
        </span>
      </div>
    </div>`,

  mount(el, params) {
    if (params?.neustart) { S.tutorial = { schritt: 0, aktiv: true }; }
    if (!S.tutorial) S.tutorial = { schritt: 0, aktiv: true };

    el.querySelector('#tutSkip').onclick = () => {
      S.tutorial.aktiv = false;
      closeApp('tutorial');
    };

    el.querySelector('#tutWeiter').onclick = () => {
      if (S.tutorial.schritt >= SCHRITTE.length - 1) {
        S.tutorial.aktiv = false;
        oeffneHilfe('start');
        closeApp('tutorial');
        return;
      }
      S.tutorial.schritt++;
      el.dataset.sig = '';
      onTick();
    };

    el.querySelector('#tutApp').onclick = () => {
      const s = SCHRITTE[S.tutorial.schritt];
      if (s?.app) openApp(s.app);
    };
  },

  update(el) {
    if (!S.tutorial) S.tutorial = { schritt: 0, aktiv: true };
    const nr = Math.min(S.tutorial.schritt, SCHRITTE.length - 1);
    const s = SCHRITTE[nr];
    const erledigt = s.fertig();

    /* Ein erledigter Schritt geht von selbst weiter. */
    if (erledigt && nr < SCHRITTE.length - 1 && !S.tutorial.gemeldet) {
      S.tutorial.gemeldet = true;
      setTimeout(() => {
        if (S.tutorial && S.tutorial.schritt === nr) {
          S.tutorial.schritt++;
          S.tutorial.gemeldet = false;
          el.dataset.sig = '';
          onTick();
        }
      }, 2500);
    }

    const sig = `${nr}:${erledigt}`;
    if (el.dataset.sig === sig) return;
    el.dataset.sig = sig;
    if (!erledigt) S.tutorial.gemeldet = false;

    el.querySelector('#tutSchritt').textContent = `Schritt ${nr + 1} von ${SCHRITTE.length}`;
    el.querySelector('#tutBalken').style.width = ((nr + 1) / SCHRITTE.length * 100) + '%';
    el.querySelector('#tutTitel').textContent = s.titel;
    el.querySelector('#tutText').textContent = s.text;
    el.querySelector('#tutHinweis').innerHTML = `<strong>💡 Hinweis</strong><br>${esc(s.hinweis)}`;
    el.querySelector('#tutErledigt').style.display = erledigt ? '' : 'none';

    const app = el.querySelector('#tutApp');
    app.style.display = s.app ? '' : 'none';

    const weiter = el.querySelector('#tutWeiter');
    weiter.textContent = s.knopf || 'weiter';
  },
};

export const tutorialLaeuft = () => !!S.tutorial?.aktiv;
