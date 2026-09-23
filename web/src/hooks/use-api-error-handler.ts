import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { ApiError } from "@/lib/api-client";

interface UseApiErrorHandlerOptions {
  /** Override tujuan redirect setelah login (default: halaman saat ini) */
  loginRedirect?: string;
  /** Override "from" saat forbidden (default: pathname saat ini) */
  forbiddenFrom?: string;
}

export function useApiErrorHandler(options?: UseApiErrorHandlerOptions) {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const loginRedirect = options?.loginRedirect;
  const forbiddenFrom = options?.forbiddenFrom ?? location.pathname;

  const handleUnauthorized = useCallback(async () => {
    await logout();
    const from =
      loginRedirect !== undefined
        ? { pathname: loginRedirect, search: "" }
        : { pathname: location.pathname, search: location.search };
    navigate("/login", { replace: true, state: { from } });
  }, [location.pathname, location.search, loginRedirect, logout, navigate]);

  const handleForbidden = useCallback(() => {
    navigate("/admin/forbidden", {
      replace: true,
      state: { from: forbiddenFrom },
    });
  }, [forbiddenFrom, navigate]);

  const handleApiError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        void handleUnauthorized();
        return true;
      }
      if (error instanceof ApiError && error.status === 403) {
        handleForbidden();
        return true;
      }
      return false;
    },
    [handleForbidden, handleUnauthorized],
  );

  return { token, handleUnauthorized, handleForbidden, handleApiError };
}