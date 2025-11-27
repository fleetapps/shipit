# GitHub Actions Deployment Setup

This workflow automatically deploys your VibeSDK app to Cloudflare Workers when you push to the `main` or `master` branch.

## Setup Instructions

### 1. Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these **required** secrets:

#### Essential Secrets:
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

#### Optional but Recommended:
- `CLOUDFLARE_AI_GATEWAY_TOKEN` - AI Gateway token (if using AI Gateway)
- `CLOUDFLARE_AI_GATEWAY_URL` - AI Gateway URL (if using AI Gateway)
- `GOOGLE_AI_STUDIO_API_KEY` - Google AI Studio API key
- `JWT_SECRET` - Random secret for JWT tokens (generate with: `openssl rand -hex 32`)
- `WEBHOOK_SECRET` - Random secret for webhooks (generate with: `openssl rand -hex 32`)

#### Optional:
- `ANTHROPIC_API_KEY` - Anthropic API key
- `OPENAI_API_KEY` - OpenAI API key
- `OPENROUTER_API_KEY` - OpenRouter API key
- `GROQ_API_KEY` - Groq API key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `GITHUB_EXPORTER_CLIENT_ID` - GitHub exporter client ID
- `GITHUB_EXPORTER_CLIENT_SECRET` - GitHub exporter client secret
- `CUSTOM_DOMAIN` - Your custom domain (e.g., `yourdomain.com`)
- `MAX_SANDBOX_INSTANCES` - Max sandbox instances (default: 10)
- `SANDBOX_INSTANCE_TYPE` - Sandbox instance type (default: standard-3)

### 2. Generate Required Secrets

If you don't have `JWT_SECRET` or `WEBHOOK_SECRET`, generate them:

```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate WEBHOOK_SECRET  
openssl rand -hex 32
```

### 3. Push to GitHub

Once you've added the secrets:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"
git push origin main
```

The workflow will automatically run and deploy your app!

### 4. Manual Deployment

You can also trigger the workflow manually:
- Go to **Actions** tab in GitHub
- Select **Deploy to Cloudflare** workflow
- Click **Run workflow**

## Workflow Details

- **Triggers**: 
  - Push to `main` or `master` branch
  - Manual trigger from GitHub UI
- **Runs on**: Ubuntu Latest (Linux)
- **Steps**:
  1. Checkout code
  2. Setup Bun and Node.js
  3. Install dependencies
  4. Create `.prod.vars` from GitHub secrets
  5. Deploy to Cloudflare using `bun run deploy`

## Troubleshooting

### Deployment Fails
- Check that all required secrets are set
- Verify your Cloudflare API token has the correct permissions
- Check the Actions logs for specific error messages

### Missing Secrets
- The workflow will fail if required secrets are missing
- Add any missing secrets to your repository settings

### Build Errors
- Check that your code compiles: `pnpm run build`
- Ensure all dependencies are in `package.json`

