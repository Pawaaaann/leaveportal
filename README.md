# CollegeLeaveFlow-1

A full‑stack college leave management system built with React (Vite) and an Express server. This README covers local setup, development commands, required environment variables, and common troubleshooting on Windows and GitHub.

## Prerequisites
- Node.js v20+ (tested on v22)
- npm v9+
- Git

## Install & Run (Development)
```bash
npm install
npm run dev
```
The app will start the Express server with Vite middleware and open the client at `http://localhost:5000`.

## Environment Variables
Copy `.env.example` to `.env` at the project root and fill in values if you want to enable Firebase features in the client. Without these, the app still works using backend authentication.

```
cp .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
```

### Client (Vite) variables
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_APP_ID

The client initialization is conditional; if any of these are missing, Firebase is not initialized, and the app falls back to backend auth.

### Server variables (optional)
If you deploy with Firestore, configure the server as needed (see `server/storage.ts` for how service account JSON is read from `FIREBASE_SERVICE_ACCOUNT_KEY`).

- FIREBASE_PROJECT_ID
- FIREBASE_SERVICE_ACCOUNT_KEY (stringified JSON; keep private)

## Scripts
- `npm run dev` – Start Express + Vite in development
- `npm run build` – Build the client into `dist/public`
- `npm start` – Start the compiled server (production)

## Windows Notes
- If you see an ENOTSUP bind error, the server is already configured to use `localhost` on Windows.
- Port defaults to `5000`. Change with `PORT=XXXX`.

## GitHub Push Protection / Secrets
If a push is blocked for “secrets detected,” remove the secret from history and rotate it. Example (PowerShell):
```powershell
# Remove a tracked folder going forward
git rm -r --cached .config
Add-Content .gitignore "`n.config/`n.local/"
git commit -m "Stop tracking .config and .local"

# Rewrite history (requires python: pip install git-filter-repo)
python -m pip install git-filter-repo

git filter-repo --force --path .config/.semgrep/semgrep_rules.json --invert-paths

@'
https://hooks.slack.com/=REDACTED
'@ | Out-File replace.txt -Encoding ascii
git filter-repo --force --replace-text replace.txt
Remove-Item replace.txt

# Push rewritten history
git remote add origin <YOUR_REPO_URL>  # if not set
git push --force-with-lease -u origin main
```

## Project Structure
- `client/` – React app (Vite)
- `server/` – Express + Vite integration
- `shared/` – Shared types/schemas

## Troubleshooting
- Firebase error `auth/invalid-api-key`: provide the Vite env vars or run without Firebase (works with backend auth).
- Push blocked by secrets: see section above.

## License
Internal/educational use.


