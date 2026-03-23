import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FamilyMember,
  GalleryPhoto,
  PatriarchInfo,
  PendingRegistration,
  RelationshipRequest,
  UserProfile,
} from "../backend.d";
import { localStore } from "../utils/localStore";
import { useActor } from "./useActor";

// ── Helper: convert LocalFamilyMember → FamilyMember (bigint createdAt) ──────
function localMemberToFamilyMember(
  m: ReturnType<typeof localStore.getFamilyTreeMembers>[0],
): FamilyMember {
  return {
    ...m,
    createdAt: BigInt(m.createdAt ?? 0),
  } as FamilyMember;
}

// ── Helper: convert LocalGalleryPhoto → GalleryPhoto (bigint createdAt) ─────
function localPhotoToGalleryPhoto(
  p: ReturnType<typeof localStore.getGalleryPhotos>[0],
): GalleryPhoto {
  return {
    ...p,
    createdAt: BigInt(p.createdAt ?? 0),
  } as GalleryPhoto;
}

// ── Helper: strip photoData from member before sending to backend ─────────────
// ICP has ~2MB message size limit. Large base64 photos exceed this limit.
// Photos are stored in localStorage keyed by member id/email and re-attached on read.
function stripPhotoForBackend(member: FamilyMember): FamilyMember {
  return { ...member, photoData: "" };
}

const DEFAULT_PATRIARCH: PatriarchInfo = {
  name: "श्री गणेश सावळाराम अभंगराव",
  title: "माजी नगराध्यक्ष – पंढरपूर",
  inspirationalMessage: "कुटुंब हेच खरे धन आहे.",
};

export function usePatriarchInfo() {
  const { actor, isFetching } = useActor();

  return useQuery<PatriarchInfo>({
    queryKey: ["patriarchInfo"],
    queryFn: async () => {
      if (!actor) return DEFAULT_PATRIARCH;
      try {
        const info = await actor.getPatriarchInfo();
        return info;
      } catch {
        return DEFAULT_PATRIARCH;
      }
    },
    enabled: !isFetching,
    placeholderData: DEFAULT_PATRIARCH,
  });
}

export function useCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerUserRole();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Family Tree Queries ─────────────────────────────────────────────────────────────

// Default patriarch member — always shown when backend has no members or fails
const DEFAULT_PATRIARCH_MEMBER: FamilyMember = {
  id: "patriarch-1",
  name: "श्री गणेश सावळाराम अभंगराव",
  firstName: "गणेश",
  lastName: "अभंगराव",
  gender: "male",
  maritalStatus: "married",
  motherName: "",
  fatherName: "",
  husbandName: "",
  birthDate: "",
  birthTime: "",
  bloodGroup: "",
  marriageDate: "",
  deathDate: "",
  isDeceased: false,
  photoData: "",
  education: "",
  occupationType: "व्यवसाय",
  occupation: "",
  additionalInfo: "",
  mobile: "",
  whatsapp: "",
  houseNumber: "",
  roadName: "",
  landmark: "",
  cityVillage: "",
  pincode: "",
  district: "",
  address: "",
  nativeVillage: "पंढरपूर",
  village: "पंढरपूर",
  fatherFullName: "",
  motherFullName: "",
  fatherInLawName: "",
  motherInLawName: "",
  spouseName: "",
  brotherNames: "",
  sisterNames: "",
  childrenNames: "",
  fatherId: "",
  motherId: "",
  spouseIds: [],
  childrenIds: [],
  brotherIds: [],
  sisterIds: [],
  fatherInLawId: "",
  motherInLawId: "",
  createdAt: BigInt(0),
  createdBy: "admin@vatavriksha.com",
};

// ── Helper: re-attach photo from localStorage for a member ────────────────────
function reattachPhoto(m: FamilyMember): FamilyMember {
  const photo =
    localStore.getPhotoByIdOrEmail(m.id) ||
    localStore.getPhotoByIdOrEmail(
      (m as FamilyMember & { email?: string }).email || "",
    ) ||
    m.photoData;
  return { ...m, photoData: photo };
}

