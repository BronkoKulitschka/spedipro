// auftraege.js
// Der Auftragspool - das Herzstück der Disposition.
//
// Angelehnt an das Vorgehen echter Speditionssoftware: Nicht der
// Disponent erfindet die Ladung, sondern es liegen Transportaufträge
// vor, die auf verfügbare Fahrzeuge verteilt werden. Jeder Auftrag
// bringt Ladestelle, Entladestelle, Ware, Menge, Zeitfenster,
// vereinbartes Entgelt und Anforderungen mit.
//
// Zwei Quellen:
//   Frachtbörse - anonyme Einzelaufträge, jederzeit verfügbar,
//                 niedrige Preise
//   Stammkunden - Aufträge von Auftraggebern, für die schon gefahren
//                 wurde; besser bezahlt (siehe kunden.js)
//
// Statuskette (wie in der Praxis):
//   offen -> disponiert -> unterwegs -> zugestellt -> abgerechnet
//   (dazu: storniert, wenn ein Auftrag verfällt)

const Auftraege = (function () {

  const STATUS = {
    offen: "offen",
    disponiert: "disponiert",
    unterwegs: "unterwegs",
    zugestellt: "zugestellt",
    abgerechnet: "abgerechnet",
    verfallen: "verfallen",
    // Angenommen und dann nicht gefahren. Anders als "verfallen", was
    // einen Auftrag trifft, den nie jemand genommen hat.
    geplatzt: "geplatzt"
  };

  // So viele Aufträge sollen in der Börse liegen. Darunter wird
  // nachgefüllt, damit immer etwas zu disponieren ist.
  const BOERSE_ZIEL = 24;

  // Wie lange ein Auftrag am Markt bleibt, bevor ihn jemand anders
  // nimmt (in Spieltagen ab Ladefenster-Ende).
  const VERFALL_TAGE = 2;

  // So viele offene Aufträge liegen mindestens an einem Ort, an dem
  // der Spieler steht (Depot oder Standplatz eines Wagens), und so
  // groß ist darüber hinaus der Ortsanteil beim Nachfüllen. Beides
  // gemessen eingestellt - siehe README zu 0.15.39.
  // So viele offene Auftraege liegen mindestens an JEDEM Ort, an dem
  // der Spieler steht (Depot und Standplatz jedes Wagens). Sechs statt
  // acht, weil es seit 0.15.42 je Ort gilt und nicht mehr in der
  // Summe: Bei wachsender Flotte staende sonst die halbe Boerse vor
  // der eigenen Tuer.
  const ORTS_MINDEST = 6;

  // Und so viele davon muss der KLEINSTE Wagen der Flotte auch laden
  // können. Ohne diese zweite Bedingung kann die Stadt voll und der
  // Spieler trotzdem handlungsunfähig sein.
  const ORTS_LADBAR = 2;

  // Und so gross ist darueber hinaus der Ortsanteil beim Nachfuellen.
  const ORTSANTEIL = 0.4;

  let naechsteNummer = 1000;
  const auftraege = [];
  const beobachter = [];

  function zufaelligAus(liste) {
    return liste[Math.floor(Math.random() * liste.length)];
  }

  /**
   * Erzeugt einen Auftrag zwischen zwei Städten, sofern die Ware dort
   * angeboten und gebraucht wird.
   * @param {object} [vorgabe] erzwingt Absender/Kunde (für Stammkunden)
   */
  /**
   * Die Städte, in denen der Spieler steht: sein Depot und jeder Ort,
   * an dem gerade ein Wagen parkt. Unterwegs befindliche Fahrzeuge
   * zählen nicht - dort kann niemand aufladen.
   */
  /**
   * Der kleinste Wagen der Flotte - das Maß, auf das eine Sendung
   * passen muss, damit der Spieler sie überhaupt annehmen kann.
   */
  function kleinsterWagen() {
    if (typeof FuhrparkApp === "undefined" || !FuhrparkApp.alleFahrzeuge) return null;
    const flotte = FuhrparkApp.alleFahrzeuge();
    if (!flotte.length) return null;
    return flotte.reduce((a, b) =>
      (a.zuladungKg || 24000) <= (b.zuladungKg || 24000) ? a : b);
  }

  function eigeneOrte() {
    const namen = new Set();
    if (typeof Betrieb !== "undefined" && Betrieb.hatDepot()) {
      namen.add(Betrieb.depotName());
    }
    if (typeof FuhrparkApp !== "undefined" && FuhrparkApp.alleFahrzeuge) {
      FuhrparkApp.alleFahrzeuge().forEach((f) => {
        if (f.standort) namen.add(f.standort);
      });
    }
    return [...namen].map((n) => STAEDTE[n]).filter(Boolean);
  }

  function erzeugen(vorgabe = {}) {
    const staedte = Karte.alleStaedte();

    let von = vorgabe.von || zufaelligAus(staedte);
    const angebot = Wirtschaft.angebot(von);
    if (angebot.length === 0) return null;

    // Auf ein bestimmtes Fahrzeug zugeschnitten? Dann kommt nur Ware
    // in Frage, die sein Aufbau überhaupt aufnimmt. Ohne diese Zeile
    // bekam der Kastenwagen Aufträge über Heizöl und Schüttgut - vom
    // Gewicht passend zugeschnitten und trotzdem unladbar.
    const wahl = vorgabe.fuer && typeof Ladung !== "undefined"
      ? angebot.filter((g) => Ladung.kannLaden(vorgabe.fuer, g))
      : angebot;
    if (wahl.length === 0) return null;

    // Ist die Sendung auf ein Fahrzeug zugeschnitten, wird nicht EINE
    // Ware gewürfelt, sondern der Reihe nach probiert.
    //
    // Der Unterschied: Eine Ware, die in Reichweite niemand braucht,
    // lässt erzeugen() ins Leere laufen. Bei einem einzigen Wurf
    // scheiterte der Versuch dann, obwohl eine andere Ware derselben
    // Stadt gegangen wäre - gemessen als Stadt ohne ladbare Fracht in
    // 1 von 15 Ankunftsorten und in bis zu einem Drittel der Städte
    // beim wahllosen Umsetzen.
    if (!vorgabe.gut && vorgabe.fuer && wahl.length > 1) {
      const reihe = wahl.slice().sort(() => Math.random() - 0.5);
      for (const kandidat of reihe) {
        const versuch = erzeugen({ ...vorgabe, gut: kandidat });
        if (versuch) return versuch;
      }
      return null;
    }

    const gut = vorgabe.gut || zufaelligAus(wahl);

    // Menge zuerst, denn sie entscheidet über die Entfernung.
    //
    // Bis 0.15.38 war jede Sendung eine Teil- oder Komplettladung
    // zwischen 3 und 25 t - das passte zu einem Markt, in dem nur
    // Sattelzüge fahren. Nach ANZAHL überwiegen in Wirklichkeit die
    // kleinen Sendungen deutlich: Eine Komplettladung ist ein Auftrag,
    // Stückgut sind hunderte. Nach TONNAGE ist es umgekehrt.
    //
    // Gewürfelt wird das RAUMMASS, nicht das Gewicht. Eine Sendung ist
    // in der Praxis eine Zahl von Palettenplätzen; was darauf steht,
    // entscheidet erst danach über die Tonnage. Über das Gewicht zu
    // würfeln ging schief: 1,4 t Dämmstoff sind 28 m³ und passen in
    // keinen 3,5-Tonner - der Auftrag sah klein aus und war es nicht.
    // Eine Europalette misst rund 1,5 m³ bei üblicher Stapelhöhe.
    const PALETTE_M3 = 1.5;
    // Eine Palette wird nicht schwerer beladen, als Rampe, Hubwagen
    // und Palette selbst vertragen - rund eine Tonne. Ohne diesen
    // Deckel wog eine Palette Stahlblech 3,75 t, und "fünf Paletten
    // Stückgut" wären 19 t gewesen.
    const PALETTE_MAX_KG = 1000;
    const wurf = Math.random();
    let plaetze;
    if (wurf < 0.55) {
      // Stückgut: ein bis fünf Paletten. Sache des Transporters.
      plaetze = 1 + Math.floor(Math.random() * 5);
    } else if (wurf < 0.85) {
      // Teilladung: ein knappes Drittel bis halber Auflieger
      plaetze = 6 + Math.floor(Math.random() * 20);
    } else {
      // Komplettladung
      plaetze = 30 + Math.floor(Math.random() * 30);
    }
    const maxTonnen = Math.min(25, (90 * gut.dichteKgProM3) / 1000);
    const jePalette = Math.min(PALETTE_M3 * gut.dichteKgProM3, PALETTE_MAX_KG);
    let tonnen = (plaetze * jePalette) / 1000;
    tonnen = Math.round(Math.min(tonnen, maxTonnen) * 10) / 10;
    if (tonnen < 0.1) tonnen = 0.1;

    // Auf ein bestimmtes Fahrzeug zugeschnitten? Dann die Sendung
    // darauf zurechtschneiden - in Raum UND Gewicht. Damit lässt
    // sich eine Börse bestellen, in der für die eigene Flotte
    // etwas dabei ist.
    if (vorgabe.fuer && typeof Ladung !== "undefined") {
      const deckelT = Ladung.maxMengeTonnen(vorgabe.fuer, gut);
      if (deckelT > 0) {
        tonnen = Math.round(Math.min(tonnen, deckelT) * 10) / 10;
        if (tonnen < 0.1) tonnen = 0.1;
      }
    }

    // Empfänger: eine Stadt, die diese Ware braucht und erreichbar ist.
    const moegliche = staedte.filter(
      (s) => s.name !== von.name && Wirtschaft.bedarf(s).some((g) => g.id === gut.id)
    );
    if (moegliche.length === 0) return null;

    const nahe = moegliche
      .map((s) => ({ s, km: Karte.luftlinie(von, s) }))
      .sort((a, b) => a.km - b.km);

    // Die Entfernung hängt an der Sendungsgröße. Ein Karton
    // Ersatzteile geht in den Nachbarkreis, nicht nach Neapel; eine
    // Komplettladung rechtfertigt den langen Lauf. Bis 0.15.39 wurde
    // für jede Sendung aus denselben nächstgelegenen zwei Dritteln
    // gewürfelt - deshalb bekam der 1,4-Tonner einen Auftrag über
    // 3.780 km angeboten.
    //
    // Gewählt wird über einen RADIUS, nicht über einen Anteil der
    // Liste. Ein Anteil hilft nicht, wenn nur fünf Städte in ganz
    // Europa diese Ware brauchen: Die nächstgelegenen zwölf Prozent
    // davon können immer noch achthundert Kilometer entfernt liegen.
    // Liegt im Radius nichts, wird er verdoppelt, bis etwas darin
    // liegt - die Sendung geht dann eben doch weit, aber als Ausnahme.
    //
    // Das ist zugleich die Vorstufe zur 50-km-Nahverkehrsgrenze aus
    // dem Lizenzkapitel: Sie verbietet noch nichts, aber sie sorgt
    // dafür, dass in Reichweite überhaupt etwas liegt.
    // Die Werte sind an der Dichte des Städtenetzes gemessen, nicht
    // geraten: Im Umkreis von Hamburg liegen 4 Städte bis 250 km,
    // 12 bis 400 km, 27 bis 600 km, 45 bis 800 km. Mit 250 km ging
    // jede Transportersendung nach Hannover und sonst nirgendwohin.
    let radius = tonnen <= 1.5 ? 400 : tonnen <= 8 ? 900 : 2000;
    let auswahl = [];
    while (auswahl.length === 0 && radius < 6000) {
      auswahl = nahe.filter((x) => x.km <= radius);
      radius *= 2;
    }
    if (auswahl.length === 0) auswahl = nahe.slice(0, 3);
    const nach = (vorgabe.nach ? { s: vorgabe.nach } : zufaelligAus(auswahl)).s;

    const route = Route.berechne(von.name, nach.name);
    if (!route) return null;

    const kunde = vorgabe.kunde || Kunden.fuer(von, gut.kategorie);
    const grundpreis = Ladung.frachtpreis(gut, tonnen, route.km);

    // Börsenaufträge sind gedrückt, Kundenaufträge bringen Aufschlag.
    const faktor = vorgabe.kunde
      ? Kunden.preisfaktor(kunde)
      : 0.82 + Math.random() * 0.12;

    // Zeitfenster: Ladung steht in den nächsten Tagen bereit, die
    // Lieferfrist berücksichtigt die reine Fahrzeit plus Puffer.
    const jetzt = Spielzeit.heute();
    const ladeBeginn = new Date(jetzt.getTime());
    // Ein guter Teil der Börse ist SOFORT abholbereit, der Rest steht
    // in den nächsten anderthalb Tagen bereit.
    //
    // Bis 0.15.40 lag jedes Ladefenster in der Zukunft (0 bis 36
    // Stunden). Solange die Fahrt das Fenster ignorierte, fiel das
    // nicht auf. Seit sie wartet, schon: Gemessen am ersten Spieltag
    // war kein einziger der acht Aufträge im Depot sofort ladbar, der
    // Wagen stand im Schnitt 19 Stunden herum, ehe er losfuhr. Nach
    // einem Tag Spielzeit war das Problem von selbst weg, weil die
    // Börse altert - aber die erste Tour eines neuen Spiels stand
    // still, und das ist der schlechtestmögliche Augenblick dafür.
    //
    // Eine Börse, auf der nichts sofort verfügbar ist, ist ohnehin
    // unrealistisch: Ein Teil der Ware steht schon an der Rampe.
    if (!vorgabe.sofortBereit && Math.random() >= 0.4) {
      ladeBeginn.setHours(ladeBeginn.getHours() + 1 + Math.round(Math.random() * 35));
    }
    const ladeEnde = new Date(ladeBeginn.getTime());
    ladeEnde.setHours(ladeEnde.getHours() + 24 + Math.round(Math.random() * 24));

    const fahrStunden = route.km / Fahrt.SCHNITT_STANDARD;
    const ruheStunden = Math.floor(fahrStunden / Fahrt.LENKZEIT_STUNDEN) * Fahrt.RUHEZEIT_STUNDEN;
    const lieferFrist = new Date(ladeEnde.getTime());
    lieferFrist.setHours(
      lieferFrist.getHours() + Math.ceil((fahrStunden + ruheStunden) * (1.15 + Math.random() * 0.35))
    );

    const auftrag = {
      nummer: `A-${naechsteNummer++}`,
      status: STATUS.offen,
      quelle: vorgabe.kunde ? "kunde" : "boerse",
      kundeId: kunde.id,
      kundeName: kunde.name,
      vonName: von.name,
      nachName: nach.name,
      gutId: gut.id,
      tonnen,
      km: route.km,
      entgelt: Math.round(grundpreis * faktor),
      // Woraus der Preis entstanden ist. Der Listenpreis kommt aus
      // der Gewichts- und Entfernungsstaffel (Ladung.aufschluesselung),
      // der Faktor ist das, was der Markt daraus macht: Die Börse
      // drückt, ein Stammkunde zahlt mehr. Beides wird mitgeführt,
      // damit die Anzeige den Preis nachrechnen kann, statt ihn zu
      // schätzen - der Faktor ist gewürfelt und ließe sich nachher
      // nicht mehr rekonstruieren.
      listenpreis: grundpreis,
      preisfaktor: faktor,
      ladeBeginn: ladeBeginn.toISOString(),
      ladeEnde: ladeEnde.toISOString(),
      lieferFrist: lieferFrist.toISOString(),
      angelegtAm: jetzt.toISOString(),
      fahrzeugId: null,
      zugestelltAm: null,
      puenktlich: null
    };

    auftraege.push(auftrag);
    return auftrag;
  }

  /** Füllt die Börse auf und lässt abgelaufene Aufträge verfallen. */
  function auffrischen() {
    const jetzt = Spielzeit.heute();

    // Verfallene aussortieren
    auftraege.forEach((a) => {
      if (a.status !== STATUS.offen) return;
      const grenze = new Date(a.ladeEnde);
      grenze.setDate(grenze.getDate() + VERFALL_TAGE);
      if (jetzt > grenze) a.status = STATUS.verfallen;
    });

    // Stammkunden melden sich zuerst
    Kunden.mitBindung().forEach((kunde) => {
      const offeneVonKunde = offene().filter((a) => a.kundeId === kunde.id).length;
      const soll = Kunden.stufe(kunde).angebote;
      const stadt = STAEDTE[kunde.stadt];
      if (!stadt) return;
      for (let i = offeneVonKunde; i < soll; i++) {
        erzeugen({ von: stadt, kunde });
      }
    });

    // Ein Teil der Börse liegt vor der eigenen Haustür.
    //
    // Bis 0.15.39 würfelte erzeugen() den Versandort gleichverteilt
    // über rund neunzig Städte. Bei 24 offenen Aufträgen lag im
    // eigenen Depot im Schnitt 0,3 davon - gemessen über zwölf
    // Neustarts in Hamburg: sechs Aufträge an der Marke, davon 5,8 für
    // den 3,5-Tonner gesperrt. In neun von zwölf Spielen konnte der
    // Wagen am ersten Tag nichts laden, was in seinem Depot lag. Mit
    // dem 24-Tonner fiel das nicht auf, der konnte alles nehmen.
    //
    // Der Grund ist kein Spielbalance-Argument: Ein Spediteur ist in
    // seiner Stadt bekannt. Die Verlader dort rufen ihn an, bevor sie
    // eine Börse bemühen. Dass in Palermo ebenso viel für ihn bereit
    // liegt wie vor seinem Tor, war die unrealistische Annahme.
    // Zwei Regeln statt einer Quote. Eine Quote allein hätte am ersten
    // Spieltag nichts genützt: Da steht die Börse schon voll, bevor der
    // Spieler sein Depot überhaupt gewählt hat, und nachgefüllt wird
    // erst, wenn etwas verfällt.
    const eigene = eigeneOrte();
    let versuche = 0;

    // Erstens: Vor JEDER eigenen Tür liegt etwas - je Ort gezählt, nicht
    // über alle zusammen.
    //
    // Bis 0.15.41 wurde die Mindestzahl über die Summe aller eigenen
    // Orte gebildet. Das Depot allein erfüllte sie, und ein Wagen, der
    // nach einer Tour in Leipzig stand, bekam dort NULL Aufträge.
    // Gemessen über dreißig Spieltage: Der Transporter stand zwischen
    // 278 und 710 von 720 Stunden still, weil am Ankunftsort nichts
    // lag. Das ist der Unterschied zwischen einem Spiel, in dem man
    // wählt, und einem, in dem man wartet.
    const klein = kleinsterWagen();
    eigene.forEach((ort) => {
      const ausOrt = () => offene().filter((a) => a.vonName === ort.name);
      const ladbar = () => !klein || typeof Ladung === "undefined"
        ? ausOrt()
        : ausOrt().filter((a) => Ladung.passtDazu(klein, [], gut(a), a.tonnen).passt);

      let ortsversuche = 0;
      while ((ausOrt().length < ORTS_MINDEST || ladbar().length < ORTS_LADBAR)
             && ortsversuche < ORTS_MINDEST * 8) {
        ortsversuche++;

        // Fehlt es an LADBARER Fracht, wird gezielt für den kleinsten
        // Wagen erzeugt; fehlt es nur an Menge, ungeschnitten.
        //
        // Der Unterschied ist nicht akademisch. Bis 0.15.42 zählte die
        // Schleife alle Aufträge der Stadt, auch solche, die der
        // Wagen gar nicht laden kann. Scheiterten die zugeschnittenen
        // (weil die Ware nirgends gebraucht wird), standen am Ende
        // sechs unbrauchbare da, und der Spieler hatte nichts zu
        // wählen - gemessen in 3 von 15 Ankunftsorten.
        const vorgabe = { von: ort };
        if (klein && ladbar().length < ORTS_LADBAR) vorgabe.fuer = klein;

        // Der allererste Auftrag an einem Ort steht SOFORT bereit.
        // Ohne das begann rund jedes fünfte Spiel damit, dass der
        // Wagen wartet: Drei ladbare Aufträge mit je 40 % sofortiger
        // Bereitschaft ergeben 0,6³ = 22 % Fehlanzeige. Regel 30 aus
        // docs/spieldesign.md verlangt, dass der Spieler in der ersten
        // Stunde einen ganzen Kreislauf erlebt.
        if (ausOrt().length === 0) vorgabe.sofortBereit = true;

        erzeugen(vorgabe);
      }
    });

    // Zweitens: Der Rest füllt auf, mit einem Übergewicht auf die
    // eigenen Orte - der Spediteur ist in seiner Stadt bekannt.
    versuche = 0;
    while (offene().length < BOERSE_ZIEL && versuche < BOERSE_ZIEL * 4) {
      const ortsnah = eigene.length > 0 && Math.random() < ORTSANTEIL;
      erzeugen(ortsnah ? { von: zufaelligAus(eigene) } : {});
      versuche++;
    }

    benachrichtigen();
  }

  // ---------- Abfragen ----------

  function offene() {
    return auftraege.filter((a) => a.status === STATUS.offen);
  }

  function laufende() {
    return auftraege.filter(
      (a) => a.status === STATUS.disponiert || a.status === STATUS.unterwegs
    );
  }

  function abgeschlossene() {
    return auftraege.filter(
      (a) => a.status === STATUS.zugestellt || a.status === STATUS.abgerechnet
    );
  }

  /**
   * Offene Frachten ab einer Stadt. Erzeugt bei Bedarf welche nach.
   *
   * Grund: Ein globaler Pool von zwei Dutzend Aufträgen verteilt sich
   * auf 165 Städte - fast jede wäre leer. Aus Sicht des Spielers bietet
   * aber jede Stadt Ladung an, die dort erzeugt wird. Die Aufträge
   * werden einmal erzeugt und bleiben dann bestehen, damit die Liste
   * nicht bei jedem Blick anders aussieht.
   */
  function fuerStadt(stadt, mindestens = 6) {
    let vorhandene = offene().filter((a) => a.vonName === stadt.name);

    let versuche = 0;
    while (vorhandene.length < mindestens && versuche < mindestens * 4) {
      const neu = erzeugen({ von: stadt });
      if (neu) vorhandene.push(neu);
      versuche++;
    }
    return vorhandene;
  }

  function nachNummer(nummer) {
    return auftraege.find((a) => a.nummer === nummer) || null;
  }

  function gut(auftrag) {
    return GUETER_NACH_ID[auftrag.gutId];
  }

  // ---------- Statuswechsel ----------

  function disponieren(auftrag, fahrzeug) {
    auftrag.status = STATUS.disponiert;
    auftrag.fahrzeugId = fahrzeug.id;
    benachrichtigen();
  }

  function beginnen(auftrag) {
    auftrag.status = STATUS.unterwegs;
    benachrichtigen();
  }

  function zustellen(auftrag) {
    const jetzt = Spielzeit.heute();
    auftrag.status = STATUS.zugestellt;
    auftrag.zugestelltAm = jetzt.toISOString();
    auftrag.puenktlich = jetzt <= new Date(auftrag.lieferFrist);

    const kunde = Kunden.alle().find((k) => k.id === auftrag.kundeId);
    if (kunde) {
      Kunden.auftragErledigt(kunde, {
        puenktlich: auftrag.puenktlich,
        entgelt: auftrag.entgelt
      });
    }
    benachrichtigen();
    return auftrag;
  }

  function freigeben(auftrag) {
    // Disposition rückgängig machen, z.B. wenn ein Fahrzeug ausfällt
    auftrag.status = STATUS.offen;
    auftrag.fahrzeugId = null;
    benachrichtigen();
  }

  /**
   * Ein angenommener Auftrag wird nicht gefahren.
   *
   * Das ist etwas anderes als eine verspätete Zustellung: Der Verlader
   * hat die Ware bereitgestellt und steht jetzt da. Die Beziehung
   * trägt den Schaden wie bei einer Verspätung - nur dass es keinen
   * Erlös gibt, der ihn aufwiegt.
   */
  function platzenLassen(auftrag) {
    auftrag.status = STATUS.geplatzt;
    auftrag.fahrzeugId = null;
    auftrag.puenktlich = false;

    const kunde = Kunden.alle().find((k) => k.id === auftrag.kundeId);
    if (kunde) {
      Kunden.auftragErledigt(kunde, { puenktlich: false, entgelt: 0 });
    }
    benachrichtigen();
    return auftrag;
  }

  /**
   * Wann dieser Auftrag vom Markt verschwindet. Nach dem Ladefenster
   * bleibt er noch VERFALL_TAGE liegen, dann nimmt ihn jemand anders.
   */
  function verfallAm(auftrag) {
    const grenze = new Date(auftrag.ladeEnde);
    grenze.setDate(grenze.getDate() + VERFALL_TAGE);
    return grenze;
  }

  /**
   * Wie viel von der Standzeit eines Auftrags noch übrig ist, als
   * Anteil zwischen 0 und 1. Grundlage für die Ablaufanzeige in der
   * Auftragsliste.
   */
  function restanteil(auftrag) {
    const jetzt = Spielzeit.heute().getTime();
    const angelegt = new Date(auftrag.angelegtAm).getTime();
    const ende = verfallAm(auftrag).getTime();
    if (ende <= angelegt) return 0;
    return Math.max(0, Math.min(1, (ende - jetzt) / (ende - angelegt)));
  }

  /** Verbleibende Stunden bis zum Verfall. */
  function restStunden(auftrag) {
    const ms = verfallAm(auftrag).getTime() - Spielzeit.heute().getTime();
    return Math.max(0, Math.round(ms / 3600000));
  }

  // ---------- Hilfen für die Disposition ----------

  /**
   * Bleibt genug Zeit, den Auftrag rechtzeitig zuzustellen?
   *
   * @param {object} auftrag
   * @param {string} abStadtName  Wo das Fahrzeug losfährt
   * @param {Date} [abZeit]       Wann es dort losfährt. Voreingestellt
   *   ist jetzt; bei einer Anschlussfracht ist es der Zeitpunkt, zu dem
   *   das Fahrzeug den vorigen Stopp verlässt. Nur damit lässt sich
   *   vorausplanen, ohne zu raten.
   */
  function terminMachbar(auftrag, abStadtName, abZeit) {
    const anfahrt = Route.berechne(abStadtName, auftrag.vonName);
    const hauptlauf = Route.berechne(auftrag.vonName, auftrag.nachName);
    if (!anfahrt || !hauptlauf) return null;

    const start = abZeit ? new Date(abZeit) : Spielzeit.heute();

    const ladeAnkunft = new Date(start.getTime());
    ladeAnkunft.setHours(ladeAnkunft.getHours() + Math.ceil(dauerStunden(anfahrt.km)));

    // An der Rampe wird geladen und am Ziel abgeladen - beides kostet
    // Zeit und gehört in jede Terminrechnung.
    const standLaden = typeof Kostensaetze !== "undefined"
      ? Kostensaetze.standzeit("laden", "standard") : 0;
    const standAbladen = typeof Kostensaetze !== "undefined"
      ? Kostensaetze.standzeit("abladen", "standard") : 0;

    // Vor dem Ladefenster muss gewartet werden - die Ware steht noch
    // nicht bereit. Danach ist der Verlader weg.
    const ladeBeginn = new Date(auftrag.ladeBeginn);
    const ladeEnde = new Date(auftrag.ladeEnde);
    const wartet = ladeAnkunft < ladeBeginn;
    const abfahrt = wartet ? new Date(ladeBeginn.getTime()) : new Date(ladeAnkunft.getTime());
    const ladefensterVerpasst = ladeAnkunft > ladeEnde;

    const ankunft = new Date(abfahrt.getTime()
      + (standLaden + dauerStunden(hauptlauf.km) + standAbladen) * 3600000);

    return {
      anfahrtKm: anfahrt.km,
      hauptlaufKm: hauptlauf.km,
      gesamtKm: anfahrt.km + hauptlauf.km,
      ladeAnkunft,
      wartet,
      wartestunden: wartet
        ? Math.round((ladeBeginn - ladeAnkunft) / 3600000)
        : 0,
      ladefensterVerpasst,
      ankunft,
      puenktlich: !ladefensterVerpasst && ankunft <= new Date(auftrag.lieferFrist),
      stundenPuffer: Math.round(
        (new Date(auftrag.lieferFrist) - ankunft) / 3600000
      )
    };
  }

  /** Reine Fahrzeit einer Strecke samt vorgeschriebener Ruhezeiten. */
  function dauerStunden(km) {
    const fahrStunden = km / Fahrt.SCHNITT_STANDARD;
    const ruhe = Math.floor(fahrStunden / Fahrt.LENKZEIT_STUNDEN) * Fahrt.RUHEZEIT_STUNDEN;
    return fahrStunden + ruhe;
  }

  function beiAenderung(rueckruf) { beobachter.push(rueckruf); }
  function benachrichtigen() { beobachter.forEach((r) => r()); }

  function alle() { return auftraege.slice(); }

  /**
   * Nimmt einen fertig gebauten Auftrag in den Pool auf. Gebraucht für
   * Spotladungen: Die entstehen nicht am Markt, sondern in dem Moment,
   * in dem der Disponent Ware und Ziel selbst festlegt. Ab dann läuft
   * die übliche Statuskette darüber.
   */
  function aufnehmen(auftrag) {
    auftraege.push(auftrag);
    benachrichtigen();
    return auftrag;
  }

  /** Gespeicherte Aufträge übernehmen. */
  function setzen(liste) {
    auftraege.length = 0;
    (liste || []).forEach((a) => auftraege.push({ ...a }));

    // Nummernkreis fortsetzen, damit keine Nummer doppelt vergeben wird
    auftraege.forEach((a) => {
      const nummer = Number(String(a.nummer).replace("A-", ""));
      if (!Number.isNaN(nummer) && nummer >= naechsteNummer) naechsteNummer = nummer + 1;
    });
    benachrichtigen();
  }

  return {
    STATUS,
    BOERSE_ZIEL,
    erzeugen,
    auffrischen,
    offene,
    fuerStadt,
    laufende,
    abgeschlossene,
    nachNummer,
    aufnehmen,
    gut,
    disponieren,
    beginnen,
    zustellen,
    freigeben,
    platzenLassen,
    terminMachbar,
    verfallAm,
    dauerStunden,
    restanteil,
    restStunden,
    beiAenderung,
    alle,
    setzen
  };
})();
