import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDB from "./config/connectDB.js"; // .js extension required
import adminRoute from "./routes/Admin.routes.js";
import studentRoute from "./routes/Student.routes.js";
import leaveRoute from "./routes/Leave.routes.js"


import cors from "cors"

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use("/api/adminregister", adminRoute);
app.use("/api/studentregister", studentRoute);
app.use("/api/leave",leaveRoute)




app.get('/', (req, res) => {
  res.send('Hello');
});

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
  });
});
