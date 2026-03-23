import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Retrieve admin token from URL, localStorage, or environment
function getAdminToken(): string {
  // 1. Check URL parameter first (Caffeine deployment link)
  const urlToken = getSecretParameter("caffeineAdminToken");
  if (urlToken) {
    try {
      localStorage.setItem("_caffeine_admin_token", urlToken);
    } catch {
      // ignore
    }
    return urlToken;
  }
  // 2. Check localStorage (persisted from previous deployment link visit)
  try {
    const stored = localStorage.getItem("_caffeine_admin_token");
    if (stored) return stored;
  } catch {
    // ignore
  }
  return "";
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const adminToken = getAdminToken();

      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Anonymous actor — still initialize ACL so backend writes work
        const actor = await createActorWithConfig();
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch {
          // ignore — may already be initialized
        }
        return actor;
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      try {
        await actor._initializeAccessControlWithSecret(adminToken);
      } catch {
        // ignore — may already be initialized
      }
      return actor;
    },
    // Only refetch when identity changes
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
