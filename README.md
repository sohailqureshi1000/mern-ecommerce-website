# SOHAIL

Dark streetwear ecommerce site, rebuilt as a MERN stack app. Originally a static HTML/CSS/JS storefront; this repo is the full-stack version with JWT auth and MongoDB Atlas.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT |

## Status

Early rebuild. `client/` (React) and `server/` (Express) are the planned app roots; they are not in the tree yet.

## Project layout (planned)

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
