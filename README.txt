DART SCORE v18 – 3440x1440

Bytt disse tre filene i GitHub-repoet:
1. index.html
2. style-ultrawide.css
3. service-worker.js

Ikke bytt app.js. Neon/cloud-synken og spillmotoren beholdes som i v17.

Etter commit:
- Vent til Vercel deployment er Ready.
- Åpne appen og trykk Ctrl+F5.
- Ved behov: DevTools > Application > Service Workers > Unregister én gang.

Ultrawide aktiveres automatisk fra 2400 px bredde og 1100 px høyde.
Under dette brukes eksisterende style.css, slik at Samsung-nettbrett og vanlig PC beholder dagens layout.
