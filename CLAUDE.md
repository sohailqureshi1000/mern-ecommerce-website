# Project: SOHAIL — MERN Ecommerce

## Overview
Full MERN stack rebuild of a dark streetwear-themed ecommerce site,
originally built in HTML/CSS/JS.

## Stack
- Frontend: React (Vite)
- Backend: Node.js + Express
- Database: MongoDB (Atlas)
- Auth: JWT
- AI tooling: Claude Code for scaffolding, refactors, and reviews

## Conventions
- Commit style: Conventional Commits (feat, fix, docs, chore, refactor)
- Components: functional components + hooks only
- Styling: keep the existing dark theme with brand name "SOHAIL"
- Async: use async/await, not .then chains
- Branch naming: feature/<name>, fix/<name>

## Folder structure
- /client — React frontend
- /server — Express backend

## Rules learned (FE-03 workflow drill)
- Forms with validation must use a dedicated `validate*.js` module with
  regex/format checks and per-field error messages — never rely on the HTML
  `required` attribute alone, and never show one generic top-of-form alert.
- Every invalid input needs `aria-invalid` and `aria-describedby` pointing at
  its own error message, not just a visible `<label>` — a label alone doesn't
  tell a screen reader which field failed or why.
- Any field validated on the client (email format, phone format, password
  rules) must also be validated in the matching Express controller — client
  validation alone doesn't stop a direct API call, so a client-only check is
  an incomplete fix, not a finished one.
- Before referencing a file in a prompt (e.g. `@src/pages/X.jsx`), confirm it
  exists in the repo — a wrong path forces a clarifying-question round trip
  instead of getting straight to a plan.