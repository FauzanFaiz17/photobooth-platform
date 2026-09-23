import { useCallback } from "react";
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
  return { params, setParams, updateParams}
}
