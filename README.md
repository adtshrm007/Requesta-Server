# 🚀 Requesta Server Application

Welcome to the **Requesta Server** — the core intelligence layer powering the Requesta ecosystem. This backend is not just a REST API, but a **workflow engine + analytics system + AI orchestration layer** built to handle institutional-scale request management.

It manages:

* 🔐 Secure authentication & authorization
* 🔄 Multi-level approval workflows
* ☁️ File storage pipelines
* 📊 Data-driven analytics
* 🧠 AI-powered decision systems

---

# 🌟 Core Philosophy

> **Data-first. AI-enhanced. Production-ready.**

Unlike traditional systems:

* AI does **not guess blindly**
* AI **interprets structured MongoDB data**
* Every decision is **traceable, explainable, and role-aware**

---

# 🧱 Tech Stack

| Technology                               | Purpose                                                       |
| ---------------------------------------- | ------------------------------------------------------------- |
| **Node.js + Express 5**                  | High-performance backend runtime with middleware architecture |
| **MongoDB + Mongoose**                   | Schema modeling + aggregation pipelines for analytics         |
| **JWT + bcryptjs**                       | Secure authentication and password hashing                    |
| **Multer + Cloudinary**                  | Seamless file uploads with cloud persistence                  |
| **Nodemailer + Resend**                  | Automated transactional email pipelines                       |
| **AI Layer (Gemini / OpenRouter-ready)** | Structured AI processing (generation, validation, insights)   |

---

# 🏗️ System Architecture

```text
Client (React SPA)
   ↓
Express API Layer
   ↓
AI Orchestration Layer
   ↓
MongoDB (Data + Aggregations)
   ↓
External Services (Cloudinary, Email)
```

---

# 📁 Project Structure

```text
server/Requesta-Server/
├── models/
│   ├── adminRegister.model.js
│   ├── studentRegister.model.js
│   ├── leave.model.js
│   ├── certificate.model.js
├── middlewares/
│   ├── verifyToken.js
├── routes/
│   ├── Admin.routes.js
│   ├── Leave.routes.js
│   ├── AI.routes.js
├── controllers/
│   ├── Admin.controller.js
│   ├── Leave.controller.js
│   ├── AI.controller.js   # Core AI brain
├── services/
├── templates/
├── server.js
```

---

# 🔄 Hierarchical Workflow Engine

Requesta implements a **strict multi-level approval pipeline**:

---

## 🧩 Flow Breakdown

### 1. Submission Phase

* Student submits leave with optional document
* Multer streams file → Cloudinary
* Leave document created:

```json
{
  "status": "pending",
  "currentHandlerRole": "FACULTY"
}
```

---

### 2. Faculty Layer

* Faculty sees only:

```js
Leave.find({ currentHandlerRole: "FACULTY" })
```

#### Actions:

* ✅ Approve → Ends flow
* 🔁 Forward → Moves to Admin

---

### 3. Department Admin Layer

* Sees forwarded requests
* Final decision authority

---

### 🔁 Parallel Flows

| Request Type  | Flow                        |
| ------------- | --------------------------- |
| Student Leave | Student → Faculty → Admin   |
| Faculty Leave | Faculty → Admin             |
| Admin Leave   | Admin → Super Admin         |
| Certificate   | Student/Admin → Super Admin |

---

# 📊 Analytics Engine (Data-First)

Unlike generic dashboards, Requesta uses **MongoDB Aggregations** to compute real insights:

### 🔍 Core Metrics

* Leave type distribution (Medical, Casual)
* Role-based usage (Student vs Faculty)
* Department-wise activity
* Approval vs rejection ratios
* Certificate demand trends
* Frequent applicants

---

### ⚡ Example Aggregation

```js
LeaveModel.aggregate([
  { $group: { _id: "$type", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

---

# 🧠 AI Orchestration Layer

Located in: `AI.controller.js`

---

## ⚙️ Key Principle

> AI is used as an **analyst**, not a generator.

---

## 🔹 Modules

### 1. ✍️ Request Generation

* Converts casual input → formal structured request
* Returns strict JSON:

```json
{
  "subject": "...",
  "body": "..."
}
```

---

### 2. ✅ Request Validation

* Checks:

  * clarity
  * completeness
  * professionalism
* Returns:

```json
{
  "validity": "...",
  "issues": [],
  "suggestions": [],
  "improvedVersion": {}
}
```

---

### 3. 🤖 Approval Suggestion

* Inputs:

  * reason
  * duration
  * history
  * document presence
* Outputs:

```json
{
  "decision": "Approve | Reject | Review",
  "confidence": "High | Medium | Low",
  "reasoning": "..."
}
```

---

### 4. 📊 System Insights (Advanced)

#### 🔥 Hybrid Pipeline:

1. MongoDB Aggregations → Structured Data
2. AI → Interpretation Layer

---

#### Example AI Input:

```json
{
  "leaveTypes": [...],
  "roleStats": [...],
  "certTypes": [...]
}
```

---

#### Output:

```json
{
  "trends": [],
  "alerts": [],
  "suggestions": []
}
```

---

### 🚨 Fail-Safe Design

* AI failures NEVER crash API
* Automatic fallback responses
* Graceful degradation

---

# 🔐 Security Layer

* JWT-based stateless authentication
* Role-based access control (RBAC)
* Password hashing with bcrypt
* Protected middleware routes
* Secure file handling

---

# ☁️ File Handling Pipeline

```text
Client Upload → Multer → Cloudinary → URL stored in MongoDB
```

Supports:

* Medical certificates
* Supporting documents

---

# 📧 Email Automation

Triggered events:

* Registration
* OTP verification
* Leave status updates
* Certificate approvals

Uses:

* Nodemailer / Resend
* Dynamic HTML templates

---

# 🛠️ Environment Configuration

Create `.env`:

```env
PORT=5000
MONGODB_URI=your_uri
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_refresh_secret

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

EMAIL=...
PASSWORD=...

GEMINI_API_KEY=...
OPENROUTER_API_KEY=...  # (recommended upgrade)
```

---

# ▶️ Running the Server

### Install dependencies

```bash
npm install
```

---

### Start development server

```bash
npm run dev
```

---

### Expected Output

```text
MongoDB connected...
Server running on port 5000
```

---

# 🚀 Key Differentiators

### ✅ Data-Driven AI

AI decisions are based on real data, not assumptions

---

### ✅ Role-Aware System

Different logic for:

* Students
* Faculty
* Admins
* Super Admins

---

### ✅ Scalable Architecture

* Clean separation of concerns
* Modular AI system
* Easily extendable

---

### ✅ Production-Ready Design

* Fail-safe AI
* Secure APIs
* Optimized queries

---

# 🔮 Future Enhancements

* 📊 Real-time analytics dashboards (charts)
* 🔔 WebSocket-based notifications
* 🧠 AI anomaly detection (fraud patterns)
* ⚡ Response caching for AI calls
* 🌐 Multi-institution support

---

# 📌 Final Note

Requesta Server is not just a backend — it is a **decision-making engine** for institutional workflows.

> Built for scale. Designed for clarity. Powered by intelligence.

---
