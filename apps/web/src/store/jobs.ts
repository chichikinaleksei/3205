import { create } from "zustand";
import { api } from "../api/client";
import type { JobDetail, JobStatus, JobSummary } from "../types";

interface JobState {
  jobs: JobSummary[];
  activeJobId: string | null;
  activeJob: JobDetail | null;
  listLoading: boolean;
  detailLoading: boolean;
  creating: boolean;
  cancelling: boolean;
  error: string | null;
  refreshJobs: () => Promise<void>;
  createJob: (text: string) => Promise<void>;
  selectJob: (jobId: string) => void;
  refreshActiveJob: () => Promise<void>;
  cancelActiveJob: () => Promise<void>;
  clearError: () => void;
  loadJob: (jobId: string) => Promise<void>;
}

let detailRequestSeq = 0;

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  activeJobId: null,
  activeJob: null,
  listLoading: false,
  detailLoading: false,
  creating: false,
  cancelling: false,
  error: null,

  async refreshJobs() {
    set({ listLoading: true });
    try {
      const { jobs } = await api.listJobs();
      set({ jobs, listLoading: false });
    } catch (error) {
      set({ error: formatError(error), listLoading: false });
    }
  },

  async createJob(text: string) {
    const urls = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      set({ error: "Add at least one URL." });
      return;
    }

    set({ creating: true, error: null });
    try {
      const { jobId } = await api.createJob(urls);
      set({ activeJobId: jobId, activeJob: null, creating: false });
      await Promise.all([get().refreshJobs(), get().loadJob(jobId)]);
    } catch (error) {
      set({ error: formatError(error), creating: false });
    }
  },

  selectJob(jobId: string) {
    set({ activeJobId: jobId, activeJob: null, error: null });
    void get().loadJob(jobId);
  },

  async refreshActiveJob() {
    const jobId = get().activeJobId;
    if (!jobId) {
      return;
    }

    await get().loadJob(jobId);
  },

  async cancelActiveJob() {
    const jobId = get().activeJobId;
    if (!jobId) {
      return;
    }

    set({ cancelling: true, error: null });
    try {
      const { job } = await api.cancelJob(jobId);
      if (get().activeJobId === jobId) {
        set({ activeJob: job });
      }
      await get().refreshJobs();
      set({ cancelling: false });
    } catch (error) {
      set({ error: formatError(error), cancelling: false });
    }
  },

  clearError() {
    set({ error: null });
  },

  async loadJob(jobId: string) {
    const requestSeq = ++detailRequestSeq;
    set({ detailLoading: true });
    try {
      const { job } = await api.getJob(jobId);
      if (get().activeJobId === jobId && requestSeq === detailRequestSeq) {
        set({ activeJob: job, detailLoading: false });
      }
    } catch (error) {
      if (get().activeJobId === jobId && requestSeq === detailRequestSeq) {
        set({ error: formatError(error), detailLoading: false });
      }
    }
  }
}));

export function isTerminalStatus(status?: JobStatus): boolean {
  return status === "completed" || status === "cancelled" || status === "failed";
}

function formatError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Request failed.";
}
