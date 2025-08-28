import express from "express";

const router = express.Router();

import { sendTranscript } from "../controllers/responseController.js";

router.post("/", sendTranscript);

export default router;
