# Hackathon

A full-stack TypeScript application deployed as a single Cloudflare Worker:

- React and Vite frontend
- Cloudflare Worker API under `/api/*`
- Workers Static Assets for the production frontend

## Development

```sh
pnpm install
pnpm dev
```

Open <http://localhost:5173>. The Vite development server runs both the React app and Worker API in the Workers runtime.

## Commands

- `pnpm dev` starts local development with hot module replacement.
- `pnpm check` runs linting, TypeScript, the production build, and a dry-run deployment.
- `pnpm preview` builds and previews the app in the Workers runtime.
- `pnpm cf-typegen` regenerates Worker binding types after changing `wrangler.jsonc`.
- `pnpm deploy` builds and deploys the Worker and frontend assets.

Authenticate with `pnpm wrangler login` before the first deployment.
