NEBULA ORACLE — Live Wingo Analytics
A GitHub-ready, server-proxied Wingo analytics dashboard based on the uploaded HTML references.
What was carried over
Mobile-first premium prediction dashboard and live period/timer treatment, inspired by the uploaded UIs.
Live history feed using the endpoint found in the supplied files.
BIG/SMALL classification (0–4 = SMALL, 5–9 = BIG).
Number/color history tape.
Transparent ensemble signals: recent frequency, streak/reversion, transition rate and window balance.
Prediction audit trail and measured hit-rate in Firebase Realtime Database.
Optional server-side WebSocket bridge.
Telegram/channel join UI is intentionally omitted.
The supplied references include several different prediction engines. Some are deterministic seed formulas and some are client-side ensemble logic. They should not be treated as evidence of guaranteed future outcomes. This repository therefore records actual results and calculates observed performance rather than claiming a fixed accuracy.
Run locally
cp .env.example .env
Fill Firebase variables if you want cloud audit storage.
npm install
npm run dev
Open the Vite URL shown in the terminal.
Firebase
The credentials supplied in the request were not copied directly into source control. Put them in .env.
The Firebase snippet supplied by the user has a databaseURL containing https://-ai-prediction-default-rtdb.firebasedatabase.app; verify that value in the Firebase console before using it.
Realtime data is written under:
oracle/audits/<push-id>
Recommended Realtime Database rules for a prototype are restrictive; do not expose write access publicly in production without authentication.
WebSocket
Set WS_URL and WS_TOKEN in .env only if you have a legitimate upstream WebSocket endpoint and permission to use it. The token is never sent to the browser.
Production
Build the UI with npm run build, then deploy the Vite dist directory and the Node server separately, or serve the built assets from your preferred host.
Important
This is an analytics/prediction system, not a guaranteed betting system. No code can honestly promise 99% accuracy for an externally generated random draw. The app is designed to measure real performance from the live feed and make low-confidence periods visible.
