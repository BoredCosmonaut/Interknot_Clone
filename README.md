# CosmoKnot

A small, friends-only social site: post images, comment on them, and chat in real time.

**Live:** https://knot.boredcosmonaut.dev
![CosmoKnot feed](docs/screenshot.png)
> The design is inspired by the Inter-Knot from [Zenless Zone Zero](https://zenless.hoyoverse.com/), which belongs to HoYoverse. CosmoKnot is an unofficial fan project. It is not affiliated with or endorsed by HoYoverse and uses no game assets.

## Features

- **Image posts:** uploads are converted to WebP with sharp (animated GIFs stay animated), shown in an infinite-scroll feed, and can be opened directly with `?post=<id>` links
- **Comments:** add, edit, and delete your own
- **Profiles:** display name, bio, avatar upload, and a user's post history
- **Direct messages:** real-time chat over Socket.io, with an inbox and unread badges
- **Notifications:** bell dropdown for activity on your posts
- **Moderation:** report posts, comments, messages, or users. Admins work through a report queue that keeps a snapshot of the reported content, so the evidence survives if the content is edited or deleted
- **Security basics:** JWT auth, bcrypt password hashing, ownership checks inside SQL `WHERE` clauses, and rate limiting

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Vue 3 (`<script setup>`), TypeScript, Pinia, Vue Router, Vite, Iconify (Lucide) |
| Backend | Node.js, Express, TypeScript (ESM), Socket.io, multer, sharp |
| Database | PostgreSQL with raw `pg` queries (no ORM) |
| Hosting | DigitalOcean droplet, Nginx reverse proxy, pm2, Let's Encrypt |

## Project structure

```
backend/
  src/
    controllers/   request handling and validation
    models/        SQL queries
    routes/        Express routers
    middleware/    requireAuth, requireAdmin, uploads
    sockets/       Socket.io setup and message events
  public/avatars/  default avatar
  uploads/         user images (gitignored)
frontend/
  src/
    views/         pages
    components/    PostCard, PostModal, ReportModal, ...
    stores/        Pinia auth store
    lib/           api wrapper, socket client, config
```

## Running locally

You need Node.js 20+ and PostgreSQL.

### 1. Database

```bash
createdb interknot_network
psql -d interknot_network -f schema.sql
```

### 2. Backend

Create `backend/.env`:

```env
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/interknot_network
PORT=3000
JWT_SECRET=some-long-random-string
CORS_ORIGIN=http://localhost:5173
```

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
# optional, only used in production builds:
# VITE_GA_ID=G-XXXXXXXXXX
```

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

### Making yourself an admin

```sql
UPDATE users SET is_admin = true WHERE username = 'yourname';
```

Then log out and back in, because the admin flag is stored in the JWT.

## Deployment notes

In production, Nginx serves the built frontend (`frontend/dist`) and forwards `/api`, `/uploads`, `/avatars`, and `/socket.io` to the Express server on port 3000. Because the frontend and API share one domain, the production build uses relative API paths (`API_BASE = ''`) and needs no `VITE_API_URL`.

## Credits

Built by [@BoredCosmonaut](https://github.com/BoredCosmonaut).