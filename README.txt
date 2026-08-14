DART SCORE v19 – SEASONS + 3440×1440 DISPLAY PROFILE

BYTT DISSE FILENE I GITHUB:
- app.js
- index.html
- style-ultrawide.css
- service-worker.js

Ikke endre api/state.js, package.json eller Neon-oppsettet.

NYTT I V19
1. Skjermvalg under Innstillinger:
   - Automatisk / responsiv
   - 3440 × 1440 ekstern skjerm
   - 1920 × 1200 nettbrett

3440-modusen bruker en ekte virtuell 3440×1440 flate som skaleres til nettleservinduet.
Dette gjør at modusen fungerer selv om nettbrettet rapporterer f.eks. 1720×720 CSS-piksler på en fysisk 3440×1440-skjerm.
Skjermvalget lagres bare lokalt på enheten.

2. Sesonger:
   - Aktiv sesong vises i Historikk.
   - "Avslutt sesong" arkiverer hele sesongen.
   - Tidligere sesonger blir liggende i sesongvelgeren.
   - "Start ny sesong" nullstiller sesongstatistikk, men beholder spillernavn, innstillinger og alle tidligere sesonger.
   - Du kan ikke starte en ny kamp når sesongen er avsluttet.
   - Sesonger synkroniseres til Neon via eksisterende app_state.

MIGRERING
Eksisterende v17/v18-state får automatisk:
- sesongnavn "Sesong <år>"
- seasonActive = true
- tom liste over tidligere sesonger
Ingen eksisterende statistikk slettes.

ETTER UPLOAD
1. Vent til Vercel er Ready.
2. Åpne appen.
3. Ctrl+F5.
4. Gå til Innstillinger og velg "3440 × 1440 ekstern skjerm".
5. Test Historikk > Avslutt sesong > Start ny sesong på testdata før ordinær bruk.
