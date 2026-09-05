# SpediPro 95

Speditions-Manager-Simulator als PWA. Läuft auf Smartphone, Tablet und Desktop.

Die Oberfläche ist ein virtueller Rechner im Stil von **Windows 98**:
Symbole auf der Arbeitsfläche, Startleiste mit Startmenü und Uhr, und für
jedes Modul ein eigenes Programmfenster mit eigener Menüleiste.

Vorhanden: Karte, Routing, Kostenberechnung, Fuhrpark, Auftragsbörse,
Sammelladung mit drei Planungsstufen.

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
| `npm run icons` | Spritemap aus `assets-src/icons/` bauen |

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
    Win98.tsx         Fenster, Menüleiste, Dialoge
    Taskbar.tsx       Startleiste, Startmenü, Uhr
    Icon.tsx          Symbol aus der Spritemap
    programs.ts       Programmverzeichnis des Rechners
    FleetView.tsx     Fuhrpark
    OrderBoard.tsx    Auftragsbörse
    serviceWorker.tsx  Anmeldung und Aktualisierungshinweis
  styles/
    win98.css    Farben und Kantenprofile
public/
  sw.js          Service Worker
  manifest.webmanifest
  icons/         App-Symbole
  assets/icons.png   Spritemap der Programmsymbole
  assets/icons.json  Zuordnung Name → Zelle
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

## Der virtuelle Rechner

Ein Symbol antippen wählt aus, erneutes Antippen startet das Programm — auf
Berührungsgeräten ist ein echter Doppelklick unzuverlässig. Läuft ein
Programm bereits, wird es nach vorn geholt statt doppelt gestartet.

Nicht installierte Programme melden sich mit einem Dialog, so wie ein echter
Rechner es täte.

Unter 820 Pixel Breite füllt jedes Fenster den Bildschirm; gewechselt wird
über die Startleiste.

## Symbole austauschen

```
assets-src/icons/<name>.png   →   npm run icons   →   public/assets/icons.png
```

Einzelbilder mit 48 × 48 Pixeln und Transparenz in `assets-src/icons/`
ablegen und `npm run icons` aufrufen. Stimmt eine Größe nicht oder fehlt
eine Datei, bricht das Skript ab und nennt den Grund.

Im Code wird nie ein Dateiname genannt, sondern nur eine Kennung:
`<Icon id="fuhrpark" size={48} />`.

Aufbau, Farbpalette und die Prompts für Leonardo.ai stehen im Dokument
„SpediPro95 Icons".

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
