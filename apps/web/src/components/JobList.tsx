import { Clock3 } from "lucide-react";
import { useJobStore } from "../store/jobs";
import { formatDate, shortId } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

export function JobList() {
  const jobs = useJobStore((state) => state.jobs);
  const activeJobId = useJobStore((state) => state.activeJobId);
  const selectJob = useJobStore((state) => state.selectJob);

  return (
    <div className="list-panel">
      <div className="section-title">
        <h2>Jobs</h2>
        <span>{jobs.length}</span>
      </div>

      <div className="job-list">
        {jobs.length === 0 ? (
          <div className="empty-list">No jobs yet.</div>
        ) : (
          jobs.map((job) => (
            <button
              className={job.id === activeJobId ? "job-card active" : "job-card"}
              key={job.id}
              onClick={() => selectJob(job.id)}
            >
              <span className="job-card-top">
                <strong>{shortId(job.id)}</strong>
                <StatusBadge status={job.status} />
              </span>
              <span className="job-meta">
                <Clock3 size={14} />
                {formatDate(job.createdAt)}
              </span>
              <span className="stats-row">
                <span>{job.stats.total} total</span>
                <span>{job.stats.success} ok</span>
                <span>{job.stats.error} err</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
