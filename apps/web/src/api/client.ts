import type { JobDetail, JobSummary } from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001").replace(
  /\/$/,
  ""
);

interface CreateJobResponse {
  jobId: string;
}

interface JobsResponse {
  jobs: JobSummary[];
}

interface JobResponse {
  job: JobDetail;
}

export const api = {
  createJob(urls: string[]) {
    return request<CreateJobResponse>("/api/jobs", {
      method: "POST",
      body: JSON.stringify({ urls })
    });
  },
  listJobs() {
    return request<JobsResponse>("/api/jobs");
  },
  getJob(jobId: string) {
    return request<JobResponse>(`/api/jobs/${jobId}`);
  },
  cancelJob(jobId: string) {
    return request<JobResponse>(`/api/jobs/${jobId}`, {
      method: "DELETE"
    });
  }
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as T;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}
