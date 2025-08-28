import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";

const app = express();

app.use(cors());
app.use(morgan("dev"));

import responseRoutes from "../src/routers/responseRoutes.js";

app.use("/api/transcript", responseRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;
