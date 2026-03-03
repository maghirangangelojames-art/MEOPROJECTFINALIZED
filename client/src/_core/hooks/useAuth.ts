import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const isUnauthorizedError =
    (meQuery.error instanceof TRPCClientError &&
      meQuery.error.data?.code === "UNAUTHORIZED") ||
    (logoutMutation.error instanceof TRPCClientError &&
      logoutMutation.error.data?.code === "UNAUTHORIZED");

  useEffect(() => {
    if (!isUnauthorizedError) return;
    utils.auth.me.setData(undefined, null);
  }, [isUnauthorizedError, utils]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const resolvedUser = isUnauthorizedError ? null : meQuery.data ?? null;

    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(resolvedUser)
    );

    return {
      user: resolvedUser,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(resolvedUser),
    };
  }, [
    isUnauthorizedError,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  // Note: Auto-logout on tab close was removed because:
  // 1. It interfered with OAuth redirect flow (logging out during Google sign-in)
  // 2. beforeunload fires on ANY navigation, not just tab/window close
  // 3. Users expect to stay logged in when refreshing or navigating
  // If you need session timeout, implement it server-side with token expiration

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
