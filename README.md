# VOYAGER — Setup Guide

Your personal companion PWA. Runs on phone + PC, installable like a real app.

## Step 1 — Get a free Gemini API key

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account
3. Click "Create API key" — no credit card needed
4. Copy the key (starts with `AIza...`)

You'll paste this into the app's settings (⚙ icon) the first time you open it.
The key is saved only in your browser — it never goes anywhere except directly to Google.

## Step 2 — Host it (so it can be installed as a PWA)

PWAs need HTTPS to be installable on a phone. Easiest free option: **GitHub Pages**.

1. Create a new GitHub repo (e.g. `voyager-app`)
2. Upload all files from this folder (`index.html`, `style.css`, `app.js`,
   `manifest.json`, `service-worker.js`, `icon-192.png`, `icon-512.png`)
3. Go to repo **Settings → Pages**
4. Under "Source", select branch `main`, folder `/ (root)` → Save
5. Wait a minute — GitHub gives you a URL like:
   `https://<your-username>.github.io/voyager-app/`

Open that link — that's your live app.

### Alternative: test locally first (no hosting)

```bash
cd voyager-app
python3 -m http.server 8000
```

Then open `http://localhost:8000` in Chrome. Local testing works fine, but
you can only "Install" as an app once it's on a real HTTPS URL (like GitHub Pages).

## Step 3 — Install on your phone

1. Open your GitHub Pages link in **Chrome** on your phone
2. Tap the **⋮ menu** → **"Add to Home screen"** / **"Install app"**
3. VOYAGER now shows up like a real app icon — opens full-screen, no browser bar

## What it does

- **TRANSMISSION** — chat with Voyager, powered by Gemini (free tier)
- **OBJECTIVES** — your reminders / to-do list, saved in the browser

## Known limits (be aware)

- Free Gemini tier has daily rate limits — if you hit them, wait a bit or check
  usage at aistudio.google.com
- Data (chat history, objectives, API key) is stored in **this browser only** —
  switching phone ↔ PC won't sync automatically
- No push notifications for objectives — it's a checklist, not an alarm
- Google's free tier may use your inputs to improve their models (their policy,
  not something this app controls) — don't paste sensitive personal info into chat
