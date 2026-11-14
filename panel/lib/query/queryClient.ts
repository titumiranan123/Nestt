import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toastError, toastSuccess } from "@/lib/alert";
import { getErrorMessage } from "@/lib/api/errors";

export type ApiMeta = {
  successMessage?: string;
  silent?: boolean;
};

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: ApiMeta;
    mutationMeta: ApiMeta;
  }
}

function isSilent(meta: ApiMeta | undefined): boolean {
  return meta?.silent === true;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError(error, query) {
        if (!isSilent(query.meta)) void toastError(getErrorMessage(error));
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _variables, _context, mutation) {
        if (!isSilent(mutation.meta)) void toastError(getErrorMessage(error));
      },
      onSuccess(_data, _variables, _context, mutation) {
        const message = mutation.meta?.successMessage;
        if (message) void toastSuccess(message);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry(failureCount, error) {
          const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
          if (typeof status === "number" && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}
