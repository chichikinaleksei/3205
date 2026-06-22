import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { JobDetails } from "./components/JobDetails";
import { JobForm } from "./components/JobForm";
import { JobList } from "./components/JobList";
import { isTerminalStatus, useJobStore } from "./store/jobs";

export function App() {
  const activeJobId = useJobStore((state) => state.activeJobId);
  const activeStatus = useJobStore((state) => state.activeJob?.status);
  const refreshJobs = useJobStore((state) => state.refreshJobs);
  const refreshActiveJob = useJobStore((state) => state.refreshActiveJob);
  const listLoading = useJobStore((state) => state.listLoading);
  const error = useJobStore((state) => state.error);
  const clearError = useJobStore((state) => state.clearError);

  useEffect(() => {
    void refreshJobs();
    const interval = window.setInterval(() => {
      void refreshJobs();
    }, 4_000);

    return () => window.clearInterval(interval);
  }, [refreshJobs]);

  useEffect(() => {
    if (!activeJobId || isTerminalStatus(activeStatus)) {
      return;
    }

    void refreshActiveJob();
    const interval = window.setInterval(() => {
      void refreshActiveJob();
    }, 1_500);

    return () => window.clearInterval(interval);
  }, [activeJobId, activeStatus, refreshActiveJob]);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>URL Checker</h1>
          <p>Asynchronous HEAD jobs</p>
        </div>
        <button
          className="icon-button"
          onClick={() => void refreshJobs()}
          title="Refresh jobs"
          aria-label="Refresh jobs"
          disabled={listLoading}
        >
          <RefreshCw size={18} />
        </button>
      </header>

      {error && (
        <div className="toast" role="alert">
          <span>{error}</span>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      <main className="layout">
        <aside className="sidebar">
          <JobForm />
          <JobList />
        </aside>
        <section className="workspace">
          <JobDetails />
        </section>
      </main>
    </div>
  );
}
