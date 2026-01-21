# Migration Checklist: fleet.ke → ellement.dev

This document outlines all steps required to migrate from `fleet.ke` to `ellement.dev` domain.

## ✅ Codebase Changes (Already Done)

- [x] Updated `CUSTOM_DOMAIN` in `wrangler.jsonc` vars: `app.ellement.dev`
- [x] Updated `CUSTOM_PREVIEW_DOMAIN` in `wrangler.jsonc` vars: `ellement.dev`
- [x] Updated routes in `wrangler.jsonc`:
  - Main domain route: `app.ellement.dev` (custom_domain: true)
  - Wildcard route: `*.ellement.dev/*` (for preview apps)

## 🔧 Cloudflare Dashboard Configuration

### 1. Domain Zone Setup

**Required:** Ensure `ellement.dev` zone exists in your Cloudflare account.

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Verify `ellement.dev` zone is added and active
3. If not, add the zone:
   - Click "Add a Site"
   - Enter `ellement.dev`
   - Follow DNS setup wizard

### 2. Advanced Certificate Manager (Required for First-Level Subdomain)

**Critical:** Since you're using `app.ellement.dev` (first-level subdomain), you **must** enable Advanced Certificate Manager.

1. In Cloudflare Dashboard → `ellement.dev` zone
2. Go to **SSL/TLS** → **Edge Certificates**
3. Scroll to **Advanced Certificate Manager**
4. Enable the add-on (may require paid plan)
5. This enables wildcard certificates for `*.ellement.dev` preview apps

### 3. DNS Records Configuration

#### Main Domain (app.ellement.dev)

The main domain should be handled by Cloudflare Workers routes automatically. Verify:

1. Go to **DNS** → **Records** in `ellement.dev` zone
2. Ensure there's a route configured in Workers (handled by `wrangler.jsonc` routes)
3. If needed, add a CNAME record:
   - **Type:** `CNAME`
   - **Name:** `app`
   - **Target:** `vibesdk-production.workers.dev` (or your worker name)
   - **Proxy status:** **Proxied** (orange cloud) ✅

#### Wildcard CNAME for Preview Apps (REQUIRED)

**This is critical for preview apps to work!**

1. Go to **DNS** → **Records** in `ellement.dev` zone
2. Add a new record:
   - **Type:** `CNAME`
   - **Name:** `*.ellement` (note: just `*.ellement`, not `*.ellement.dev`)
   - **Target:** `app.ellement.dev` (or `ellement.dev` - your base domain)
   - **Proxy status:** **Proxied** (orange cloud) ✅

**Important Notes:**
- The wildcard pattern `*.ellement` will match `anything.ellement.dev`
- DNS propagation can take up to 1 hour
- Preview apps will use subdomains like `abc123.ellement.dev`

### 4. Workers Routes Configuration

Routes are configured in `wrangler.jsonc` and will be applied on deployment:

- **Main route:** `app.ellement.dev` (custom_domain: true)
- **Wildcard route:** `*.ellement.dev/*` (for preview apps)

After deployment, verify in Cloudflare Dashboard:
1. Go to **Workers & Pages** → Your worker
2. Go to **Triggers** → **Routes**
3. Verify routes are listed:
   - `app.ellement.dev/*`
   - `*.ellement.dev/*`

### 5. OAuth Provider Updates (If Configured)

If you have OAuth (Google/GitHub) configured, update callback URLs:

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Update **Authorized JavaScript origins:**
   - Add: `https://app.ellement.dev`
   - Remove old: `https://anything.fleet.ke` (if exists)
5. Update **Authorized redirect URIs:**
   - Add: `https://app.ellement.dev/api/auth/callback/google`
   - Remove old: `https://anything.fleet.ke/api/auth/callback/google` (if exists)

#### GitHub OAuth (Login)

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Find your OAuth app
3. Update **Homepage URL:**
   - Change to: `https://app.ellement.dev`
4. Update **Authorization callback URL:**
   - Change to: `https://app.ellement.dev/api/auth/callback/github`

#### GitHub OAuth (Export)

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Find your GitHub Export OAuth app (separate from login)
3. Update **Authorization callback URL:**
   - Change to: `https://app.ellement.dev/api/github-exporter/callback`

