# EPIMS — ElegantPedi Inventory & Supplier Management System

A mobile-first Progressive Web App for ElegantPedi: inventory, supplier orders, packaging,
payments, reports, and WhatsApp notifications, backed by Google Sheets.

- **Frontend**: React + TypeScript + Material UI, built with Vite, installable as a PWA
- **Backend**: Google Apps Script, exposed as a web app
- **Database**: Google Sheets (6 tabs: Inventory, Supplier Orders, Packaging, Payments, Settings, Inventory History, Notifications)

The app runs immediately against realistic **local demo data** (stored in your browser) so
you can try every screen before connecting a live sheet. Connecting the real backend takes
about 10 minutes — see Part 2 below.

---

## Part 1 — Run the app locally

```bash
npm install
npm run dev
```

Open the printed local URL. Tap **"Continue in demo mode"** on the login screen to skip
Google Sign-In while you're developing — all data is stored in `localStorage` and can be
reset by clearing site data.

To build a production bundle:

```bash
npm run build
npm run preview
```

`npm run build` produces an installable PWA in `dist/` — deploy it to any static host
(Vercel, Netlify, Firebase Hosting, GitHub Pages).

---

## Part 2 — Connect your live Google Sheet

### 2.1 Create the spreadsheet and backend

1. Create a new Google Sheet (e.g. "ElegantPedi Inventory").
2. Open **Extensions > Apps Script**.
3. Delete the default `Code.gs` content, then copy in this project's
   `google-apps-script/Code.gs` and `google-apps-script/Setup.gs` as two separate files
   in the Apps Script editor (File > New > Script file).
4. In the Apps Script editor, select the function `setupEpimsSheets` from the dropdown
   next to "Run" and click **Run**. Approve the permission prompts. This creates all six
   tabs with the correct headers and seeds the 24 Black/White × Clean/Mebotorong/Neat ×
   Small/Medium/Large/X-Large product lines at zero stock.
5. **Deploy > New deployment > Select type: Web app.**
   - Execute as: **Me**
   - Who has access: **Anyone with the link** (or your Workspace domain)
   - Click Deploy and copy the **Web app URL** (ends in `/exec`).

### 2.2 Point the frontend at it

Create a `.env` file in the project root:

```
VITE_EPIMS_API_URL=https://script.google.com/macros/s/XXXXXXXX/exec
```

Restart `npm run dev`. The status chip in the top bar will switch from "Demo data" to
"Live · Google Sheets", and every read/write now goes to your spreadsheet.

### 2.3 (Optional) Enable Google Sign-In

1. In [Google Cloud Console](https://console.cloud.google.com), create/select a project,
   then **APIs & Services > Credentials > Create Credentials > OAuth client ID > Web application**.
2. Add your dev URL (e.g. `http://localhost:5173`) and your production URL to
   **Authorized JavaScript origins**.
3. Add the client ID to `.env`:

```
VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
```

Without this set, the login screen still works via "Continue in demo mode" — useful for
internal use where a single shared login is enough.

### 2.4 (Optional) Enable WhatsApp notifications

The backend already logs every notification (low stock, packaging, supplier orders, daily
summary, weekly report) to the **Notifications** tab. To actually deliver them to WhatsApp:

1. Set up a [WhatsApp Business Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started) app and get a permanent access token + phone number ID.
2. In the Apps Script editor: **Project Settings > Script properties**, add:
   - `WHATSAPP_TOKEN` = your access token
   - `WHATSAPP_PHONE_ID` = your WhatsApp phone number ID
3. Add the numbers to notify in the app's **Settings > WhatsApp Numbers** field.
4. Run `installTriggers()` once from the Apps Script editor to schedule the daily
   (18:00) and weekly (Monday 08:00) summary messages automatically.

Until this is configured, notifications are still recorded (visible in the app's
**Notifications** tab) — they just aren't sent to a phone yet.

---

## Project structure

```
epims/
├── src/
│   ├── pages/            Dashboard, Inventory, SupplierOrders, Packaging,
│   │                     Payments, Reports, Notifications, Settings, Login, More
│   ├── components/Layout AppShell (top bar + bottom nav)
│   ├── context/           AuthContext (Google Sign-In), DataContext (all app state)
│   ├── services/          api.ts (Apps Script client + local fallback), mockData.ts
│   ├── types/              Shared TypeScript types mirroring the 6 sheet tabs
│   └── theme/              MUI theme — ElegantPedi black/white/grey brand
├── google-apps-script/
│   ├── Code.gs            Web app API (doGet/doPost) + WhatsApp + triggers
│   └── Setup.gs            One-time sheet/tab bootstrap script
└── vite.config.ts          Vite + PWA plugin (installable, offline-caching) config
```

## How reorder quantities are calculated

`Quantity to Order = Minimum Stock − Current Stock`, computed live in
`src/context/DataContext.tsx` (`suggestedReorders`) from whatever the Inventory tab
currently holds — no manual calculation needed. Adjust "Minimum Stock" per product line
in **Inventory > Edit details**, or the default for new lines in **Settings**.

## Roadmap

Phase 1 (this build) covers the full MVP: dashboard, inventory, supplier orders,
packaging, payments, reports, settings, and a notification log with an on-demand
WhatsApp send. Phase 2/3 items from the SRS (barcode/QR scanning, AI demand
forecasting, customer ordering, courier integration, multi-user roles) are natural
next additions on top of this same Sheets-backed architecture.
