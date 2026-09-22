import { profileRequest } from "@/features/auth/auth-api";
import { useAuth } from "@/features/auth/auth-context";
import type { AuthUser } from "@/features/auth/auth.types";
import { ApiError } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const handleUnauthorized = useCallback(async () => {
    await logout();
    navigate("/login", { replace: true, state: { from: location } });
  }, [location, logout, navigate]);

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
        if (error instanceof ApiError && error.status === 401)
          return void handleUnauthorized();
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
  }, [handleUnauthorized, retryKey, token]);

  return {
    profile,
    loadState,
    errorMessage,
    setRetryKey,
  };
}
