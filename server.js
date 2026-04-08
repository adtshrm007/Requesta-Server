import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/connectDB.js";
import adminRoute from "./routes/Admin.routes.js";
import studentRoute from "./routes/Student.routes.js";
import leaveRoute from "./routes/Leave.routes.js";
import certificateRoute from "./routes/Certificate.routes.js";
import adminLeaveRoute from "./routes/LeaveAdmin.routes.js";
import aiRoute from "./routes/AI.routes.js";
import analyticsRoute from "./routes/Analytics.routes.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

const app = express();
const port = process.env.PORT || 5000;

// ── CORS Configuration (MUST BE FIRST) ───────────────────────────────────────
app.use(
  cors({
    origin: [
      "https://requesta-client.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", 
      "Authorization", 
      "X-Requested-With", 
      "Access-Control-Allow-Origin",
      "Accept", 
      "Origin"
    ],
    optionsSuccessStatus: 204,
    preflightContinue: false
  }),
);

app.use(express.json());

// ── Core Routes ───────────────────────────────────────────────────────────────
app.use("/api/adminregister", adminRoute);
app.use("/api/studentregister", studentRoute);
app.use("/api/leave", leaveRoute);
app.use("/api/certificate", certificateRoute);
app.use("/api/adminLeave", adminLeaveRoute);

// ── Feature Routes ────────────────────────────────────────────────────────────
app.use("/api/ai", aiRoute);
app.use("/api/analytics", analyticsRoute);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Requesta API", version: "2.0.0" });
});

// ── Centralized error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`✅ Requesta Server v2.0 running at http://localhost:${port}`);
  });
});
