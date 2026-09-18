# Open Higgsfield

Private image-and-video generation studio for Woojin Cho (ThinkerMaker), based on [wide-trace/open-higgsfield](https://github.com/wide-trace/open-higgsfield).

One prompt bar, each model’s own settings, a masonry gallery of finished runs. This is the studio itself — not a marketing page. The product name is **Open Higgsfield**. It does not ship the commercial Higgsfield logo, wordmark, or proprietary media.

Do not deploy this repository to a public host without the sign-in gate and env-only generation keys described below.

---

## What it is

The browser never talks to the generation API. Signed-in users submit from one composer; a server action maps the catalog entry to `POST /{model}` and polls `GET /requests/{id}/status` with `Authorization: Key id:secret`.

- Image and video in one workspace (`⌘/Ctrl + Enter` submits)
- Catalog-driven models (Soul, Seedance, Kling, Wan, Flux, and the rest of the upstream set)
- Per-model settings, media roles, batch, reuse, favorites, viewer, bulk select
- History in IndexedDB in this browser

Generation spend is impossible until someone authenticates. The platform key is read from the server environment, never from a visitor cookie.

---

## Local run (Mac, Apple Silicon, Node)

You need **Node 20.9+** (Node 22 recommended). pnpm is enabled via Corepack. Homebrew Docker is only required for the container path.

```bash
git clone git@github.com:wooj-commits/open-higgsfield.git
cd open-higgsfield
cp .env.example .env
```

Edit `.env` and replace every `replace-with-…` / `id:secret` placeholder. Then:

```bash
corepack enable
pnpm install
pnpm dev
```

Open **http://127.0.0.1:3000** — the process binds to loopback, not a public interface. Sign in with `AUTH_USERNAME` / `AUTH_PASSWORD`. Generate needs `HF_API_BASE_URL` and `HF_API_KEY`.

If Corepack is unavailable:

```bash
npm install -g pnpm
pnpm install
pnpm dev
```

Production-mode locally (still loopback):

```bash
pnpm build
pnpm start
```

`pnpm start` serves **http://127.0.0.1:3000**.

---

## Environment variables

Nothing secret belongs in the image or in git. Config is env-only. `.env.example` is placeholders.

| Variable | Required | If missing |
| --- | --- | --- |
| `AUTH_SECRET` | Yes (sign-in) | Sign-in returns 503. Studio routes redirect to `/sign-in`. Must be ≥ 32 characters. |
| `AUTH_USERNAME` | Yes (sign-in) | Same. No default user. |
| `AUTH_PASSWORD` | Yes (sign-in) | Same. No default password. Must be ≥ 12 characters. |
| `HF_API_BASE_URL` | Yes (generate) | Studio opens after sign-in, but Generate fails until this origin is set. |
| `HF_API_KEY` | Yes (generate) | Generate fails. Format `id:secret`. Unauthenticated visitors never see or spend this key. |
| `AUTH_SESSION_DAYS` | No | Defaults to 7. Invalid values block sign-in. |
| `OPEN_HIGGSFIELD_READ_WRITE_TOKEN` | No | Uploads go to local disk (`UPLOAD_DIR`) instead of Vercel Blob. |
| `PUBLIC_ORIGIN` | No* | Built URL for local uploads. *Required for image-to-video / references when Blob is not used, so the generation API can fetch files. |
| `NEXT_PUBLIC_SITE_URL` | No | Metadata origin. Falls back to `http://localhost:3000`. |
| `AUTH_COOKIE_SECURE` | No | `1` = always Secure cookies. `0` = allow HTTP. If unset, https `PUBLIC_ORIGIN` is Secure and http is not. |
| `TRUST_PROXY` | No | Set `1` behind a reverse proxy so `X-Forwarded-For` / `X-Forwarded-Proto` are trusted. |
| `UPLOAD_DIR` | No | Defaults to `/tmp/open-higgsfield-uploads`. Ephemeral on containers. |
| `PORT` | No (container) | Defaults to `3000`. |
| `HOSTNAME` | No (container) | Container must use `0.0.0.0`. Local `pnpm dev` / `pnpm start` force `127.0.0.1`. |

Create `AUTH_SECRET` with `openssl rand -base64 48`.

---

## Container run

The image is non-root (`nextjs`, uid 1001). It listens on **port 3000**. Healthcheck path is **`GET /api/health`**.

```bash
cp .env.example .env   # then fill real values
docker compose up --build
```

Compose publishes **127.0.0.1:3000:3000** so the daemon does not expose the studio on all interfaces.

Direct Docker:

```bash
docker build -t open-higgsfield .
docker run --rm --env-file .env -p 127.0.0.1:3000:3000 open-higgsfield
```

Confirm:

```bash
curl -sS http://127.0.0.1:3000/api/health
```

A healthy process returns JSON `{ "status": "ok", ... }`. That route is unauthenticated on purpose so a proxy can probe it. It does not generate, upload, or change accounts.

### Behind a reverse proxy (Olares / TLS)

Do not put secrets in the Dockerfile. Pass them as runtime env. Terminate TLS at the proxy. Forward `Host` (or set `PUBLIC_ORIGIN` to the public https origin). Set `TRUST_PROXY=1`. Keep the app’s own sign-in — Olares account login in front is extra, not a replacement. Unauthenticated callers still cannot hit generate, upload, or logout.

Point the proxy at `studio:3000` (Compose service name) or the container port **3000**. Healthcheck: **`GET /api/health`**.

The filesystem is ephemeral. Uploads without Blob vanish on restart. Generation results live on the platform CDN and in the browser’s IndexedDB.

---

## Auth and safety

- Sign-in at `/sign-in`. Session cookie `ohf_session` is httpOnly, `SameSite=Lax`, `Secure` in production.
- Generation (`submitGeneration`, status polls), `/api/upload`, `/api/blob`, `/api/auth/logout`, and `/api/auth/session` require a session.
- Login is origin-checked, rate-limited, and has no CORS wildcard.
- Security headers (CSP, frame deny, nosniff, referrer, permissions) are on.
- `/api/media/{id}` serves capability-URL uploads (unguessable names) so the generation API can fetch inputs. Do not treat it as a listing API — there isn’t one.
- `robots.txt` disallows crawling. This is a private studio.

---

## Layout

```
src/
  app/            studio page, sign-in, /api/health, /api/auth, /api/upload
  auth/           session, origin checks, rate limit
  generation/     catalog, server actions, platform client
  openhiggsfield/ composer, gallery, viewer, picker, settings
  security/       response headers
  proxy.ts        auth gate + device cookie
```

Upstream behavior (catalog, composer, gallery, polling) is preserved. This fork adds private-instance auth, env-only keys, loopback local bind, and a production container.

Brand assets are the original open-frame mark (two brackets), not the commercial Higgsfield logomark.
