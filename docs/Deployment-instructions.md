# Deployment Instructions

## 1. Overview & Scope

This document outlines the deployment process for the **Web Application (version 1.0.0)**.

* **Application Type:** Next.js frontend web application
* **Architecture:** Client-side application (no dedicated backend server)
* **External Services:**

  * Supabase (authentication and database)
  * AWS S3 (image storage)

<img width="634" height="573" alt="Screenshot 2026-03-31 at 10 52 40 AM" src="https://github.com/user-attachments/assets/df0dee48-4b07-46d3-af5e-1d3216a2b7be" />

### Purpose

The purpose of this deployment is to enable clients to install, configure, and run the web application on their own infrastructure.

### Systems Affected

* Web hosting environment (Vercel platform)
* Supabase project (Auth + Database)
* AWS S3 bucket (image storage)

---

## 2. Pre-requisites

Before deployment, ensure the following requirements are met:

### 2.1 System Requirements

* Node.js (v20 or later recommended)
* npm package manager
* Git installed
* Vercel account

### 2.2 Access & Credentials

* Access to the GitHub repository:
  [https://github.com/SAPAA-Dev/W26Project-SAPAA-Dev-Team.git](https://github.com/SAPAA-Dev/W26Project-SAPAA-Dev-Team.git)
* Supabase project credentials:

  * Project URL
  * Secret Key
  * Publishable Key
* AWS S3 credentials:

  * Access Key ID
  * Secret Access Key
  * Bucket Name
  * Region

### 2.3 Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET=your_supabase_secret

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket_name
```

---

## 3. Deployment Steps

Follow these steps to deploy the application:

### Step 1: Clone the Repository (Optional)

  This step is so you can make edits to the codebase at your own leisure

```bash
git clone https://github.com/SAPAA-Dev/W26Project-SAPAA-Dev-Team.git
cd webapp
```

---

### Step 2: Import Project into Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Select "Import Git Repository"
 Choose:

```bash
W26Project-SAPAA-Dev-Team
```

---

### Step 3: Configure Project Settings

Vercel should automatically detect:

Framework: Next.js

If not, set manually:

Framework Preset: Next.js
Build Command:

```bash
npm run build
```

Output Directory:
```bash
.next
```

---

### Step 4: Configure Environment Variables


In Vercel dashboard:

* Navigate to Project Settings → Environment Variables
* Add all variables from section 2.3
* Apply them to:
* Production
* Preview
* Development

* Create `.env` (see section above) For local use
* Ensure all credentials are valid and accessible

---

### Step 5: Deployment

Click:

```bash
Deploy
```

Vercel will automatically:
* Install dependencies
* Build the project
* Deploy to a live URL

---

### Step 6: Access Application (optional)

After deployment, Vercel provides a URL:

```bash
https://your-project-name.vercel.app
```

To Locally run:

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

The application will typically be available at:

```
http://localhost:3000
```

---

## 4. Automated Processes (CI/CD)

Vercel provides built-in CI/CD through GitHub integration (no GitHub Actions required).

* Automatic Deployments:
- On push to main branch → triggers production deployment
- On pull requests → creates preview deployments

* Optional other deployment platforms:

  * AWS s3 / CDN
  * Cybera and Docker (custom setup)

---

## 5. Verification (Smoke Testing)

After deployment, verify the system using the following checks:

### 5.1 Application Startup

* Ensure the app loads at deployed URL
* No build or runtime errors in console

### 5.2 Core Functionality

* User authentication via Supabase works (With Google, Microsoft, or manual password entry)
* Data is correctly fetched/stored in Supabase (Make sure to establish you are an admin in supabase if you are the first ever user)
* Image upload to S3 works correctly
* UI components render without errors

### 5.3 Logs & Monitoring

* Check terminal logs for errors
* Verify no failed API calls in browser developer tools

---

## 6. Rollback Procedure

### Option 1: Vercel Instant Rollback

1. Go to **Vercel Dashboard**
2. Navigate to **Deployments**
3. Select a previous stable deployment
4. Click **"Promote to Production"**

---

### Option 2: Git-Based Rollback

```bash id="e7s9mk"
git checkout <previous-stable-commit>
git push origin main
```

This triggers a new deployment with the stable version.

---

## 7. Notes & Considerations

* This application relies heavily on **external services**, so deployment success depends on:
  
  * Ensure environment variables are correctly configured before deployment
  * Never commit `.env.local` to the repository
  * Correct Supabase configuration
  * Valid AWS S3 permissions (CORS policy, bucket policy, and IAM permissions)
  * No backend server means **all logic is client-driven**, making environment configuration critical
  * Ensure `.env.local` is **never committed** to version control

* Vercel handles:

  * SSL certificates
  * CDN distribution
  * Scaling automatically

---

## 8. Common Issues & Troubleshooting

- **App builds but fails at runtime**
  → Check environment variables in Vercel

- **Supabase auth not working**
  → Verify correct URL and anon key
  → Ensure allowed redirect URLs are configured in Supabase

- **S3 uploads failing**
  → Check IAM permissions and bucket CORS configuration

- **Blank page after deploy**
  → Check browser console for errors
  → Verify build logs in Vercel dashboard

---

## 9. Optional Enhancements

* Add custom domain in Vercel settings
* Configure analytics and monitoring
