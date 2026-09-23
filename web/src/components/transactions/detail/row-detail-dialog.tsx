import type { ReactElement } from "react";

export function Row({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-72 break-all text-right font-medium">{value}</dd>
    </div>
  );
}