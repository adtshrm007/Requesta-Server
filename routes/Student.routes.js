import express from "express"

import {registerStudent,getAllStudents} from "../controllers/Student.controller.js";

const router = express.Router();

router.post("/register", registerStudent);
router.get("/", getAllStudents);

export default router;

