# Faeyza Store V16 — Vercel ESM warning fix

V16 removes the Vercel warning about Node.js Functions being compiled from ESM to CommonJS.

## What changed
- API Functions were converted from Web Standard ESM exports (`export async function GET`) to Vercel's CommonJS handler style (`module.exports = async function handler(req, res)`).
- Build scripts remain CommonJS, so the project does **not** add `"type": "module"` globally.
- Node.js remains pinned to 24.x.
- `vercel.json` keeps `includeFiles` as a string.
- `/api/sync` still accepts GET for Vercel Cron and POST for manual calls.

The warning was not itself a deployment error; this version removes the mixed-module warning without breaking the existing CommonJS build scripts.
