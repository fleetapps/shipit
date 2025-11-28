# Alternative Solutions for Container Deployment

Since you're encountering API token permission issues with container registry authentication, here are several alternative approaches:

## Option 1: Use Pre-Built Container Image (Recommended)

**Push the container image manually once, then reference it in `wrangler.jsonc`:**

### Steps:

1. **Build and push container manually** (using a token with proper permissions locally):
   ```bash
   # Build the container
   docker build -f SandboxDockerfile -t registry.cloudflare.com/vibesdk-production-userappsandboxservice:latest .
   
   # Login to registry (use your account email and API token)
   docker login registry.cloudflare.com -u your-email@example.com -p YOUR_API_TOKEN
   
   # Push the image
   docker push registry.cloudflare.com/vibesdk-production-userappsandboxservice:latest
   ```

2. **Update `wrangler.jsonc` to use the pre-built image:**
   ```jsonc
   "containers": [
     {
       "class_name": "UserAppSandboxService",
       "image": "registry.cloudflare.com/vibesdk-production-userappsandboxservice:latest",
       // Remove the "./SandboxDockerfile" line
       "max_instances": 10,
       "instance_type": "standard-3",
       "rollout_step_percentage": 100
     }
   ]
   ```

3. **Deploy worker** (wrangler will use the existing image, no push needed)

**Pros:**
- Only need to push once manually
- GitHub Actions can deploy without container push permissions
- Faster deployments (no build step)

**Cons:**
- Need to manually update image when Dockerfile changes
- Requires local machine with Docker and proper permissions

---

## Option 2: Two-Step Deployment Process

**Separate container build/push from worker deployment:**

### Step 1: Create a separate workflow for container builds
Create `.github/workflows/build-container.yml`:
```yaml
name: Build and Push Container

on:
  workflow_dispatch: # Manual trigger only
  push:
    paths:
      - 'SandboxDockerfile'
      - 'container/**'

jobs:
  build-container:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Cloudflare Registry
        uses: docker/login-action@v3
        with:
          registry: registry.cloudflare.com
          username: ${{ secrets.CLOUDFLARE_ACCOUNT_EMAIL }}
          password: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./SandboxDockerfile
          push: true
          tags: registry.cloudflare.com/vibesdk-production-userappsandboxservice:latest
          platforms: linux/amd64
```

### Step 2: Update main deployment to use pre-built image
Modify `wrangler.jsonc` to reference the image URL instead of Dockerfile.

**Pros:**
- Container builds only when Dockerfile changes
- Can use different token for container builds
- Worker deployment is faster

**Cons:**
- More complex setup
- Two separate workflows to manage

---

## Option 3: Use Account-Owned API Token

**Create an account-level token instead of user-level:**

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Select **"Account"** scope instead of "User"
4. Grant permissions:
   - Account → Containers → Edit
   - Account → Account Settings → Read
   - Account → Workers Scripts → Edit
   - Account → D1 → Edit
5. Create token and update GitHub Secret

**Pros:**
- More reliable than user tokens
- Not tied to individual user
- Better for CI/CD

**Cons:**
- Still requires proper permissions
- May need account admin access

---

## Option 4: Deploy Worker First, Add Containers Later

**Deploy the worker without containers, then add containers via Cloudflare Dashboard:**

1. **Temporarily comment out containers** in `wrangler.jsonc`
2. **Deploy worker** (this will succeed)
3. **Add containers manually** via Cloudflare Dashboard:
   - Go to Workers & Pages → Your Worker → Settings → Containers
   - Upload container image or configure container settings

**Pros:**
- Worker deploys immediately
- Can add containers when ready
- No API token permission issues

**Cons:**
- Manual container management
- Containers not version-controlled with code
- More operational overhead

---

## Option 5: Use Cloudflare API Directly (Bypass Wrangler)

**Build container locally and push via Cloudflare API:**

Create a script that:
1. Builds Docker image locally
2. Gets registry credentials from Cloudflare API
3. Pushes to registry using Docker
4. Updates worker configuration via API

**Pros:**
- Full control over the process
- Can handle authentication more flexibly

**Cons:**
- Most complex solution
- Requires custom scripting
- More maintenance

---

## Recommended Approach

**I recommend Option 1 (Pre-Built Container Image)** because:
- ✅ Simplest to implement
- ✅ Only requires manual push when Dockerfile changes
- ✅ GitHub Actions can deploy without container permissions
- ✅ Fast deployments

### Quick Implementation:

1. **Push container once manually:**
   ```bash
   # On your local machine with proper permissions
   docker build -f SandboxDockerfile -t registry.cloudflare.com/vibesdk-production-userappsandboxservice:$(git rev-parse --short HEAD) .
   docker login registry.cloudflare.com -u developers@getboda.co.ke -p YOUR_API_TOKEN
   docker push registry.cloudflare.com/vibesdk-production-userappsandboxservice:$(git rev-parse --short HEAD)
   ```

2. **Update `wrangler.jsonc`:**
   ```jsonc
   "containers": [
     {
       "class_name": "UserAppSandboxService",
       "image": "registry.cloudflare.com/vibesdk-production-userappsandboxservice:YOUR_TAG",
       "max_instances": 10,
       "instance_type": "standard-3",
       "rollout_step_percentage": 100
     }
   ]
   ```

3. **Deploy via GitHub Actions** - it will use the existing image!

---

## Which Option Should You Choose?

- **Need containers working ASAP?** → Option 1 (Pre-built image)
- **Want automated container builds?** → Option 2 (Two-step deployment)
- **Have account admin access?** → Option 3 (Account-owned token)
- **Can manage containers manually?** → Option 4 (Deploy worker first)
- **Need maximum control?** → Option 5 (Direct API)

Let me know which approach you'd like to implement, and I can help set it up!