export function useAllFamilyMembers() {
  const { actor, isFetching } = useActor();

  return useQuery<FamilyMember[]>({
    queryKey: ["familyMembers"],
    staleTime: 0,
    queryFn: async () => {
      // ── Backend is authoritative source ──────────────────────────────────────
      if (actor) {
        try {
          const backendMembers = await actor.getAllFamilyMembers();
          if (backendMembers.length > 0) {
            // Re-attach photos from localStorage (photos not stored in backend)
            let members = backendMembers.map(reattachPhoto);

            // Ensure patriarch photo is attached
            members = members.map((m) => {
              if (m.id === "patriarch-1" && !m.photoData) {
                return {
                  ...m,
                  photoData:
                    localStore.getPhotoByIdOrEmail("patriarch-1") ||
                    localStore.getPhotoByIdOrEmail(
                      "ganesh.abhangrao@vatavriksha.com",
                    ) ||
                    "",
                };
              }
              return m;
            });

            // Ensure patriarch is always present
            const hasPatriarch = members.some((m) => m.id === "patriarch-1");
            if (!hasPatriarch) {
              const patriarchWithPhoto = {
                ...DEFAULT_PATRIARCH_MEMBER,
                photoData:
                  localStore.getPhotoByIdOrEmail("patriarch-1") ||
                  localStore.getPhotoByIdOrEmail(
                    "ganesh.abhangrao@vatavriksha.com",
                  ) ||
                  "",
              };
              return [patriarchWithPhoto, ...members];
            }
            return members;
          }
        } catch {
          // Backend failed — fall through to localStorage
        }
      }

      // ── Fallback: localStorage ────────────────────────────────────────────────
      const localMembers = localStore
        .getFamilyTreeMembers()
        .map(localMemberToFamilyMember);
      const approvedMembers = localStore.getApprovedFamilyMembers();

      const allLocalIds = new Set(localMembers.map((m) => m.id));

      // Merge approved registration members not already in local tree
      const extraApproved: FamilyMember[] = [];
      for (const am of approvedMembers) {
        if (!allLocalIds.has(am.id)) {
          extraApproved.push({
            id: am.id,
            name: am.name,
            firstName: am.firstName || "",
            lastName: am.lastName || "",
            gender: am.gender || "",
            maritalStatus: am.maritalStatus || "",
            motherName: am.motherName || "",
            fatherName: am.fatherName || "",
            husbandName: am.husbandName || "",
            birthDate: am.birthDate || "",
            birthTime: am.birthTime || "",
            bloodGroup: am.bloodGroup || "",
            marriageDate: am.marriageDate || "",
            deathDate: am.deathDate || "",
            isDeceased: am.isDeceased || false,
            photoData:
              am.photoData || localStore.getPhotoByIdOrEmail(am.email) || "",
            education: am.education || "",
            occupationType: am.occupationType || "",
            occupation: am.occupation || "",
            additionalInfo: am.additionalInfo || "",
            mobile: am.mobile || "",
            whatsapp: am.whatsapp || "",
            houseNumber: am.houseNumber || "",
            roadName: am.roadName || "",
            landmark: am.landmark || "",
            cityVillage: am.cityVillage || "",
            pincode: am.pincode || "",
            district: am.district || "",
            address: am.address || "",
            nativeVillage: am.nativeVillage || "",
            village: am.nativeVillage || "",
            fatherFullName: am.fatherFullName || "",
            motherFullName: am.motherFullName || "",
            fatherInLawName: am.fatherInLawName || "",
            motherInLawName: am.motherInLawName || "",
            spouseName: am.spouseName || "",
            brotherNames: am.brotherNames || "",
            sisterNames: am.sisterNames || "",
            childrenNames: am.childrenNames || "",
            fatherId: "",
            motherId: "",
            spouseIds: [],
            childrenIds: [],
            brotherIds: [],
            sisterIds: [],
            fatherInLawId: "",
            motherInLawId: "",
            createdAt: BigInt(0),
            createdBy: "admin",
          });
        }
      }

      const combined = [...localMembers, ...extraApproved];

      if (combined.length === 0) {
        const patriarchWithPhoto = {
          ...DEFAULT_PATRIARCH_MEMBER,
          photoData:
            localStore.getPhotoByIdOrEmail("patriarch-1") ||
            localStore.getPhotoByIdOrEmail(
              "ganesh.abhangrao@vatavriksha.com",
            ) ||
            "",
        };
        return [patriarchWithPhoto];
      }

      const hasPatriarch = combined.some((m) => m.id === "patriarch-1");
      if (!hasPatriarch) {
        const patriarchWithPhoto = {
          ...DEFAULT_PATRIARCH_MEMBER,
          photoData:
            localStore.getPhotoByIdOrEmail("patriarch-1") ||
            localStore.getPhotoByIdOrEmail(
              "ganesh.abhangrao@vatavriksha.com",
            ) ||
            "",
        };
        return [patriarchWithPhoto, ...combined];
      }
      return combined;
    },
    enabled: !isFetching,
    placeholderData: [DEFAULT_PATRIARCH_MEMBER],
  });
}

