# Implementation Plan (SPEC-1)

Šis planas detalizuoja SPEC-1 įgyvendinimo etapus ir sugrupuoja darbus į aiškius 0.5–1 dienos žingsnius su atsakingais vaidmenimis.

## 1 etapas – Projekto scaffolding
- **Priklausomybės:** tik paruošta darbo aplinka (Node.js ≥20, pnpm ≥9).
- **Atsakingas vaidmuo:** Frontend platformos inžinierius.

### Užduotys (~0.5–1 d.)
1. Inicializuoti Vite + React + TypeScript projektą, sukonfigūruoti `pnpm`, `.editorconfig`, bazinę aplinką (`src/app`).
2. Įtraukti pagrindines priklausomybes (`dexie`, `zod`, `@tanstack/react-table`, `chart.js`, `date-fns`, `@paralleldrive/cuid2`) ir `eslint` konfigūraciją; nustatyti bendrą `tsconfig` ir aliasus.
3. Sukonfigūruoti pagrindinę `App.tsx` struktūrą su tabų perjungimu (Log/Budgets/Reports/Settings) ir `Layout` skeletu `src/app`/`src/components` kataloguose.
4. Parengti `pnpm` skriptus (`dev`, `build`, `lint`) ir CI stubą (GitHub Actions ar pnpm scriptas) baziniam lint/test paleidimui.

### Definition of Done
- Projektas startuoja su `pnpm dev`, `pnpm build` veikia be klaidų.
- Lint įrankiai (`pnpm lint`) veikia ir grąžina švarų rezultatą.
- Bazinė tabų navigacija `App.tsx` rodo placeholder turinį kiekvienam puslapiui.
- Dokumentuoti starto instrukcijas `README.md` papildyme.

## 2 etapas – Duomenų sluoksnis (Dexie + domeno logika)
- **Priklausomybės:** 1 etapas.
- **Atsakingas vaidmuo:** Frontend duomenų inžinierius.

### Užduotys (~0.5–1 d.)
1. Aprašyti Dexie schemą ir tipizuotą adapterį `ExpenseDB` kataloge [`src/db`](src/db/) (`db.ts`) kartu su seed funkcija (`seeds.ts`).
2. Implementuoti Zod schemas ir tipų eksportus [`src/domain`](src/domain/) (`schemas.ts`, `types.ts`) bei biudžeto skaičiavimus (`budget.ts`).
3. Sukurti CRUD ir užklausų paslaugas [`src/services`](src/services/) (`expense.ts`, `budget.ts`, `report.ts`, `category.ts`, `backup.ts`) su vienetinių testų stubais.
4. Įdiegti pagalbinius įrankius [`src/utils`](src/utils/) (`dates.ts`, `money.ts`) ir hooks (`useBudgetBadges.ts`) su tipais.
5. Patikrinti duomenų sluoksnio funkcijas naudojant vienetinius testus `vitest` ar `jest` aplinkoje.

### Definition of Done
- `Dexie` schema registruoja visas lenteles ir indeksus pagal SPEC-1.
- Zod validacijos gaudo neteisingus įrašus (testai dengia reikalingas ribas).
- Paslaugų sluoksnis grąžina laukiamas struktūras (CRUD + ataskaitų užklausos) ir perduoda klaidas.
- Sėklų funkcija užpildo pradinius duomenis ir kviečiama `App.tsx` paleidime.
- Automatiniai testai (`pnpm test`) patvirtina domeno logikos veikimą.

## 3 etapas – UI puslapiai ir komponentai
- **Priklausomybės:** 2 etapas (Dexie schema ir paslaugos turi būti baigti prieš UI komponentus).
- **Atsakingi vaidmenys:** UI inžinierius (React), UX/UI dizaineris (kopija, išdėstymas).

### Užduotys (~0.5–1 d.)
1. Sukurti `Layout`, `Money`, `MonthPicker`, `ConfirmDialog` komponentus [`src/components`](src/components/) ir stiliaus bazę (`theme.css`).
2. Įgyvendinti Log puslapį [`src/pages/Log`](src/pages/Log/) (QuickAddForm, LogTable) su klaviatūriniu įvedimu, filtravimu ir undo veiksmu.
3. Įgyvendinti Budgets puslapį [`src/pages/Budgets`](src/pages/Budgets/) su kategorijų limitų valdymu, carry-over nustatymais ir įspėjimų ženkliukais.
4. Įgyvendinti Reports puslapį [`src/pages/Reports`](src/pages/Reports/) su Chart.js diagramomis (biudžetas vs faktas, išlaidos pagal kategoriją, mėnesinis trendas).
5. Įgyvendinti Settings puslapį [`src/pages/Settings`](src/pages/Settings/) su JSON eksportu/importu, duomenų išvalymu, kategorijų tvarkymu.
6. Atlikti UX rašymo peržiūrą (kopija, tuščių būsenų tekstai) ir prieinamumo (a11y) greitą auditą.

### Definition of Done
- Visi puslapiai rodo duomenis iš Dexie per paslaugų sluoksnį; nėra mock duomenų.
- UI reaguoja į vartotojo veiksmus (pridėjimas, trynimas, importas) be klaidų konsolėje.
- Chart.js diagramoms pritaikyti spalviniai ir tipografiniai sprendimai laikantis `design-guidelines.md`.
- Pasiekiamumo testai (keyboard focus, aria label) praeina rankinę peržiūrą.
- UX tekstai suderinti su dizaineriu ir atnaujinti `COPY.md` (jei yra) ar atitinkamuose komponentuose.

## 4 etapas – QA ir išleidimo pasirengimas
- **Priklausomybės:** 1–3 etapai užbaigti.
- **Atsakingi vaidmenys:** QA inžinierius, DevOps inžinierius.

### Užduotys (~0.5–1 d.)
1. Parengti testų rinkinius: vienetiniai (`pnpm test`), integraciniai (pvz., Playwright) ir regresijos scenarijai (scenarijų sąrašas `tests/` kataloge).
2. Įdiegti automatinį lint + test paleidimą CI (GitHub Actions arba alternatyva) ir pridėti badge į `README.md`.
3. Atlikti naršyklių suderinamumo patikrą (Chromium, Firefox) su IndexedDB funkcijomis ir PWA cache (jei įgalinta).
4. Parengti išleidimo kontrolinį sąrašą (`RELEASING.md` praplėtimas) ir atlikti bandomąjį JSON backup/import ciklą.
5. Surengti QA peržiūrą: testų ataskaita, kritinių klaidų fiksavimas, jų išsprendimas ir regresijos patvirtinimas.

### Definition of Done
- Visi automatiniai testai praeina lokaliai ir CI.
- Dokumentuotas testavimo scenarijų sąrašas bei žinomos ribos (`tests/README.md`).
- QA peržiūra patvirtino funkcionalumą, nėra blokinių defektų.
- Išleidimo instrukcijos atnaujintos, JSON backup/importas veikia realiai.
- Projekto statusas „release candidate“ pažymėtas CHANGELOG įrašu.