### 6. Environment Variables / Secrets

Verify these are set correctly in Cloudflare Workers:

1. Go to **Workers & Pages** → Your worker → **Settings** → **Variables**
2. Verify:
   - `CUSTOM_DOMAIN` = `app.ellement.dev`
   - `CUSTOM_PREVIEW_DOMAIN` = `ellement.dev`

Or set via Wrangler CLI:
```bash
npx wrangler secret put CUSTOM_DOMAIN
# Enter: app.ellement.dev

npx wrangler secret put CUSTOM_PREVIEW_DOMAIN
# Enter: ellement.dev
```

## 🚀 Deployment Steps

1. **Commit code changes:**
   ```bash
   git add wrangler.jsonc
   git commit -m "Migrate domain from fleet.ke to ellement.dev"
   git push
   ```

2. **Deploy to Cloudflare:**
   ```bash
   npm run deploy
   # or
   npx wrangler deploy
   ```

3. **Verify deployment:**
   - Check Workers dashboard for successful deployment
   - Verify routes are active

## ✅ Post-Deployment Verification

### 1. Main Domain Access

- [ ] Visit `https://app.ellement.dev` - should load the app
- [ ] Check browser console for errors
- [ ] Verify authentication works (if OAuth is configured)

### 2. Preview Apps

- [ ] Create a new app or session
- [ ] Verify preview URL format: `https://<deployment-id>.ellement.dev`
- [ ] Preview app should load correctly
- [ ] Check that wildcard DNS is working

### 3. OAuth (If Configured)

- [ ] Test Google OAuth login
- [ ] Test GitHub OAuth login
- [ ] Verify callback URLs work correctly

### 4. DNS Propagation

- [ ] Use `dig` or online DNS checker to verify:
  ```bash
  dig app.ellement.dev
  dig *.ellement.dev
  ```
- [ ] Wait up to 1 hour for full propagation

## 🔍 Troubleshooting

### Preview Apps Not Loading

**Symptom:** Preview URLs return 404 or don't resolve

**Solutions:**
1. Verify wildcard CNAME record exists: `*.ellement` → `app.ellement.dev`
2. Check DNS propagation: `dig test.ellement.dev`
3. Verify Advanced Certificate Manager is enabled
4. Check Workers routes include `*.ellement.dev/*`
5. Wait up to 1 hour for DNS propagation

### SSL Certificate Errors

**Symptom:** Browser shows SSL certificate warnings

**Solutions:**
1. Ensure Advanced Certificate Manager is enabled
2. Verify domain is proxied (orange cloud) in DNS
3. Wait for certificate provisioning (can take 15-30 minutes)

### OAuth Callbacks Failing

**Symptom:** OAuth redirects fail with "redirect_uri_mismatch"

**Solutions:**
1. Verify callback URLs in OAuth provider match exactly:
   - `https://app.ellement.dev/api/auth/callback/google`
   - `https://app.ellement.dev/api/auth/callback/github`
2. Check for trailing slashes (should not have them)
3. Verify domain is accessible (DNS propagated)

## 📝 Notes

- **Old domain (`fleet.ke`):** Can be removed from Cloudflare after migration is verified
- **DNS propagation:** Can take up to 1 hour globally
- **Certificate provisioning:** Can take 15-30 minutes after DNS is configured
- **No code changes needed:** OAuth callbacks are built dynamically from request URL

## 🎯 Quick Reference

| Item | Old Value | New Value |
|------|-----------|-----------|
| Main Domain | `anything.fleet.ke` | `app.ellement.dev` |
| Preview Domain | `*.fleet.ke` | `*.ellement.dev` |
| CUSTOM_DOMAIN var | `app.ellement.dev` | `app.ellement.dev` ✅ |
| CUSTOM_PREVIEW_DOMAIN var | `ellement.dev` | `ellement.dev` ✅ |
| Google OAuth Callback | `https://anything.fleet.ke/api/auth/callback/google` | `https://app.ellement.dev/api/auth/callback/google` |
| GitHub OAuth Callback | `https://anything.fleet.ke/api/auth/callback/github` | `https://app.ellement.dev/api/auth/callback/github` |
