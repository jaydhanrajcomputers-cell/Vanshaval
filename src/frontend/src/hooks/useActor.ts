import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Retrieve admin token from URL hash → sessionStorage → localStorage → env variable
function getAdminToken(): string {
  return (
    getSecretParameter("caffeineAdminToken") ||
    sessionStorage.getItem("caffeineAdminToken") ||
    localStorage.getItem("caffeineAdminToken") ||
    (import.meta.env.VITE_CAFFEINE_ADMIN_TOKEN as string | undefined) ||
    ""
  );
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;
      const adminToken = getAdminToken();

      if (!isAuthenticated) {
        // Anonymous actor (used for password-based login, public reads, registration)
        const actor = await createActorWithConfig();
        // Initialize access control for anonymous actor too
        if (adminToken) {
          try {
            await actor._initializeAccessControlWithSecret(adminToken);
          } catch (e) {
            console.warn("Anonymous actor ACL init failed:", e);
          }
        }
        return actor;
      }

      // Authenticated actor (Internet Identity)
      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      if (adminToken) {
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch (e) {
          console.warn("Authenticated actor ACL init failed:", e);
        }
      }
      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
