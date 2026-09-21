// finanzen.js (Programm)
// Die Buchhaltung, wie ein Disponent sie 1994 auf dem Bildschirm
// gehabt hätte: Kontostand oben, darunter das, was ihn dorthin
// gebracht hat.
//
// Fünf Ansichten: Übersicht, Journal, BWA, Kosten je Fahrzeug, Bank.
// Dazu eine sechste, die es in echter Software nicht gibt: Kostensätze
// mit Quellenangabe. Sie macht sichtbar, welche Zahl im Spiel belegt
// ist und welche noch vorläufig - siehe docs/kosten-1994.md.

const FinanzenApp = (function () {
  let fensterElement = null;
  let ansicht = "uebersicht";
  let gewaehlterMonat = null;
  let journalKonto = null;

  const ANSICHTEN = [
    { id: "uebersicht", titel: "Übersicht" },
    { id: "journal", titel: "Journal" },
    { id: "bwa", titel: "BWA" },
    { id: "fahrzeuge", titel: "Je Fahrzeug" },
    { id: "bank", titel: "Bank" },
    { id: "saetze", titel: "Sätze" }
  ];

  // ---------- Hilfen ----------

  function dm(betrag) {
    const gerundet = Math.round(betrag);
    return gerundet.toLocaleString("de-DE") + " DM";
  }

  function vorzeichenKlasse(betrag) {
    return betrag > 0 ? "fin-positiv" : betrag < 0 ? "fin-negativ" : "";
  }

  function datumKurz(iso) {
    const d = new Date(iso);
    const zwei = (n) => String(n).padStart(2, "0");
    return `${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.`;
  }

  // ---------- Ansichten ----------

  function renderInhalt() {
    return `
      <div class="fin-layout">
        <ol class="fin-reiter">
          ${ANSICHTEN.map((a) => `
            <li class="fin-reiter-eintrag ${ansicht === a.id ? "aktiv" : ""}"
                data-ansicht="${a.id}">${a.titel}</li>
          `).join("")}
        </ol>
        <div class="fin-inhalt">${ansichtInhalt()}</div>
      </div>
    `;
  }

  function ansichtInhalt() {
    switch (ansicht) {
      case "journal": return renderJournal();
      case "bwa": return renderBwa();
      case "fahrzeuge": return renderFahrzeuge();
      case "bank": return renderBank();
      case "saetze": return renderSaetze();
      default: return renderUebersicht();
    }
  }

  function renderUebersicht() {
    const stand = Finanzen.kontostand();
    const monate = Finanzen.monate();
    const laufend = monate.length ? Finanzen.bwa(monate[0]) : null;
    const vormonat = monate.length > 1 ? Finanzen.bwa(monate[1]) : null;
    const restschuld = Finanzen.restschuldGesamt();
    const dispoRest = Finanzen.dispoRest();

    return `
      <div class="fin-kontostand ${stand < 0 ? "negativ" : ""}">
        <div class="fin-kontostand-titel">Kontostand</div>
        <div class="fin-kontostand-wert">${dm(stand)}</div>
        <div class="fin-kontostand-zusatz">
          ${stand < 0
            ? `Kontokorrent in Anspruch genommen · noch ${dm(dispoRest)} verfügbar`
            : `Kreditlinie ${dm(Kostensaetze.DISPOLINIE_DM)} zusätzlich verfügbar`}
        </div>
      </div>

      ${dispoRest < 10000 ? `
        <div class="fin-warnung">
          Die Kreditlinie ist fast ausgeschöpft. Ohne Zahlungseingang
          lassen sich bald keine Rechnungen mehr begleichen.
        </div>` : ""}

      ${laufend ? `
        <div class="fin-block">
          <div class="fin-block-titel">${laufend.name}</div>
          <dl class="fin-kennzahlen">
            <dt>Erlöse</dt><dd class="fin-positiv">${dm(laufend.summeErloes)}</dd>
            <dt>Aufwand</dt><dd class="fin-negativ">${dm(laufend.summeAufwand)}</dd>
            <dt>Ergebnis</dt>
            <dd class="${vorzeichenKlasse(laufend.ergebnis)}"><strong>${dm(laufend.ergebnis)}</strong></dd>
          </dl>
        </div>` : `
        <div class="fin-leer">Noch keine Buchungen.</div>`}

      ${vormonat ? `
        <div class="fin-block">
          <div class="fin-block-titel">${vormonat.name} (abgeschlossen)</div>
          <dl class="fin-kennzahlen">
            <dt>Ergebnis</dt>
            <dd class="${vorzeichenKlasse(vormonat.ergebnis)}">${dm(vormonat.ergebnis)}</dd>
          </dl>
        </div>` : ""}

      <div class="fin-block">
        <div class="fin-block-titel">Verbindlichkeiten</div>
        <dl class="fin-kennzahlen">
          <dt>Darlehen</dt><dd>${Finanzen.offeneKredite().length}</dd>
          <dt>Restschuld</dt><dd>${dm(restschuld)}</dd>
        </dl>
      </div>
    `;
  }

  function renderJournal() {
    const monate = Finanzen.monate();
    const monat = gewaehlterMonat || monate[0] || null;
    const liste = Finanzen.buchungen({ monat, konto: journalKonto });

    return `
      <div class="fin-filterleiste">
        <select class="fin-auswahl" id="fin-monat">
          ${monate.length === 0
            ? `<option>—</option>`
            : monate.map((m) => `
                <option value="${m}" ${m === monat ? "selected" : ""}>
                  ${Finanzen.monatsName(m)}
                </option>`).join("")}
        </select>
        <select class="fin-auswahl" id="fin-konto">
          <option value="">Alle Konten</option>
          ${Object.keys(Finanzen.KONTEN).map((nr) => `
            <option value="${nr}" ${String(journalKonto) === nr ? "selected" : ""}>
              ${nr} ${Finanzen.KONTEN[nr].name}
            </option>`).join("")}
        </select>
      </div>

      ${liste.length === 0
        ? `<div class="fin-leer">Keine Buchungen in dieser Auswahl.</div>`
        : `<ul class="fin-journal">
            ${liste.map((b) => `
              <li class="fin-buchung">
                <span class="fin-beleg">${b.beleg}</span>
                <span class="fin-datum">${datumKurz(b.datum)}</span>
                <span class="fin-konto">${b.konto}</span>
                <span class="fin-text">${b.text}</span>
                <span class="fin-betrag ${vorzeichenKlasse(b.betrag)}">${dm(b.betrag)}</span>
              </li>
            `).join("")}
          </ul>`}
    `;
  }

  function renderBwa() {
    const monate = Finanzen.monate();
    if (monate.length === 0) {
      return `<div class="fin-leer">Noch keine Buchungen.</div>`;
    }
    const monat = gewaehlterMonat || monate[0];
    const a = Finanzen.bwa(monat);

    return `
      <div class="fin-filterleiste">
        <select class="fin-auswahl" id="fin-monat">
          ${monate.map((m) => `
            <option value="${m}" ${m === monat ? "selected" : ""}>
              ${Finanzen.monatsName(m)}
            </option>`).join("")}
        </select>
      </div>

      <table class="fin-tabelle">
        <tbody>
          <tr class="fin-zeile-gruppe"><td colspan="2">Erlöse</td></tr>
          ${a.erloese.length === 0
            ? `<tr><td class="fin-zeile-leer" colspan="2">keine</td></tr>`
            : a.erloese.map((z) => `
                <tr>
                  <td>${z.konto} ${z.name}</td>
                  <td class="fin-zahl fin-positiv">${dm(z.betrag)}</td>
                </tr>`).join("")}
          <tr class="fin-zeile-summe">
            <td>Summe Erlöse</td>
            <td class="fin-zahl fin-positiv">${dm(a.summeErloes)}</td>
          </tr>

          <tr class="fin-zeile-gruppe"><td colspan="2">Aufwand</td></tr>
          ${a.aufwand.length === 0
            ? `<tr><td class="fin-zeile-leer" colspan="2">keiner</td></tr>`
            : a.aufwand.map((z) => `
                <tr>
                  <td>${z.konto} ${z.name}</td>
                  <td class="fin-zahl fin-negativ">${dm(z.betrag)}</td>
                </tr>`).join("")}
          <tr class="fin-zeile-summe">
            <td>Summe Aufwand</td>
            <td class="fin-zahl fin-negativ">${dm(a.summeAufwand)}</td>
          </tr>

          <tr class="fin-zeile-ergebnis">
            <td>Betriebsergebnis</td>
            <td class="fin-zahl ${vorzeichenKlasse(a.ergebnis)}">${dm(a.ergebnis)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  function renderFahrzeuge() {
    const zeilen = Finanzen.fahrzeugRechnung();
    if (zeilen.length === 0) {
      return `<div class="fin-leer">Kein Fahrzeug im Bestand.</div>`;
    }

    return `
      <p class="fin-hinweis">
        Erlöse und Kosten je Fahrzeug, seit es in der Buchhaltung
        geführt wird. Die Kilometer stammen aus den Buchungen, nicht
        vom Tacho — ein gebraucht gekauftes Fahrzeug bringt fremde
        Kilometer mit.
      </p>
      <ul class="fin-fahrzeugliste">
        ${zeilen.map((z) => `
          <li class="fin-fahrzeug">
            <div class="fin-fahrzeug-kopf">
              <span class="fin-flottenpunkt"
                    style="background:${Lackierung.cssFarbe(z.fahrzeug.lackierung)};
                           border-color:${Lackierung.cssFarbeDunkel(z.fahrzeug.lackierung)}"></span>
              <span class="fin-fahrzeug-kennzeichen">${z.fahrzeug.kennzeichen}</span>
              <span class="fin-fahrzeug-typ">${z.fahrzeug.marke} ${z.fahrzeug.modell}</span>
              <span class="fin-betrag ${vorzeichenKlasse(z.ergebnis)}">${dm(z.ergebnis)}</span>
            </div>
            <dl class="fin-kennzahlen fin-kennzahlen-eng">
              <dt>Gefahren</dt><dd>${z.km.toLocaleString("de-DE")} km</dd>
              <dt>Erlös</dt><dd class="fin-positiv">${dm(z.erloes)}</dd>
              <dt>Kosten</dt><dd class="fin-negativ">${dm(z.kosten)}</dd>
              <dt>Erlös je km</dt><dd>${z.erloesJeKm.toFixed(2)} DM</dd>
              <dt>Kosten je km</dt><dd>${z.kostenJeKm.toFixed(2)} DM</dd>
            </dl>
          </li>
        `).join("")}
      </ul>
    `;
  }

  function renderBank() {
    const kredite = Finanzen.offeneKredite();

    return `
      <div class="fin-block">
        <div class="fin-block-titel">Konditionen</div>
        <dl class="fin-kennzahlen">
          <dt>Diskontsatz</dt><dd>${Kostensaetze.diskontsatz().toFixed(2)} %</dd>
          <dt>Investitionskredit</dt><dd>${Kostensaetze.kreditzins().toFixed(2)} %</dd>
          <dt>Kontokorrent</dt><dd>${Kostensaetze.dispozins().toFixed(2)} %</dd>
          <dt>Kreditlinie</dt><dd>${dm(Kostensaetze.DISPOLINIE_DM)}</dd>
        </dl>
      </div>

      <div class="fin-block">
        <div class="fin-block-titel">Darlehen (${kredite.length})</div>
        ${kredite.length === 0
          ? `<div class="fin-leer">Keine laufenden Darlehen.</div>`
          : `<ul class="fin-kreditliste">
              ${kredite.map((k) => `
                <li class="fin-kredit">
                  <div class="fin-kredit-kopf">
                    <span class="fin-kredit-nr">Darlehen ${k.nr}</span>
                    <span class="fin-kredit-zweck">${k.zweck}</span>
                  </div>
                  <dl class="fin-kennzahlen fin-kennzahlen-eng">
                    <dt>Restschuld</dt><dd>${dm(k.restschuld)}</dd>
                    <dt>Ursprung</dt><dd>${dm(k.ursprung)}</dd>
                    <dt>Zins</dt><dd>${k.zinssatz.toFixed(2)} %</dd>
                    <dt>Tilgung</dt><dd>${dm(k.tilgungJeMonat)} je Monat</dd>
                  </dl>
                </li>
              `).join("")}
            </ul>`}
      </div>

      <div class="fin-block">
        <div class="fin-block-titel">Neues Darlehen</div>
        <p class="fin-hinweis">
          Ausgezahlt wird sofort aufs Konto. Zins und Tilgung laufen ab
          dem nächsten Monatsersten.
        </p>
        <div class="fin-formular">
          <label>Betrag
            <input type="number" id="fin-kredit-betrag" value="100000" step="10000" min="10000">
          </label>
          <label>Laufzeit
            <select id="fin-kredit-jahre">
              <option value="3">3 Jahre</option>
              <option value="5" selected>5 Jahre</option>
              <option value="7">7 Jahre</option>
            </select>
          </label>
          <button class="win98-button bevel-out" id="fin-btn-kredit">Aufnehmen</button>
        </div>
      </div>
    `;
  }

  function renderSaetze() {
    const angaben = Kostensaetze.angaben();
    const offen = angaben.filter((a) => !a.belegt).length;

    return `
      <p class="fin-hinweis">
        Woher die Zahlen kommen. ${offen} von ${angaben.length} Sätzen
        sind noch nicht belegt und damit vorläufig — sie stehen hier
        sichtbar, statt sich unter echten Werten zu verstecken.
        Einzelheiten und Quellen: <code>docs/kosten-1994.md</code>.
      </p>
      <ul class="fin-satzliste">
        ${angaben.map((a) => `
          <li class="fin-satz ${a.belegt ? "belegt" : "vorlaeufig"}">
            <div class="fin-satz-kopf">
              <span class="fin-satz-name">${a.name}</span>
              <span class="fin-satz-wert">${a.wert}</span>
            </div>
            <div class="fin-satz-quelle">
              <span class="fin-satz-marke">${a.belegt ? "belegt" : "vorläufig"}</span>
              ${a.quelle}
            </div>
          </li>
        `).join("")}
      </ul>
    `;
  }

  // ---------- Ereignisse ----------

  function neuZeichnen() {
    if (!fensterElement || !document.body.contains(fensterElement)) return;
    const koerper = fensterElement.querySelector(".win98-window-content");
    if (!koerper) return;
    koerper.innerHTML = renderInhalt();
    ereignisseBinden();
  }

  function ereignisseBinden() {
    const koerper = fensterElement.querySelector(".win98-window-content");
    if (!koerper) return;

    koerper.querySelectorAll("[data-ansicht]").forEach((el) => {
      el.addEventListener("click", () => {
        ansicht = el.dataset.ansicht;
        neuZeichnen();
      });
    });

    const monat = koerper.querySelector("#fin-monat");
    if (monat) {
      monat.addEventListener("change", () => {
        gewaehlterMonat = monat.value;
        neuZeichnen();
      });
    }

    const konto = koerper.querySelector("#fin-konto");
    if (konto) {
      konto.addEventListener("change", () => {
        journalKonto = konto.value ? Number(konto.value) : null;
        neuZeichnen();
      });
    }

    const kreditKnopf = koerper.querySelector("#fin-btn-kredit");
    if (kreditKnopf) {
      kreditKnopf.addEventListener("click", () => {
        const betrag = Number(koerper.querySelector("#fin-kredit-betrag").value);
        const jahre = Number(koerper.querySelector("#fin-kredit-jahre").value);
        if (!betrag || betrag < 10000) return;

        const zins = Kostensaetze.kreditzins();
        if (!window.confirm(
          `Darlehen über ${dm(betrag)} aufnehmen?\n\n` +
          `Laufzeit ${jahre} Jahre, Zins ${zins.toFixed(2)} %, ` +
          `Tilgung ${dm(betrag / (jahre * 12))} je Monat.`
        )) return;

        Finanzen.kreditAufnehmen({ betrag, laufzeitJahre: jahre, zweck: "Betriebsmittel" });
        Speicher.jetztSichern();
        neuZeichnen();
      });
    }
  }

  function open() {
    // Ohne laufende Uhr gäbe es keinen Monatsabschluss.
    TourenplanungApp.starten();

    const ergebnis = WindowManager.open({
      id: "finanzen",
      title: "Finanzen",
      content: renderInhalt()
    });

    fensterElement = ergebnis.element;
    if (ergebnis.wurdeNeuErstellt) ereignisseBinden();
    else neuZeichnen();
  }

  // Bei jeder Buchung nachziehen, solange das Fenster offen ist.
  Finanzen.beiAenderung(() => {
    if (fensterElement && document.body.contains(fensterElement)) neuZeichnen();
  });

  AppRegistry.register({
    id: "finanzen",
    name: "Finanzen",
    open
  });

  return { open, aktualisieren: neuZeichnen };
})();

document.addEventListener("DOMContentLoaded", () => {
  const icon = document.getElementById("icon-finanzen");
  if (icon) icon.addEventListener("click", () => FinanzenApp.open());
});
