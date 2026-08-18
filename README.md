# SOHAIL

Dark streetwear ecommerce site, rebuilt as a MERN stack app. Originally a static HTML/CSS/JS storefront; this repo is the full-stack version with JWT auth and MongoDB Atlas.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT |

## Run locally

1. Copy `server/.env.example` to `server/.env` and set `MONGO_URI` (local MongoDB or Atlas) and `JWT_SECRET`.
2. Install and start the API:

```bash
cd server
npm install
npm run dev
```

3. Install and start the storefront:

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. Register an account, then use **Settings** to update name, email, phone, shipping address, and password.

## Project layout

```
client/   React storefront (Vite)
server/   Express API
```

## Conventions

- Functional React components and hooks only
- `async/await` (no `.then` chains)
- Conventional Commits (`feat`, `fix`, `docs`, `chore`, `refactor`)
- Branches: `feature/<name>`, `fix/<name>`
- Keep the existing dark theme and **SOHAIL** branding

## License

MIT — see [LICENSE](LICENSE).
