import { Play } from "lucide-react";
import { FormEvent, useState } from "react";
import { useJobStore } from "../store/jobs";

const sampleUrls = ["https://example.com", "https://github.com"].join("\n");

export function JobForm() {
  const [text, setText] = useState(sampleUrls);
  const createJob = useJobStore((state) => state.createJob);
  const creating = useJobStore((state) => state.creating);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void createJob(text);
  };

  return (
    <form className="tool-panel" onSubmit={handleSubmit}>
      <div className="section-title">
        <h2>New job</h2>
      </div>
      <label className="field-label" htmlFor="urls">
        URLs
      </label>
      <textarea
        id="urls"
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck={false}
        rows={7}
      />
      <button className="primary-button" type="submit" disabled={creating}>
        <Play size={17} />
        {creating ? "Starting..." : "Start check"}
      </button>
    </form>
  );
}
