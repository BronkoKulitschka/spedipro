// anzeige.js (Programm)
// "Eigenschaften von Anzeige" - das Fenster, in dem der Spieler
// Größe, Kontrast, Zeilendichte und Eingabeart einstellt.
//
// Es steht unter Einstellungen im Startmenü, nicht unter Programme:
// Es gehört zum nachgebauten Betriebssystem, nicht zur Spedition.
// In Windows 98 lag es genauso (Systemsteuerung - Anzeige), und die
// Registerkarten-Optik ist die des Originals.
//
// Warum es überhaupt existiert: docs/optik-und-bedienung.md verlangt
// an vier Stellen eine Einstellung statt einer Festlegung - Regel 30
// (Eingabemodus), 44 (Zeilendichte), 52 (200 Prozent) und die
// intermediate-Stufe der Game Accessibility Guidelines für den
// Kontrast. Ohne dieses Fenster sind diese Regeln nicht erfüllbar.

const AnzeigeApp = (function () {
  let fensterElement = null;
  let reiter = "darstellung";

  // ---------- Darstellung ----------

  function radiozeile(name, wert, aktiv, titel, hinweis) {
    return `
      <label class="anz-wahl${aktiv ? " anz-wahl-aktiv" : ""}">
        <input type="radio" name="${name}" value="${wert}" ${aktiv ? "checked" : ""}>
        <span class="anz-wahl-text">
          <span class="anz-wahl-titel">${titel}</span>
          <span class="anz-wahl-hinweis">${hinweis}</span>
        </span>
      </label>`;
  }

  function renderDarstellung(s) {
    return `
      <fieldset class="anz-gruppe bevel-in">
        <legend>Größe der Oberfläche</legend>
        <p class="anz-erklaerung">
          Die ganze Oberfläche hängt an einer Größe. Alles wächst
          gemeinsam, die Proportionen bleiben die des Originals.
        </p>
        ${Anzeige.SKALA_STUFEN.map((st) => radiozeile(
            "anz-skala", st.wert, Math.abs(s.skala - st.wert) < 0.001,
            st.name, st.hinweis)).join("")}
      </fieldset>

      <fieldset class="anz-gruppe bevel-in">
        <legend>Zeilenhöhe in Listen</legend>
        ${Anzeige.DICHTE_STUFEN.map((d) => radiozeile(
            "anz-dichte", d.wert, s.dichte === d.wert,
            d.name, d.hinweis)).join("")}
      </fieldset>
    `;
  }

  function renderKontrast(s) {
    return `
      <fieldset class="anz-gruppe bevel-in">
        <legend>Kontrast</legend>
        <p class="anz-erklaerung">
          Der 3D-Rand des Originals ist hellgrau auf grau. Er markiert,
          ob eine Schaltfläche gedrückt ist - und ist dabei so schwach,
          dass man ihn kaum sieht. Der hohe Kontrast macht die Kanten
          dunkler, ohne sie zu verbreitern oder zu verschieben.
        </p>
        <label class="anz-wahl${s.kontrast ? " anz-wahl-aktiv" : ""}">
          <input type="checkbox" id="anz-kontrast" ${s.kontrast ? "checked" : ""}>
          <span class="anz-wahl-text">
            <span class="anz-wahl-titel">Hoher Kontrast</span>
            <span class="anz-wahl-hinweis">Kanten von 1,4:1 auf über 3:1</span>
          </span>
        </label>
        <div class="anz-probe">
          <button class="win98-button bevel-out">Schaltfläche</button>
          <span class="anz-probe-feld bevel-in">Eingabefeld</span>
          <span class="anz-probe-hinweis">
            Probe: Ist der Rand beider Felder deutlich zu sehen?
          </span>
        </div>
      </fieldset>
    `;
  }

  function renderEingabe(s) {
    return `
      <fieldset class="anz-gruppe bevel-in">
        <legend>Eingabe</legend>
        <p class="anz-erklaerung">
          Eine Schaltflächengröße, die für Maus und Finger gleich gut
          passt, gibt es nicht. Die anfassbare Fläche ist deshalb
          getrennt von der sichtbaren: Am Finger wird sie größer, das
          Bild bleibt dasselbe.
        </p>
        ${radiozeile("anz-eingabe", "auto", s.eingabe === "auto",
            "Automatisch", "nach dem erkannten Zeigegerät")}
        ${radiozeile("anz-eingabe", "maus", s.eingabe === "maus",
            "Maus", "kleinere Schaltflächen, mehr passt aufs Bild")}
        ${radiozeile("anz-eingabe", "finger", s.eingabe === "finger",
            "Finger", "große Flächen mit Abstand zum Antippen")}
      </fieldset>
    `;
  }

  function renderInhalt() {
    const s = Anzeige.lesen();
    const reiterKnopf = (id, text) =>
      `<button class="anz-reiter${reiter === id ? " anz-reiter-aktiv" : ""}"
               data-reiter="${id}">${text}</button>`;

    const inhalt = reiter === "kontrast" ? renderKontrast(s)
                 : reiter === "eingabe" ? renderEingabe(s)
                 : renderDarstellung(s);

    return `
      <div class="anz-layout">
        <div class="anz-reiterleiste">
          ${reiterKnopf("darstellung", "Darstellung")}
          ${reiterKnopf("kontrast", "Kontrast")}
          ${reiterKnopf("eingabe", "Eingabe")}
        </div>
        <div class="anz-blatt bevel-out">
          ${inhalt}
        </div>
        <div class="anz-fusszeile">
          <span class="anz-fuss-hinweis">
            Diese Einstellungen liegen getrennt vom Spielstand. Sie
            überleben es, wenn ein Spielstand gelöscht wird.
          </span>
          <button class="win98-button bevel-out" id="anz-zurueck">Voreinstellung</button>
        </div>
      </div>
    `;
  }

  function neuZeichnen() {
    if (!fensterElement) return;
    const ziel = fensterElement.querySelector(".win98-window-content");
    if (!ziel) return;
    ziel.innerHTML = renderInhalt();
  }

  // ---------- Ereignisse ----------

  function ereignisseBinden() {
    fensterElement.addEventListener("click", (ereignis) => {
      const reiterKnopf = ereignis.target.closest("[data-reiter]");
      if (reiterKnopf) {
        reiter = reiterKnopf.dataset.reiter;
        neuZeichnen();
        return;
      }
      if (ereignis.target.closest("#anz-zurueck")) {
        Anzeige.zurueckSetzen();
        neuZeichnen();
      }
    });

    fensterElement.addEventListener("change", (ereignis) => {
      const el = ereignis.target;
      if (el.name === "anz-skala") Anzeige.skalaSetzen(el.value);
      else if (el.name === "anz-dichte") Anzeige.dichteSetzen(el.value);
      else if (el.name === "anz-eingabe") Anzeige.eingabeSetzen(el.value);
      else if (el.id === "anz-kontrast") Anzeige.kontrastSetzen(el.checked);
      else return;
      neuZeichnen();
    });
  }

  // ---------- Fenster ----------

  function open() {
    const ergebnis = WindowManager.open({
      id: "anzeige",
      title: "Eigenschaften von Anzeige",
      content: renderInhalt()
    });

    fensterElement = ergebnis.element;
    if (ergebnis.wurdeNeuErstellt) ereignisseBinden();
    else neuZeichnen();
  }

  return { open, neuZeichnen };
})();
