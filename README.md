# Strikz Esports

Strikz Esports is arranged for a single Render Web Service: the Express backend runs the API and also serves the static frontend from the same deployed URL.

## Project Structure

```text
Strikz_Esports/
  frontend/
    index.html
    css/
    js/
    assets/
  backend/
    server.js
    package.json
    data/seedData.js
    config/db.js
    controllers/
    middleware/
    routes/
  README.md
```

## Database

The backend now uses MongoDB. Use MongoDB Atlas for hosting because it has a free shared cluster and works well with Render.

When the database is empty, the backend automatically inserts the starter data from `backend/data/seedData.js`, including tournaments, news, roster, sponsors, settings, tickets, and the admin account.

## Local Setup

Requirements:

- Node.js 18 or newer
- MongoDB Atlas connection string

Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

Update `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=use_a_long_random_secret
JWT_EXPIRY=24h
SUPPORT_EMAIL=support@strikzesports.com
PARTNER_EMAIL=partners@strikzesports.com
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Install backend dependencies:

```bash
npm install --prefix backend
```

Run the full website locally:

```bash
npm start --prefix backend
```

Open:

```text
http://localhost:5000
```

The same server also exposes the API under:

```text
http://localhost:5000/api/v1
```

## Render Deployment

Render will run the backend as the only Web Service. The backend serves:

- Frontend: `/`
- CSS: `/css`
- JavaScript: `/js`
- Assets: `/assets`
- Uploads: `/uploads`
- API: `/api/v1`
- Health check: `/health`

Use these settings when creating the Render Web Service:

```text
Root Directory: leave empty
Build Command: npm install --prefix backend
Start Command: npm start --prefix backend
Health Check Path: /health
```

## Render Environment Variables

Set these in Render:

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=use_a_long_random_secret
JWT_EXPIRY=24h
SUPPORT_EMAIL=support@strikzesports.com
PARTNER_EMAIL=partners@strikzesports.com
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
```

## Demo Login

After the first successful server start, the seeded admin login is:

```text
Username: admin
Password: admin
```
