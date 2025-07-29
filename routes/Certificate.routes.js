import express from "express"
import handleCertificates from "../controllers/Certificate.controller"

const router=express.Router();

router.post("/certificates",handleCertificates);
export default router;