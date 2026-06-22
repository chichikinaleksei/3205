import type { JobStatus, UrlStatus } from "../types";

const labels: Record<JobStatus | UrlStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  failed: "Failed",
  success: "Success",
  error: "Error"
};

export function StatusBadge({
  status,
  size = "normal"
}: {
  status: JobStatus | UrlStatus;
  size?: "normal" | "large";
}) {
  return <span className={`badge badge-${status} badge-${size}`}>{labels[status]}</span>;
}
