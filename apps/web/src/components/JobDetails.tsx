import { Ban, Loader2 } from "lucide-react";
import { isTerminalStatus, useJobStore } from "../store/jobs";
import { formatDate, formatDuration, shortId } from "../utils/format";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

export function JobDetails() {
  const job = useJobStore((state) => state.activeJob);
  const activeJobId = useJobStore((state) => state.activeJobId);
  const detailLoading = useJobStore((state) => state.detailLoading);
  const cancelling = useJobStore((state) => state.cancelling);
  const cancelActiveJob = useJobStore((state) => state.cancelActiveJob);

  if (!activeJobId) {
    return (
      <div className="empty-state">
        <h2>Select or start a job</h2>
        <p>Job details will appear here.</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="empty-state">
        <Loader2 className="spin" size={26} />
        <h2>Loading job</h2>
      </div>
    );
  }

  return (
    <div className="detail-view">
      <div className="detail-header">
        <div>
          <div className="eyebrow">Job {shortId(job.id)}</div>
          <h2>{job.stats.processed} of {job.stats.total} processed</h2>
          <p>{formatDate(job.createdAt)}</p>
        </div>
        <div className="detail-actions">
          <StatusBadge status={job.status} size="large" />
          <button
            className="danger-button"
            onClick={() => void cancelActiveJob()}
            disabled={cancelling || isTerminalStatus(job.status)}
          >
            <Ban size={17} />
            {cancelling ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      </div>

      <ProgressBar stats={job.stats} />

      <div className="metrics-grid">
        <Metric label="Success" value={job.stats.success} tone="success" />
        <Metric label="Errors" value={job.stats.error} tone="error" />
        <Metric label="Pending" value={job.stats.pending} />
        <Metric label="Active" value={job.stats.inProgress} />
        <Metric label="Cancelled" value={job.stats.cancelled} tone="cancelled" />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Status</th>
              <th>HTTP</th>
              <th>Duration</th>
              <th>Started</th>
              <th>Finished</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {job.urls.map((item) => (
              <tr key={item.id}>
                <td className="url-cell" data-label="URL">{item.url}</td>
                <td data-label="Status"><StatusBadge status={item.status} /></td>
                <td data-label="HTTP">{item.httpStatus ?? "-"}</td>
                <td data-label="Duration">{formatDuration(item.durationMs)}</td>
                <td data-label="Started">{item.startedAt ? formatDate(item.startedAt) : "-"}</td>
                <td data-label="Finished">{item.finishedAt ? formatDate(item.finishedAt) : "-"}</td>
                <td className="error-cell" data-label="Error">{item.error ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailLoading && (
        <div className="inline-loading">
          <Loader2 className="spin" size={15} />
          Updating
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "error" | "cancelled";
}) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
