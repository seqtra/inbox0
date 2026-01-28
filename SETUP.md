# Full setup guide (frontend, backend, Postgres, admin, sign-in)

Use this guide to run the app locally and test the landing page, sign-in with Google, user dashboard, and admin blog.

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org/)
- **npm** — comes with Node
- **Docker Desktop** — for PostgreSQL ([docker.com](https://www.docker.com/products/docker-desktop))
- **Google Cloud account** — for “Sign in with Google” ([console.cloud.google.com](https://console.cloud.google.com/))

---

## 1. Clone and install

```bash
git clone <repo-url>
cd inbox0   # or your repo folder name
npm install
```

---

## 2. Environment variables

Copy the example env file and edit it:

```bash
cp .env.example .env
```

Create **`NEXTAUTH_SECRET`** (required for sign-in):

```bash
openssl rand -base64 32
```

Put that value in `.env` as `NEXTAUTH_SECRET=...`.

### Minimum required for sign-in + dashboard + admin

In **`.env`** (at the repo root), set at least:

| Variable | Example / note |
|----------|-----------------|
| `NEXTAUTH_URL` | `http://localhost:4200` — URL where you open the app. Use `http://127.0.0.1:4200` if you open that in the browser. |
| `NEXTAUTH_SECRET` | Output of `openssl rand -base64 32` |
| `GMAIL_CLIENT_ID` | From Google Cloud Console (OAuth 2.0 Client ID) |
| `GMAIL_CLIENT_SECRET` | From Google Cloud Console |
| `DATABASE_URL` | `postgresql://devuser:devpassword@localhost:5432/email_whatsapp_bridge` (matches Docker Postgres below) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` (optional if frontend and API are on same host; used for API calls) |

Other vars (Twilio, Trello, OpenAI, AWS) are only needed for those features.

---

## 3. Google Cloud (for “Sign in with Google”)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → your project (or create one).
2. **APIs & Services** → **Credentials**.
3. Create or open an **OAuth 2.0 Client ID** (Application type: **Web application**).
4. Under **Authorized redirect URIs** add (exactly, no trailing slash):
   - `http://localhost:4200/api/auth/callback/google`
   - If you use 127.0.0.1: `http://127.0.0.1:4200/api/auth/callback/google`
5. Copy **Client ID** and **Client secret** into `.env` as `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET`.

---

## 4. Database (PostgreSQL)

Start only Postgres with Docker:

```bash
docker-compose up -d postgres
```

Wait a few seconds, then apply the schema and generate the Prisma client (schema lives in the shared lib):

```bash
npx prisma generate --schema=libs/shared/prisma/schema.prisma
npx prisma migrate deploy --schema=libs/shared/prisma/schema.prisma
```

If this is the first time and you prefer creating the DB from scratch:

```bash
npx prisma migrate dev --schema=libs/shared/prisma/schema.prisma
```

Confirm Postgres is reachable: `DATABASE_URL` in `.env` should point at `localhost:5432` (e.g. `postgresql://devuser:devpassword@localhost:5432/email_whatsapp_bridge`).

---

## 5. Backend (Fastify API)

From the repo root:

```bash
npx nx serve api
```

You should see something like:

- `Server listening at http://127.0.0.1:3000`
- `[ ready ] http://localhost:3000`

The API runs on **port 3000**. Leave this terminal open.

---

## 6. Frontend (Next.js)

Open a **second** terminal; from the repo root:

```bash
npx nx run @email-whatsapp-bridge/frontend:dev
```

Or from the frontend app:

```bash
cd apps/frontend && npm run dev
```

You should see:

- `Ready on http://127.0.0.1:4200`

Use the **same base URL** as `NEXTAUTH_URL` when opening the app in the browser (e.g. `http://localhost:4200` or `http://127.0.0.1:4200`).

---

## 7. What to test

### Landing page

- Open **http://localhost:4200** (or **http://127.0.0.1:4200**).
- You should see the inbox-0 landing (hero, features, how it works, testimonials, CTA, footer).

### Sign in

- Click **“Log in”** or **“Get Early Access”** (or go to **http://localhost:4200/api/auth/signin**).
- Choose **“Sign in with Google”**.
- Complete the Google consent screen.
- You should be redirected back to the app and be signed in.

If you see **“redirect_uri_mismatch”**:

- Ensure the redirect URI in Google Cloud **exactly** matches: `http://localhost:4200/api/auth/callback/google` (or 127.0.0.1 if you use that).
- Ensure `NEXTAUTH_URL` in `.env` matches how you open the app (e.g. `http://localhost:4200`).

### User dashboard (emails + Trello)

- While signed in, go to **http://localhost:4200/dashboard**.
- You should see **“My Inbox”** and (once Gmail is linked) emails and “Send to Trello”.
- If you see “Google account not linked”, you signed in with Google; the app uses that account for Gmail/Trello.

### Admin dashboard + Blog CMS

- Go to **http://localhost:4200/admin**.
- You should see the admin dashboard (e.g. Blog CMS card).
- Open **Blog CMS** → **http://localhost:4200/admin/blog**.
- You can manage topics, generate posts, and publish (these endpoints use the Fastify API and Postgres).

If the blog admin shows errors:

- Ensure the **API** is running (`npx nx serve api`).
- Ensure **Postgres** is running (`docker-compose up -d postgres`) and migrations have been run.

---

## 8. Quick reference

| What | URL | Requires |
|------|-----|----------|
| Landing | http://localhost:4200 | Frontend only |
| Sign-in | http://localhost:4200/api/auth/signin | Frontend + NEXTAUTH_* + Google OAuth |
| Dashboard | http://localhost:4200/dashboard | Frontend + API + signed-in user |
| Admin | http://localhost:4200/admin | Frontend only |
| Blog CMS | http://localhost:4200/admin/blog | Frontend + API + Postgres |

| Service | Command | Port |
|---------|---------|------|
| PostgreSQL | `docker-compose up -d postgres` | 5432 |
| API | `npx nx serve api` | 3000 |
| Frontend | `npx nx run @email-whatsapp-bridge/frontend:dev` or `cd apps/frontend && npm run dev` | 4200 |

---

## 9. Troubleshooting

### “redirect_uri_mismatch” (Google)

- Add the **exact** redirect URI in Google Cloud: `http://localhost:4200/api/auth/callback/google` (or 127.0.0.1).
- Set `NEXTAUTH_URL` to the same origin you use in the browser (e.g. `http://localhost:4200`).
- Restart the frontend after changing `.env`.

### “Google account not linked” on dashboard

- Sign in via **“Sign in with Google”** (so the app has a Google account and tokens).
- If it still fails, check that the API can read the DB (NextAuth stores accounts in the `Account` table).

### “Can’t reach database server at localhost:5432”

- Start Postgres: `docker-compose up -d postgres`.
- Check `DATABASE_URL` in `.env` and that nothing else is using port 5432.

### Blog admin returns 500 or “Failed to fetch”

- Ensure **Postgres** is up and **migrations** are applied (see step 4).
- Ensure the **API** is running on port 3000.
- In development, the blog admin uses `/api/dev/admin/*` routes that require no auth but do require the DB.

### NEXTAUTH_URL / NO_SECRET warnings in console

- Set `NEXTAUTH_URL` and `NEXTAUTH_SECRET` in `.env` (see step 2) and restart the frontend.

---

## 10. Optional: run everything with Docker

To run API + frontend + Postgres via Docker Compose (e.g. for consistency):

```bash
docker-compose up
```

Then open **http://localhost:4200**. For local development and testing sign-in, the manual flow (Postgres + `nx serve api` + frontend dev server) is usually easier so you can change env and code without rebuilding images.

---

## 11. Deploy frontend to Vercel

The repo is an Nx monorepo; the Next.js app lives in **`apps/frontend`**. For Vercel to build and serve it correctly:

1. **Root Directory**  
   In the Vercel project → **Settings → General**, set **Root Directory** to **`apps/frontend`**.  
   (Do **not** leave it as the repo root, or the build output will not be found.)

2. **Include files outside Root**  
   In **Settings → General**, under Root Directory, enable **“Include source files outside of the Root Directory in the Build Step”** so the build can use `libs/shared` and the root `node_modules` (e.g. Prisma).

3. **Build & Install**  
   - **Install Command:** leave default (`npm install`); Vercel runs this from the **repository root**, so root `postinstall` (e.g. `prisma generate`) runs.  
   - **Build Command:** leave default (`npm run build`); with Root Directory `apps/frontend`, this runs `next build` in the app and writes `.next` in the right place.

4. **Environment variables**  
   Set at least `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production URL), `DATABASE_URL`, and any OAuth/API keys the app needs (same as in `.env` locally).
