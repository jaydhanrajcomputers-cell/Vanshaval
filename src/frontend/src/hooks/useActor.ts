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
      const isAuthenticated = !!identity;
      // Always read admin token — this app uses password-based auth (not II),
      // so identity is always null. We must initialize the actor with the
      // admin token for all callers so backend writes succeed.
      const adminToken = getSecretParameter("caffeineAdminToken") || "";

      if (!isAuthenticated) {
        // Anonymous actor — still initialize with admin token if available
        // so that backend writes (addFamilyMember, updateFamilyMember,
        // addGalleryPhoto, getPendingRegistrations, etc.) can succeed.
        const actor = await createActorWithConfig();
        if (adminToken) {
          try {
            await actor._initializeAccessControlWithSecret(adminToken);
          } catch {
            // If secret init fails, continue with anonymous actor
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
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch {
          // If secret init fails, continue without admin rights
        }
      }
      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    // This will cause the actor to be recreated when the identity changes
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
