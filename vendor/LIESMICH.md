# Beigelegte Fremdbestandteile

## Leaflet 1.9.4

Kartenbibliothek von Volodymyr Agafonkin und Mitwirkenden.
Lizenz: BSD-2-Clause. Quelle: https://leafletjs.com

Liegt hier bei, statt von einem Inhaltsnetz geladen zu werden — ohne
die Bibliothek startet das Spiel überhaupt nicht, sie darf deshalb
nicht vom Netz abhängen.

Enthalten: `leaflet.js`, `leaflet.css` und der Ordner `images/` mit
den Markierungsgrafiken der Bibliothek.

Zum Aktualisieren:

```bash
cd vendor
npm pack leaflet@<fassung>
tar xzf leaflet-<fassung>.tgz
cp package/dist/leaflet.js package/dist/leaflet.css .
cp -r package/dist/images .
rm -rf package leaflet-*.tgz
```

Danach die Fassungsnummer in `index.html` anpassen.
