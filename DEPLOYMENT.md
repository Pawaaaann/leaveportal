# Vercel Deployment Guide

This guide will help you deploy your College Leave Flow application to Vercel.

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier is sufficient)
3. **Firebase Project** - Set up Firebase for authentication and database

## Step 1: Prepare Your Code

Make sure all your changes are committed to Git:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Your Project**
   - Click "Add New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Other (or leave as default)
   - **Root Directory**: `.` (root of your project)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

4. **Set Environment Variables**
   Click "Environment Variables" and add the following:

   #### Server-side Environment Variables:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY=<your-firebase-service-account-json-as-string>
   FIREBASE_PROJECT_ID=<your-firebase-project-id>
   GUARDIAN_TOKEN_SECRET=<a-random-secret-key>
   NODE_ENV=production
   ```

   #### Client-side Environment Variables (prefixed with VITE_):
   ```
   VITE_FIREBASE_API_KEY=<your-firebase-api-key>
   VITE_FIREBASE_PROJECT_ID=<your-firebase-project-id>
   VITE_FIREBASE_APP_ID=<your-firebase-app-id>
   VITE_FIREBASE_AUTH_DOMAIN=<your-project-id>.firebaseapp.com (optional)
   VITE_FIREBASE_STORAGE_BUCKET=<your-project-id>.firebasestorage.app (optional)
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 2-5 minutes)

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add FIREBASE_SERVICE_ACCOUNT_KEY
   vercel env add FIREBASE_PROJECT_ID
   vercel env add GUARDIAN_TOKEN_SECRET
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_PROJECT_ID
   vercel env add VITE_FIREBASE_APP_ID
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 3: Get Firebase Credentials

### Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. **Important**: Convert the entire JSON file to a single-line string for the `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable

   You can use this command to convert it:
   ```bash
   # On Linux/Mac
   cat serviceAccountKey.json | jq -c
   
   # On Windows (PowerShell)
   Get-Content serviceAccountKey.json | ConvertFrom-Json | ConvertTo-Json -Compress
   ```

   Or use an online JSON minifier and copy the result.

### Firebase Client Config

1. Go to **Project Settings** → **General**
2. Scroll down to **Your apps**
3. If you don't have a web app, click **Add app** → **Web** (</>)
4. Copy the following values:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN` (optional)
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET` (optional)

## Step 4: Verify Deployment

1. **Check Build Logs**
   - Go to your project in Vercel Dashboard
   - Click on the deployment
   - Check the "Build Logs" tab for any errors

2. **Test Your Application**
   - Visit your deployment URL (e.g., `https://your-project.vercel.app`)
   - Test the following:
     - Login/Register functionality
     - Leave application submission
     - Dashboard access
     - API endpoints

3. **Check Function Logs**
   - Go to Vercel Dashboard → Your Project → Functions
   - Check the logs for any runtime errors

## Step 5: Set Up Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Follow the DNS configuration instructions
5. Wait for DNS propagation (usually 24-48 hours)

## Troubleshooting

### Build Fails

- **Check Build Logs**: Look for TypeScript errors or missing dependencies
- **Verify Environment Variables**: Make sure all required variables are set
- **Check Node Version**: Vercel uses Node.js 18.x by default (should be fine)

### Runtime Errors

- **Check Function Logs**: Go to Vercel Dashboard → Functions → View Logs
- **Verify Firebase Configuration**: Make sure service account key is correctly formatted
- **Check CORS**: Make sure CORS is properly configured (should be handled automatically)

### API Routes Not Working

- **Check vercel.json**: Make sure the rewrite rules are correct
- **Verify Function Path**: API routes should be accessible at `/api/*`
- **Check Request Headers**: Make sure requests include proper headers

### Environment Variables Not Working

- **Check Variable Names**: Client-side variables must start with `VITE_`
- **Redeploy**: Environment variable changes require a new deployment
- **Check Variable Scope**: Make sure variables are set for the correct environment (Production, Preview, Development)

## Important Notes

1. **Firebase Service Account Key**: Must be a single-line JSON string (minified)
2. **Vercel URL**: The `VERCEL_URL` environment variable is automatically set by Vercel
3. **Build Time**: First deployment may take 5-10 minutes
4. **Cold Starts**: Serverless functions may have a cold start delay (100-500ms)
5. **Rate Limits**: Vercel free tier has rate limits, upgrade if needed

## Support

If you encounter any issues:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Check Firebase documentation: [firebase.google.com/docs](https://firebase.google.com/docs)
3. Review build and function logs in Vercel Dashboard

## Success!

Once deployed, you'll have:
- ✅ Production URL (e.g., `https://your-project.vercel.app`)
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on git push (if connected to GitHub)
- ✅ Preview deployments for pull requests

Enjoy your deployed application! 🚀

