import { useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { ApiError } from "@/lib/api-client";

interface PaginatedResponse {
  readonly meta: { readonly last_page: number };
}

export function usePaginatedList<
  Response extends PaginatedResponse,
  Extra = null,
>({
  token,
  page,
  load,
  loadExtra,
  onClampPage,
  dependencies,
}: {
  readonly token: string | null;
  readonly page: number;
  readonly load: (token: string, signal: AbortSignal) => Promise<Response>;
  readonly loadExtra?: (token: string, signal: AbortSignal) => Promise<Extra>;
  readonly onClampPage: (lastPage: number) => void;
  readonly dependencies: ReadonlyArray<unknown>;
}) {
  const { handleApiError } = useApiErrorHandler();
  const [response, setResponse] = useState<Response | null>(null);
  const [extra, setExtra] = useState<Extra | null>(null);
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!token) return;
    const accessToken = token;
    const controller = new AbortController();

    async function loadPage(): Promise<void> {
      setState("loading");
      setError("");
      try {
        const [main, extraResult] = await Promise.all([
          load(accessToken, controller.signal),
          loadExtra
            ? loadExtra(accessToken, controller.signal)
            : Promise.resolve(null),
        ]);
        if (controller.signal.aborted) return;
        if (page > Math.max(1, main.meta.last_page)) {
          onClampPage(Math.max(1, main.meta.last_page));
          return;
        }
        setResponse(main);
        setExtra(extraResult);
        setState("success");
      } catch (caught: unknown) {
        if (controller.signal.aborted) return;
        if (handleApiError(caught)) return;
        setResponse(null);
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Tidak dapat terhubung ke server.",
        );
        setState("error");
      }
    }

    void loadPage();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load/loadExtra/onClampPage are recreated each render; callers list the values they depend on.
  }, [token, page, retry, handleApiError, ...dependencies]);

  return { response, extra, state, error, retry, setRetry };
}
