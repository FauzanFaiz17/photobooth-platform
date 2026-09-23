import { useAuth } from "@/features/auth/auth-context";
import { ApiError } from "@/lib/api-client";
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface UseEventHandlerOptions {
  /** Path to navigate after logout. Defaults to current location. */
  loginRedirect?: string;
  /** Value for `state.from` when navigating to forbidden page. Defaults to current pathname. */
  forbiddenFrom?: string;
}

export function useEventHandler(options?: UseEventHandlerOptions) {
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
  }, [location, loginRedirect, logout, navigate]);

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
