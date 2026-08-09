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
      { p: 'Jede Anfrage zeigt deshalb in eigener Zeile, wie weit sie vom gewählten Fahrzeug entfernt ist und wie lange die Fahrt dauert. Die Fahrzeit rechnet mit dem Schnitt dieses Fahrzeugs, also einschließlich der Streckenkenntnis des Fahrers.' },
      { p: 'Die Liste ist nach Anfahrt sortiert, das Nächstgelegene steht oben. Wechselst du das Fahrzeug, ordnet sie sich neu — ein Auftrag, der für den einen weit weg ist, liegt für den anderen um die Ecke.' },
      { p: 'Die Lupe daneben springt zum Fahrzeug und klappt seine Daten auf.' },
      { h: 'Aufträge annehmen' },
      { list: [
        'sofort — schickt das Fahrzeug mit dieser einen Sendung los.',
        '+ laden — legt die Sendung auf die Ladeliste, um mehrere zusammen zu fahren.',
        'Ein Klick auf die Kachel selbst zeigt das Ziel auf der Karte.',
      ] },
      { p: 'Passt eine Sendung nicht auf das gewählte Fahrzeug, steht der Grund an Stelle der Knöpfe: zu viele Stellplätze, zu schwer, oder eine fehlende Ausstattung.' },
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
      { p: 'Der Zustand aller Fahrzeuge auf einen Blick: wo sie stehen, was sie geladen haben, wie weit die Fahrer sind.' },
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
        'ins Depot — schickt ein stehendes Fahrzeug leer zurück. Kostet Diesel und bringt nichts ein, lohnt sich nur, wenn in der Gegend nichts zu holen ist.',
        'zeigen — öffnet die Disposition und zoomt zum Fahrzeug.',
        'Schulung — öffnet das Schulungsfenster des Fahrers.',
        'verkaufen — der Wiederverkaufswert sinkt mit den gefahrenen Kilometern.',
      ] },
      { h: 'Automatik' },
      { p: 'Ein Fahrzeug auf Automatik sucht sich selbst Aufträge und lädt zusammen, was zusammenpasst. Das ist die Voraussetzung dafür, dass in deiner Abwesenheit weitergefahren wird. Die Automatik wird mit Betriebsstufe 2 frei.' },
      { ref: 'progress' },
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
      { p: 'Wächst mit jeder Zustellung, mit erfüllten Verträgen und durch Ereignisse wie ein Kundenlob. Es sinkt nie. Zwischen 0 und 100 hebt es alle Erlöse um zehn bis zwanzig Prozent und verbessert die Ausschreibungen.' },
      { h: 'Rahmenverträge' },
      { p: 'Ein Verlader schreibt eine Relation über zwei bis sechs Wochen aus: feste Sendungszahl, fester Preis je Fahrt, Abschlussprämie. Der Satz liegt etwa zwölf Prozent unter dem Spotdurchschnitt.' },
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
      { p: 'Wie viele Spielminuten auf eine echte Minute kommen. Voreinstellung ist 1:3 — eine echte Minute sind drei Spielminuten, ein Spieltag dauert bei 1× rund acht Stunden.' },
      { p: 'Für einen Abend am Stück eignet sich 1:30 oder 1:60. Die Häufigkeit von Ereignissen hängt an der Spielzeit, nicht am Takt — schnellere Einstellungen sind also kein Nachteil.' },
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
      { p: 'Widersprüchliche Züge kommen nie zusammen vor — niemand ist gleichzeitig Frühaufsteher und Nachtfahrer.' },
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
        'Die Taskleiste zeigt alles Offene, jeder Eintrag hat ein eigenes ✕ zum Schließen.',
      ] },
      { p: 'Auf schmalen Bildschirmen öffnen Fenster grundsätzlich bildfüllend, und die Taskleiste dient zum Umschalten.' },
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
  goals: 'goals', chronik: 'chronik', week: 'chronik',
};
