import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Admin token: from URL hash (Caffeine platform), or from Vite env variable (Vercel/custom deployment)
function resolveAdminToken(): string {
  const fromUrl = getSecretParameter("caffeineAdminToken");
  if (fromUrl) return fromUrl;
  // Fallback: VITE_ADMIN_TOKEN env variable (set in Vercel dashboard)
  const fromEnv = import.meta.env.VITE_ADMIN_TOKEN as string | undefined;
  return fromEnv || "";
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const adminToken = resolveAdminToken();

      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Anonymous actor — still initialize admin token so backend writes work
        const actor = await createActorWithConfig();
        if (adminToken) {
          try {
            await actor._initializeAccessControlWithSecret(adminToken);
          } catch (e) {
            console.warn(
              "Anonymous actor: admin token initialization failed",
              e,
            );
          }
        }
        return actor;
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      if (adminToken) {
        await actor._initializeAccessControlWithSecret(adminToken);
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
