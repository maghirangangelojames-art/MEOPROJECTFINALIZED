# Railway Deployment Guide

## Prerequisites
- Railway account at https://railway.app
- Your project code pushed to a GitHub repository
- Node.js and pnpm installed locally (for testing)

## Steps to Deploy

### 1. Connect Your Repository
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "Create New Project"
3. Select "Deploy from GitHub"
4. Authorize Railway access to your GitHub
5. Select your `building-permit-system` repository

### 2. Configure Environment Variables
1. In the Railway project, go to "Variables"
2. Add your environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=your_database_url (if using external DB)
   JWT_SECRET=your_secret_key
   OAUTH_CLIENT_ID=your_oauth_id
   OAUTH_CLIENT_SECRET=your_oauth_secret
   ```

### 3. Deploy
Railway will automatically detect your `railway.json` and:
- Run the build command: `corepack enable && pnpm install --frozen-lockfile && pnpm run build`
- Start the app with: `NODE_ENV=production node dist/index.js`
- Monitor health at `/health` endpoint

### 4. Monitor & Logs
- View live logs in Railway Dashboard
- Check metrics (CPU, memory, requests)
- Set up alerts for failures

## Build Configuration
The `railway.json` file includes:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "corepack enable && pnpm install --frozen-lockfile && pnpm run build"
  },
  "deploy": {
    "startCommand": "NODE_ENV=production node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "healthcheckInterval": 10
  }
}
```

## Verification
After deployment:
1. Check your Railway app URL
2. Test all pages load with animations
3. Verify database connections
4. Check console for any errors

## Troubleshooting
- **Build fails**: Check logs for missing dependencies
- **App crashes**: Verify environment variables are set
- **Slow startup**: May need more RAM (upgrade in Railway settings)
- **Database connection**: Ensure DATABASE_URL is correct

## Updates
To redeploy after code changes:
1. Push to GitHub
2. Railway automatically detects and rebuilds
3. Deployment happens within 2-5 minutes
