# Vercel Deployment Guide — वटवृक्ष (Abhangrao Family Tree)

## Overview

This app has two parts:
- **Frontend (React)** → Hosted on Vercel
- **Backend (Motoko canister)** → Runs on ICP blockchain (`mprts-maaaa-aaaak-qu66q-cai`)

Vercel hosts only the frontend UI. All data (members, tree, gallery) continues to be stored on ICP blockchain.

---

## Step 1: Export Code to GitHub (via Caffeine)

1. In your Caffeine project, click the **Settings (gear)** icon
2. Select **"Push to GitHub"**
3. Click **"Sync to GitHub"** and connect your GitHub account
4. Choose a repository name (e.g., `vatavriksha-abhangrao`)
5. Click **Export** — your code will appear on GitHub

---

## Step 2: Import Project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"** → **"Import Git Repository"**
3. Select your GitHub repository (`vatavriksha-abhangrao`)
4. Set the **Root Directory** to: `src/frontend`
5. Framework: **Vite** (auto-detected)
6. Build Command: `pnpm build` (or `npm run build`)
7. Output Directory: `dist`

---

## Step 3: Set Environment Variables on Vercel

In Vercel project → **Settings → Environment Variables**, add:

| Variable Name | Value | Notes |
|---|---|---|
| `VITE_ADMIN_TOKEN` | *(ask Caffeine support for your canister admin token)* | Required for backend write operations |
| `STORAGE_GATEWAY_URL` | `https://blob.caffeine.ai` | For file/blob storage |

> **Note:** `VITE_ADMIN_TOKEN` is the same token that Caffeine injects via URL (`caffeineAdminToken`). Without it, read operations (viewing tree, gallery) will work, but write operations (adding members, approving registrations) will fail.

---

## Step 4: Deploy

Click **Deploy**. Vercel will:
1. Install dependencies
2. Run `pnpm build`
3. Publish the `dist/` folder

---

## What Works on Vercel

| Feature | Status | Notes |
|---|---|---|
| View family tree | Works | Read from ICP canister |
| View gallery | Works | Read from ICP canister |
| Login (admin/user) | Works | Password-based via ICP canister |
| Add/approve members | Works (with VITE_ADMIN_TOKEN set) | Write to ICP canister |
| Registration | Works (with VITE_ADMIN_TOKEN set) | Write to ICP canister |
| Photos | Re-upload required | Photos stored in browser localStorage |

---

## Canister Details

- **Backend Canister ID:** `mprts-maaaa-aaaak-qu66q-cai`
- **ICP Host:** `https://icp0.io`
- **Network:** ICP Mainnet

---

## Updating the App

Whenever you make changes in Caffeine:
1. Go to Caffeine → Settings → **"Save Changes to GitHub"**
2. Vercel will automatically detect the GitHub push and redeploy
