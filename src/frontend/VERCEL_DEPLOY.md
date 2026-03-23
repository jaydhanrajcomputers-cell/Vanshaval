# Vercel Deployment Guide — वटवृक्ष

## Quick Setup

1. Vercel वर GitHub repo import करा
2. **Root Directory:** `src/frontend`
3. **Framework Preset:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Install Command:** `npm install --legacy-peer-deps`
7. Deploy करा — environment variables लागणार नाहीत (सर्व `env.json` मध्ये hardcoded आहे)

## Node.js Version

Vercel Dashboard → Project Settings → General → Node.js Version → **18.x** निवडा

## ICP Canister IDs

- Backend: `mprts-maaaa-aaaak-qu66q-cai`
- IC Host: `https://icp0.io`

## Important Notes

- Frontend only on Vercel; backend stays on ICP blockchain
- Photos stored in localStorage (ICP size limit); re-upload after deployment
- All member/tree/gallery data in ICP canister — always accessible
