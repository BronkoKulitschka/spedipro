/* Hilfetexte.

   Aufbau eines Abschnitts:
     { h:  'Überschrift' }
     { p:  'Absatz' }
     { list: ['Punkt', 'Punkt'] }
     { tab: { kopf: [...], zeilen: [[...]] } }
     { tipp: 'Hinweis im Kasten' }
     { ref: 'themenId' }                Verweis auf ein anderes Thema      */

export const TOPICS = {

  start: {
    titel: 'Willkommen', icon: '📖', gruppe: 'Grundlagen',
    inhalt: [
      { p: 'SpeditionsPro 95 ist eine ruhige Wirtschaftssimulation. Du führst eine Spedition: Aufträge annehmen, Fahrzeuge disponieren, Fahrer ausbilden, den Betrieb vergrößern.' },
      { h: 'Was es nicht gibt' },
      { list: [
        'Kein Zeitlimit und kein Spielende.',
        'Keine Konkurrenz, die dir Aufträge wegnimmt.',
        'Keine Vertragsstrafen. Wer einen Vertrag nicht erfüllt, bekommt weniger Prämie, mehr nicht.',
        'Ein Konto im Minus ist kein Verlieren, nur eine Zahl.',
      ] },
      { h: 'Der Standort' },
      { p: 'Beim Start wählst du einen Standort — eine der 42 Städte aus der Liste, oder du tippst irgendwohin auf die Karte. Im zweiten Fall wird nachgeschlagen, welche Ortschaft dort in der Nähe liegt; ein Dorf direkt am Punkt zählt mehr als eine Großstadt zwanzig Kilometer weiter.' },
      { p: 'Liegt im Umkreis von 25 Kilometern keine Ortschaft, ist der Punkt nicht wählbar — mitten in der Nordsee lässt sich keine Spedition gründen.' },
      { p: 'Der Betriebshof wird danach in einem echten Gewerbe- oder Industriegebiet am Ortsrand angelegt, meist drei bis zehn Kilometer vom Zentrum. Die Flächen stammen aus OpenStreetMap.' },
      { p: 'Der Standort bestimmt, welche Kundschaft in Reichweite liegt. Ein Hafen bringt Umschlagverkehr, das Ruhrgebiet dichte Kurzstrecken, Kassel eine zentrale Lage für den Fernverkehr.' },
      { h: 'Der Einstieg in drei Schritten' },
      { list: [
        'In der Disposition ein Fahrzeug wählen und einen Auftrag annehmen.',
        'Die Betriebsuhr laufen lassen und zusehen, wie der LKW fährt.',
        'Nach der Zustellung in die Kasse schauen, was hängengeblieben ist.',
      ] },
      { tipp: 'Die Leertaste hält die Betriebsuhr an und lässt sie weiterlaufen.' },
      { ref: 'dispo' },
    ],
  },

  dispo: {
    titel: 'Disposition', icon: '🗺️', gruppe: 'Programme',
    inhalt: [
      { p: 'Das wichtigste Fenster. Links die Karte, rechts die offenen Anfragen. Hier entscheidest du, welches Fahrzeug welche Fracht fährt.' },
      { h: 'Fahrzeug wählen' },
      { p: 'Oben rechts steht die Auswahlliste aller einsatzbereiten Fahrzeuge mit ihrem aktuellen Standort. Alle Entfernungen in der Auftragsliste gelten ab diesem Standort — nicht ab dem Depot.' },
      { p: 'Auch Fahrzeuge auf Leerfahrt stehen in der Liste. Eine Rückfahrt ins Depot bringt nichts ein und lässt sich jederzeit abbrechen: Nimmt so ein Fahrzeug einen Auftrag an, hält es dort an, wo es gerade ist, und fährt von dort zur Fracht. Die bis dahin gefahrenen Kilometer werden abgerechnet.' },
      { p: 'Jede Anfrage zeigt deshalb in eigener Zeile, wie weit sie vom gewählten Fahrzeug entfernt ist und wie lange die Fahrt dauert. Die Fahrzeit rechnet mit dem Schnitt dieses Fahrzeugs, also einschließlich der Streckenkenntnis des Fahrers.' },
      { p: 'Die Liste ist nach Anfahrt sortiert, das Nächstgelegene steht oben. Wechselst du das Fahrzeug, ordnet sie sich neu — ein Auftrag, der für den einen weit weg ist, liegt für den anderen um die Ecke.' },
      { p: 'Die Lupe daneben springt zum Fahrzeug und klappt seine Daten auf.' },
      { h: 'Aufträge annehmen' },
      { p: 'Die Liste zeigt nur, was zur Auswahl nötig ist: Kunde, Preis, Entfernung, Ladung. Ein Antippen öffnet den Auftrag im Einzelnen und zeigt das Ziel auf der Karte.' },
      { h: 'Das Auftragsfenster' },
      { p: 'Dort steht alles beisammen — die Ladung mit Güterklasse und nötiger Ausstattung, die Strecke mit Fahrzeit und Erlös je Kilometer, der Auftraggeber mit Bildnis, Charakter und Stimmung.' },
      { p: 'Darunter das <strong>Ladeschema</strong>: der Wagen von oben, die Ladefläche in Stellplätze geteilt. Belegte Plätze sind eingefärbt, je Sendung eine eigene Farbe — bei einer Sammelladung sieht man so, was wem gehört. Die neue Sendung ist gelb hervorgehoben.' },
      { p: 'Darunter ein zweiter Balken für die Nutzlast. Beide Grenzen gelten gleichzeitig: Bei schwerem Gut ist die Fläche halb leer und der Wagen trotzdem voll. Genau das macht das Bild sichtbar.' },
      { list: [
        '💬 verhandeln — öffnet das Gespräch mit dem Auftraggeber.',
        '+ auf die Ladeliste — sammelt die Sendung für eine gemeinsame Tour.',
        'sofort starten — schickt das Fahrzeug mit dieser einen Sendung los.',
      ] },
      { p: 'Passt eine Sendung nicht, sind beide Ladeknöpfe gesperrt und der Grund steht darunter: zu viele Stellplätze, zu schwer oder eine fehlende Ausstattung.' },
      { h: 'Verhandeln' },
      { p: 'Der genannte Preis ist nicht das letzte Wort. Bei Spotanfragen öffnet <strong>💬 verhandeln</strong> ein Gespräch mit dem Auftraggeber — Rede und Gegenrede, höchstens drei Runden.' },
      { h: 'Erst reden, dann fordern' },
      { p: 'Argumente kosten keine Runde und stimmen den Verlader milder. Jedes lässt sich nur einmal anführen, und nicht jedes steht immer zur Verfügung:' },
      { tab: {
        kopf: ['Argument', 'Voraussetzung'],
        zeilen: [
          ['Wir können noch heute laden', 'immer'],
          ['Unsere Zustellquote spricht für sich', 'Ansehen 60'],
          ['Wir fahren seit Längerem für Sie', 'drei Fahrten für diesen Kunden'],
          ['Laderaum ist zurzeit knapp', 'angespannter Markt'],
          ['Wir haben das passende Fahrzeug', 'nur bei Kühlgut oder Gefahrgut'],
        ],
      } },
      { p: 'Danach wird gefordert — fünf, zwölf, zweiundzwanzig oder fünfunddreißig Prozent mehr. Jede Forderung kostet eine Runde. Neben jeder Stufe steht eine Einschätzung, aber bewusst ungenau.' },
      { h: 'Wie es ausgeht' },
      { list: [
        'Angenommen — der Verlader zahlt, was du verlangst.',
        'Gegenangebot — er bietet weniger, aber mehr als zuvor. Du kannst weiterverhandeln oder annehmen.',
        'Abgebrochen — bei maßloser Forderung vergibt er die Fracht anderweitig.',
      ] },
      { p: 'Der Kern ist die Reihenfolge: Wer gleich das Höchste verlangt, verschenkt seine Argumente. Wer erst redet, verschiebt die Grenze und bekommt dann mehr.' },
      { tipp: 'Jede Anfrage lässt sich nur einmal verhandeln, und jede hat ihren eigenen Spielraum. Ein Hauskunde bei knappem Markt lässt deutlich mehr zu als ein Fremder in der Flaute.' },

      { h: 'Die Ladeliste' },
      { p: 'Sammelst du mehrere Sendungen, zeigt die Ladeliste laufend zwei Balken: belegte Stellplätze und ausgenutzte Nutzlast. Bei jeder weiteren Sendung steht dabei, wie viele Kilometer Umweg sie kostet.' },
      { p: 'Tour starten schickt das Fahrzeug los. Die Stopps werden nach dem nächstgelegenen Ziel geordnet, an jedem Stopp wird die jeweilige Fracht abgerechnet.' },
      { tipp: 'Sammelverkehr lohnt sich: Bei mehreren Stopps sind es nur 33 Minuten Rampenzeit je Stopp statt einer vollen Stunde.' },
      { h: 'Die Karte' },
      { list: [
        '🚛 Fahrzeuge — immer sichtbar, ausgegraut bei Pause oder Ruhezeit.',
        '📦 offene Aufträge, 📜 aus Verträgen, 🤝 von Partnern.',
        '✈️ ⚓ 🚉 Umschlagpunkte im ganzen Bundesgebiet, nach Art eingefärbt.',
        '🅿️ Rastanlagen — standardmäßig ausgeblendet, weil es viele sind.',
        '🚧 gemeldete Baustellen und Verkehrsmeldungen.',
      ] },
      { p: 'Deutschland legt den Ausschnitt über alles Wesentliche, Depot holt dich zurück. Ein Klick auf ein Fahrzeug zeigt seine Daten als Kurzfassung.' },
      { h: 'Die Ringe um die Fahrzeuge' },
      { p: 'Jedes Fahrzeug trägt einen Ring in seiner eigenen Farbe, dazu unten rechts seine Nummer. Dieselbe Farbe hat auch seine Streckenlinie — bei mehreren Fahrzeugen unterwegs ist damit sofort klar, welche Linie zu wem gehört.' },
      { p: 'Fährt ein Fahrzeug, sitzt außen am Ring ein Pfeil und zeigt in die Richtung, in die es gerade unterwegs ist. Er dreht sich mit dem Verlauf der Strecke. Stehende Fahrzeuge haben keinen Pfeil.' },
      { p: 'Die Farben finden sich auch im Fuhrpark und in der Fahrzeugauswahl wieder.' },
      { ref: 'ladung' },
    ],
  },

  fleet: {
    titel: 'Fuhrpark', icon: '🚛', gruppe: 'Programme',
    inhalt: [
      { p: 'Der Zustand aller Fahrzeuge auf einen Blick: wo sie stehen, was sie geladen haben, wer sie fährt.' },
      { p: 'Fahrer selbst werden im Personal verwaltet — hier steht nur, wer zugeteilt ist. Ein Fahrzeug ohne Fahrer trägt einen roten Rand und steht still.' },
      { p: 'Über der Liste steht der Bestand nach Bauart — wie viele Fahrzeuge jeder Klasse im Hof stehen, wie viele davon gebraucht sind, und was der Fuhrpark zusammen an Fixkosten je Tag verursacht.' },
      { h: 'Was in einer Zeile steht' },
      { list: [
        'Fahrername, Fahrzeugnummer und Fahrerstufe.',
        'Fahrzeugtyp, Ausstattung, Laufleistung und Standort.',
        'Nutzlast, Stellplätze und zulässiges Gesamtgewicht.',
        'Bei beladenen Fahrzeugen: Güterklasse, Menge und Auslastung.',
        'Der Erfahrungsbalken des Fahrers und darunter der Streckenfortschritt.',
        'Die fünf Fertigkeiten als Kästchenreihe.',
      ] },
      { h: 'Die Knöpfe' },
      { list: [
        'ins Depot — schickt ein stehendes Fahrzeug leer zurück. Kostet Diesel und bringt nichts ein, lohnt sich nur, wenn in der Gegend nichts zu holen ist. Taucht unterwegs doch eine Fracht auf, lässt sich die Fahrt abbrechen.',
        'zeigen — öffnet die Disposition und zoomt zum Fahrzeug.',
        'Schulung — öffnet das Schulungsfenster des Fahrers.',
        'verkaufen — der Wiederverkaufswert sinkt mit den gefahrenen Kilometern.',
      ] },
      { h: 'Automatik' },
      { p: 'Ein Fahrzeug auf Automatik sucht sich selbst Aufträge und lädt zusammen, was zusammenpasst. Das ist die Voraussetzung dafür, dass in deiner Abwesenheit weitergefahren wird. Die Automatik wird mit Betriebsstufe 2 frei.' },
      { ref: 'progress' },
    ],
  },

  staff: {
    titel: 'Personal', icon: '👤', gruppe: 'Programme',
    inhalt: [
      { p: 'Fahrer sind eigenständige Personen, kein Zubehör der Fahrzeuge. Sie werden eingestellt, einem Fahrzeug zugeteilt und gegebenenfalls entlassen. Ein Fahrzeug ohne Fahrer steht.' },
      { h: 'Mannschaft' },
      { p: 'Alle Angestellten mit ihren Eigenheiten, Leistungsdaten und dem Fahrzeug, das sie fahren. Über die Auswahlliste lässt sich jederzeit umverteilen — allerdings nur, solange das Fahrzeug steht.' },
      { h: 'Börse' },
      { p: 'Sechs Bewerber, die gelegentlich wechseln. Jeder hat eine bis drei Stärken und null bis zwei Schwächen. Manche bringen schon Erfahrung mit und kosten entsprechend mehr.' },
      { p: 'Zu jeder Eigenheit steht ausgeschrieben, was sie bedeutet und wie sie sich auswirkt — grün hinterlegt die Stärken, rot die Schwächen. „18 % mehr Diesel" ist eindeutiger als ein Vorzeichen, bei dem offenbleibt, ob es gut oder schlecht ist.' },
      { p: 'Der Lohn beginnt mit dem ersten Tag und läuft weiter, ob gefahren wird oder nicht. Ein Fahrer ohne Fahrzeug kostet also Geld, ohne etwas einzubringen.' },
      { tab: {
        kopf: ['Posten', 'Betrag'],
        zeilen: [
          ['Grundlohn Stufe 1', '95 € je Tag'],
          ['je weiterer Stufe', '+18 € je Tag'],
          ['Abfindung bei Entlassung', '14 Tageslöhne'],
        ],
      } },
      { h: 'Auswertung' },
      { p: 'Nach Leistung geordnet, mit einer Note von 0 bis 100. Sie entsteht aus dem Erlös je Fahrt, dem Anteil des Diesels am Erlös und der Häufigkeit von Pannen. Ohne Fahrten gibt es kein Urteil.' },
      { p: 'Darunter stehen die Auffälligkeiten: sichtbare Schwächen und Zahlen, die aus dem Rahmen fallen. Das ist die Grundlage für die Entscheidung, ob jemand bleibt.' },
      { tipp: 'Eine Entlassung kostet vierzehn Tageslöhne. Bei einem schwachen Fahrer rechnet sich das trotzdem oft — ein Bleifuß verbrennt mehr, als die Abfindung kostet.' },
      { ref: 'fahrer' },
    ],
  },

  dealer: {
    titel: 'Fahrzeughandel', icon: '🏷️', gruppe: 'Programme',
    inhalt: [
      { p: 'Elf Fahrzeugklassen, gruppiert nach Führerscheinklasse. Die Frage ist nicht, welche die beste ist, sondern welche zu den Strecken und Gütern passt, die du fährst.' },
      { p: 'Klassen, von denen du schon Fahrzeuge hast, tragen eine grüne Marke mit der Anzahl.' },
      { h: 'Klasse B — bis 3,5 t' },
      { tab: {
        kopf: ['Fahrzeug', 'Preis', 'Nutzlast', 'Plätze', 'm³'],
        zeilen: [
          ['Kastenwagen 3.0', '7.500 €', '1,0 t', '3', '8'],
          ['Kurier 3.5', '12.000 €', '1,2 t', '4', '14'],
          ['Maxi 3.5 lang', '15.500 €', '1,05 t', '6', '20'],
        ],
      } },
      { p: 'Diese drei sind vom Sonntags- und Feiertagsfahrverbot ausgenommen. Sie fahren, wenn alle anderen stehen — und haben die niedrigsten Fixkosten.' },
      { h: 'Klasse C1 — 3,5 bis 7,5 t' },
      { tab: {
        kopf: ['Fahrzeug', 'Preis', 'Nutzlast', 'Plätze', 'm³'],
        zeilen: [
          ['Kompakt 5.0', '17.000 €', '1,8 t', '10', '26'],
          ['Nahverkehr 7.5', '24.000 €', '2,3 t', '15', '34'],
        ],
      } },
      { p: 'Der 7,5-Tonner ist das Rückgrat des Verteilerverkehrs: viel Volumen bei schmaler Nutzlast. Für Möbel und Stückgut ideal, für Baustoffe zu leicht.' },
      { h: 'Klasse C — über 7,5 t, solo' },
      { tab: {
        kopf: ['Fahrzeug', 'Preis', 'Nutzlast', 'Plätze', 'm³'],
        zeilen: [
          ['Verteiler 12', '30.000 €', '5,5 t', '17', '45'],
          ['Solo 18', '42.000 €', '9,5 t', '18', '50'],
        ],
      } },
      { h: 'Klasse CE — Zugmaschinen' },
      { tab: {
        kopf: ['Fahrzeug', 'Preis', 'Nutzlast', 'Plätze', 'm³'],
        zeilen: [
          ['Fernverkehr 400', '52.000 €', '24 t', '33', '90'],
          ['Jumbo 40', '58.000 €', '24,5 t', '38', '120'],
          ['Thermo 40', '68.000 €', '21,5 t', '33', '82'],
          ['Schwerlast 620', '78.000 €', '27 t', '26', '70'],
        ],
      } },
      { p: 'Der Jumbo hat das meiste Volumen von allen — Motorwagen mit Anhänger und Durchladesystem. Der Thermo 40 hat das Kühlaggregat fest verbaut und braucht keine Nachrüstung.' },
      { h: 'Gebrauchtfahrzeuge' },
      { p: 'Rund 38 Prozent günstiger, mit 180.000 Kilometern auf der Uhr und deutlich höherem Pannenrisiko. Für den Einstieg oft die vernünftigere Wahl.' },
      { h: 'Ausstattung' },
      { list: [
        '❄️ Kühlaufbau, 9.000 € — nötig für Kühlgut, kostet acht Prozent Nutzlast.',
        '☢️ ADR-Ausrüstung, 4.500 € — nötig für Gefahrgut. Gefahrgut zahlt am besten.',
      ] },
      { tipp: 'Ausstattung lässt sich nur beim Kauf mitbestellen, nicht nachrüsten. Überleg dir vorher, welche Güter du fahren willst.' },
      { p: 'Die Fixkosten je Tag richten sich nach der Klasse: ein Kastenwagen kostet 250 €, ein Schwerlastzug 935 €. Ein großes Fahrzeug ohne Auslastung ist teuer.' },
      { ref: 'ladung' },
    ],
  },

  contracts: {
    titel: 'Verträge', icon: '📜', gruppe: 'Programme',
    inhalt: [
      { p: 'Hier laufen Marktlage, Ansehen und die Rahmenverträge zusammen.' },
      { h: 'Marktlage' },
      { p: 'Der Spotpreisindex schwankt täglich zwischen 78 und 132 Prozent. Bei knappem Laderaum ziehen die Preise an, bei Überkapazität fällt der Markt. Auf Vertragssendungen wirkt er nur zu 40 Prozent — das ist der Dieselfloater.' },
      { h: 'Ansehen' },
      { p: 'Wächst mit jeder Zustellung, mit erfüllten Verträgen und durch Ereignisse wie ein Kundenlob. Zwischen 5 und 100 hebt es alle Erlöse um zehn bis zwanzig Prozent und verbessert die Ausschreibungen.' },
      { p: 'Es kann auch fallen — ein Ruf lässt sich verspielen:' },
      { tab: {
        kopf: ['Anlass', 'Ansehen'],
        zeilen: [
          ['Vertrag unter der Mindestquote', '−3,5'],
          ['Vertrag nur teilweise erfüllt', '−1,2 (gegen +1 Prämie)'],
          ['Verhandlung überzogen', '−0,8'],
          ['Panne auf der Strecke', '−0,25'],
          ['Ein Tag ohne eine Zustellung', '−0,35'],
        ],
      } },
      { p: 'Kein einzelnes Ereignis reißt den Ruf ein, und unter fünf Punkte fällt niemand. Aber Untätigkeit zehrt: Wer nicht fährt, wird vergessen. An Sonn- und Feiertagen gilt das nicht.' },
      { tipp: 'Die Verhältnisse sind so gewählt, dass Arbeit schneller aufbaut als Nichtstun abträgt — sechs Zustellungen am Tag holen in zwölf Tagen auf, was neunundzwanzig Tage Stillstand kosten.' },
      { h: 'Rahmenverträge' },
      { p: 'Ein Verlader schreibt eine Relation über zwei bis sechs Wochen aus: feste Sendungszahl, fester Preis je Fahrt, Abschlussprämie. Der Satz liegt etwa zwölf Prozent unter dem Spotdurchschnitt.' },
      { h: 'Eine Relation, kein Ziel' },
      { p: 'Ein Rahmenvertrag verbindet zwei Orte: Beim Verlader wird geladen, beim Empfänger entladen. In der Ausschreibung steht beides mit einem Pfeil dazwischen, dazu die Entfernung je Fahrt.' },
      { p: 'Nimmst du eine Vertragssendung an, fährt das Fahrzeug zuerst zum Verlader und lädt, dann weiter zum Empfänger. Beide Wege kosten Diesel, bezahlt wird die Sendung als Ganzes. Nach der Zustellung steht das Fahrzeug beim Empfänger — für die nächste Sendung muss es wieder zum Verlader zurück.' },
      { p: 'Daher ist ein Vertrag ein Pendelverkehr, und die Kilometer summieren sich. Wer nur den Frachtsatz betrachtet, unterschätzt den Aufwand.' },
      { h: 'Was gefahren wird' },
      { p: 'Jede Ausschreibung nennt die Ware, die Menge in Paletten und das Gewicht — bei einem Rahmenvertrag ist jede Sendung gleich, der Verlader weiß ja, was er regelmäßig verschickt.' },
      { p: 'Darunter steht grün, welche eigenen Fahrzeuge dafür in Frage kommen. Passt keines, steht dort rot der Grund und welche Fahrzeugklasse mindestens nötig wäre, mit Preis. So lässt sich abwägen, ob sich der Vertrag samt Anschaffung lohnt.' },
      { p: 'Drei von vier Ausschreibungen sind auf den eigenen Fuhrpark zugeschnitten. Die vierte ist bewusst größer — ein Grund, über ein weiteres Fahrzeug nachzudenken.' },
      { tipp: 'Auch laufende Verträge zeigen ihre Ladung. Verkaufst du das einzige passende Fahrzeug, erscheint dort eine Warnung.' },
      { p: 'Erfüllst du den Vertrag vollständig, bringt die Prämie ihn deutlich über den Spotmarkt. Erfüllst du ihn zu mindestens sechzig Prozent, gibt es die halbe Prämie. Darunter gibt es keine — aber auch keine Strafe.' },
      { p: 'Solange ein Vertrag läuft, liegt immer eine seiner Sendungen in der Disposition, gekennzeichnet mit 📜.' },
      { tipp: 'Wie viele Verträge du gleichzeitig halten kannst, hängt an der Betriebsstufe.' },
      { ref: 'progress' },
    ],
  },

  daily: {
    titel: 'Tagesansicht', icon: '📅', gruppe: 'Programme',
    inhalt: [
      { p: 'Datum, Art des Tages und der Stand der Lenkzeiten aller Fahrer.' },
      { h: 'Fahrverbot' },
      { p: 'An Sonntagen und bundesweiten Feiertagen gilt von 0 bis 22 Uhr Fahrverbot. Schwere Fahrzeuge bleiben stehen, wo sie gerade sind — auch mitten auf der Strecke. Der Kurier 3.5 ist ausgenommen.' },
      { h: 'Lenk- und Ruhezeiten' },
      { tab: {
        kopf: ['Regel', 'Wert'],
        zeilen: [
          ['Lenkzeit am Stück', '4,5 Stunden'],
          ['danach Pause', '45 Minuten'],
          ['Tageslenkzeit', '9 Stunden'],
          ['danach Ruhezeit', '11 Stunden'],
        ],
      } },
      { h: 'Wo gehalten wird' },
      { p: 'Niemand hält auf der Autobahn. Ist die Lenkzeit um, steuert der Fahrer den nächsten LKW-Parkplatz auf der Strecke an — bis zu 45 Kilometer darf er dafür überziehen. Genau das erlaubt die Verordnung auch in der Wirklichkeit, um einen geeigneten Halteplatz zu erreichen.' },
      { p: 'Die Rastanlagen stammen aus den offenen Daten der Autobahn GmbH. Im Fuhrpark steht dann der Name des Platzes. Findet sich keiner in Reichweite, wird notgedrungen am Straßenrand gehalten.' },
      { p: 'Ein Fahrzeug, das lange genug steht, hat seine Ruhezeit ohnehin genommen — gerechnet wird über tatsächlichen Stillstand, nicht über Mitternacht.' },
      { p: 'Der Tagesbalken zeigt die verbrauchte Lenkzeit als Füllung, der rote Strich markiert die aktuelle Uhrzeit.' },
    ],
  },

  progress: {
    titel: 'Betriebsentwicklung', icon: '🏆', gruppe: 'Programme',
    inhalt: [
      { p: 'Sechs Stufen. Jede verlangt etwas Konkretes und gibt etwas frei, das vorher nicht ging. Nichts kann verloren gehen, es gibt keine Frist.' },
      { tab: {
        kopf: ['Stufe', 'Anforderung', 'Neu'],
        zeilen: [
          ['1 Einzelunternehmer', '—', 'Kurier, Verteiler'],
          ['2 Fuhrbetrieb', '12 Zustellungen, 2 LKW', 'Automatik'],
          ['3 Kleinspedition', '60 Zustellungen, 4 LKW, 1 Vertrag', 'Fernverkehr 400'],
          ['4 Spedition', '150 Zustellungen, 25.000 km, Ansehen 60', 'Schwerlast 620'],
          ['5 Regionalspediteur', '300 Zustellungen, 75.000 km', '5 Verträge'],
          ['6 Logistiker', '600 Zustellungen, 200.000 km', 'alles'],
        ],
      } },
      { p: 'Das Fenster zeigt jede Anforderung einzeln mit Fortschrittsbalken. Gesperrte Dinge sind überall sichtbar statt versteckt — im Handel steht die nötige Stufe an der Klasse.' },
    ],
  },

  industry: {
    titel: 'Branche', icon: '🏢', gruppe: 'Programme',
    inhalt: [
      { p: 'Vier befreundete Speditionen. Sie sind keine Konkurrenz: Sie nehmen dir keine Aufträge weg, unterbieten dich nicht und setzen dich unter keinen Zeitdruck.' },
      { p: 'Ihre Rolle ist die eines zusätzlichen Auftraggebers. Wie im echten Speditionsgewerbe geben sie eigene Fracht an Subunternehmer weiter. Solche Aufträge tragen in der Disposition das Zeichen 🤝.' },
      { h: 'Beziehungsstufen' },
      { tab: {
        kopf: ['Stufe', 'ab Fahrten', 'Aufschlag'],
        zeilen: [
          ['unbekannt', '0', '+5 %'],
          ['gelegentlich', '4', '+12 %'],
          ['fest im Boot', '12', '+20 %'],
          ['Haussubunternehmer', '28', '+30 %'],
        ],
      } },
      { p: 'Mit jeder Stufe fragen sie auch häufiger an.' },
    ],
  },

  finance: {
    titel: 'Kasse', icon: '💰', gruppe: 'Programme',
    inhalt: [
      { p: 'Jede Geldbewegung wird gebucht: Bereich, Text, Spieltag und Uhrzeit. Einnahmen grün, Ausgaben rot.' },
      { p: 'Der Kontostand steht am oberen Rand jedes Fensters, in dem Geld ausgegeben wird — Fahrzeughandel, Fuhrpark, Schulung, Verträge und hier. Daneben die Fixkosten je Tag, damit klar ist, was der Fuhrpark laufend verursacht.' },
      { h: 'Bereiche' },
      { list: [
        'Fracht, Vertragsfracht, Partnerfracht — die Erlöse.',
        'Diesel — nach tatsächlich gefahrenen Kilometern.',
        'Fixkosten — 550 € je Fahrzeug und Tag für Fahrer, Versicherung und Abschreibung.',
        'Werkstatt, Schulung, Fahrzeugkauf, Fahrzeugverkauf, Vertragsprämie, Sonstiges.',
      ] },
      { h: 'Was du hier lernst' },
      { p: 'Die Aufschlüsselung nach Bereichen zeigt, wo das Geld wirklich hingeht. Die häufigste Überraschung: Die Fixkosten laufen weiter, auch wenn ein Fahrzeug steht. Ein LKW ohne Auftrag kostet jeden Tag Geld.' },
      { tipp: 'Die Liste zeigt die letzten 300 Buchungen, die Bilanz oben rechnet über alle.' },
    ],
  },

  log: {
    titel: 'Betriebsbuch', icon: '📖', gruppe: 'Programme',
    inhalt: [
      { p: 'Das laufende Protokoll: Zustellungen, Pausen, Pannen, Ereignisse, Vertragsabschlüsse, Aufstiege. Neueste Einträge stehen oben.' },
      { p: 'Praktisch, um nachzuvollziehen, was in einer Abwesenheit passiert ist oder warum ein Fahrzeug steht.' },
    ],
  },

  settings: {
    titel: 'Einstellungen', icon: '⚙️', gruppe: 'Programme',
    inhalt: [
      { h: 'Betriebsuhr' },
      { p: 'Pause und die Stufen 1×, 2× und 4×. Die Leertaste schaltet zwischen Anhalten und Weiterlaufen.' },
      { h: 'Zeitverhältnis' },
      { p: 'Wie viele Spielminuten auf eine echte Minute kommen. Voreinstellung ist 1:30 — eine halbe Spielstunde je echter Minute, ein Spieltag dauert damit bei 1× etwa achtundvierzig Minuten.' },
      { p: 'Wer zusehen möchte, wie die Fahrzeuge rollen, wählt 1:3. Wer einen Betrieb über Wochen aufbauen will, nimmt 1:60. Die Häufigkeit von Ereignissen hängt an der Spielzeit, nicht am Takt — schnellere Einstellungen sind also kein Nachteil.' },

      { h: 'Benachrichtigungen' },
      { p: 'Meldungen des Browsers, die auch ankommen, wenn das Fenster im Hintergrund liegt. Im Vordergrund erscheinen sie nicht — dort genügen die Einblendungen unten rechts.' },
      { p: 'Für fertige Touren gibt es drei Möglichkeiten:' },
      { tab: {
        kopf: ['Einstellung', 'Bedeutung'],
        zeilen: [
          ['Bei jeder fertigen Tour', 'Jedes Mal, wenn ein Fahrzeug ankommt'],
          ['Stündlich, wenn nichts disponiert wurde', 'Einmal je Stunde, nur wenn in dieser Zeit keine neue Tour gestartet wurde'],
          ['Keine Benachrichtigungen', 'Nur die Einblendungen im Fenster'],
        ],
      } },
      { p: 'Die stündliche Erinnerung ist die ruhigere Wahl: Sie meldet sich nur, wenn tatsächlich Fahrzeuge unbeschäftigt herumstehen, und schweigt, solange du disponierst.' },
      { p: 'Unabhängig davon lassen sich Pannen, Vertragsabschlüsse und Aufstiege einzeln an- und abschalten.' },
      { tipp: 'Der Browser fragt nur auf einen Knopfdruck hin nach der Erlaubnis. Ohne sie bleibt es bei den Einblendungen im Fenster — es geht also nichts verloren.' },
      { p: 'Hat der Browser die Erlaubnis einmal abgelehnt, fragt er nicht erneut. Das lässt sich nur in den Browsereinstellungen ändern: in der Adressleiste auf das Schlosssymbol tippen, dann unter den Berechtigungen dieser Seite.' },
      { h: 'Wenn der Knopf nichts bewirkt' },
      { p: 'Das Spiel liegt auf github.io, und dort teilen sich alle Projekte eines Kontos dieselbe Adresse. Die Erlaubnis für Benachrichtigungen gilt deshalb nicht für dieses Spiel allein, sondern für alles unter dieser Adresse — und kann von einer anderen dort installierten App verwaltet werden. Der Browser fragt dann gar nicht erst.' },
      { p: 'Zwei Wege führen daran vorbei:' },
      { list: [
        'In den Browsereinstellungen unter Berechtigungen die Benachrichtigungen für diese Seite zurücksetzen, dann die Seite neu laden.',
        'Das Spiel über das Browsermenü zum Startbildschirm hinzufügen. Als eigene App bekommt es einen eigenen Eintrag in den Systemeinstellungen — und läuft nebenbei ohne Adressleiste.',
      ] },
      { tipp: 'Der zweite Weg ist der bessere: Als installierte App startet das Spiel schneller, füllt den Bildschirm und behält seine Benachrichtigungen für sich.' },
      { h: 'Hintergrund' },
      { p: 'Neun Voreinstellungen im Stil der Zeit, von Türkis über Karo bis Verlauf. Darunter lässt sich ein eigenes Bild wählen — es wird vor dem Speichern auf 1600 Bildpunkte verkleinert und liegt getrennt vom Spielstand im Browser.' },
      { p: 'Der Hintergrund gilt für die Arbeitsfläche. Im Fuhrpark bekommt jede Fahrzeugzeile denselben Hintergrund als eigene Fläche, mit einer hellen Ebene darüber, damit die Schrift lesbar bleibt.' },
      { h: 'Spielstand' },
      { p: 'Wird alle zwanzig Sekunden und beim Verlassen der Seite im Browser gesichert. Beim nächsten Öffnen wird die fehlende Zeit nachgerechnet, höchstens fünf Spieltage.' },
      { h: 'Datenquellen' },
      { p: 'Zeigt, woher Karte, Betriebe und Verkehrsmeldungen kommen und ob echte Daten oder die Ersatzliste in Gebrauch sind.' },
      { ref: 'abwesenheit' },
    ],
  },

  training: {
    titel: 'Schulung', icon: '🎓', gruppe: 'Programme',
    inhalt: [
      { p: 'Jeder Fahrer sammelt mit jeder Zustellung Erfahrung, längere Strecken bringen mehr. Bei jedem Stufenaufstieg gibt es einen Schulungspunkt.' },
      { tab: {
        kopf: ['Fertigkeit', 'Wirkung je Stufe'],
        zeilen: [
          ['⛽ Spritsparen', '−7 % Dieselverbrauch'],
          ['🗺️ Streckenkenntnis', '+5 km/h Schnitt'],
          ['🤝 Verhandlung', '+6 % Frachterlös'],
          ['🔧 Fahrzeugpflege', '−25 % Pannenrisiko'],
          ['🧘 Gelassenheit', '−15 % Stauzeitverlust'],
        ],
      } },
      { p: 'Vier Stufen je Fertigkeit, jede kostet einen Punkt und 3.000 € Kursgebühr.' },
      { p: 'Das <strong>◀</strong> in der Titelleiste führt zurück in den Fuhrpark. Haben mehrere Fahrer einen Punkt frei, schaltet <strong>nächster ▶</strong> unten direkt zum nächsten weiter — das spart den Umweg, wenn man mehrere nacheinander schult.' },
      { tipp: 'Verhandlung wirkt auf jede Fracht und rechnet sich am schnellsten. Spritsparen lohnt bei Fahrzeugen, die viele Kilometer machen.' },
    ],
  },

  fahrer: {
    titel: 'Fahrer und Eigenheiten', icon: '🧑‍✈️', gruppe: 'Grundlagen',
    inhalt: [
      { p: 'Jeder Fahrer bekommt beim Einstellen zwei Eigenheiten. Sie wirken auf die Arbeit, aber nie streng — ein Zug ist ein leichter Vorteil oder Nachteil, kein Hindernis.' },
      { tab: {
        kopf: ['Eigenheit', 'Wirkung'],
        zeilen: [
          ['🌅 Frühaufsteher', 'morgens schneller, abends langsamer'],
          ['🌙 Nachtfahrer', 'nachts deutlich schneller'],
          ['🛣️ Langstreckenfahrer', 'stark auf langen Läufen'],
          ['🏘️ Nahverkehrsprofi', 'schnell auf kurzen Strecken, flott an der Rampe'],
          ['🪙 Sparfuchs', 'weniger Diesel'],
          ['💨 Zügig unterwegs', 'schneller, aber durstiger'],
          ['🧰 Sorgsam', 'selten Pannen, gründlich an der Rampe'],
          ['💬 Redselig', 'braucht länger, bringt mehr Ansehen'],
          ['⏱️ Pünktlich', 'mehr Ansehen je Zustellung'],
          ['🧘 Die Ruhe selbst', 'lässt sich von Staus nicht bremsen'],
          ['📚 Lernwillig', 'steigt schneller auf'],
          ['🐢 Gemütlich', 'langsam, aber sparsam und zuverlässig'],
        ],
      } },
      { h: 'Schwächen' },
      { p: 'Jeder Mensch hat welche. Sie machen niemanden unbrauchbar, aber sie kosten.' },
      { tab: {
        kopf: ['Schwäche', 'Wirkung'],
        zeilen: [
          ['🐌 Trödelt', 'langsamer, länger an der Rampe'],
          ['⛽ Bleifuß', '18 % mehr Diesel, mehr Pannen'],
          ['💥 Unachtsam', 'deutlich häufiger in der Werkstatt'],
          ['😠 Mürrisch', 'kaum Ansehen je Zustellung'],
          ['🧭 Verfährt sich', 'Umwege kosten Zeit und Diesel'],
          ['😰 Hektisch', 'verliert im Stau überdurchschnittlich'],
          ['🛋️ Dienst nach Vorschrift', 'lernt langsam, trödelt an der Rampe'],
          ['💸 Fordernd', '35 % höherer Lohn'],
        ],
      } },
      { p: 'Widersprüchliche Züge kommen nie zusammen vor — niemand ist gleichzeitig Frühaufsteher und Nachtfahrer oder sorgsam und unachtsam.' },
      { tipp: 'Setze Nachtfahrer auf lange Läufe und Nahverkehrsprofis auf Touren mit vielen Stopps. Die Eigenheiten stehen im Fuhrpark unter jedem Fahrer.' },
      { ref: 'training' },
    ],
  },

  goals: {
    titel: 'Rücklage und Anschaffungen', icon: '🎯', gruppe: 'Programme',
    inhalt: [
      { p: 'Große Anschaffungen, auf die man über Wochen hinspart. Zurückgelegtes Geld ist nicht weg — es lässt sich jederzeit wieder entnehmen.' },
      { tab: {
        kopf: ['Anschaffung', 'Preis', 'Wirkung'],
        zeilen: [
          ['⛽ Betriebstankstelle', '45.000 €', 'Diesel −12 %'],
          ['🏭 Eigene Halle', '60.000 €', 'Fixkosten −8 %'],
          ['🏢 Disposition mit Personal', '75.000 €', 'mehr Anfragen, bessere Sätze'],
          ['🔧 Eigene Werkstatt', '95.000 €', 'Rechnungen −40 %, halbe Standzeit'],
          ['📍 Zweites Depot', '180.000 €', 'für eine spätere Fassung vorgemerkt'],
        ],
      } },
      { p: 'Jede Anschaffung braucht eine bestimmte Betriebsstufe. Ist die Rücklage voll, wird gebaut — die Wirkung gilt dann dauerhaft.' },
    ],
  },

  chronik: {
    titel: 'Chronik', icon: '🏅', gruppe: 'Programme',
    inhalt: [
      { p: 'Die eigene Geschichte: Bestwerte, Stammkundschaft und der Jahreslauf des Marktes.' },
      { h: 'Bestwerte' },
      { p: 'Längste Tour, wertvollste Fracht, bester Tag, beste Woche, größte Einzelsendung. Kein Wettbewerb gegen andere — nur die eigenen Zahlen, die man überbieten kann.' },
      { h: 'Stammkundschaft' },
      { p: 'Ein Betrieb, den man oft beliefert, zahlt besser. Vier Stufen von „neu" bis „Hauskunde" nach 18 Fahrten, dann 24 Prozent Aufschlag auf jede Fracht dorthin. Die Beziehung kann nicht abkühlen.' },
      { h: 'Jahreslauf' },
      { p: 'Die Nachfrage schwankt über das Jahr. Der November mit dem Weihnachtsgeschäft zahlt 22 Prozent über dem Schnitt, der Januar 12 Prozent darunter. Im Sommer läuft die Bausaison, im Juli sind Werksferien.' },
      { p: 'Die Säulen zeigen den Preisverlauf, der dunkle Balken ist der laufende Monat.' },
    ],
  },

  kunden: {
    titel: 'Auftraggeber', icon: '🏢', gruppe: 'Grundlagen',
    inhalt: [
      { p: 'Ein Verlader ist nicht immer gleich. Er hat einen Charakter, der sich nie ändert, eine Tagesform, die schwankt, und ein Gedächtnis für das, was man ihm angetan hat.' },
      { h: 'Charakter' },
      { p: 'Fest je Betrieb — derselbe Kunde verhält sich immer gleich.' },
      { tab: {
        kopf: ['Charakter', 'Eigenart'],
        zeilen: [
          ['🧮 Nüchterner Kaufmann', 'wenig Spielraum, aber verlässlich'],
          ['🎩 Großzügig', 'zahlt lieber mehr als zu feilschen'],
          ['🔍 Kleinlich', 'feilscht um jeden Euro, nimmt es persönlich'],
          ['⏱️ Immer in Eile', 'zahlt für Schnelligkeit, hat Launen'],
          ['🤝 Beständig', 'bleibt bei einem bewährten Spediteur'],
          ['🧐 Misstrauisch', 'prüft lange, dann ist es leicht'],
        ],
      } },
      { h: 'Was gerade los ist' },
      { p: 'Betriebe haben eigene Umstände, die einige Tage anhalten:' },
      { tab: {
        kopf: ['Zustand', 'Folge'],
        zeilen: [
          ['🏖️ Betriebsferien', 'keine Anfragen, 5 bis 12 Tage'],
          ['📋 Inventur', 'keine Anfragen, 2 bis 4 Tage'],
          ['🤒 Disponent krank', 'die Vertretung zahlt keinen Cent mehr'],
          ['📉 Auftragsflaute', 'seltener und knapper'],
          ['📈 Hochbetrieb', 'häufiger, und der Preis zählt weniger'],
          ['😤 Verstimmt', 'nach einer überzogenen Verhandlung'],
          ['🚫 Keine Zusammenarbeit', 'vergibt vorerst gar nichts mehr'],
        ],
      } },
      { p: 'In der Auftragsliste steht das über der Sendung, im Verhandlungsfenster ausführlich. Wer einen Hochbetrieb erkennt, kann dort mehr fordern als sonst.' },
      { h: 'Verhandlungen haben ein Nachspiel' },
      { p: 'Bricht ein Verlader die Verhandlung ab, weil du überzogen hast, merkt er es sich. Beim ersten Mal ist es ein Ärgernis, nach mehreren Malen bricht er die Zusammenarbeit ab — dann kommt für zwei bis fünf Wochen nichts mehr von dort.' },
      { p: 'Wie schnell das geht, hängt am Charakter: Beim Kleinlichen ist nach drei Abbrüchen Schluss, beim Beständigen erst nach sieben.' },
      { p: 'Umgekehrt besänftigt jede ordentlich abgewickelte Fahrt. Der Groll verfliegt auch von allein, nur langsam. Eine Sackgasse gibt es nicht — aber es dauert.' },
      { tipp: 'Verhandeln lohnt sich, gerade bei Kunden, die man selten braucht. Bei den wenigen, von denen der Betrieb lebt, ist Zurückhaltung klüger.' },
      { ref: 'contracts' },
    ],
  },

  ladung: {
    titel: 'Ladung und Güterklassen', icon: '📦', gruppe: 'Grundlagen',
    inhalt: [
      { p: 'Jede Sendung hat eine Güterklasse nach dem Güterverzeichnis für die Verkehrsstatistik, eine Menge in Europaletten und ein Gewicht.' },
      { p: 'Entscheidend ist die Dichte: Sie bestimmt, ob eine Ladung am Platz oder am Gewicht scheitert.' },
      { tab: {
        kopf: ['Klasse', 'kg je Palette', 'im Sattelzug'],
        zeilen: [
          ['🛋️ Möbel und Konsumgüter', '250', '33 Paletten, Platz zuerst voll'],
          ['📦 Stückgut', '400', '33 Paletten'],
          ['🥫 Nahrungsmittel', '600', '33 Paletten'],
          ['⚗️ Chemische Erzeugnisse', '800', '30 Paletten'],
          ['🧱 Baustoffe', '1.200', '20 Paletten, Gewicht bremst'],
          ['🪨 Erze, Steine, Erden', '1.500', '16 Paletten'],
        ],
      } },
      { h: 'Besondere Güter' },
      { list: [
        '🧊 Kühlgut braucht einen Kühlaufbau und zahlt 40 % mehr.',
        '☢️ Gefahrgut nach ADR braucht die ADR-Ausrüstung und zahlt 55 % mehr.',
      ] },
      { p: 'Umschlagpunkte — Frachtflughäfen, Häfen und Güterbahnhöfe — zahlen zusätzlich 13 bis 30 Prozent Zuschlag, weil die Ladung terminiert ist.' },
    ],
  },

  abwesenheit: {
    titel: 'Wenn du nicht da bist', icon: '💾', gruppe: 'Grundlagen',
    inhalt: [
      { p: 'Ein Browser kann im Hintergrund nicht dauerhaft weiterrechnen. Deshalb läuft nichts weiter, sondern wird beim nächsten Öffnen nachgerechnet.' },
      { p: 'Aus der vergangenen echten Zeit ergibt sich über das Zeitverhältnis die fehlende Spielzeit. Danach zeigt ein Bericht, was passiert ist und was jetzt eine Entscheidung braucht.' },
      { h: 'Grenzen' },
      { list: [
        'Höchstens fünf Spieltage werden aufgeholt.',
        'War die Uhr beim Verlassen angehalten, ruht auch der Betrieb.',
        'Nur Fahrzeuge auf Automatik fahren weiter. Alles andere steht nach der laufenden Fahrt am Zielort.',
      ] },
      { tipp: 'Vor dem Schließen lohnt ein Blick in den Fuhrpark: Steht überall das Häkchen bei Automatik?' },
    ],
  },

  geld: {
    titel: 'Wirtschaftlich fahren', icon: '💡', gruppe: 'Grundlagen',
    inhalt: [
      { p: 'Ein Fahrzeug kostet 550 € am Tag, ob es fährt oder nicht, dazu etwa 0,55 € je Kilometer Diesel. Es muss also täglich ungefähr 750 € einfahren, um sich zu tragen.' },
      { h: 'Die drei Hebel' },
      { list: [
        'Leerkilometer vermeiden. Ein Fahrzeug bleibt am Ziel stehen — nimm den nächsten Auftrag von dort, statt leer heimzufahren.',
        'Auslasten. Eine halbleere Fahrt kostet fast dasselbe wie eine volle. Mehrere Sendungen zusammenlegen.',
        'Rampenzeit sparen. Jede Zustellung kostet eine Stunde, bei Mehrstopp-Touren nur 33 Minuten je Stopp.',
      ] },
      { h: 'Woran man es merkt' },
      { p: 'Wenn die Kasse trotz vieler Fahrten kaum wächst, sind meist zu viele kurze Einzelfahrten dabei. Längere Touren mit voller Ladung bringen bei gleicher Zeit deutlich mehr.' },
      { ref: 'finance' },
    ],
  },

  fenster: {
    titel: 'Fenster und Bedienung', icon: '🪟', gruppe: 'Grundlagen',
    inhalt: [
      { p: 'Programme öffnest du über die Symbole auf der Arbeitsfläche oder das Startmenü.' },
      { list: [
        'Fenster lassen sich an der Titelleiste ziehen und an der rechten unteren Ecke in der Größe ändern.',
        'Ein Doppeltipp auf die Titelleiste schaltet auf Vollbild.',
        'Das ? in der Titelleiste öffnet die Hilfe zum jeweiligen Programm.',
        'Das ◀ links daneben führt zurück zu dem Fenster, aus dem heraus geöffnet wurde. Es erscheint nur, wenn es einen Rückweg gibt.',
        'Die Taskleiste zeigt alles Offene, jeder Eintrag hat ein eigenes ✕ zum Schließen.',
        'Im Startmenü unten: 🏠 zurück zum Hauptmenü, ⏻ herunterfahren. Beides sichert den Betrieb vorher.',
      ] },
      { p: 'Auf schmalen Bildschirmen öffnen Fenster grundsätzlich bildfüllend, und die Taskleiste dient zum Umschalten.' },
      { h: 'Beenden' },
      { p: '<strong>Zurück zum Hauptmenü</strong> sichert den Betrieb und bringt dich zur Startseite — von dort lässt er sich fortsetzen oder ein neuer gründen.' },
      { p: '<strong>Herunterfahren</strong> sichert ebenfalls und zeigt einen Schlussbildschirm. Ein Browserfenster lässt sich von innen meist nicht schließen; deshalb bleibt ein „Sie können den Rechner jetzt ausschalten" stehen, wie man es von früher kennt.' },
      { tipp: 'Beides fragt vorher nach. Der Betrieb wird ohnehin alle zwanzig Sekunden gesichert — verlorengehen kann er nicht.' },
    ],
  },
};

export const GRUPPEN = ['Grundlagen', 'Programme'];

/* Welches Programm welche Hilfeseite hat */
export const HELP_FOR_APP = {
  dispo: 'dispo', fleet: 'fleet', dealer: 'dealer', contracts: 'contracts',
  daily: 'daily', progress: 'progress', industry: 'industry',
  finance: 'finance', log: 'log', settings: 'settings', training: 'training',
  report: 'abwesenheit', tutorial: 'start', help: 'fenster',
  goals: 'goals', chronik: 'chronik', week: 'chronik', staff: 'staff',
};
