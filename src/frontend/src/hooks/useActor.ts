import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const actor = identity
        ? await createActorWithConfig({ agentOptions: { identity } })
        : await createActorWithConfig();

      // Try to initialize admin token for both anonymous and authenticated actors
      try {
        const adminToken =
          getSecretParameter("caffeineAdminToken") ||
          sessionStorage.getItem("caffeineAdminToken") ||
          localStorage.getItem("caffeineAdminToken") ||
          (import.meta.env.VITE_ADMIN_TOKEN as string | undefined) ||
          "";
        if (adminToken) {
          await actor._initializeAccessControlWithSecret(adminToken);
        }
      } catch {
        // Non-fatal: actor still works for reads
      }

      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
      queryClient.refetchQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
