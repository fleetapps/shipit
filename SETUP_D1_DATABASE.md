# Setting Up D1 Database

The deployment requires a D1 database named `vibesdk-db`. You can create it manually or update your API token permissions.

## Option 1: Create Database Manually (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **D1**
3. Click **Create database**
4. Name it: `vibesdk-db`
5. Click **Create**
6. Copy the **Database ID** (it will look like: `c4721a2b-b96a-428a-8b2a-b3d255b307e9`)
7. Update `wrangler.jsonc` with the database ID:

```jsonc
"d1_databases": [
    {
        "binding": "DB",
        "database_name": "vibesdk-db",
        "database_id": "YOUR_DATABASE_ID_HERE",  // Replace with the ID from step 6
        "migrations_dir": "migrations",
        "remote": true
    }
],
```

8. Commit and push the change:
```bash
git add wrangler.jsonc
git commit -m "chore: update D1 database ID"
git push
```

## Option 2: Update API Token Permissions

If you want the workflow to create the database automatically:

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Find your token (or create a new one)
3. Edit the token
4. Add these permissions:
   - **Account** → **D1** → **Edit**
   - **Account** → **Workers Scripts** → **Edit**
   - **Account** → **Workers KV Storage** → **Edit** (if using KV)
   - **Account** → **Workers R2 Storage** → **Edit** (if using R2)
5. Save the token
6. Update the `CLOUDFLARE_API_TOKEN` secret in GitHub with the new token

## After Database is Created

Once the database exists, run database migrations:

```bash
# From your local machine (if you have wrangler installed)
wrangler d1 migrations apply vibesdk-db --remote

# Or it will run automatically during deployment if configured
```

## Verify Database

To verify the database was created:

```bash
wrangler d1 list
```

You should see `vibesdk-db` in the list.

