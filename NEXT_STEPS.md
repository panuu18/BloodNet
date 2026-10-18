# 📋 BloodNet+ Deployment Roadmap & Next Steps

This document summarizes what was completed today and the exact step-by-step checklist to complete tomorrow.

---

## ✅ Completed Today

1. **Frontend Deployed Live on Vercel**:
   - **Primary URL**: [https://bloodnet-plus.vercel.app](https://bloodnet-plus.vercel.app)
   - **Alternative URLs**: [https://bloodnet-app.vercel.app](https://bloodnet-app.vercel.app) | [https://bloodnet2.vercel.app](https://bloodnet2.vercel.app)
   - **Project Name on Vercel**: `bloodnet` ([Dashboard](https://vercel.com/pranav-316f/bloodnet))
   - **Vercel SSO / Deployment Protection**: Disabled (publicly accessible to all visitors).
   - **SPA Routing**: Added `vercel.json` rewrites so page reloads do not return 404 errors.

2. **Frontend & Backend Production Fixes**:
   - Fixed `server.listen(PORT)` in `backend/server.js` for real-time WebSocket & Socket.io compatibility.
   - Dynamic CORS enabled to accept requests from `*.vercel.app` and `CLIENT_URL`.
   - Dynamic API and Socket URLs in `frontend/src/contexts/NotificationContext.js` and `frontend/src/pages/ProfilePage.js`.
   - Added `/api/health` monitoring probe in `backend/server.js`.
   - Added `backend/Procfile` and `render.yaml` for cloud hosting.

3. **Version Control**:
   - All code, build scripts, and deployment configs committed and pushed to GitHub: [https://github.com/panuu18/BloodNet](https://github.com/panuu18/BloodNet) (branch `main`).

---

## 🎯 Tasks to Complete Tomorrow

### Task 1: Deploy Backend to Render (Est: 3-5 mins)
1. Open [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Select **Build and deploy from a Git repository** and connect: `panuu18/BloodNet`.
3. Fill in the service configuration:
   - **Name**: `bloodnet-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
4. In the **Environment Variables** section, add:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGODB_URI` = `<Paste your MongoDB Atlas connection string here>`
   - `JWT_SECRET` = `<Any secret string, e.g. bloodnet_super_secret_key_2026>`
   - `CLIENT_URL` = `https://bloodnet-plus.vercel.app`
5. Click **Create Web Service**. Wait for the status to show **Live** and copy your backend URL (e.g., `https://bloodnet-backend-xxxx.onrender.com`).

---

### Task 2: Connect Vercel Frontend to the Backend (Est: 2 mins)
1. Open your [Vercel Project Settings for BloodNet](https://vercel.com/pranav-316f/bloodnet/settings/environment-variables).
2. Add the two environment variables:
   - **`REACT_APP_API_URL`**: `https://<your-render-backend-url>/api`
   - **`REACT_APP_SOCKET_URL`**: `https://<your-render-backend-url>`
3. Click **Save**.
4. Go to the **Deployments** tab on Vercel and click **Redeploy** on the latest deployment (or run `npx vercel --prod` from the terminal).

---

### Task 3: Full End-to-End Verification (Est: 5 mins)
1. Visit [https://bloodnet-plus.vercel.app](https://bloodnet-plus.vercel.app).
2. Test user registration (Donor or Recipient).
3. Test logging in and updating your profile.
4. Verify that the document is stored in your MongoDB Atlas cluster.
5. Test creating a blood request and confirming real-time notifications.
