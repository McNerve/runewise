import { useState, useMemo, useCallback, useRef } from "react";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import { formatGp } from "../../lib/format";
import { searchItems, type ItemMapping } from "../../lib/api/ge";
import Chart from "../../components/Chart";
import type { LineData, Time } from "lightweight-charts";

const STORAGE_KEY = "runewise_flip_journal";

export interface FlipEntry {
  id: string;
  itemId: number;
  itemName: string;
  buyPrice: number;
  sellPrice?: number;
  qty: number;
  boughtAt: string;
  soldAt?: string;
  notes?: string;
}

function calcProfit(entry: FlipEntry): number | null {
  if (entry.sellPrice == null) return null;
  return Math.floor((entry.sellPrice - entry.buyPrice) * entry.qty * 0.99);
}

function heldTime(entry: FlipEntry): string {
  const end = entry.soldAt ? new Date(entry.soldAt) : new Date();
  const start = new Date(entry.boughtAt);
  const ms = end.getTime() - start.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function localDateTimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Item search dropdown ──────────────────────────────────────────────────────

function ItemSearch({ onSelect }: { onSelect: (item: ItemMapping) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemMapping[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (v: string) => {
    setQuery(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (v.length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      const r = await searchItems(v);
      setResults(r.slice(0, 8));
      setOpen(true);
    }, 200);
  };

  const pick = (item: ItemMapping) => {
    setQuery(item.name);
    setResults([]);
    setOpen(false);
    onSelect(item);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Item name..."
        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-bg-tertiary border border-border rounded-lg overflow-hidden shadow-lg">
          {results.map((item) => (
            <button
              key={item.id}
              onMouseDown={() => pick(item)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-bg-secondary transition-colors flex items-center gap-2"
            >
              <span className="flex-1 truncate">{item.name}</span>
              <span className="text-text-secondary/50 shrink-0">#{item.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Entry form ────────────────────────────────────────────────────────────────

interface EntryFormProps {
  initial?: FlipEntry | null;
  onSubmit: (entry: FlipEntry) => void;
  onCancel?: () => void;
}

function EntryForm({ initial, onSubmit, onCancel }: EntryFormProps) {
  const now = new Date();
  const [itemId, setItemId] = useState(initial?.itemId ?? 0);
  const [itemName, setItemName] = useState(initial?.itemName ?? "");
  const [buyPrice, setBuyPrice] = useState(String(initial?.buyPrice ?? ""));
  const [sellPrice, setSellPrice] = useState(String(initial?.sellPrice ?? ""));
  const [qty, setQty] = useState(String(initial?.qty ?? "1"));
  const [boughtAt, setBoughtAt] = useState(
    initial?.boughtAt ? localDateTimeValue(new Date(initial.boughtAt)) : localDateTimeValue(now)
  );
  const [soldAt, setSoldAt] = useState(
    initial?.soldAt ? localDateTimeValue(new Date(initial.soldAt)) : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const valid = itemName.trim() && Number(buyPrice) > 0 && Number(qty) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      id: initial?.id ?? uid(),
      itemId,
      itemName: itemName.trim(),
      buyPrice: Number(buyPrice),
      sellPrice: sellPrice ? Number(sellPrice) : undefined,
      qty: Number(qty),
      boughtAt: new Date(boughtAt).toISOString(),
      soldAt: soldAt ? new Date(soldAt).toISOString() : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="section-kicker mb-1 block">Item</label>
          <ItemSearch
            onSelect={(item) => { setItemId(item.id); setItemName(item.name); }}
          />
          {itemName && <div className="text-[11px] text-text-secondary/60 mt-0.5 truncate">{itemName}</div>}
        </div>
        <div>
          <label className="section-kicker mb-1 block">Qty</label>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="section-kicker mb-1 block">Buy price (ea)</label>
          <input
            type="number"
            min="1"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="section-kicker mb-1 block">Sell price (ea)</label>
          <input
            type="number"
            min="0"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            placeholder="Leave blank if unsold"
            className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="section-kicker mb-1 block">Bought at</label>
          <input
            type="datetime-local"
            value={boughtAt}
            onChange={(e) => setBoughtAt(e.target.value)}
            className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="section-kicker mb-1 block">Sold at</label>
          <input
            type="datetime-local"
            value={soldAt}
            onChange={(e) => setSoldAt(e.target.value)}
            className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="section-kicker mb-1 block">Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
          className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!valid}
          className="px-4 py-1.5 text-sm font-medium bg-accent text-on-accent rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          {initial ? "Update" : "Add Flip"}
        </button>
      </div>
    </form>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({ entries }: { entries: FlipEntry[] }) {
  const closed = entries.filter((e) => e.sellPrice != null);
  const totalProfit = closed.reduce((s, e) => s + (calcProfit(e) ?? 0), 0);
  const wins = closed.filter((e) => (calcProfit(e) ?? 0) > 0).length;
  const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;
  const avgRoi = closed.length > 0
    ? closed.reduce((s, e) => {
        const cost = e.buyPrice * e.qty;
        const profit = calcProfit(e) ?? 0;
        return s + (cost > 0 ? (profit / cost) * 100 : 0);
      }, 0) / closed.length
    : 0;

  const stats = [
    { label: "Total flips", value: String(entries.length), color: "text-text-primary" },
    {
      label: "Total profit",
      value: formatGp(totalProfit),
      color: totalProfit >= 0 ? "text-success" : "text-danger",
    },
    {
      label: "Win rate",
      value: closed.length > 0 ? `${winRate.toFixed(0)}%` : "—",
      color: "text-text-primary",
    },
    {
      label: "Avg ROI",
      value: closed.length > 0 ? `${avgRoi.toFixed(1)}%` : "—",
      color: avgRoi >= 0 ? "text-success" : "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-bg-tertiary rounded-lg p-3 text-center">
          <div className="text-[11px] text-text-secondary mb-0.5">{s.label}</div>
          <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Journal table ─────────────────────────────────────────────────────────────

interface JournalTableProps {
  entries: FlipEntry[];
  onEdit: (entry: FlipEntry) => void;
  onDelete: (id: string) => void;
  onClose: (entry: FlipEntry) => void;
}

function JournalTable({ entries, onEdit, onDelete, onClose }: JournalTableProps) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.boughtAt).getTime() - new Date(a.boughtAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="text-center text-sm text-text-secondary/50 py-8">
        No flips logged yet. Add one above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-text-secondary/60 border-b border-border">
            <th className="pb-2 pr-4 font-medium">Item</th>
            <th className="pb-2 pr-4 font-medium text-right">Buy</th>
            <th className="pb-2 pr-4 font-medium text-right">Sell</th>
            <th className="pb-2 pr-4 font-medium text-right">Qty</th>
            <th className="pb-2 pr-4 font-medium text-right">Profit</th>
            <th className="pb-2 pr-4 font-medium text-right">Held</th>
            <th className="pb-2 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {sorted.map((entry) => {
            const profit = calcProfit(entry);
            const isOpen = entry.sellPrice == null;
            return (
              <tr key={entry.id} className="hover:bg-bg-secondary/30 transition-colors">
                <td className="py-2 pr-4">
                  <div className="font-medium text-text-primary">{entry.itemName}</div>
                  {entry.notes && (
                    <div className="text-[11px] text-text-secondary/50 truncate max-w-[180px]">{entry.notes}</div>
                  )}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatGp(entry.buyPrice)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-text-secondary/70">
                  {isOpen ? (
                    <span className="text-[11px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">Open</span>
                  ) : (
                    formatGp(entry.sellPrice ?? null)
                  )}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{entry.qty.toLocaleString()}</td>
                <td className={`py-2 pr-4 text-right tabular-nums font-medium ${
                  profit == null ? "text-text-secondary/40" : profit >= 0 ? "text-success" : "text-danger"
                }`}>
                  {profit == null ? "—" : formatGp(profit)}
                </td>
                <td className="py-2 pr-4 text-right text-text-secondary/60 text-xs">{heldTime(entry)}</td>
                <td className="py-2">
                  <div className="flex gap-1 justify-end">
                    {isOpen && (
                      <button
                        onClick={() => onClose(entry)}
                        className="text-[10px] px-2 py-1 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
                      >
                        Close
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(entry)}
                      className="text-[10px] px-2 py-1 text-text-secondary/60 hover:text-text-primary rounded hover:bg-bg-secondary transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="text-[10px] px-2 py-1 text-text-secondary/40 hover:text-danger rounded hover:bg-bg-secondary transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Close-now modal ───────────────────────────────────────────────────────────

function CloseModal({ entry, onConfirm, onCancel }: {
  entry: FlipEntry;
  onConfirm: (sellPrice: number) => void;
  onCancel: () => void;
}) {
  const [sellPrice, setSellPrice] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-bg-primary border border-border rounded-xl p-5 w-80 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-text-primary mb-1">Close flip</h3>
        <p className="text-sm text-text-secondary mb-3">{entry.itemName} × {entry.qty.toLocaleString()}</p>
        <label className="section-kicker mb-1 block">Sell price (ea)</label>
        <input
          type="number"
          min="1"
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
          autoFocus
          className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm mb-3"
        />
        {sellPrice && (
          <div className="text-xs text-text-secondary mb-3">
            Profit: <span className={`font-medium ${
              Math.floor((Number(sellPrice) - entry.buyPrice) * entry.qty * 0.99) >= 0 ? "text-success" : "text-danger"
            }`}>
              {formatGp(Math.floor((Number(sellPrice) - entry.buyPrice) * entry.qty * 0.99))}
            </span>
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
          <button
            disabled={!sellPrice || Number(sellPrice) <= 0}
            onClick={() => onConfirm(Number(sellPrice))}
            className="px-4 py-1.5 text-sm font-medium bg-accent text-on-accent rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-40"
          >
            Close flip
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profit curve ──────────────────────────────────────────────────────────────

function ProfitCurve({ entries }: { entries: FlipEntry[] }) {
  const chartData = useMemo<LineData<Time>[]>(() => {
    const closed = entries
      .filter((e) => e.sellPrice != null && e.soldAt != null)
      .sort((a, b) => new Date(a.soldAt!).getTime() - new Date(b.soldAt!).getTime());

    const points: LineData<Time>[] = [];
    let cumulative = 0;
    for (const e of closed) {
      cumulative += calcProfit(e) ?? 0;
      points.push({
        time: Math.floor(new Date(e.soldAt!).getTime() / 1000) as Time,
        value: cumulative,
      });
    }
    return points;
  }, [entries]);

  if (chartData.length < 2) {
    return (
      <div className="text-center text-xs text-text-secondary/40 py-6">
        Close at least 2 flips to see the profit curve.
      </div>
    );
  }

  return <Chart data={chartData} type="line" height={220} />;
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function FlipJournal() {
  const [entries, setEntries] = useState<FlipEntry[]>(() =>
    loadJSON<FlipEntry[]>(STORAGE_KEY, [])
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FlipEntry | null>(null);
  const [closing, setClosing] = useState<FlipEntry | null>(null);

  const persist = useCallback((next: FlipEntry[]) => {
    setEntries(next);
    saveJSON(STORAGE_KEY, next);
  }, []);

  const handleAdd = (entry: FlipEntry) => {
    persist([...entries, entry]);
    setShowForm(false);
  };

  const handleUpdate = (entry: FlipEntry) => {
    persist(entries.map((e) => (e.id === entry.id ? entry : e)));
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    persist(entries.filter((e) => e.id !== id));
  };

  const handleCloseFill = (entry: FlipEntry) => setClosing(entry);

  const handleCloseConfirm = (sellPrice: number) => {
    if (!closing) return;
    const updated: FlipEntry = {
      ...closing,
      sellPrice,
      soldAt: new Date().toISOString(),
    };
    persist(entries.map((e) => (e.id === closing.id ? updated : e)));
    setClosing(null);
  };

  const closedEntries = entries.filter((e) => e.sellPrice != null);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 font-semibold">GE Flip Journal</h2>
        <button
          onClick={() => { setShowForm((v) => !v); setEditing(null); }}
          className="px-3 py-1.5 text-sm font-medium bg-accent text-on-accent rounded-lg hover:bg-accent-hover transition-colors"
        >
          {showForm ? "Cancel" : "+ New Flip"}
        </button>
      </div>

      {(showForm || editing) && (
        <div className="bg-bg-secondary/50 border border-border rounded-xl p-4">
          <EntryForm
            initial={editing}
            onSubmit={editing ? handleUpdate : handleAdd}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      <StatsStrip entries={entries} />

      <div className="bg-bg-secondary/30 border border-border rounded-xl p-4">
        <JournalTable
          entries={entries}
          onEdit={(e) => { setEditing(e); setShowForm(false); }}
          onDelete={handleDelete}
          onClose={handleCloseFill}
        />
      </div>

      {closedEntries.length >= 2 && (
        <div className="bg-bg-secondary/30 border border-border rounded-xl p-4">
          <div className="section-kicker mb-3">Profit Curve</div>
          <ProfitCurve entries={entries} />
        </div>
      )}

      {closing && (
        <CloseModal
          entry={closing}
          onConfirm={handleCloseConfirm}
          onCancel={() => setClosing(null)}
        />
      )}
    </div>
  );
}
