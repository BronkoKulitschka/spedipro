/* Kalender: echtes Datum, Wochentage, gesetzliche Feiertage.

   Die Spielzeit zählt Minuten seit Betriebsbeginn. Daraus ergibt sich ein
   echtes Datum, und damit lassen sich Wochenenden und Feiertage sauber
   bestimmen. Gerechnet wird durchgehend in UTC, damit keine Zeitzonen-
   verschiebungen hineinspielen. */

/* Betriebsbeginn: Montag, 3. August 2026, 06:00 */
export const START = Date.UTC(2026, 7, 3);

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
                    'Donnerstag', 'Freitag', 'Samstag'];
const KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
                'August', 'September', 'Oktober', 'November', 'Dezember'];
const MON_KURZ = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export const dateOf = minutes => new Date(START + minutes * 60000);

/* Ostersonntag nach der Formel von Gauß und Meeus */
function ostern(jahr) {
  const a = jahr % 19, b = Math.floor(jahr / 100), c = jahr % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31);
  const tag = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(jahr, monat - 1, tag);
}

const TAG = 86400000;
const cache = new Map();

/* Bundesweite Feiertage. Landesrecht bleibt außen vor. */
function feiertageIm(jahr) {
  if (cache.has(jahr)) return cache.get(jahr);

  const o = ostern(jahr);
  const liste = new Map([
    [Date.UTC(jahr, 0, 1),   'Neujahr'],
    [o - 2 * TAG,            'Karfreitag'],
    [o + 1 * TAG,            'Ostermontag'],
    [Date.UTC(jahr, 4, 1),   'Tag der Arbeit'],
    [o + 39 * TAG,           'Christi Himmelfahrt'],
    [o + 50 * TAG,           'Pfingstmontag'],
    [Date.UTC(jahr, 9, 3),   'Tag der Deutschen Einheit'],
    [Date.UTC(jahr, 11, 25), 'Erster Weihnachtstag'],
    [Date.UTC(jahr, 11, 26), 'Zweiter Weihnachtstag'],
  ]);

  cache.set(jahr, liste);
  return liste;
}

export function holidayName(date) {
  const key = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return feiertageIm(date.getUTCFullYear()).get(key) || null;
}

export const isSunday  = date => date.getUTCDay() === 0;
export const isSaturday = date => date.getUTCDay() === 6;
export const isWeekend = date => isSunday(date) || isSaturday(date);
export const isHoliday = date => holidayName(date) !== null;

/* Sonn- und Feiertagsfahrverbot gilt in Deutschland von 0 bis 22 Uhr. */
export function drivingBan(date) {
  const grund = isSunday(date) ? 'Sonntag' : holidayName(date);
  if (!grund) return null;
  return date.getUTCHours() < 22 ? grund : null;
}

/* ── Anzeige ── */
export const weekday      = date => WOCHENTAGE[date.getUTCDay()];
export const weekdayShort = date => KURZ[date.getUTCDay()];

export const dateShort = date =>
  `${weekdayShort(date)}, ${date.getUTCDate()}. ${MON_KURZ[date.getUTCMonth()]}`;

export const dateLong = date =>
  `${weekday(date)}, ${date.getUTCDate()}. ${MONATE[date.getUTCMonth()]} ${date.getUTCFullYear()}`;

export const timeText = date =>
  `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
