# Container Authentication Troubleshooting

## Current Issue
Getting "Unauthorized" error when pushing container images, even with Containers:Edit permission.

## Required API Token Permissions

Your API token MUST have ALL of these permissions:

1. **Account → Containers → Edit** ✅ (You have this)
2. **Account → Workers Scripts → Edit**
3. **Account → Workers KV Storage → Edit**
4. **Account → D1 → Edit**
5. **Account → Account Settings → Read** (Important for registry access)

## Critical Steps

### 1. Verify Token in GitHub Secrets
- Go to: https://github.com/fleetapps/shipit/settings/secrets/actions
- Verify `CLOUDFLARE_API_TOKEN` has the NEW token value
- If you created a new token, you MUST update this secret

### 2. Verify Token Permissions
Go to: https://dash.cloudflare.com/profile/api-tokens

Your token should have:
- ✅ Account → Containers → Edit
- ✅ Account → Workers Scripts → Edit  
- ✅ Account → Account Settings → Read (CRITICAL - needed for registry)
- ✅ Account → D1 → Edit
- ✅ Account → Workers KV Storage → Edit

### 3. Test Token Locally
```bash
# Test if token can access containers API
curl -X GET "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/containers" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

If this returns 401, the token doesn't have the right permissions.

### 4. Alternative: Use Cloudflare Registry Login
Wrangler might need Docker to be authenticated separately:

```bash
# Login to Cloudflare container registry
docker login registry.cloudflare.com -u YOUR_EMAIL -p YOUR_API_TOKEN
```

However, this shouldn't be necessary if the API token has correct permissions.

## Most Likely Issue

The new API token hasn't been updated in GitHub Secrets. The workflow is still using the old token.

**Action Required:**
1. Copy your NEW API token (the one with Containers:Edit)
2. Go to GitHub Secrets: https://github.com/fleetapps/shipit/settings/secrets/actions
3. Edit `CLOUDFLARE_API_TOKEN` 
4. Paste the NEW token value
5. Save
6. Re-run the workflow

