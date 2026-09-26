# Optik und Bedienung: die 98er-Optik skalieren, nicht verkleinern

Die Recherche zu Optik und Bedienung führt auf einen einzigen, an vier Stellen zahlenmäßig belegten Konflikt: Die Maße von Windows 98 liegen unter jeder dokumentierten Untergrenze, die Optik selbst dagegen ist unproblematisch. Die Systemschrift des Originals (MS Sans Serif / Tahoma 8 pt bei 96 dpi, rund 11 px) liegt unter der einzigen belegbaren Mindestgröße aus der Spielebranche — **18 px bei 1080p** nach Xbox Accessibility Guideline 101 ([Microsoft Learn, XAG 101](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/101)) — und die 16-px-Titelleistenknöpfe liegen unter allen vier Plattformzahlen für Berührungsziele (Apple 44×44 pt, Google 48×48 dp ≈ 9 mm, Microsoft 7,5 mm, WCAG 2.5.8 mit 24×24 CSS-px). Der grau-auf-graue Bevel-Rand, der im Original „gedrückt" von „nicht gedrückt" trennt, ist genau die „visual information required to identify user interface components and states" aus WCAG 1.4.11 und muss 3:1 erreichen ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). Und die feste Pixelgeometrie des Nachbaus kollidiert mit der Forderung, Text auf **200 %** skalieren zu können „without loss of content, functionality, or meaning" ([XAG 101](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/101)). In drei Punkten ist der 98er-Rahmen modernen Oberflächen dagegen **voraus**: Er ist animationsarm (und erfüllt `prefers-reduced-motion` von Natur aus), er benutzt beschriftete OK/Abbrechen-Dialoge statt Icon-only-Flächen, und Schwarz auf #C0C0C0 erfüllt 4,5:1 mit großem Abstand. Die tragfähige Auflösung ist deshalb kein Kompromiss am Look, sondern eine **skalierte 98er-Optik**: Proportionen und Formensprache treu, absolute Größen über eine einzige Skalierungsstufe angehoben, Skalierung als Nutzereinstellung — belegt als Vorgehen durch Factorios Schriftgrößen-Option ([FFF #238](https://factorio.com/blog/post/fff-238)) — plus der Kunstgriff, sichtbare Größe von Trefferfläche zu trennen, wie Google es mit `TouchDelegate` beschreibt ([Android Accessibility Help](https://support.google.com/accessibility/android/answer/7101858?hl=en)). Unbelegt bleibt dabei ausgerechnet das Naheliegendste: Es existiert **kein** Postmortem und **kein** Nutzertest zu einem Spiel mit nachgebauter Betriebssystem-Oberfläche, und **keine** Fallstudie mit Zahlen zu einem Spiel, das von Maus auf Finger umgebaut wurde.

---

## Wie dieses Dokument zu benutzen ist

Dieser Bericht behandelt ausschließlich Optik und Bedienung. Systeme, Entscheidungen und Fortschritt stehen im Bericht „Entscheidungen bauen, nicht Zahlen verwalten" und werden hier nicht wiederholt. Jede Regel unten ist als Prüfregel formuliert und an eine gebaute Oberfläche prüfbar. Die Belegstärke steht bei jeder Regel dabei.

| Marke | Bedeutung |
|---|---|
| **[P]** | Primärquelle: Entwickler, Normungsgremium oder Studie sagt es selbst |
| **[S]** | nur über Sekundärzusammenfassung belegt — Wortlaut vor Veröffentlichung am Original prüfen |
| **[A]** | Ableitung aus belegten Quellen; die Herkunft ist jeweils genannt |
| **[U]** | in dieser Recherche nicht belegbar — als Annahme behandeln, nicht als Wissen |

Zahlen ohne Marke gibt es hier nicht. Wo eine Zahl abgeleitet ist, steht **[A]** und woraus.

---

## Pixelart: neun Stufen, 20 Grad Farbton, 50 Pixel Figurenhöhe

Die handwerklichen Lehrtexte sind erstaunlich einheitlich, und sie argumentieren fast durchgehend qualitativ. Die belastbarste Zahlenmethode ist Raymond Schlitters Rampen-Rezept: im dokumentierten Beispiel „Mondo" **9 Swatches pro Rampe**, **8 Rampen im Abstand von 45°** über den Farbkreis, eine Masterpalette von **128 Farben**, aus der kleinere aufgabenspezifische Paletten extrahiert werden, und **rund 20° Farbtonverschiebung pro Stufe** als Obergrenze. Sättigung erreicht ihr Maximum in der Rampenmitte und berührt nie 0 % oder 100 %; Helligkeit steigt monoton mit kleineren Schritten am oberen Ende; „straight ramps", die nur Helligkeit ändern, sind ausdrücklich abgelehnt ([Slynyrd, Pixelblog 1](https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes)) **[P]**. Der Autor relativiert seine eigenen Zahlen offen: „I've tried to come up with mathematically precise formulas but it always seems to come down to trusting the eyeballs" **[P]** — die Werte sind Richtwerte, kein Algorithmus. Jansson formuliert dasselbe unabhängig: Schatten kühl (Himmelslicht), Lichter warm (Sonnenlicht), reines Schwarz und Weiß als Rampenenden vermeiden, lange Rampen aus voll gesättigten Farben vermeiden ([Jansson, Pixel Art Tutorial](https://androidarts.com/pixtut/pixelart.htm)) **[P]**.

Die Lesbarkeitsregeln stehen ebenso fest, nur ohne Maßzahlen. Banding „draws attention to the borders between color fields" und ist damit ein Lesbarkeitsfehler, nicht ein Stilmittel; Pillow Shading (Schattierung von der Kontur nach innen) macht Objekte „unsharp and indistinct"; exzessives Anti-Aliasing „can make a piece look blurry and indistinct"; Pixel gehören in Cluster, „imagine the pixels gravitating towards each other", verwaiste Einzelpixel werden als Rauschen gelesen; durchgehend schwarze Umrisse erzeugen Flachheit, empfohlen sind dunkle Linien unten, helle oben und „lost lines" ([Jansson](https://androidarts.com/pixtut/pixelart.htm); [Derek Yu, Common Mistakes](https://www.derekyu.com/makegames/pixelart2.html)) **[P]**. Der wichtigste Satz für kleine Abmessungen kommt von Yu: „When colors are too similar, pixels begin to blend together and get lost" — bei kleinem Maßstab ist zu geringer Wertabstand der Hauptzerstörer, nicht zu wenig Detail **[P]**. Dazu seine „Chunky Pixels Rule": Arme, Beine, Äste nie 1 Pixel dünn, weil sie dann nicht schattierbar sind **[P]**.

Konkrete Produktionszahlen liefert nur Dead Cells: **50 px Figurenhöhe** im Spiel, und genau diese Kleinheit war der Grund, Figuren über eine 3D-Pipeline zu rendern statt von Hand zu zeichnen; die Ausgabe verzichtet bewusst auf Anti-Aliasing, um die Pixelart-Klarheit zu halten ([Game Developer, Dead Cells Deep Dive](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-)) **[P]**. Die Animationsmethode desselben Teams ist die brauchbarste Produktionsregel für kleine Teams: erst die überzeugende Bewegung „with the least amount of frames possible", dann Zwischenbilder „before or after the key frames. Never in-between", Zielbildrate **30 FPS** **[P]**. Slynyrd ergänzt für Smears: „Usually a single smear frame can get the job done", „The smear frames should always be few and fast", und die Bildzahl ist eine Spielbarkeitsentscheidung — „long high frame animations look sexy but often translate into sluggish controls" ([Pixelblog 9](https://www.slynyrd.com/blog/2018/9/8/pixelblog-9-melee-attacks)) **[P]**.

Konsistenz ist bei Pedro Medeiros eine Regel mit drei Teilen: „The primary strategy for developing a pixel art game is to choose a resolution and stick to it"; „Maintaining color count consistency is crucial in pixel art and is often underestimated"; und getrennte Stilwelten für Spielcanvas, UI und Karten, in denen „styles never leak from one world to another" ([saint11, Consistency](https://saint11.art/blog/consistency/)) **[P]**. Für das Skalierungsproblem im Browser ist die Sachlage technisch eindeutig: Nur bei ganzzahligen Faktoren wird jeder Quellpixel „displayed as a square group of integer (2×2, 3×3) number of physical pixels of the same color without mixing-in colors"; bei 1,5× „we are forced to use interpolation that calculates average colors"; und Nearest Neighbour allein hilft nicht, weil die Ergebnispixel bei gebrochenen Faktoren „different sizes" haben, was „pixel shimmering, or jitter" erzeugt. Das Rechenbeispiel der Quelle: **640×480 auf 1920×1080 ergibt horizontal 3, vertikal 2,25 → Faktor 2** ([tanalin, Integer Scaling](https://tanalin.com/en/articles/integer-scaling/)) **[P]**. Verschärfend: Ob `image-rendering: pixelated` bei Faktoren wie 150 % überhaupt Nearest Neighbour erzwingen soll, ist eine offene CSSWG-Frage ([csswg-drafts #5837](https://github.com/w3c/csswg-drafts/issues/5837)) **[P]** — ein selbst berechneter ganzzahliger Faktor ist verlässlicher als die CSS-Eigenschaft.

**Prüfregeln:**

| # | Regel | Prüfung | Beleg |
|---|---|---|---|
| 1 | Lege eine Basisauflösung fest und weiche nie davon ab. | Alle Sprites auf demselben Raster? Ein Sprite mit halben Pixeln ist ein Fehler. | **[P]** saint11 |
| 2 | Baue eine Masterpalette aus Rampen von etwa 9 Stufen mit rund 20° Farbtonverschiebung pro Stufe, Sättigungsmaximum in der Rampenmitte, monoton steigender Helligkeit. Keine „straight ramps". | Jede Rampe als Streifen ausgeben: ändert sich nur die Helligkeit, ist sie durchgefallen. | **[P]** Slynyrd |
| 3 | Zähle die Farben. Neue Farben nur mit Begründung. | Farbanzahl pro Sprite-Kategorie dokumentiert und gemessen. | **[P]** saint11 |
| 4 | Silhouette zuerst. Details, die die Form nicht stützen, werden als Rauschen gelesen. | Sprite als reine Schwarzfläche rendern — ist es erkennbar? | **[P]** Jansson |
| 5 | Kein Pillow Shading, kein Banding, kein flächiges Anti-Aliasing. Werte enden abrupt gegen den Nachbarwert. | Läuft die Helligkeit von der Kontur nach innen zur Mitte hin auf? Dann durchgefallen. | **[P]** Jansson / Yu |
| 6 | Pixel in Cluster, keine verwaisten Einzelpixel. | Auf Zielgröße betrachten: Sind Einzelpixel als Detail oder als Rauschen lesbar? | **[P]** Jansson |
| 7 | Kein Glied und kein Detail nur 1 Pixel dick. | Dünnste Struktur im Sprite messen. | **[P]** Yu |
| 8 | Bei kleinen Abmessungen ist der Wertabstand die Lesbarkeit, nicht die Detailmenge. Zu ähnliche Farben verschmelzen. | Graustufenversion prüfen: Trennen sich die Formen noch? | **[P]** Yu |
| 9 | Keine durchgehend schwarze Kontur. Dunkle Linien unten, hellere oben, am Bodenkontakt weglassen. | Auf weißem Grund braucht die Silhouette dennoch eine dunkle, nicht schwarze Trennung. | **[P]** Jansson, Anwendung auf weißen Grund **[A]** |
| 10 | Eine Lichtrichtung für das ganze Spiel, Standard vorn-seitlich-oben. | Zwei Sprites nebeneinander: liegt das Licht gleich? | **[P]** Jansson |
| 11 | Baue die Bewegung mit der geringstmöglichen Bildzahl; Zwischenbilder nur **vor oder nach** den Schlüsselbildern, nie dazwischen. Ein Smear genügt meist. | Frame entfernen: Bricht die Bewegung? Wenn nein, war er unnötig. | **[P]** Dead Cells, Slynyrd |
| 12 | Skaliere nur ganzzahlig. Berechne den Faktor selbst (größter ganzzahliger Faktor, der hineinpasst) statt `image-rendering: pixelated` zu vertrauen; den Rest als Rand stehenlassen. | Bei Bewegung auf Flimmern prüfen, auf Telefon mit `devicePixelRatio` 2 und 3. | **[P]** tanalin, CSSWG |

Nicht belegt, aber praktisch nötig: Fahrzeuge in 3/4-Isometrie dürften in der Längsachse **32–64 px** brauchen, um Kabine, Ladefläche und Räder als getrennte Formen zu tragen. Das ist eine Ableitung aus der Dead-Cells-Zahl von 50 px Figurenhöhe **[A]**, keine belegte Schwelle — der einzige tragfähige Weg ist der Test: dieselbe Silhouette in mehreren Größen rendern und auf Telefondistanz prüfen. Getrennte Stilregelwerke für Fahrzeuge, Porträts und UI folgen aus saint11s „Welten"-Regel **[A]**.

---

## Rückmeldung: 100 ms bis zur Quittung, 400 ms als Obergrenze

Hier ist die Quellenlage die beste des ganzen Berichts, weil die Zahlen aus der UX-Primärliteratur kommen. Nielsens drei Antwortzeitgrenzen gelten seit 1993 unverändert: **0,1 s** — „The user feel that the system is reacting instantaneously, meaning that no special feedback is necessary except to display the result"; **1,0 s** — „About the limit for the user's flow of thought to stay uninterrupted, even though the user will notice the delay"; **10 s** — „About the limit for keeping the user's attention focused on the dialogue" ([NN/g, Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)) **[P]**. Für Animationsdauern nennt NN/g **100 ms** für einfache Rückmeldungen (Checkbox, Umschalter), **200–300 ms** für substanzielle Ansichtswechsel, **100–400 ms** als Gesamtkorridor, und bei **500 ms** beginnen Animationen „to feel like a real drag"; verschwindende Elemente sind kürzer als eintretende, etwa **200–250 ms**, und die empfohlene Kurve ist ease-out, „that starts quickly but slows down", denn „Completely linear motion looks weird and unnatural to users" ([NN/g, Animation Duration](https://www.nngroup.com/articles/animation-duration/)) **[P]**. Die wichtigste Fehlerrichtung steht in derselben Quelle: Es ist „far more common for animations to be too long than too short" **[P]**.

Für eine Desktop-Oberfläche ist Material Design noch strenger: Standardübergang mobil **300 ms**, große Vollbildübergänge **375 ms**, eintretend **225 ms**, austretend **195 ms**, Tablet etwa **30 % länger**, Wearables **30 % kürzer** — und ausdrücklich: „Desktop animations should be faster and simpler than their mobile counterparts. These animations should last 150ms to 200ms" ([Material Design, Duration & easing](https://m1.material.io/motion/duration-easing.html)) **[P]**.

