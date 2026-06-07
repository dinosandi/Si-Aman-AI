import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authRepository } from "../../infrastructure/repositories";
import type { RegisterInput } from "../../domain/repositories/authRepository";

const AUTH_USER_KEY = "auth-user";

export const useAuth = () => {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: [AUTH_USER_KEY],
    queryFn: () => authRepository.getCurrentUser(),
    enabled: localStorage.getItem("warga_authenticated") === "true",
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const session = await authRepository.login(email, password);
      return session;
    },
    onSuccess: (session) => {
      localStorage.setItem("si_aman_token", session.token);
      localStorage.setItem("warga_authenticated", "true");
      localStorage.setItem("warga_current_user", JSON.stringify(session.user));
      queryClient.setQueryData([AUTH_USER_KEY], session.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (input: RegisterInput) => {
      const session = await authRepository.register(input);
      return session;
    },
    onSuccess: (session) => {
      localStorage.setItem("si_aman_token", session.token);
      localStorage.setItem("warga_authenticated", "true");
      localStorage.setItem("warga_current_user", JSON.stringify(session.user));
      queryClient.setQueryData([AUTH_USER_KEY], session.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authRepository.logout();
    },
    onSuccess: () => {
      localStorage.removeItem("si_aman_token");
      localStorage.removeItem("warga_authenticated");
      localStorage.removeItem("warga_current_user");
      queryClient.setQueryData([AUTH_USER_KEY], null);
      queryClient.clear();
    },
  });

  return {
    user: userQuery.data,
    isLoadingUser: userQuery.isLoading,
    isErrorUser: userQuery.isError,
    
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
};