export function usePatriarchId() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ["patriarchId"],
    queryFn: async () => {
      if (!actor) return "patriarch-1";
      try {
        const id = await actor.getPatriarchId();
        return id || "patriarch-1";
      } catch {
        return "patriarch-1";
      }
    },
    enabled: !isFetching,
    placeholderData: "patriarch-1",
  });
}

export function useAddFamilyMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: FamilyMember) => {
      // Save to localStorage immediately (works always, fast)
      localStore.saveFamilyTreeMember({
        ...member,
        createdAt: Number(member.createdAt),
      });

      // Write to backend — photo stripped due to ICP message size limits
      // Photo is stored in localStorage and re-attached on read
      if (actor) {
        try {
          const memberForBackend = stripPhotoForBackend(member);
          await actor.addFamilyMember(memberForBackend);
        } catch (e) {
          console.warn("Backend addFamilyMember failed:", e);
          // localStorage already has data, so this is recoverable
        }
      }

      return member.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
      queryClient.invalidateQueries({ queryKey: ["patriarchId"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
  });
}

export function useUpdateFamilyMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: FamilyMember) => {
      // Save to localStorage immediately
      localStore.updateFamilyTreeMember({
        ...member,
        createdAt: Number(member.createdAt),
      });

      // Write to backend — photo stripped due to ICP size limits
      if (actor) {
        try {
          const memberForBackend = stripPhotoForBackend(member);
          await actor.updateFamilyMember(memberForBackend);
        } catch (e) {
          console.warn("Backend updateFamilyMember failed:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
  });
}

export function useDeleteFamilyMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete from localStorage
      localStore.deleteFamilyTreeMember(id);

      // Delete from backend
      if (actor) {
        try {
          await actor.deleteFamilyMember(id);
        } catch (e) {
          console.warn("Backend deleteFamilyMember failed:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
  });
}

// ── Relationship Request Queries ────────────────────────────────────────────

export function useRelationshipRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<RelationshipRequest[]>({
    queryKey: ["relationshipRequests"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getRelationshipRequests();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    placeholderData: [],
  });
}

export function useMyRelationshipRequests(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<RelationshipRequest[]>({
    queryKey: ["myRelationshipRequests", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      try {
        return await actor.getMyRelationshipRequests(userId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!userId,
    placeholderData: [],
  });
}

export function useSubmitRelationshipRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RelationshipRequest) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.submitRelationshipRequest(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationshipRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myRelationshipRequests"] });
    },
  });
}

export function useApproveRelationshipRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.approveRelationshipRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationshipRequests"] });
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
  });
}

export function useRejectRelationshipRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      note,
    }: {
      requestId: string;
      note: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.rejectRelationshipRequest(requestId, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationshipRequests"] });
    },
  });
}

// ── User Queries ──────────────────────────────────────────────────────────────

export function useAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllUsers();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    placeholderData: [],
  });
}

export function useToggleUserActive() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      isActive,
    }: {
      email: string;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.adminToggleUserActive(email, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.saveCallerUserProfile(profile);
    },
  });
}

// ── Gallery Queries ───────────────────────────────────────────────────────────

