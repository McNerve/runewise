import { formatGp } from "../../../lib/format";
import type { GESnapshot } from "../wikiLookupGe";

interface WikiInfoboxProps {
  title: string;
  image: string | null;
  html: string | null;
  fields: Array<{ label: string; value: string }>;
  totalFields: number;
  geSnapshot?: GESnapshot | null;
  pageUrl?: string | null;
  onContentClick?: React.MouseEventHandler<HTMLElement>;
}

export default function WikiInfobox({
  title,
  image,
  html,
  fields,
  totalFields,
  geSnapshot,
  pageUrl,
  onContentClick,
}: WikiInfoboxProps) {
  return (
    <section className="wiki-infobox-wrap">
      <div className="text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
        Infobox
      </div>
      {html ? (
        <div
          className="wiki-infobox article-content mt-3"
          onClick={onContentClick}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="mt-3 space-y-3">
          {image ? (
            <img
              src={image}
              alt={title}
              className="max-h-64 w-full rounded-xl border border-border object-contain bg-bg-tertiary/30"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <div className="text-sm font-semibold text-text-primary">{title}</div>
          {fields.length > 0 ? (
            <dl className="space-y-2">
              {fields.map((field) => (
                <div key={field.label} className="px-1">
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                    {field.label}
                  </dt>
                  <dd className="mt-0.5 text-sm text-text-primary">{field.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="px-1 text-sm text-text-secondary">
              No structured infobox fields on this page.
            </p>
          )}
        </div>
      )}

      {geSnapshot ? (
        <div
          data-testid="snapshot-ge-price"
          className="mt-3 rounded-xl border border-accent/20 bg-accent/5 px-3 py-3 space-y-1"
        >
          <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
            Grand Exchange
          </div>
          <div
            className={`text-lg font-semibold ${
              geSnapshot.price !== null && geSnapshot.price >= 1_000_000
                ? "text-accent"
                : "text-text-primary"
            }`}
          >
            {geSnapshot.price !== null ? `${formatGp(geSnapshot.price)} coins` : "—"}
          </div>
          {geSnapshot.buyLimit !== null || geSnapshot.dailyVolume !== null ? (
            <div className="text-xs text-text-secondary">
              {geSnapshot.buyLimit !== null && (
                <span>Buy limit: {geSnapshot.buyLimit.toLocaleString()}</span>
              )}
              {geSnapshot.buyLimit !== null && geSnapshot.dailyVolume !== null && (
                <span className="mx-1">·</span>
              )}
              {geSnapshot.dailyVolume !== null && (
                <span>Daily vol: {geSnapshot.dailyVolume.toLocaleString()}</span>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {!html && totalFields > fields.length && pageUrl ? (
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block px-1 text-[10px] uppercase tracking-[0.16em] text-accent hover:underline"
        >
          +{totalFields - fields.length} more fields on wiki
        </a>
      ) : null}
    </section>
  );
}
