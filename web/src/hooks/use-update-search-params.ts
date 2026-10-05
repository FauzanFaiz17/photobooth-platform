import { useCallback, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

export function useUpdateSearchParams() {
  const [params, setParams] = useSearchParams();

  const updateParams = useCallback(
    (updates: Readonly<Record<string, string | null>>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(updates)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const reset = useCallback(
    () => setParams(new URLSearchParams(), { replace: true }),
    [setParams],
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("search");
    updateParams({
      search: typeof value === "string" ? value.trim() || null : null,
      page: null,
    });
  }

  return { params, setParams, updateParams, reset, submitSearch };
}
