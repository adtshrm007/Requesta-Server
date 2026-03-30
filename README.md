# Requesta Server Application

Welcome to the **Requesta Server**! This repository houses the powerful, strict REST API backend that governs the Requesta system. It manages sophisticated multi-tier hierarchical approvals, secure real-time file persistence, JWT-based authentication arrays, and automated institutional email pipelines.

---

## 🚀 Technical Stack Breakdown

The Requesta backend utilizes a hardened **MERN architecture (MongoDB, Express, Node.js)** layered with multiple external services.

| Technology | Purpose |
|------------|---------|
| **Node.js + Express 5** | High-performance asynchronous runtime paired with Express for rapid route parsing and middleware chaining. |
| **MongoDB + Mongoose** | Document-oriented data modeling. Used for strict schema validation, complex data aggregation, and relationship populating (e.g., matching a Leave securely back to a User). |
| **JWT & bcryptjs** | Industry-standard security. bcrypt hashes passwords with salt, and JSON Web Tokens ensure stateless, un-forgeable HTTP authorization capabilities. |
| **Multer + Cloudinary** | Cloud object storage synchronization. `multer-storage-cloudinary` intercepts multi-part form data uploads directly in the Express route and pipes files to Cloudinary seamlessly. |
| **Nodemailer + Resend** | Email automation. Dispatches branded HTML emails immediately upon registration, password resets (OTPs), or status updates to a user's request. |
| **Google Gemini AI SDK**| AI integration. The backend `AI.controller.js` parses complex requests using strictly structured JSON prompts to generate analytics and text validation for the Requesta UI. |

---

## ⚙️ The Deep Architecture

The codebase cleanly separates concerns to allow for rapid debugging and scale. 

### Core Hierarchy Model (MVC-Inspired)

```text
server/Requesta-Server/
├── models/             # Schema definitions (The "M" in MVC)
│   ├── adminRegister.model.js  # Defines Faculty, Dept Admin, Super Admin
│   ├── studentRegister.model.js# Defines Student schema & password compare methods 
│   ├── leave.model.js          # The core Request mapping schema
│   ├── certificate.model.js    # Certificate request schema
├── middlewares/        # Express Interceptors
│   ├── verifyToken.js          # Strips Bearer tokens from incoming requests & validates them
├── routes/             # Endpoint Maps (The "V/Router")
│   ├── Admin.routes.js         # Defines /api/adminregister APIs
│   ├── Leave.routes.js         # Maps /api/leaves
├── controllers/        # Business Logic (The "C" in MVC)
│   ├── Admin.controller.js     # Does the heavy lifting. Aggregates analytics, registers admins.
│   ├── Leave.controller.js     # Executes the "Forward", "Approve", "Reject" logic.
│   ├── AI.controller.js        # Powers the intelligent Generation, Validation, and Insights routing.
├── services/           # Reusable functional blocks (e.g., custom workflow engines)
├── templates/          # React-esque raw HTML strings injected into emails via Nodemailer
└── server.js           # Server instantiator, MongoDB bootstrapper, and global error catcher.
```

---

## 🔄 The Smart Approval Workflow (How it Works)

The beating heart of Requesta is its hierarchical workflow engine. Here is explicitly how the website manages data routing beneath the surface:

1. **Submission Phase**
   - A student submits a leave with a PDF medical document via a standard `POST` route.
   - **Multer Middleware** catches the PDF mid-flight, creates a stream to Cloudinary, and waits for a secure URL return.
   - The **Leave Controller** creates a MongoDB document. It tags `status: "pending"` and flags the `currentHandlerRole: "FACULTY"`. 
   
2. **Faculty Triage Phase**
   - A Faculty member logs in. The API queries MongoDB for `Leave.find({ currentHandlerRole: "FACULTY" })`. Note that the faculty member *cannot* see leaves explicitly forwarded past them.
   - **Scenario A:** Faculty clicks "Approve" -> DB updates to `status: "approved"`. Flow ends.
   - **Scenario B:** Faculty clicks "Forward" -> DB updates to `status: "forwarded"`, but crucially, updates `currentHandlerRole: "DEPARTMENTAL ADMIN"`. The document vanishes from the Faculty queue instantly.

3. **Administrative Finalization Phase**
   - The Department Admin logs in. Their API query fires `Leave.find({ currentHandlerRole: "DEPARTMENTAL ADMIN" })`.
   - The Department Admin issues the final approval or rejection.

Similar parallel pipelines exist for **Faculty Leaves** (Faculty -> Dept Admin) and **Department Admin Leaves / Certificates** (Dept Admin -> Super Admin).

---

## 📊 Analytics Aggregation Engine

Requesta provides massive analytical insight directly baked into a single endpoint: `/api/adminregister/dashboard-stats`. 

Inside `Admin.controller.js`, the platform checks `req.user.role` (which was appended securely by the JWT middle layer). 
- If **Departmental Admin**: It launches parallel aggregations using `Promise.all` or sequential `.find()` queries to count strictly the leaves generated in their department, returning exact integers for approved/rejected.
- If **Super Admin**: It sweeps the entire database across `Certificates` and `LeaveAdminModels` to provide total institutional transparency.

---

## 🧠 AI Integration & Advanced Prompts

The Requesta backend manages all interactions with Google Gemini via `AI.controller.js`. Instead of letting the AI output raw, unformatted responses, the controller enforces rigid schemas and contextual restrictions:
1. **System Insights Pipeline:** `GET /system-insights` evaluates real-time MongoDB metrics (total leaves, rejections, active certificates, and frequent applicants) and injects this data into the AI prompt to produce highly accurate, localized observations.
2. **Approval Context Filtering:** The payload sent from the frontend is evaluated locally on the server. The AI explicitly examines the `hasDocument` boolean payload; if a student attaches a medical proxy via Cloudinary, the backend instructs the AI to rate the Request safely for Approval, bypassing text-length rules.
3. **Structured Fallbacks:** Should the Gemini service time out or the `GEMINI_API_KEY` be missing, the backend degrades gracefully, returning a localized JSON structure that continues to provide standard advice to the frontend components.

---

## 🛠️ Environment Variables Config (`.env`)

Before running the server, you must have a `.env` file populated at the root of the server directory:

| Variable | Purpose |
|----------|---------|
| `PORT` | Local runtime port (default: 5000) |
| `MONGODB_URI` | Full connection string to MongoDB Cluster |
| `ACCESS_TOKEN_SECRET` | Ultra-secure randomized string for generating JWT tokens |
| `REFRESH_TOKEN_SECRET`| String for generating long-lived session tokens |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary Cloud Name identifier |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET`| Cloudinary secure secret |
| `EMAIL` | System email address sending SMTP requests |
| `PASSWORD` | System app-password for SMTP server authentication |
| `GEMINI_API_KEY` | Google Generative AI key for enabling AI features in Requesta |

---

## 🏃 Running the Server

1. **Install Sub-dependencies**
   ```bash
   cd server/Requesta-Server
   npm install
   ```

2. **Boot the App (Development Mode)**
   ```bash
   npm run dev
   ```
   *This initiates `nodemon`, which listens for file saves and hot-reloads the Express server instantly.*

3. **Database Connectivity**
   Ensure your local IP is whitelisted on MongoDB Atlas. You will cleanly see `MongoDB connected...` logged to the console upon successful boot sequence. All REST APIs will now resolve successfully via `http://localhost:5000/api/...`
