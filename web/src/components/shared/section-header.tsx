import type { ReactNode } from "react";
import { Button } from "../ui/button";
import { Search } from "lucide-react";
import { Input } from "../ui/input";

type SectionHeaderProps = {
  heading: string;
  description?: string;
  actionLabel?: ReactNode;
  onAction?: () => void;
  actionDisabled?: boolean;
  className?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
};

const SectionHeader = ({
  heading,
  description,
  actionLabel,
  onAction,
  actionDisabled = false,
  className,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Cari...",
  searchAriaLabel = "Cari",
}: SectionHeaderProps) => {
  const showAction = Boolean(actionLabel && onAction);
  const showSearch = Boolean(onSearchChange);

  return (
    <header
      className={
        className
          ? `flex flex-wrap items-start justify-between gap-3 ${className}`
          : "flex flex-wrap items-start justify-between gap-3"
      }
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {(showSearch || showAction) && (
        <div className="flex flex-wrap items-center gap-3">
          {showSearch && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-60 hover:translate-y-2 transform" />
              <Input
                type="search"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchAriaLabel}
                className="h-9 w-full rounded-md bg-background text-primary border-border shadow-[0_4px_0_var(--border)] transform transition duration-100 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:border-border sm:w-56"
              />
            </div>
          )}

          {showAction && (
            <Button
              className={`bg-background text-primary border-border shadow-[0_4px_0_var(--border)] transform hover:translate-y-2 hover:shadow-none hover:bg-background transition duration-100`}
              disabled={actionDisabled}
              onClick={onAction}
            >
              <span className="inline-flex items-center gap-2">
                {actionLabel}
              </span>
            </Button>
          )}
        </div>
      )}
    </header>
  );
};

export default SectionHeader;
