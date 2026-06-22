import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { cancelJob, createJob, getJobDetail, listJobs } from "./jobs.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN;

app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(",").map((origin) => origin.trim()) : true
  })
);
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/jobs", (request, response) => {
  try {
    const job = createJob(request.body?.urls);
    response.status(201).json({ jobId: job.id });
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : "Invalid request"
    });
  }
});

app.get("/api/jobs", (_request, response) => {
  response.json({ jobs: listJobs() });
});

app.get("/api/jobs/:id", (request, response) => {
  const job = getJobDetail(request.params.id);
  if (!job) {
    response.status(404).json({ message: "Job not found" });
    return;
  }

  response.json({ job });
});

app.delete("/api/jobs/:id", (request, response) => {
  const job = cancelJob(request.params.id);
  if (!job) {
    response.status(404).json({ message: "Job not found" });
    return;
  }

  response.json({ job });
});

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found" });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "Internal server error" });
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
