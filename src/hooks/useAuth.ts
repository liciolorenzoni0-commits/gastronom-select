import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

type AuthUser = {
  name: string;
  role: string;
  unionId: string;
};

export function useAuth() {
  const utils = trpc.useUtils();

  const {
    data: userData,
    isLoading,
  } = trpc.password.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.password.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      window.location.reload();
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  const user: AuthUser | null = userData
    ? {
        name: userData.name || "Admin",
        role: userData.role || "admin",
        unionId: userData.unionId || "admin",
      }
    : null;

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: isLoading || logoutMutation.isPending,
      logout,
    }),
    [user, isLoading, logoutMutation.isPending, logout],
  );
}
