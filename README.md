# Requesta Server

The **Requesta Server** is the robust Node.js and Express backend engine for the Requesta platform. This server manages the MongoDB database, enforces Role-Based Access Control, connects to Google Gemini for AI insights, and dispatches automated email notifications.

## What This Project Does

The server acts as the central processing unit for the entire institution's data:

- **Authentication & RBAC**: Handles secure registration and login, utilizing JSON Web Tokens (JWT) to enforce strict boundaries between Students, Departmental Admins, and Super Admins.
- **Request Workflows**: Provides secure endpoints for submitting, fetching, and updating the status of leave and certificate applications.
- **Decision Intelligence & Analytics**:
  - Compiles massive amounts of MongoDB data into complex aggregation pipelines to generate numerical statistics.
  - Sends anonymized institutional data to Google Gemini AI to generate human-readable insights, detect anomalies, and suggest policy actions directly to administrators.
- **Audit Logging & Fraud Detection**: Actively logs administrative actions and flags potentially fraudulent or highly unusual requests before they are approved.
- **Automated Notifications**: Automatically generates and dispatches branded HTML emails to users the moment their request is approved, rejected, or updated by an administrator.
- **Secure File Handling**: Receives multipart form data (like medical certificates) and securely uploads them to cloud storage.

## How It Is Built

The backend uses a modern, scalable JavaScript stack:

- **Core Server**: Built on **Node.js** using **Express v5** to handle routing and API endpoints.
- **Database**: Uses **MongoDB** (a NoSQL database) combined with **Mongoose v8** to define strict schemas (data rules) for Users, Admins, Logs, and Requests.
- **AI Integration**: Implements the `@google/generative-ai` package to power the AI drafting and analytical insights utilizing Google's Gemini models.
- **Security**: Uses **bcryptjs** for hashing passwords and **jsonwebtoken** for securing API routes via middleware checks.
- **Email Providers**: Integrates **Resend** and **Nodemailer** for fast, reliable transactional email delivery.
- **File Storage**: Uses **Multer** and **Cloudinary** for processing file uploads and storing documents securely in the cloud.

## Architecture

The server adheres to a strict **MVC (Model-View-Controller)** pattern:

- **Models (`/models`)**: Defines the Mongoose schemas. For example, `studentRegister.model.js` ensures every student has a valid email and hashed password. Includes models for `AuditLog`, `LeaveAdmins`, and more.
- **Controllers (`/controllers`)**: Contains the business logic. Files like `AI.controller.js` and `Analytics.controller.js` handle the heavy lifting of fetching database records, passing them to the AI, and formatting the response.
- **Routes (`/routes`)**: Maps Express HTTP endpoints (like `/api/leave`) to their specific controller functions.
- **Middleware (`/middleware`)**: Security checkpoints that run before a route is accessed. Used primarily for verifying JWT tokens and catching global errors to prevent server crashes.

## Benefits for the User

- **Guaranteed Security**: Sensitive institutional data and passwords are encrypted and strictly guarded by role-based access checks.
- **Zero Manual Follow-Ups**: Automated email notifications mean staff members never have to manually email a student to tell them their leave was approved.
- **Smart Decision Making**: Administrators are provided with actionable AI summaries instead of just raw database dumps, helping them understand the "why" behind the data.

## Getting Started

### Prerequisites
- Node.js (v20+)
- A MongoDB cluster (Atlas or Local)
- API Keys for Google Gemini, Cloudinary, and Resend (or standard SMTP details).

### Installation & Setup
1. Navigate to the server directory:
   ```bash
   cd server/Requesta-Server
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the server folder. **The server will fail to connect if these are missing**:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173  # Used for CORS
   DB_PASSWORD=your_mongodb_password
   GEMINI_API_KEY=your_gemini_api_key
   USER_EMAIL=your_sending_email_address
   APP_PASSWORD=your_email_app_password
   ```
   *(Note: Additional keys for Cloudinary or Resend may be required depending on your specific configuration).*

4. Start the server (with hot-reloading for development):
   ```bash
   npm run dev
   ```
