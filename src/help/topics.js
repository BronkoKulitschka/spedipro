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
        '✈️ ⚓ 🚉 Umschlagpunkte im ganzen Bundesgebiet.',
        '🚧 gemeldete Baustellen und Verkehrsmeldungen.',
      ] },
      { p: 'Deutschland legt den Ausschnitt über alles Wesentliche, Depot holt dich zurück. Ein Klick auf ein Fahrzeug zeigt seine Daten als Kurzfassung.' },
      { ref: 'ladung' },
    ],
  },

  fleet: {
    titel: 'Fuhrpark', icon: '🚛', gruppe: 'Programme',
    inhalt: [
      { p: 'Der Zustand aller Fahrzeuge auf einen Blick: wo sie stehen, was sie geladen haben, wie weit die Fahrer sind.' },
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
      { p: 'Vier Fahrzeugklassen. Die Frage ist nicht, welche die beste ist, sondern welche zu den Strecken passt, die du fährst.' },
      { tab: {
        kopf: ['Klasse', 'Preis', 'Nutzlast', 'Plätze', 'Diesel'],
        zeilen: [
          ['Kurier 3.5', '12.000 €', '1,2 t', '4', 'sehr sparsam'],
          ['Verteiler 12', '20.000 €', '5,5 t', '17', 'normal'],
          ['Fernverkehr 400', '34.000 €', '24 t', '33', 'hoch'],
          ['Schwerlast 620', '52.000 €', '27 t', '26', 'sehr hoch'],
        ],
      } },
      { h: 'Worauf es ankommt' },
      { list: [
        'Der Kurier ist als Fahrzeug unter 7,5 Tonnen vom Sonntagsfahrverbot ausgenommen. Er fährt, wenn alle anderen stehen.',
        'Der Verteiler ist der Allrounder für die Region.',
        'Der Fernverkehr trägt eine Komplettladung und hält den Schnitt auf langen Läufen.',
        'Der Schwerlastzug trägt am meisten Gewicht, hat aber weniger Stellplätze und den höchsten Verbrauch.',
      ] },
      { h: 'Gebrauchtfahrzeuge' },
      { p: 'Rund 38 Prozent günstiger, mit 180.000 Kilometern auf der Uhr und deutlich höherem Pannenrisiko. Für den Einstieg oft die vernünftigere Wahl.' },
      { h: 'Ausstattung' },
      { list: [
        '❄️ Kühlaufbau, 9.000 € — nötig für Kühlgut, kostet acht Prozent Nutzlast.',
        '☢️ ADR-Ausrüstung, 4.500 € — nötig für Gefahrgut. Gefahrgut zahlt am besten.',
      ] },
      { tipp: 'Ausstattung lässt sich nur beim Kauf mitbestellen, nicht nachrüsten. Überleg dir vorher, welche Güter du fahren willst.' },
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
      { p: 'Die Pause wird unterwegs eingelegt, der Zug steht dann auf der Strecke. Ein Fahrzeug, das lange genug steht, hat seine Ruhezeit ohnehin genommen — gerechnet wird über tatsächlichen Stillstand, nicht über Mitternacht.' },
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
      { p: 'Der Hintergrund gilt für die Arbeitsfläche und scheint gedämpft im Fuhrpark durch.' },
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
};
