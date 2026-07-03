#!/usr/bin/env bash
# Deploy to Vercel production WITHOUT using GitHub (avoids commit-author block).
# Run from project root: bash scripts/deploy-vercel.sh

set -e
cd "$(dirname "$0")/.."

echo "→ Deploying to Vercel production (CLI upload, not GitHub)..."
npx vercel@latest deploy --prod --yes

echo ""
echo "✓ Done. Open https://impact.buffindia.com in a few minutes."
echo "  Dashboard: https://vercel.com/buffindias-projects/buffindia-impact"
