import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { FamilyMember } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import {
  useAddFamilyMember,
  useUpdateFamilyMember,
} from "../../hooks/useQueries";
import { localStore } from "../../utils/localStore";

export type RelationshipRole =
  | "father"
  | "mother"
  | "spouse"
  | "child"
  | "brother"
  | "sister"
  | "fatherInLaw"
  | "motherInLaw";

const ROLE_LABELS: Record<RelationshipRole, string> = {
  father: "वडील",
  mother: "आई",
  spouse: "जोडीदार (पती/पत्नी)",
  child: "मूल",
  brother: "भाऊ",
  sister: "बहीण",
  fatherInLaw: "सासरे",
  motherInLaw: "सासू",
};

interface AddByEmailDialogProps {
  open: boolean;
  onClose: () => void;
  role: RelationshipRole;
  centerMember: FamilyMember;
  allMembers: FamilyMember[];
  spouseMember?: FamilyMember | null;
}

export function AddByEmailDialog({
  open,
  onClose,
  role,
  centerMember,
  allMembers,
  spouseMember,
}: AddByEmailDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [pendingPlaceholder, setPendingPlaceholder] =
    useState<FamilyMember | null>(null);
  const { actor } = useActor();
  const updateMember = useUpdateFamilyMember();
  const addMember = useAddFamilyMember();

  const roleLabel = ROLE_LABELS[role];

  const handleClose = () => {
    setEmail("");
    setError("");
    setPendingPlaceholder(null);
    onClose();
  };

  /**
   * Find a FamilyMember by email from all available sources:
   * 1. allMembers (backend + localStorage, already merged in useAllFamilyMembers)
   * 2. localStorage approved members by email
   * 3. Backend user profile (via getUserProfileByEmail)
   * 4. localStorage pending registrations (any status)
   *
   * NOTE: This function only FINDS. The caller (handleSubmit) will then
   * use addMember.mutate() which saves to localStorage regardless of backend auth.
   */
  const findOrCreateMemberByEmail = async (
    emailToFind: string,
  ): Promise<FamilyMember | null> => {
    const trimmedEmail = emailToFind.trim().toLowerCase();

    // 1. Check localStorage family tree members by email
    const localTreeMembers = localStore.getFamilyTreeMembers();
    const localTreeMatch = localTreeMembers.find(
      (m) =>
        m.id.toLowerCase() === trimmedEmail ||
        (m as unknown as Record<string, string>).email?.toLowerCase() ===
          trimmedEmail,
    );
    if (localTreeMatch) {
      const inTree = allMembers.find((m) => m.id === localTreeMatch.id);
      if (inTree) return inTree;
    }

    // 2. Try backend for user profile by email
    let userId: string | null = null;
    let userName = "";
    if (actor) {
      try {
        const profile = await actor.getUserProfileByEmail(trimmedEmail);
        if (profile?.id) {
          userId = profile.id;
          userName = profile.name;
        }
      } catch {
        // Not found in backend
      }
    }

    // 3. Check if already in family tree members (by id from user profile)
    if (userId) {
      const existingMember = allMembers.find((m) => m.id === userId);
      if (existingMember) {
        return existingMember;
      }
    }

    // 4. Check localStorage approved members by email
    const approvedMembers = localStore.getApprovedFamilyMembers();
    const approvedMember = approvedMembers.find(
      (m) => m.email?.toLowerCase() === trimmedEmail,
    );
    if (approvedMember) {
      // Check if already in tree
      const inTree = allMembers.find((m) => m.id === approvedMember.id);
      if (inTree) return inTree;

      // Build FamilyMember from approved data
      const familyMember: FamilyMember = {
        id: approvedMember.id,
        name: approvedMember.name || userName,
        firstName: approvedMember.firstName || "",
        lastName: approvedMember.lastName || "",
        gender: approvedMember.gender || "",
        maritalStatus: approvedMember.maritalStatus || "",
        motherName: approvedMember.motherName || "",
        fatherName: approvedMember.fatherName || "",
        husbandName: approvedMember.husbandName || "",
        birthDate: approvedMember.birthDate || "",
        birthTime: approvedMember.birthTime || "",
        marriageDate: approvedMember.marriageDate || "",
        deathDate: approvedMember.deathDate || "",
        isDeceased: approvedMember.isDeceased || false,
        bloodGroup: approvedMember.bloodGroup || "",
        village: approvedMember.nativeVillage || "",
        nativeVillage: approvedMember.nativeVillage || "",
        occupation: approvedMember.occupation || "",
        occupationType: approvedMember.occupationType || "",
        education: approvedMember.education || "",
        additionalInfo: approvedMember.additionalInfo || "",
        mobile: approvedMember.mobile || "",
        whatsapp: approvedMember.whatsapp || "",
        address: approvedMember.address || "",
        houseNumber: approvedMember.houseNumber || "",
        roadName: approvedMember.roadName || "",
        landmark: approvedMember.landmark || "",
        cityVillage: approvedMember.cityVillage || "",
        pincode: approvedMember.pincode || "",
        district: approvedMember.district || "",
        fatherId: "",
        motherId: "",
        fatherInLawId: "",
        motherInLawId: "",
        spouseIds: [],
        childrenIds: [],
        brotherIds: [],
        sisterIds: [],
        createdBy: "admin",
        createdAt: BigInt(Date.now()),
        fatherFullName: approvedMember.fatherFullName || "",
        motherFullName: approvedMember.motherFullName || "",
        fatherInLawName: approvedMember.fatherInLawName || "",
        motherInLawName: approvedMember.motherInLawName || "",
        spouseName: approvedMember.spouseName || "",
        brotherNames: approvedMember.brotherNames || "",
        sisterNames: approvedMember.sisterNames || "",
        childrenNames: approvedMember.childrenNames || "",
        photoData: approvedMember.photoData || "",
      };

      return familyMember;
    }

    // 5. Check localStorage pending registrations (any status — including pending)
    const allRegs = localStore.getAllRegistrations();
    const localReg = allRegs.find(
      (r) => r.email?.toLowerCase() === trimmedEmail,
    );

    // Also check member data store
    const memberData = localStore.getMemberData(trimmedEmail);

    if (localReg || memberData) {
      // Use consistent id: prefer backend userId > memberData.id > localReg.id > generated
      const regId =
        userId ||
        memberData?.id ||
        localReg?.id ||
        `user-${trimmedEmail.replace(/[^a-z0-9]/gi, "-")}`;
      const regName =
        memberData?.name ||
        localReg?.name ||
        userName ||
        trimmedEmail.split("@")[0];

      // Check if already in tree
      const inTree = allMembers.find((m) => m.id === regId);
      if (inTree) return inTree;

      // Build family member from available data
      const familyMember: FamilyMember = {
        id: regId,
        name: regName,
        firstName: memberData?.firstName || "",
        lastName: memberData?.lastName || "",
        gender: memberData?.gender || localReg?.gender || "",
        maritalStatus:
          memberData?.maritalStatus || localReg?.maritalStatus || "",
        motherName: memberData?.motherName || "",
        fatherName: memberData?.fatherName || "",
        husbandName: memberData?.husbandName || "",
        birthDate: memberData?.birthDate || localReg?.birthDate || "",
        birthTime: memberData?.birthTime || "",
        marriageDate: memberData?.marriageDate || "",
        deathDate: memberData?.deathDate || "",
        isDeceased: memberData?.isDeceased || false,
        bloodGroup: memberData?.bloodGroup || localReg?.bloodGroup || "",
        village: memberData?.nativeVillage || localReg?.nativeVillage || "",
        nativeVillage:
          memberData?.nativeVillage || localReg?.nativeVillage || "",
        occupation: memberData?.occupation || localReg?.occupation || "",
        occupationType:
          memberData?.occupationType || localReg?.occupationType || "",
        education: memberData?.education || localReg?.education || "",
        additionalInfo: memberData?.additionalInfo || "",
        mobile: memberData?.mobile || localReg?.mobile || "",
        whatsapp: memberData?.whatsapp || localReg?.whatsapp || "",
        address: memberData?.address || localReg?.address || "",
        houseNumber: memberData?.houseNumber || "",
        roadName: memberData?.roadName || "",
        landmark: memberData?.landmark || "",
        cityVillage: memberData?.cityVillage || "",
        pincode: memberData?.pincode || "",
        district: memberData?.district || "",
        fatherId: "",
        motherId: "",
        fatherInLawId: "",
        motherInLawId: "",
        spouseIds: [],
        childrenIds: [],
        brotherIds: [],
        sisterIds: [],
        createdBy: "admin",
        createdAt: BigInt(Date.now()),
        fatherFullName: memberData?.fatherFullName || "",
        motherFullName: memberData?.motherFullName || "",
        fatherInLawName: memberData?.fatherInLawName || "",
        motherInLawName: memberData?.motherInLawName || "",
        spouseName: memberData?.spouseName || "",
        brotherNames: memberData?.brotherNames || "",
        sisterNames: memberData?.sisterNames || "",
        childrenNames: memberData?.childrenNames || "",
        photoData: memberData?.photoData || "",
      };

      return familyMember;
    }

    // 6. If we got a userId from backend but no tree member or local data,
    //    create a minimal member from the user profile
    if (userId && userName) {
      const minimalMember: FamilyMember = {
        id: userId,
        name: userName,
        firstName: "",
        lastName: "",
        gender: "",
        maritalStatus: "",
        motherName: "",
        fatherName: "",
        husbandName: "",
        birthDate: "",
        birthTime: "",
        marriageDate: "",
        deathDate: "",
        isDeceased: false,
        bloodGroup: "",
        village: "",
        nativeVillage: "",
        occupation: "",
        occupationType: "",
        education: "",
        additionalInfo: "",
        mobile: "",
        whatsapp: "",
        address: "",
        houseNumber: "",
        roadName: "",
        landmark: "",
        cityVillage: "",
        pincode: "",
        district: "",
        fatherId: "",
        motherId: "",
        fatherInLawId: "",
        motherInLawId: "",
        spouseIds: [],
        childrenIds: [],
        brotherIds: [],
        sisterIds: [],
        createdBy: "admin",
        createdAt: BigInt(Date.now()),
        fatherFullName: "",
        motherFullName: "",
        fatherInLawName: "",
        motherInLawName: "",
        spouseName: "",
        brotherNames: "",
        sisterNames: "",
        childrenNames: "",
        photoData: "",
      };

      return minimalMember;
    }

    return null;
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("कृपया ईमेल आयडी टाका");
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      // Find or create the member from any available source
      const foundMember = await findOrCreateMemberByEmail(email.trim());

      if (!foundMember) {
        // If we already showed the warning and admin clicked again, use placeholder
        if (pendingPlaceholder) {
          // Use the pending placeholder directly
          const placeholder = pendingPlaceholder;
          setPendingPlaceholder(null);
          setIsSearching(false);
          // Proceed with placeholder below by re-using existing flow
          // Build relationships for placeholder just like foundMember
          const updatedCenter: FamilyMember = { ...centerMember };
          let updatedPlaceholder: FamilyMember = { ...placeholder };
          switch (role) {
            case "father":
              updatedCenter.fatherId = placeholder.id;
              updatedPlaceholder.childrenIds = [
                ...placeholder.childrenIds,
                centerMember.id,
              ];
              break;
            case "mother":
              updatedCenter.motherId = placeholder.id;
              updatedPlaceholder.childrenIds = [
                ...placeholder.childrenIds,
                centerMember.id,
              ];
              break;
            case "spouse":
              if (!updatedCenter.spouseIds.includes(placeholder.id))
                updatedCenter.spouseIds = [
                  ...updatedCenter.spouseIds,
                  placeholder.id,
                ];
              if (!updatedPlaceholder.spouseIds.includes(centerMember.id))
                updatedPlaceholder.spouseIds = [
                  ...updatedPlaceholder.spouseIds,
                  centerMember.id,
                ];
              break;
            case "child":
              if (!updatedCenter.childrenIds.includes(placeholder.id))
                updatedCenter.childrenIds = [
                  ...updatedCenter.childrenIds,
                  placeholder.id,
                ];
              if (centerMember.gender === "female") {
                if (!updatedPlaceholder.motherId)
                  updatedPlaceholder.motherId = centerMember.id;
              } else {
                if (!updatedPlaceholder.fatherId)
                  updatedPlaceholder.fatherId = centerMember.id;
              }
              break;
            case "brother":
              if (!updatedCenter.brotherIds.includes(placeholder.id))
                updatedCenter.brotherIds = [
                  ...updatedCenter.brotherIds,
                  placeholder.id,
                ];
              // Reverse: placeholder sees center as sibling
              if (centerMember.gender === "female") {
                if (!updatedPlaceholder.sisterIds.includes(centerMember.id))
                  updatedPlaceholder.sisterIds = [
                    ...updatedPlaceholder.sisterIds,
                    centerMember.id,
                  ];
              } else {
                if (!updatedPlaceholder.brotherIds.includes(centerMember.id))
                  updatedPlaceholder.brotherIds = [
                    ...updatedPlaceholder.brotherIds,
                    centerMember.id,
                  ];
              }
              // SHARED PARENT LOGIC: assign center's parents to sibling
              if (centerMember.fatherId && !updatedPlaceholder.fatherId) {
                updatedPlaceholder.fatherId = centerMember.fatherId;
              }
              if (centerMember.motherId && !updatedPlaceholder.motherId) {
                updatedPlaceholder.motherId = centerMember.motherId;
              }
              // Update father's childrenIds to include new sibling
              if (centerMember.fatherId) {
                const fatherMember = allMembers.find(
                  (m) => m.id === centerMember.fatherId,
                );
                if (
                  fatherMember &&
                  !fatherMember.childrenIds.includes(placeholder.id)
                ) {
                  updateMember.mutate({
                    ...fatherMember,
                    childrenIds: [...fatherMember.childrenIds, placeholder.id],
                  });
                }
              }
              // Update mother's childrenIds to include new sibling
              if (centerMember.motherId) {
                const motherMember = allMembers.find(
                  (m) => m.id === centerMember.motherId,
                );
                if (
                  motherMember &&
                  !motherMember.childrenIds.includes(placeholder.id)
                ) {
                  updateMember.mutate({
                    ...motherMember,
                    childrenIds: [...motherMember.childrenIds, placeholder.id],
                  });
                }
              }
              break;
            case "sister":
              if (!updatedCenter.sisterIds.includes(placeholder.id))
                updatedCenter.sisterIds = [
                  ...updatedCenter.sisterIds,
                  placeholder.id,
                ];
              // Reverse: placeholder sees center as sibling
              if (centerMember.gender === "female") {
                if (!updatedPlaceholder.sisterIds.includes(centerMember.id))
                  updatedPlaceholder.sisterIds = [
                    ...updatedPlaceholder.sisterIds,
                    centerMember.id,
                  ];
              } else {
                if (!updatedPlaceholder.brotherIds.includes(centerMember.id))
                  updatedPlaceholder.brotherIds = [
                    ...updatedPlaceholder.brotherIds,
                    centerMember.id,
                  ];
              }
              // SHARED PARENT LOGIC: assign center's parents to sibling
              if (centerMember.fatherId && !updatedPlaceholder.fatherId) {
                updatedPlaceholder.fatherId = centerMember.fatherId;
              }
              if (centerMember.motherId && !updatedPlaceholder.motherId) {
                updatedPlaceholder.motherId = centerMember.motherId;
              }
              // Update father's childrenIds to include new sibling
              if (centerMember.fatherId) {
                const fatherMember = allMembers.find(
                  (m) => m.id === centerMember.fatherId,
                );
                if (
                  fatherMember &&
                  !fatherMember.childrenIds.includes(placeholder.id)
                ) {
                  updateMember.mutate({
                    ...fatherMember,
                    childrenIds: [...fatherMember.childrenIds, placeholder.id],
                  });
                }
              }
              // Update mother's childrenIds to include new sibling
              if (centerMember.motherId) {
                const motherMember = allMembers.find(
                  (m) => m.id === centerMember.motherId,
                );
                if (
                  motherMember &&
                  !motherMember.childrenIds.includes(placeholder.id)
                ) {
                  updateMember.mutate({
                    ...motherMember,
                    childrenIds: [...motherMember.childrenIds, placeholder.id],
                  });
                }
              }
              break;
            case "fatherInLaw":
              updatedCenter.fatherInLawId = placeholder.id;
              break;
            case "motherInLaw":
              updatedCenter.motherInLawId = placeholder.id;
              break;
          }
          const placeholderEmail = email.trim().toLowerCase();
          const placeholderPhoto =
            updatedPlaceholder.photoData ||
            localStore.getPhotoByIdOrEmail(placeholderEmail);
          const placeholderWithEmail = {
            ...updatedPlaceholder,
            photoData: placeholderPhoto || "",
            email: placeholderEmail,
          } as FamilyMember;
          addMember.mutate(placeholderWithEmail);
          updateMember.mutate(updatedCenter);
          toast.success(`${placeholder.name} यांना ${roleLabel} म्हणून जोडले`);
          handleClose();
          return;
        }

        // First attempt: show warning + store placeholder
        const placeholderMember: FamilyMember = {
          id: `user-${email
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9@.]/gi, "-")}`,
          name: email.trim().split("@")[0],
          firstName: email.trim().split("@")[0],
          lastName: "",
          gender: "",
          maritalStatus: "",
          motherName: "",
          fatherName: "",
          husbandName: "",
          birthDate: "",
          birthTime: "",
          marriageDate: "",
          deathDate: "",
          isDeceased: false,
          bloodGroup: "",
          village: "",
          nativeVillage: "",
          occupation: "",
          occupationType: "",
          education: "",
          additionalInfo: "",
          mobile: "",
          whatsapp: "",
          address: "",
          houseNumber: "",
          roadName: "",
          landmark: "",
          cityVillage: "",
          pincode: "",
          district: "",
          fatherId: "",
          motherId: "",
          fatherInLawId: "",
          motherInLawId: "",
          spouseIds: [],
          childrenIds: [],
          brotherIds: [],
          sisterIds: [],
          createdBy: "admin",
          createdAt: BigInt(Date.now()),
          fatherFullName: "",
          motherFullName: "",
          fatherInLawName: "",
          motherInLawName: "",
          spouseName: "",
          brotherNames: "",
          sisterNames: "",
          childrenNames: "",
          photoData: "",
        };
        setPendingPlaceholder(placeholderMember);
        setError(
          `या ईमेलशी नोंदणी आढळली नाही / No registration found for this email. तरीही जोडायचे असल्यास पुन्हा "जोडा" दाबा / Press "जोडा" again to add anyway.`,
        );
        setIsSearching(false);
        return;
      }

      // Update center member's relationship
      const updatedCenter: FamilyMember = { ...centerMember };
      // Also prepare reverse-link update for the found member
      // (bi-directional: so when found member becomes center, relationships still show)
      let updatedFoundMember: FamilyMember = { ...foundMember };

      switch (role) {
        case "father":
          updatedCenter.fatherId = foundMember.id;
          // Reverse: father's childrenIds should include center
          if (!updatedFoundMember.childrenIds.includes(centerMember.id)) {
            updatedFoundMember.childrenIds = [
              ...updatedFoundMember.childrenIds,
              centerMember.id,
            ];
          }
          break;
        case "mother":
          updatedCenter.motherId = foundMember.id;
          // Reverse: mother's childrenIds should include center
          if (!updatedFoundMember.childrenIds.includes(centerMember.id)) {
            updatedFoundMember.childrenIds = [
              ...updatedFoundMember.childrenIds,
              centerMember.id,
            ];
          }
          break;
        case "spouse":
          if (!updatedCenter.spouseIds.includes(foundMember.id)) {
            updatedCenter.spouseIds = [
              ...updatedCenter.spouseIds,
              foundMember.id,
            ];
          }
          // Reverse: spouse's spouseIds should include center
          if (!updatedFoundMember.spouseIds.includes(centerMember.id)) {
            updatedFoundMember.spouseIds = [
              ...updatedFoundMember.spouseIds,
              centerMember.id,
            ];
          }
          break;
        case "child":
          if (!updatedCenter.childrenIds.includes(foundMember.id)) {
            updatedCenter.childrenIds = [
              ...updatedCenter.childrenIds,
              foundMember.id,
            ];
          }
          // Reverse: child's fatherId/motherId should point to center
          // Use gender to determine father vs mother
          if (centerMember.gender === "female") {
            if (!updatedFoundMember.motherId) {
              updatedFoundMember.motherId = centerMember.id;
            }
          } else {
            // Default to father (male or unknown)
            if (!updatedFoundMember.fatherId) {
              updatedFoundMember.fatherId = centerMember.id;
            }
          }
          break;
        case "brother":
          if (!updatedCenter.brotherIds.includes(foundMember.id)) {
            updatedCenter.brotherIds = [
              ...updatedCenter.brotherIds,
              foundMember.id,
            ];
          }
          // Reverse: brother sees center as sibling
          if (centerMember.gender === "female") {
            if (!updatedFoundMember.sisterIds.includes(centerMember.id)) {
              updatedFoundMember.sisterIds = [
                ...updatedFoundMember.sisterIds,
                centerMember.id,
              ];
            }
          } else {
            if (!updatedFoundMember.brotherIds.includes(centerMember.id)) {
              updatedFoundMember.brotherIds = [
                ...updatedFoundMember.brotherIds,
                centerMember.id,
              ];
            }
          }
          // SHARED PARENT LOGIC: assign center's parents to sibling
          if (centerMember.fatherId && !updatedFoundMember.fatherId) {
            updatedFoundMember.fatherId = centerMember.fatherId;
          }
          if (centerMember.motherId && !updatedFoundMember.motherId) {
            updatedFoundMember.motherId = centerMember.motherId;
          }
          // Update father's childrenIds to include new sibling
          if (centerMember.fatherId) {
            const fatherMember = allMembers.find(
              (m) => m.id === centerMember.fatherId,
            );
            if (
              fatherMember &&
              !fatherMember.childrenIds.includes(foundMember.id)
            ) {
              updateMember.mutate({
                ...fatherMember,
                childrenIds: [...fatherMember.childrenIds, foundMember.id],
              });
            }
          }
          // Update mother's childrenIds to include new sibling
          if (centerMember.motherId) {
            const motherMember = allMembers.find(
              (m) => m.id === centerMember.motherId,
            );
            if (
              motherMember &&
              !motherMember.childrenIds.includes(foundMember.id)
            ) {
              updateMember.mutate({
                ...motherMember,
                childrenIds: [...motherMember.childrenIds, foundMember.id],
              });
            }
          }
          break;
        case "sister":
          if (!updatedCenter.sisterIds.includes(foundMember.id)) {
            updatedCenter.sisterIds = [
              ...updatedCenter.sisterIds,
              foundMember.id,
            ];
          }
          // Reverse: sister sees center as sibling
          if (centerMember.gender === "female") {
            if (!updatedFoundMember.sisterIds.includes(centerMember.id)) {
              updatedFoundMember.sisterIds = [
                ...updatedFoundMember.sisterIds,
                centerMember.id,
              ];
            }
          } else {
            if (!updatedFoundMember.brotherIds.includes(centerMember.id)) {
              updatedFoundMember.brotherIds = [
                ...updatedFoundMember.brotherIds,
                centerMember.id,
              ];
            }
          }
          // SHARED PARENT LOGIC: assign center's parents to sibling
          if (centerMember.fatherId && !updatedFoundMember.fatherId) {
            updatedFoundMember.fatherId = centerMember.fatherId;
          }
          if (centerMember.motherId && !updatedFoundMember.motherId) {
            updatedFoundMember.motherId = centerMember.motherId;
          }
          // Update father's childrenIds to include new sibling
          if (centerMember.fatherId) {
            const fatherMember = allMembers.find(
              (m) => m.id === centerMember.fatherId,
            );
            if (
              fatherMember &&
              !fatherMember.childrenIds.includes(foundMember.id)
            ) {
              updateMember.mutate({
                ...fatherMember,
                childrenIds: [...fatherMember.childrenIds, foundMember.id],
              });
            }
          }
          // Update mother's childrenIds to include new sibling
          if (centerMember.motherId) {
            const motherMember = allMembers.find(
              (m) => m.id === centerMember.motherId,
            );
            if (
              motherMember &&
              !motherMember.childrenIds.includes(foundMember.id)
            ) {
              updateMember.mutate({
                ...motherMember,
                childrenIds: [...motherMember.childrenIds, foundMember.id],
              });
            }
          }
          break;
        case "fatherInLaw":
          updatedCenter.fatherInLawId = foundMember.id;
          if (spouseMember) {
            const updatedSpouse: FamilyMember = {
              ...spouseMember,
              fatherId: foundMember.id,
            };
            updateMember.mutate(updatedSpouse);
            // Reverse: father-in-law's childrenIds should include spouse
            if (!updatedFoundMember.childrenIds.includes(spouseMember.id)) {
              updatedFoundMember.childrenIds = [
                ...updatedFoundMember.childrenIds,
                spouseMember.id,
              ];
            }
          }
          break;
        case "motherInLaw":
          updatedCenter.motherInLawId = foundMember.id;
          if (spouseMember) {
            const updatedSpouse: FamilyMember = {
              ...spouseMember,
              motherId: foundMember.id,
            };
            updateMember.mutate(updatedSpouse);
            // Reverse: mother-in-law's childrenIds should include spouse
            if (!updatedFoundMember.childrenIds.includes(spouseMember.id)) {
              updatedFoundMember.childrenIds = [
                ...updatedFoundMember.childrenIds,
                spouseMember.id,
              ];
            }
          }
          break;
      }

      // Inject email into member so photo lookup by email key works in localStorage
      // and pull photo from email-keyed storage if not already on member
      const emailForPhoto = email.trim().toLowerCase();
      const existingPhoto =
        updatedFoundMember.photoData ||
        localStore.getPhotoByIdOrEmail(emailForPhoto);
      const memberWithEmail = {
        ...updatedFoundMember,
        photoData: existingPhoto || "",
        email: emailForPhoto,
      } as FamilyMember;

      // Save the found member with reverse-links first (ensures it exists in localStorage)
      addMember.mutate(memberWithEmail);

      // Persist updated center — use mutate to avoid throw, localStorage handles it
      updateMember.mutate(updatedCenter);

      toast.success(`${foundMember.name} यांना ${roleLabel} म्हणून जोडले`);
      handleClose();
    } catch (err) {
      // This catch is only for truly unexpected errors in findOrCreateMemberByEmail
      const msg = err instanceof Error ? err.message : "अज्ञात त्रुटी";
      setError(`सदस्य जोडण्यात अयशस्वी: ${msg}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="sm:max-w-md"
        data-ocid="family-tree.add_by_email.dialog"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-saffron/15 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-saffron" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg text-foreground">
                सदस्य जोडा
              </DialogTitle>
              <DialogDescription className="font-ui text-sm text-muted-foreground mt-0.5">
                {roleLabel} म्हणून सदस्य जोडा
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label
              htmlFor="member-email"
              className="font-ui text-sm font-medium"
            >
              ईमेल आयडी
            </Label>
            <Input
              id="member-email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
                if (pendingPlaceholder) setPendingPlaceholder(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="font-body"
              data-ocid="family-tree.add_by_email.input"
            />
            {error && (
              <p
                className="text-xs text-red-600 font-ui"
                data-ocid="family-tree.add_by_email.error_state"
              >
                {error}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-ui text-xs text-blue-700 leading-relaxed">
              <strong>नोंद:</strong> सदस्याचा नोंदणी केलेला ईमेल आयडी टाका. सदस्य
              नोंदणीकृत असल्यास ते वंशावळीत जोडले जातील.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="font-ui"
            data-ocid="family-tree.add_by_email.cancel_button"
          >
            रद्द करा
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSearching || updateMember.isPending || addMember.isPending
            }
            className="bg-saffron hover:bg-saffron-deep text-white font-ui"
            data-ocid="family-tree.add_by_email.submit_button"
          >
            {isSearching || updateMember.isPending || addMember.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                शोधत आहे...
              </>
            ) : (
              "जोडा"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
