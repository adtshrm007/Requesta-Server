import express from "express";

import registerAdmin from "../controllers/Admin.controller.js";

const router=express.Router();

router.post("/register", registerAdmin);
export default router
