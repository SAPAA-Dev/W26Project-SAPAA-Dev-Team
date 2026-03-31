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
12. [Required Libraries and Dependencies](#required-libraries-and-dependencies)
13. [Maintenance and Updates](#maintenance-and-updates)

---

## Overview

The SAPAA Web Application is a Next.js application that provides a web interface for stewards and administrators to view and manage protected area inspection data. The application uses:

- **Next.js** - React framework with App Router
- **Supabase** - Database and authentication service
- **AWS S3** - Image storage
- **Vercel** - Deployment platform

**Deployed URL:** https://sapaa-webapp.vercel.app/

---

## Prerequisites

Before deploying the application, ensure you have:

1. **Node.js** (version 20.x or higher)
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

6. **AWS Account** (for S3 image storage)
   - Sign up at [aws.amazon.com](https://aws.amazon.com)


---

## Required Services and API Keys

### 1. Supabase Setup

The application requires a Supabase project for authentication and database access.

#### Creating a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Project Name**: `sapaa-webapp` (or your preferred name)
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Select the closest region to your users
4. Click **"Create new project"**
5. Wait for the project to be provisioned (2–3 minutes)

#### Getting Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You will need the following values:
   - **Project URL**: found under "Project URL"
   - **anon/public key**: found under "Project API keys" → `anon public`
   - **service_role key**: found under "Project API keys" → `service_role` — **KEEP THIS SECRET**

#### Required Database Tables

The application expects the following tables/views in your Supabase database:

- `W26_sites-pa` — Main list of protected sites
- `W26_answers` — Answers to inspection reports questions
- `W26_attachments` — holds links to external content types (like Images or Inaturalist)
- `W26_form_sections` — Inspection section records
- `W26_form_reponses` — Inspection detail records
- `W26_questions` — Inspection question definitions

---

### 2. AWS S3 Setup

The application uses AWS S3 for storing and serving images uploaded through the inspection workflow.

#### Creating an S3 Bucket

1. Log in to the [AWS Management Console](https://console.aws.amazon.com)
2. Navigate to **S3** and click **"Create bucket"**
3. Configure the bucket:
   - **Bucket name**: Choose a globally unique name (e.g., `sapaa-inspection-images`)
   - **Region**: Select the closest region to your users
   - **Block Public Access**: Configure according to your access requirements (see CORS below)
4. Click **"Create bucket"**

#### Configuring CORS

In your S3 bucket settings, go to **Permissions** → **CORS** and add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-vercel-url.vercel.app"],
    "ExposeHeaders": []
  }
]
```

#### Creating an IAM User

1. Navigate to **IAM** → **Users** → **Create user**
2. Attach a policy granting access to your S3 bucket. Example policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

3. Go to the user's **Security credentials** tab and click **"Create access key"**
4. Save the **Access Key ID** and **Secret Access Key** securely


---

## Environment Variables

The application requires the following environment variables.

### Required Variables

| Variable Name | Description | Where to Get It |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SECRET` | Supabase service role key (server-side only) | Supabase Dashboard → Settings → API → service_role |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key ID | AWS IAM → Users → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret access key | AWS IAM → Users → Security credentials |
| `AWS_REGION` | AWS region of your S3 bucket | AWS S3 bucket settings |
| `AWS_S3_BUCKET` | S3 bucket name | AWS S3 console |

### Environment Variable Format

Create a `.env.local` file in the `webapp` directory for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET=your_supabase_secret

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket_name

```

**⚠️ Important:**
- Never commit `.env.local` to version control
- The `.env.local` file is already in `.gitignore`
- `SUPABASE_SECRET` and all `AWS_*` keys are server-side only — never prefix them with `NEXT_PUBLIC_`
- For Vercel deployment, add these variables in the Vercel dashboard (see below)

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/SAPAA-Dev/W26Project-SAPAA-Dev-Team.git
cd webapp
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

### Step 3: Configure Environment Variables

1. Create a `.env.local` file in the `webapp` directory:

```bash
# On Mac/Linux
touch .env.local

# On Windows (PowerShell)
New-Item -Path .env.local -ItemType File
```

2. Add your environment variables to `.env.local` using the format from the [Environment Variables](#environment-variables) section above.

### Step 4: Run the Development Server

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000).

### Step 5: Verify Installation

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. You should see the login page
3. If you see errors, check:
   - All environment variables are set correctly
   - Supabase project is active
   - Database tables are created
   - AWS S3 bucket exists and IAM credentials are valid

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Run ESLint to check code quality |
| `npm test` | Run Jest test suite |

---

## Deploying to Vercel

Vercel is the recommended deployment platform for Next.js applications. It provides automatic deployments, SSL certificates, and global CDN.

### Option 1: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Link Your Project

```bash
cd webapp
vercel link
```

#### Step 4: Configure Environment Variables

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all variables from the [Environment Variables](#environment-variables) section
5. Enable each variable for **Production**, **Preview**, and **Development**
6. Click **Save**

#### Step 5: Deploy

```bash
vercel --prod
```

Or push to your main branch if you have connected a Git repository:

```bash
git push origin main
```

---

### Option 2: Deploy via Vercel Dashboard (Web Interface)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository: `W26Project-SAPAA-Dev-Team`
3. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `webapp`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add all environment variables from the [Environment Variables](#environment-variables) section
5. Click **Deploy**

Vercel will automatically install dependencies, build the project, and deploy to a live URL.

---

### CI/CD

Vercel provides built-in CI/CD through GitHub integration — no GitHub Actions required.

- Push to `main` branch → triggers production deployment
- Pull requests → creates preview deployments

---

### Post-Deployment

After deployment, your app will be available at `https://your-project-name.vercel.app`. Test by visiting the login page, verifying authentication, checking that data loads, and confirming image uploads work.

---

## Database Setup

### Creating Database Tables

1. Log into your Supabase Dashboard
2. Go to **SQL Editor**
3. Run the SQL scripts provided by your development team to create the required tables and views:
   - Tables: `inspectheader`, `inspectquestions`
   - Views: `sites_list_fnr`, `sites_report_fnr_test`, `sites_detail_fnr_test`
   - Tables: `inspectdetails_fnr_test`

**Note:** Contact your development team for the complete SQL schema.

### Setting Up Row Level Security (RLS)

1. Go to **Authentication** → **Policies** in Supabase
2. Create policies for each table to allow:
   - Authenticated users to read data
   - Admins to read/write data

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

The application uses Supabase Auth `user_metadata` to store user roles in the `user_metadata.role` field.

**How Roles Work:**
- Default role: `steward` (assigned automatically if no role is set)
- Admin role: `admin` (must be set manually)

**Setting Admin Role:**

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click the user you want to make an admin
3. In the **Raw User Meta Data** section, add or update:
   ```json
   {
     "role": "admin"
   }
   ```
4. Click **Save**

**Note:** New users created through the signup page default to `steward`. Only admins can change user roles through the Account Management interface.

---

### User Authorization

The application uses Supabase Auth `user_metadata` to also store user authorization status in the `user_metadata.authenicated` field.

**How Authoirzation Work:**
- Upon account creation authorization is set to: `False` (assigned automatically as admin aproval is required for application access)
- Upon admin aproval of account the value is then set to: `True` (Indicating an admin has allowed you access to the application)

**Setting Authorization Status:**

1. Go to Admin Dashbaord
2. Enter Account Manager
3. Click the user you want to Authorize
4. Toggle their approval status to: **Approved**
5. Click **Save**

**Note:** New users created through the signup page default to `Salse`. Only admins can change user authorization status through the Account Management interface.

---

## Post-Deployment Configuration

### 1. Verify Environment Variables

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Ensure all 8 required variables are present and enabled for Production

### 2. Configure Supabase Redirect URLs

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Redirect URLs**:
   - `https://your-project-name.vercel.app/auth/callback`
   - `https://your-project-name.vercel.app/auth/confirm`
3. Set **Site URL** to: `https://your-project-name.vercel.app`

### 3. Test Authentication

1. Visit your deployed URL
2. Verify login, signup, session persistence, and logout all work correctly

### 4. Test Database Connection

1. Log in to the application
2. Navigate to the Protected Areas page
3. Verify sites load correctly and check the browser console for errors

### 5. Test Image Upload (S3)

1. Log in and navigate to a page with image upload functionality
2. Upload a test image and verify it appears correctly
3. Check the browser console and network tab for any S3-related errors

### 6. Test Admin Features

1. Log in with an admin account
2. Verify the Admin Dashboard loads, charts display data, and heatmap search works

### 7. Test API Endpoints

```bash
# Test geocoding
curl https://your-project-name.vercel.app/api/geocode?q=Alberta
```

---

## Security Checklist

Before going to production, ensure:

- [ ] All environment variables are set in Vercel — not hardcoded in source
- [ ] `SUPABASE_SECRET` and all `AWS_*` keys are never exposed to client-side code
- [ ] Debug/test credentials are removed
- [ ] Default passwords are changed
- [ ] Row Level Security (RLS) is enabled on all Supabase tables
- [ ] S3 bucket CORS policy is restricted to your deployed domain
- [ ] S3 IAM policy follows least-privilege (only required actions granted)
- [ ] SSL/HTTPS is enabled (automatic with Vercel)
- [ ] API rate limiting is configured if needed
- [ ] Error messages don't expose sensitive information
- [ ] Authentication is required for all protected routes
- [ ] Admin routes are properly protected
- [ ] No `console.log` statements with sensitive data in production
- [ ] `.env.local` is never committed to version control (verify `.gitignore`)

---

## Troubleshooting

### Issue: "Unable to connect to Supabase"

**Symptoms:** Login fails, sites don't load, Supabase connection errors.

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check Supabase project is active (not paused)
3. Check [status.supabase.com](https://status.supabase.com)

### Issue: "Authentication not working"

**Symptoms:** Users can't log in, redirect loops, "Invalid credentials" errors.

**Solutions:**
1. Verify Supabase redirect URLs are configured (see Post-Deployment Configuration)
2. Check `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is correct
3. Verify Supabase Auth is enabled in your project

### Issue: "No sites found" or empty data

**Symptoms:** Protected Areas page shows no sites, dashboard shows zero statistics.

**Solutions:**
1. Verify database tables exist and contain data
2. Check RLS policies allow read access for authenticated users
3. Verify `SUPABASE_SECRET` is set correctly for server-side queries

### Issue: "S3 uploads failing"

**Symptoms:** Image uploads fail or images don't appear after upload.

**Solutions:**
1. Verify all four `AWS_*` environment variables are set correctly in Vercel
2. Check IAM policy grants `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` on your bucket
3. Verify the bucket CORS configuration allows requests from your Vercel domain
4. Check browser console and network tab for specific error codes

### Issue: "Geocoding not working"

**Symptoms:** Heatmap doesn't show locations, admin dashboard search returns no results.

**Solutions:**
1. Verify `OPENCAGE_API_KEY` is set
2. Check OpenCage API quota (free tier: 2,500 requests/day)
3. Verify the API key is valid in your OpenCage dashboard

### Issue: "Build fails on Vercel"

**Symptoms:** Deployment fails during build, build logs show errors.

**Solutions:**
1. Check build logs in the Vercel dashboard
2. Verify all dependencies are listed in `package.json`
3. Run `npm run build` locally first to reproduce and debug the error

### Issue: "App builds but fails at runtime" or blank page after deploy

**Symptoms:** Blank page, runtime errors in browser console.

**Solutions:**
1. Check environment variables are set in Vercel (not just `.env.local`)
2. Ensure variables are enabled for the Production environment
3. Redeploy after adding or changing variables
4. Check browser console for specific errors

### Getting Help

If you encounter issues not covered here:

1. Check Vercel deployment logs
2. Check Supabase logs (Dashboard → Logs)
3. Review browser console for client-side errors
4. Check the network tab for failed API requests
5. Contact your development team with error messages, steps to reproduce, browser/OS information, and screenshots

---

## API Documentation

### 1. Heatmap API

**Endpoint:** `GET /api/heatmap`

**Description:** Searches for sites matching a keyword and returns visit counts for heatmap visualization.

**Query Parameters:**

| Parameter | Required | Description |
|---|---|---|
| `keyword` | No | Search term to match against site names |

**Example Request:**
```bash
GET /api/heatmap?keyword=park
```

**Example Response:**
```json
{
  "data": [
    { "namesite": "Elk Island Provincial Park", "count": 15 },
    { "namesite": "Writing-on-Stone Provincial Park", "count": 12 }
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
Status: `400` or `500`

**Authentication:** Requires an authenticated user session (handled by middleware).

---

### 3. Authentication Endpoints

These routes are handled internally by Next.js and Supabase. Use the frontend login/signup pages instead of calling them directly.

| Route | Description |
|---|---|
| `POST /login` | User login |
| `POST /signup` | User registration |
| `GET /auth/callback` | OAuth callback handler |
| `GET /auth/confirm` | Email confirmation handler |

---

## Required Libraries and Dependencies

### Production Dependencies

| Package | Purpose |
|---|---|
| `next` | Next.js framework |
| `react` / `react-dom` | React library and DOM rendering |
| `@supabase/ssr` | Supabase server-side rendering support |
| `@supabase/supabase-js` | Supabase JavaScript client |
| `@aws-sdk/client-s3` | AWS S3 SDK for image storage |
| `@aws-sdk/s3-request-presigner` | Presigned URL generation for S3 |
| `@mui/material` | Material-UI components |
| `@mui/icons-material` | Material-UI icons |
| `chart.js` | Chart library |
| `react-chartjs-2` | React wrapper for Chart.js |
| `leaflet` | Map library |
| `react-leaflet` | React wrapper for Leaflet |
| `leaflet.heat` | Heatmap plugin for Leaflet |
| `axios` | HTTP client |
| `lucide-react` | Icon library |
| `react-icons` | Additional icons |

### Development Dependencies

| Package | Purpose |
|---|---|
| `typescript` | TypeScript compiler |
| `eslint` | Code linting |
| `jest` | Testing framework |
| `@testing-library/react` | React testing utilities |
| `tailwindcss` | CSS utility framework |

### Installation

All dependencies are installed with:

```bash
npm install
```

---

## Maintenance and Updates

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update a specific package
npm update <package-name>

# Update all packages (use with caution — test thoroughly after)
npm update
```

Commit `package-lock.json` changes after any updates.

### Rollback Procedure

#### Option 1: Vercel Instant Rollback

1. Go to **Vercel Dashboard** → **Deployments**
2. Select a previous stable deployment
3. Click **"Promote to Production"**

#### Option 2: Git-Based Rollback

```bash
git checkout <previous-stable-commit>
git push origin main
```

This triggers a new Vercel deployment from the stable commit.

### Monitoring

- **Vercel Analytics**: Monitor performance and errors
- **Supabase Dashboard**: Monitor database usage and logs
- **AWS CloudWatch / S3 Access Logs**: Monitor S3 usage and errors
- **OpenCage Dashboard**: Monitor API usage and quota

### Backup Strategy

- **Database**: Supabase provides automatic daily backups (on paid plans)
- **Images**: Enable S3 Versioning or cross-region replication for production use
- **Code**: Git repository serves as the primary code backup
- **Environment Variables**: Store all credentials securely using a password manager

---

## Support and Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [OpenCage API Documentation](https://opencagedata.com/api)

For deployment support or issues, contact your development team with error messages, reproduction steps, browser/OS information, and screenshots where applicable.

---

**Document Version:** 2.0
**Last Updated:** March 2026
**Prepared for:** Stewards of Alberta's Protected Areas Association
