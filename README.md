# Portfolio Website — Vercel-ready structure

## Project structure
- `public/index.html` — portfolio page
- `public/style.css` — design
- `public/script.js` — front-end interactions
- `public/images/` — image assets
- `public/certificates/` — existing certificate files
- `server.js` — Express API
- `data/certificates.json` — local development metadata
- `uploads/` — local development uploads
- `package.json` — dependencies and scripts

`node_modules/` is intentionally excluded. Vercel installs dependencies from `package.json` / `package-lock.json`.

## Run locally
1. Install Node.js LTS.
2. Open this folder in VS Code.
3. Run `npm install`.
4. Run `npm start`.
5. Open http://localhost:3000.

## Deploy to GitHub and Vercel
1. Create a GitHub repository.
2. Upload the contents of this folder so `package.json`, `server.js`, and `public/` are at the repository root.
3. Import the repository at https://vercel.com/new.
4. If asked, choose Other / Express, use `.` as the root directory, and leave the build command blank or use the detected default. Vercel should install dependencies from `package.json`.
5. Deploy and open the generated `.vercel.app` URL.

## Important limitations before public deployment
This is a structure cleanup, not a complete persistent-storage migration.

- `public/images/` and `public/certificates/` are committed static assets and can be deployed with the project.
- The current API writes certificate metadata to `data/certificates.json` and uploads to `uploads/`. Vercel's function filesystem is not permanent, so certificates uploaded at runtime may not persist across deployments or instances.
- The current certificate API has no admin authentication. Do not expose the add/edit/delete endpoints publicly until authentication and authorization are implemented.
- The current front-end README says certificate cards are sample HTML and are not connected to the API. The backend endpoints exist, but the website's upload/edit/delete UI is not yet connected.
- To retain runtime uploads reliably on Vercel, migrate metadata to a database and files to persistent object storage (for example, Supabase), then configure secrets in Vercel Environment Variables. Do not put service keys in browser JavaScript or commit them to GitHub.

The app exports the Express app for Vercel and only starts a local HTTP listener when run directly with `npm start`.
