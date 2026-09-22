import type { Building2 } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  readonly icon: typeof Building2;
  readonly title: string;
  readonly description?: string;
}) {
  return (
    <div className="grid min-h-64 place-items-center text-center">
      <div>
        <Icon className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}