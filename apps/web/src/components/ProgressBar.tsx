import type { JobStats } from "../types";

export function ProgressBar({ stats }: { stats: JobStats }) {
  const total = Math.max(stats.total, 1);
  const success = (stats.success / total) * 100;
  const error = (stats.error / total) * 100;
  const cancelled = (stats.cancelled / total) * 100;

  return (
    <div className="progress-shell" aria-label="Job progress">
      <span className="progress-success" style={{ width: `${success}%` }} />
      <span className="progress-error" style={{ width: `${error}%` }} />
      <span className="progress-cancelled" style={{ width: `${cancelled}%` }} />
    </div>
  );
}
