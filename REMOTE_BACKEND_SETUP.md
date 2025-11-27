# Remote Backend Setup Guide

## Quick Summary
- **Time**: 15-30 minutes (if moving fast)
- **Difficulty**: Easy to Medium
- **What you'll do**: Deploy backend to Cloudflare, configure frontend to use it

---

## Step 1: Prepare Your Cloudflare Credentials (2 min)

1. **Get your Account ID**:
   - Go to https://dash.cloudflare.com
   - Click on your account in the right sidebar
   - Copy your **Account ID** (looks like: `dfcbe8f5597070531440cae35b767a98`)

2. **Verify your API Token**:
   - You already have it in `.dev.vars`
   - Make sure it has these permissions:
     - Account → Workers Scripts → Edit
     - Account → D1 → Edit
     - Account → Workers KV Storage → Edit
     - Account → Workers R2 Storage → Edit
     - Account → Account Settings → Read

---

## Step 2: Fix Your .dev.vars File (1 min)

Your `.dev.vars` file has some formatting issues. Clean it up:

```bash
# Open .dev.vars and make sure it looks like this:
CLOUDFLARE_API_TOKEN="tyq6wYvEZ46qKttwtXwgdfHGiEio7XT6xU68PiOj"
CLOUDFLARE_ACCOUNT_ID="your-account-id-here"  # Replace with your actual Account ID
ENVIRONMENT="dev"  # This allows localhost CORS
CUSTOM_DOMAIN=""  # Leave empty for now, or use workers.dev subdomain
```

**Important**: Set `ENVIRONMENT="dev"` so localhost origins are allowed for CORS.

---

## Step 3: Deploy Backend to Cloudflare (10-15 min)

### ⚠️ IMPORTANT: Path Resolution Issue

Wrangler's bundler doesn't understand TypeScript path aliases (`shared/*`, `worker/*`). You have two options:

### Option A: Install Bun and Use Deploy Script (Easiest)

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Then use the deploy script
bun run deploy
```

This script handles path resolution automatically.

### Option B: Manual Wrangler Deploy (Requires Fix)

If you want to use `npx wrangler deploy` directly, you'll need to fix the path alias resolution first. This is a known limitation - wrangler's esbuild doesn't support TypeScript path mappings.

**Workaround**: The project needs a build step that resolves paths before wrangler bundles. This is complex and the deploy script handles it automatically.

**Recommendation**: Use Option A (install Bun and use the deploy script).

**What this does**:
- Builds the worker
- Deploys to Cloudflare Workers
- Uses your `.dev.vars` file for configuration

**After deployment**, note the URL. It will be something like:
- `https://vibesdk-production.your-subdomain.workers.dev` (if using workers.dev)
- OR your custom domain if configured

**Important**: The deployment output will show your worker URL. Copy it!

### Option B: Set Secrets Manually (If needed)

If you need to set secrets separately:

```bash
# Set secrets one by one (will prompt for value)
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put JWT_SECRET
npx wrangler secret put WEBHOOK_SECRET
# Add other secrets as needed
```

**Note**: Secrets in `.dev.vars` are automatically used during `wrangler deploy`, but for production you may want to set them as secrets in the Cloudflare dashboard for better security.

---

## Step 4: Configure Frontend to Use Remote Backend (2 min)

1. **Create a `.env.local` file** in the project root:

```bash
# Create the file
touch .env.local
```

2. **Add your deployed backend URL**:

```bash
# .env.local
VITE_API_BASE_URL=https://vibesdk-production.your-subdomain.workers.dev
```

**Replace** `your-subdomain.workers.dev` with your actual deployed URL.

**To find your URL**:
- Check the deployment output
- Or go to Cloudflare Dashboard → Workers & Pages → Your worker name → View URL

---

## Step 5: Update CORS on Backend (If Needed) (3 min)

If you get CORS errors, you need to allow your localhost origin:

1. **Option 1: Keep ENVIRONMENT="dev"** (Easiest)
   - This already allows `http://localhost:5173`
   - Make sure `.dev.vars` has `ENVIRONMENT="dev"`

2. **Option 2: Add localhost to CUSTOM_DOMAIN** (If using production mode)
   - This is more complex, stick with Option 1

---

## Step 6: Test the Connection (2 min)

1. **Start your frontend**:

```bash
pnpm dev
```

2. **Open browser console** (F12) and check:
   - No CORS errors
   - Network tab shows requests going to your deployed backend URL
   - API calls return responses (not 404s)

3. **Try to sign in**:
   - You should be able to register/login
   - If you see errors, check the console for details

---

## Troubleshooting

### CORS Errors

**Error**: `Access to fetch at '...' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Fix**:
1. Make sure `.dev.vars` has `ENVIRONMENT="dev"`
2. Redeploy: `bun run deploy`
3. Or manually set the environment variable in Cloudflare Dashboard:
   - Workers & Pages → Your worker → Settings → Variables
   - Add: `ENVIRONMENT` = `dev`

### 404 Errors

**Error**: `404 Not Found` on API calls

**Fix**:
1. Check your `VITE_API_BASE_URL` in `.env.local`
2. Make sure it doesn't have a trailing slash
3. Verify the worker is deployed and running

### Authentication Errors

**Error**: Can't sign in or register

**Fix**:
1. Check that database migrations ran: `npx wrangler d1 migrations apply vibesdk-db --remote`
2. Verify secrets are set in Cloudflare Dashboard
3. Check browser console for specific error messages

---

## Quick Reference

**Your deployed backend URL**: `_________________________` (fill this in after deployment)

**Frontend will run on**: `http://localhost:5173`

**Backend API calls will go to**: `https://your-deployed-url.workers.dev/api/...`

---

## Next Steps

Once this works:
- You can develop the frontend locally
- All API calls will go to your deployed backend
- The AI functionality will work (as long as API keys are configured)
- You can test the full app experience

**Note**: WebSocket connections for real-time chat might need additional configuration if using a custom domain.

