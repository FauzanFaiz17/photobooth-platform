import samplePhoto from "@/assets/preview.webp";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { EventConfigurationOption } from "@/features/events/event.types";
import { cn } from "@/lib/utils";
import { Frame as FrameIcon, ImageOff, RefreshCw } from "lucide-react";
import { useState } from "react";

const CHECKERBOARD = {
  backgroundImage:
    "repeating-conic-gradient(rgba(0,0,0,0.06) 0% 25%, transparent 0% 50%)",
  backgroundSize: "16px 16px",
} as const;

export function OptionCard({
  option,
  selected,
  isDefault,
  previewStyle,
  onToggle,
  onExpired,
}: {
  readonly option: EventConfigurationOption;
  readonly selected: boolean;
  readonly isDefault: boolean;
  readonly previewStyle?: string;
  readonly onToggle: () => void;
  readonly onExpired: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const isFilterPreview = previewStyle !== undefined;
  const imageUrl = option.image_url ?? (isFilterPreview ? samplePhoto : null);

  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-label={option.name}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === " " || keyEvent.key === "Enter") {
          keyEvent.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "group relative cursor-pointer h-48 overflow-hidden rounded-lg border bg-background outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "hover:border-primary/40",
      )}
    >
      <div
        className="relative aspect-4/3 w-full overflow-hidden"
        style={CHECKERBOARD}
      >
        {imageUrl && !broken ? (
          <img
            src={imageUrl}
            alt={
              isFilterPreview
                ? `Pratinjau Filter ${option.name}`
                : `Frame ${option.name}`
            }
            loading="lazy"
            className={cn(
              "absolute inset-0 size-full object-cover",
              isFilterPreview ? "object-cover" : "object-contain p-3",
            )}
            style={previewStyle === undefined ? undefined : { filter: previewStyle }}
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center gap-2 p-3 text-center">
            {broken ? (
              <ImageOff className="size-6 text-muted-foreground" />
            ) : (
              <FrameIcon className="size-8 text-muted-foreground" />
            )}
            {broken && option.image_url && (
              <button
                type="button"
                className="text-xs font-medium text-primary underline"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  onExpired();
                }}
              >
                <RefreshCw className="mr-1 inline size-3" aria-hidden="true" />
                Muat ulang
              </button>
            )}
          </div>
        )}
        <Checkbox
          checked={selected}
          tabIndex={-1}
          aria-hidden="true"
          onCheckedChange={onToggle}
          className="pointer-events-none absolute left-2 top-2 bg-background"
        />
        {isDefault && (
          <Badge className="absolute right-2 top-2" variant="secondary">
            Default
          </Badge>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-2 border-t px-3 py-2">
        <span
          className="min-w-0 flex-1 truncate text-sm font-medium"
          title={option.name}
        >
          {option.name}
        </span>
        {option.is_global && <Badge variant="outline">Global</Badge>}
      </div>
    </div>
  );
}
