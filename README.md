# Macro Streak

Macro Streak is an Expo + React Native macro-tracking MVP that runs on iPhone through Expo Go and exports as a web app/PWA.

## Local Development

```powershell
npm install
npx expo start --web
```

For native testing:

```powershell
npm start
```

## Production Web Build

```powershell
npm run build:web
```

Expo exports the static web app to `dist/`.

## Deploy To Vercel

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Set Framework Preset to `Other`.
4. Set Build Command to `npm run build:web`.
5. Set Output Directory to `dist`.
6. Deploy.
7. Open the Vercel URL on iPhone Safari.
8. Tap Share > Add to Home Screen.

## Storage

Native iOS/Android builds use SQLite through `expo-sqlite`.

The web/PWA build uses browser `localStorage` with the same data shape, so saved meals, food logs, goals, streaks, and history persist locally on the device/browser without a backend.

## Barcode Scanning

The Add Food screen can scan UPC/EAN barcodes with the device camera and look up macros through Open Food Facts. Results are loaded into the editable food form before logging, because barcode databases can have missing or imperfect serving data. If no product is found, enter the food manually.
