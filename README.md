# Venu Akkamgari - Portfolio

A dark-first, heavily animated portfolio with a full admin dashboard. Every word, image, link and
project on the public site is editable from `/admin` - nothing is hard-coded in the components.

- **frontend/** - Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Lenis
- **backend/** - Fastify 5, MongoDB (Mongoose), JWT auth, Nodemailer, server-sent events

## Running it

```bash
npm run install:all   # first time only
npm run dev           # starts the API on :4000 and the site on :3010
```

Or run each side on its own - both use plain `npm run dev`:

```bash
cd backend  && npm run dev    # http://localhost:4000
cd frontend && npm run dev    # http://localhost:3010
```

| URL | What it is |
| --- | --- |
| http://localhost:3010 | Public site |
| http://localhost:3010/admin/login | Owner sign-in |
| http://localhost:4000/health | API status (includes database state) |

Port 3010 is used because 3000, 3002 and 3003 are taken by the zestfindz apps on this machine.

## Database

Development runs against a local MongoDB in Docker:

```bash
npm run db:up     # starts mongo:7 on port 27018
npm run db:down
```

**To switch to MongoDB Atlas**, allow your IP in Atlas → Network Access, then swap the
`MONGODB_URI` line in `backend/.env` back to the Atlas connection string (it is kept there,
commented out). Note that this machine's traffic egresses through a Cloudflare WARP address that
changes, so a fixed IP allow-entry will keep breaking - use `0.0.0.0/0` for development, or turn
WARP off before adding your IP.

Seed the database (safe to re-run - it never overwrites existing data):

```bash
npm run seed
```

## Admin access

Sign in at `/admin/login` with **either** the username or the email on the account. Credentials
live only in your database as a bcrypt hash; to change them:

```bash
cd backend
npx tsx src/set-credentials.ts <username> <password>
```

### What the dashboard does

- **Site content** - hero (including the giant name), about, experience timeline, skills with
  levels, education, contact details, social links, navigation, SEO and theme colour. Plus a raw
  JSON editor for anything the forms do not cover.
- **Projects** - full CRUD, drag-free reordering, featured and draft toggles, metrics, galleries.
- **Messages** - every contact-form enquiry, with search, status filters and reply-by-email.
- **Media** - drag-and-drop uploads, reusable across the whole site.
- **Notifications** - pushed live over server-sent events as things happen.
- **Settings** - profile, password change, and every active session.

## Security

### Email one-time codes

- Sign in with a password **or** with a 6-digit code emailed to the account address
- Changing the username, password or account email each require the current password **plus** an emailed code
- Codes are single-use, expire in 10 minutes, stored only as SHA-256 hashes, and die after five wrong guesses
- Requesting a new code invalidates the previous one; every request and change raises a notification
- Requesting a code never reveals whether an account exists

### Sessions and accounts

- bcrypt (cost 12) password hashing; the account locks after repeated failed sign-ins
- Short-lived JWT access tokens in httpOnly cookies, with rotating refresh tokens stored as hashes
- Reusing a revoked refresh token revokes every session and raises a critical notification
- Rate limiting globally and per sensitive route; CORS restricted to known origins
- Mutating requests require a header a cross-site form cannot set, on top of SameSite cookies
- Uploads validated by MIME type and size before touching disk
- Contact form protected by a honeypot field and its own rate limit

## Email

Without SMTP settings the API prints emails to the console instead of sending them, so everything
still works in development. To send real mail, fill in the `SMTP_*` values in `backend/.env`
(for Gmail, use an App Password, not your account password).

## Images

The site ships with generated SVG placeholders in `frontend/public/placeholders/`. Replace them by
uploading real images in the admin Media page, then pick them in the relevant content field.
To regenerate the placeholders: `node frontend/scripts/make-placeholders.mjs`.

## Deploying

- Frontend: Vercel (set `NEXT_PUBLIC_API_URL` to the deployed API)
- Backend: Render, Railway or Fly (set every variable from `backend/.env.example`)
- Rotate `JWT_SECRET`, `REFRESH_TOKEN_SECRET` and `COOKIE_SECRET` before going live, and set
  `NODE_ENV=production` so cookies become Secure + SameSite=strict