export function useGalleryPhotos() {
  const { actor, isFetching } = useActor();

  return useQuery<GalleryPhoto[]>({
    queryKey: ["galleryPhotos"],
    staleTime: 0,
    queryFn: async () => {
      // Backend is authoritative
      if (actor) {
        try {
          const backendPhotos = await actor.getGalleryPhotos();
          if (backendPhotos.length > 0) {
            // Re-attach photoData from localStorage if backend entry has none
            return backendPhotos.map((p) => {
              if (!p.photoData) {
                const local = localStore
                  .getGalleryPhotos()
                  .find((lp) => lp.id === p.id);
                return { ...p, photoData: local?.photoData || "" };
              }
              return p;
            });
          }
        } catch {
          // Backend failed — fall through
        }
      }

      // Fallback: localStorage
      return localStore.getGalleryPhotos().map(localPhotoToGalleryPhoto);
    },
    enabled: !isFetching,
    placeholderData: [],
  });
}

export function useGalleryPhotosByCategory(category: string) {
  const { actor, isFetching } = useActor();

  return useQuery<GalleryPhoto[]>({
    queryKey: ["galleryPhotosByCategory", category],
    staleTime: 0,
    queryFn: async () => {
      // Backend is authoritative
      if (actor) {
        try {
          const backendPhotos =
            await actor.getGalleryPhotosByCategory(category);
          if (backendPhotos.length > 0) {
            // Re-attach photoData from localStorage if backend entry has none
            return backendPhotos.map((p) => {
              if (!p.photoData) {
                const local = localStore
                  .getGalleryPhotos()
                  .find((lp) => lp.id === p.id);
                return { ...p, photoData: local?.photoData || "" };
              }
              return p;
            });
          }
        } catch {
          // Backend failed — fall through
        }
      }

      // Fallback: localStorage
      const allLocalPhotos = localStore
        .getGalleryPhotos()
        .map(localPhotoToGalleryPhoto);
      return allLocalPhotos.filter(
        (p) =>
          (p.category === category || category === "all") &&
          p.approvedStatus !== "disabled",
      );
    },
    enabled: !isFetching && !!category,
    placeholderData: [],
  });
}

export function usePendingGalleryPhotos() {
  const { actor, isFetching } = useActor();

  return useQuery<GalleryPhoto[]>({
    queryKey: ["pendingGalleryPhotos"],
    queryFn: async () => {
      // Include localStorage photos that are pending or have no approved status
      const allLocalPhotos = localStore
        .getGalleryPhotos()
        .map(localPhotoToGalleryPhoto);
      const localPending = allLocalPhotos.filter(
        (p) => p.approvedStatus === "pending" || !p.approvedStatus,
      );

      let backendPhotos: GalleryPhoto[] = [];
      if (actor) {
        try {
          backendPhotos = await actor.getPendingGalleryPhotos();
        } catch {
          // Backend failed — use localStorage only
        }
      }

      // For pending photos, keep merged view (admin needs to see all)
      const backendIds = new Set(backendPhotos.map((p) => p.id));
      const localOnly = localPending.filter((p) => !backendIds.has(p.id));
      return [...backendPhotos, ...localOnly];
    },
    enabled: !isFetching,
    placeholderData: [],
  });
}

export function useGalleryPhotoCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["galleryPhotoCount"],
    queryFn: async () => {
      const localCount = localStore.getGalleryPhotos().length;

      if (actor) {
        try {
          const backendCount = await actor.getGalleryPhotoCount();
          // Return max of backend count and local count (avoid under-counting)
          return backendCount > BigInt(localCount)
            ? backendCount
            : BigInt(localCount);
        } catch {
          // Backend failed — use localStorage count
        }
      }

      return BigInt(localCount);
    },
    enabled: !isFetching,
    placeholderData: BigInt(0),
  });
}

