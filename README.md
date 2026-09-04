# SpediPro 95

Speditions-Manager-Simulator als PWA. Läuft auf Smartphone, Tablet und Desktop.

**Ausbaustufe 1:** Karte, Routing, Kostenberechnung.

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
    data.ts      Laden, Projektion, Formatierung
  ui/            Anzeigeschicht
    win95.tsx    Fenster, Schaltflächen, Rahmen, Kennzahlen
    MapCanvas.tsx  Karte auf Canvas
    RoutePlanner.tsx  Tourenplanung
  styles/
    win95.css    Farben und Kantenprofile
public/data/
  cities.json    289 Städte
  roads.json     958 Strecken
```

**Der Simulationskern kennt die Anzeigeschicht nicht.** Er bekommt Daten und
gibt Ergebnisse zurück. Dadurch läuft derselbe Code später unverändert in der
Standalone-Version und lässt sich ohne Browser testen.

## Zwei Regeln

**Nichts ist Dekoration.** Jeder Button hat eine Funktion, jede Zahl stammt aus
einer Berechnung. Eine Wirtschaftszahl im Anzeigecode ist ein Fehler — alle
Kennwerte stehen ausschließlich in `core/economy.ts`.

**Was nicht funktioniert, erscheint nicht.** Deshalb gibt es in Stufe 1 nur
zwei Fenster und zwei Navigationseinträge. Die Oberfläche wächst mit dem
Funktionsumfang.

## Bedienung

- Stadt antippen oder anklicken → wird als Stopp angehängt
- Ziehen verschiebt die Karte, Mausrad oder zwei Finger zoomen
- Fenster lassen sich verschieben, in der Größe ändern, minimieren und maximieren
- Unter 860 px Breite schaltet die Oberfläche auf die mobile Ansicht um

## Nächste Ausbaustufen

| Stufe | Inhalt |
|---|---|
| 2 | Fuhrpark, Auftragsgenerierung |
| 3 | Tourenplanung mit Sammelladung — dann ist der Kern-Loop spielbar |
| 4 | Zeitsystem, laufende Touren, Zwischenfälle |
| 5 | Personal, Lenkzeiten, Kassenbuch |
| 6 | Werkstatt, Kunden, Konkurrenz, Statistik |