Zwei Zahlen wirken widersprüchlich und sind es nicht: Die 0,1-Sekunden-Grenze betrifft den *Beginn* der sichtbaren Antwort, die Animationsdauer ihre *Länge*. Praktisch heißt das, nie eine Animation als Vorlauf vor die Zustandsänderung zu legen **[A]**. Genau dieses Muster ist bei Bloodborne dokumentiert: ein schneller Haltungswechsel *vor* der langsamen Animation, um die Illusion der Reaktionsfähigkeit zu retten ([Game Developer, 6 Mistakes](https://www.gamedeveloper.com/design/6-mistakes-that-ll-drain-the-juice-out-of-your-game)) **[P]**. Für Windows 98 ist das ohnehin die Muttersprache: Der eingedrückte 3D-Rahmen erscheint im Moment des Mausdrucks und wartet auf keine Berechnung **[A]**.

Aus dem „Juice it or lose it"-Katalog (Jonasson/Purho, Nordic Game Jam 2012, [GDC Vault](https://www.gdcvault.com/play/1016487/juice-it-or-lose)) sind für eine nüchterne Oberfläche brauchbar: Tweening/Easing, Farbwechsel als Klarheits- *und* Antwortsignal, sanftes Skalieren beim Drücken, Ton, Ausblenden statt Verschwinden, Sekundäraktionen ([Cobble Games](https://cobble.games/wise-inspiring-smart/game-design/juice-it-or-lose-it)) **[S]** — die Technikenliste stammt aus einer Zusammenfassung, nicht aus dem Originalton. Bildschirmwackeln, dichte Partikel und Persönlichkeitsdetails wären in einer nachgebauten Systemoberfläche ein Stilbruch **[A]**. Der befundstärkste Satz des Vortrags ist ohnehin struktureller Art: Die Regeln blieben unangetastet, nur die Rückmeldung änderte sich — Spielgefühl ist eine reine Präsentationsschicht und lässt sich nachträglich justieren **[A]**.

Die Grenze nach oben ist belegt, aber nur indirekt. Slay the Spire wird ausdrücklich dafür gelobt, dass „Players can act before animations finish, allowing rapid decision-making without waiting for visual sequences to conclude" ([Cloudfall Studios](https://www.cloudfallstudios.com/blog/2018/2/20/flash-thoughts-slay-the-spires-ui)) **[S]**, und dass Animationslänge ein reales Reibungsthema ist, zeigen Spielerforderungen nach Beschleunigung ([Steam-Diskussion](https://steamcommunity.com/app/2868840/discussions/0/798966340582929693/)) sowie Mods, die allein Animationen verkürzen ([Quick Animation Mode](https://www.nexusmods.com/slaythespire2/mods/171)) **[P für die Existenz der Beschwerde]**. Eine hochwertige, namentlich verantwortete Kritik an Over-Juicing existiert nicht (siehe Lückenkapitel).

Für Wartezustände sind die Schwellen quantifiziert: **kein Indikator unter etwa 1 Sekunde**, **Laufanimation für 2–10 Sekunden**, **prozentualer Fortschritt ab 10 Sekunden**; über 10 Sekunden zusätzlich Prozentanzeige, Arbeitssignal und Abbruchmöglichkeit. Eine zitierte Studie der University of Nebraska-Lincoln fand, dass Nutzer mit sichtbarem Fortschrittsbalken „experienced higher satisfaction and were willing to wait on average **3 times longer**" ([NN/g, Progress Indicators](https://www.nngroup.com/articles/progress-indicators/)) **[P, sekundär referiert]**. Rückmeldung während der Wartezeit ist „especially important if the response time is likely to be highly variable" **[P]**.

**Prüfregeln:**

| # | Regel | Prüfung | Beleg |
|---|---|---|---|
| 13 | Jede Eingabe wird innerhalb von **0,1 s** sichtbar quittiert. Das Ergebnis darf danach nachkommen. | Klick aufzeichnen, erste Bildänderung messen. | **[P]** Nielsen |
| 14 | Nie eine Animation als Vorlauf vor die Zustandsänderung legen. Erst Zustand, dann Bewegung. | Zeigt der erste Frame nach dem Klick schon den neuen Zustand? | **[A]** aus Nielsen + **[P]** Bloodborne-Muster |
| 15 | Kleines am Schreibtisch **120–200 ms** (Knopf gedrückt, Zeile markiert, Häkchen), Fenster und Reiter **200–300 ms**, nichts über **400 ms**. | Alle Dauerwerte an einer Stelle definiert und auflistbar. | **[P]** NN/g 100–400 ms; **[P]** Material 150–200 ms Desktop; Zuordnung **[A]** |
| 16 | Austretende Elemente kürzer als eintretende, etwa **200–250 ms**, ease-out für eintretende, ease-in für austretende. Keine lineare Kurve. | Kurven im Stylesheet prüfen. | **[P]** NN/g, Material |
| 17 | Bleib im unteren Ende des Korridors, weil zu lang der häufigere Fehler ist — und weil das Original praktisch keine Übergänge hatte. | Jede Dauer über 300 ms braucht eine Begründung im Protokoll. | **[P]** NN/g; 98er-Argument **[A]** |
| 18 | Jede Animation ist überspringbar: Ein Klick während der Animation springt zum Endzustand. | Bei jeder Animation während des Ablaufs klicken. | **[S]** Slay the Spire |
| 19 | Eine stille Änderung existiert nicht. Geänderte Tabellenzeile kurz einfärben und über etwa 300 ms zurückblenden; Kontostände hochzählen statt springen. | Änderung ohne Blick auf die Zahl bemerkbar? | **[P]** NN/g (Bewegung zieht Aufmerksamkeit, Pratt et al. 2010 via NN/g); Dauer **[A]** |
| 20 | Objekte verschwinden nicht, sie gehen ausblendend weg. | Gelöschte Zeile: Ist der alte Zustand im ersten Frame noch sichtbar? | **[P]** Game Developer, 6 Mistakes |
| 21 | Eine große Handlung löst kleinere Folgeeffekte aus (bestätigte Buchung → Kontostand zieht nach → Liste zieht nach). | Kette nachverfolgbar? | **[P]** Game Developer, 6 Mistakes |
| 22 | Unter 1 s kein Indikator, 2–10 s Laufanimation mit Statustext, ab 10 s Prozentbalken plus Abbruch. | Rundenwechsel messen und einordnen. | **[P]** NN/g |
| 23 | Bei schwankender Dauer den Indikator verzögert einblenden, damit er bei schnellen Fällen nicht aufblitzt. | Schnellen und langsamen Fall nacheinander auslösen. | **[A]** aus NN/g-Hinweis zur Variabilität; die Verzögerungsschwelle (etwa 300–500 ms) ist **[U]** |
| 24 | Ton nur redundant zur sichtbaren Rückmeldung, sehr kurz, sehr leise, abschaltbar. Kein Ton für Hover und Auswahl, leiser Klick für Aktionen, deutlicherer Ton nur für Ereignisse mit Folgen. | 100 Klicks hintereinander hören. | **[P]** UXmatters (unaufdringlich, abschaltbar); Abstufung **[A]** |

Dauer und Lautstärke von UI-Tönen sind in Zahlen nicht belegt, ebenso nicht die Dauer von Hochzähl-Animationen — beide Werte stehen hier als Ableitung aus dem NN/g-Korridor.

---

## Zielgrößen: 44 Pixel gegen 16, und warum Ecken am Finger schlechter sind

Fitts' Gesetz liefert die Form, nicht die Zahl: **T = a + b(log₂ 2D/w)**, mit T als Bewegungszeit, D als Distanz und w als Zielbreite; a und b „variieren je nach Zeigegerät" ([NN/g, Fitts's Law](https://www.nngroup.com/articles/fitts-law/)) **[P]**. Daraus folgt unmittelbar, dass eine einzige für Maus und Finger „richtige" Knopfgröße mathematisch nicht herleitbar ist — die vernünftige Konsequenz ist ein Eingabemodus statt eines Kompromisswerts **[A]**. Die für das Projekt folgenreichste Aussage derselben Quelle betrifft die Ränder: „Screen edges act as natural walls for the cursor" und erzeugen unendlich große Ziele, die kein Abbremsen erfordern — Betriebssysteme nutzen das, macOS mit der Menüleiste oben, Windows mit dem Startknopf in der Ecke. Aber: „touchscreen devices don't benefit from edge placement; targets actually take longer to hit there" **[P]**. Die 98er-Konvention, Wichtiges in Ecken zu legen, ist am Schreibtisch optimal und am Telefon eine Verschlechterung **[A]**.

Die Mindestgrößen sind vierfach dokumentiert und weichen voneinander ab. WCAG 2.5.8 (AA, WCAG 2.2): „The size of the target for pointer inputs is at least **24 by 24 CSS pixels**", mit fünf Ausnahmen, darunter die Abstandsausnahme — „Undersized targets are positioned so that if a **24 CSS pixel diameter circle** is centered on the bounding box of each, the circles do not intersect" ([DigitalA11Y zu SC 2.5.8](https://www.digitala11y.com/understanding-sc-2-5-8-target-size-minimum/)) **[S]**. WCAG 2.5.5 fordert **44×44 px**, aber nur auf Stufe AAA; Apple nennt „a minimum tappable area of **44×44 points** for all controls"; BBC GEL nennt 44×44 px mit erlaubten Ausnahmen bei „exclusion zones"; für Fahrzeugoberflächen gilt bei Google **76×76 dp** ([TetraLogical, target sizes](https://tetralogical.com/blog/2022/12/20/foundations-target-size/)) **[S]**. Google selbst nennt primär **48 dp × 48 dp**, physisch **etwa 9 mm**, mit **8 dp oder mehr** Abstand, und — für dieses Projekt der wichtigste Satz überhaupt — „touch targets extend beyond the visual bounds of an element": Ein 24×24-dp-Icon darf per Padding auf 48×48 dp Trefferfläche kommen, technisch über `TouchDelegate` oder `Modifier.sizeIn` ([Android Accessibility Help](https://support.google.com/accessibility/android/answer/7101858?hl=en)) **[P]**. Microsoft nennt **7,5 mm im Quadrat (40×40 px auf einem 135-PPI-Bildschirm bei 1,0× Skalierung)** und räumt die „relatively imprecise nature of the touch contact area" ein ([Microsoft Learn, Guidelines for touch targets](https://learn.microsoft.com/en-us/windows/apps/develop/input/guidelines-for-targeting)) **[P]**.

Die Forschungsgrundlage darunter ist Parhi, Karlson und Bederson (MobileHCI 2006): **9,2 mm** Mindestgröße für diskrete Aufgaben, **9,6 mm** für serielle; 20 rechtshändige Personen, Durchschnittsalter 25,7 Jahre; bei diskreten Aufgaben **kein bedeutsamer Fehlerunterschied zwischen 9,6 mm und 11,5 mm**, bei seriellen Aufgaben Fehlerraten **ab ≥ 7,7 mm statistisch gleichwertig**, Geschwindigkeit stieg mit der Zielgröße weiter ([Parhi et al., PDF](https://www.microsoft.com/en-us/research/wp-content/uploads/2006/01/parhi-mobileHCI06.pdf)) **[P]**. Die Autoren begründen ihre Zahl ausdrücklich als Sättigungspunkt, nicht als Optimum: Ziele „as small as possible without decreasing performance and user preference" **[P]**. NN/g leitet daraus **1 cm × 1 cm** als Grundanforderung und **2 cm × 2 cm** für primäre Handlungsaufrufe ab ([NN/g, Touch Targets](https://www.nngroup.com/articles/touch-target-size/)) **[P]**. Eine Literaturübersicht nennt die Spannweite der geforderten Mindestgrößen über Studien hinweg mit **10,5 mm bis 26 mm** ([Huber, LMU, PDF](https://www.mmi.ifi.lmu.de/lehre/ss15/ps/papers/Huber-InputOnTouchDevices.pdf)) **[P]**.

Die Zahlen sind nur scheinbar widersprüchlich: Apple 44 pt, Google 48 dp und Microsoft 7,5 mm liegen physisch alle im Bereich 7,5–9,5 mm und damit auf Höhe des Parhi-Sättigungspunkts; 44 CSS-px entsprechen bei üblicher Web-Rechnung ebenfalls etwa 9 mm **[A]**. WCAG 2.5.8 mit 24 px fällt deutlich darunter und ist erkennbar ein Umsetzbarkeitskompromiss für bestehende Websites — **eine Konformitätsgrenze, kein Entwurfsziel** **[A]**. Praktisch heißt das für dieses Projekt: **44–48 px Trefferfläche mit mindestens 8 px Zwischenraum am Telefon, unabhängig von der Optik.**

Der Finger unterscheidet sich vom Zeiger in vier dokumentierten Punkten. Fingerspitzenbreite **1,6–2 cm**, Daumenaufschlagfläche **2,5 cm**; „elements easily clicked using a mouse cursor are not always accessible by fingers"; und „targets must first be big enough, and then also spaced well enough" — Größe allein genügt nicht ([NN/g, Touch Targets](https://www.nngroup.com/articles/touch-target-size/)) **[P]**. Dieselbe Quelle dokumentiert Negativfälle mit Zahlen: die Glow-Baby-App mit **6 mm breit × unter 1 mm hoch** und rund **10 Versuchen**, Instagrams **2 mm** breiter Schließknopf, David-Yurman-Farbfelder mit **1 mm** Durchmesser **[P]**. Der Anstellwinkel wirkt messbar: flache Winkel (15°) erzeugen ungenauere Eingaben als senkrechter Kontakt (90°), und Holz & Baudisch zeigten mit RidgePad, dass sich die Treffergenauigkeit „nearly doubles … in contrast to traditional touch technology" — der Fehler steckt also teilweise im Modell, das der Bildschirm vom Finger hat ([Huber](https://www.mmi.ifi.lmu.de/lehre/ss15/ps/papers/Huber-InputOnTouchDevices.pdf)) **[P]**. Und der teuerste Punkt für diesen Nachbau: „No hover states: Cursor changes cannot signal availability" ([NN/g, Drag-and-Drop](https://www.nngroup.com/articles/drag-drop/)) **[P]**. Windows 98 setzt Hover systematisch zur Bedeutungsvermittlung ein — Menüs öffnen auf Hover, Cursorformen sagen, was ein Element ist, Tooltips erklären Symbolknöpfe, Statuszeilen erscheinen bei Hover. Am Telefon entfällt diese gesamte Erklärschicht, und alle darin transportierten Informationen müssen dauerhaft sichtbar werden **[A]**.

Drag and Drop bewertet NN/g grundsätzlich skeptisch: geeignet nur für „resizing objects and moving objects" und vor allem dort, wo Nutzer es erwarten; „it can be inefficient, imprecise, and even physically challenging, especially over long distances"; Griffsymbole sind „not nearly as universal as designers may think"; ziehbare Objekte brauchen am Finger mindestens **1 cm × 1 cm** freien Raum; und die Empfehlung ist eindeutig: „On mobile, for example, using menus to move a file to a different folder can be less error-prone than drag-and-drop", Ziehen nur, wenn „there is no reasonable alternative with lower interaction cost" ([NN/g, Drag-and-Drop](https://www.nngroup.com/articles/drag-drop/)) **[P]**. Die Spiel-Accessibility-Richtlinien verschärfen: „Ensure that multiple simultaneous actions (eg. click/drag or swipe) are not required, and included only as a supplementary / alternative input method" ([Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)) **[P]**, und XAG 107 fordert „A UI should be navigable by using single, non-simultaneous key presses" ([XAG 107](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/107)) **[P]**.

Zu Tastatur und Wiederholungen liefert XAG 107 die härtesten Sätze: Umbelegung „regardless of platform-level remapping support" und auf Handlungsebene; zu vermeiden sind Mechaniken mit „repeated or execute multiple keystrokes or button presses within a short period of time (like quick-time events)" und solche, bei denen eine Taste „should be held down for an extended period"; Empfindlichkeit muss um mindestens **50 % der Voreinstellung** verstellbar sein; und „All interface components should be fully operable with digital input" **[P]**. Die Game Accessibility Guidelines nennen dasselbe kürzer: „Allow controls to be remapped / reconfigured" (basic), „Avoid repeated inputs (button-mashing/quick time events)" und „Make interactive elements that require accuracy … stationary" (intermediate) **[P]**.

Die Klickzahl ist ausdrücklich kein Maß. NN/g referiert Joshua Porters Untersuchung von 2003: „user dropoff does not increase when the task involves more than 3 clicks, nor does satisfaction decrease", und nennt drei Gründe für das Scheitern des Klickzählens — die nötige Klickzahl hängt von der Aufgabenschwierigkeit ab, Klicks sind nicht gleichwertig, und Klickzahlen ignorieren Fehler und Verwirrung ([NN/g, 3-Click Rule](https://www.nngroup.com/articles/3-click-rule/)) **[P für NN/gs Darstellung, [S] für Porter]**. Für dieses Projekt heißt das: Der Fensterweg (Fenster öffnen → Reiter → Handlung) kostet Klicks und ist deswegen kein Mangel, solange jeder Schritt klar beschriftet ist **[A]**.

Bei Listen ist die Abgrenzung qualitativ, aber klar: Unendliches Scrollen passt zu „homogeneous content consumption without specific objectives" und ist ausdrücklich zu **vermeiden**, wenn Nutzer etwas Bestimmtes finden, Einträge vergleichen oder nur die obersten Treffer prüfen wollen — und es gibt „no solution … that is overall superior" ([NN/g, Infinite Scrolling](https://www.nngroup.com/articles/infinite-scrolling-tips/)) **[P]**. Aufträge, Fahrzeuge, Mitarbeiter und Preisvergleiche sind ausnahmslos zielgerichtete Such- und Vergleichsaufgaben; damit sprechen die Quellen für Blättern mit Sortierung und Filter — was zur 98er-Listenansicht mit sortierbaren Spaltenköpfen ohnehin passt **[A]**.

**Prüfregeln:**

| # | Regel | Prüfung | Beleg |
|---|---|---|---|
| 25 | Trefferfläche am Telefon **mindestens 44–48 px** mit mindestens **8 px** Abstand — unabhängig davon, wie groß das Element aussieht. | Trefferrechtecke einfärben und messen, nicht die Grafik. | **[P]** Google 48 dp/8 dp, Apple 44 pt **[S]**, Microsoft 7,5 mm, Parhi 9,2/9,6 mm |
| 26 | Behandle WCAG 2.5.8 mit **24×24 CSS-px** als Konformitätsuntergrenze, nicht als Entwurfsziel. | Kein interaktives Element unter 24 px, auch am Schreibtisch nicht. | **[S]** WCAG 2.5.8; Einordnung **[A]** |
| 27 | Trenne sichtbare Größe von Trefferfläche. Die 16-px-Optik bleibt, das Padding wächst. | Jeder 98er-Kleinknopf hat ein unsichtbares Trefferfeld ≥ 44 px. | **[P]** Google („touch targets extend beyond the visual bounds") |
| 28 | Die drei Titelleistenknöpfe dürfen am Finger nicht aneinanderkleben. Sie verletzen sonst Größe **und** Abstandsausnahme (24-px-Kreise schneiden sich). | 24-px-Kreise auf die Knopfmitten legen und auf Schnitt prüfen. | **[S]** WCAG 2.5.8 Spacing-Ausnahme; Anwendung **[A]** |
| 29 | Ecken und Ränder sind am Schreibtisch die besten Plätze und am Telefon die schlechtesten. Startknopf, Schließknopf und Menüleiste wandern in der Telefonfassung aus den Ecken oder werden deutlich größer. | Telefonfassung: Liegt ein häufig benötigtes Ziel in einer Bildschirmecke? | **[P]** NN/g Fitts („touchscreen devices don't benefit from edge placement") |
| 30 | Eine einzige Knopfgröße für Maus und Finger ist nicht herleitbar. Baue einen Eingabemodus (Zeigegerät-Erkennung plus manueller Schalter) statt eines Mittelwerts. | Modus umschalten und Maße vergleichen. | **[A]** aus **[P]** Fitts-Formel (a und b geräteabhängig) |
| 31 | Jede Information, die im Original auf Hover liegt (Tooltip, Statuszeilentext, Cursorform, aufklappendes Menü), ist am Telefon dauerhaft sichtbar oder auf Tipp erreichbar. | Hover im Browser deaktivieren: Fehlt Bedeutung? | **[P]** NN/g („No hover states"); Anwendung auf 98 **[A]** |
| 32 | Ziehen ist nie der einzige Weg. Jede Zieh-Handlung hat eine Tipp-Tipp- oder Menüvariante. Ziehbare Objekte brauchen am Finger ≥ **1 cm × 1 cm** freien Raum. | Mit gesperrtem Drag durchspielen. | **[P]** NN/g Drag-and-Drop, **[P]** GAG, **[P]** XAG 107 |
| 33 | Keine Funktion ausschließlich über Doppelklick oder Rechtsklick — auch nicht am Schreibtisch. Am Telefon braucht jede davon ein sichtbares Bedienelement am Objekt. | Alle Funktionen mit Einzelklick erreichbar? | **[P]** GAG „Avoid repeated inputs", **[P]** XAG 107 |
| 34 | Keine erzwungene Wiederholungs- oder Halteeingabe. Statt wiederholten Klickens: Mengeneingabe, Schieberegler, Multiplikatortasten, „Alle". Empfindlichkeit um mindestens **50 %** verstellbar. | Kann eine Aufgabe nur durch mehrfaches Klicken erledigt werden? | **[P]** XAG 107, **[P]** GAG |
| 35 | Ziele, die Genauigkeit brauchen, bewegen sich nicht. | Öffnet sich ein Ziel unter dem Finger, während er sich bewegt? | **[P]** GAG intermediate |
| 36 | Optimiere nicht die Klickzahl, sondern die Beschriftung jedes Schritts. Listen blättern statt endlos scrollen; Rollbalken am Telefon dekorativ, Wischen trägt die Bedienung. | Ist an jedem Schritt klar, was der nächste bringt? | **[P]** NN/g 3-Click-Rule, **[P]** NN/g Infinite Scrolling |

Am Telefon sollten Fenster nicht frei ziehbar und skalierbar sein, sondern bildschirmfüllend; Menüleisten öffnen auf Tipp mit vergrößerter Zeilenhöhe; der 16-px-Rollbalkenpfeil liegt unter jeder dokumentierten Mindestgröße und wird zur Dekoration. Das ist die Umbauliste, die sich aus den Größenzahlen ergibt **[A]** — eine dokumentierte Fallstudie mit Zahlen zu einem solchen Umbau existiert nicht.

---

## Oberflächenaufbau: 800 Stile, 40-Pixel-Zeilen und Symbole, die Text brauchen

Die beste Primärquelle zu Spieloberflächen dieser Bauart sind die Factorio Friday Facts, und ihre Leitsätze sind kurz. Zielformel: „The aim is to be as functional as possible, and also be pleasant to interact with"; Optik bewusst zurückgenommen — „a neutral and sober look that helps to focus on the relevant elements, without the distraction of possible decorative elements"; Lesbarkeit messbar erhöht — „the contrast with the panels and the font is increased quite a lot" und „the font size is increased by 2pt so it is more comfortable to read"; Schriftgröße wird Einstellung — „the user will have control of the font size in the options menu"; Fenstervermeidung als Prinzip, „trying not to open unnecessary frames or pop ups"; und eine Darstellungsregel, die für Warensymbole direkt verwendbar ist — „when the GUI tells you about some element, it always tries to use this very element, not a representation of it" ([FFF #238](https://factorio.com/blog/post/fff-238)) **[P]**. Zustände sind fest farbkodiert: „Yellow for available, orange for queued, red unavailable, and green researched" **[P]**.

Der Umfang der Aufgabe ist dokumentiert und für die Projektplanung die nützlichste Zahl des Kapitels: rund **120 Fenster** mussten neu gestaltet werden, weshalb das Update verschoben wurde, und die gezeigten Entwürfe waren bereits „the 3rd iteration" ([FFF #212](https://factorio.com/blog/post/fff-212)) **[P]**; am Ende standen **800 in Lua definierte Stile und 400 Widget-Typen, davon über 100 echte Spielfenster** ([FFF #348](https://factorio.com/blog/post/fff-348)) **[P]**. Ein Fenstersystem skaliert nur über ein Stil- und Widget-System, nicht über handgesetzte Layouts **[A]**.

An einer Stelle gibt Factorio eine Antwort, die für dieses Projekt ausdrücklich **nicht** offensteht. Zur Knopfreihenfolge in Dialogen heißt es zunächst „I insisted that the button order should obviously always be OK Cancel, as in any UI I see around", dann die Feststellung, dass Windows OK→Cancel verwendet, Linux und macOS die umgekehrte Reihenfolge, und schließlich die Entscheidung: „Make it so much different and Factorio specific, that the way it is done in your specific system will not interfere with your muscle memory." Umgesetzt als einheitliches Schema — links Zurück/Abbrechen, rechts Bestätigen/Weiter, „Escape is the same as clicking back" ([FFF #246](https://factorio.com/blog/post/fff-246)) **[P]**. Wer die Windows-Optik nachbaut, erzeugt eine Erwartung an Windows-Verhalten und darf diesen Ausweg nicht nehmen: **Die Oberfläche muss die Konvention, die sie zitiert, auch einhalten** **[A]**. Übernehmbar bleibt das Modalschema selbst (feste Knopfseiten, Escape = Abbrechen) und die Architekturregel, statt eines zweiten Dialogs das bestehende Fenster zu erweitern **[P]**.

Zur Fensterverwaltung gibt es keine Messung, aber ein starkes Designargument aus der Strategiespiel-Literatur: Information in **einer** zusammengefassten Zone bündeln, typischerweise eine untere Informationsleiste, weil über den Bildschirm verstreute Befehle „forces players to divide attention unnecessarily"; die Oberfläche muss Mikro- und Makroebene gleichzeitig zeigen; und Zustandsmeldungen müssen sichtbar sein, weil die Oberfläche „an assistant and a teacher" sein soll ([Game Developer, UI Strategy Game Design Dos and Don'ts](https://www.gamedeveloper.com/design/ui-strategy-game-design-dos-and-don-ts)) **[P]**. Frei verschiebbare, überlappende Fenster erzeugen genau den kritisierten Zustand; die ableitbaren Gegenmittel sind Standardpositionen beim Öffnen, Nicht-Überdecken von Karte und Statusleiste, ein Fenster pro Aufgabe, und eine Taskleiste als Garantie gegen verlorene Fenster **[A]**.

Bei Tabellen ist die Beleglage gut und einheitlich. Text linksbündig — „Everything that's made up of letters should be left-aligned" —, Zahlen rechtsbündig zum Vergleich der Größenordnungen, bei unterschiedlicher Dezimalstellenzahl „align numbers to the decimal point", Ausnahme für qualitative Zahlen wie Datum, Postleitzahl, Telefonnummer; Kopfzeilen folgen der Spaltenausrichtung; Tabellenziffern per `font-variant-numeric: lining-nums tabular-nums`, weil „digits should occupy exactly the same width"; Spaltenbreite nach Inhalt, „Columns of small numbers should be narrow, and columns of paragraphs should be relatively wide"; knappes Zell-Padding mit kleinerem oberen Wert (Beispielwerte `padding: 0.125em 0.5em 0.25em 0.5em; line-height: 1;`) ([A List Apart, Designing Tables to be Read](https://alistapart.com/article/web-typography-tables/); [Pencil & Paper, Enterprise Data Tables](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables)) **[P]**. Zebra-Streifen werden typografisch abgelehnt, weil sie „serve[s] to distort the meaning of the data by highlighting every other row"; Außenrahmen weglassen, Linien nur „when they are absolutely necessary", dann nur in einer Richtung und heller ([A List Apart](https://alistapart.com/article/web-typography-tables/)) **[P]**. Zeilenhöhe ist eine umschaltbare Dichte: „**Condensed: 40px, Regular: 48px, Relaxed: 56px**", per Symbolschalter und über Sitzungen hinweg gespeichert; dazu klebende Kopfzeile, Chevron-Sortierindikator, der die Textausrichtung nicht stört, sinnvolle Sortiervoreinstellung und Trefferhervorhebung bei der Suche ([Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables)) **[P]**. Bemerkenswert: Selbst die dichteste dokumentierte Stufe, **40 px**, liegt deutlich über den historischen 16–18 px einer 98er-Listenzeile — hier kollidiert Zeitkolorit direkt mit heutigen Berührungszielen, und eine Dichteumschaltung (98-treu gegen fingertauglich) ist die naheliegende Auflösung **[A]**.

Zu Symbolen ist NN/g eindeutig: Universell verstandene Symbole sind selten — nahezu allgemein erkannt sind praktisch nur Haus, Drucken und die Lupe. „A text label must be present alongside an icon to clarify its meaning in that particular context", und die Beschriftung soll ohne Interaktion sichtbar bleiben, weil Hover-Aufdeckung auf Berührungsgeräten versagt. Dazu die „5-Sekunden-Regel": Wenn die Ideenfindung für ein Symbol länger dauert, wird es wahrscheinlich nicht kommunizieren. Und ein Befund, der 16-px-Symbole doppelt trifft: Die **relative** Größe zum Umfeld entscheidet über Auffindbarkeit ([NN/g, Icon Usability](https://www.nngroup.com/articles/icon-usability/)) **[P]**. Daraus folgt eine saubere Zweiteilung: Symbole für **Dinge** (Waren, Fahrzeuge, Städte) funktionieren, weil sie das Ding selbst zeigen können (Factorio-Regel); Symbole für **Handlungen und Zustände** (sortieren, filtern, stornieren) brauchen Text **[A]**. Glücklicher Umstand: Windows 98 nutzte fast überall Symbol plus Text — historische Optik und belegte Regel stimmen hier überein **[A]**.

Für die Augenführung im dichten Fenster ist die stärkste belegte Regel das Gestaltprinzip der Umschließung: „items within a boundary are perceived as a group", und eine sichtbare Begrenzung ist „a strong visual cue that can overpower other grouping principles such as proximity or similarity". Gerade deshalb sparsam — „using whitespace alone to create clear groupings reduces the visual complexity of a design", zu viele Rahmen erzeugen „busy, cluttered designs", und vollbreite abgesetzte Abschnitte erzeugen einen **falschen Boden**, weil „the new color creates a stopping point". Die Prüffrage der Quelle: „are they necessary to understand the grouping? Can I communicate this grouping by simply adding or removing whitespace?" ([NN/g, Common Region](https://www.nngroup.com/articles/common-region/)) **[P]**. Die 98er-Optik ist gestaltpsychologisch ein Extremfall von Umschließung: eingesenkte Gruppenrahmen, abgesetzte Flächen, 3D-Ränder überall. Das gruppiert stark und erkauft es mit Unruhe. Die praktische Folge: 98er-Rahmen auf der **Fenster**ebene nutzen, wo sie die Metapher tragen, innerhalb eines Fensters nach der Weißraum-zuerst-Regel arbeiten **[A]**. Factorios Praxis bestätigt das aus der Gegenrichtung: Die Layoutarbeit war im Kern Arbeit an „better margins and paddings, proper centering of some elements" ([FFF #348](https://factorio.com/blog/post/fff-348)) **[P]**.

Zur Schrift gibt es zwei Anker. WCAG 1.4.3 (AA): normaler Text mindestens **4,5:1**, großer Text mindestens **3:1**, „large scale" definiert als „at least 18 point or 14 point bold" (etwa 24 px und 18,5 px in CSS); die Zahl 4,5:1 kompensiert „the loss in contrast sensitivity usually experienced by users with vision loss equivalent to approximately 20/40 vision … commonly reported as typical visual acuity of elders at roughly age 80" ([W3C, Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)) **[P]**. Und aus der Spielebranche die konkreteste Einzelzahl: Karen Stevens (Accessibility-Leitung EA Sports) nennt **28 px Texthöhe** als empfohlene lesbare Größe gegenüber 80 px als Fernsehnorm, mit dem Merksatz „If nobody can read your text, it may as well not exist" — und ausdrücklich: eine Vergrößerungsoption rechtfertigt keine winzige Voreinstellung ([Game Developer, Legible font](https://www.gamedeveloper.com/design/legible-font-still-one-of-the-biggest-accessibility-issues-in-games)) **[P]**. Die Game Accessibility Guidelines führen dieselben drei Punkte qualitativ: „Use an easily readable default font size", „Allow the font size to be adjusted", „Use simple clear text formatting" ([GAG](https://gameaccessibilityguidelines.com/full-list/)) **[P]**.

Zur Karte ist die Beleglage die dünnste des Berichts. Ableitbar ist nur, was aus der Symbol- und Hierarchie-Literatur ohnehin folgt: Marken sind Symbole und brauchen bei Handlungsbedeutung Beschriftung, Zustände zusätzlich über Farbe kodieren, Beschriftungen mit dem Zoom staffeln, Fenster die Karte nicht standardmäßig in der Mitte verdecken lassen **[A]**. Ein übertragbares Factorio-Muster existiert: Erreichbarkeit direkt am Kartenpunkt anzeigen, damit der Spieler Irrelevantes „more easily recognize and possibly ignore" kann ([FFF #212](https://factorio.com/blog/post/fff-212)) **[P]**.

Zum Nachbau historischer Oberflächen gibt es genau einen substanziellen Text, und er formuliert eine Qualitätsschwelle: Nathalie Lawheads Arbeit sei „extremely precise in appropriating from over a decade and half of different Windows interfaces", im Gegensatz zum „casual and vaguely Windows 95-like look of some 'vaporware' games" ([Medium](https://medium.com/@LiterallyAKing/vintage-windows-guis-in-everything-is-going-to-be-ok-20b38b11bb4f)) **[S]**. Entweder genau oder gar nicht: Eine „irgendwie 98er"-Anmutung liest sich als Nachlässigkeit, eine genaue Nachbildung als Haltung — Genauigkeit heißt korrekte Kantenfarben des 3D-Rands, richtige Titelleistenverläufe, echte Systemschrift-Proportionen, Fokusrahmen, Menü-Trennlinien **[A]**.

**Prüfregeln:**

| # | Regel | Prüfung | Beleg |
|---|---|---|---|
| 37 | Baue ein Stil- und Widget-System, nicht Fenster. Ein Fenstersystem dieser Art landet im Bereich von 100 Fenstern. | Wie viele Stellen müssen geändert werden, um allen Knöpfen 2 px mehr Padding zu geben? Bei mehr als einer: durchgefallen. | **[P]** Factorio 120 Fenster, 800 Stile, 400 Widget-Typen |
| 38 | Nüchtern und kontrastreich, keine Zierelemente innerhalb der Fenster. Das 98er-Chrom ist der einzige erlaubte Dekor — und es sitzt am Fensterrahmen, nicht im Inhalt. | Zierelement im Fensterinhalt zeigen lassen. | **[P]** Factorio FFF #238 |
| 39 | Jedes Fenster braucht eine Begründung. Erweitere das bestehende Fenster, statt einen zweiten Dialog zu öffnen; bediene am Objekt („in situ"). | Zählung der offenen Fenster für eine Standardaufgabe. | **[P]** Factorio FFF #238/#246 |
| 40 | Die zitierte Konvention muss eingehalten werden: OK links / Abbrechen rechts nach Windows-Muster, Escape = Abbrechen, Titelleiste zieht, Doppelklick öffnet. Factorios Ausweg („so anders, dass keine Muskelerinnerung greift") steht hier nicht offen. | Gegen echtes Windows-Verhalten abgleichen. | **[A]** aus **[P]** Factorio FFF #246 |
| 41 | Standardpositionen beim Öffnen; Karte und Statusleiste werden nicht standardmäßig verdeckt; Taskleiste garantiert Wiederzugriff. Am Telefon ein Fenster im Vollbild. | Fünf Fenster öffnen: Ist noch etwas zu finden? | **[A]** aus **[P]** „eine Informationszone" (Game Developer) |
| 42 | Zustandsmeldungen müssen ohne Fensterwechsel sichtbar werden; Mikro- und Makroebene gleichzeitig. | Wichtiges Ereignis auslösen, während ein Fenster offen ist. | **[P]** Game Developer, Strategy UI |
| 43 | Tabellen: Text links, Zahlen rechts, Dezimalpunkt-Ausrichtung, Kopfzeile wie Spalte, Tabellenziffern, Spaltenbreite nach Inhalt. | `font-variant-numeric` gesetzt? Spalte mit verschieden langen Zahlen senkrecht scannen. | **[P]** A List Apart, Pencil & Paper |
| 44 | Zeilenhöhe als umschaltbare Dichte, drei Stufen, Wahl gespeichert. Referenz: **40 / 48 / 56 px**; die 98er-Stufe (16–18 px) ist eine vierte, ausdrücklich nicht fingertaugliche Option. | Umschalter vorhanden, Wahl übersteht Reload. | **[P]** Pencil & Paper; 98er-Stufe **[A]** |
| 45 | Keine Zebra-Streifen. Eine feine Trennlinie in einer Richtung plus Hervorhebung der Zeile unter dem Zeiger. | Tabelle gegen die Regel prüfen. | **[P]** A List Apart |
| 46 | Klebende Kopfzeile, Chevron-Sortierindikator ohne Störung der Ausrichtung, sinnvolle Sortiervoreinstellung (handlungsbedürftig zuerst), Suchtreffer hervorgehoben. | Lange Tabelle scrollen. | **[P]** Pencil & Paper |
| 47 | Symbole für **Dinge** dürfen das Ding selbst zeigen. Symbole für **Handlungen und Zustände** brauchen sichtbaren Text — keine reinen Symbolleisten für Handlungen. | Jedes Symbol ohne Tooltip benennen lassen. | **[P]** NN/g Icon Usability, **[P]** Factorio FFF #238 |
| 48 | Symbole skalieren mit der Schrift, nicht in festen Pixelgrößen. Auffindbarkeit hängt an der relativen Größe zum Umfeld. | Schrift auf 200 % stellen: bleiben Symbole klein? | **[P]** NN/g, **[P]** XAG 101 |
| 49 | Rahmen nur, wo verschiedene Arten von Bedienelementen zusammengehören oder Weißraum nicht anpassbar ist. Erst Weißraum, dann Rahmen. Prüffrage vor jedem Rahmen: Geht es auch mit Abstand? | Rahmen zählen und einzeln begründen. | **[P]** NN/g Common Region |
| 50 | Achte auf falsche Böden: Ein eingesenkter, abgeschlossen wirkender Listenbereich mit eigener Bildlaufleiste sieht vollständig aus, wenn er es nicht ist. | Testperson fragen, ob die Liste zu Ende ist. | **[P]** NN/g Common Region; Anwendung auf 98er-Rahmen **[A]** |

---

## Barrierefreiheit: 4,5:1, 3:1 und der Graustufentest

Zwei Regelwerke aus der Spielebranche und eines aus dem Web greifen hier sauber ineinander. Die Game Accessibility Guidelines sind nach Aufwand gestuft; entscheidend ist, dass die für diesen Nachbau kritischen Punkte in **basic** stehen, nicht in advanced: „Provide high contrast between text/UI and background", „Use an easily readable default font size", „Use simple clear text formatting", „Ensure no essential information is conveyed by a fixed colour alone", „Ensure interactive elements / virtual controls are large and well spaced", „Ensure that all areas of the user interface can be accessed using the same input method", „Avoid flickering images and repetitive patterns", „Ensure that all settings are saved/remembered" ([GAG, Full list](https://gameaccessibilityguidelines.com/full-list/)) **[P]**. Die Auflösung liefert dieselbe Quelle auf Stufe intermediate: „Allow interfaces to be resized", „Allow interfaces to be rearranged", „Provide an option to adjust contrast", „Provide a choice of text colour, low/high contrast choice as a minimum" — also ein umschaltbarer Modus statt eines Kompromisses im Standardlook **[P]**. Auf advanced: „Allow the font size to be adjusted", „Provide an option to turn off / hide all non interactive elements", „Include a cool-down period (post acceptance delay) of 0.5 seconds between inputs", „Include every relevant category of impairment amongst play-testing participants" **[P]**.

Die einzige Spielequelle mit harten Zahlen sind die Xbox Accessibility Guidelines, 23 durchnummerierte Leitlinien (101–123) mit eigenen Zeilen für PC/VR und Mobile ([Microsoft Learn, Übersicht](https://learn.microsoft.com/en-us/xbox/accessibility/guidelines)) **[P]**. XAG 101 Mindestschriftgrößen: **PC/VR 18 px bei 1080p, 36 px bei 4K**; **Mobile 18 px bei 100 DPI, 36 px bei 200 DPI, 72 px bei 400 DPI**, linear mit der DPI skalierend; Konsole 26 px bei 1080p. Skalierung auf **200 %** der Mindestgröße „without loss of content, functionality, or meaning". Textabstände für Blöcke über zwei Zeilen: Zeilenlänge maximal **80 Zeichen** (40 für CJK), Zeilenabstand mindestens **1,5x**, Absatzabstand mindestens **2x** des Zeilenabstands, Buchstabenabstand mindestens **0,12x** der Schriftgröße, Wortabstand mindestens **0,16x**. Und: Text in Icons und Glyphen muss die Mindestschriftgröße erreichen, Icons sollen mit der Textskalierung bis 200 % mitwachsen ([XAG 101](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/101)) **[P]**. Diese Abstandswerte sind praktisch identisch mit WCAG 1.4.12 — Microsoft hat die Webwerte übernommen, was die Übertragbarkeit der Webregeln auf Spiele stützt und für ein Browserspiel eine doppelt belegte Anforderung ergibt **[A]**.

XAG 102 liefert die Kontrastwerte: **Standardtext und visuelle Elemente 4,5:1**; **großformatiger Text und große visuelle Elemente 3:1**; **Text inaktiver Elemente 3:1**; **Elemente im High-Contrast-Modus 7:1**; Platzhalter-/Eingabefeldtext 4,5:1 bzw. 3:1. „Large-scale text" ist für PC/VR als **36 px bei 1080p** definiert. Zu Farbe: „Avoid relying on color alone to communicate information. When this isn't possible, provide players the option to choose the color of key game elements", und speziell: „The use of red and green for targeting icons or other important elements can cause difficulty for players with certain types of colorblindness" ([XAG 102](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/102)) **[P]**.

Die Häufigkeitszahlen dahinter: Weltweit haben **8 % der Männer und 0,5 % der Frauen** eine Rot-Grün-Störung; häufigste Form ist Deuteranomalie mit **rund 5 % der Männer**, Protanomalie, Deuteranopie und Protanopie je etwa 1 %; in skandinavischen Ländern bis 10–11 % der Männer; Tritanopie „very small, perhaps 1 in 30-50,000 people"; erworbene Farbsinnstörungen „as many as 3% of the population", besonders über 65 ([Colour Blind Awareness](https://www.colourblindawareness.org/colour-blindness/types-of-colour-blindness/)) **[P, Organisationsseite ohne benannte Einzelstudie]**. Rot/Grün für Gewinn und Verlust ist in einer Wirtschaftssimulation die naheliegendste und gleichzeitig die schlechteste Wahl, weil sie die häufigste Form direkt trifft **[A]**.

Der eigentliche Prüfstein für diesen Look ist aber nicht der Text, sondern WCAG 1.4.11 im Wortlaut: „The visual presentation of the following have a contrast ratio of at least 3:1 against adjacent color(s): **User Interface Components** Visual information required to identify user interface components and states, except for inactive components …; **Graphical Objects** Parts of graphics required to understand the content …" — und ausdrücklich ohne Aufrunden: „the computed values should not be rounded (e.g. 2.999:1 would not meet the 3:1 threshold)" ([W3C, Understanding SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)) **[P]**. 3:1 für Symbole ist zusätzlich als Technik dokumentiert ([W3C G207](https://www.w3.org/WAI/WCAG21/Techniques/general/G207)) **[P]**. Der 98er-Look lebt von 1-px-Bevel-Kanten in Hellgrau und Dunkelgrau auf Grau. Wenn „gedrückt" gegen „nicht gedrückt", „Fokus" gegen „kein Fokus" oder „Feldrand" gegen „Fensterfläche" nur durch diese Kanten unterschieden wird, ist das genau die geforderte Zustandsinformation und muss 3:1 erreichen **[A]**. Die Ausnahme für inaktive Komponenten entschärft den ausgegrauten Menüeintrag — nicht den aktiven Knopf, dessen Rand man nicht sieht **[A]**.

Ob WCAG für Spiele gilt, ist nur sekundär geklärt: „WCAG was designed for web content broadly, not games specifically, but a significant number of its criteria apply directly to the non-gameplay portions of web games: menus, settings screens, dialogue, text content, and any UI that is not the real-time game canvas", und die Arbeitsteilung wird so beschrieben, dass WCAG 2.2 die Web-UI abdeckt, die XAG die Spielmechanik, und der European Accessibility Act Konformität mit „WCAG 2.1 Level AA" für Spiele an EU-Verbraucher rechtlich verlangt ([Abratabia](https://www.abratabia.com/game-accessibility/accessibility-guidelines.php)) **[S, Seite ohne erkennbare Autorenschaft — die EAA-Aussage vor Verwendung an Richtlinie (EU) 2019/882 und EN 301 549 prüfen]**. Die branchenübliche Berufung auf eine Sonderrolle des Gameplays greift hier ohnehin kaum: Eine Wirtschaftssimulation mit nachgebautem Desktop hat fast kein „real-time game canvas", sie ist überwiegend Menü, Fenster, Tabelle und Dialog **[A]**.

Zur Fehlervermeidung ist Nielsens Heuristik 5 eine **Rangordnung**, keine Liste: „Either eliminate error-prone conditions, or check for them and present users with a confirmation option before they commit to the action", mit den Zusätzen „Prioritize your effort: Prevent high-cost errors first, then little frustrations" und „Avoid slips by providing helpful constraints and good defaults". Heuristik 3 fordert „a clearly marked 'emergency exit' … without having to go through an extended process", Undo und Redo, und einen klar beschrifteten, auffindbaren Ausgang ([NN/g, 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)) **[P]**. Ein Bestätigungsdialog ist damit ausdrücklich die zweite Wahl — das belegbare Argument gegen Dialoginflation **[A]**. XAG 115 macht daraus Prüfbares: „Allow players to review, correct, or completely reverse actions before committing"; Bestätigungsdialoge für „In-game purchases, Item sales, Save overwrites, Settings changes"; „Implement two-step processes for permanent actions" mit Annehmen und Abbrechen in jedem Schritt; „Don't require button holds for destructive action confirmation"; Fehlerort visuell hervorheben; Werkseinstellungen zurücksetzbar ([XAG 115](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/115)) **[P]**.

Hier liegt eine Spannung, die benannt werden muss: In einer Wirtschaftssimulation ist die Tragweite von Entscheidungen der Spielinhalt, und Undo für jede Fehlentscheidung würde das Spiel zerstören. Die Auflösung liegt in der Trennung von **Bedienfehler** und **Spielentscheidung**: Nachsicht gilt für Slips der Bedienung, nicht für bewusste Spielzüge. XAG 115s Beispiele sind genau Bedienvorgänge, keine Strategieentscheidungen **[A]**. Daraus folgt die Asymmetrie als Entwurfsprinzip: Der Weg in die irreversible Handlung darf Reibung haben, der Weg hinaus nicht **[A]**.

Bei Bewegung ist der 98er-Look im Vorteil. `prefers-reduced-motion` „is used to detect if a user has enabled a setting on their device to minimize the amount of non-essential motion", Werte `no-preference` und `reduce`, begründet mit vestibulären Störungen: „Animations such as scaling or panning large objects can be vestibular motion triggers" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)) **[P]**. Die Originaloberfläche kennt praktisch keine Animation — problematisch sind ausgerechnet die *modernen Zusätze* eines Nachbaus: animiertes Minimieren, Zoom-Übergänge, blinkende Taskleisteneinträge **[A]**. Und der GAG-Punkt „Avoid flickering images and repetitive patterns" trifft eine sehr 98er-spezifische Gefahr: Dither-Muster und 1-px-Schachbrettfüllungen (Desktop-Hintergrund, Rollbalken-Rinne, Auswahl-Laufrahmen) sind genau „repetitive patterns" **[A]**.

Zum Speichern sind drei Anforderungen belegt: „Provide an autosave feature" (GAG intermediate), „Ensure that all settings are saved/remembered" (GAG basic), Bestätigungsdialog ausdrücklich für „Save overwrites" (XAG 115) **[P]**. Für ein Browserspiel ist Datenverlust ein größeres Risiko als für ein installiertes Spiel — Tab schließen, Reload, geleerter Speicher, privates Fenster. Wer seine Oberfläche mühsam auf 200 %, hohen Kontrast und reduzierte Bewegung gestellt hat, verliert bei Datenverlust die Spielbarkeit, nicht nur den Fortschritt; deshalb steht „settings are saved/remembered" in der Stufe basic **[A]**.

Methodisch schließt Celia Hodent den Kreis: „data is not information" — Telemetrie zeigt, *was* passiert, das *warum* erfordert frühes Playtesting; und „You can't 'introduce player psychology into the process'. Considering human factors at every step IS the process" ([Game Developer](https://www.gamedeveloper.com/design/a-quick-ux-lesson-from-gdc-masterclass-teacher-celia-hodent)) **[P]**. Ob kleine Schrift und graue Ränder Spieler tatsächlich blockieren, entscheidet damit kein Argument, sondern ein Playtest mit betroffenen Spielern — deckungsgleich mit GAG advanced „Include every relevant category of impairment amongst play-testing participants" **[A]**.

**Prüfregeln:**

| # | Regel | Prüfung | Beleg |
|---|---|---|---|
| 51 | Grundschriftgröße im Standardzustand **mindestens 18 px bei 1080p**. Am Telefon ist die physische Größe der Maßstab, nicht die CSS-Zahl (18 px @100 DPI, linear mit der DPI). | Messen, nicht schätzen. | **[P]** XAG 101 |
| 52 | Text auf **200 %** skalierbar ohne Verlust von Inhalt, Funktion oder Bedeutung. Icons und Glyphen skalieren mit. | Auf 200 % stellen und jedes Fenster durchklicken. Abgeschnittener Text = durchgefallen. | **[P]** XAG 101 |
| 53 | Eine Vergrößerungsoption rechtfertigt keine winzige Voreinstellung. Referenzwert für komfortable Lesbarkeit: **28 px Texthöhe**. | Standardzustand ohne jede Einstellung prüfen. | **[P]** Stevens / Game Developer |
| 54 | Textblöcke über zwei Zeilen: maximal **80 Zeichen** Zeilenlänge, Zeilenabstand ≥ **1,5x**, Absatzabstand ≥ **2x** des Zeilenabstands, Buchstabenabstand ≥ **0,12x**, Wortabstand ≥ **0,16x** der Schriftgröße. | Am längsten Textblock messen. | **[P]** XAG 101 (deckungsgleich mit WCAG 1.4.12 **[A]**) |
| 55 | Text **4,5:1**, großer Text (ab 18 pt / 14 pt fett) **3:1**, Text inaktiver Elemente **3:1**, High-Contrast-Modus **7:1**. Nicht aufrunden. | Rechner über jede Farbpaarung. | **[P]** WCAG 1.4.3, **[P]** XAG 102 |
| 56 | Jede Knopfkante, jeder Feldrand, jeder Fokusring, jeder Zustandsunterschied **3:1** gegen die Nachbarfläche. Grau-auf-Grau-Bevel als einziger Zustandsträger ist der zentrale Verstoß dieses Looks. | Screenshot von „gedrückt" und „nicht gedrückt" vergleichen und die Kanten messen. | **[P]** WCAG 1.4.11, **[P]** G207 |
| 57 | Keine Information allein über Farbe. Zweiter Träger: Vorzeichen, Pfeil, Symbol, Text, Muster, Position. Rot/Grün nicht für Gewinn/Verlust allein. | **Graustufentest:** Screenshot in Graustufen wandeln — ist die Information noch ablesbar? | **[P]** GAG basic, **[P]** XAG 102; Betroffenheit **[P]** 8 % Männer / 0,5 % Frauen, Deuteranomalie ~5 % |
| 58 | `prefers-reduced-motion: reduce` respektieren: alle nicht essenziellen Animationen abschalten oder durch Sofortwechsel ersetzen. | Systemeinstellung setzen, Seite laden, Animationen zählen. | **[P]** MDN, **[P]** GAG |
| 59 | Keine Dither-Flimmermuster und kein Blinken: Schachbrettfüllungen, Rollbalken-Rinne, Auswahl-Laufrahmen, blinkende Taskleisteneinträge. | Auf Zielgröße und bei Bewegung ansehen. | **[P]** GAG „Avoid flickering images and repetitive patterns"; 98er-Anwendung **[A]** |
| 60 | Erst die fehleranfällige Bedingung beseitigen, dann Undo, und nur bei wirklich dauerhaften Handlungen ein Dialog. Zweistufig nur dort; jeder Schritt mit Abbrechen; keine Halte-Bestätigung. | Dialoge zählen und einzeln gegen „ist wirklich unumkehrbar" prüfen. | **[P]** Nielsen H5, **[P]** XAG 115 |
| 61 | Vor einer unumkehrbaren Handlung: Folge benennen (nicht nur die Aktion), Unumkehrbarkeit aussprechen, Bestätigungsknopf trägt das Verb der Handlung („Firma verkaufen"), nicht „OK". Der Weg hinein darf Reibung haben, der Weg hinaus nicht. | Jeden destruktiven Dialog wörtlich lesen. | **[A]** aus **[P]** XAG 115 + Nielsen H3 |
| 62 | Nachsicht gilt für Bedienfehler, nicht für Spielentscheidungen. Undo für Klicks, nicht für Strategie. | Jede Undo-Möglichkeit einordnen: Bedienvorgang oder Spielzug? | **[A]** aus **[P]** XAG 115 (Beispiele sind Bedienvorgänge) |
| 63 | Autosave nach jeder folgenreichen Aktion; Einstellungen getrennt vom Spielstand persistieren; Bestätigung vor dem Überschreiben; Werkseinstellungen zurücksetzbar. | Spielstand löschen — bleiben Schrift, Kontrast und Bewegungseinstellung? | **[P]** GAG, **[P]** XAG 115 |
| 64 | Jede Region der Oberfläche mit **derselben** Eingabeart erreichbar. Keine Funktion, die nur mit Maus oder nur mit Finger geht. | Einmal komplett nur mit Maus, einmal nur mit Finger, einmal nur mit Tastatur durchspielen. | **[P]** GAG basic, **[P]** XAG 107 |
| 65 | Dass der Look bedienbar ist, entscheidet ein Playtest mit betroffenen Spielern, nicht ein Argument. | Testteilnehmer nach Beeinträchtigungskategorie dokumentieren. | **[P]** Hodent („data is not information"), **[P]** GAG advanced |

---

## Der zentrale Konflikt: 98er-Optik gegen Lesbarkeit, Fingergrößen und 200 % Skalierung

Der Konflikt ist real, aber er betrifft nicht den Look, sondern vier präzise Stellen — und in drei anderen Punkten ist der 98er-Rahmen modernen Oberflächen voraus. Dieses Kapitel arbeitet beide Seiten aus und leitet daraus eine Position ab, die nichts erfindet.

**Stelle 1: Die Schriftgröße.** Die historische Vorlage arbeitete mit MS Sans Serif bzw. Tahoma 8 pt bei 96 dpi, also rund **11 px** Glyphenhöhe. Dagegen stehen drei Zahlen aus drei Quellen: XAG 101 mit **18 px bei 1080p** als Minimum ([XAG 101](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/101)) **[P]**, Karen Stevens mit **28 px** als komfortabler Lesbarkeit ([Game Developer](https://www.gamedeveloper.com/design/legible-font-still-one-of-the-biggest-accessibility-issues-in-games)) **[P]**, und WCAG 1.4.3 mit der Grenze „18 point or 14 point bold" (etwa 24 px bzw. 18,5 px CSS), unter der die strengere 4,5:1-Regel gilt ([W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)) **[P]**. 11 px liegt unter allen drei. Das ist kein Grenzfall, sondern ein Faktor von etwa 1,6 bis 2,5.

**Stelle 2: Die Trefferflächen.** 16-px-Titelleistenknöpfe und 16-px-Rollbalkenpfeile liegen unter allen vier Plattformzahlen: Apple 44×44 pt **[S]**, Google 48×48 dp mit 8 dp Abstand ≈ 9 mm **[P]**, Microsoft 7,5 mm / 40×40 px **[P]**, WCAG 2.5.8 mit 24×24 CSS-px **[S]** — und unter dem Forschungswert von 9,2 mm für diskrete Aufgaben ([Parhi et al. 2006](https://www.microsoft.com/en-us/research/wp-content/uploads/2006/01/parhi-mobileHCI06.pdf)) **[P]**. Verschärfend: Die drei Titelleistenknöpfe stehen im Original direkt aneinander und verletzen damit nicht nur die Größenbedingung, sondern auch die Abstandsausnahme von WCAG 2.5.8 — 24-px-Kreise auf ihren Mitten schneiden sich **[A]**. Und die 98er-Konvention, Wichtiges in Ecken zu legen, kehrt am Finger ihr Vorzeichen um: „touchscreen devices don't benefit from edge placement; targets actually take longer to hit there" ([NN/g](https://www.nngroup.com/articles/fitts-law/)) **[P]**.

**Stelle 3: Der Bevel als einziger Zustandsträger.** Das ist der schärfere Prüfstein, nicht die Schrift. Der Look lebt von 1-px-Kanten in Hellgrau und Dunkelgrau auf #C0C0C0. Wenn „gedrückt", „fokussiert" oder „Feldrand" allein daran hängt, ist das die von WCAG 1.4.11 geforderte „visual information required to identify user interface components and states" und muss **3:1** erreichen, ohne Aufrunden ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)) **[P]**. Die Ausnahme für inaktive Komponenten hilft beim ausgegrauten Menüeintrag, nicht beim aktiven Knopf **[A]**.

**Stelle 4: Die feste Pixelgeometrie gegen 200 %.** XAG 101 verlangt Skalierung auf 200 % „without loss of content, functionality, or meaning", und Icons müssen mitwachsen **[P]**. Das sprengt die Original-Pixelgeometrie: Fensterrahmenbreite, Titelleistenhöhe, Menübalken, Tabellenzeilen, Bevel-Stärken müssten mitskalieren. Daraus folgt eine **architektonische**, nicht nur gestalterische Anforderung: Die gesamte Oberfläche muss in relativen Einheiten gebaut sein. Ein Nachbau mit festen Pixelwerten und Bitmap-Grafiken für Rahmen und Icons scheitert hier strukturell **[A]**. Dazu kommt die Pixelart-Klemme: Eine Pixelschrift und pixelbasierte Rahmengrafiken sind nur bei ganzzahligen Vielfachen scharf ([tanalin](https://tanalin.com/en/articles/integer-scaling/)) **[P]**, was eine stufenlose Zoomskala ausschließt und Skalierung in Stufen (1×, 1,5×, 2×) erzwingt — wobei 1,5× für die Pixelgrafik nicht zulässig ist und dort auf den nächsten ganzzahligen Faktor gerundet werden muss **[A]**.

**Wo der 98er-Look voraus ist.** Drei Punkte, und sie sind nicht kosmetisch. Erstens **Animationsarmut**: Die Originaloberfläche kennt praktisch keine Übergänge. `prefers-reduced-motion` ist damit im Standardzustand fast automatisch erfüllt, und die Stellen, die abschaltbar sein müssen, sind ausgerechnet die *modernen Zusätze* eines Nachbaus ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)) **[A]**. Zweitens **beschriftete Modaldialoge**: Das Original arbeitet mit OK/Abbrechen in Textform, sichtbaren Schaltflächenbeschriftungen und Tastaturkürzeln. Das erfüllt Nielsens „clearly marked 'emergency exit'" ([NN/g](https://www.nngroup.com/articles/ten-usability-heuristics/)) **[P]** besser als viele heutige Icon-only-Oberflächen, und es deckt sich mit NN/gs Symbolregel, dass ein Symbol eine sichtbare Beschriftung braucht ([NN/g, Icon Usability](https://www.nngroup.com/articles/icon-usability/)) **[P]** — Windows 98 nutzte fast überall Symbol plus Text **[A]**. Drittens **Textkontrast**: Schwarz auf #C0C0C0 erreicht sehr hohe Werte und erfüllt 4,5:1 mit großem Abstand **[A]**. Der Look verstößt also nicht dort, wo man es vermutet.

**Die ableitbare Position: eine skalierte 98er-Optik.** Die Regelwerke verlangen nirgends, dass der Standardlook barrierefrei *aussieht* — sie verlangen, dass der Spieler ihn anpassen kann: „Allow interfaces to be resized", „Provide an option to adjust contrast", „Provide a choice of text colour, low/high contrast choice as a minimum", „Allow the font size to be adjusted" ([GAG](https://gameaccessibilityguidelines.com/full-list/)) **[P]**, plus High-Contrast-Modus mit 7:1 ([XAG 102](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/102)) **[P]**. Damit ist der Konflikt lösbar, ohne die Retro-Ästhetik zu opfern. Der Weg besteht aus vier Teilen:

Erstens: **Proportionen treu, absolute Größen angehoben.** Die 98er-Formensprache bleibt exakt — korrekte Kantenfarben des 3D-Rands, richtige Titelleistenverläufe, echte Systemschrift-Proportionen, Fokusrahmen, Menütrennlinien; die Lawhead-Analyse liefert dafür die Begründung, dass die Wirkung an der **Präzision** hängt und eine vage 95er-Anmutung als Nachlässigkeit liest ([Medium](https://medium.com/@LiterallyAKing/vintage-windows-guis-in-everything-is-going-to-be-ok-20b38b11bb4f)) **[S]**. Aber die Grundschrift wird auf mindestens 18 px gezogen und alles andere proportional mit. Das Ergebnis ist ein „Windows 98 bei etwa 150 % DPI"-Look — historisch plausibel, weil Windows 98 selbst eine „Große Schriftarten"-Einstellung und ein High-Contrast-Design hatte. Der Kompromiss ist damit **innerhalb** der Ästhetik begründbar, nicht gegen sie **[A]**.

Zweitens: **Skalierung als Nutzereinstellung, nicht als Festlegung.** Das ist der Weg, den Factorio dokumentiert gegangen ist: Kontrast „increased quite a lot", Schrift um 2 pt erhöht, und „the user will have control of the font size in the options menu" ([FFF #238](https://factorio.com/blog/post/fff-238)) **[P]**. Bemerkenswert daran: Selbst ein für seine Oberfläche gelobtes, dichtes Spiel war nach Jahren zu klein und zu kontrastarm — das ist der stärkste verfügbare Beleg gegen die Annahme, ein dichtes Spiel-UI komme ohne Skalierung aus **[A]**.

Drittens: **Optik von Trefferfläche trennen.** Das ist der einzige gefundene Weg, der die gestalterische Absicht nicht opfert. Google beschreibt ihn wörtlich — „touch targets extend beyond the visual bounds of an element" — mit dem Beispiel, dass ein 24×24-dp-Icon per Padding auf 48×48 dp Trefferfläche kommt, technisch über `TouchDelegate` bzw. `Modifier.sizeIn` ([Android Accessibility Help](https://support.google.com/accessibility/android/answer/7101858?hl=en)) **[P]**. Der 16-px-Schließknopf darf 16 px groß **aussehen** und 48 px groß **sein**. WCAG deckt dasselbe über die Abstandsausnahme ab **[S]**. Grenze des Kunstgriffs: Bei aneinanderklebenden Knöpfen reicht Padding nicht, weil sich die Flächen überlappen würden — dort muss der Abstand in der Telefonfassung tatsächlich wachsen **[A]**.

Viertens: **Der Standardzustand hat eine Untergrenze.** Eine Oberfläche, die mit 11-px-Schrift und unsichtbaren Knopfrändern startet, verlangt von jedem betroffenen Spieler, sie zuerst zu reparieren — und setzt voraus, dass er die Einstellungen überhaupt lesen kann. Mindestens der Weg zu den Einstellungen muss deshalb im Standardzustand die Mindestwerte erfüllen. Das folgt logisch aus XAG 101 (Mindestgröße als Basis, Skalierung obendrauf) plus GAG basic („easily readable **default** font size") und ist eine Ableitung, kein Zitat **[A]**. Stevens sagt denselben Gedanken für die Schrift ausdrücklich: „font resizing shouldn't justify tiny baseline text" **[P]**.

**Prüfregeln:**

| # | Regel | Prüfung | Beleg |
|---|---|---|---|
| 66 | Baue die gesamte Oberfläche in relativen Einheiten mit einer einzigen Skalierungsgröße. Bevel-Breiten, Titelleistenhöhen, Menübalken, Zeilenhöhen leiten sich daraus ab. | Skalierungsgröße verdoppeln: Wächst alles, oder bleibt etwas stehen? | **[A]** aus **[P]** XAG 101 (200 %) |
| 67 | Standardzustand: 98er-Proportionen treu, Grundschrift ≥ 18 px. Kein Nachbau der absoluten Originalmaße. | Original-Screenshot und Build nebeneinander: gleiche Proportion, größere Maße. | **[A]** aus **[P]** XAG 101, Stevens, Lawhead-Analyse **[S]** |
| 68 | Pixelgrafik nur in ganzzahligen Faktoren skalieren, auch wenn die Schrift zwischenstufig skaliert. Zwei getrennte Skalierungspfade: Text/Layout stufenlos oder in Stufen, Pixelgrafik ganzzahlig gerundet. | Bei 150 % Textskalierung die Sprites auf Flimmern prüfen. | **[P]** tanalin; Trennung der Pfade **[A]** |
| 69 | Sichtbare Größe und Trefferfläche sind zwei verschiedene Werte. Der 16-px-Knopf sieht 16 px groß aus und ist 44–48 px groß. | Trefferrechtecke einfärben. | **[P]** Google `TouchDelegate` |
| 70 | Wo Knöpfe im Original aneinanderkleben (Titelleiste), reicht Padding nicht. In der Telefonfassung wächst der Abstand tatsächlich. | 24-px-Kreise auf Knopfmitten, Schnittprüfung. | **[A]** aus **[S]** WCAG 2.5.8 Spacing |
| 71 | Genau oder gar nicht: korrekte Kantenfarben, Titelleistenverläufe, Systemschrift-Proportionen, Fokusrahmen, Menütrennlinien. Eine vage Anmutung liest sich als Nachlässigkeit. | Detailabgleich gegen Referenz-Screenshots. | **[S]** Lawhead-Analyse |
| 72 | Der Standardzustand muss ohne jede Einstellung bedienbar sein — mindestens der Weg zu den Einstellungen. | Frisches Profil, keine Einstellungen, Weg zu Schrift und Kontrast prüfen. | **[A]** aus **[P]** XAG 101 + GAG basic; **[P]** Stevens |
| 73 | Nutze die drei Stärken des Looks bewusst: bleib animationsarm, beschrifte Dialogknöpfe mit Text, halte Schwarz auf #C0C0C0 für Fließtext. | Jeden hinzugefügten Übergang und jeden Icon-only-Knopf begründen. | **[P]** MDN, **[P]** Nielsen H3, **[P]** NN/g Icon Usability; Kontrastbefund **[A]** |
| 74 | Alle Anpassungen (Skalierung, Kontrast, Bewegung, Dichte, Eingabemodus) werden gespeichert und überleben den Verlust des Spielstands. | Spielstand löschen, Einstellungen prüfen. | **[P]** GAG basic, **[P]** XAG 115 |

---

## Was diese Recherche nicht belegen konnte

Dieser Abschnitt ist kein Anhang, sondern Teil des Ergebnisses. Die folgenden Punkte sind gesucht und **nicht** gefunden worden; sie dürfen im Projekt nicht als Wissen behandelt werden.

**Die größte Lücke: keine Erfahrungsberichte zu nachgebauten Betriebssystem-Oberflächen.** Es wurden **keine** Entwickler-Postmortems und **keine** Nutzertests zu Spielen mit nachgebauter OS-Oberfläche gefunden (Hypnospace Outlaw, Her Story, Orwell, Emily Is Away), die benennen, welche Bedienprobleme der Nachbau erzeugt hat. Ein Postmortem zu Hypnospace Outlaw wäre die Wunschquelle. Ebenso wurde keine Quelle gefunden, die überlappende Nachbau-Fenster auf Berührungsbedienung untersucht. Der einzige substanzielle Text zum Thema (Lawhead-Analyse) ist kulturkritisch, nicht entwurfstechnisch, und liegt nur als Medium-Beitrag vor.

**Keine Fallstudie mit Zahlen zum Umbau von Maus auf Finger.** Es wurden **keine** dokumentierten Fallstudien gefunden, in denen ein Spiel seine Maus-Oberfläche für das Telefon umbauen musste und dabei Fehlerraten oder Zeiten vor und nach dem Umbau nennt. Die einschlägigen GDC-Vault-Einträge („UI Design from PC Game to Mobile Game", GDC China 2015; „Get in Touch: Effective Transition from PC to Mobile"; „Usability Lessons from Mobile Board Game Conversions") liefern nur Abstracts. Die Umbauliste in Kapitel „Zielgrößen" ist deshalb durchgehend **[A]**, nicht belegte Praxis.

**Keine Mindestpixelgrößen für Gesichter, Fahrzeuge oder Symbole.** **Keine Quelle** nennt eine Mindestgröße in Pixeln, ab der ein Gesicht, ein Fahrzeug oder ein Symbol lesbar ist. Die klassischen Lehrtexte (Jansson, Yu) argumentieren qualitativ. Die einzige belegte Produktionszahl ist Dead Cells' 50 px Figurenhöhe; die daraus abgeleiteten 32–64 px für ein Fahrzeug sind **[A]** und im Projekt durch einen Rendertest zu ersetzen.

**Porträtkonventionen der 80er und 90er: unbelegt.** Es wurde **keine** belastbare Quelle zu dokumentierter Porträtpraxis in Spielen dieser Zeit gefunden. Die Suche lieferte Asset-Shops, Stockbild-Seiten und Pinterest. saint11s Lehrblatt „Portraits" liegt nur als Bild vor und wurde nicht ausgewertet. Die Empfehlung, Wiedererkennbarkeit über ein starkes Silhouettenmerkmal pro Person zu lösen, ist eine Ableitung aus den Silhouetten- und Kontrastregeln **[A]**.

**Keine Bildzahl für Blinzeln oder Mimik.** **Keine Quelle** nennt eine konkrete Bildzahl für ein glaubwürdiges Blinzeln; auch Slynyrds Artikel nennt ausdrücklich keine Bildzahlen. Für Idle-Animationen ließ sich kein zitierfähiger Wert sichern. Die häufig gehörten „2–3 Bilder" sind **[U]**.

**Doppelklick: nichts Quantitatives.** Es wurde **keine** Forschungsliteratur und **keine** Plattformrichtlinie gefunden, die Doppelklick gegen Einzelklick quantitativ bewertet (Fehlerraten, Zeitbedarf, Lernbarkeit), und nichts zu Doppeltipp auf Berührungsbildschirmen. Suchergebnisse zu „long click context menu" führten nur auf Patentschriften, die als Usability-Belege unbrauchbar sind. Auch zur Frage, wie gut Nutzer Rechtsklick-Funktionen in Webanwendungen entdecken, gibt es keine Quelle. Die stärkste belegbare Aussage bleibt die Regel gegen erzwungene Wiederholungs- und Gleichzeitigkeitseingaben.

**Weitere fehlende Zahlen.** Keine Zahl zur optimalen Long-Press-Verzögerung (die verbreiteten 500 ms sind Plattformpraxis, hier unbelegt); keine Vergleichszahlen zwischen Drag-and-Drop und Tipp-Tipp-Auswahl; keine Prozentzahl zur Bildschirmverdeckung durch den Finger; keine Zahlen zu Dauer und Lautstärke von UI-Tönen und keine Studie zu Ton-Ermüdung; keine empirisch begründete Dauer für Hochzähl-Animationen; keine Zahl dafür, ab welcher Verzögerung ein Fortschrittsindikator eingeblendet werden soll, um Aufblitzen zu vermeiden; keine empirische Studie zu Zeilenhöhen oder Zebra-Streifen mit Fehlerraten; keine Quelle zur Zeilenlänge speziell in Spielen (die klassische 45–75-Zeichen-Regel ließ sich nicht primär belegen — die belegbare Zahl ist XAG 101 mit maximal 80 Zeichen); keine belastbare Quelle zu Pixelschriften, Ganzzahl-Skalierung oder Hinting speziell in Spieloberflächen; keine Quelle zur Häufigkeit vestibulärer Störungen; keine Quelle zu Autosave-Intervallen oder zur Haltbarkeit von localStorage/IndexedDB als Spielstandspeicher; keine Quelle zu „confirmation fatigue".

**Nicht erreichbare Quellen.** Das GDC-2019-Postmortem zu *Into the Breach* — die naheliegende Quelle für Lesbarkeit und Informationsdesign bei kleinen Kacheln — lieferte beim Abruf **HTTP 403**; die URL für einen zweiten Versuch lautet https://ubm-twvideo01.s3.amazonaws.com/o1/vault/gdc2019/presentations/Into%20the%20Breach%20Postmortem%20Final.pdf. Die Primärseiten von **Apple HIG** und der **W3C-Understanding-Dokumente zu Zielgrößen** ließen sich nicht direkt abrufen (JavaScript-Pflicht bzw. Abrufsperre); die Zahlen 44×44 pt und 24×24 CSS-px stammen deshalb aus der Sekundärquelle **TetraLogical** bzw. DigitalA11Y und sind vor Veröffentlichung am Original zu prüfen. Die Seite „Use an easily readable default font size" der **Game Accessibility Guidelines** antwortete **zweimal mit HTTP 429**; ihr exakter Wortlaut und eine dort möglicherweise genannte Prozentregel (Texthöhe relativ zur Bildschirmhöhe) konnten nicht verifiziert werden — **die oft zitierte „4 %"-Regel wurde daher bewusst nicht aufgenommen und ist hier unbelegt**. XAG 107 im Volltext mit konkreten Zielgrößen für Maus- und Touchflächen, XAG 109 (Object clarity) und XAG 117 (Visual distractions and motion settings) wurden nicht im Wortlaut abgerufen; WCAG 1.4.4 (Resize Text, 200 %) und WCAG 2.3.3 (Animation from Interactions) ebenfalls nicht.

**Bewusst verworfene Quellen.** Zur Kritik an übertriebener Juiciness existieren drei Blogtexte bei „Wayline" („The Perils of Over-Juicing", „The Juice Problem", „The Seductive Squeeze"). Sie sind unsigniert, ohne erkennbare Autorschaft und ohne Belege und wirken maschinell erzeugt; **von dort wurde nichts übernommen**, und sie sollten nicht als Belegquelle verwendet werden. Damit existiert keine hochwertige, namentlich verantwortete Kritik an Over-Juicing — die belastbare Kritik kommt indirekt über NN/gs Warnung vor zu langen Animationen und über Spielerbeschwerden zu Animationslänge. Verworfen wurden außerdem Produktseiten zu Pixelart-Skalierung (Divoom-Blog, pixelconvertor, image-scaler.com) und SEO-Seiten von KI-Sprite-Anbietern zum Thema Style Guide.

**Sekundär belegte Stellen, die vor Verwendung zu prüfen sind.** Swinks „game feel" liegt nur über eine Lesenotiz vor; seine konkreten Toleranzwerte für Eingabeverzögerung ließen sich **nicht** mit einer Zahl belegen — ersatzweise gilt Nielsens 0,1 s. Die Technikenliste aus „Juice it or lose it" stammt aus Zusammenfassungen Dritter, nicht aus dem Originalton; die kursierende Liste von rund 30 Punkten aus „The art of screenshake" ließ sich nicht quellenfest rekonstruieren. Pratt et al. (2010) wurde nur als Zitat bei NN/g geprüft. Porters Klickstudie liegt nur in NN/gs knapper Darstellung vor (keine Teilnehmerzahl, keine Erfolgsquoten). Die Aussage, der European Accessibility Act verlange WCAG 2.1 AA für Spiele, stammt von einer Sekundärseite ohne erkennbare Autorenschaft und ist an Richtlinie (EU) 2019/882 und EN 301 549 zu prüfen. Die 8-Prozent-Zahl zur Farbfehlsichtigkeit stammt von einer Organisationsseite, die im abgerufenen Abschnitt keine Einzelstudie nennt. Celia Hodents bekannte Usability-Säulen und ihre Unterscheidung produktiver von unproduktiver Frustration ließen sich **nicht** im Wortlaut belegen. Die Basisauflösungsliste (SNES 256×224, Celeste 320×180, Hyper Light Drifter 480×270, Owlboy und Dead Cells je 640×360) stammt aus einem einzelnen Social-Media-Post und ist nicht an Entwicklerangaben verifiziert. Zu EGA und VGA wurde **keine** Primärquelle abgerufen; die üblichen Hardwarezahlen sind vor Verwendung zu verifizieren.

---

## Annahmeliste

Ein Build gilt als konform, wenn alle folgenden Bedingungen erfüllt und messbar nachgewiesen sind. Jede Zeile ist ein Testfall.

| # | Bedingung | Messverfahren |
|---|---|---|
| A1 | Grundschrift im Standardzustand ≥ 18 px bei 1080p; am Telefon physisch äquivalent | Messen am gerenderten Text |
| A2 | Textskalierung auf 200 % ohne abgeschnittenen Text, ohne verlorene Funktion, Icons wachsen mit | Jedes Fenster bei 100 % und 200 % durchklicken |
| A3 | Text 4,5:1; großer Text (≥ 18 pt / 14 pt fett) 3:1; inaktiver Text 3:1; High-Contrast-Modus 7:1; nicht aufgerundet | Kontrastrechner über jede Farbpaarung |
| A4 | Jede Knopfkante, jeder Feldrand, jeder Fokusring, jeder Zustandsunterschied 3:1 gegen die Nachbarfläche | Screenshots der Zustände vergleichen, Kanten messen |
| A5 | Graustufentest bestanden: Kein Screenshot verliert in Graustufen eine Information | Alle Hauptfenster in Graustufen wandeln |
| A6 | Jede Trefferfläche am Telefon ≥ 44 px mit ≥ 8 px Abstand; kein interaktives Element unter 24 px | Trefferrechtecke einfärben und messen |
| A7 | Bei aneinanderliegenden Kleinknöpfen schneiden sich keine 24-px-Kreise auf den Mitten | Kreistest auf Titelleiste, Rollbalken, Symbolleiste |
| A8 | Kein häufig benötigtes Ziel liegt in der Telefonfassung in einer Bildschirmecke | Telefonlayout gegen Zielliste prüfen |
| A9 | Erste sichtbare Antwort auf jede Eingabe innerhalb von 0,1 s; kein Animationsvorlauf vor der Zustandsänderung | Bildschirmaufnahme, Frames zählen |
| A10 | Alle Animationsdauern dokumentiert; klein 120–200 ms, Fenster 200–300 ms, keine über 400 ms ohne Eintrag im Protokoll | Liste der Dauerwerte |
| A11 | Jede Animation durch Klick abbrechbar und zum Endzustand springend | Während jeder Animation klicken |
| A12 | Wartezustände korrekt gestaffelt: < 1 s ohne Indikator, 2–10 s Laufanimation mit Statustext, ab 10 s Prozentbalken mit Abbruch | Rundenwechsel und Ladevorgänge messen |
| A13 | `prefers-reduced-motion: reduce` schaltet alle nicht essenziellen Animationen ab | Systemeinstellung setzen, Animationen zählen |
| A14 | Keine Dither-Flimmermuster, kein blinkendes Element | Sichtprüfung bei Bewegung und Zielgröße |
| A15 | Keine Funktion nur über Doppelklick, Rechtsklick, Ziehen, Halten oder wiederholtes Klicken erreichbar | Vollständiger Durchlauf mit gesperrten Gesten |
| A16 | Jede Region der Oberfläche einmal nur mit Maus, einmal nur mit Finger, einmal nur mit Tastatur bedienbar | Drei getrennte Durchläufe |
| A17 | Empfindlichkeit um ≥ 50 % der Voreinstellung verstellbar; Belegung umlegbar | Einstellungen prüfen |
| A18 | Alle Hover-Inhalte (Tooltip, Statuszeile, Cursorform, Hover-Menü) in der Telefonfassung dauerhaft sichtbar oder auf Tipp erreichbar | Hover im Browser deaktivieren |
| A19 | Jedes Symbol für eine Handlung oder einen Zustand hat sichtbaren Text | Symbolinventar durchgehen |
| A20 | Tabellen: Text links, Zahlen rechts, Dezimalpunkt-Ausrichtung, Tabellenziffern, klebende Kopfzeile, keine Zebra-Streifen | Stylesheet und Sichtprüfung |
| A21 | Zeilendichte in mindestens drei Stufen umschaltbar (Referenz 40 / 48 / 56 px), Wahl gespeichert | Umschalten, Reload |
| A22 | Textblöcke über zwei Zeilen: ≤ 80 Zeichen, Zeilenabstand ≥ 1,5x, Absatzabstand ≥ 2x, Buchstabenabstand ≥ 0,12x, Wortabstand ≥ 0,16x | Am längsten Block messen |
| A23 | Gesamte Oberfläche in relativen Einheiten; eine einzige Skalierungsgröße bewegt Rahmen, Titelleisten, Menübalken und Zeilenhöhen | Skalierungsgröße verdoppeln, Layout prüfen |
| A24 | Pixelgrafik wird nur ganzzahlig skaliert; Faktor selbst berechnet, nicht `image-rendering` überlassen | Bewegungstest bei `devicePixelRatio` 1, 2, 3 |
| A25 | Eine Masterpalette mit dokumentierten Rampen; Farbanzahl pro Sprite-Kategorie festgelegt und eingehalten | Palettenauszug aus allen Sprites |
| A26 | Eine Lichtrichtung, eine Konturregel, eine Basisauflösung, je ein Stilregelwerk für Fahrzeuge, Porträts und UI | Style-Guide-Dokument vorhanden und geprüft |
| A27 | Bestätigungsdialoge nur bei tatsächlich unumkehrbaren Handlungen; zweistufig mit Abbrechen in jedem Schritt; Bestätigungsknopf trägt das Verb; keine Halte-Bestätigung | Dialoginventar, Wortlautprüfung |
| A28 | Undo für Bedienfehler vorhanden; kein Undo für Spielentscheidungen | Klassifikation dokumentiert |
| A29 | Autosave nach jeder folgenreichen Aktion; Einstellungen getrennt persistiert und überleben den Verlust des Spielstands | Spielstand löschen, Einstellungen prüfen |
| A30 | Standardzustand ohne jede Einstellung bedienbar; Weg zu Schrift- und Kontrasteinstellung erfüllt die Mindestwerte | Frisches Profil |
| A31 | Playtest mit Teilnehmern aus jeder relevanten Beeinträchtigungskategorie durchgeführt und protokolliert | Testprotokoll |
| A32 | Ein Fahrzeug- und ein Porträt-Rendertest in mehreren Größen auf Telefondistanz durchgeführt (ersetzt die fehlende Quellenangabe zur Mindestpixelgröße) | Testprotokoll mit gewählter Größe und Begründung |

---

## Quellenverzeichnis

### Pixelart und Bildaufbau
- Arne Niklas Jansson, „Pixel Art Tutorial" — https://androidarts.com/pixtut/pixelart.htm **[P]**
- Derek Yu, „Pixel Art: Common Mistakes" — https://www.derekyu.com/makegames/pixelart2.html **[P]**
- Raymond Schlitter (Slynyrd), „Pixelblog 1: Color Palettes" — https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes **[P]**
- Slynyrd, „Pixelblog 9: Melee Attacks" — https://www.slynyrd.com/blog/2018/9/8/pixelblog-9-melee-attacks **[P]**
- Pedro Medeiros (saint11), „Consistency" — https://saint11.art/blog/consistency/ **[P]**
- saint11, „Pixel Art Tutorials" (Sammlung, 90+ Blätter à 512×512 px, nur als Bilder) — https://saint11.art/blog/pixel-art-tutorials/ **[P, nur bibliografisch]**
- Game Developer, „Art Design Deep Dive: Using a 3D pipeline for 2D animation in Dead Cells" — https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i- **[P]**
- DawnBringer, DB32-Thread, Pixel Joint Forum — https://pixeljoint.com/forum/forum_posts.asp?TID=16247 **[P]**; Lospec DB32 — https://lospec.com/palette-list/dawnbringer-32 **[S]**
- Wikipedia, „Smear frame" — https://en.wikipedia.org/wiki/Smear_frame **[S]**
- tanalin.com, „Integer Scaling" — https://tanalin.com/en/articles/integer-scaling/ **[P]**
- W3C CSSWG, Issue 5837 zu `image-rendering: pixelated` — https://github.com/w3c/csswg-drafts/issues/5837 **[P]**
- Dave DeSandro, Basisauflösungen (Social-Media-Post) — https://x.com/desandro/status/971436555201064961 **[S]**

### Rückmeldung, Zeiten, Animation
- NN/g, „Response Time Limits" (0,1 / 1 / 10 s) — https://www.nngroup.com/articles/response-times-3-important-limits/ **[P]**
- NN/g, „Executing UX Animations: Duration and Motion Characteristics" — https://www.nngroup.com/articles/animation-duration/ **[P]**
- NN/g, „Progress Indicators Make a Slow System Less Insufferable" — https://www.nngroup.com/articles/progress-indicators/ **[P]**
- Material Design 1, „Duration & easing" — https://m1.material.io/motion/duration-easing.html **[P]**; Material Design 3, „Easing and duration" — https://m3.material.io/styles/motion/easing-and-duration **[P]**
- Game Developer, „6 Mistakes That'll Drain the 'Juice' Out Of Your Game" — https://www.gamedeveloper.com/design/6-mistakes-that-ll-drain-the-juice-out-of-your-game **[P]**
- Jonasson/Purho, „Juice It or Lose It" — https://www.gdcvault.com/play/1016487/juice-it-or-lose **[P, nur bibliografisch]**; Technikenliste referiert über https://cobble.games/wise-inspiring-smart/game-design/juice-it-or-lose-it **[S]**
- Cloudfall Studios zur Slay-the-Spire-Oberfläche — https://www.cloudfallstudios.com/blog/2018/2/20/flash-thoughts-slay-the-spires-ui **[S]**
- UXmatters, „The Role of Sound Design in UX Design" — https://www.uxmatters.com/mt/archives/2024/08/the-role-of-sound-design-in-ux-design-beyond-notifications-and-alerts.php **[P]**
- Steve Swink, „Game Feel" — https://www.taylorfrancis.com/books/mono/10.1201/9781482267334/game-feel-steve-swink **[P, nur bibliografisch]**; Kapitel 1 als PDF — http://mycours.es/gamedesign2014/files/2014/10/Game-Feel-Steve-Swink-chapter-1.pdf

### Eingabe, Zielgrößen, Maus gegen Finger
- NN/g, „Fitts's Law and Its Applications in UX" — https://www.nngroup.com/articles/fitts-law/ **[P]**
- NN/g, „Touch Targets on Touchscreens" — https://www.nngroup.com/articles/touch-target-size/ **[P]**
- NN/g, „Drag-and-Drop: How to Design for Ease of Use" — https://www.nngroup.com/articles/drag-drop/ **[P]**
- NN/g, „The 3-Click Rule for Navigation Is False" — https://www.nngroup.com/articles/3-click-rule/ **[P]**
- NN/g, „Infinite Scrolling — When to Use It, When to Avoid It" — https://www.nngroup.com/articles/infinite-scrolling-tips/ **[P]**
- Parhi, Karlson, Bederson, „Target Size Study for One-Handed Thumb Use on Small Touchscreen Devices" (MobileHCI 2006) — https://www.microsoft.com/en-us/research/wp-content/uploads/2006/01/parhi-mobileHCI06.pdf **[P]**
- Huber, „Inaccurate input on touch devices relating to the fingertip" (LMU) — https://www.mmi.ifi.lmu.de/lehre/ss15/ps/papers/Huber-InputOnTouchDevices.pdf **[P]**
- Android Accessibility Help, „Touch target size" (48 dp, 8 dp, `TouchDelegate`) — https://support.google.com/accessibility/android/answer/7101858?hl=en **[P]**
- Microsoft Learn, „Guidelines for touch targets" (7,5 mm / 40×40 px) — https://learn.microsoft.com/en-us/windows/apps/develop/input/guidelines-for-targeting **[P]**
- TetraLogical, „Foundations — target sizes" (Apple 44 pt, WCAG 2.5.5, BBC GEL, 76 dp) — https://tetralogical.com/blog/2022/12/20/foundations-target-size/ **[S]**
- DigitalA11Y, „Understanding SC 2.5.8 Target Size (Minimum)" — https://www.digitala11y.com/understanding-sc-2-5-8-target-size-minimum/ **[S]**
- Microsoft Learn, XAG 107 Input — https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/107 **[P]**

### Oberflächenaufbau, Tabellen, Symbole, Schrift
- Factorio FFF #191 — https://factorio.com/blog/post/fff-191 **[P]**
- Factorio FFF #212 (ca. 120 Fenster) — https://factorio.com/blog/post/fff-212 **[P]**
- Factorio FFF #238 (nüchterner Look, Kontrast, +2 pt, Schriftgröße als Option, Farbsemantik) — https://factorio.com/blog/post/fff-238 **[P]**
- Factorio FFF #246 (Dialogschema, OK/Cancel-Konflikt) — https://factorio.com/blog/post/fff-246 **[P]**
- Factorio FFF #348 (800 Stile, 400 Widget-Typen, über 100 Fenster) — https://factorio.com/blog/post/fff-348 **[P]**
- Game Developer, „UI Strategy Game Design Dos and Don'ts" — https://www.gamedeveloper.com/design/ui-strategy-game-design-dos-and-don-ts **[P]**
- A List Apart, „Web Typography: Designing Tables to be Read, Not Looked At" — https://alistapart.com/article/web-typography-tables/ **[P]**
- Pencil & Paper, „Enterprise Data Tables" (40/48/56 px) — https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables **[P]**
- NN/g, „Icon Usability" — https://www.nngroup.com/articles/icon-usability/ **[P]**
- NN/g, „The Principle of Common Region" — https://www.nngroup.com/articles/common-region/ **[P]**
- Game Developer, „Legible font (still) one of the biggest accessibility issues in games" (Karen Stevens, 28 px) — https://www.gamedeveloper.com/design/legible-font-still-one-of-the-biggest-accessibility-issues-in-games **[P]**
- Medium, „Vintage Windows GUIs in Everything is going to be OK" — https://medium.com/@LiterallyAKing/vintage-windows-guis-in-everything-is-going-to-be-ok-20b38b11bb4f **[S]**
- Grid Sage Games, „Adventures in Map Zooming, Part 3" — https://www.gridsagegames.com/blog/2023/12/adventures-in-map-zooming-part-3-implementation/ **[P, nicht ausgewertet]**

### Barrierefreiheit, Kontrast, Fehlervermeidung
- Game Accessibility Guidelines, Full list — https://gameaccessibilityguidelines.com/full-list/ **[P]**
- Microsoft Learn, Xbox Accessibility Guidelines (Übersicht 101–123) — https://learn.microsoft.com/en-us/xbox/accessibility/guidelines **[P]**
- Microsoft Learn, XAG 101 Text display (18 px, 200 %, Textabstände, 80 Zeichen) — https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/101 **[P]**
- Microsoft Learn, XAG 102 Contrast (4,5:1 / 3:1 / 7:1, Rot-Grün) — https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/102 **[P]**
- Microsoft Learn, XAG 115 Error messages and destructive actions — https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/115 **[P]**
- W3C, Understanding SC 1.4.3 Contrast (Minimum) — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html **[P]**
- W3C, Understanding SC 1.4.11 Non-text Contrast — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html **[P]**
- W3C, Technique G207 (3:1 für Icons) — https://www.w3.org/WAI/WCAG21/Techniques/general/G207 **[P]**
- NN/g, „10 Usability Heuristics for User Interface Design" — https://www.nngroup.com/articles/ten-usability-heuristics/ **[P]**
- MDN, `prefers-reduced-motion` — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion **[P]**
- Colour Blind Awareness, „Types of Colour Blindness" — https://www.colourblindawareness.org/colour-blindness/types-of-colour-blindness/ **[P, Organisationsseite]**
- Game Developer, „A quick UX lesson from GDC Masterclass teacher Celia Hodent" — https://www.gamedeveloper.com/design/a-quick-ux-lesson-from-gdc-masterclass-teacher-celia-hodent **[P]**
- Abratabia, „Game Accessibility Guidelines and Standards" (WCAG-Anwendbarkeit, EAA) — https://www.abratabia.com/game-accessibility/accessibility-guidelines.php **[S, Autorenschaft unklar — vor Verwendung prüfen]**
- „Game Accessibility Guidelines and WCAG 2.0 – A Gap Analysis" (ICCHP 2018) — https://link.springer.com/chapter/10.1007/978-3-319-94277-3_43 **[P, nur bibliografisch]**

### Für Vertiefung vorgemerkt (in dieser Recherche nicht ausgewertet)
- GDC 2019, „Into the Breach Postmortem" (Abruf ergab HTTP 403) — https://ubm-twvideo01.s3.amazonaws.com/o1/vault/gdc2019/presentations/Into%20the%20Breach%20Postmortem%20Final.pdf
- GDC China 2015, Yang Zhang, „UI Design from PC Game to Mobile Game" — https://www.gdcvault.com/play/1023725/UI-Design-from-Pc-Game
- GDC, „Get in Touch: Effective Transition from PC to Mobile" — https://gdcvault.com/play/1014965/Get-in-Touch-Effective
- GDC, „Usability Lessons from Mobile Board Game Conversions" — https://www.gdcvault.com/play/1020114/Usability-Lessons-from-Mobile-Board
- NN/g, „Designing Tables for Desktop Apps with Lots of Data" (Inhalt nur im Video) — https://www.nngroup.com/videos/designing-tables-desktop-apps/
- NN/g, „How to Fit Big Tables on Small Screens" — https://www.nngroup.com/videos/big-tables-small-screens/
- „The effect of skeleton screens" (ECCE 2018) — https://dl.acm.org/doi/10.1145/3232078.3232086
- „A Study on Tolerable Waiting Time" (SMU) — https://ink.library.smu.edu.sg/context/sis_research/article/11073/viewcontent/A_Study_on_Tolerable_Waiting_Time__How_Long_Are_Web_Users_Willing_to_Wait_.pdf
- Factorio FFF #216 und #243 (Tileset, Stilsystem)
- Jan Willem Nijman, „The art of screenshake" — https://www.youtube.com/watch?v=AJdEqssNZ-U

---

## Was das für SpediPro heißt

Dieser Abschnitt hält den Umbau vom 26.09.2026 fest. Die Zahlen darin
sind **gemessen**, nicht geschätzt: `messung-optik.js` öffnet jedes
Programm in der Telefonfassung (430x960) und am Schreibtisch
(1280x800) und liest die gerenderte Oberfläche aus.
`browsertest-optik.js` prüft dieselben Regeln als Test und schlägt an,
wenn ein späterer Bauschritt sie wieder bricht.

### Der Befund vor dem Umbau

Der 98er-Look war nicht das Problem. Die 98er-Maße waren es:

| Gemessen | vorher | nachher | Regel |
|---|---|---|---|
| Textstellen unter 18 px | **315 von 316 (100 %)** | **0 von 318** | 51, A1 |
| Kleinster Text | 10 px | **18 px** | 51 |
| Verwendete Schriftgrößen | zehn (8 bis 22 px) | **vier** (18 / 21 / 26 / 36) | 43, 67 |
| Trefferflächen unter 44 px | 38 von 67 (57 %) | **0 von 70** | 25, A6 |
| Trefferflächen unter 24 px | 16 von 67 (24 %) | **0 von 70** | 26, A6 |
| Sichtbare Elemente unter 44 px | 38 | **35 (unverändert gewollt)** | 27, 69 |
| 24-px-Kreisschnitte | 0 | **0** | 28, A7 |
| Schriftgrößen in relativen Einheiten | 0 von 190 | **190 von 190** | 66, A23 |
| Waagerechtes Rollen bei 200 % | nicht prüfbar | **0 px, 0 abgeschnittene Stellen** | 52, A2 |

Die vorletzte Zeile ist der Kern des Ganzen und keine Panne: **35
Bedienelemente sehen weiterhin kleiner aus als 44 px und sind trotzdem
44 px groß.** Genau das beschreibt Google als "touch targets extend
beyond the visual bounds of an element". Der 16-px-Knopf bleibt ein
16er, die Fläche darunter wächst. Ohne diesen Kunstgriff hätte die
Regel nur zu erfüllen sein, indem man den Look aufgibt.

### Was gebaut wurde

**Eine Größe, aus der alles folgt.** `html { font-size: calc(18px *
var(--skala)) }`, und jede Länge in der Oberfläche steht in `rem`.
Umgerechnet wurde mit dem Faktor 1/11, weil die alte Oberfläche auf
11 px aufgebaut war: **1rem entspricht 11 alten Pixeln**. Dadurch
wächst alles um denselben Faktor 18/11 = 1,636 - dieselbe
Formensprache bei etwa 150 dpi statt 96. `werkzeug/css-auf-skala.py`
hat das in 603 Deklarationen getan und dokumentiert, was es
ausgelassen hat: Werte unter 3 px (der 1-px-Bevel **ist** der Look),
Ränder und Schatten, alles, was Pixelgrafik bemisst (Regel 68), und
die Bedingungen von Media Queries.

**Vier Schriftmarken statt zehn Größen.** `--fs-klein` (18 px),
`--fs-basis` (21), `--fs-kopf` (26), `--fs-gross` (36). Die
Verhältnisse sind die alten (11 : 13 : 16 : 22), nur der Fußpunkt
liegt jetzt auf dem Minimum. Die zehn gewachsenen Größen waren
Wildwuchs; Windows 98 selbst kannte praktisch zwei.

**Trefferfläche getrennt von Optik.** Ein `::after`, das über den
Knopf hinausragt, plus `--ziel-min` (24 px am Zeiger, 44 px am
Finger) und `--ziel-abstand`. Wo Knöpfe im Original aneinanderkleben -
die Titelleiste -, reicht das nicht: dort wächst der Abstand am Finger
wirklich (Regel 28/70). `browsertest-echtklick.js` klickt mit echtem
Zeiger statt mit erzeugten Ereignissen, weil nur das zeigt, ob sich
die vergrößerten Flächen gegenseitig verdecken. Tun sie nicht.

**Vier eigene Kantenfarben.** `--bevel-hell`, `--bevel-hoch`,
`--bevel-dunkel`, `--bevel-tief` liegen getrennt von den Textfarben,
damit der Kontrastmodus sie anheben kann, ohne die Titelleistenschrift
mitzunehmen. Gemessen:

| Kante | Standard | Kontrastmodus |
|---|---|---|
| helle Kante | 2,17:1 | **5,97:1** |
| dunkle Kante | 5,70:1 | **11,54:1** |
| inneres Weiß | 1,82:1 | **3,79:1** |

Im Standardlook trägt die **dunkle** Kante den Zustand mit 5,70:1 -
Regel 56 ist also auch dort erfüllt, nur eben durch eine Kante statt
durch alle vier. Wer alle vier braucht, schaltet den Kontrastmodus
ein; genau so sehen es die Game Accessibility Guidelines auf Stufe
intermediate vor. Der Standardlook bleibt dabei unverändert 98.

**Ein Fenster für die Einstellungen.** "Eigenschaften von Anzeige",
unter Einstellungen im Startmenü, mit drei Registerkarten
(Darstellung, Kontrast, Eingabe). Sechs Größenstufen von 0,61
("so klein wie Windows 98 wirklich war") bis 2,0, vier Zeilendichten
einschließlich der originalgetreuen, Kontrastschalter, Eingabeart.
Die Werte liegen im eigenen Speicherschlüssel `spedipro-anzeige` und
überleben `Speicher.neuBeginnen()` - Regel 74/A29, geprüft.

### Wo der Umbau etwas gekostet hat

Ehrlich gesagt: an einer Stelle. Der aufgeklappte Frachtbrief **und**
die volle Auswahlliste passen auf einem 400x880-Gerät nicht mehr beide
in voller Größe nebeneinander. Vorher hatte die Auswahlliste dort
122 px bei 11 px Schrift, also rund elf Zeilen; jetzt sind es 3,9
Zeilen. Der Frachtbrief hat dafür einen Deckel bekommen, damit die
Liste nicht ganz verschwindet (gemessen war sie bei **0** Zeilen, bevor
der Deckel da war) - und `browsertest-platz.js` misst diese Schwelle
seither in Zeilen statt in Pixeln, weil "200 px" seit der Skalierung
keine Aussage mehr ist.

Das ist der Zielkonflikt des Berichts in einem Satz: Dichte gegen
Lesbarkeit, und die Lesbarkeit hat gewonnen. Das Gegenmittel ist
gebaut und heißt "Mittel" oder "Klein" im Anzeigefenster.

Drei kleinere Anpassungen waren nötig, weil Text bei doppelter Größe
Platz braucht: Reiter, Fahrzeugkopfzeile und Debug-Leiste brechen jetzt
um statt abzuschneiden, und die Auftragszeile stellt die Schaltfläche
unter den Text, sobald die Liste schmal wird (`@container`, also
abhängig von der Listenbreite, nicht von der Gerätebreite - bei
doppelter Schrift ist ein Telefon eben schmal, egal wie viele Pixel es
hat).

Die Versionsnummer ist aus der Taskleiste ins Startmenü gewandert. Der
alte Trick, sie auf schmalen Geräten kleiner zu setzen, verstößt gegen
Regel 51 - eine Nebensache darf genauso wenig unter die Mindestgröße
wie der Rest.

### Stand nach der Prüfung vom 26.09.2026

`browsertest-optik.js` prüft zwölf Regeln maschinell. Alle bestehen:

| Regel | Stand |
|---|---|
| 51/A1 Grundschrift ≥ 18 px | **erfüllt** - 0 von 318 Textstellen darunter |
| 25/A6 Trefferflächen | **erfüllt** - 0 von 70 unter 44 px am Finger |
| 26/A6 Untergrenze 24 px | **erfüllt** |
| 28/A7 Abstand kleiner Ziele | **erfüllt** - keine schneidenden 24-px-Kreise |
| 52/A2 200 Prozent | **erfüllt** - kein waagerechtes Rollen, kein abgeschnittener Text |
| 55/A3 Textkontrast | **erfüllt** - keine einzige Textfarbe unter 4,5:1 bzw. 3:1 |
| 56/A4 Zustandskontrast | **erfüllt** - 5,70:1 im Standard, alle vier Kanten über 3:1 im Kontrastmodus |
| 57/A5 Graustufentest | **erfüllt** - jede Urteilsstufe trägt ein eigenes Wort |
| 58/A13 Bewegung abschaltbar | **erfüllt** - 0 Animationen bei `prefers-reduced-motion` |
| 66/A23 eine Skalierungsgröße | **erfüllt** - Titelleiste x2,00, Schaltflächen x1,89 bei doppelter Skala |
| 74/A29 Einstellungen überleben | **erfüllt** - Größe, Kontrast und Dichte stehen nach neuem Spiel noch |
| 43/A20 Tabellen | **teilweise** - Zahlen rechts und Tabellenziffern sind da, Sortierindikator und klebende Kopfzeile fehlen |

Nicht maschinell prüfbar und daher offen:

- **Regel 44/A21 Zeilendichte.** Die vier Stufen sind gebaut und
  gespeichert, aber erst zwei Listen hören darauf (Auftragsliste,
  BWA-Tabelle). Die Fuhrparkliste und die Sendungsliste fehlen noch.
- **Regel 46 klebende Kopfzeile und Sortierindikator.** Die
  Auftragsliste sortiert über ein Auswahlfeld statt über Spaltenköpfe -
  das ist eine andere Bauform, nicht dieselbe Regel. Ein Chevron gibt
  es nicht.
- **Regel 64/A16 dieselbe Eingabeart überall.** Maus und Finger sind
  geprüft. **Tastatur nicht** - es gibt keine Fokusreihenfolge, keine
  sichtbaren Fokusrahmen und keine Tastenkürzel. Das ist die größte
  offene Lücke des Umbaus und sollte der nächste Schritt sein.
- **Regel 65/A31 Playtest mit betroffenen Spielern.** Steht aus. Kein
  gemessener Wert ersetzt ihn.
- **Regel 32/A15 Ziehen hat eine Alternative.** Der Fensterteiler in
  der Disposition lässt sich ziehen, doppeltippen (Rasten) und über die
  Tastatur bedienen - der eine Fall, der schon vor dieser Recherche
  richtig gebaut war.
- **A32 Rendertest für Sprite-Größen.** Steht aus. Die Kartenmarken
  und das Fahrzeugbild skalieren bewusst **nicht** mit (Regel 68), und
  bei 18 px Grundschrift sehen die Marken dadurch kleiner aus als
  vorher. Ob das reicht, ist eine Frage an den Augenschein, nicht an
  eine Messung.

### Offene Recherche

Unverändert die größte Lücke des Berichts, und sie trifft genau
diesen Umbau: Es existiert **kein** Postmortem und **kein** Nutzertest
zu einem Spiel mit nachgebauter Betriebssystem-Oberfläche. Ob
überlappende 98er-Fenster am Telefon bedienbar sind, weiß niemand
außer uns selbst - und wir wissen es auch erst nach einem Playtest.
