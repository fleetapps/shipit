# Fixing "Unauthorized" Error for Container Registry Push

## Root Cause

Based on research and GitHub issues (e.g., #9898), the "Unauthorized" error when pushing container images typically occurs because:

1. **Missing "Account Settings: Read" Permission** - This is REQUIRED for container registry access, even if you have "Containers:Edit"
2. **Token not updated in GitHub Secrets** - The workflow uses the secret, not your local token
3. **Token propagation delay** - Permissions can take a few minutes to propagate

## Required Permissions (ALL of these)

Your API token MUST have:

✅ **Account → Containers → Edit** (you have this)
✅ **Account → Account Settings → Read** (CRITICAL - often missing!)
✅ **Account → Workers Scripts → Edit**
✅ **Account → D1 → Edit**
✅ **Account → Workers KV Storage → Edit**

## Step-by-Step Fix

### 1. Update Your API Token Permissions

Go to: https://dash.cloudflare.com/profile/api-tokens

1. Find your API token (or create a new one)
2. Click "Edit"
3. **CRITICALLY IMPORTANT**: Add **"Account → Account Settings → Read"** permission
4. Ensure all these permissions are present:
   - Account → Containers → Edit
   - Account → Account Settings → Read ⚠️ **THIS IS THE KEY ONE**
   - Account → Workers Scripts → Edit
   - Account → D1 → Edit
   - Account → Workers KV Storage → Edit
5. Save the token

### 2. Update GitHub Secret

**CRITICAL**: After updating permissions, you MUST update GitHub Secrets:

1. Go to: https://github.com/fleetapps/shipit/settings/secrets/actions
2. Click on `CLOUDFLARE_API_TOKEN`
3. Click "Update"
4. Paste your **NEW** token value (or the updated token)
5. Save

**Note**: If you created a completely new token, you MUST update the secret. If you just updated permissions on the existing token, the secret should still work, but double-check it's the right token.

### 3. Wait 2-3 Minutes

After updating permissions, wait 2-3 minutes for them to propagate across Cloudflare's systems.

### 4. Re-run the Workflow

1. Go to: https://github.com/fleetapps/shipit/actions
2. Click "Re-run all jobs" on the latest workflow
3. Or push a new commit to trigger a fresh run

## Verification

The workflow now includes a token verification step that will:
- Verify your token is active
- Show you what permissions are required
- Help diagnose if the token is the issue

## Why "Account Settings: Read" is Required

Cloudflare's container registry requires access to account-level settings to authenticate Docker pushes. This is separate from the "Containers:Edit" permission which allows managing containers, but not necessarily pushing images to the registry.

## Alternative: Test Token Locally First

Before running the full deployment, test if your token works:

```bash
# Test token verification
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"

# Test container API access
curl -X GET "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/containers" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

If both return success (not 401), your token should work for deployment.

## Still Not Working?

If you've:
1. ✅ Added "Account Settings: Read" permission
2. ✅ Updated GitHub Secret with the correct token
3. ✅ Waited 2-3 minutes
4. ✅ Verified token works with curl

And it still fails, check:
- Is the token expired?
- Are you using the correct account ID?
- Is there a Cloudflare service outage? (check https://www.cloudflarestatus.com/)

