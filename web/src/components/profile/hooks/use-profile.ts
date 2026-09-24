import { profileRequest } from "@/features/auth/auth-api";
import type { AuthUser } from "@/features/auth/auth.types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { ApiError } from "@/lib/api-client";
import { useEffect, useState } from "react";

export function useProfile() {
  const { handleApiError, token } = useApiErrorHandler();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    const accessToken = token;
    const controller = new AbortController();

    async function loadProfile() {
      setLoadState("loading");
      setErrorMessage("");
      try {
        const result = await profileRequest(accessToken);
        if (controller.signal.aborted) return;
        setProfile(result);
        setLoadState("success");
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if(handleApiError(error)) return;
        setProfile(null);
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server.",
        );
        setLoadState("error");
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, [retryKey, token, handleApiError]);

  return {
    profile,
    loadState,
    errorMessage,
    setRetryKey,
  };
}
