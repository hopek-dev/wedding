import { formatGBP } from "@/lib/format";
import type { CategoryTotal } from "@/lib/budget";

const LABEL_WIDTH = 140;

function BarRow({
  value,
  max,
  colorVar,
  seriesLabel,
  categoryLabel,
}: {
  value: number;
  max: number;
  colorVar: string;
  seriesLabel: string;
  categoryLabel: string;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 1.5 : 0) : 0;
  return (
    <div
      className="flex h-4 items-center"
      role="img"
      aria-label={`${categoryLabel} ${seriesLabel}: ${formatGBP(value)}`}
    >
      <div
        className="h-4 rounded-r-[4px] rounded-l-none"
        style={{ width: `${pct}%`, backgroundColor: `var(${colorVar})` }}
      />
      <span className="ml-1.5 text-[11px] whitespace-nowrap text-muted-foreground">{formatGBP(value)}</span>
    </div>
  );
}

export function CategoryBarChart({ data }: { data: CategoryTotal[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card py-12 text-center text-sm text-muted-foreground">
        Add an expense to see estimated vs. actual spend by category.
      </div>
    );
  }

  const max = Math.max(...data.flatMap((d) => [d.estimated, d.actual]), 1);

  return (
    <div className="grid gap-3">
      <div className="overflow-x-auto rounded-lg border bg-card p-4">
        <div className="grid min-w-[420px] gap-3">
          {data.map((d) => (
            <div key={d.category} className="flex items-center gap-3">
              <div
                className="shrink-0 truncate text-sm text-muted-foreground"
                style={{ width: LABEL_WIDTH }}
                title={d.category}
              >
                {d.category}
              </div>
              <div className="grid flex-1 gap-[2px]">
                <BarRow
                  value={d.estimated}
                  max={max}
                  colorVar="--chart-estimated"
                  seriesLabel="estimated"
                  categoryLabel={d.category}
                />
                <BarRow
                  value={d.actual}
                  max={max}
                  colorVar="--chart-actual"
                  seriesLabel="actual"
                  categoryLabel={d.category}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] bg-chart-estimated" />
          Estimated
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] bg-chart-actual" />
          Actual
        </span>
      </div>
    </div>
  );
}