export function useAddGalleryPhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: GalleryPhoto) => {
      // Always save to localStorage (fast, reliable fallback)
      localStore.saveGalleryPhoto({
        ...photo,
        createdAt: Number(photo.createdAt),
        approvedStatus: photo.approvedStatus || "approved",
      });

      // Write to backend — gallery photos may be large; try with full data
      if (actor) {
        try {
          await actor.addGalleryPhoto(photo);
        } catch (e) {
          console.warn("Backend addGalleryPhoto failed:", e);
          // localStorage already has data
        }
      }

      return photo.id;
    },
    onSuccess: (_data, photo) => {
      queryClient.invalidateQueries({ queryKey: ["galleryPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["galleryPhotosByCategory"] });
      queryClient.invalidateQueries({ queryKey: ["pendingGalleryPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["galleryPhotoCount"] });
      queryClient.refetchQueries({
        queryKey: ["galleryPhotosByCategory", photo.category],
      });
      if (photo.category !== "recent") {
        queryClient.refetchQueries({
          queryKey: ["galleryPhotosByCategory", "recent"],
        });
      }
    },
    onError: (_err, photo) => {
      queryClient.invalidateQueries({ queryKey: ["galleryPhotos"] });
      queryClient.invalidateQueries({
        queryKey: ["galleryPhotosByCategory", photo.category],
      });
    },
  });
}

export function useApproveGalleryPhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      // Update localStorage
      localStore.updateGalleryPhotoStatus(photoId, "approved");

      // Update backend
      if (actor) {
        try {
          await actor.approveGalleryPhoto(photoId);
        } catch (e) {
          console.warn("Backend approveGalleryPhoto failed:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["galleryPhotosByCategory"] });
      queryClient.invalidateQueries({ queryKey: ["pendingGalleryPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["galleryPhotoCount"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryPhotos"] });
    },
  });
}

export function useDeleteGalleryPhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      // Update localStorage (set to disabled)
      localStore.updateGalleryPhotoStatus(photoId, "disabled");

      // Delete from backend
      if (actor) {
        try {
          await actor.deleteGalleryPhoto(photoId);
        } catch (e) {
          console.warn("Backend deleteGalleryPhoto failed:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["galleryPhotosByCategory"] });
      queryClient.invalidateQueries({ queryKey: ["pendingGalleryPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["galleryPhotoCount"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryPhotos"] });
    },
  });
}

export function useUpdateGalleryPhotoCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      photoId,
      newCategory,
    }: {
      photoId: string;
      newCategory: string;
    }) => {
      // Update localStorage
      localStore.updateGalleryPhotoCategory(photoId, newCategory);

      // Update backend
      if (actor) {
        try {
          await actor.updateGalleryPhotoCategory(photoId, newCategory);
        } catch (e) {
          console.warn("Backend updateGalleryPhotoCategory failed:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["galleryPhotosByCategory"] });
      queryClient.invalidateQueries({ queryKey: ["pendingGalleryPhotos"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryPhotos"] });
    },
  });
}

// ── Pending Registrations Query ──────────────────────────────────────────────

export function usePendingRegistrationsQuery() {
  const { actor, isFetching } = useActor();
  return useQuery<PendingRegistration[]>({
    queryKey: ["pendingRegistrations"],
    staleTime: 0,
    queryFn: async () => {
      const localRegs = (localStore.getPendingRegistrations?.() ??
        []) as unknown as PendingRegistration[];
      if (actor) {
        try {
          const backendRegs = await actor.getPendingRegistrations();
          const backendIds = new Set(backendRegs.map((r) => r.email));
          const localOnly = localRegs.filter((r) => !backendIds.has(r.email));
          return [...backendRegs, ...localOnly];
        } catch {
          // Backend failed
        }
      }
      return localRegs;
    },
    enabled: !!actor && !isFetching,
    placeholderData: [],
  });
}

// ── Backup Queries ──────────────────────────────────────────────────────────────

export function useAllUsersForBackup() {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ["allUsersForBackup"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllUsersForBackup();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    placeholderData: [],
  });
}

export function useAllFamilyMembersForBackup() {
  const { actor, isFetching } = useActor();

  return useQuery<FamilyMember[]>({
    queryKey: ["allFamilyMembersForBackup"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllFamilyMembersForBackup();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    placeholderData: [],
  });
}

export function useAllGalleryPhotosForBackup() {
  const { actor, isFetching } = useActor();

  return useQuery<GalleryPhoto[]>({
    queryKey: ["allGalleryPhotosForBackup"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllGalleryPhotosForBackup();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    placeholderData: [],
  });
}
