# Fix: Templates R2 Bucket Issue

## The Problem

The code generation is failing because templates are fetched from an R2 bucket (`TEMPLATES_BUCKET`), but the R2 bucket binding is commented out in `wrangler.jsonc`.

**Error**: `Failed to fetch templates from sandbox service`

## Solution: Enable R2 Bucket

You need to create an R2 bucket and enable it in your configuration.

### Step 1: Create R2 Bucket in Cloudflare Dashboard

1. Go to: https://dash.cloudflare.com
2. Navigate to: **R2** → **Create bucket**
3. Name it: `vibesdk-templates`
4. Click **Create bucket**

### Step 2: Get the Bucket ID (Optional, but helpful)

1. Click on the bucket you just created
2. The bucket ID should be visible in the URL or bucket settings
3. Note it down (you might need it)

### Step 3: Deploy Templates to R2

The templates need to be uploaded to R2. You have two options:

#### Option A: Use the Deployment Script (Recommended)

The deployment script should automatically deploy templates. But since R2 was commented out, it might have been skipped. After enabling R2:

1. Uncomment the R2 bucket binding in `wrangler.jsonc` (see Step 4)
2. Redeploy - the script should automatically deploy templates

#### Option B: Manual Upload

If automatic deployment doesn't work:

1. Clone the templates repository:
   ```bash
   git clone https://github.com/cloudflare/vibesdk-templates.git
   cd vibesdk-templates
   ```

2. Run the deployment script:
   ```bash
   chmod +x deploy_templates.sh
   ./deploy_templates.sh
   ```

   This will upload templates to your R2 bucket.

### Step 4: Enable R2 Binding in wrangler.jsonc

Uncomment the R2 bucket section in `wrangler.jsonc`:

```jsonc
"r2_buckets": [
  {
    "binding": "TEMPLATES_BUCKET",
    "bucket_name": "vibesdk-templates",
    "remote": true
  }
],
```

### Step 5: Redeploy

After enabling R2 and deploying templates:

1. Commit the `wrangler.jsonc` change
2. Push to trigger GitHub Actions deployment
3. Or run `bun run deploy` locally

## Verify It's Working

After redeploying:

1. Try generating code again
2. The error should be gone
3. Templates should be available

## Alternative: Fetch Templates from GitHub (Future Enhancement)

Currently, templates must be in R2. A future enhancement could fetch templates directly from GitHub, but that's not implemented yet.

## Quick Fix Summary

1. ✅ Create R2 bucket `vibesdk-templates` in Cloudflare Dashboard
2. ✅ Uncomment R2 binding in `wrangler.jsonc`
3. ✅ Deploy templates (automatic via deployment script, or manual)
4. ✅ Redeploy worker
5. ✅ Test code generation

