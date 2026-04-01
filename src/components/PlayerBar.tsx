import { useState } from "react";

declare const __APP_VERSION__: string;

interface PlayerBarProps {
  rsn: string;
  loading: boolean;
  error: string | null;
  onLookup: (rsn: string) => void;
  onClear: () => void;
}

export default function PlayerBar({
  rsn,
  loading,
  error,
  onLookup,
  onClear,
}: PlayerBarProps) {
  const [input, setInput] = useState(rsn);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLookup(input);
  };

  const handleClear = () => {
    setInput("");
    onClear();
  };

  return (
    <div className="h-12 bg-bg-secondary border-b border-border flex items-center px-4 gap-3 shrink-0">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <label className="text-xs text-text-secondary">RSN</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter username..."
          className="bg-bg-tertiary border border-border rounded px-2 py-1 text-sm w-40"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent hover:bg-accent-hover text-white text-xs px-3 py-1 rounded transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Lookup"}
        </button>
      </form>
      {rsn && !loading && !error && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-success font-medium">{rsn}</span>
          <button
            onClick={handleClear}
            className="text-xs text-text-secondary hover:text-danger transition-colors"
            title="Clear saved RSN"
          >
            ✕
          </button>
        </div>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
      <div className="flex-1" />
      <span className="text-[10px] text-text-secondary/40">RuneWise v{__APP_VERSION__}</span>
    </div>
  );
}
