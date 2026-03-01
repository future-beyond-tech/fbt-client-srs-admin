This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app-reference/cli/create-next-app).

## Getting Started

The app talks to a .NET backend. The browser always calls the same origin (`/api/*`); the Next.js server uses `EXTERNAL_API_URL` to decide which backend to use.

Create `.env.local` in the project root (optional if using the scripts below):

```bash
EXTERNAL_API_URL=http://localhost:8080
```

### Development commands

| Command | Backend used | Use case |
|--------|----------------|----------|
| `npm run dev` | From `.env.local` or default (Railway prod URL) | Normal dev / hybrid |
| `npm run dev:local` | `http://localhost:8080` | Local .NET backend only |
| `npm run dev:remote` | `https://fbt-client-srs-service-production-c187.up.railway.app` | Remote backend only |

No code edits needed: use the script that matches the backend you want.

```bash
# Local .NET backend (e.g. running on port 8080)
npm run dev:local

# Remote backend (Railway production)
npm run dev:remote

# Default: uses .env.local EXTERNAL_API_URL, or fallback to remote URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). All API calls from the browser go to the same origin; the server proxies to the selected backend.

## Testing matrix

| Scenario | Command | Backend | Verify with |
|----------|---------|---------|-------------|
| **Local** | `npm run dev:local` | Local .NET (e.g. :8080) | `GET /api/_debug/backend` → `backendUrl: "http://localhost:8080"` |
| **Hybrid** | `npm run dev` with `EXTERNAL_API_URL=http://localhost:8080` in `.env.local` | Local | Same as above |
| **Remote** | `npm run dev:remote` | Railway prod | `GET /api/_debug/backend` → `backendUrl` = Railway URL |
| **Prod** | Deploy with `EXTERNAL_API_URL` set in host env | Your configured backend | Check debug endpoint on host (if exposed) or logs |

## Debug endpoint

- **GET `/api/_debug/backend`**  
  Returns JSON: `{ backendUrl, nodeEnv }`. No secrets or tokens. Use it to confirm which backend the server is using.

**Quick manual test:**

1. `npm run dev:local` → open http://localhost:3000/api/_debug/backend → expect `backendUrl: "http://localhost:8080"`.
2. `npm run dev:remote` → open http://localhost:3000/api/_debug/backend → expect `backendUrl` to be the Railway URL.
3. Log in and use the app; proxied requests log one line per request: `requestId`, `path`, `status` (no headers or tokens).

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub](https://github.com/vercel/next.js)

## Deploy

For production, set `EXTERNAL_API_URL` in your host’s environment (e.g. Vercel, Railway). See [Next.js deploying](https://nextjs.org/docs/app/building-your-application/deploying).
