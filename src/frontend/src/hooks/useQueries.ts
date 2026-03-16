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

// ── Family Tree Queries ──────────────────────────────────────────

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

export function useAllFamilyMembers() {
  const { actor, isFetching } = useActor();

  return useQuery<FamilyMember[]>({
    queryKey: ["familyMembers"],
    queryFn: async () => {
      // Get localStorage members
      const localMembers = localStore
        .getFamilyTreeMembers()
        .map(localMemberToFamilyMember);
      // Also include approved members from registration flow
      const approvedMembers = localStore.getApprovedFamilyMembers();

      let backendMembers: FamilyMember[] = [];
      if (actor) {
        try {
          backendMembers = await actor.getAllFamilyMembers();
        } catch {
          // Backend failed — use localStorage only
        }
      }

      // Start with backend members as base
      const backendIds = new Set(backendMembers.map((m) => m.id));

      // Merge localStorage family tree members (deduplicate by id)
      for (const local of localMembers) {
        if (!backendIds.has(local.id)) {
          backendMembers = [...backendMembers, local];
          backendIds.add(local.id);
        }
      }

      // Merge approved registration members (converted to FamilyMember)
      for (const am of approvedMembers) {
        if (!backendIds.has(am.id)) {
          const converted: FamilyMember = {
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
            photoData: am.photoData || "",
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
          };
          backendMembers = [...backendMembers, converted];
          backendIds.add(am.id);
        }
      }

      // Ensure patriarch is always present
      if (backendMembers.length === 0) {
        return [DEFAULT_PATRIARCH_MEMBER];
      }
      const hasPatriarch = backendMembers.some((m) => m.id === "patriarch-1");
      if (!hasPatriarch) {
        return [DEFAULT_PATRIARCH_MEMBER, ...backendMembers];
      }
      return backendMembers;
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
      // Always save to localStorage first (permanent, works without backend auth)
      localStore.saveFamilyTreeMember({
        ...member,
        createdAt: Number(member.createdAt),
      });

      // Also attempt backend — if it fails due to auth, we already have localStorage
      if (actor) {
        try {
          await actor.addFamilyMember(member);
        } catch (e) {
          console.warn(
            "Backend addFamilyMember failed (using localStorage):",
            e,
          );
          // Do NOT re-throw — localStorage save already succeeded
        }
      }

      return member.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
      queryClient.invalidateQueries({ queryKey: ["patriarchId"] });
    },
    // Never throw errors to the UI — localStorage save always succeeds
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
      // Always save to localStorage first
      localStore.updateFamilyTreeMember({
        ...member,
        createdAt: Number(member.createdAt),
      });

      // Attempt backend
      if (actor) {
        try {
          await actor.updateFamilyMember(member);
        } catch (e) {
          console.warn(
            "Backend updateFamilyMember failed (using localStorage):",
            e,
          );
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
      // Always delete from localStorage
      localStore.deleteFamilyTreeMember(id);

      // Attempt backend
      if (actor) {
        try {
          await actor.deleteFamilyMember(id);
        } catch (e) {
          console.warn(
            "Backend deleteFamilyMember failed (using localStorage):",
            e,
          );
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

// ── Relationship Request Queries ────────────────────────────────

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

// ── User Queries ────────────────────────────────────────────────

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

// ── Gallery Queries ──────────────────────────────────────────────

// Helper: merge backend photos with localStorage photos (deduplicate by id)
function mergeGalleryPhotos(
  backendPhotos: GalleryPhoto[],
  localPhotos: GalleryPhoto[],
): GalleryPhoto[] {
  const backendIds = new Set(backendPhotos.map((p) => p.id));
  const localOnly = localPhotos.filter((p) => !backendIds.has(p.id));
  return [...backendPhotos, ...localOnly];
}

export function useGalleryPhotos() {
  const { actor, isFetching } = useActor();

  return useQuery<GalleryPhoto[]>({
    queryKey: ["galleryPhotos"],
    queryFn: async () => {
      const localPhotos = localStore
        .getGalleryPhotos()
        .map(localPhotoToGalleryPhoto);

      let backendPhotos: GalleryPhoto[] = [];
      if (actor) {
        try {
          backendPhotos = await actor.getGalleryPhotos();
        } catch {
          // Backend failed — use localStorage only
        }
      }

      return mergeGalleryPhotos(backendPhotos, localPhotos);
    },
    enabled: !isFetching,
    placeholderData: [],
  });
}

export function useGalleryPhotosByCategory(category: string) {
  const { actor, isFetching } = useActor();

  return useQuery<GalleryPhoto[]>({
    queryKey: ["galleryPhotosByCategory", category],
    queryFn: async () => {
      // Get localStorage photos for this category (approved only for display)
      const allLocalPhotos = localStore
        .getGalleryPhotos()
        .map(localPhotoToGalleryPhoto);
      const localCategoryPhotos = allLocalPhotos.filter(
        (p) =>
          (p.category === category || category === "all") &&
          p.approvedStatus !== "disabled",
      );

      let backendPhotos: GalleryPhoto[] = [];
      if (actor) {
        try {
          backendPhotos = await actor.getGalleryPhotosByCategory(category);
        } catch {
          // Backend failed — use localStorage only
        }
      }

      return mergeGalleryPhotos(backendPhotos, localCategoryPhotos);
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

      return mergeGalleryPhotos(backendPhotos, localPending);
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
      // Always save to localStorage first — works without backend auth
      localStore.saveGalleryPhoto({
        ...photo,
        createdAt: Number(photo.createdAt),
        approvedStatus: photo.approvedStatus || "approved",
      });

      // Attempt backend — if it fails due to auth, localStorage already has it
      if (actor) {
        try {
          await actor.addGalleryPhoto(photo);
        } catch (e) {
          console.warn(
            "Backend addGalleryPhoto failed (using localStorage):",
            e,
          );
          // Do NOT re-throw — localStorage save already succeeded
        }
      }

      return photo.id;
    },
    onSuccess: (_data, photo) => {
      // Invalidate all gallery-related queries
      queryClient.invalidateQueries({ queryKey: ["galleryPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["galleryPhotosByCategory"] });
      queryClient.invalidateQueries({ queryKey: ["pendingGalleryPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["galleryPhotoCount"] });
      // Force refetch the specific category query so it shows immediately
      queryClient.refetchQueries({
        queryKey: ["galleryPhotosByCategory", photo.category],
      });
      // Also refetch "recent" category if different
      if (photo.category !== "recent") {
        queryClient.refetchQueries({
          queryKey: ["galleryPhotosByCategory", "recent"],
        });
      }
    },
    onError: (_err, photo) => {
      // Even if mutation throws, invalidate to show localStorage data
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
      // Always update localStorage
      localStore.updateGalleryPhotoStatus(photoId, "approved");

      // Attempt backend
      if (actor) {
        try {
          await actor.approveGalleryPhoto(photoId);
        } catch (e) {
          console.warn(
            "Backend approveGalleryPhoto failed (using localStorage):",
            e,
          );
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
      // Always update localStorage (set to disabled rather than actual delete for admin toggle)
      localStore.updateGalleryPhotoStatus(photoId, "disabled");

      // Attempt backend delete
      if (actor) {
        try {
          await actor.deleteGalleryPhoto(photoId);
        } catch (e) {
          console.warn(
            "Backend deleteGalleryPhoto failed (using localStorage):",
            e,
          );
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
      // Always update localStorage
      localStore.updateGalleryPhotoCategory(photoId, newCategory);

      // Attempt backend
      if (actor) {
        try {
          await actor.updateGalleryPhotoCategory(photoId, newCategory);
        } catch (e) {
          console.warn(
            "Backend updateGalleryPhotoCategory failed (using localStorage):",
            e,
          );
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

// ── Pending Registrations Query ──────────────────────────────────

export function usePendingRegistrationsQuery() {
  const { actor, isFetching } = useActor();
  return useQuery<PendingRegistration[]>({
    queryKey: ["pendingRegistrations"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getPendingRegistrations();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    placeholderData: [],
  });
}

// ── Backup Queries ───────────────────────────────────────────────

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
