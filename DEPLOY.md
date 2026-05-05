# Deployment Guide: CareerForge Skill Gap Analyzer

Follow these steps to deploy your application to a production environment.

## 1. Set up MongoDB Atlas (Cloud Database)

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2.  Create a new project and a free cluster (M0).
3.  In **Database Access**, create a user with a username and password.
4.  In **Network Access**, add `0.0.0.0/0` (allow access from anywhere) or specifically the IP of your deployment server.
5.  Click **Connect** -> **Connect your application**.
6.  Copy the connection string. It will look like: 
    `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

## 2. Prepare for Deployment

1.  Make sure your code is pushed to a GitHub repository.
2.  Ensure `.env` is in your `.gitignore` (it should already be).
3.  The `package.json` already includes the necessary start script and engines.

## 3. Deploy to Render (Recommended)

1.  Create an account at [Render.com](https://render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name:** `careerforge-analyzer` (or your choice)
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
5.  Click **Advanced** -> **Add Environment Variable**:
    *   `MONGODB_URI`: paste your Atlas connection string here.
    *   `PORT`: `10000` (or leave default, Render provides it).
6.  Click **Create Web Service**.

## 4. Alternative: Deploy to Vercel (Frontend + Serverless)

If you prefer Vercel, you will need to move `server.js` logic into `api/` directory functions as Vercel treats them as serverless. For this project, **Render** or **Railway** are easier as they support standard Express servers.

## 5. Security Note

- The app uses `helmet` for security headers.
- The app uses `compression` for performance.
- **NEVER** commit your real `.env` file to GitHub. Use environment variables on your hosting provider.
