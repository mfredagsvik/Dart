# DART SCORE v17 – Vercel + Supabase + 3440×1440

Denne pakken er et tillegg til dagens `mfredagsvik/Dart` v16. Spillmotoren beholdes, mens permanent lagring flyttes til Supabase/Postgres via et Vercel API.

## 1. Kopier disse filene inn i repoet

- `cloud-init.js`
- `style-ultrawide.css`
- `vercel.json`
- `api/state.js`
- `supabase/schema.sql`

## 2. Endre `index.html`

I `<head>`, rett etter eksisterende `style.css`:

```html
<link rel="stylesheet" href="style-ultrawide.css">
```

Bytt nederste script-linje:

```html
<script src="roasts.js"></script><script src="app.js"></script>
```

med:

```html
<script src="cloud-init.js"></script>
```

## 3. Opprett Supabase

Opprett et Supabase-prosjekt og kjør innholdet i `supabase/schema.sql` i SQL Editor.

## 4. Vercel Environment Variables

Legg inn:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DART_SYNC_KEY` – lag en lang, privat nøkkel du velger selv

Service role key ligger kun i Vercel API-et og sendes aldri til nettleseren.

## 5. Første åpning på hver enhet

Åpne appen én gang som:

`https://DIN-APP.vercel.app/?sync=DIN_DART_SYNC_KEY`

Nøkkelen lagres lokalt på enheten og fjernes automatisk fra adressefeltet. Senere kan vanlig URL brukes.

## 6. Hvordan lagringen fungerer

- v16 fortsetter å bruke `localStorage` som lokal cache.
- `cloud-init.js` henter siste tilstand fra Supabase før `app.js` starter.
- Når v16 lagrer lokalt, synkroniseres samme state til databasen etter 750 ms debounce.
- Hvis internett/database er nede, kan appen fortsatt starte fra lokal cache.

Dette er bevisst første migreringstrinn: spillreglene endres ikke samtidig som lagringslaget flyttes.

## 7. 3440×1440

`style-ultrawide.css` aktiveres fra 2400 px bredde og 1200 px høyde. På 3440×1440 får du:

- større spillerkort og score
- opptil mange spillere bedre utnyttet horisontalt
- større roast-område
- større aktiv score og kastkort
- større knapper for fysisk dartskjerm

Eksisterende ca. 1920×1200-layout beholdes nær v16-oppsettet.

## Neste databasenivå

Når denne migreringen er stabil, bør JSON-state splittes i normaliserte tabeller for `players`, `games`, `turns`, `darts`, `yellow_cards`, `helmet_history` og `settings`. Det gir bedre statistikk og ekte realtime-visning på flere skjermer uten risiko for å endre spillmotoren samtidig.
