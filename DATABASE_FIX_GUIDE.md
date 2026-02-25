# Database Connection Fix Guide

## Current Status
- ✅ Application deployed and running on Railway
- ✅ All environment variables set
- ✅ Google OAuth configured  
- ❌ **Database connection failing** - Cannot connect to Supabase
- ❌ Staff dashboard not accessible due to DB issue

## Root Cause Analysis

The database is not accessible. This could be due to:

1. **Supabase credentials are incorrect or credentials.sql database doesn't exist**
2. **Password contains special characters that need proper encoding**
3. **Supabase has IP whitelist restrictions preventing Railway connection**
4. **Network connectivity issue between Railway and Supabase**

---

## Solution Options

### **Option A: Use Railway's Built-in PostgreSQL (Recommended for Quick Fix)**

Your project already has a PostgreSQL service (Postgres-Z3Cb) provisioned in Railway. We can use that instead.

**Steps:**

1. **Get Railway Postgres credentials from the dashboard:**
   ```
   - Go to Railway Dashboard → building-permit-system project
   - Select the "Postgres" service (or Postgres-Z3Cb)
   - Go to Variables tab
   - Copy the DATABASE_URL value (should look like: postgresql://postgres:password@postgres-xxx.railway.internal:5432/railway)
   ```

2. **Set the DATABASE_URL in permit-app service:**
   ```
   railway variable set "DATABASE_URL=[paste the value from step 1]" --service permit-app
   ```

3. **Run migrations to create tables:**
   ```
   Drizzle ORM will auto-create tables on first connection, but you may need to manually run:
   - Files in: drizzle/pg/migrations/
   ```

4. **Redeploy:**
   ```
   railway up --service permit-app
   ```

### **Option B: Fix Supabase Connection**

If you want to keep using Supabase:

1. **Verify Supabase credentials:**
   - Go to Supabase Dashboard → Your Project
   - Settings → Database → Connection String
   - Copy the Full URL
   - Verify username and password are correct

2. **Use the full connection string:**
   ```
   Format: postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
   
   Example (replace with your actual values):
   postgresql://postgres.uoitwjtnudhkkwhkmags:YourActualPassword@db.uoitwjtnudhkkwhkmags.supabase.co:5432/postgres?sslmode=require
   ```

3. **Test locally first:**
   ```powershell
   # On your local machine, test the connection
   $env:DATABASE_URL = "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require"
   pnpm run build
   ```

4. **Once working locally, update in Railway:**
   ```
   railway variable set "DATABASE_URL=..." --service permit-app
   ```

### **Option C: Verify Credentials Are Correct**

The credentials in your `.env` file may be test/placeholder values:

**Current in .env:**
```
USER: postgres.uoitwjtnudhkkwhkmags
PASSWORD: vispa@#724hash9
HOST: db.uoitwjtnudhkkwhkmags.supabase.co
```

**To verify if these are correct:**

1. Log into your Supabase dashboard: https://supabase.com/dashboard
2. Check if project `uoitwjtnudhkkwhkmags` exists
3. Go to Project Settings → Database → Connection strings
4. Verify the username, password, and host match

---

## Quick Test Commands

To diagnose the issue, try these:

### Test 1: Check that the credentials work locally
```powershell
# In your local terminal - Set the env var and test build
$env:DATABASE_URL = "postgresql://postgres.uoitwjtnudhkkwhkmags:vispa@#724hash9@db.uoitwjtnudhkkwhkmags.supabase.co:5432/postgres?sslmode=require"
pnpm run build
```

### Test 2: Check Railway PostgreSQL access
```powershell
# Get Railway Postgres URL
cd "c:\Users\USER\Desktop\building permit system"
railway variable list --service Postgres-Z3Cb
# Use the DATABASE_URL or DATABASE_PUBLIC_URL value
```

---

## Environment Variables Currently Set in Railway

✅ **Set:**
- DATABASE_URL (pointing to Supabase - needs fix)
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI
- JWT_SECRET
- STAFF_EMAILS=meostaff75@gmail.com
- ADMIN_EMAILS
- SUPABASE_URL
- SUPABASE_ANON_KEY
- NODE_ENV=production

---

## What Happens When Database Connects

Once DATABASE_URL is correctly configured:

1. ✅ Application will initialize database connection
2. ✅ New users from Google OAuth will be saved to database
3. ✅ Staff role will be assigned to meostaff75@gmail.com
4. ✅ Staff dashboard will become accessible
5. ✅ Applications can be created and managed

---

## Immediate Action Items

**Choose one approach above and provide:**

1. **If using Option A (Railway Postgres):**
   - Tell me to proceed with setting up Railway's built-in database

2. **If using Option B (Fix Supabase):**
   - Verify your Supabase project exists and is accessible
   - Confirm the credentials in your Supabase dashboard

3. **If you want to check locally:**
   - Run: `$env:DATABASE_URL = "your-connection-string"` and try building locally

---

## After Fixing Database

Once database is connected:

1. Test the /api/db-health endpoint:
   ```
   https://permit-app-production.up.railway.app/api/db-health
   ```
   Should return: `{"status":"connected"}`

2. Log in with Google OAuth using `meostaff75@gmail.com`

3. Check if staff dashboard is accessible

---

**Status:** 🔴 Waiting for database configuration decision
**Next Step:** Determine if using Railway PostgreSQL or fixing Supabase connection
