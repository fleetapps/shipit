# Deployment Guide

## Quick Start: GitHub Actions Deployment

The easiest way to deploy is using GitHub Actions. This works on any machine and handles all the path resolution issues.

### Step 1: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

**Required:**
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

**Recommended:**
- `JWT_SECRET` - Generate with: `openssl rand -hex 32`
- `WEBHOOK_SECRET` - Generate with: `openssl rand -hex 32`
- `GOOGLE_AI_STUDIO_API_KEY` - Your Google AI Studio API key

**Optional:**
- `CLOUDFLARE_AI_GATEWAY_TOKEN` - If using AI Gateway
- `CUSTOM_DOMAIN` - Your custom domain
- Other API keys and OAuth credentials as needed

### Step 2: Push to GitHub

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment"
git push origin main
```

The workflow will automatically deploy when you push to `main` or `master`.

### Step 3: Get Your Deployment URL

After deployment:
1. Go to Cloudflare Dashboard → **Workers & Pages**
2. Find your worker (usually named `vibesdk-production`)
3. Copy the workers.dev URL (e.g., `https://vibesdk-production.xxxxx.workers.dev`)

### Step 4: Configure Frontend

Create `.env.local` in your project root:

```bash
VITE_API_BASE_URL=https://your-deployed-url.workers.dev
```

Replace `your-deployed-url` with your actual workers.dev URL.

Then run your frontend locally:

```bash
pnpm dev
```

## Manual Deployment (Alternative)

If you want to deploy manually from a compatible machine:

```bash
# Make sure you have .prod.vars configured
bun run deploy
```

**Note**: Manual deployment requires:
- macOS 13.5+ OR Linux
- Bun installed
- All environment variables in `.prod.vars`

## Troubleshooting

### GitHub Actions Fails
- Check that all required secrets are set
- Verify Cloudflare API token permissions
- Check Actions logs for specific errors

### Frontend Can't Connect
- Verify `VITE_API_BASE_URL` in `.env.local` matches your deployed URL
- Check that `ENVIRONMENT="dev"` is set in your deployed worker (for localhost CORS)
- Check browser console for CORS errors

### Authentication Errors
- Ensure database migrations ran: Check deployment logs
- Verify secrets are set correctly in GitHub
- Check that JWT_SECRET and WEBHOOK_SECRET are set

