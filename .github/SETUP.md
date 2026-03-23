# CI/CD Setup: npm Publishing via OIDC Trusted Publishing

## First publish (one-time, manual)

The package must exist on npm before OIDC can be configured. Publish manually once:

```bash
npm publish --access public
```

## Configure Trusted Publisher on npmjs.com

1. Go to npmjs.com → package `@mind-awake.life/mcp` → **Settings** → **Trusted Publishers**
2. Click **Add a Trusted Publisher** → select **GitHub Actions**
3. Fill in:
   - **GitHub owner:** `mind-systems`
   - **Repository:** `mind_mcp`
   - **Workflow filename:** `publish.yml`
4. Save

After this, CI publishes without any tokens — just push to `dev` or `main`.

## How publishing works

| Branch | npm tag | Command |
|--------|---------|---------|
| `main` | `latest` | `npm publish --tag latest --provenance` |
| `dev`  | `dev`    | `npm publish --tag dev --provenance` |

OIDC credentials are obtained automatically by GitHub Actions — no `NPM_TOKEN` secret needed.
