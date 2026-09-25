# Spieldesign: was belegt ist und was wir daraus machen

*Recherchiert am 25.09.2026 für SpediPro 95. Der erste Teil ist eine
allgemeine Auswertung der Fachliteratur mit Belegmarken; der letzte
Abschnitt "Was das für SpediPro heißt" überträgt sie auf dieses
Projekt und ist bei jeder Designentscheidung heranzuziehen.*

*Zur Einordnung neben `kosten-1994.md`: Dort gilt "belegt oder
ausdrücklich als unbelegt gekennzeichnet" für Zahlen der Spielwelt.
Hier gilt dasselbe für Designregeln - mit dem Unterschied, dass das
Feld nachweislich zitatgetrieben und messarm ist. Die Belegmarken
unten sind deshalb kein Zierrat.*

---

## Der Befund in einem Absatz

Die Fachliteratur zu Aufbau- und Wirtschaftssimulationen konvergiert auf einen einzigen, operativ verwertbaren Satz: Eine Wirtschaftssimulation lebt genau so lange, wie der Spieler zwischen zwei Zuständen steht — er wählt weder zufällig (weil er nichts versteht) noch immer dasselbe (weil er alles verstanden hat). Beide Ausfälle sind in der Literatur benannt und belegt: Der Ein-Stunden-Tod entsteht durch fehlende Entscheidungsinformation ([Game Developer, GDC 2012](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)), der Zehn-Stunden-Tod durch dominante Strategien, die der Spieler zwanghaft ausführt, obwohl sie ihn langweilen ([Soren Johnson, Water Finds a Crack](https://www.designer-notes.com/game-developer-column-17-water-finds-a-crack/)). Für eine Spedition im Jahr 1994 in einer nachgebauten Windows-98-Oberfläche kommen zwei Besonderheiten hinzu, die in der Recherche unterschiedlich gut abgesichert sind: Die diegetische Oberfläche ist ein **Erlernbarkeitsgewinn**, weil der Spieler Doppelklick, Taskleiste und Modaldialog bereits kennt — und zugleich ein **Flächenrisiko**, für das mit Lucas Popes Mobilumbau von *Papers, Please* ein dokumentierter Präzedenzfall existiert, in dem die Metapher der Lesbarkeit geopfert wurde ([dukope.com](https://dukope.com/devlogs/papers-please/mobile/)). Die härtesten Zahlen der gesamten Recherche sind nicht spielspezifisch: **fünf plus/minus zwei** gleichzeitig verarbeitbare Elemente im Arbeitsgedächtnis, **drei** während des Lernens ([Celia Hodent, GDC 2016](https://celiahodent.com/gamers-brain-ux-onboarding/)), und die IBM-Studie von 1984, nach der das *Sperren* fortgeschrittener Funktionen Anfänger schneller lernen lässt ([Jakob Nielsen](https://jakobnielsenphd.substack.com/p/progressive-disclosure)). Umgekehrt liefert die Recherche für mehrere populäre Annahmen **keinen** Beleg: weder für Abbruchquoten in Aufbauspielen, noch für Zahl-gegen-Wort-Messungen, noch für die Immersionswirkung diegetischer Oberflächen — und selbst die beiden meistzitierten Sätze des Feldes (Sid Meiers „series of interesting decisions", Johnsons „optimize the fun out of") konnten nicht am Original verifiziert werden. Dieser Bericht trennt deshalb durchgehend: **belegt**, **sekundär belegt**, **abgeleitet**, **unbelegt**.

---

## Wie dieses Dokument zu benutzen ist

Jede Regel unten ist als Prüffrage formuliert, die an eine geplante Funktion gestellt werden kann. Die Belegstärke steht bei jeder Regel dabei:

| Marke | Bedeutung |
|---|---|
| **[P]** | Primärquelle oder direkt zitierte Entwickler-/Forschungsaussage |
| **[S]** | nur über Sekundärzusammenfassung belegt — Wortlaut vor Veröffentlichung am Original prüfen |
| **[A]** | Ableitung aus belegten Prinzipien, keine Quelle sagt das direkt |
| **[U]** | in dieser Recherche nicht belegbar — als Annahme behandeln, nicht als Wissen |

---

## Vier Standardwerke sagen dasselbe: Du baust das System, nicht die Erfahrung

Schells „Elemental Tetrad" (Mechanics, Story, Aesthetics, Technology als gleichrangige Elemente), das MDA-Modell, Sylvesters Schichtung Mechanics → Events → Emotion und Daniel Cooks Interaktionsloop sind **keine vier konkurrierenden Theorien, sondern vier Formulierungen einer Einsicht**: Der Designer hat nur mittelbaren Zugriff auf das Erlebnis. MDA formuliert das am schärfsten — Mechanics sind „the particular components of the game, at the level of data representation and algorithms", Dynamics „the run-time behavior of the mechanics acting on player inputs and each other's outputs over time", Aesthetics „the desirable emotional responses evoked in the player" — und hält fest, dass der Designer von links nach rechts denkt, während der Spieler von rechts nach links erlebt ([MDA-Paper, Northwestern](https://users.cs.northwestern.edu/~hunicke/MDA.pdf)) **[P]**. Schells Fassung desselben Gedankens ist die „Essential Experience": „The game is not the experience. The game enables the experience" ([Notes by Lex](https://notesbylex.com/the-art-of-game-design-a-book-of-lenses-2nd-edition-by-jesse-schell)) **[S]**.

Für eine Wirtschaftssimulation ist das kein Philosophieren, sondern eine Arbeitsanweisung mit einem konkreten formalen Apparat. Ernest Adams' Begriff der **internal economy** — Resources, Sources, Drains — ist von allen genannten Werken der am direktesten anwendbare, weil eine Wirtschaftssimulation im Kern nichts anderes ist als ein Netz aus Quellen, Senken und Umwandlern ([Adams-Vortragsnotizen](https://evolvingdeveloper.com/game-design-fundamentals-notes-ernest-w-adams-talk/)) **[S]**. Adams' Gameplay-Definition — „gameplay is the challenges you put in front of players and the actions that they have available to them" — macht Ziele zum Definitionsbestandteil, nicht zum Aufsatz.

Cooks Unterscheidung von **Loop** und **Arc** erklärt, warum ausgerechnet dieses Genre gut altert. Ein Loop ist der Zyklus mentales Modell → Aktion → Systemantwort → aktualisiertes Modell; sein Wert entsteht durch Wiederholung und baut das auf, was Cook „wisdom — a holistic understanding of a complex system" nennt. Ein Arc dagegen ist „a broken loop you exit immediately": Ist die Informationsnutzlast konsumiert, ist er wertlos, und arc-lastige Designs landen auf der **content treadmill** ([Lostgarden](https://lostgarden.com/2012/04/30/loops-and-arcs/)) **[P]**. Cooks Analysefrage an jeden Entwurf lautet: „What repeats and what does not?"

Raph Koster liefert die Gegenkraft und damit das Ablaufdatum jedes Loops: Spaß ist ein Lernmechanismus, der Reiz liegt im **grokking**, und sobald das Muster vollständig durchschaut ist, bricht das Engagement ein — Langeweile ist ein Zeichen erfolgreicher Musterbeherrschung, nicht automatisch schlechten Designs. Spiele scheitern an beiden Extremen, am zu vorhersagbaren wie am chaotischen Muster ([Smart Book Notes](https://www.smartbooknotes.com/article/theory-of-fun/)) **[S]**.

**Prüffragen an jede geplante Funktion:**

| # | Frage | Beleg |
|---|---|---|
| 1 | Welche Quelle, welche Senke, welcher Umwandler ist das in der internen Ökonomie? Wenn keins davon — warum existiert es? | **[S]** Adams |
| 2 | Wiederholt sich das (Loop) oder ist es einmal konsumiert (Arc)? Wenn Arc: Wie viele davon brauchen wir, und was trägt danach? | **[P]** Cook |
| 3 | Welches Muster soll der Spieler hier lernen — und was passiert im Spiel, wenn er es durchschaut hat? | **[S]** Koster |
| 4 | Die Erfahrung, die wir wollen, ist X. Erzeugt die Regel X, oder haben wir X nur beschrieben? | **[S]** Schell / **[P]** MDA |

Eine Einschränkung, die in einem Bericht zu diesem Genre nicht fehlen darf: **Flow ist eine schwächere Grundlage, als seine Popularität nahelegt.** Schell führt eine eigene „Lens of Flow", Jenova Chens MFA-Thesis ist die einflussreichste Anwendung auf Spiele ([Flow in Games, PDF](https://www.jenovachen.com/flowingames/Flow_in_games_final.pdf)) **[P, nur bibliografisch]** — aber die zentrale Annahme, optimale Erfahrung entstehe bei Deckungsgleichheit von Herausforderung und Können, ist empirisch angegriffen. Løvoll und Vittersø fanden, dass die Challenge-Skill-Balance über zwei Studien hinweg nur **9–14 % der Varianz** positiver und negativer Erfahrung erklärte, dass Flow-Indikatoren ihren Höchstwert *nicht* bei balancierten Bedingungen erreichten, und formulierten „empirical support ... for an imbalance model of challenges and skills" ([Social Indicators Research](https://link.springer.com/article/10.1007/s11205-012-0211-9)) **[P]**. Wichtig für die Redlichkeit: Die Datenbasis waren Outdoor-Sport-Studierende (Skitouren, Gletscherkurse), nicht Spieler. Der Befund widerlegt die allgemeine Flow-Hypothese, nicht speziell ihre Spielanwendung. Für ein pausierbares, selbstgetaktetes Genre ohne reaktive Echtzeitanforderung beschreiben Kosters Lernkurve und Cooks Loop die Motivationsdynamik ohnehin besser als eine Balance-Vorschrift **[A]**.

---

## Die interessante Entscheidung: fünf Kriterien, drei Ausfallmodi

Der Satz „a game is a series of interesting decisions" ist die meistzitierte Definition des Feldes — und seine Zuschreibung an Sid Meier ist **dokumentiert umstritten**. Troy Goodfellow geht auf „Flash of Steel" ausdrücklich der Frage nach, ob und in welcher Form Meier den Satz geprägt hat ([Quote? Misquote? Cite?](https://flashofsteel.com/index.php/2008/07/07/quote-misquote-cite/)) **[P für die Debatte]**. Der Satz sollte als *vielzitiert, Zuschreibung ungeklärt* geführt und nicht als Autoritätsbeleg verwendet werden. Die inhaltlichen Kriterien dagegen sind belegt — allerdings über einen Konferenzbericht, nicht über den Vortrag selbst: Der Originalvortrag liegt hinter der Bezahlschranke des [GDC Vault](https://gdcvault.com/play/1015756/Interesting), sämtliche Meier-Zitate unten stammen aus der Berichterstattung ([Game Developer](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)) **[S]**.

Meiers **Ausfallkriterien** sind die schärfste Prüfung, die dieser Bericht anbieten kann, weil sie negativ formuliert und damit direkt testbar sind: „If a player always chooses the first from among a set of three choices, it's probably not an interesting choice; nor is a random selection." Dazu kommt ein drittes Ausfallkriterium — die Entscheidung scheitert auch, wenn dem Spieler **die Information fehlt, die Konsequenzen zu verstehen**. Die **Positivkriterien** sind Tradeoff (echte Kosten gegen echten Nutzen), Situational Context (die richtige Antwort hängt von der Lage ab), Personal Expression (die Entscheidung bildet den Spielstil ab), Persistence (die Folgen wirken lange nach) und Risk vs. Reward, ergänzt um eine Mischung kurz- und langfristiger Horizonte.

Salen und Zimmerman verschärfen das normativ: Bedeutungsvolles Spiel entsteht, wenn die Beziehung zwischen Handlung und Ergebnis **discernable** (wahrnehmbar und der eigenen Handlung zuordenbar) und **integrated** (wirksam im größeren Spielkontext) ist ([Meaningful play](https://en.wikipedia.org/wiki/Meaningful_play)) **[S]**. Die beiden Raster greifen sauber ineinander: Discernability ist die Vorbedingung dafür, dass ein Tradeoff überhaupt als Tradeoff erlebt wird, Integration ist praktisch Meiers Persistence **[A]**.

Meiers eigene Erfahrung aus der Civilization-Entwicklung markiert dabei den einen Fehlerpol: In der Echtzeitfassung „the player was too much of an observer" — der Spieler musste zum Handelnden gemacht werden ([The Escapist, GDC-2010-Liveblog](https://www.escapistmagazine.com/liveblog-sid-meiers-gdc-2010-keynote-speech/)) **[S]**. Den anderen Pol markiert Chris Sawyer, der bei RollerCoaster Tycoon bewusst *unkontrollierbare* Akteure einbaute: „having the guests 'uncontrollable' in the game appealed to me a lot – i.e. you can't force them to do something they don't want to do" ([Arcade Attack](https://www.arcadeattack.co.uk/chris-sawyer-interview/)) **[P]**. Zwischen totaler Kontrolle (dann ist es Buchhaltung) und keiner Kontrolle (dann ist es ein Bildschirmschoner) liegt das Genre: **Der Spieler setzt Anreize, die Simulation antwortet eigenwillig** **[A]**.

Ein Musterfall für eine Funktion, die alle Kriterien verfehlt, ist in der deutschen Rezeption dokumentiert: In der Stay-Forever-Folge zur Patrizier-Reihe bemerkt der Host zu *Patrizier III*, das Produktionsmanagement habe ihn „weder interessiert noch abgeschreckt" ([Stay Forever, Folge 42](https://www.stayforever.de/2015/03/folge-42-der-patrizier/)) **[P]**. Ein Subsystem, das weder Tradeoff noch Risiko erzeugt, ist schlicht vorhanden — es besteht Meiers Test nicht, obwohl es niemanden stört.

**Ausfallkriterien — eine Funktion fällt durch, wenn eine dieser Fragen mit Ja beantwortet wird:**

| # | Ausfall | Beleg |
|---|---|---|
| 5 | Gibt es eine Route, Ware, Fahrzeugklasse oder Ausbaureihenfolge, die *unter allen Umständen* die beste ist? | **[S]** Meier, **[P]** Johnson |
| 6 | Wählt der Spieler hier faktisch zufällig, weil ihm die Konsequenz unbekannt ist? | **[S]** Meier |
| 7 | Fehlt an der Entscheidungsstelle Information, die der Spieler zur Bewertung bräuchte? | **[S]** Meier |
| 8 | Kann der Spieler das Ergebnis seiner Handlung wahrnehmen *und* seiner Handlung zuordnen? Wenn nein — durchgefallen. | **[S]** Salen/Zimmerman |
| 9 | Wirkt die Entscheidung in zehn Spielstunden noch nach, oder ist sie nach drei Aufträgen verrechnet? | **[S]** Meier |
| 10 | Kann die Simulation hier anders antworten, als der Spieler befiehlt? Wenn nein: Ist das eine Entscheidung oder ein Formular? | **[P]** Sawyer |

---

## Lesbarkeit: sichtbar muss sein, was die Wahl trägt — verborgen darf sein, was der Spieler herausfinden soll

Die scheinbare Spannung zwischen „lieber zu viel Information" und „Komplexität schrittweise offenlegen" löst sich vollständig auf, sobald man nach *Art* der Information trennt. Meier fordert Informationsüberfluss ausdrücklich für die Entscheidungsstelle: „It's almost worth erring on the side of providing the player with too much information, or at least enough that they're comfortable with understanding the choices" ([Game Developer](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)) **[S]**. Progressive Disclosure dagegen betrifft die Einführung *neuer Systeme*. Ein Aufbauspiel kann beides gleichzeitig erfüllen: Systeme gestaffelt freischalten und zu jedem freigeschalteten System vollständige Entscheidungsinformation liefern **[A]**.

Die Trennlinie zwischen zulässiger und unzulässiger Verborgenheit lässt sich aus den Quellen präzise ziehen. **Verborgen sein darf**, was der Spieler durch Spielen herausfinden soll — Kosters zu erobernde Muster, Schells „Lens of Curiosity" **[S]**. **Nicht verborgen sein darf**, was er braucht, um eine anstehende Entscheidung als Tradeoff zu erkennen. Nielsen formuliert dieselbe Grenze als harte UX-Regel: entscheidungskritische Information — Preise, Risiken, Bedingungen — gehört **niemals** hinter eine Aufklappebene ([Nielsen](https://jakobnielsenphd.substack.com/p/progressive-disclosure)) **[P]**. Für eine Spedition heißt das: Frachtraten, Vertragsstrafen und Fristen stehen auf Stufe 1, auch wenn das Layout voller wird.

Gefährlich wird dieses Genre an einer spezifischen Stelle: **Ökonomien wirken verzögert und mehrstufig**, und genau das verletzt Discernability, weil das Ergebnis zeitlich weit von der Handlung entfernt liegt. Das ist der strukturelle Grund, warum Aufbauspiele in Übersichten, Bilanzen und Overlays investieren müssen — eine Ableitung, keine Quellenaussage **[A]**. Meiers Attributionsbefund verschärft sie zur harten Regel: Der Spieler schreibt Siege sich selbst und Niederlagen dem Spiel zu, und bei 3:1-Odds beschwerte sich ein Spieler, wie er verlieren könne, wo „3" doch so viel größer als „1" sei ([The Escapist](https://www.escapistmagazine.com/liveblog-sid-meiers-gdc-2010-keynote-speech/)) **[S]**. **Ein Bankrott durch eine unsichtbare Marktbewegung wird dem Spiel angelastet; ein Bankrott durch eine sichtbare eigene Fehlentscheidung wird akzeptiert** **[A]**.

Der zeitgenössische Negativfall dazu steht direkt im Genre: Bei *Ports of Call* hingen Lotsenstreiks, Treibstoffpreise, Schmuggelgelegenheiten und Frachtzahlungen an Würfelwürfen statt an Spielerkönnen, offen diskutiert wurde, ob überhaupt strategische Tiefe vorliegt ([Kultboy](https://www.kultboy.com/testbericht-uebersicht/126/)) **[P, Community-Rezeption]**. Daraus und aus Meiers Kriterium ergibt sich eine der brauchbarsten Faustregeln dieses Berichts: **Zufall vor der Entscheidung erzeugt Spiel (veränderte Ausgangslage, neues Ereignis, neuer Markt); Zufall nach der Entscheidung erzeugt Frust, weil die richtige Wahl würfelbedingt scheitert** **[A]**.

Hier liegt auch die fachlich umstrittenste Stelle. Jake Solomon hat für XCOM 2 offen eingeräumt, dass angezeigte Wahrscheinlichkeiten von den internen abweichen: „That 85 percent isn't actually 85 percent. Behind the scenes, we wanted to match the player's psychological feeling" — auf leichteren Graden liegt die reale Chance näher an 95 %, begründet mit „We don't want the players missing multiple 85 percent shots, because then the game starts to feel punitive" ([Game Developer](https://www.gamedeveloper.com/design/jake-solomon-explains-the-careful-use-of-randomness-in-i-xcom-2-i-)) **[P]**. Dem steht die Dark-Pattern-Literatur gegenüber, die „illusion of control" und irreführende Rückmeldung als problematische Kategorie führt ([deceptive.design zu Zagal et al.](https://deceptive.design/articles/dark-patterns-in-the-design-of-games/)) **[S]**. Beide Seiten gehören ins Protokoll: Die Praxis tut es und begründet es mit Fairnessempfinden, die Ethikliteratur nennt es Manipulation der Aktion-Ergebnis-Lesbarkeit. Zu beachten: Das oft kolportierte Prinzip „das Spiel soll nie lügen, außer zugunsten des Spielers" konnte in dieser Recherche **nicht** primärbelegt werden **[U]**.

**Prüffragen:**

| # | Frage | Beleg |
|---|---|---|
| 11 | Steht die Information, die diese Wahl zum Tradeoff macht, auf Stufe 1 — oder hinter einem Aufklapper? | **[P]** Nielsen |
| 12 | Kann der Spieler nach einem Verlust in einem Satz sagen, warum er verloren hat? Wenn nein: Er wird es uns anlasten. | **[S]** Meier |
| 13 | Wirkt der Zufall *vor* der Entscheidung (neue Lage) oder *nach* ihr (die richtige Wahl scheitert)? Letzteres streichen. | **[A]** aus Meier + Ports of Call |
| 14 | Ist diese verborgene Information etwas, das der Spieler *herausfinden* soll — oder etwas, das er zum Entscheiden *braucht*? | **[S]** Koster/Schell vs. Meier |
| 15 | Wenn wir eine Zahl anzeigen, die nicht die interne Zahl ist: Können wir das begründen, ohne die Kausalkette unlesbar zu machen? | **[P]** Solomon vs. **[S]** Zagal |

---

## Zahlen, Worte und die Fünf-plus-minus-zwei-Grenze

Hier liegt die auffälligste Asymmetrie der Quellenlage: Die kognitiven Grenzwerte sind gut belegt, der konkrete Vergleich „Zahl gegen Wort gegen Balken" ist **gar nicht** untersucht. Hodents Gedächtnismodell nennt sensorisches Gedächtnis (Bruchteile einer Sekunde), Arbeitsgedächtnis (etwa **5 Elemente ±2**) und Langzeitgedächtnis; im **Lernmodus** liegt die praktische Obergrenze bei **drei** gleichzeitigen Anforderungen ([Celia Hodent, GDC 2016](https://celiahodent.com/gamers-brain-ux-onboarding/)) **[P]**. Dazu kommt ein Layout-Argument aus der Zweiteilung des Arbeitsgedächtnisses: Die phonologische Schleife kann effektiv nur **eine** Sprachaufgabe gleichzeitig, „it's nearly impossible to execute two tasks within the same subsystem simultaneously" ([IxDF nach Hodent](https://ixdf.org/literature/article/design-for-working-memory-players-will-remember-what-matters)) **[S]** — ein Textfenster und eine Lesenachricht konkurrieren, ein Textfenster und eine Kartenaufgabe nicht. Hodents Aufmerksamkeitsbefund erklärt zudem, warum stille Zahlenänderungen auf einer vollen Oberfläche schlicht nicht existieren: „The brain's attentional resources being very limited, we do not methodically process all available information" — unbeachtete Elemente werden vollständig übersehen **[P]**.

Nielsen beziffert die Entlastung: Eine Reduktion von 30 sichtbaren Optionen auf 4 senkt die Entscheidungsinformation von rund **5 bit auf rund 2 bit**, also etwa 60 % weniger Entscheidungslast ([Nielsen](https://jakobnielsenphd.substack.com/p/progressive-disclosure)) **[P]**. Wichtig für die Belegstärke: Nielsens Zahlen wie auch die 80/20-Regel stammen aus dem allgemeinen Software-UX-Feld, **nicht aus Spielen** — die Übertragung ist plausibel, aber nicht gemessen **[A]**.

Dan Felders Dreiteilung ist die brauchbarste Begriffsgrundlage für die eigentliche Frage. Er unterscheidet **Comprehension Complexity** (wie schwer Regeln, Fähigkeiten und Interface zu verstehen sind — schlecht), **Tracking Complexity** (wie viele Elemente man gleichzeitig im Kopf behalten muss — „nearly always detrimental") und **Depth** (wie schwer es ist, nach dem Verstehen den besten Zug zu finden — gut). Seine Metapher: Die beiden Komplexitätsarten seien „like a wrapper on a candy bar" — notwendig, aber so dünn wie möglich. Im Zweifel: die einfachere Variante, denn Komplexität lässt sich später leichter hinzufügen als entfernen, und die eigene Vertrautheit lässt ein Design einfacher wirken, als Spieler es erleben ([Game Developer](https://www.gamedeveloper.com/design/design-101-complexity-vs-depth)) **[P]**.

Daraus folgt der schärfste UI-Test, den dieser Bericht kennt: **Entfernt man ein Zahlenfeld und ändert sich die optimale Entscheidung nicht, war es Tracking Complexity ohne Tiefe** **[A]**. Die belegten Praxisbeispiele stützen drei Mechanismen: **Aggregation** (eine abgeleitete Kennzahl statt der Rohgrößen), **zeitliche Staffelung** und **Automatisierung**, die die Zahl entfallen lässt, weil die Entscheidung entfällt. Factorio begrenzt die Rezeptzahl bewusst — kovarex: „I just don't enjoy having to keep track of a huge number of unique recipes" — und schaltet Technologien per Trigger frei, damit man nicht an der eigenen Fabrik vorbeiforscht ([FFF #376](https://www.factorio.com/blog/post/fff-376)) **[P]**. Der historische Beleg für Tiefe aus wenigen Variablen ist *Hamurabi* mit drei gekoppelten Größen ([Wikipedia](https://de.wikipedia.org/wiki/Wirtschaftssimulation_(Computerspielgenre))) **[S]**, und Chris Sawyer formuliert dasselbe als Erfahrung: „perhaps it was the game's simplicity and yet its vast scale?" sowie, ausdrücklich gegen Detailinflation, „a bigger and more detailed and nicer looking game doesn't necessarily mean it's more fun to play" ([Arcade Attack](https://www.arcadeattack.co.uk/chris-sawyer-interview/)) **[P]**.

Zur Zahl-gegen-Wort-Frage selbst existiert **keine Messung**. Was existiert, sind zwei Designeraussagen. Solomons XCOM-Befund zeigt, dass der Spieler eine angezeigte Zahl ohnehin in eine grobe Kategorie übersetzt („85 % = praktisch sicher") **[P]**. Lucas Pope hat für *Papers, Please* umgekehrt bewusst auf Bezifferung verzichtet: „I made a concerted effort to keep things vague and non-judgemental throughout the game. The starkest example of that is with the family status screen at night. It's just a few dots with some text" ([Game Developer](https://www.gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i-)) **[P]**. Hodents Säule „Form Follows Function" — der Spieler soll die Fähigkeiten eines Systems durch bloßes Betrachten erfassen ([IxDF](https://ixdf.org/literature/article/the-game-ux-twist-usability-principles-for-games)) **[S]** — und Nielsens Schichtungsregel „Urteil zuerst, Details hinter einem Bedienelement" **[P]** ergeben zusammen die Empfehlung, die dieser Bericht als **begründete Ableitung, nicht als Befund** führt: Wort oder Farbe an der Oberfläche, Zahl im Tooltip, Herleitung in der Aufklappebene **[A]**.

**Bauregeln:**

| # | Regel | Beleg |
|---|---|---|
| 16 | Höchstens **fünf** parallel zu beobachtende Leitgrößen im Übersichtsfenster, in der Einführungsphase **drei**. | **[P]** Hodent (Übertragung auf Bildschirmwerte **[A]**) |
| 17 | Eine Zahl kommt nur auf den Hauptschirm, wenn gilt: Wäre sie anders, würde ich diese Runde anders entscheiden. | **[A]** aus Felder + Meier |
| 18 | Exakte Zahl dort, wo **verrechnet** wird (Preis, Frachtgewicht, Marge, Frist). Wort oder Balken dort, wo nur **verglichen** wird (Zustand, Auslastung, Risiko, Zufriedenheit). | **[A]** aus Solomon + Hodent |
| 19 | Eine angezeigte Zahl ist eine Zusage. Entweder sie stimmt exakt, oder es steht ein Band da („ca. 4 000–5 000"). | **[A]** |
| 20 | Ein Balken ohne bekanntes Maximum ist bedeutungslos. Verhältnisse als Balken, absolute Größen ohne Obergrenze (Kontostand) als Zahl. | **[A]** |
| 21 | Jede Bewertungsskala im ganzen Spiel identisch: gleiche Stufenzahl, gleiche Farben, gleiche Wörter, gleiche Leserichtung. | **[S]** Hodent „Consistency" |
| 22 | Farbe trägt nie allein — immer zweite Kodierung (Form, Symbol, Position, Wort). Rot-Grün-Schwäche trifft die Ampel direkt. | **[S]** Hodent „Accessibility" |
| 23 | Eine stille Zahlenänderung existiert für den Spieler nicht. Änderungen brauchen Bewegungs- oder Farbsignal. | **[P]** Hodent |
| 24 | Text und gesprochene/geschriebene Meldung nicht gleichzeitig — dasselbe Gedächtnis-Teilsystem. | **[S]** Hodent/IxDF |

---

## Der Einstieg: 67 Meldungen auf 22, und warum Sperren schneller lehrt als Erklären

Der einzige echte Experimentalbefund der gesamten Recherche stammt nicht aus dem Spielebereich: Carroll und Carrithers zeigten bei IBM 1984 mit der **Training-Wheels-Studie**, dass das Blockieren fortgeschrittener Funktionen für Neulinge zu schnellerem Lernen und besserem Verständnis führte — Anfänger auf der unbeschränkten Oberfläche verbrauchten knapp **ein Viertel ihrer Zeit** damit, sich aus genau den Fehlerzuständen zu befreien, die die eingeschränkte Oberfläche ausgesperrt hatte ([Nielsen](https://jakobnielsenphd.substack.com/p/progressive-disclosure)) **[P]**. Das ist das stärkste verfügbare Argument dafür, Systeme über den Spielverlauf freizuschalten, statt sie in einem Tutorial gleichzeitig zu erklären.

Der am besten dokumentierte Fall aus dem Simulations-/Strategiegenre ist Paradox' Überarbeitung des Crusader-Kings-III-Tutorials. Das Team nennt **Progressive Disclosure** ausdrücklich als Leitprinzip — „adding complexity bit by bit" mache „a complex interaction easy to interact with" — und verdichtete dabei **67 Tutorial-Meldungen auf rund 22** ([Game Developer, Deep Dive](https://www.gamedeveloper.com/design/deep-dive-refreshing-the-crusader-kings-iii-tutorial-mode-through-optimized-ux)) **[P]**. Zwei weitere Punkte daraus sind übertragbar: Das Team akzeptierte unvorhersehbare Sandbox-Ereignisse als Teil der Tutorial-Erfahrung (ein Charakter, der mitten im Tutorial an einer Lungenentzündung stirbt), statt jedes Szenario zu skripten — und testete intern mit Entwicklern, die das Projekt nicht kannten, ausdrücklich, um „the curse of knowledge" zu umgehen. Die Verdichtungszahl ist der beste verfügbare Hinweis darauf, dass der typische Onboarding-Fehler in diesem Genre **zu viel Text** ist, nicht zu wenig **[A]**.

Nielsens operative Regeln lassen sich unverändert übernehmen: Rund **80 % der Aufgaben** spielen sich auf Stufe 1 ab, etwa 20 % brauchen die Detailebene; höchstens **zwei Ebenen**; klar beschriften statt „Mehr …"; Bedienelemente sichtbar und an konstanter Position halten; mit Anfängern *und* Erfahrenen testen. Nielsen widerspricht dabei ausdrücklich dem Bild vom ewigen Fortgeschrittenen: Nutzer graduieren nicht von den Grundlagen weg, sie besuchen die Tiefe nur gelegentlich **[P]**. Hodent ergänzt die Lernregeln: **das Warum vor der Mechanik**, aktives Lernen durch Tun statt passiver Text, Wiederholungen zeitlich gestreut und in wechselnden Kontexten — und, besonders wichtig: den Spieler während des Wissenserwerbs **nicht bestrafen**, weil das die Bindung senkt und Stress erzeugt **[P]**.

Factorio zeigt dieselbe Logik auf der Systemseite: Fortschritt soll „start as low as possible and you can earn all of the things in the process, which makes it all feel much more deserved", optionale Systeme lassen den Spieler entscheiden, „where and when you want to use it" ([FFF #376](https://www.factorio.com/blog/post/fff-376)) **[P]**.

Zur ökonomischen Rahmung existiert genau eine harte Zahl und genau eine harte Grenze. Die Zahl: Bei Warframe spielten laut Hodent **80 %** der Spieler über die erste Stunde hinaus, **20 %** brachen im Onboarding ab **[P]** — ein Einzelwert aus einem Vortrag von 2016, **kein Branchendurchschnitt und keine Zielmarke**. Die Grenze: Steams Erstattungsfenster liegt bei **zwei Stunden Spielzeit und 14 Tagen** ([Steam Refunds](https://store.steampowered.com/steam_refunds/)) **[P]**. Daraus folgt eine Terminvorgabe: Wer nach 60 Minuten noch keinen vollständigen Erfolgskreislauf erlebt hat — Auftrag annehmen, ausführen, bezahlt werden, aufrüsten — hat noch eine Stunde Erstattungsfenster übrig **[A]**.

**Prüffragen:**

| # | Frage | Beleg |
|---|---|---|
| 25 | Ist das System in der ersten Stunde gesperrt oder nur unerklärt? Sperren lehrt schneller als Erklären. | **[P]** Carroll/Carrithers |
| 26 | Erklären wir das Warum vor der Mechanik — oder nur die Bedienung? | **[P]** Hodent |
| 27 | Kann der Spieler in der Einführungsphase insolvent gehen, eine Vertragsstrafe zahlen oder etwas unwiederbringlich verlieren? Wenn ja: entfernen. Androhen ja, vollziehen nein. | **[P]** Hodent (Übertragung **[A]**) |
| 28 | Steht die Erklärung an der Stelle des ersten Bedarfs — oder in einem vorgeschalteten Block? | **[P]** Hodent/CK3 |
| 29 | Wie viele Tutorial-Meldungen haben wir, und welche davon überlebt einen Test mit jemandem, der das Projekt nicht kennt? | **[P]** CK3 |
| 30 | Erlebt der Spieler in 60 Minuten einen vollständigen Kreislauf Auftrag → Ausführung → Bezahlung → Aufrüstung? | **[A]** aus Steam-Grenze |
| 31 | Maximal zwei Ebenen. Was auf Ebene drei landet, wird ein eigenes Werkzeug. | **[P]** Nielsen |

---

## Fünf Antimuster mit Namen — und der Kipppunkt, an dem das Spiel zur Buchhaltung wird

**Dominante Strategie.** Soren Johnson liefert dazu die schärfste Formulierung des Feldes: „a single, dominant strategy actually takes away choice from a game because all other options are provably sub-optimal", das Ideal sei stattdessen, dass „a specific decision is right in some circumstances but not in others, with a wide grey area between the two extremes" ([Water Finds a Crack](https://www.designer-notes.com/game-developer-column-17-water-finds-a-crack/)) **[P]**. Sein Fallbeispiel ist das **ICS-Problem in Civilization** („Infinite City Sprawl"/„Sleaze"): Weil Boni *pro Stadt* statt skalierend mit der Stadtgröße vergeben wurden, war das Spammen vieler Kleinstädte optimal — was den Schwierigkeitsgrad zerstörte *und* Tedium erzeugte, weil die Verwaltung von 100+ Städten zur Arbeit wurde, der sich Spieler trotzdem nicht entziehen konnten. Für eine Spedition ist die Regel direkt übersetzbar: **Jeder Bonus, der pro Einheit/Fahrzeug/Niederlassung statt skalierend vergeben wird, erzeugt einen Anreiz zur Vervielfachung kleiner Objekte — und damit automatisch Micromanagement** **[A]**.

**Der Buchhaltereffekt.** Johnsons Overflow-Beispiel ist der Musterfall: Wenn Überschussproduktion verfällt, mikromanagen Spieler jede Stadt in jeder Runde, um nichts zu verschwenden **[P]**. Die 4X-Kritik benennt dasselbe auf Genreebene — „the tactical-level, action-oriented mechanics … actually block the player from experiencing the strategic-level … fun" ([Five Suggestions for 4X Fun](https://www.gamedeveloper.com/design/five-suggestions-for-4x-fun)) **[P]** — und schlägt als direkt übertragbares Gegenmittel vor, Entscheidungen **kontinuierlich statt diskret** zu gestalten: Der Spieler setzt dauerhafte Verteilungsziele, die automatisch weiterlaufen, statt jede Runde einzeln zuzuweisen. Das ist die präziseste bekannte Gegenmaßnahme, weil sie die Entscheidung erhält und nur ihre Wiederholungsfrequenz senkt **[A]**. Weitere dort genannte Mittel: Einheiten an KI-Verwalter delegieren statt einzeln steuerbar machen, und **Endgame-Erkennung** — das Spiel merkt, wann der Ausgang rechnerisch feststeht, und bietet das Beenden an, statt Beschäftigungsarbeit zu erzwingen. Die Late-Game-Diagnose derselben Quelle: „Your strategy, as it gets applied, has already either won or lost the game for you. Now you're only whacking the 'Next Turn' button repeatedly."

Der **Kipppunkt** lässt sich daraus exakt benennen: Eine Wirtschaftssimulation wird zur Buchhaltung, sobald die optimale Handlung **bekannt ist, aber trotzdem manuell ausgeführt werden muss**. Ist sie unbekannt, ist es eine Entscheidung; ist sie bekannt und automatisiert, ist es Fortschritt; ist sie bekannt und manuell, ist es Fleißarbeit **[A]**. Factorio zieht dieselbe Konsequenz aus der anderen Richtung: „the core of what makes Factorio good is that the horrible huge grind ... can be mitigated by automation" — der Grind wird nicht wegbalanciert, die Automatisierung *ist* der Spielinhalt ([FFF #376](https://www.factorio.com/blog/post/fff-376)) **[P]**.

**Grind.** Johnsons Morrowind-Beispiel — stundenlang gegen eine Wand laufen, um Athletik zu steigern, „doing mindless activities for cheap rewards" **[P]** — deckt sich mit Ernest Adams' Fehlerkatalog, der Grinding als „boring, outdated, unnecessary" führt ([Bad Game Designer, No Twinkie! X](https://www.gamedeveloper.com/design/the-designer-s-notebook-bad-game-designer-no-twinkie-x)) **[S]**. Adams' Liste enthält weitere direkt prüfbare Punkte: *Mocking the Player* (das Spiel verhöhnt beim Scheitern, statt konstruktiv zurückzumelden), *Essential but Unobtainable Items* (verpassbare spielentscheidende Gegenstände), *Psychic AI* (unplausible Allwissenheit, die planvolles Vorgehen untergräbt) und *Over/Under-Use of Game Features* (Szenarien erzeugen keine abwechslungsreichen Situationen für die Kernmechanik).

**Setback-Bestrafung.** Jesper Juul dreht die naive Annahme um: Nicht das Scheitern frustriert, sondern die Art der Bestrafung. Entgegen seiner eigenen Ausgangshypothese fand er, dass „players prefer feeling responsible for their own failure" — Spiele, in denen Scheitern zufällig oder fremdverschuldet wirkt, werden schlechter bewertet. Scheitern hat eine eigene produktive Funktion: „failure adds content by making the player see new nuances in a game" und „failure is central to the experience of depth in a game, to the experience of improving skills". Das eigentliche Problem ist die **Setback-Bestrafung** — der Zwang, bereits absolvierte Passagen erneut zu spielen; Casual Games sind nach Juul auch deshalb erfolgreich, weil sie Energie- und Ressourcenstrafen statt erzwungener Wiederholung einsetzen ([Fear of Failing?](https://jesperjuul.net/text/fearoffailing/)) **[P]**. Daraus folgt eine klare Designpräferenz: **Rückschläge, die den Zustand verändern (Ressourcenverlust, geänderte Marktlage, neuer Engpass), vor Rückschlägen, die den Zustand zurücksetzen (Neuladen, Wiederaufbau von Null)** **[A]**.

**Komplexität ohne Tiefe** ist bereits oben behandelt (Felder), gehört aber in dieselbe Familie.

**Die Zitatlage.** Der Satz „Given the opportunity, players will optimize the fun out of the game" zirkuliert breit als Johnson-Zitat; eine **Wortlaut-Fundstelle in einem Primärtext von Johnson wurde nicht gefunden** — die inhaltlich identische Argumentation steht aber belegt in „Water Finds a Crack". Er ist als **sinngemäße, zugeschriebene Formulierung** zu kennzeichnen, nicht als Zitat **[U für den Wortlaut, P für den Inhalt]**. Auch die Wendung „the player should have the fun, not the designer" ließ sich in den geprüften Mitschriften nicht verifizieren **[U]**.

**Dark Patterns — und warum die Kategorie umstritten ist.** Zagal, Björk und Lewis definieren dark game design patterns als „abstracted elements of a game's design whose purpose can be argued as questionable and perhaps even unethical", ausgehend vom Befund: „game designers are typically regarded as advocates for players. However, a game creator's interests may not align with the players'" ([deceptive.design](https://deceptive.design/articles/dark-patterns-in-the-design-of-games/)) **[S]**. Die Autoren betonen selbst, es gehe ihnen nicht um Verurteilung, sondern darum, „to contribute to an ongoing discussion regarding the values in games". Die Taxonomie umfasst temporale (*Grinding*, *Playing by Appointment*), monetäre (*Pay to Skip*, *Pay to Unlock*) und sozialkapitalbasierte Muster (*Social Pyramid Schemes*, *Impersonation*) — belegt über zwei sich deckende Sekundärdarstellungen ([educationalgamedesign.com](https://educationalgamedesign.com/dark-patterns-in-game-design.html), [arXiv 2401.06247](https://arxiv.org/html/2401.06247v2)) **[S]**; das Volltext-Paper war nicht abrufbar, die oft mitgenannte psychologische Kategorie (*Illusion of Control*, *Premium Currency*, *Artificial Scarcity*) konnte **nicht** belegt werden **[U]**.

Die Gegenposition gehört ausdrücklich dazu. „Against 'Dark Game Design Patterns'" hält das Konzept für in sich widersprüchlich: „it continuously stresses the subjectivity and context dependency of 'darkness,' yet repeatedly declares concrete game patterns as inherently 'dark.'" Weitere Kritikpunkte: keine empirische Erhebung bei Spielern oder Entwicklern, sondern „frequent appeals to popular consensus"; kein offengelegter ethischer Rahmen; und eine Voreingenommenheit gegen Freemium-Spiele, durch die Designpräferenzen der Konsolenära „normatively universalize[d]" würden ([DiGRA 2020, PDF](https://eprints.whiterose.ac.uk/id/eprint/156460/1/DiGRA_2020_paper_189.pdf)) **[P]**. Für dieses Projekt folgt daraus eine Sprachregelung, die inhaltlich schärfer ist als das Etikett: **nicht „Mechanik X ist dark", sondern „Mechanik X fordert Zeit und Aufmerksamkeit, denen kein Entscheidungsgewinn gegenübersteht"** **[A]**. Praktisch fällt für ein Einzelspielerspiel ohne Monetarisierung die monetäre und soziale Familie ohnehin weg; relevant bleibt die **temporale**: Grind, Leerlauf, verfallende Ressourcen, Wartungsrunden, Fortschritt durch Warten statt durch Entscheiden **[A]**.

**Prüffragen:**

| # | Frage | Beleg |
|---|---|---|
| 32 | Gibt es einen Bonus *pro* Fahrzeug/Niederlassung/Auftrag statt skalierend? Dann bauen wir gerade ICS nach. | **[P]** Johnson |
| 33 | Gibt es eine wiederkehrende Aktion mit eindeutig richtiger Antwort? Entweder automatisieren oder durch skalierende Kosten entwerten. | **[P]** Johnson, **[P]** Factorio |
| 34 | Ist diese Entscheidung diskret (jede Runde neu zuweisen) oder kontinuierlich (Ziel setzen, läuft weiter)? Kontinuierlich bevorzugen. | **[P]** 4X-Kritik |
| 35 | Merkt das Spiel, wann der Ausgang feststeht — oder lässt es den Spieler weiterklicken? | **[P]** 4X-Kritik |
| 36 | Setzt dieser Rückschlag den Zustand *zurück* oder *verändert* er ihn? Zurücksetzen streichen. | **[P]** Juul |
| 37 | Kann der Spieler sich die Schuld für dieses Scheitern selbst geben? Wenn nein, wird er es schlechter bewerten. | **[P]** Juul |
| 38 | Fordert diese Mechanik Zeit und Aufmerksamkeit, ohne einen Entscheidungsgewinn zu liefern? | **[A]** aus Zagal + DiGRA-Kritik |
| 39 | Wenn eine optimale Spielweise langweilig auszuführen ist: Das ist ein Balancing-Bug, kein Spielerproblem. Korrektur gehört in die Regeln. | **[P]** Johnson |

Ein Prozesshinweis gehört dazu, weil er in Postmortem-Auswertungen ganz oben steht: Unter den zehn häufigsten „What went wrong"-Kategorien aus drei Jahrgängen Postmortems stehen **Scope and scale** (zu ehrgeiziger Funktionsumfang, der spät gestrichen werden muss) und **Polish** (zu wenig Zeit für Balancing und QA) ([Game Developer](https://www.gamedeveloper.com/business/what-went-wrong-learning-from-past-postmortems)) **[P]**. Für Aufbausims sind das die teuersten beiden Punkte, weil das Genre im Umfang fast beliebig skaliert und gerade bei ihm Balancing-Politur über die Spielbarkeit entscheidet **[A]**.

---

## Figuren: zwei bis drei wertende Eigenschaften schlagen jeden Dialogbaum

Der wichtigste Befund für eine Spedition mit Fahrern, Kunden und Konkurrenten kommt von 11 bit studios: Bei *This War of Mine* stellte das Team fest, dass **zu stark vereinfachte Figuren von Spielern als verbrauchbare Ressource behandelt wurden**; die Gegenmaßnahme waren „große Biografien, Charaktertypen und zusätzliche Fähigkeiten", um emotionale Investition statt taktischer Opferung zu erzeugen ([Game Developer](https://www.gamedeveloper.com/design/the-secrets-behind-i-this-war-of-mine-i-s-emotional-impact)) **[P]**. In einem Zahlenspiel ist die Default-Haltung des Spielers, Personal zu verrechnen — Biografie und Benennung sind das Gegengewicht, und sie müssen **vor der ersten Entlassungsentscheidung** sichtbar sein **[A]**. Dasselbe Team belegt zugleich das billigste Bindungsmittel überhaupt: Die Umbenennung von „Inventory" zu „Our Things" veränderte messbar die Prioritäten der Tester — weg von Ressourcenoptimierung, hin zu Grundbedürfnissen **[P]**.

Tynan Sylvester liefert das Gestaltungsprinzip dazu. Seine GDC-2017-Folien rahmen RimWorld ausdrücklich als „Not a game – a story generator" und formulieren zwei harte Entwurfsregeln: Mechaniken „müssen Verlust und Erholung enthalten" (**loss and recovery**), und der Bewertungsmaßstab verschiebt sich weg von „interessanten Mechaniken" hin zu „Mechaniken, die aus der Perspektive der Figur vielfältige Emotionen erzeugen" ([GDC-Folien, PDF](https://media.gdcvault.com/gdc2017/Presentations/Sylvester_Tynan_RimWorld_Contrarian_Ridiculous.pdf)) **[P]**. Grafik behandelt er wie die Schrifttype eines Romans — sie soll Deutungsraum lassen; die Systeme liefern abstrahiertes Feedback, der Spieler ergänzt den Rest, was Sylvester **Apophänie** nennt ([Game Developer](https://www.gamedeveloper.com/design/rimworld-dwarf-fortress-and-procedurally-generated-story-telling)) **[P]**. Ein depressiver Kolonist, der „ein Bier trinkt und ziellos herumläuft", genügte, um echte Fürsorge auszulösen.

Das Beziehungssystem mit der besten Dokumentation ist das CK2-Opinion-System: **ein einziger Wert von -100 bis +100, einseitig** (A kann B mögen, ohne dass B A mag), aber vollständig in benannte Posten aufgeschlüsselt. Henrik Fåhraeus beschreibt es als „ein einziger Wert, aufsummiert aus einer Reihe klarer Gründe, warum jemand dich mag oder nicht mag"; der Spielwert liegt in der Transparenz — Spieler sehen genau, *warum* ein Vasall rebellieren könnte, und können gezielt gegensteuern ([Game Developer](https://www.gamedeveloper.com/design/the-surprising-design-of-i-crusader-kings-ii-i-)) **[P]**. Fåhraeus lud die Eigenschaften zudem kulturell auf (sieben Todsünden, sieben Tugenden als vererbbare Traits), sodass ein „wollüstiger" Herzog einer „keuschen" Königin automatisch misstraut — zwischenmenschliche Reibung entsteht unabhängig vom politischen Kalkül. Seine Faustregel für Eigenverhalten: „Wenn du einem ehrgeizigen, hinterlistigen Höfling ohne Land einen Titel gibst, ist er eine Weile dankbar, dann will er mehr; das liegt einfach in seiner Natur."

Für die **moralisch aufgeladenen Entscheidungen** dieses Projekts — Preisabsprachen, Schmuggel — ist die Regel besonders scharf. Brandon Perdue prägt den Begriff der **dominanten moralischen Strategie**: „Das Modell, das bestimmte Entscheidungen belohnt, trifft die Entscheidung faktisch für den Spieler" ([Game Developer](https://www.gamedeveloper.com/design/ethical-dilemmas-and-dominant-moral-strategies-in-games)) **[P]**. Seine Kritik an quantifizierter Moral (Paragon/Renegade) lautet, dass Punktwerte, die bessere Dialogoptionen freischalten, Spieler zu den Extremen treiben statt zu differenzierten Positionen; sein Positivbeispiel ist die „Shark"-Szene in Heavy Rain, die gerade deshalb wiegt, weil sie *keinen* mechanischen Vor- oder Nachteil bringt. CD Projekt formuliert dieselbe Haltung für Witcher 2 — Marek Ziemak: „Wir versuchen, es so grau wie möglich zu machen. Wir haben nie eine Wahl zwischen Gut und Böse" ([Game Developer](https://www.gamedeveloper.com/design/what-would-geralt-do-i-witcher-2-i-s-approach-to-choice-and-decision)) **[P]** — und lehnt klassische Moralsysteme ab, weil sie zum Ausnutzen der Mechanik statt zur narrativen Auseinandersetzung anreizen. Die akademische Fassung liefert die Produktionsstudie zu *This War of Mine*: „Es gibt kein Schwarz und Weiß. Es gibt nur Grau", eingeordnet als Miguel Sicarts *ludic phronesis* und als „wicked problems" ohne klare Lösung ([Games and Culture](https://journals.sagepub.com/doi/full/10.1177/1555412017725996)) **[P]**.

Das Muster für Versuchung ist in zwei Spielen übereinstimmend dokumentiert: **sofortiger, sichtbarer Gewinn — verzögerte, personalisierte Strafe**. In *Papers, Please* ist Bestechung durch soziale Sichtbarkeit gedeckelt: „Nimmt der Inspektor zu viele Bestechungsgelder an, werden die Nachbarn misstrauisch und melden ihn den Behörden" ([Game Studies](https://gamestudies.org/1701/articles/morrissette)) **[P]** — nicht jede Tat wird bestraft, aber ein **Muster** wird sichtbar. In *This War of Mine* wird Diebstahl nicht bestraft, sondern gezählt und in Figurenreaktionen übersetzt: „Das Spiel weiß, wie viele Gegenstände der Spieler gestohlen hat" **[P]**. Das ist die Lösung für den scheinbaren Widerspruch zwischen Perdue (keine mechanischen Kosten) und der Notwendigkeit, dass Entscheidungen etwas kosten: **Die Kosten fallen bei den Figuren an, nicht in der Bilanz** — ein Fahrer, der nichts mehr sagt; ein Disponent, der kündigt **[A]**.

Zwei Warnungen gehören dazu. Erstens die methodische: Die Entwickler von *This War of Mine* erlebten nach langem Spielen **moral desensitivity** und brauchten laufend frische Testpersonen, um die emotionale Wirkung zu prüfen ([Games and Culture](https://journals.sagepub.com/doi/full/10.1177/1555412017725996)) **[P]** — externe Tests sind bei Graubereichen kein Komfort, sondern Methode. Zweitens die ökonomische: CD Projekts Co-CEO bezeichnet die berühmte Mitte-Entscheidung in Witcher 2 (zwei weitgehend getrennte Akte) rückblickend als „Experiment" und „Verschwendung von Ressourcen" ([PC Gamer](https://www.pcgamer.com/games/rpg/cd-projekts-co-ceo-says-the-witcher-2s-momentous-midgame-choice-was-an-experiment-and-now-regards-it-as-a-waste-of-resources/)) **[P]**. **Breite Verzweigung von Weltzuständen ist teuer und schlecht sichtbar; Verzweigung in Figurenhaltungen, die über viele Situationen nachwirkt, ist billiger und wirksamer** **[A]**.

Zum Ton schließlich die klarste Aussage der Recherche, von Maciej Szcześnik: „Die Dunkelheit ist wie Pfeffer, richtig? Man sollte nur ein bisschen davon nehmen. Wenn man überdosiert, ist das Gericht geschmacklos" **[P]**. *Papers, Please* gewinnt seinen Reiz nicht aus dem Elend, sondern aus der handwerklichen Befriedigung der Prüfroutine und der taktilen Endgültigkeit des Gummistempels ([Road to the IGF](https://www.gamedeveloper.com/design/road-to-the-igf-lucas-pope-s-i-papers-please-i-)) **[P]**. Übertragen: Die Grundstimmung liefert die handwerkliche Befriedigung der Disposition — Tour geplant, Ladung passt, Fahrer pünktlich. Die Graubereiche sind der Pfeffer **[A]**.

**Prüffragen:**

| # | Frage | Beleg |
|---|---|---|
| 40 | Hat diese Figur (a) Porträt und Namen, (b) zwei bis drei *wertende* Eigenschaften, die Reibung mit anderen erzeugen, (c) sichtbares Eigenverhalten, das der Spieler nicht steuert? | **[A]** aus RimWorld + CK2 + TWoM |
| 41 | Ist die Biografie sichtbar, *bevor* die erste Entlassungs-/Opferentscheidung ansteht? | **[P]** 11 bit |
| 42 | Wie heißt dieses UI-Element? „Personal" oder „Unsere Leute"? Die Benennung verschiebt messbar das Verhalten. | **[P]** 11 bit |
| 43 | Welche Emotion erzeugt diese Regel aus Sicht des Fahrers/Kunden/Konkurrenten? Eine Regel, die nur eine Bilanzzeile verschiebt, fällt durch. | **[P]** Sylvester |
| 44 | Eröffnet dieser Verlust Wiederaufbauhandlungen (loss and recovery) — oder ist er eine Sackgasse, die zum Neuladen zwingt? | **[P]** Sylvester |
| 45 | Ist Schmuggel/Preisabsprache *einfach profitabler* als sauberes Wirtschaften? Dann ist es keine moralische Entscheidung, sondern ein Rechenschritt. | **[P]** Perdue |
| 46 | Fallen die Kosten der Regelverletzung bei Figuren an (Haltung, Kündigung, Schweigen) oder in der Bilanz? Bei Figuren bevorzugen. | **[A]** aus Perdue + 11 bit |
| 47 | Ist die Eintrittswahrscheinlichkeit der Strafe exakt berechenbar? Wenn ja, entsteht wieder eine dominante Strategie. | **[A]** |
| 48 | Wird die *Beziehung* sichtbar (aufgeschlüsselte Posten) oder die *moralische Bewertung* (Balken)? Ersteres ja, Letzteres nein. | **[P]** CK2 + Witcher 2 |
| 49 | Testen wir die Graubereiche mit frischen Testpersonen — oder mit uns selbst nach 300 Stunden? | **[P]** 11 bit / Games and Culture |

---

## Die Windows-98-Oberfläche: geschenkte Erlernbarkeit gegen bezahlte Fläche

Dieser Abschnitt trägt die größte Diskrepanz zwischen Plausibilität und Beleglage im ganzen Bericht. Die Begriffe und Beispiele sind gut dokumentiert, die behauptete Wirkung ist es nicht: Eine diegetische Oberfläche existiert innerhalb der Spielwelt und ist auch für die Figuren sichtbar; genannte Vorteile sind höhere Immersion, Wegfall von Menü-Unterbrechungen und narrative Geschlossenheit, genannte Nachteile sind Zugänglichkeit, **kognitive Überlastung durch zu viel gleichzeitig dargestellte Information** und erheblicher Herstellungsaufwand ([Indieklem](https://indieklem.substack.com/p/19-the-diegetic-dilemma-benefits)) **[S]**. **Messdaten, die zeigen, dass diegetische Oberflächen tatsächlich zu höherer Immersion oder Bindung führen, wurden nicht gefunden — der Vorteil ist durchgehend behauptet** **[U]**.

Was für ein 98er-Vorhaben dagegen gut begründbar ist, ist eine Sonderstellung: Anders als bei einem erfundenen Raumschiff-Interface **kennt der Spieler die Konventionen bereits** — Doppelklick, Taskleiste, Titelleiste, Modaldialog. Die Diegese liefert hier gratis Erlernbarkeit, statt sie zu kosten, vorausgesetzt, sie bricht die Konventionen nicht **[A]**. Diese Konventionsstärke verpflichtet allerdings. Das aVoid-Devlog beschreibt das Ziel genau so: „a fully functional UI, not just something that looks like an OS, but something that acts like one", damit sich Spieler fühlen, „like they were actually using someone else's computer" — umgesetzt mit anklickbaren Symbolen, per Doppelklick zu öffnenden Ordnern, verschieb-, stapel- und schließbaren Fenstern, laufender Uhr, Taskleiste und funktionierendem Startmenü. Der Preis steht im selben Text: „This was one of the most time consuming parts of development", gerechtfertigt damit, dass „any missing feature could break that illusion and immersion" ([aVoid-Devlog](https://dav1n.itch.io/avoid/devlog/924970/the-little-things-that-made-the-os-feel-real)) **[P]**. Ein Fenster, das sich nicht verschieben lässt, oder ein Startmenü ohne Funktion bricht die Illusion sofort. *Uplink* (Introversion, 2001) ist der Referenzfall eines Spiels, dessen gesamte Oberfläche ein fiktives Betriebssystem ist ([Wikipedia](https://en.wikipedia.org/wiki/Uplink_(video_game))) **[S]**.

Die wichtigste Warnung ist der bestdokumentierte Fall dieses Konflikts. Für die Mobilfassung von *Papers, Please* stellte Lucas Pope fest: „The documents are too small and the desk area too crowded. There's a fundamental conflict between readability and having enough space." Seine Lösung war, **die diegetische Metapher aufzugeben**: „no more desk, no more drag-n-drop", ersetzt durch ein Karussell mit Miniaturansichten und einen nur bei Bedarf eingeblendeten Stempeltisch, mit der Zielvorgabe „All three regions visible at all times. No squinting, zooming, or precision required to read/manipulate documents" ([dukope.com](https://dukope.com/devlogs/papers-please/mobile/)) **[P]**. Pope hat im Konflikt die Lesbarkeit gewinnen lassen. Übertragen: Wenn überlappende 98er-Fenster dazu führen, dass der Spieler entscheidungsrelevante Werte nicht gleichzeitig sehen kann, braucht es eine nicht-diegetische Abkürzung — Vollbildansicht, Anordnungs-Schaltfläche, feste Statuszeile **[A]**.

Hodents Perzeptionsbefund trifft dieses Projekt direkt: Wahrnehmung ist subjektiv und kontextabhängig, Spieler teilen die mentalen Modelle der Entwickler nicht — ihr Beispiel ist ausgerechnet das **Disketten-Symbol für „Speichern"**, das jüngeren Nutzern ohne entsprechende Vorerfahrung nichts bedeutet ([Hodent, GDC 2016](https://celiahodent.com/gamers-brain-ux-onboarding/)) **[P]**. Eine Windows-98-Nachbildung stützt sich systematisch auf Zeichen, die für einen Teil der Zielgruppe **keine erlernte Bedeutung mehr haben**: Nostalgie-Wirkung und Verständlichkeit fallen auseinander, jedes Symbol braucht Textbeschriftung oder Tooltip **[A]**. Umgekehrt bietet der 98er-Rahmen epochengerechte Zeichen, die für qualitative Bewertungen bereits erlernt sind — Ausrufezeichen-, Stopp- und Informations-Symbol des Systemdialogs, Fortschrittsbalken, dreistufige Sortierung in der Listenansicht **[A]**.

Zur Fachsprache gibt es **keine empirische Untersuchung** (Jargon gegen Alltagssprache in Spielen wurde nicht gemessen) **[U]**. Belegt ist nur Popes Aussage, dass die bürokratische Struktur als Weltbaustein trägt: „The bureaucratic structure is something that fits naturally. From a design perspective, that structure made it easy for me to fill out a complex set of gameplay-oriented rules and regulations", zusammen mit seinem Sparsamkeitsprinzip: „I worked hard to reduce the amount of dialog, keep things ambiguous, leave some things unresolved, and to rely on the player's imagination to fill in the blanks" ([Game Developer](https://www.gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i-)) **[P]**. Die daraus abgeleitete Arbeitsregel: **Fachsprache darf den Gegenstand benennen** (Frachtbrief, Palette, Zollposition, Deckungsbeitrag) — das macht den Spieler zum Fachmann und ist Teil der Rolle — **sie darf nicht die Handlungsaufforderung tragen**; Schaltflächen und Warnungen gehören in Alltagssprache. Fachbegriffe werden wie Vokabeln eingeführt: beim ersten Auftreten erklärt, danach unkommentiert verwendet, was zugleich Hodents „spaced repetition in varied contexts" erfüllt **[A]**.

Zu verschachtelten Tooltips, wie Crusader Kings 3 sie populär gemacht hat, ist die Lage geteilt. Die wohlwollende Quelle empfiehlt selbst eine Grenze — „An infinitely deep tooltip chain doesn't make sense. There might be some sweet number here like, 2 or 3 nested tooltips" — und benennt als Nachteil die Mauszeiger-Empfindlichkeit: „Moving 1 pixel outside element bounds removes tooltip" ([philip.design](https://philip.design/blog/tooltips-in-tooltips/)) **[S]**. Im Paradox-Forum existiert ein Thread „Reminder to the devs that nested tooltips is bad UX design" ([Paradox-Forum](https://forum.paradoxplaza.com/forum/threads/reminder-to-the-devs-that-nested-tooltips-is-bad-ux-design.1702017/)) **[P für die Existenz der Gegenposition]**. Für eine Maus-Oberfläche im 98er-Stil ist die Pixel-Empfindlichkeit das zentrale Praxisproblem: **Ein Tooltip, der beim Hineinfahren stehen bleibt und selbst überfahrbar wird, ist die Voraussetzung dafür, überhaupt verschachteln zu dürfen** **[A]**. Wahrscheinlich wirksamer als jede weitere Tooltip-Ebene ist in einer zahlenlastigen Simulation Hodents **funktionale Affordanz** — Sortieren, Filtern, Anheften —, weil sie die Menge sichtbarer Zahlen *reduziert*, statt sie zu erklären **[A]**.

Ein konstruktiver Nebeneffekt der Diegese gehört ins Protokoll: Sie liefert eine natürliche Rechtfertigung für Progressive Disclosure. Programme, die noch nicht installiert sind, Ordner ohne Zugriffsrechte, ein Modem, das noch nicht angeschlossen ist — das Freischalten wirkt als Weltgeschehen statt als Spielverwaltung **[A]**.

**Prüffragen:**

| # | Frage | Beleg |
|---|---|---|
| 50 | Funktioniert dieses UI-Element wie in Windows 98, oder sieht es nur so aus? Jede fehlende Funktion bricht die Illusion. | **[P]** aVoid |
| 51 | Kann der Spieler die entscheidungsrelevanten Werte **gleichzeitig** sehen? Wenn die Fenstermetapher das verhindert: nicht-diegetische Abkürzung einbauen. | **[P]** Pope (Mobilumbau) |
| 52 | Trägt dieses Symbol seine Bedeutung für jemanden, der 1998 nicht am PC saß? Wenn nein: Textbeschriftung oder Tooltip. | **[P]** Hodent (Disketten-Beispiel) |
| 53 | Steht Fachsprache am **Gegenstand** (Frachtbrief, Deckungsbeitrag) oder auf der **Schaltfläche**? Auf Schaltflächen und in Warnungen Alltagssprache. | **[A]** aus Pope + Hodent |
| 54 | Bleibt der Tooltip beim Hineinfahren stehen? Wenn nein, darf er nicht verschachtelt werden. Maximal 2–3 Ebenen. | **[S]** philip.design |
| 55 | Ließe sich diese Tooltip-Ebene durch Sortieren, Filtern oder Anheften ersetzen? Das reduziert Zahlen, statt sie zu erklären. | **[A]** aus Hodent |
| 56 | Lässt sich diese Freischaltung als Weltgeschehen erzählen (Programm installiert, Modem angeschlossen, Lizenz erteilt) statt als Spielverwaltung? | **[A]** |

---

## Was diese Recherche nicht belegen konnte

Dieser Abschnitt ist kein Anhang, sondern Teil des Ergebnisses. Die folgenden Punkte sind in der Recherche **gesucht und nicht gefunden** worden; sie dürfen im Projekt nicht als Wissen behandelt werden.

**Die zwei meistzitierten Sätze des Feldes sind nicht am Original verifiziert.** Für „a game is a series of interesting decisions" konnte die Erstquelle nicht geklärt werden, und die Zuschreibung an Sid Meier wird ausdrücklich in Frage gestellt ([Flash of Steel](https://flashofsteel.com/index.php/2008/07/07/quote-misquote-cite/)). Der GDC-2012-Vortrag selbst war nur über Bezahlschranke zugänglich; alle Meier-Zitate dieses Berichts stammen aus der Berichterstattung. Für „Given the opportunity, players will optimize the fun out of the game" wurde keine Wortlaut-Fundstelle in einem Primärtext von Soren Johnson gefunden — der Inhalt steht belegt in „Water Finds a Crack", der Kurzsatz ist als zugeschrieben zu kennzeichnen. Ebenso unverifiziert: „the player should have the fun, not the designer" und die kolportierte Maxime, ein Spiel dürfe nur zugunsten des Spielers lügen.

**Die Dark-Pattern-Taxonomie ist nur sekundär belegt und die Kategorie ist fachlich bestritten.** Das Volltext-Paper von Zagal, Björk und Lewis war über die verfügbaren Wege nicht abrufbar; die Musternamen stammen aus zwei sich deckenden Sekundärdarstellungen. Die oft mitgenannte psychologische Kategorie (*Illusion of Control*, *Invested Value*, *Premium Currency*, *Artificial Scarcity*) ließ sich **nicht** belegen. Die DiGRA-2020-Gegenposition hält die Kategorie für ontologisch inkohärent und empirisch ungestützt — beide Seiten sind oben wiedergegeben. Wer die Taxonomie im Projekt verwenden will, muss zuerst das [Originalpaper](https://www.diva-portal.org/smash/get/diva2:1043332/FULLTEXT01.pdf) prüfen.

**Deutsche Wirtschaftssimulationen der 90er: kaum zitierfähige Quellen.** Zu *Railroad Tycoon, Die Siedler, Capitalism, Der Patrizier, Ports of Call, Industriegigant* und *OpenTTD* wurden **keine belastbaren, wörtlichen Entwickleraussagen zum Systemdesign** gefunden; zu *Vermeer, Oldtimer, Transworld* und *Die Fugger* fand sich überhaupt keine zitierfähige Kritik. Zeitgenössische Volltexte aus Power Play und ASM waren nicht abrufbar — die im Bericht genannten Ports-of-Call-Kritikpunkte stammen aus Community-Rezeption auf Kultboy, **nicht** aus den Magazinkritiken selbst. Zu Will Wright und SimCity liegen nur ungeprüfte Interviewsammlungen vor. Der Bericht enthält deshalb keine Designerzitate zu diesen Titeln, und das Projekt sollte auch keine erfinden.

**Abbruchquoten in Aufbau- und Wirtschaftssimulationen: keine Datengrundlage.** Weder ein Postmortem noch ein GDC-Vortrag mit Retention- oder Trichterdaten für dieses Genre wurde gefunden. Die Suche lieferte überwiegend Content-Marketing von Analyse-Anbietern mit Benchmark-Zahlen für Mobilspiele ohne nachvollziehbare Methodik; nichts davon wurde übernommen. **Aussagen der Form „X % brechen nach Y Stunden ab" dürfen im Projekt nicht behauptet werden.** Die einzige harte Zahl — Warframe, 80 % über die erste Stunde hinaus — ist ein Einzelwert aus einem Vortrag von 2016 und keine Zielmarke.

**Zahl gegen Wort gegen Balken: nicht untersucht.** Es existiert keine experimentelle Untersuchung, die Reaktionszeit oder Entscheidungsqualität bei Zahl, Wort oder Balken in Spielen misst; ebenso keine Quelle zur Frage, ab wie vielen Stellen eine Zahl ihre Lesbarkeit verliert, und keine zur optimalen Stufenzahl qualitativer Skalen (drei gegen fünf gegen sieben). Zu **Ampelfarben, Sternebewertungen und Buchstabennoten in Spieloberflächen** wurde weder empirische noch Designerliteratur gefunden. Alle Empfehlungen des Kapitels „Zahlen, Worte und kognitive Last" sind **begründete Ableitungen aus Hodent, Nielsen und zwei Designeraussagen**, keine Messergebnisse. Auch Nielsens Zahlen (80/20, Hicks Gesetz in bit) stammen aus dem allgemeinen Software-UX, nicht aus Spielen.

**Diegetische Oberflächen: kein Wirkungsnachweis.** Es wurden **keine Messdaten** gefunden, die zeigen, dass diegetische Oberflächen zu höherer Immersion oder Bindung führen. Die GDC-Vault-Vorträge zu *Hardspace: Shipbreaker* und *Dead Space* sind nur über ihre Titel belegt, nicht inhaltlich ausgewertet; zu *Duskers*, *Her Story* und *Orwell* liegt keine zitierbare Designer-Aussage vor.

**Weitere Lücken in Kürze:** Keine Primärquelle zu Transparenz vs. Verborgenheit speziell in Wirtschaftssimulationen; keine zu UI-Lesbarkeit und Informationsdichte in Anno, Tropico oder Factorio (die Factorio-GUI-Blogs [FFF #191](https://factorio.com/blog/post/fff-191) und [FFF #238](https://factorio.com/blog/post/fff-238) sind der klare nächste Schritt); keine zu Fachjargon gegen Alltagssprache; keine zu Ereignissystemen und Erzählung in Wirtschaftssimulationen; keine Quelle, die Flow-Theorie speziell für dieses Genre prüft. Die Primärtexte von Koster, Sylvesters Buch, Swink und Salen/Zimmerman waren nicht direkt zugänglich — alle als **[S]** markierten Zitate sind vor wörtlicher Verwendung am Buchtext zu prüfen. Zur Selbstbestimmungstheorie (Deci/Ryan; Rigby/Ryan, *Glued to Games*), dem üblichen psychologischen Unterbau der Unterscheidung gesunde/manipulative Motivation, wurde in dieser Recherche keine Quelle abgerufen — eine relevante Lücke.

---

## Fazit: Die Entscheidungskurve ist die eigentliche Designaufgabe

Der Ertrag dieser Recherche ist nicht eine Liste guter Praktiken, sondern eine Umdeutung der Aufgabe. Die verbreitete Vorstellung, Balance sei ein *Punkt*, den man trifft — die Flow-Vorschrift in ihrer populären Form — ist empirisch schwächer gestützt, als ihre Verbreitung nahelegt ([Løvoll & Vittersø: 9–14 % erklärte Varianz, Höchstwerte *außerhalb* der Balance](https://link.springer.com/article/10.1007/s11205-012-0211-9)). Was an ihre Stelle tritt, ist eine **Kurve**: Der Entscheidungsraum muss sich in dem Tempo erneuern, in dem der Spieler ihn löst. Meiers zwei Ausfallmodi sind die beiden Enden derselben Kurve — in Stunde eins wählt der Spieler zufällig, weil er nichts versteht, in Stunde zehn immer dasselbe, weil er alles verstanden hat. Kosters Lernbogen beschreibt, warum das unvermeidlich ist; Cooks Loop/Arc-Unterscheidung sagt, womit man antwortet. Die Antwort ist ausdrücklich **nicht mehr Inhalt** — Arcs verbrauchen sich und führen auf die content treadmill —, sondern mehr Systemebene: neue Skalen, neue Knappheiten, skalierende Kosten, die alte Optima entwerten. Civilization IV löste ICS nicht mit einem Verbot, sondern mit Unterhaltskosten pro Stadt.

Für dieses konkrete Projekt fallen drei Konsequenzen an, die sich nicht aus einer einzelnen Quelle, sondern aus deren Zusammenwirken ergeben. Erstens: **Die Windows-98-Oberfläche ist das billigste Onboarding-Werkzeug, das dieses Projekt hat** — der Spieler kennt Doppelklick, Taskleiste und Modaldialog bereits, und nicht installierte Programme sind die eleganteste Rechtfertigung für Progressive Disclosure, die ein Aufbauspiel bekommen kann. Sie ist zugleich das teuerste Versprechen, weil jedes nicht funktionierende Element die Illusion bricht und weil Popes Mobilumbau zeigt, dass die Metapher im Konflikt mit der Lesbarkeit verliert. Zweitens: **In einem Zahlenspiel ist die Default-Haltung des Spielers, Menschen zu verrechnen** — das ist bei *This War of Mine* dokumentiert, und die Gegenmittel sind billig (Porträt, Name, zwei wertende Eigenschaften, ein aufgeschlüsselter Meinungswert nach CK2-Muster), müssen aber vor der ersten Entlassungsentscheidung wirken. Drittens, und am wichtigsten für die tägliche Arbeit: **Wenn die optimale Spielweise langweilig auszuführen ist, ist das ein Balancing-Bug.** Diese eine Regel, aus Johnson abgeleitet, ersetzt einen erheblichen Teil der Diskussionen, die in Aufbauspielprojekten sonst über Spielermoral geführt werden.

Und ein Befund über die Recherche selbst: Das Feld ist erstaunlich zitatgetrieben und erstaunlich messarm. Die beiden berühmtesten Sätze sind nicht am Original verifizierbar, die ethisch aufgeladenste Kategorie ist fachlich bestritten, und die Fragen, die für ein UI-lastiges Genre am dringendsten wären — Zahl gegen Wort, Abbruchverhalten, Wirkung diegetischer Oberflächen — haben schlicht keine Daten. Der einzige echte Experimentalbefund dieses Berichts stammt aus der Büro-Software des Jahres 1984. Das ist kein Grund, die Prinzipien zu verwerfen; es ist ein Grund, sie als **Hypothesen mit Testpflicht** zu behandeln. Die operativ wichtigste Konsequenz daraus ist methodisch: Playtests mit Leuten, die das Projekt nicht kennen, sind in diesem Genre kein Komfort, sondern der einzige verfügbare Ersatz für die fehlende Empirie — bei der Verständlichkeit (CK3 gegen „the curse of knowledge") ebenso wie bei den Graubereichen (11 bit gegen moral desensitivity).

---

## Quellenverzeichnis

### Standardwerke und Theorie
- Hunicke, LeBlanc, Zubek, „MDA: A Formal Approach to Game Design and Game Research" (AAAI 2004) — https://users.cs.northwestern.edu/~hunicke/MDA.pdf **[P]**
- Jesse Schell, „The Art of Game Design", referiert über — https://notesbylex.com/the-art-of-game-design-a-book-of-lenses-2nd-edition-by-jesse-schell **[S]**
- Tynan Sylvester, „Designing Games", referiert über — https://sobrief.com/books/designing-games **[S]**
- Salen/Zimmerman, „meaningful play" — https://en.wikipedia.org/wiki/Meaningful_play **[S]**
- Ernest Adams, „Fundamentals of Game Design", Vortragsnotizen — https://evolvingdeveloper.com/game-design-fundamentals-notes-ernest-w-adams-talk/ **[S]**
- Raph Koster, „A Theory of Fun", referiert über — https://www.smartbooknotes.com/article/theory-of-fun/ **[S]**
- Daniel Cook, „Loops and Arcs" — https://lostgarden.com/2012/04/30/loops-and-arcs/ **[P]**
- Steve Swink, „Game Feel", referiert über — https://en.wikipedia.org/wiki/Game_feel **[S]**
- Løvoll & Vittersø, „Can Balance be Boring?", Social Indicators Research — https://link.springer.com/article/10.1007/s11205-012-0211-9 **[P]**
- Jenova Chen, „Flow in Games", MFA-Thesis — https://www.jenovachen.com/flowingames/Flow_in_games_final.pdf **[P, nur bibliografisch]**

### Entscheidungen, Antimuster, Schwierigkeit
- Sid Meier, GDC 2012 „Interesting Decisions", Bericht — https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions **[S]**; Vortrag (Bezahlschranke) — https://gdcvault.com/play/1015756/Interesting
- Sid Meier, GDC-2010-Keynote, Liveblog — https://www.escapistmagazine.com/liveblog-sid-meiers-gdc-2010-keynote-speech/ **[S]**
- Zitatdebatte „series of interesting decisions" — https://flashofsteel.com/index.php/2008/07/07/quote-misquote-cite/ **[P für die Debatte]**
- Soren Johnson, „GD Column 17: Water Finds a Crack" — https://www.designer-notes.com/game-developer-column-17-water-finds-a-crack/ **[P]**
- Dan Felder, „Design 101: Complexity vs. Depth" — https://www.gamedeveloper.com/design/design-101-complexity-vs-depth **[P]**
- Ernest Adams, „Bad Game Designer, No Twinkie! X" — https://www.gamedeveloper.com/design/the-designer-s-notebook-bad-game-designer-no-twinkie-x **[S]**
- „Five Suggestions for 4X Fun" — https://www.gamedeveloper.com/design/five-suggestions-for-4x-fun **[P]**
- Jesper Juul, „Fear of Failing?" — https://jesperjuul.net/text/fearoffailing/ **[P]**
- „What Went Wrong? Learning From Past Postmortems" — https://www.gamedeveloper.com/business/what-went-wrong-learning-from-past-postmortems **[P]**
- Micromanagement (Genre-Übersicht) — https://en.wikipedia.org/wiki/Micromanagement_(gameplay) **[S]**

### Dark Patterns und Gegenposition
- Zagal/Björk/Lewis (FDG 2013), Eintrag — https://deceptive.design/articles/dark-patterns-in-the-design-of-games/ **[S]**; Volltext-PDF (ungeprüft) — https://www.diva-portal.org/smash/get/diva2:1043332/FULLTEXT01.pdf
- Taxonomie-Zusammenfassungen — https://educationalgamedesign.com/dark-patterns-in-game-design.html ; https://arxiv.org/html/2401.06247v2 **[S]**
- „Against 'Dark Game Design Patterns'" (DiGRA 2020) — https://eprints.whiterose.ac.uk/id/eprint/156460/1/DiGRA_2020_paper_189.pdf **[P]**

### Genre: Klassiker und Entwickleraussagen
- Chris Sawyer, Interview — https://www.arcadeattack.co.uk/chris-sawyer-interview/ **[P]**
- Factorio, „Friday Facts #376 – Research and Technology" — https://www.factorio.com/blog/post/fff-376 **[P]**
- Wirtschaftssimulation (Genre-Übersicht, Hamurabi) — https://de.wikipedia.org/wiki/Wirtschaftssimulation_(Computerspielgenre) **[S]**
- Ports of Call, Rezeption — https://www.kultboy.com/testbericht-uebersicht/126/ **[P, Community]**
- Stay Forever Folge 42: Der Patrizier — https://www.stayforever.de/2015/03/folge-42-der-patrizier/ **[P]**

### Onboarding, UX und kognitive Last
- Paradox, „Deep Dive: Refreshing the Crusader Kings III Tutorial Mode" — https://www.gamedeveloper.com/design/deep-dive-refreshing-the-crusader-kings-iii-tutorial-mode-through-optimized-ux **[P]**
- Jakob Nielsen, „Progressive Disclosure" (inkl. Training Wheels 1984, Hicks Gesetz) — https://jakobnielsenphd.substack.com/p/progressive-disclosure **[P]**
- Celia Hodent, GDC 2016, „The Gamer's Brain / UX of Onboarding" — https://celiahodent.com/gamers-brain-ux-onboarding/ **[P]**
- Hodents Usability-Säulen — https://ixdf.org/literature/article/the-game-ux-twist-usability-principles-for-games **[S]**
- Arbeitsgedächtnis im Spieldesign — https://ixdf.org/literature/article/design-for-working-memory-players-will-remember-what-matters **[S]**
- Progressive Disclosure als UX-Prinzip — https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/ **[S]**
- Steam-Erstattungsregeln — https://store.steampowered.com/steam_refunds/ **[P]**

### Oberfläche und Diegese
- Jake Solomon zu Zufall in XCOM 2 — https://www.gamedeveloper.com/design/jake-solomon-explains-the-careful-use-of-randomness-in-i-xcom-2-i- **[P]**
- Lucas Pope, „Designing the Bleak Genius of Papers, Please" — https://www.gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i- **[P]**
- Lucas Pope, Mobil-Devlog (Lesbarkeit vs. Metapher) — https://dukope.com/devlogs/papers-please/mobile/ **[P]**
- aVoid-Devlog, nachgebautes Betriebssystem — https://dav1n.itch.io/avoid/devlog/924970/the-little-things-that-made-the-os-feel-real **[P]**
- Diegetische Oberflächen, Vor- und Nachteile — https://indieklem.substack.com/p/19-the-diegetic-dilemma-benefits **[S]**
- Verschachtelte Tooltips — https://philip.design/blog/tooltips-in-tooltips/ **[S]**; Gegenposition — https://forum.paradoxplaza.com/forum/threads/reminder-to-the-devs-that-nested-tooltips-is-bad-ux-design.1702017/ **[P für die Existenz]**
- Uplink — https://en.wikipedia.org/wiki/Uplink_(video_game) **[S]**
- Game UI Database (Bildreferenz) — https://www.gameuidatabase.com/

### Figuren, Erzählung, Moral
- Tynan Sylvester, GDC 2017 „RimWorld: Contrarian, Ridiculous, and Impossible" (Folien) — https://media.gdcvault.com/gdc2017/Presentations/Sylvester_Tynan_RimWorld_Contrarian_Ridiculous.pdf **[P]**
- „RimWorld, Dwarf Fortress, and procedurally generated story telling" — https://www.gamedeveloper.com/design/rimworld-dwarf-fortress-and-procedurally-generated-story-telling **[P]**
- „The secrets behind This War of Mine's emotional impact" — https://www.gamedeveloper.com/design/the-secrets-behind-i-this-war-of-mine-i-s-emotional-impact **[P]**
- de Smale, Kors & Sandovar, „The Case of This War of Mine", Games and Culture — https://journals.sagepub.com/doi/full/10.1177/1555412017725996 **[P]**
- Henrik Fåhraeus, „The Surprising Design of Crusader Kings II" — https://www.gamedeveloper.com/design/the-surprising-design-of-i-crusader-kings-ii-i- **[P]**
- Brandon Perdue, „Ethical Dilemmas and Dominant Moral Strategies In Games" — https://www.gamedeveloper.com/design/ethical-dilemmas-and-dominant-moral-strategies-in-games **[P]**
- CD Projekt, „What Would Geralt Do? Witcher 2's Approach to Choice and Decision" — https://www.gamedeveloper.com/design/what-would-geralt-do-i-witcher-2-i-s-approach-to-choice-and-decision **[P]**
- Morrissette, „Glory to Arstotzka", Game Studies 17(1) — https://gamestudies.org/1701/articles/morrissette **[P]**
- „Road to the IGF: Lucas Pope's Papers, Please" — https://www.gamedeveloper.com/design/road-to-the-igf-lucas-pope-s-i-papers-please-i- **[P]**
- CD Projekt zur Witcher-2-Verzweigung als Ressourcenverschwendung — https://www.pcgamer.com/games/rpg/cd-projekts-co-ceo-says-the-witcher-2s-momentous-midgame-choice-was-an-experiment-and-now-regards-it-as-a-waste-of-resources/ **[P]**

### Für Vertiefung vorgemerkt (in dieser Recherche nicht ausgewertet)
- Factorio-GUI-Blogs — https://factorio.com/blog/post/fff-191 ; https://factorio.com/blog/post/fff-238
- GDC Vault: „Cutting Apart The Diegetic Interface of Hardspace: Shipbreaker" — https://www.gdcvault.com/play/1027158/Cutting-Apart-The-Diegetic-Interface ; „Crafting Destruction: The Evolution of the Dead Space User Interface" — https://gdcvault.com/play/1017723/Crafting-Destruction-The-Evolution-of
- „Emergent Stories in Crusader Kings II", GDC — https://gdcvault.com/play/1020774/Emergent-Stories-in-Crusader-Kings
- Celia Hodent, „The Gamer's Brain" (Routledge) — https://www.routledge.com/The-Gamers-Brain-How-Neuroscience-and-UX-Can-Impact-Video-Game-Design/Hodent/p/book/9780367638184
- „Player Choices, Game Endings and the Design of Moral Dilemmas in Games" (CHI PLAY 2018) — https://dl.acm.org/doi/10.1145/3270316.3271525
- „Risking Treasure: Testing Loss Aversion in an Adventure Game" (CHI PLAY 2020) — https://dl.acm.org/doi/10.1145/3410404.3414250


---

## Was das für SpediPro heißt

Dieser Abschnitt überträgt die Prüffragen oben auf den Stand vom
25.09.2026 (v0.15.41 gepackt). Er nennt, was sich bestätigt, was
aussteht und was ein Befund gegen uns ist.

### Bestätigt, was wir ohnehin planen

**Die Freischaltungstreppe steht auf dem einzigen echten
Experimentalbefund des ganzen Berichts.** Carroll und Carrithers (IBM
1984): Sperren lehrt schneller als Erklären, Anfänger auf der
unbeschränkten Oberfläche verbrachten rund ein Viertel ihrer Zeit
damit, sich aus Fehlerzuständen zu befreien (Prüffrage 25). Das
README-Kapitel "Freischaltung - die Werkzeuge sind Menschen" war eine
Vermutung; sie ist gestützt.

**Die Ansage statt der Zahl** entspricht Regel 18: exakte Zahl dort,
wo verrechnet wird, Wort oder Balken dort, wo nur verglichen wird.
Solomons XCOM-Befund stützt es von der anderen Seite - der Spieler
übersetzt eine angezeigte Zahl ohnehin in eine grobe Kategorie.
Wichtig für die Umsetzung: Regel 21 verlangt, dass **jede**
Bewertungsskala im Spiel dieselbe Stufenzahl, dieselben Farben und
dieselben Wörter benutzt. Unsere Fünferleiter muss also auch für
Fahrzeugzustand, Kundenbeziehung und Auslastung gelten, nicht nur für
die Tour.

**Ruf als zwei Zahlen** trifft Regel 48 genau: sichtbar sein soll die
*Beziehung* mit aufgeschlüsselten Gründen (CK2-Muster), nicht die
*moralische Bewertung* als Balken. Unsere Formulierung "von vierzehn
Verladern rufen dich neun direkt an" ist bereits die aufgeschlüsselte
Fassung.

**Das Telefon** ist nach Regel 56 die eleganteste Rechtfertigung für
schrittweise Offenlegung, die ein Aufbauspiel bekommen kann: ein
Programm, das noch nicht da ist, ist Weltgeschehen statt
Spielverwaltung.

### Ein Befund gegen uns

**Der Kurzlauf-Vorsprung ist ein Kandidat für eine dominante
Strategie.** Gemessen in 0.15.41: 1.297 DM je Tag bei 60 km gegen 293
DM bei 1.200 km, ein Faktor von 4,4. Johnson (Prüffrage 5, 32, 39) ist
dazu eindeutig - eine Option, die unter allen Umständen die beste ist,
nimmt die Entscheidung weg, und wenn die optimale Spielweise langweilig
auszuführen ist, ist das ein Balancing-Fehler und kein Spielerproblem.

Begrenzt wird es bei uns bisher nur durch das Auftragsangebot, also
durch Knappheit, nicht durch die Regeln. Das ist die schwächere Art
der Begrenzung: Sobald die Börse wächst oder die Flotte größer wird,
greift sie nicht mehr. Die Gegenmittel, die der Bericht nennt:
skalierende Kosten (Civ IV löste ICS mit Unterhaltskosten je Stadt,
nicht mit einem Verbot) - übertragen also etwa ein Rüstzeit- oder
Verwaltungsaufwand je Auftrag statt je Kilometer. Die Abfertigungs-
pauschale im Frachtpreis wirkt heute genau andersherum: Sie macht
kurze Läufe je Kilometer besonders einträglich.

**Zweiter Punkt gegen uns:** Prüffrage 27 verlangt, dass der Spieler
in der Einführungsphase nicht insolvent gehen kann. Mit 45.000 DM
Startkapital und 18 Monaten Ruhestand ist das derzeit erfüllt - aber
sobald Fahrerlöhne dazukommen, muss es erneut geprüft werden, nicht
angenommen.

### Wo der Bericht uns widerspricht oder differenziert

**"Deckungsbeitrag" streichen war richtig, aber nicht aus dem Grund,
den wir angegeben haben.** Regel 53 erlaubt Fachsprache ausdrücklich
am Gegenstand - sie macht den Spieler zum Fachmann - und verbietet sie
nur auf Schaltflächen und in Warnungen. Der tragfähige Grund ist Regel
17 (Felder): Der Deckungsbeitrag ist eine Zwischensumme, die keine
Entscheidung ändert; entfernt man sie, entscheidet der Spieler
genauso. Tracking Complexity ohne Tiefe. In der aufgeklappten
Rechnung dürfte er stehen bleiben.

**Fachbegriffe wie Vokabeln einführen**: beim ersten Auftreten
erklären, danach unkommentiert verwenden. Das haben wir für
Frachtbrief, Ladefenster und Standzeit bisher nicht getan - sie stehen
einfach da.

### Stand nach der Prüfung vom 25.09.2026 (v0.15.42)

Geprüft mit `browsertest-designregeln.js`, maschinell und
wiederholbar. Was dabei herauskam:

| Regel | Stand |
|---|---|
| 5/6 Gibt es eine Wahl? | **erfüllt** - im Schnitt 2,2 ladbare Aufträge am Standort, über alle fünf Urteilsstufen verteilt. Vorher: 0,0 bis 0,2, weil die Ortsgarantie über alle eigenen Orte zusammen zählte |
| 5 Dominante Strategie | **erfüllt** - über einen simulierten Monat gewinnt keine der vier Spielweisen durchgehend. Die 4,4-fache Kurzlauf-Dominanz aus 0.15.40 war eine nicht einlösbare Rate |
| 16 Höchstens fünf Leitgrößen | **erfüllt** - zwei Zahlen auf der obersten Ebene (vorher zehn Zeilen) |
| 17 Zahl nur, wenn sie die Entscheidung ändert | **erfüllt** - Deckungsbeitrag entfallen |
| 18 Zahl wo gerechnet, Wort wo verglichen | **erfüllt** - Zielliste zeigt das Urteil, die Zahl steht im Tooltip |
| 21 Eine Skala im ganzen Spiel | **erfüllt** - fünf Stufen an einer Stelle, jede mit eigener Farbe im Stylesheet |
| 22 Farbe trägt nie allein | **erfüllt** - Wort und farbiger Randbalken |
| 27 Kein Bankrott in der Einführung | **erfüllt** - 17 Monate Ruhestand aus dem Startkapital |
| 30 Ganzer Kreislauf in der ersten Stunde | **erfüllt** - der erste Auftrag je Ort steht sofort bereit (vorher in 22 % der Spiele keiner) |
| 31 Höchstens zwei Ebenen | **erfüllt** - kein Aufklapper im Aufklapper |
| 53 Fachsprache nicht auf Schaltflächen | **erfüllt** |
| 23 Stille Zahlenänderung | **teilweise** - der Monatsabschluss bucht Fixkosten und meldet es nur ins Protokoll |
| 34 Kontinuierlich statt diskret | **offen** - jede Tour wird einzeln disponiert. Wichtig erst bei wachsender Flotte |
| 35 Ausgang erkannt | **offen** |
| 43/46 Kosten bei Figuren statt in der Bilanz | **offen** - es gibt noch keine Figuren |

Nicht maschinell prüfbar und daher offen: alles zu Figuren (40-49),
zur Erzählung und zum Ton. Diese Regeln greifen erst mit dem
Personenmodul.

### Was wir vor dem nächsten Bauschritt prüfen sollten

- **Regel 16**: Höchstens fünf Leitgrößen im Übersichtsfenster, in der
  Einführungsphase drei. Die Durchsicht hat zehn Zeilen. Das ist die
  Zahl, gegen die der Umbau "Weniger Zahlen, mehr Ansage" antritt.
- **Regel 23**: Eine stille Zahlenänderung existiert für den Spieler
  nicht. Am 25.09.2026 geprüft und die eigene Behauptung widerlegt: In
  der Taskleiste steht gar kein Kontostand, nur Datum und Uhr. Der
  einzige gefundene Fall war der wartende Wagen, und der meldet sich
  seit 0.15.41 ("wartet auf Ladung"). Offen bleibt der Monatsabschluss:
  Er bucht Miete, Steuer und Versicherung und meldet es nur ins
  Protokoll.
- **Regel 34**: Ist eine Entscheidung diskret oder kontinuierlich?
  Tourenplanung ist bei uns durchgehend diskret - jede Tour einzeln.
  Ein Dauerauftrag ("fahre diese Relation wöchentlich") wäre die
  kontinuierliche Fassung und das beste bekannte Gegenmittel gegen den
  Buchhaltereffekt, wenn die Flotte wächst.
- **Regel 35**: Merkt das Spiel, wann der Ausgang feststeht? Bei uns
  bisher nicht.
- **Regel 45 und 47**: Schmuggel darf nicht einfach profitabler sein,
  und die Eintrittswahrscheinlichkeit der Strafe darf nicht exakt
  berechenbar sein - sonst entsteht wieder eine dominante Strategie.
  Das gehört in das Kapitel "Konkurrenz, das Telefon und die dunkle
  Seite", bevor dort gebaut wird.
- **Regel 51**: Kann der Spieler die entscheidungsrelevanten Werte
  gleichzeitig sehen? Popes Mobilumbau von Papers, Please ist die
  dokumentierte Warnung: Im Konflikt zwischen Fenstermetapher und
  Lesbarkeit gewinnt die Lesbarkeit.

### Die methodische Konsequenz

Der Bericht endet mit einem Satz, der für dieses Projekt schwerer
wiegt als jede einzelne Regel: Das Feld hat für die Fragen, die uns am
dringendsten sind - Zahl gegen Wort, Abbruchverhalten, Wirkung einer
nachgebauten Oberfläche - **keine Daten**. Playtests mit Leuten, die
das Projekt nicht kennen, sind deshalb kein Komfort, sondern der
einzige Ersatz für die fehlende Empirie. Bis dahin gilt für uns, was
in diesem Projekt ohnehin Praxis ist: messen, was messbar ist, und
den Rest als Annahme kennzeichnen.

### Offene Recherche

`FFF #191` und `FFF #238` von Factorio zum Oberflächen- und
Informationsdesign waren in dieser Runde nicht ausgewertet und sind
der klare nächste Schritt. Ebenso ungeprüft: die Primärtexte von
Koster, Sylvester und Salen/Zimmerman - alle mit **[S]** markierten
Zitate sind vor wörtlicher Verwendung am Buchtext zu prüfen.
