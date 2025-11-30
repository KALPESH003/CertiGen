---
# CertiGen Deployment Guide

This document outlines the complete deployment strategy for **CertiGen**, including database setup, backend deployment, frontend deployment, and post-deployment validation.

CertiGen uses a dual-deployment structure:
* **Backend API** → Render (supports Puppeteer)**
* **Frontend Client** → Vercel/Netlify (Static CDN hosting)**
---

## Part 1: Database Setup (MongoDB Atlas)

1. Log in to **MongoDB Atlas**.
2. Create a **new Cluster** (M0 Sandbox recommended for demos).
3. Navigate to **Network Access** → Allow access from:

   ```
   0.0.0.0/0
   ```

   *(Required because Render uses dynamic outbound IPs.)*
4. Go to **Database Access** → Create a user:

   ```
   Username: certigen_admin
   Password: <secure-password>
   ```
5. Copy the **Connection String**, which will be used in backend environment variables.

---

## Part 2: Backend Deployment (Render.com)

Render is chosen because it supports **Puppeteer/Chrome**, critical for generating PDFs.

### **Steps to Deploy**

1. Push your project to **GitHub**.
2. Log in to **Render Dashboard**.
3. Create a **New Web Service**.
4. Connect to your GitHub repository.

### **Render Service Configuration**

| Setting            | Value            |
| ------------------ | ---------------- |
| **Root Directory** | `backend`        |
| **Build Command**  | `npm install`    |
| **Start Command**  | `node server.js` |

### **Add Environment Variables**

Add all values from your `.env` file:

```
NODE_ENV=production
MONGO_URI=Your_Atlas_Connection_String
JWT_SECRET=Your_Random_Secret
CLIENT_URL=https://your-frontend-url.vercel.app
SMTP_EMAIL=Your_Gmail
SMTP_PASSWORD=Your_Gmail_App_Password
```

⚠️ Update `CLIENT_URL` after frontend deployment is complete.

---

## Part 3: Frontend Deployment (Vercel)

Since the frontend uses static HTML, CSS, and JS, Vercel provides a global CDN with instant deployments.

### **Deploy Steps**

1. Go to **Vercel Dashboard** → Import GitHub repository.
2. Set the project settings as follows:

### **Vercel Configuration**

| Setting              | Value           |
| -------------------- | --------------- |
| **Root Directory**   | `frontend`      |
| **Build Command**    | *(Leave empty)* |
| **Output Directory** | `public`        |

### Create `vercel.json` for API Routing

Place this file inside the **frontend** folder:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-url.onrender.com/api/:path*"
    }
  ]
}
```

This ensures all API calls route through Vercel → Render, preventing CORS issues.

---

## Part 4: Post-Deployment Checks

### 1. CORS Validation

Ensure `CLIENT_URL` in Render equals your actual Vercel deployment URL:

```
https://your-app-name.vercel.app
```

### 2. Backend Health Check

Visit:

```
https://your-backend.onrender.com/
```

You should see a JSON response with an **“Active”** or similar field.

### 3. Test PDF Generation

1. Issue a test certificate.
2. Attempt a download.

If Puppeteer fails, verify the flags inside your generator:

```js
args: ["--no-sandbox", "--disable-setuid-sandbox"]
```

---
