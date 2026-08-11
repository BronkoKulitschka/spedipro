/* Alle Programme des Desktops. Reihenfolge bestimmt Startmenü und Symbole. */

import { DispoApp }    from './dispo.js';
import { FleetApp }    from './fleet.js';
import { FinanceApp }  from './finance.js';
import { LogApp }      from './logbook.js';
import { SettingsApp } from './settings.js';
import { TrainingApp } from './training.js';
import { ReportApp }   from './report.js';
import { DealerApp }   from './dealer.js';
import { DailyApp }     from './daily.js';
import { ContractsApp } from './contracts.js';
import { IndustryApp }  from './industry.js';
import { ProgressApp }  from './progress.js';
import { HelpApp }      from './help.js';
import { TutorialApp }  from './tutorial.js';
import { GoalsApp }     from './goals.js';
import { ChronikApp }   from './chronik.js';
import { WeekApp }      from './week.js';
import { StaffApp }     from './staff.js';

export const APPS = Object.fromEntries(
  [DispoApp, ContractsApp, FleetApp, DailyApp, ProgressApp, IndustryApp, FinanceApp, LogApp, StaffApp, GoalsApp, ChronikApp, SettingsApp, HelpApp,
   TrainingApp, ReportApp, DealerApp, TutorialApp, WeekApp]
    .map(app => [app.id, app]));

export const DESKTOP_APPS = Object.values(APPS).filter(a => a.desktop);
