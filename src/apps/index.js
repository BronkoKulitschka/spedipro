/* Alle Programme des Desktops. Reihenfolge bestimmt Startmenü und Symbole. */

import { MapApp }      from './map.js';
import { DispoApp }    from './dispo.js';
import { FleetApp }    from './fleet.js';
import { FinanceApp }  from './finance.js';
import { LogApp }      from './logbook.js';
import { SettingsApp } from './settings.js';
import { TrainingApp } from './training.js';
import { ReportApp }   from './report.js';
import { DealerApp }   from './dealer.js';

export const APPS = Object.fromEntries(
  [MapApp, DispoApp, FleetApp, FinanceApp, LogApp, SettingsApp, TrainingApp, ReportApp, DealerApp]
    .map(app => [app.id, app]));

export const DESKTOP_APPS = Object.values(APPS).filter(a => a.desktop);
