# Requesta Server — Decision Intelligence Backend Engine

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) ![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

The **Requesta Server** serves as the algorithmic processing layer, intelligent interpretation engine, and the impenetrable security firewall for the Requesta organizational application. 

Diverging drastically from standard REST API architectures that merely shuttle JSON records across network bounds, the Requesta Backend functions as an intelligent intermediary. It calculates analytical insights via complex MongoDB execution pipelines, injects system performance variables into a machine learning layer, and enforces strict, programmatic organizational hierarchies across user endpoints.

---

## 🧠 Algorithmic Execution & Machine Intelligence

### 1. The Decision Intelligence Controller (`AI.controller.js`)
Instead of shifting computational load to the client, the Node.js server actively parses data vectors natively.
- **Aggregation Compilation:** The controller queries massive arrays of MongoDB clusters using `$match`, `$group`, and `$project` stages to map active Faculty leaves against Student submissions within matching departmental boundaries.
- **Google Gemini Synthesis:** The computed array is fired securely into the Google Gemini Vertex AI model. This AI processes the exact statistical bounds of the institution in real-time, functioning as an operative "Data Analyst". It cross-references current institutional flow and writes detailed JSON schemas returning `Anomaly Behaviors`, `Workflow Suggestions`, and `Policy Actionable Insights` down to the exact percentage.

### 2. Autonomous Asynchronous Templating
The backend does not transmit generic plaintext strings into email notification loops.
- An isolated `Nodemailer` subsystem generates heavily formatted, dark-themed corporate HTML blocks decoupled entirely from the React stack.
- Status updates compute graphical elements (e.g., transforming strings into green `<button>` blocks when "APPROVED", or red warning labels when "REJECTED").
- **Workflow Interception:** Certificate approvals, account resets, and student tracking routines seamlessly hook into the mailer without stalling the main execution thread.

---

## 🛡️ Multi-Tiered Security Systems & Network Safeguards

Requesta ensures complete organizational integrity via extreme isolation metrics and non-negotiable authentication patterns.

### 1. Role Based Access Control (RBAC) Hierarchies
JWTs (JSON Web Tokens) generated during standard logon are tagged using immutable structural properties marking the authorization bound of the client.
- **Faculty & General Administrators:** Access operates strictly on an immediate relational bound. Faculty can compute actions locally but cannot execute modifications against parallel structures.
- **Departmental Administrators (Dept. Admin):** Tokens granted full localized modification privileges bounded exclusively to their registered departmental query string. A Computer Science administrator is fundamentally locked out of querying Mechanical Engineering clusters natively via `mongoose` filters.
- **System Administrators (Super Admin):** Complete relational bypass privileges, enabling the calculation of massive, institution-wide metrics and multi-department operational commands.

### 2. Credential Verification Environment 
The authentication module relies entirely on continuous password verification and high-entropy hashing via `bcrypt`.
- **Garbage Collection Complete:** Legacy logic systems that attempted to coordinate Email OTPs as primary login agents have been completely destroyed. This removes all unstable networking dependencies from the login flow, resolving API timeouts on slow internet protocols.
- **Secure Key Change Methods:** Updating system passwords evaluates encrypted payload equivalence checks locally (`isPasswordCorrect()`) before mutating Mongoose schema saves.

---

## 📂 Source Structure & MVC Mappings

```text
server/
├── config/             # Environment mounting and active Mongoose connection loops
├── controllers/        # The business logic cores
│   ├── AI.controller.js       # The Intelligence Engine parser
│   ├── Admin.controller.js    # Enforces Admin execution boundaries
│   ├── Student.controller.js  # Standard Student data streams
│   └── Analytics.controller.js# Generates the Bento-Grid numbers natively via Mongo queries
├── middleware/         # Security firewalls
│   └── verifyJWT.js           # Extracts Bearer parameters and checks signatures
├── models/             # Schema structuring (NoSQL validation mapping)
│   ├── admin.model.js
│   ├── student.model.js
│   └── leave.model.js
├── routes/             # Core networking matrices (Express Routers)
├── templates/          # HTML structures utilizing inline-CSS generation for NodeMailer
└── utils/              # Decoupled server utilities (e.g. Asynchronous email transporter logic)
```

---

## 🚀 Execution & Deployment Specifications

### Infrastructure Prerequisites
- Node.js environment >= `v18.0.0+`
- Explicit connection string targeting an actively deployed MongoDB cluster (Cloud Atlas or Local installation).

### Installation Architecture
1. Step into the active server context envelope:
   ```bash
   cd server/Requesta-Server
   ```
2. Retrieve functional node packages:
   ```bash
   npm install
   ```

### Execution Mapping
Launch the operational service utilizing `nodemon` for active monitoring across sequential saves:
```bash
npm start
```
The application process will bind to system resources and open ports iteratively. Expect to operate effectively at root `localhost:5000`.

## 🔐 Environmental Dependency Matrix
Application runtime relies critically on `.env` parsing. Server instances lacking explicit variables will immediately crash during cluster connections.

| Required Key | Type | Definition & Context |
| :--- | :--- | :--- |
| `DB_PASSWORD` | `string(hash)` | Credential pipeline for writing payloads against the NoSQL MongoDB instance. |
| `USER_EMAIL` | `string(email)` | Institutional application email identifier (e.g. `requesta.noreply@domain.com`). |
| `APP_PASSWORD` | `string(auth)` | Explicit bypass password allowing the `Nodemailer` process to transmit over encrypted SMTP channels. |
| `PORT` | `integer` | Designates specific host interface channels dynamically when utilized across production. |
| `GEMINI_API_KEY` | `string(hash)` | Key authorizing prompt calculation payloads against the Google Vertex infrastructure. |
| `CLIENT_URL` | `string(URL)` | Core networking boundary restricting functional REST calls away from external, unauthorized scripts relying strictly on explicitly defined CORS parameters. |

---
**Maintained by the Requesta Engineering Team**
