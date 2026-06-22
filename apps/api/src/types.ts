export type JobStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "failed";

export type UrlStatus =
  | "pending"
  | "in_progress"
  | "success"
  | "error"
  | "cancelled";

export interface UrlCheck {
  id: string;
  url: string;
  status: UrlStatus;
  httpStatus?: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

export interface Job {
  id: string;
  createdAt: string;
  status: JobStatus;
  urls: UrlCheck[];
  cancelledAt?: string;
}

export interface JobStats {
  total: number;
  pending: number;
  inProgress: number;
  success: number;
  error: number;
  cancelled: number;
  processed: number;
}

export interface JobSummary {
  id: string;
  createdAt: string;
  status: JobStatus;
  stats: JobStats;
}

export interface JobDetail extends JobSummary {
  urls: UrlCheck[];
  cancelledAt?: string;
}
