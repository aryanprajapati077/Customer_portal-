# Deploy to impact.buffindia.com

This portal is a **Next.js 16** app designed for **Vercel** + **Neon PostgreSQL**.

| URL | Purpose |
|-----|---------|
| `https://impact.buffindia.com` | Public site + customer portal |
| `https://impact.buffindia.com/login` | Customer login |
| `https://impact.buffindia.com/dashboard` | Customer dashboard |
| `https://impact.buffindia.com/admin` | Admin panel |

---

## 1. Push code to GitHub

```bash
git add .
git commit -m "Prepare production deployment for impact.buffindia.com"
git push origin main
```

---

## 2. Create Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo.
2. **Framework preset:** Next.js (auto-detected).
3. **Build command:** `npx prisma generate && next build --webpack` (already in `vercel.json`).
4. **Root directory:** `.` (repo root).

---

## 3. Environment variables (Vercel → Settings → Environment Variables)

Add these for **Production**, **Preview**, and **Development**:

| Variable | Example / notes |
|----------|-----------------|
| `NEXT_PUBLIC_APP_URL` | `https://impact.buffindia.com` |
| `DATABASE_URL` | Your Neon pooled PostgreSQL URL |
| `AUTH_SECRET` | Long random string (`openssl rand -base64 32`) |
| `ADMIN_PASSWORD` | Strong admin password |
| `ADMIN_EMAIL` | Email for admin OTP reset |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) |
| `RESEND_FROM` | `Buffindia <noreply@buffindia.com>` (domain must be verified in Resend) |

Optional: `GOOGLE_SHEET_ID`, `GOOGLE_API_KEY`

**Never commit `.env` to Git.**

---

## 4. Connect custom domain

In Vercel → **Project → Settings → Domains**:

1. Add `impact.buffindia.com`
2. Vercel shows DNS records — add them at your domain registrar (where `buffindia.com` is managed):

**Recommended (CNAME):**

| Type | Name | Value |
|------|------|-------|
| CNAME | `impact` | `cname.vercel-dns.com` |

Wait 5–30 minutes for DNS propagation. Vercel will issue a free SSL certificate automatically.

---

## 5. Resend email setup

For OTP and support emails from `@buffindia.com`:

1. Resend → **Domains** → Add `buffindia.com`
2. Add the DNS records Resend provides (SPF, DKIM)
3. Use verified sender: `Buffindia <noreply@buffindia.com>`

---

## 6. Database

Schema is managed with Prisma. After first deploy, run locally against production DB (one time):

```bash
npx prisma db push
```

Or use Neon SQL console if you prefer. Your Neon DB is already in use from development.

---

## 7. Deploy

Every push to `main` auto-deploys on Vercel.

Manual deploy from CLI:

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 8. Post-deploy checklist

- [ ] Homepage loads at `https://impact.buffindia.com`
- [ ] Customer login + dashboard works
- [ ] Admin login at `/admin/login`
- [ ] Forgot password sends OTP email
- [ ] ESG report PDF downloads
- [ ] Support chat + tickets work

---

## Important: file uploads on Vercel

Product images and customer logo uploads are saved to `public/uploads/`. **Vercel serverless storage is ephemeral** — uploaded files may disappear after redeploys.

For production uploads, use one of:

- **Vercel Blob** (recommended for this stack)
- **AWS S3 / Cloudflare R2**
- **Self-hosted VPS** (Node + PM2 + nginx) if you need persistent local disk

Until blob storage is added, re-upload product images after each deploy if needed.

---

## Alternative: VPS (persistent uploads)

If you prefer a single server with persistent disk:

```bash
npm ci
npx prisma generate
npm run build
npm start   # port 3000
```

Use nginx/Caddy as reverse proxy with SSL for `impact.buffindia.com` → `localhost:3000`.

---

## Support

- Vercel domains: https://vercel.com/docs/projects/domains
- Neon + Vercel: https://neon.tech/docs/guides/vercel
