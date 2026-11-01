

# Gym Management System

A full-stack gym management application with a NestJS backend and a Next.js frontend. The backend uses Prisma to connect to PostgreSQL.

## Project Structure

```text
Gym Management/
├── gym-backend/       # NestJS API and Prisma
├── gym-frontend/      # Next.js web application
├── .gitignore
 
```

## Requirements

- Node.js and npm
- PostgreSQL
- Git

## Backend Setup

Open a terminal in `gym-backend`:

```powershell
cd gym-backend
npm install
```

Create or update the project-root `.env` file:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5001/gym?schema=public"
JWT_SECRET="YOUR_PRIVATE_JWT_SECRET"
TZ="Africa/Addis_Ababa"
```

Replace the database username and password with your own values. URL-encode special characters in the password. Keep `.env` private and do not commit it.

Generate Prisma Client:

```powershell
npx prisma generate
```

Start the backend in development mode:

```powershell
npm run start:dev
```

The API runs at `http://localhost:4000` by default.

## Frontend Setup

Open a second terminal in `gym-frontend`:

```powershell
cd gym-frontend
npm install
```

Create `gym-frontend/.env.local` and add the authentication secret required by the frontend:

```env
AUTH_SECRET="YOUR_PRIVATE_AUTH_SECRET"
```

Start the frontend:

```powershell
npm run dev
```

The frontend runs at `http://localhost:3000` by default.

## Available Backend Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/dashboard/stats` | Dashboard statistics |
| `GET` | `/members` | List members |
| `POST` | `/members` | Create a member |
| `PATCH` | `/members/:id/status` | Update a member's status |
| `POST` | `/day-passes` | Create a day pass |
| `POST` | `/check-ins` | Record a check-in |
| `GET` | `/check-ins/today` | View today's check-ins |
| `POST` | `/sms/send` | Send an SMS |

Some routes may require authentication or specific request data.

## Security

- Never commit `.env` or `.env.local`.
- Do not share database passwords, JWT secrets, or authentication secrets.
- Keep `node_modules` and build output out of Git.
- Keep `gym-backend/prisma/schema.prisma` tracked in Git.

