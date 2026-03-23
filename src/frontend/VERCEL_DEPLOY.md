# Vercel Deployment Guide — वटवृक्ष – अभंगराव घराणे

## Quick Setup (Vercel वर पहिल्यांदा deploy करण्यासाठी)

### Step 1 — GitHub Export
1. Caffeine → Settings (gear icon) → **Push to GitHub**
2. GitHub account connect करा → export करा

### Step 2 — Vercel Import
1. [vercel.com](https://vercel.com) → **New Project** → GitHub repo import करा
2. खालील settings ठेवा:

| Setting | Value |
|---|---|
| **Root Directory** | `src/frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 3 — Node.js Version
Vercel Dashboard → Project Settings → General → **Node.js Version → 18.x**

### Step 4 — Deploy
Deploy बटण दाबा — **environment variables लागणार नाहीत** (सर्व `env.json` मध्ये hardcoded)

---

## ICP Backend Connection

- **Backend Canister:** `mprts-maaaa-aaaak-qu66q-cai`
- **IC Host:** `https://icp0.io`
- Frontend Vercel वर होस्ट होईल; backend ICP blockchain वर कायम राहील

---

## Admin लॉगिन

- Email: `admin@vatavriksha.com`
- Password: `Admin@123`

---

## महत्त्वाच्या मर्यादा

- Photos localStorage मध्ये साठवलेले — Vercel deploy नंतर re-upload करावे लागतील
- ICP canister मधील data (members, tree, gallery) सर्वत्र accessible राहील

---

## Troubleshooting

**npm install fails:**
`.npmrc` मध्ये `legacy-peer-deps=true` आधीच set आहे — Vercel automatically वाचतो

**Build fails:**
Vercel Project Settings मध्ये Root Directory `src/frontend` set असल्याची खात्री करा

**App loads but backend not connecting:**
Vercel Project Settings → Environment Variables → `VITE_CAFFEINE_ADMIN_TOKEN` (optional, for write operations)
