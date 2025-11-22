# Step-by-Step Guide: Updating Environment Variables in Vercel Dashboard

Follow these steps to ensure all your environment variables are scoped to **Production**.

## Step 1: Access Your Vercel Project

1. **Open your browser** and go to [vercel.com](https://vercel.com)
2. **Sign in** to your Vercel account
3. **Click on your project** from the dashboard (the "CollegeLeaveFlow-1" project)

## Step 2: Navigate to Environment Variables

1. **Click on "Settings"** in the top navigation bar
2. **Click on "Environment Variables"** in the left sidebar
   - You should see a list of all your environment variables

## Step 3: Check Each Environment Variable

For **EACH** environment variable in the list, follow these steps:

### For Each Variable:

1. **Click on the variable name** (or the edit/pencil icon)
   - This opens the variable details

2. **Look at the "Environment" section**
   - You'll see checkboxes for:
     - ☐ Production
     - ☐ Preview  
     - ☐ Development

3. **Make sure "Production" is CHECKED** ✅
   - This is the most important step!
   - You can also check "Preview" if you want, but **Production is required**

4. **Click "Save"** (or "Update") to save the changes

5. **Repeat for the next variable**

## Step 4: Required Variables Checklist

Go through this list and verify each one has **Production** checked:

### Server-side Variables:
- [ ] `NODE_ENV` 
  - Value should be: `production`
  - **Must have Production checked** ✅

- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY`
  - Value: Your Firebase service account JSON (minified, single line)
  - **Must have Production checked** ✅

- [ ] `FIREBASE_PROJECT_ID`
  - Value: Your Firebase project ID
  - **Must have Production checked** ✅

- [ ] `GUARDIAN_TOKEN_SECRET`
  - Value: A random secret key for token generation
  - **Must have Production checked** ✅

### Client-side Variables (start with VITE_):
- [ ] `VITE_FIREBASE_API_KEY`
  - Value: Your Firebase API key
  - **Must have Production checked** ✅

- [ ] `VITE_FIREBASE_PROJECT_ID`
  - Value: Your Firebase project ID
  - **Must have Production checked** ✅

- [ ] `VITE_FIREBASE_APP_ID`
  - Value: Your Firebase app ID
  - **Must have Production checked** ✅

- [ ] `VITE_FIREBASE_AUTH_DOMAIN` (optional)
  - Value: `your-project-id.firebaseapp.com`
  - **Must have Production checked** ✅ (if you're using it)

- [ ] `VITE_FIREBASE_STORAGE_BUCKET` (optional)
  - Value: `your-project-id.firebasestorage.app`
  - **Must have Production checked** ✅ (if you're using it)

## Step 5: Adding Missing Variables (If Needed)

If any variable is missing, add it:

1. **Click "Add New"** button (usually at the top right)
2. **Enter the variable name** (e.g., `NODE_ENV`)
3. **Enter the variable value** (e.g., `production`)
4. **Check the "Production" checkbox** ✅
5. **Optionally check "Preview"** if you want it in preview deployments too
6. **Click "Save"**

## Step 6: Verify All Variables Are Set for Production

1. **Scroll through the entire list** of environment variables
2. **For each variable**, look at the "Environment" column
3. **Verify it shows "Production"** (or shows all three: Production, Preview, Development)
4. **If any variable only shows "Development" or "Preview"**, click on it and add "Production"

## Step 7: Important - Redeploy After Changes

⚠️ **CRITICAL**: After updating environment variables, you MUST redeploy for changes to take effect!

### Option A: Redeploy via Dashboard
1. Go to **"Deployments"** tab
2. Find your latest deployment
3. Click the **three dots (⋯)** menu
4. Select **"Redeploy"**
5. Make sure it says **"Production"** deployment

### Option B: Redeploy via Git Push
```bash
git commit --allow-empty -m "Trigger production redeploy"
git push origin main
```

### Option C: Redeploy via CLI
```bash
vercel --prod
```

## Visual Guide - What You Should See

### ✅ CORRECT - Production Enabled:
```
Variable Name: NODE_ENV
Value: production
Environment: ✅ Production  ✅ Preview  ☐ Development
```

### ❌ WRONG - Only Development:
```
Variable Name: NODE_ENV
Value: production
Environment: ☐ Production  ☐ Preview  ✅ Development
```

### ✅ ALSO CORRECT - All Environments:
```
Variable Name: NODE_ENV
Value: production
Environment: ✅ Production  ✅ Preview  ✅ Development
```

## Common Issues & Solutions

### Issue: Can't find "Environment Variables" in Settings
**Solution**: Make sure you're in the project settings, not account settings. Click on your project first, then Settings.

### Issue: Variable exists but Production is not checked
**Solution**: Click on the variable, check the "Production" box, and click Save.

### Issue: Variable is missing
**Solution**: Click "Add New", enter the name and value, check "Production", and save.

### Issue: Changes not taking effect after redeploy
**Solution**: 
1. Double-check that "Production" is checked for all variables
2. Make sure you're redeploying to Production (not Preview)
3. Wait a few minutes and check again
4. Clear your browser cache if testing the app

## Quick Verification Checklist

Before redeploying, verify:

- [ ] All environment variables have "Production" checked
- [ ] `NODE_ENV=production` exists and has Production scope
- [ ] All Firebase variables are present and have Production scope
- [ ] All VITE_ variables are present and have Production scope
- [ ] You're ready to trigger a new deployment

## After Updating Variables

1. **Redeploy your application** (see Step 7 above)
2. **Wait for deployment to complete** (usually 2-5 minutes)
3. **Check the build logs** to verify `NODE_ENV=production` is being used
4. **Test your production URL** to ensure everything works

## Need Help?

If you encounter any issues:
- Take a screenshot of your Environment Variables page
- Check the deployment logs for errors
- Verify you're in the correct Vercel project
- Make sure you have the right permissions (owner/admin)

---

**Remember**: The key is ensuring **every single environment variable** has the **"Production" checkbox checked**. This is what makes your app deploy to production instead of development!


