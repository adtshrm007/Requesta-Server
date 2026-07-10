# ??? Requesta � Server

> **Requesta** is an AI-powered academic request management system. This is the **backend API** built with Node.js, Express v5, and MongoDB. It handles student and admin authentication, leave & certificate request workflows, AI-assisted processing, analytics, and email-based status updates.

---

## ?? Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Overview](#-api-overview)
- [Data Models](#-data-models)
- [RBAC � Role-Based Access Control](#-rbac--role-based-access-control)
- [Workflow Engine](#-workflow-engine)
- [AI Integration](#-ai-integration)
- [Email Notifications](#-email-notifications)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Scripts](#-scripts)

---

## ? Features

- ?? **JWT Authentication** for both Students and Admins (access + refresh tokens)
- ??? **Multi-role RBAC**  Faculty ? Departmental Admin ? Super Admin hierarchy
- ?? **Leave Workflow**  Multi-stage approval pipeline with audit trail
- ?? **Certificate Requests**  Students request documents, Super Admin approves
- ?? **AI-Powered Tools**  Request generation, quality validation, approval suggestions, and system insights via OpenRouter API (GPT-4o mini with Claude 3.5 Sonnet fallback)
- ?? **Analytics Engine**  Summary, advanced, decision intelligence, and leave insights
- ?? **Email Notifications**  Transactional emails via Resend for all key events
- ?? **File Uploads**  Supporting documents via Cloudinary (Multer middleware)
- ?? **Audit Logs**  Complete action trail for every leave and certificate request
- ?? **Health Check Endpoint**  Ready for deployment monitoring
- ?? **Global Error Handling**  Uncaught exceptions and unhandled rejections are caught at process level

---

## ??? Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js >= 20 |
| Framework | Express v5 |
| Database | MongoDB (Mongoose v8) |
| Authentication | JSON Web Token (JWT) |
| Password Hashing | bcryptjs |
| File Storage | Cloudinary + Multer |
| AI Engine | OpenRouter API (GPT-4o mini / Claude 3.5 Sonnet) |
| Email Service | Resend |
| Environment | dotenv |
| Dev Server | Nodemon |

---

## ?? Project Structure

```
Requesta-Server/
+-- server.js                   # Entry point  Express app, routes, DB connection
+-- package.json
+-- .env                        # Environment variables (not committed)

+-- config/
   +-- connectDB.js            # MongoDB connection via Mongoose
   +-- cloudinary.js           # Cloudinary SDK configuration

+-- models/
   +-- studentRegister.model.js    # Student schema (JWT methods, bcrypt)
   +-- adminRegister.model.js      # Admin schema (roles, leave quotas, JWT)
   +-- leave.model.js              # Student leave request schema
   +-- LeaveAdmins.model.js        # Admin leave request schema
   +-- certificate.model.js        # Certificate request schema
   +-- AuditLog.model.js           # Audit log for actions on requests
   +-- OTP.model.js                # OTP for student password reset
   +-- OTPAdmin.model.js           # OTP for admin password reset

+-- routes/
   +-- Admin.routes.js             # Admin registration, profile, dashboard
   +-- Student.routes.js           # Student registration, login, profile
   +-- Leave.routes.js             # Student leave CRUD + audit logs
   +-- LeaveAdmin.routes.js        # Admin leave submission & approval
   +-- Certificate.routes.js       # Certificate request CRUD + audit logs
   +-- AI.routes.js                # AI feature endpoints (dual-auth)
   +-- Analytics.routes.js         # Analytics & reporting endpoints

+-- controllers/
   +-- Admin.controller.js         # Admin auth, profile, student views
   +-- Student.controller.js       # Student auth, profile management
   +-- Leave.controller.js         # Student leave handling & status updates
   +-- LeaveAdmin.controller.js    # Admin leave submission & approval
   +-- Certificate.controller.js   # Certificate handling & approval
   +-- AI.controller.js            # OpenRouter AI features (generate, validate, suggest)
   +-- Analytics.controller.js     # Data aggregation & reporting
   +-- Notification.controller.js  # Notification helpers

+-- middleware/
   +-- authStudent.middleware.js   # JWT verification for students
   +-- authAdmin.middleware.js     # JWT verification for admins
   +-- VerifyRole.js               # RBAC role check middleware factory
   +-- multer.js                   # Multer + Cloudinary storage config
   +-- errorHandler.middleware.js  # Centralized Express error handler

+-- services/
   +-- workflow.service.js         # RBAC workflow rules for all request types
   +-- auditLog.service.js         # Create and retrieve audit log entries
   +-- validation.service.js      # Input validation helpers

+-- utils/
   +-- aiClient.js                 # OpenRouter API client with fallback logic
   +-- sendEmail.js                # Resend email utility wrapper

+-- templates/
    +-- Registration.template.js        # Student registration email
    +-- RegistrationAdmin.template.js   # Admin registration email
    +-- LeaveSubmission.template.js     # Leave request confirmation
    +-- LeaveUpdate.template.js         # Leave status update notification
    +-- CertificateSubmission.template.js  # Certificate request confirmation
    +-- CertificateUpdate.template.js      # Certificate status update
    +-- ForgotPassword.template.js      # OTP for password reset
```

---

## ?? API Overview

All routes are prefixed with `/api`.

### ?? Auth  Student (`/api/studentregister`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new student |
| POST | `/login` | Student login ? returns JWT |
| GET | `/getStudent` | Get logged-in student profile |
| PUT | `/update` | Update student profile |
| PUT | `/changepassword` | Change student password |
| POST | `/forgotpassword` | Request OTP for password reset |
| POST | `/verifyOTP` | Verify OTP and reset password |
| GET | `/dashboard` | Student dashboard data |

### ??? Auth  Admin (`/api/adminregister`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new admin (requires auth) |
| POST | `/get` | Get admin by ID |
| PUT | `/changepassword` | Change admin password |
| GET | `/dashboard` | Admin dashboard data |
| GET | `/dashboard-stats` | Aggregated dashboard statistics |
| PUT | `/update` | Update admin profile |
| GET | `/students` | List all students (admin view) |
| GET | `/admins` | List Faculty admins (Departmental Admin only) |
| GET | `/departmentalAdmin` | List Departmental Admins (Super Admin only) |
| GET | `/studentRequests` | View a student's leave requests |
| GET | `/certificateRequests` | View a student's certificate requests |

### ?? Student Leave (`/api/leave`)

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/submitLeaves` | Student |
| GET | `/showLeaves` | Faculty |
| GET | `/leavesForDepartmentalAdmin` | Departmental Admin |
| GET | `/leavesForSuperAdmin` | Super Admin (read-only) |
| PUT | `/updateLeaves` | Faculty, Departmental Admin |
| GET | `/requests/:id/logs` | Any Admin |

### ?? Admin Leave (`/api/adminLeave`)

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/leave` | Faculty, Departmental Admin |
| GET | `/getLeave` | Own leave history |
| GET | `/getAllLeave` | Departmental Admin, Super Admin |
| GET | `/getFacultyLeave` | Departmental Admin |
| GET | `/getDepartmentalAdminLeave` | Super Admin |
| PUT | `/updateAdminLeaves` | Dept Admin (Faculty), Super Admin (Dept Admin) |
| GET | `/requests/admin/:id/logs` | Any Admin |

### ?? Certificates (`/api/certificate`)

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/submitCertificate` | Student |
| GET | `/showCertificates` | Super Admin |
| GET | `/certificateForSuperAdmin` | Super Admin |
| PUT | `/updateCertificates` | Super Admin |
| GET | `/requests/cert/:id/logs` | Any Admin |

### ?? AI Features (`/api/ai`)

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/generate-request` | Student & Admin |
| POST | `/validate-request` | Student & Admin |
| POST | `/approval-suggestion` | Admin only |
| POST | `/system-insights` | Admin only |

### ?? Analytics (`/api/analytics`)

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/summary` | Dept Admin, Super Admin |
| GET | `/advanced` | Dept Admin, Super Admin |
| GET | `/decision-intelligence` | Any Admin |
| GET | `/leave-insights` | Any Admin |

### ?? Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Returns `{ status: "ok", service: "Requesta API", version: "2.0.0" }` |

---

## ??? Data Models

### Student

| Field | Type | Notes |
|-------|------|-------|
| `registrationNumber` | String | Unique identifier |
| `name` | String | |
| `email` | String | |
| `password` | String | Bcrypt hashed |
| `branch` | String | Department/branch |
| `year` | Number | Academic year |
| `refreshToken` | String | For token refresh |

### Admin

| Field | Type | Notes |
|-------|------|-------|
| `adminID` | String | Unique identifier |
| `name` | String | |
| `email` | String | |
| `password` | String | Bcrypt hashed |
| `department` | String | |
| `role` | Enum | `Super Admin`, `Departmental Admin`, `Faculty` |
| `totalLeaves` | Number | 15 default |
| `officialLeave` | Number | 5 default |
| `medicalLeave` | Number | 5 default |
| `casualLeave` | Number | 5 default |
| `pendingLeaveRequests` | Number | Counter |
| `pendingCertificateRequests` | Number | Counter |

### Leave Request

| Field | Type | Notes |
|-------|------|-------|
| `studentId` | ObjectId | Ref to Student |
| `studentName` | String | |
| `studentRegNumber` | String | |
| `subject` | String | |
| `Reason` | String | |
| `status` | Enum | `pending`, `forwarded`, `approved`, `rejected` |
| `currentHandlerRole` | Enum | `FACULTY`, `DEPT_ADMIN`, `SUPER_ADMIN` |
| `fromDate` / `toDate` | Date | Leave duration |
| `supportingDocument` | String | Cloudinary URL |
| `remark` | String | Admin remarks |

### Certificate Request

| Field | Type | Notes |
|-------|------|-------|
| `student` | ObjectId | Ref to Student |
| `purpose` | String | Reason for certificate |
| `CertificateType` | String | Type of certificate |
| `status` | Enum | `pending`, `approved`, `rejected` |
| `currentHandlerRole` | Enum | `SUPER_ADMIN` |
| `supportingDocument` | String | Cloudinary URL |
| `addCertificate` | String | URL of issued certificate |

---

## ?? RBAC  Role-Based Access Control

The system has three admin roles organized in a strict hierarchy:

```
Super Admin
    +-- Departmental Admin
            +-- Faculty
```

| Action | Faculty | Departmental Admin | Super Admin |
|--------|:-------:|:------------------:|:-----------:|
| Forward student leave | ? |  |  |
| Reject student leave | ? | ? |  |
| Approve student leave |  | ? |  |
| View all student leaves |  | ? | ? (read-only) |
| Approve Faculty leave |  | ? |  |
| Approve Dept Admin leave |  |  | ? |
| Approve/Reject certificates |  |  | ? |
| View analytics |  | ? | ? |
| Add new admin |  |  | ? |
| AI approval suggestions |  | ? | ? |
| System insights |  | ? | ? |

---

## ?? Workflow Engine

The `services/workflow.service.js` enforces the multi-stage approval pipeline:

### Student Leave Flow

```
Student Submits ? [PENDING]
    ? Faculty: FORWARD ? [FORWARDED] or REJECT ? [REJECTED]
    ? Departmental Admin: APPROVE ? [APPROVED] or REJECT ? [REJECTED]
    (Super Admin: blocked from acting on student leaves)
```

### Admin Leave Flow

```
Faculty Submits ? Departmental Admin: APPROVE / REJECT
Dept Admin Submits ? Super Admin: APPROVE / REJECT
```

### Certificate Flow

```
Student Submits ? Super Admin: APPROVE (issues certificate) / REJECT
```

All state transitions are validated server-side. Already-completed requests (`approved` / `rejected`) cannot be modified.

---

## ?? AI Integration

The server integrates **OpenRouter API** for intelligent academic assistance. The primary model is `openai/gpt-4o-mini` with an automatic fallback to `anthropic/claude-3.5-sonnet` handled in `utils/aiClient.js`.

| Feature | Endpoint | Description |
|---------|----------|-------------|
| **Generate Request** | `POST /api/ai/generate-request` | Drafts a formal, well-structured leave/certificate request from bullet points |
| **Validate Request** | `POST /api/ai/validate-request` | Scores request quality (0?100) and flags incomplete or vague content |
| **Approval Suggestion** | `POST /api/ai/approval-suggestion` | Suggests approve/reject/forward with reasoning based on request content |
| **System Insights** | `POST /api/ai/system-insights` | Analyses aggregate system data to surface trends and recommendations |

All AI calls enforce `response_format: { type: "json_object" }` and use a strict academic system prompt to ensure consistent, safe output.

---

## ?? Email Notifications

Powered by **Resend**, the following events trigger automated emails:

| Event | Template |
|-------|----------|
| Student registration | `Registration.template.js` |
| Admin registration | `RegistrationAdmin.template.js` |
| Leave submitted | `LeaveSubmission.template.js` |
| Leave status updated | `LeaveUpdate.template.js` |
| Certificate submitted | `CertificateSubmission.template.js` |
| Certificate status updated | `CertificateUpdate.template.js` |
| Forgot password OTP | `ForgotPassword.template.js` |

---

## ?? Environment Variables

Create a `.env` file in the project root with the following keys:

```env
# Server
PORT=3000

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/...

# JWT
ACCESS_TOKEN_SECRET=<your-secret>
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=<your-refresh-secret>
REFRESH_TOKEN_EXPIRY=10d

# Email (Resend)
RESEND_API_KEY=re_...
USER_EMAIL=your@email.com

# AI (OpenRouter)
OPENROUTER_API_KEY=sk-or-...

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Never commit your `.env` file.** It is included in `.gitignore`.

---

## ?? Getting Started

### Prerequisites

- Node.js **>= 20.0.0**
- A MongoDB Atlas cluster (or local MongoDB instance)
- Cloudinary account
- Resend account
- OpenRouter API key (https://openrouter.ai)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd Requesta-Server

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env file and fill in your credentials (see above)

# 4. Start the development server
npm run dev
```

The server will start at `http://localhost:3000`.

---

## ?? Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with Nodemon (hot-reload) |
| `npm start` | Start production server |

---

## ?? Deployment

The server is configured for cloud deployment (e.g., Railway, Render, or any Node-compatible host):

- Listens on `0.0.0.0` to accept connections from all interfaces
- CORS allows `https://requesta-client.vercel.app` (production) and `localhost:5173` / `localhost:3000` (development)
- `process.exit(1)` on unhandled errors allows the hosting platform to auto-restart

---

## ?? Version

**Requesta API v2.0.0**
