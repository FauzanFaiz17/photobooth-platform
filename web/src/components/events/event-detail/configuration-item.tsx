import { Badge } from "lucide-react";

export function ConfigurationItems({
  items,
}: {
  readonly items: ReadonlyArray<{ name: string; detail: string }>;
}) {
  return (
    <div className="grid gap-2">
      {items.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="flex items-start justify-between gap-3 rounded-md border p-3"
        >
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.detail}</p>
          </div>
          {index === 0 && <Badge>Default</Badge>}
        </div>
      ))}
    </div>
  );
}