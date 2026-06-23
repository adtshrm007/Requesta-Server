# Requesta Server - Comprehensive Documentation

The **Requesta Server** is the heavy-duty Node.js/Express backend engine powering the Requesta institutional platform. It acts as the secure database manager, the communication hub, and the AI intelligence layer. 

Rather than functioning as a basic CRUD API, this server intelligently interprets data, calculates analytical insights via complex MongoDB execution pipelines, forces strict hierarchical access control, and integrates with Google Gemini to act as an automated administrative consultant.

---

## 🧠 Core Systems & Features

### 1. Advanced Role-Based Access Control (RBAC)
The server enforces an impenetrable hierarchy of permissions utilizing heavily encrypted JSON Web Tokens (JWT) and bcrypt password hashing.
- **Student Tier:** Can only push requests to the database and read data explicitly tied to their exact `_id`.
- **Faculty Tier:** Can approve/reject student requests within their localized relational bound.
- **Departmental Admin Tier:** Can query and modify arrays bounded exclusively to their registered departmental string (e.g., Computer Science). They cannot query Mechanical Engineering clusters.
- **Super Admin Tier:** Granted complete relational bypass privileges to calculate institution-wide metrics.

### 2. Decision Intelligence Engine (`AI.controller.js`)
Instead of shifting computational load to the client, the server actively parses data vectors natively using Google's Generative AI (`@google/generative-ai`).
- **Data Analyst Mode:** The server aggregates massive MongoDB arrays (e.g., leave reasons, frequency, department distribution) and sends them securely to Gemini. Gemini returns a fully parsed JSON object detailing "Anomaly Behaviors," "Workflow Suggestions," and plain-English "System Health" summaries.
- **Request Validation:** Scans incoming student requests to ensure they meet institutional policy (e.g., checking if a 4-day medical leave actually contains a document attachment).

### 3. Native Aggregation Analytics (`Analytics.controller.js`)
The database does not return raw lists of students to the frontend for calculation. The backend executes deep MongoDB Aggregation Pipelines (`$match`, `$group`, `$project`, `$lookup`) to natively compute:
- Approval vs. Rejection rates.
- Monthly application trends over a 6-month trailing period.
- Most frequent applicants and top leave reasons (e.g., Medical vs. Academic).
- Departmental distribution charts.

### 4. Autonomous Notification Loops
An isolated `Nodemailer` and `Resend` subsystem handles all transactional communications.
- Generates heavily formatted, responsive HTML emails.
- Seamlessly hooks into the approval workflow: When a Faculty member clicks "Approve," the server updates the DB, logs the action, and instantly emails the student without stalling the main thread.

### 5. Complete Audit Logging
Every action taken by an administrator (Approvals, Rejections, Forwarding) is permanently recorded in the `AuditLog` collection, ensuring complete institutional accountability.

---

## 🏗️ Architectural Pattern (MVC)

The codebase strictly adheres to the Model-View-Controller architecture.

### 🗄️ Models (`/models`)
Defines strict NoSQL validation rules using Mongoose `v8`.
- `studentRegister.model.js` & `adminRegister.model.js`: Handles credentials, leave balances (Casual, Official, Medical), and department binding.
- `leave.model.js` & `certificate.model.js`: The core schemas for tracking student applications, holding references to the student, the attached document, and the current approval status.
- `AuditLog.model.js`: Tracks "Who did what and when."

### ⚙️ Controllers (`/controllers`)
The business logic cores.
- `AI.controller.js`: Manages all prompts and parsing for Google Gemini.
- `Analytics.controller.js`: Executes MongoDB aggregation pipelines to feed data to the frontend charts.
- `Leave.controller.js` / `Certificate.controller.js`: Handles the exact logic of creating, fetching, and updating applications.
- `Admin.controller.js` / `Student.controller.js`: Handles credential hashing, JWT generation, and profile updating.

### 🚦 Routes (`/routes`)
Express routers mapping specific HTTP endpoints (e.g., `POST /api/leave/create`) to their respective controller functions.

### 🛡️ Middleware (`/middleware`)
The security firewalls.
- `verifyJWT.js`: Intercepts incoming requests, decrypts the Bearer token, and verifies the signature before allowing the request to reach a controller.
- `errorHandler.middleware.js`: A global catch-block to prevent the Express server from fatally crashing upon logic failures.

---

## 🛠️ Technology Stack

- **Runtime:** **Node.js** (v20.0.0+)
- **Framework:** **Express.js v5** for robust API routing and middleware management.
- **Database:** **MongoDB** (NoSQL) operated via **Mongoose v8** ODM.
- **Intelligence:** **Google Generative AI** (Vertex AI / Gemini) for textual analysis and data interpretation.
- **Security:** **bcryptjs** for hashing and **jsonwebtoken** for session states.
- **File Processing:** **Multer** and **Cloudinary** for safely parsing multipart form data and hosting documents in the cloud.
- **Communications:** **Nodemailer** and **Resend** for SMTP email dispatch.

---

## 🚀 Execution & Deployment Specifications

### 1. Infrastructure Prerequisites
- Node.js environment >= `v18.0.0+`
- An active MongoDB cluster (Cloud Atlas or Local installation).
- Required API Keys: Google Gemini, Cloudinary, Email SMTP.

### 2. Installation
Navigate into the server context envelope:
```bash
cd server/Requesta-Server
```
Retrieve all functional node packages:
```bash
npm install
```

### 3. Environmental Dependency Matrix (`.env`)
The application relies critically on `.env` parsing. The server will immediately crash during the boot sequence if the database connection strings are missing. Create a `.env` file in the root of `Requesta-Server`:

```env
# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:5173  # Crucial for CORS whitelisting

# Security & Database
DB_PASSWORD=your_mongodb_cluster_password
ACCESS_TOKEN_SECRET=your_super_secret_jwt_string
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_string
REFRESH_TOKEN_EXPIRY=10d

# Integrations
GEMINI_API_KEY=your_google_gemini_api_key

# Email Configuration (Nodemailer/Resend)
USER_EMAIL=requesta.noreply@yourdomain.com
APP_PASSWORD=your_smtp_app_password
```

### 4. Booting the Server
Launch the operational service utilizing `nodemon` for active monitoring across sequential saves:
```bash
npm run dev
```
For production environments, execute:
```bash
npm start
```

The application process will bind to system resources. Expect the API to operate natively at `http://localhost:5000`.
