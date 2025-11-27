# Manual Secret Upload Instructions

If you're getting 401 Unauthorized errors even after adding the secret to GitHub Secrets, the secret might not have been uploaded to your Cloudflare Worker. Follow these steps to manually upload it.

## Option 1: Using Wrangler CLI (Recommended)

1. **Make sure you have your API key ready:**
   - Get it from: https://aistudio.google.com/app/apikey
   - It should start with `AI...`

2. **Run this command locally:**
   ```bash
   # Set your Cloudflare credentials (if not already in .prod.vars)
   export CLOUDFLARE_API_TOKEN="your-token"
   export CLOUDFLARE_ACCOUNT_ID="your-account-id"
   
   # Upload the secret
   wrangler secret put GOOGLE_AI_STUDIO_API_KEY
   ```
   
   When prompted, paste your Google AI Studio API key and press Enter.

3. **Verify it was uploaded:**
   ```bash
   # List all secrets (names only, not values)
   wrangler secret list
   ```
   
   You should see `GOOGLE_AI_STUDIO_API_KEY` in the list.

## Option 2: Using Cloudflare Dashboard

1. **Go to your Cloudflare Dashboard:**
   - Navigate to: https://dash.cloudflare.com
   - Go to **Workers & Pages** → **vibesdk-production** → **Settings** → **Variables**

2. **Add the secret:**
   - Scroll down to the **Encrypted** section
   - Click **Add variable**
   - Name: `GOOGLE_AI_STUDIO_API_KEY`
   - Value: Paste your API key
   - Click **Save**

3. **Verify:**
   - You should see `GOOGLE_AI_STUDIO_API_KEY` listed under **Encrypted variables**

## Verify Your API Key is Valid

Test your API key directly:

```bash
# Test the API key (replace YOUR_API_KEY with your actual key)
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello"}]
    }]
  }'
```

If you get a 401 error, your API key is invalid or expired. Get a new one from: https://aistudio.google.com/app/apikey

## After Uploading

1. **No redeployment needed** - Secrets are available immediately
2. **Try code generation again** in your app
3. **Check Cloudflare logs** if it still fails (Observability → Logs)

## Common Issues

### Secret is empty in GitHub Secrets
- Even if the secret exists, it might be empty
- Go to GitHub Secrets and make sure the value is not blank

### Secret format is wrong
- Google AI Studio API keys start with `AI...`
- They should be at least 35 characters long
- Example format: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`

### Secret upload failed silently
- The `wrangler secret bulk` command might have failed
- Check the GitHub Actions logs for any warnings about secret updates
- Manually upload using Option 1 or 2 above

