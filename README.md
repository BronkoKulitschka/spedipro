# SpediPro 95

Speditions-Manager-Simulator als PWA. Läuft auf Smartphone, Tablet und Desktop.

Karte, Routing, Kostenberechnung, Fuhrpark, Auftragsbörse, Sammelladung mit
drei Planungsstufen, **Hauptmenü**.

## Loslegen

```bash
npm install
npm run dev
```

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Typprüfung und Produktionsbau |
| `npm run preview` | Gebautes Ergebnis lokal ansehen |
| `npm run check` | Nur Typprüfung |
| `npm run test:core` | Routing und Kalkulation im Terminal prüfen |
| `npm run test:orders` | Auftragsgenerierung prüfen |
| `npm run test:state` | Spielzustand und Wirtschaftlichkeit prüfen |
| `npm run test:tour` | Sammelladung und Kapazitätsprüfung |

## Veröffentlichen

`.github/workflows/deploy.yml` baut bei jedem Push auf `main` und
veröffentlicht auf GitHub Pages. Einmalig einzurichten:

**Settings → Pages → Source: GitHub Actions**

Der Basispfad wird automatisch aus dem Repository-Namen gesetzt. Es muss
nichts angepasst werden.

## Aufbau

```
src/
  core/          Simulationskern - kennt weder Preact noch das DOM
    types.ts     Datentypen
    economy.ts   Wirtschaftliche Kennwerte, Lenk- und Ruhezeiten
    routing.ts   Graph, Dijkstra, Tourberechnung
    cargo.ts     Frachtkatalog: 40 Arten mit Dichte und Anforderungen
    fleet.ts     Fahrzeugmodelle, Auflieger, Zustand, Restwert
    orders.ts    Auftragsgenerierung mit gesätem Zufall
    state.ts     Spielzustand, Startfuhrpark, Auftragsbörse
    tour.ts      Sammelladung: Stoppfolgen, Kapazitäten, Planungsheuristik
    data.ts      Laden, Projektion, Formatierung
  ui/            Anzeigeschicht
    win95.tsx    Fenster, Schaltflächen, Rahmen, Kennzahlen
    MapCanvas.tsx     Karte auf Canvas
    TourPlanner.tsx   Tourenplanung mit Sammelladung
    MainMenu.tsx      Hauptmenü
    StaticMap.tsx     Unbewegliche Übersichtskarte
    PixelText.tsx     Pixelschrift als Bauteil
    pixelFont.ts      5×7-Bitmapschrift, selbst gezeichnet
    FleetView.tsx     Fuhrpark
    OrderBoard.tsx    Auftragsbörse
    serviceWorker.tsx  Anmeldung und Aktualisierungshinweis
  styles/
    win95.css    Farben und Kantenprofile
public/
  sw.js          Service Worker
  manifest.webmanifest
  icons/         App-Symbole
  assets/tiles/  Platzhalter-Symbole des Hauptmenüs (austauschbar)
  data/
    cities.json  289 Städte
    roads.json   958 Strecken
```

**Der Simulationskern kennt die Anzeigeschicht nicht.** Er bekommt Daten und
gibt Ergebnisse zurück. Dadurch läuft derselbe Code später unverändert in der
Standalone-Version und lässt sich ohne Browser testen.

## Sammelladung

Ein Auftrag ist keine Fahrt, sondern zwei Punkte: aufnehmen und abliefern.
Eine Tour ist eine Folge solcher Punkte, und der Laderaum muss an **jedem
einzelnen Punkt** reichen.

Drei Grenzen, die gleichzeitig gelten. Voll ist der Auflieger, sobald eine
davon erreicht ist:

| Grenze | Sattelzug | Erreicht zuerst bei |
|---|---|---|
| Gewicht | 24 t | Stahl, Baustoffe, Getränke |
| Volumen | 90 m³ | Möbel, Textilien, Verpackungen |
| Lademeter | 13,6 LDM | Palettenware, nicht Stapelbarem |

Die Automatik erreicht bewusst nicht das Optimum. Sie sucht keine eleganten
Ketten und wartet nie auf ein besseres Angebot — die letzten zehn bis fünfzehn
Prozent holt nur heraus, wer selbst plant.

## Symbole austauschen

Die Symbole im Hauptmenü sind Platzhalter. Sie liegen unter
`public/assets/tiles/` und werden nur über den Dateinamen angesprochen.
Eine neue Datei mit gleichem Namen und 96 × 64 Pixel ersetzt sie, ohne dass
im Code etwas geändert werden muss. `update.sh` bewahrt eigene Dateien in
diesem Ordner bei einem Update.

## Zwei Regeln

**Nichts ist Dekoration.** Jeder Button hat eine Funktion, jede Zahl stammt aus
einer Berechnung. Eine Wirtschaftszahl im Anzeigecode ist ein Fehler — alle
Kennwerte stehen ausschließlich in `core/economy.ts`.

**Was nicht funktioniert, erscheint nicht.** Deshalb gibt es in Stufe 2 vier
Fenster. Die Oberfläche wächst mit dem Funktionsumfang.

## Offline und Aktualisierung

Die App läuft als PWA und lässt sich zum Startbildschirm hinzufügen.

Der Service Worker holt Seitenaufrufe **immer erst aus dem Netz** und nur
im Notfall aus dem Cache. Dadurch gibt es das Problem nicht mehr, dass eine
gespeicherte `index.html` auf Asset-Namen zeigt, die nach einem neuen Build
nicht mehr existieren.

Steht eine neue Fassung bereit, erscheint unten eine Leiste. Übernommen wird
erst auf Klick — sonst könnte mitten in einer Tourenplanung neu geladen
werden.

Die Cache-Version hängt an `version` in der `package.json`. **Bei jeder
Veröffentlichung die Versionsnummer erhöhen**, sonst merkt der Browser nicht,
dass sich der Service Worker geändert hat.

## Bedienung

- In den Aufträgen „Zur Tour hinzufügen" lädt eine Ladung auf den LKW
- Stadt auf der Karte antippen filtert die Auftragsliste auf diese Stadt
- Drei Planungsstufen: Automatik, Assistiert, Manuell — pro Tour umschaltbar
- „Aktualisieren" rückt einen Spieltag vor und erzeugt neue Aufträge
- Ziehen verschiebt die Karte, Mausrad oder zwei Finger zoomen
- Fenster lassen sich verschieben, in der Größe ändern, minimieren und maximieren
- Unter 860 px Breite schaltet die Oberfläche auf die mobile Ansicht um

## Nächste Ausbaustufen

| Stufe | Inhalt |
|---|---|
| 3 | Tourenplanung mit Sammelladung — dann ist der Kern-Loop spielbar |
| 4 | Zeitsystem, laufende Touren, Zwischenfälle |
| 5 | Personal, Lenkzeiten, Kassenbuch |
| 6 | Werkstatt, Kunden, Konkurrenz, Statistik |
