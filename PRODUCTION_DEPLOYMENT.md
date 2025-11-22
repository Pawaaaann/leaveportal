# How to Deploy to Production in Vercel

This guide provides step-by-step instructions to ensure your application deploys to **Production** instead of Development.

## Step 1: Check Your Vercel Project Settings

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com) and sign in
   - Select your project

2. **Check Production Branch**
   - Go to **Settings** → **Git**
   - Under "Production Branch", ensure it's set to `main` (or your production branch)
   - This determines which branch triggers production deployments

## Step 2: Update Environment Variables (CRITICAL)

This is the **most common issue** - environment variables must be scoped to Production.

1. **Go to Environment Variables**
   - In your Vercel project, click **Settings** → **Environment Variables**

2. **For Each Variable, Check Production Scope**
   - Click on each environment variable
   - In the "Environment" section, make sure **"Production"** is checked ✅
   - You can also check "Preview" if you want, but **Production is required**
   - Click **Save**

3. **Required Variables to Check:**
   ```
   NODE_ENV (should be set to "production")
   FIREBASE_SERVICE_ACCOUNT_KEY
   FIREBASE_PROJECT_ID
   GUARDIAN_TOKEN_SECRET
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_APP_ID
   ```

4. **Quick Fix - Bulk Update:**
   - If you have many variables, you can:
     - Delete and re-add them, making sure to select "Production" this time
     - Or use the Vercel CLI (see below)

## Step 3: Trigger a Production Deployment

### Option A: Via Git Push (Automatic)

1. **Push to Production Branch**
   ```bash
   git add .
   git commit -m "Configure for production deployment"
   git push origin main
   ```
   - Vercel will automatically deploy to production if your production branch is `main`

### Option B: Via Vercel Dashboard

1. **Go to Deployments Tab**
   - Click on **Deployments** in your project
   - Find the latest deployment
   - Click the **three dots (⋯)** menu
   - Select **"Promote to Production"**

### Option C: Via Vercel CLI

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy to Production**
   ```bash
   vercel --prod
   ```
   ⚠️ **Important**: The `--prod` flag is required! Without it, it deploys to preview.

## Step 4: Verify Production Deployment

1. **Check Deployment URL**
   - Production deployments use your main domain (e.g., `your-project.vercel.app`)
   - Preview deployments have random URLs (e.g., `your-project-git-branch-username.vercel.app`)

2. **Check Build Logs**
   - Go to your deployment → **Build Logs**
   - Look for: `NODE_ENV=production` in the logs
   - You should see: `Running in production mode` or similar

3. **Check Environment Variables in Runtime**
   - In your deployment → **Functions** → View logs
   - The logs should show production mode behavior

4. **Test Your Application**
   - Visit your production URL
   - Test key features to ensure everything works

## Step 5: Fix Environment Variables via CLI (Alternative Method)

If you prefer using the CLI to set environment variables with Production scope:

```bash
# For each variable, run:
vercel env add VARIABLE_NAME production

# Example:
vercel env add NODE_ENV production
# When prompted, enter: production

vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
# When prompted, paste your Firebase service account JSON (minified)

vercel env add FIREBASE_PROJECT_ID production
# When prompted, enter your Firebase project ID

vercel env add GUARDIAN_TOKEN_SECRET production
# When prompted, enter a random secret key

vercel env add VITE_FIREBASE_API_KEY production
# When prompted, enter your Firebase API key

vercel env add VITE_FIREBASE_PROJECT_ID production
# When prompted, enter your Firebase project ID

vercel env add VITE_FIREBASE_APP_ID production
# When prompted, enter your Firebase app ID
```

## Troubleshooting

### Issue: Still deploying to development/preview

**Solution 1: Check Environment Variable Scopes**
- Go to Settings → Environment Variables
- Verify each variable has "Production" checked
- If not, edit each one and check "Production"

**Solution 2: Check Production Branch**
- Go to Settings → Git
- Ensure "Production Branch" is set correctly
- Only pushes to this branch trigger production deployments

**Solution 3: Force Production Deployment**
```bash
vercel --prod --force
```

**Solution 4: Check Build Command**
- Go to Settings → General
- Verify "Build Command" shows: `cross-env NODE_ENV=production npm run build`
- If not, update it manually

### Issue: Environment variables not working in production

**Solution:**
1. Go to Settings → Environment Variables
2. For each variable, click "Edit"
3. Make sure "Production" is checked
4. Click "Save"
5. **Redeploy** (environment variable changes require a new deployment)

### Issue: NODE_ENV is still "development"

**Solution:**
1. Add `NODE_ENV=production` as an environment variable in Vercel
2. Set its scope to "Production"
3. Redeploy

## Quick Checklist

Before deploying, ensure:

- [ ] All environment variables have "Production" scope checked
- [ ] `NODE_ENV=production` is set as an environment variable with Production scope
- [ ] Production branch is set correctly (Settings → Git)
- [ ] Build command includes `NODE_ENV=production` (already done in `vercel.json`)
- [ ] You're deploying from the production branch OR using `vercel --prod`
- [ ] You've committed and pushed the latest changes

## After Deployment

1. **Verify Production URL**
   - Your production URL should be: `https://your-project.vercel.app`
   - Not a preview URL with random characters

2. **Check Function Logs**
   - Go to Deployments → Your deployment → Functions
   - Check logs for any errors
   - Verify `NODE_ENV=production` is being used

3. **Test Critical Features**
   - Login/Register
   - Leave application submission
   - Dashboard access
   - API endpoints

## Success Indicators

✅ Production deployment is successful when:
- URL is your main domain (not a preview URL)
- Build logs show `NODE_ENV=production`
- Application works correctly
- No development-specific warnings in logs
- Environment variables are accessible

---

**Need Help?**
- Check Vercel Dashboard → Deployments → Build Logs for errors
- Review Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Check that all environment variables have Production scope enabled


