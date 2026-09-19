# SAPAA Web Application Deployment Documentation

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Required Services and API Keys](#required-services-and-api-keys)
4. [Environment Variables](#environment-variables)
5. [Local Development Setup](#local-development-setup)
6. [Deploying to Vercel](#deploying-to-vercel)
7. [Database Setup](#database-setup)
8. [Post-Deployment Configuration](#post-deployment-configuration)
9. [Security Checklist](#security-checklist)
10. [Troubleshooting](#troubleshooting)
11. [API Documentation](#api-documentation)

---

## Overview

The SAPAA Web Application is a Next.js 16 application that provides a web interface for stewards and administrators to view and manage protected area inspection data. The application uses:

- **Next.js 16.0.1** - React framework with App Router
- **Supabase** - Database and authentication service
- **OpenCage Geocoding API** - For location-based features
- **Vercel** - Deployment platform

**Deployed URL:** https://sapaa-webapp.vercel.app/

---

## Prerequisites

Before deploying the application, ensure you have:

1. **Node.js** (version 18.x or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (for cloning the repository)
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

4. **Vercel Account** (free tier available)
   - Sign up at [vercel.com](https://vercel.com)

5. **Supabase Account** (free tier available)
   - Sign up at [supabase.com](https://supabase.com)

6. **OpenCage API Key** (free tier available)
   - Sign up at [opencagedata.com](https://opencagedata.com)

---

## Required Services and API Keys

### 1. Supabase Setup

The application requires a Supabase project with the following components:

#### Creating a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Project Name**: `sapaa-webapp` (or your preferred name)
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Select the closest region to your users
4. Click **"Create new project"**
5. Wait for the project to be provisioned (2-3 minutes)

#### Getting Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll need the following values:
   - **Project URL**: `https://yizmvkfkgahyoqeznvki.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpem12a2ZrZ2FoeW9xZXpudmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjQ4NzIsImV4cCI6MjA3NTEwMDg3Mn0.cHeCjiv7NEPHO6EzU0hD2JaWFXEEFlYb532QBOkdZUA`
   - **service_role key** (under "Project API keys" → "service_role" - **KEEP THIS SECRET**)

#### Required Database Tables

The application expects the following tables/views in your Supabase database:

- `sites_list_fnr` - Main list of protected sites
- `sites_report_fnr_test` - Inspection reports (or `sites_report_fnr` for production)
- `sites_detail_fnr_test` - Site detail view (or `sites_detail_fnr` for production)
- `inspectheader` - Inspection header records
- `inspectdetails_fnr_test` - Inspection detail records (or `inspectdetails_fnr` for production)
- `inspectquestions` - Inspection question definitions


### 2. OpenCage Geocoding API

The application uses OpenCage for geocoding site locations on the admin dashboard heatmap.

#### Getting an OpenCage API Key

1. Go to [opencagedata.com](https://opencagedata.com)
2. Sign up for a free account
3. Navigate to **API Keys** in your dashboard
4. Copy your API key
5. The free tier includes 2,500 requests per day

---

## Environment Variables

The application requires the following environment variables:

### Required Variables

| Variable Name | Description | Where to Get It |
|--------------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SECRET` | Supabase service role key (server-side only) | Supabase Dashboard → Settings → API → service_role |
| `OPENCAGE_API_KEY` | OpenCage Geocoding API key | OpenCage Dashboard → API Keys |

### Environment Variable Format

Create a `.env.local` file in the `webapp` directory for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yizmvkfkgahyoqeznvki.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpem12a2ZrZ2FoeW9xZXpudmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjQ4NzIsImV4cCI6MjA3NTEwMDg3Mn0.cHeCjiv7NEPHO6EzU0hD2JaWFXEEFlYb532QBOkdZUA
SUPABASE_SECRET=your-service-role-key-here
OPENCAGE_API_KEY=your-opencage-key-here
```

**Note:** 
- Replace `SUPABASE_SECRET` with your actual service role key from Supabase Dashboard → Settings → API → service_role
- Replace `OPENCAGE_API_KEY` with your actual OpenCage API key from your OpenCage dashboard

**⚠️ Important:** 
- Never commit `.env.local` to version control
- The `.env.local` file is already in `.gitignore`
- For Vercel deployment, add these variables in the Vercel dashboard (see below)

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/UAlberta-CMPUT401/f25project-SAPAA.git
cd f25project-SAPAA/webapp
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:
- Next.js and React
- Supabase client libraries
- Material-UI components
- Chart.js for data visualization
- Leaflet for maps
- Testing libraries (Jest, React Testing Library)

### Step 3: Configure Environment Variables

1. Create a `.env.local` file in the `webapp` directory:

```bash
# On Windows (PowerShell)
New-Item -Path .env.local -ItemType File

# On Mac/Linux
touch .env.local
```

2. Add your environment variables to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yizmvkfkgahyoqeznvki.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpem12a2ZrZ2FoeW9xZXpudmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjQ4NzIsImV4cCI6MjA3NTEwMDg3Mn0.cHeCjiv7NEPHO6EzU0hD2JaWFXEEFlYb532QBOkdZUA
SUPABASE_SECRET=your-service-role-key-here
OPENCAGE_API_KEY=your-opencage-key-here
```

**Note:** 
- Replace `SUPABASE_SECRET` with your actual service role key from Supabase Dashboard → Settings → API → service_role
- Replace `OPENCAGE_API_KEY` with your actual OpenCage API key

### Step 4: Run the Development Server

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

### Step 5: Verify Installation

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. You should see the login page
3. If you see errors, check:
   - All environment variables are set correctly
   - Supabase project is active
   - Database tables are created

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Run ESLint to check code quality |
| `npm test` | Run Jest test suite |

---

## Deploying to Vercel

Vercel is the recommended deployment platform for Next.js applications. It provides automatic deployments, SSL certificates, and global CDN.

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

#### Step 3: Link Your Project

Navigate to the `webapp` directory:

```bash
cd webapp
vercel link
```

This will:
- Ask if you want to link to an existing project or create a new one
- If creating new, provide a project name (e.g., `sapaa-webapp`)

#### Step 4: Configure Environment Variables

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each required variable:

| Variable Name | Value |
|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yizmvkfkgahyoqeznvki.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpem12a2ZrZ2FoeW9xZXpudmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjQ4NzIsImV4cCI6MjA3NTEwMDg3Mn0.cHeCjiv7NEPHO6EzU0hD2JaWFXEEFlYb532QBOkdZUA` |
| `SUPABASE_SECRET` | Your Supabase service role key (get from Supabase Dashboard → Settings → API → service_role) |
| `OPENCAGE_API_KEY` | Your OpenCage API key (get from your OpenCage dashboard) |

5. Select **Production**, **Preview**, and **Development** environments for each variable
6. Click **Save**

#### Step 5: Deploy

```bash
vercel --prod
```

Or push to your main branch if you've connected a Git repository:

```bash
git push origin main
```

Vercel will automatically deploy on push.

### Option 2: Deploy via Vercel Dashboard (Web Interface)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `webapp` (if repository root is parent directory)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
4. Add environment variables (see Step 4 above)
5. Click **Deploy**

### Post-Deployment

After deployment:

1. Your app will be available at: `https://sapaa-webapp.vercel.app/` (or your custom domain)
2. Test the deployment:
   - Visit the login page
   - Verify authentication works
   - Check that data loads correctly
   - Test admin features (if you have admin access)

### Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `sapaa.yourorg.ca`)
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

---

## Database Setup

### Creating Database Tables

You need to set up the following database structure in Supabase:

1. **Log into Supabase Dashboard**
2. Go to **SQL Editor**
3. Run the SQL scripts to create:
   - Tables: `inspectheader`, `inspectquestions`
   - Views: `sites_list_fnr`, `sites_report_fnr_test`, `sites_detail_fnr_test`
   - Tables: `inspectdetails_fnr_test`

**Note:** Contact your development team for the complete SQL schema.

### Setting Up Row Level Security (RLS)

Supabase uses Row Level Security to control data access. You may need to configure RLS policies:

1. Go to **Authentication** → **Policies** in Supabase
2. Create policies for each table to allow:
   - Authenticated users to read data
   - Admins to read/write data (if applicable)

**Example Policy:**

```sql
-- Allow authenticated users to read sites
CREATE POLICY "Allow authenticated users to read sites"
ON sites_list_fnr
FOR SELECT
TO authenticated
USING (true);
```

### User Roles Setup

The application uses Supabase Auth `user_metadata` to store user roles. Roles are stored in the `user_metadata.role` field of each user.

**How Roles Work:**
- Default role: `steward` (assigned automatically if no role is set)
- Admin role: `admin` (must be set manually)
- Roles are stored in: `user.user_metadata.role`

**Setting Admin Role:**

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user you want to make an admin
3. Click on the user to edit
4. In the **Raw User Meta Data** section, add or update:
   ```json
   {
     "role": "admin"
   }
   ```
5. Click **Save**

**Note:** New users created through the app's signup page will default to `steward` role. Only admins can change user roles through the Account Management interface.

---

## Post-Deployment Configuration

### 1. Verify Environment Variables

After deployment, verify all environment variables are set:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Ensure all 4 required variables are present
3. Check that they're enabled for Production environment

### 2. Test Authentication

1. Visit your deployed URL
2. Try logging in with a test account
3. Verify:
   - Login works
   - Signup works (if enabled)
   - Session persists after page refresh
   - Logout works

### 3. Test Database Connection

1. Log in to the application
2. Navigate to the Protected Areas page
3. Verify sites load correctly
4. Check browser console for errors

### 4. Test Admin Features

1. Log in with an admin account
2. Verify:
   - Admin Dashboard loads
   - Charts display data
   - Heatmap search works
   - Account Management page is accessible

### 5. Configure Supabase Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to **Redirect URLs**:
   - `https://sapaa-webapp.vercel.app/auth/callback`
   - `https://sapaa-webapp.vercel.app/auth/confirm`
3. Add to **Site URL**: `https://sapaa-webapp.vercel.app`

### 6. Test API Endpoints

The application has the following API routes:

- `/api/geocode?q=<location>` - Geocoding endpoint
- `/api/heatmap?keyword=<term>` - Site search for heatmap

Test these endpoints:
```bash
# Test geocoding
curl https://sapaa-webapp.vercel.app/api/geocode?q=Alberta

# Test heatmap (requires authentication)
# Use browser dev tools Network tab to inspect requests
```

---

## Security Checklist

Before going to production, ensure:

- [ ] All environment variables are set in Vercel (not in code)
- [ ] `SUPABASE_SECRET` is never exposed to client-side code
- [ ] Debug/test credentials are removed
- [ ] Default passwords are changed
- [ ] Row Level Security (RLS) is enabled on Supabase tables
- [ ] API rate limiting is configured (if needed)
- [ ] CORS is properly configured in Supabase
- [ ] SSL/HTTPS is enabled (automatic with Vercel)
- [ ] Error messages don't expose sensitive information
- [ ] Authentication is required for all protected routes
- [ ] Admin routes are properly protected
- [ ] No console.log statements with sensitive data in production

### Removing Debug Code

Before production deployment:

1. Remove or comment out `console.log` statements with sensitive data
2. Remove test credentials from code
3. Ensure error messages are user-friendly and don't expose internals
4. Review the codebase for hardcoded secrets

---

## Troubleshooting

### Common Issues

#### Issue: "Unable to connect to Supabase"

**Symptoms:**
- Login fails
- Sites don't load
- Error messages about Supabase connection

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check Supabase project is active (not paused)
3. Verify network connectivity
4. Check Supabase status page: [status.supabase.com](https://status.supabase.com)

#### Issue: "Authentication not working"

**Symptoms:**
- Users can't log in
- Redirect loops
- "Invalid credentials" errors

**Solutions:**
1. Verify Supabase redirect URLs are configured correctly
2. Check `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is correct
3. Verify Supabase Auth is enabled
4. Check browser console for specific error messages

#### Issue: "No sites found" or empty data

**Symptoms:**
- Protected Areas page shows no sites
- Dashboard shows zero statistics

**Solutions:**
1. Verify database tables exist and have data
2. Check Row Level Security policies allow read access
3. Verify `SUPABASE_SECRET` is set correctly (for server-side queries)
4. Check Supabase logs for query errors

#### Issue: "Geocoding not working"

**Symptoms:**
- Heatmap doesn't show locations
- Admin dashboard search returns no results

**Solutions:**
1. Verify `OPENCAGE_API_KEY` is set
2. Check OpenCage API quota (free tier: 2,500/day)
3. Verify API key is valid in OpenCage dashboard
4. Check browser console for API errors

#### Issue: "Build fails on Vercel"

**Symptoms:**
- Deployment fails during build
- Build logs show errors

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify all dependencies are in `package.json`
3. Ensure Node.js version is compatible (Vercel auto-detects)
4. Check for TypeScript errors: `npm run build` locally first

#### Issue: "Environment variables not working"

**Symptoms:**
- App works locally but not on Vercel
- API calls fail

**Solutions:**
1. Verify variables are set in Vercel dashboard (not just `.env.local`)
2. Ensure variables are enabled for Production environment
3. Redeploy after adding variables
4. Variables starting with `NEXT_PUBLIC_` are exposed to client-side

### Getting Help

If you encounter issues not covered here:

1. Check Vercel deployment logs
2. Check Supabase logs (Dashboard → Logs)
3. Review browser console for client-side errors
4. Check network tab for failed API requests
5. Contact your development team with:
   - Error messages
   - Steps to reproduce
   - Browser/OS information
   - Screenshots if applicable

---

## API Documentation

The web application exposes the following API endpoints:

### 1. Geocoding API

**Endpoint:** `GET /api/geocode`

**Description:** Geocodes a location name to coordinates using OpenCage API.

**Query Parameters:**
- `q` (required): Location name to geocode

**Example Request:**
```bash
GET /api/geocode?q=Elk Island Provincial Park
```

**Example Response:**
```json
{
  "latitude": 53.5731,
  "longitude": -112.8583
}
```

**Error Response:**
```json
{
  "error": "Missing q param"
}
```
Status: 400

**Rate Limits:**
- Limited by OpenCage API quota (2,500 requests/day on free tier)

---

### 2. Heatmap API

**Endpoint:** `GET /api/heatmap`

**Description:** Searches for sites matching a keyword and returns counts for heatmap visualization.

**Query Parameters:**
- `keyword` (optional): Search term to match against site names

**Example Request:**
```bash
GET /api/heatmap?keyword=park
```

**Example Response:**
```json
{
  "data": [
    {
      "namesite": "Elk Island Provincial Park",
      "count": 15
    },
    {
      "namesite": "Writing-on-Stone Provincial Park",
      "count": 12
    }
  ]
}
```

**Empty Response:**
```json
{
  "data": [],
  "message": "No sites found"
}
```

**Error Response:**
```json
{
  "error": "Database query failed"
}
```
Status: 400 or 500

**Authentication:**
- Requires authenticated user session (handled by middleware)

---

### 3. Authentication Endpoints

These endpoints are handled by Next.js and Supabase:

- `POST /login` - User login
- `POST /signup` - User registration
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/confirm` - Email confirmation handler

**Note:** These are internal API routes. Use the frontend login/signup pages instead of calling these directly.

---

## Required Libraries and Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.0.1 | Next.js framework |
| `react` | 19.2.0 | React library |
| `react-dom` | 19.2.0 | React DOM rendering |
| `@supabase/ssr` | ^0.7.0 | Supabase server-side rendering |
| `@supabase/supabase-js` | ^2.84.0 | Supabase JavaScript client |
| `@mui/material` | ^7.3.5 | Material-UI components |
| `@mui/icons-material` | ^7.3.5 | Material-UI icons |
| `chart.js` | ^4.5.1 | Chart library |
| `react-chartjs-2` | ^5.3.1 | React wrapper for Chart.js |
| `leaflet` | ^1.9.4 | Map library |
| `react-leaflet` | ^5.0.0 | React wrapper for Leaflet |
| `leaflet.heat` | ^0.2.0 | Heatmap plugin for Leaflet |
| `axios` | ^1.13.2 | HTTP client |
| `lucide-react` | ^0.554.0 | Icon library |
| `react-icons` | ^5.5.0 | Additional icons |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5 | TypeScript compiler |
| `eslint` | ^9 | Code linting |
| `jest` | ^30.2.0 | Testing framework |
| `@testing-library/react` | ^16.3.0 | React testing utilities |
| `tailwindcss` | ^4 | CSS framework |

### Installation

All dependencies are installed with:

```bash
npm install
```

This reads `package.json` and installs all listed dependencies.

---

## Maintenance and Updates

### Updating Dependencies

1. Check for outdated packages:
```bash
npm outdated
```

2. Update specific packages:
```bash
npm update <package-name>
```

3. Update all packages (use with caution):
```bash
npm update
```

4. Test thoroughly after updates
5. Commit `package-lock.json` changes

### Monitoring

- **Vercel Analytics**: Monitor performance and errors
- **Supabase Dashboard**: Monitor database usage and performance
- **OpenCage Dashboard**: Monitor API usage and quota

### Backup Strategy

1. **Database Backups**: Supabase provides automatic daily backups (on paid plans)
2. **Code Backups**: Git repository serves as code backup
3. **Environment Variables**: Document all environment variables securely (use password manager)

---

## Support and Resources

### Documentation Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [OpenCage API Documentation](https://opencagedata.com/api)

### Contact

For deployment support or issues:
- Contact your development team
- Check project repository issues
- Review Vercel deployment logs

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Prepared for:** Stewards of Alberta's Protected Areas Association

