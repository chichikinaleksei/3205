import { randomUUID } from "node:crypto";
import type { Job, JobDetail, JobStats, JobSummary, UrlCheck } from "./types.js";

const MAX_CONCURRENT_PER_JOB = 5;
const MAX_SAVE_DELAY_MS = 10_000;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_URLS_PER_JOB = 100;

const jobs = new Map<string, Job>();
const controllersByJob = new Map<string, Set<AbortController>>();

export function createJob(inputUrls: unknown): Job {
  const normalizedUrls = normalizeUrls(inputUrls);
  const now = new Date().toISOString();
  const job: Job = {
    id: randomUUID(),
    createdAt: now,
    status: "pending",
    urls: normalizedUrls.map((url) => ({
      id: randomUUID(),
      url,
      status: "pending"
    }))
  };

  jobs.set(job.id, job);
  void processJob(job.id).catch((error) => {
    const current = jobs.get(job.id);
    if (current && current.status !== "cancelled") {
      current.status = "failed";
      for (const item of current.urls) {
        if (item.status === "pending" || item.status === "in_progress") {
          item.status = "error";
          item.error = formatError(error);
          item.finishedAt = new Date().toISOString();
        }
      }
    }
  });

  return job;
}

export function listJobs(): JobSummary[] {
  return [...jobs.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toSummary);
}

export function getJobDetail(id: string): JobDetail | undefined {
  const job = jobs.get(id);
  if (!job) {
    return undefined;
  }

  return {
    ...toSummary(job),
    cancelledAt: job.cancelledAt,
    urls: job.urls.map((item) => ({ ...item }))
  };
}

export function cancelJob(id: string): JobDetail | undefined {
  const job = jobs.get(id);
  if (!job) {
    return undefined;
  }

  if (isTerminalJob(job.status)) {
    return getJobDetail(id);
  }

  const now = new Date();
  job.status = "cancelled";
  job.cancelledAt = now.toISOString();

  for (const item of job.urls) {
    if (item.status === "pending" || item.status === "in_progress") {
      item.status = "cancelled";
      item.error = undefined;
      item.finishedAt = now.toISOString();
      if (item.startedAt) {
        item.durationMs = Math.max(0, now.getTime() - Date.parse(item.startedAt));
      }
    }
  }

  for (const controller of controllersByJob.get(id) ?? []) {
    controller.abort();
  }

  return getJobDetail(id);
}

function normalizeUrls(inputUrls: unknown): string[] {
  if (!Array.isArray(inputUrls)) {
    throw new Error("Field \"urls\" must be an array of URL strings.");
  }

  const urls = inputUrls
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (urls.length === 0) {
    throw new Error("Provide at least one URL.");
  }

  if (urls.length > MAX_URLS_PER_JOB) {
    throw new Error(`A job can contain at most ${MAX_URLS_PER_JOB} URLs.`);
  }

  return urls.map((value) => {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }
      return parsed.toString();
    } catch {
      throw new Error(`Invalid URL: ${value}`);
    }
  });
}

async function processJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job || job.status === "cancelled") {
    return;
  }

  job.status = "in_progress";
  let nextIndex = 0;
  let activeCount = 0;

  await new Promise<void>((resolve) => {
    const launchNext = () => {
      if (job.status === "cancelled") {
        if (activeCount === 0) {
          resolve();
        }
        return;
      }

      while (activeCount < MAX_CONCURRENT_PER_JOB && nextIndex < job.urls.length) {
        const item = job.urls[nextIndex++];
        activeCount += 1;
        void processUrl(job, item).finally(() => {
          activeCount -= 1;
          if (nextIndex >= job.urls.length && activeCount === 0) {
            finalizeJob(job);
            resolve();
            return;
          }
          launchNext();
        });
      }
    };

    launchNext();
  });
}

async function processUrl(job: Job, item: UrlCheck): Promise<void> {
  if (job.status === "cancelled" || item.status === "cancelled") {
    return;
  }

  const startedAt = new Date();
  item.status = "in_progress";
  item.startedAt = startedAt.toISOString();

  const controller = new AbortController();
  registerController(job.id, controller);
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let result: Pick<UrlCheck, "status" | "httpStatus" | "error">;

  try {
    const response = await fetch(item.url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal
    });

    result = response.ok
      ? { status: "success", httpStatus: response.status }
      : {
          status: "error",
          httpStatus: response.status,
          error: `HTTP ${response.status}`
        };
  } catch (error) {
    result =
      isJobCancelled(job)
        ? { status: "cancelled" }
        : timedOut
          ? { status: "error", error: "Request timed out" }
        : { status: "error", error: formatError(error) };
  } finally {
    clearTimeout(timeout);
    unregisterController(job.id, controller);
  }

  await delay(randomDelay());

  if (isJobCancelled(job) || isUrlCancelled(item)) {
    return;
  }

  const finishedAt = new Date();
  item.status = result.status;
  item.httpStatus = result.httpStatus;
  item.error = result.error;
  item.finishedAt = finishedAt.toISOString();
  item.durationMs = Math.max(0, finishedAt.getTime() - startedAt.getTime());
}

function finalizeJob(job: Job): void {
  if (job.status === "cancelled") {
    return;
  }

  const hasPending = job.urls.some(
    (item) => item.status === "pending" || item.status === "in_progress"
  );

  job.status = hasPending ? "failed" : "completed";
}

function getStats(job: Job): JobStats {
  const stats: JobStats = {
    total: job.urls.length,
    pending: 0,
    inProgress: 0,
    success: 0,
    error: 0,
    cancelled: 0,
    processed: 0
  };

  for (const item of job.urls) {
    if (item.status === "pending") {
      stats.pending += 1;
    } else if (item.status === "in_progress") {
      stats.inProgress += 1;
    } else if (item.status === "success") {
      stats.success += 1;
      stats.processed += 1;
    } else if (item.status === "error") {
      stats.error += 1;
      stats.processed += 1;
    } else if (item.status === "cancelled") {
      stats.cancelled += 1;
      stats.processed += 1;
    }
  }

  return stats;
}

function toSummary(job: Job): JobSummary {
  return {
    id: job.id,
    createdAt: job.createdAt,
    status: job.status,
    stats: getStats(job)
  };
}

function registerController(jobId: string, controller: AbortController): void {
  const controllers = controllersByJob.get(jobId) ?? new Set<AbortController>();
  controllers.add(controller);
  controllersByJob.set(jobId, controllers);
}

function unregisterController(jobId: string, controller: AbortController): void {
  const controllers = controllersByJob.get(jobId);
  if (!controllers) {
    return;
  }

  controllers.delete(controller);
  if (controllers.size === 0) {
    controllersByJob.delete(jobId);
  }
}

function randomDelay(): number {
  return Math.floor(Math.random() * (MAX_SAVE_DELAY_MS + 1));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Request failed";
}

function isTerminalJob(status: Job["status"]): boolean {
  return status === "completed" || status === "cancelled" || status === "failed";
}

function isJobCancelled(job: Job): boolean {
  return job.status === "cancelled";
}

function isUrlCancelled(item: UrlCheck): boolean {
  return item.status === "cancelled";
}
