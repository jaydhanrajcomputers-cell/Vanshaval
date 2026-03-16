import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  Database,
  Download,
  ImageIcon,
  List,
  Loader2,
  Printer,
  ShieldCheck,
  Trash2,
  TreePine,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type {
  PendingRegistration as BackendPendingRegistration,
  FamilyMember,
  GalleryPhoto,
  UserProfile,
} from "../backend.d";
import { UserRole } from "../backend.d";
import AdminMemberEditModal from "../components/admin/AdminMemberEditModal";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useActor } from "../hooks/useActor";
import {
  useAllFamilyMembers,
  useAllFamilyMembersForBackup,
  useAllGalleryPhotosForBackup,
  useAllUsers,
  useAllUsersForBackup,
  useApproveGalleryPhoto,
  useDeleteGalleryPhoto,
  useGalleryPhotoCount,
  useGalleryPhotos,
  usePendingRegistrationsQuery,
  useToggleUserActive,
  useUpdateGalleryPhotoCategory,
} from "../hooks/useQueries";
import type { TranslationKey } from "../i18n/translations";
import { localStore } from "../utils/localStore";
import type { PendingMemberData } from "../utils/localStore";

// ── Date/Time Formatters ──────────────────────────────────────────
function formatDateDMY(val: string | undefined | null): string {
  if (!val) return "–";
  const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  const slashMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch)
    return `${slashMatch[1].padStart(2, "0")}-${slashMatch[2].padStart(2, "0")}-${slashMatch[3]}`;
  return val;
}

function formatTimeAMPM(val: string | undefined | null): string {
  if (!val) return "–";
  const match = val.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return val;
  let h = Number.parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatChildrenNames(val: unknown): string {
  // Handle JSON array of objects like [{"name":"...","gender":""},...]
  if (typeof val === "string" && val.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: any) => {
            const name =
              typeof item === "object" && item !== null
                ? item.name || ""
                : String(item);
            return name
              .replace(/\(पुरुष\)/g, "(M)")
              .replace(/\(स्त्री\)/g, "(F)")
              .replace(/\(इतर\)/g, "(O)")
              .trim();
          })
          .filter(Boolean)
          .join(", ");
      }
    } catch {}
  }
  if (!val) return "–";
  const raw = Array.isArray(val) ? (val as string[]).join(", ") : String(val);
  if (!raw.trim()) return "–";
  return raw
    .split(", ")
    .map((entry) =>
      entry
        .replace(/\(पुरुष\)/g, "(M)")
        .replace(/\(स्त्री\)/g, "(F)")
        .replace(/\(इतर\)/g, "(O)")
        .trim(),
    )
    .filter(Boolean)
    .join(", ");
}

// ── Dashboard Tab ──────────────────────────────────────────────────

interface DashboardTabProps {
  onTabChange: (tab: string) => void;
}

function DashboardTab({ onTabChange }: DashboardTabProps) {
  const { t } = useLanguage();
  const { data: users = [], isLoading: usersLoading } = useAllUsers();
  const { data: members = [], isLoading: membersLoading } =
    useAllFamilyMembers();
  const { data: photoCount, isLoading: photosLoading } = useGalleryPhotoCount();
  const { data: pendingRegs = [] } = usePendingRegistrationsQuery();

  // Use localStorage as primary source of truth for counts (backend admin checks fail for anonymous callers)
  const backendPendingCount = pendingRegs.length;
  const localPendingCount = localStore.getPendingCount();
  const totalPendingCount = Math.max(backendPendingCount, localPendingCount);

  // Total users: backend + localStorage approved (deduplicated) + 1 for admin
  const localAllRegs = localStore.getAllRegistrations();
  const localApprovedCount = localAllRegs.filter(
    (r) => r.status === "approved",
  ).length;
  const localApprovedMembers = localStore.getApprovedFamilyMembers();
  // Total tree members = backend members + local-only approved members
  const backendMemberIds = new Set(members.map((m) => m.id));
  const localOnlyMemberCount = localApprovedMembers.filter(
    (m) => !backendMemberIds.has(m.id),
  ).length;
  const totalMemberCount = members.length + localOnlyMemberCount;

  // Total users count: use backend if available, else fall back to localStorage
  const totalUsersCount =
    users.length > 0 ? users.length : localApprovedCount + 1; // +1 for admin

  const stats = [
    {
      label: "एकूण सदस्य / Total Users",
      value: usersLoading ? "..." : totalUsersCount.toString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      onClick: () => onTabChange("users"),
      link: null,
    },
    {
      label: "प्रलंबित नोंदणी / Pending Registrations",
      value: totalPendingCount.toString(),
      icon: Clock,
      color: totalPendingCount > 0 ? "text-red-600" : "text-amber-600",
      bg: totalPendingCount > 0 ? "bg-red-50" : "bg-amber-50",
      onClick: () => onTabChange("pending"),
      link: null,
    },
    {
      label: t("treeMembers"),
      value: membersLoading ? "..." : totalMemberCount.toString(),
      icon: TreePine,
      color: "text-saffron",
      bg: "bg-saffron/10",
      onClick: null,
      link: "/family-tree",
    },
    {
      label: t("galleryPhotos"),
      value: photosLoading
        ? "..."
        : photoCount !== undefined
          ? photoCount.toString()
          : "0",
      icon: Camera,
      color: "text-purple-600",
      bg: "bg-purple-50",
      onClick: null,
      link: "/gallery",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) =>
          stat.link ? (
            <motion.a
              key={stat.label}
              href={stat.link}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              data-ocid={`admin.stats.card.${idx + 1}`}
              className="p-5 rounded-xl bg-card border border-border shadow-sm cursor-pointer hover:border-saffron/40 hover:shadow-md transition-all block"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} mb-3`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="font-display text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="font-ui text-xs text-muted-foreground mt-1 leading-tight">
                {stat.label}
              </div>
              <div className="font-ui text-[10px] text-saffron mt-1.5 font-medium">
                पाहण्यासाठी क्लिक करा →
              </div>
            </motion.a>
          ) : (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              data-ocid={`admin.stats.card.${idx + 1}`}
              onClick={stat.onClick ?? undefined}
              className="p-5 rounded-xl bg-card border border-border shadow-sm cursor-pointer hover:border-saffron/40 hover:shadow-md transition-all"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} mb-3`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="font-display text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="font-ui text-xs text-muted-foreground mt-1 leading-tight">
                {stat.label}
              </div>
              <div className="font-ui text-[10px] text-saffron mt-1.5 font-medium">
                पाहण्यासाठी क्लिक करा →
              </div>
            </motion.div>
          ),
        )}
      </div>
    </div>
  );
}

// ── Pending Registrations Tab ──────────────────────────────────────

function PendingRegistrationsTab() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [approvingEmail, setApprovingEmail] = useState<string | null>(null);

  // Backend is primary source of truth
  const {
    data: backendRegs = [],
    isLoading,
    refetch,
  } = usePendingRegistrationsQuery();

  // Also merge localStorage regs (for backward compatibility with old registrations)
  const localRegs = localStore.getPendingRegistrations();
  const backendEmails = new Set(backendRegs.map((r) => r.email));
  // Only show local-only regs that aren't already in backend
  const localOnlyRegs = localRegs.filter((r) => !backendEmails.has(r.email));

  const handleApproveBackend = async (reg: BackendPendingRegistration) => {
    setApprovingEmail(reg.email);

    // Build the member data object for localStorage fallback
    // Fetch photo from localStorage (stored during registration; backend never receives it)
    const registrationPhoto =
      localStore.getPhotoByIdOrEmail(reg.email) || reg.photoData || "";
    const memberDataForLocal: PendingMemberData = {
      id: reg.id,
      email: reg.email,
      name: reg.name,
      firstName: reg.firstName,
      lastName: reg.lastName,
      gender: reg.gender,
      maritalStatus: reg.maritalStatus,
      motherName: reg.motherName,
      fatherName: reg.fatherName,
      husbandName: reg.husbandName,
      birthDate: reg.birthDate,
      birthTime: reg.birthTime,
      bloodGroup: reg.bloodGroup,
      marriageDate: reg.marriageDate,
      deathDate: reg.deathDate,
      isDeceased: reg.isDeceased,
      photoData: registrationPhoto,
      education: reg.education,
      occupationType: reg.occupationType,
      occupation: reg.occupation,
      additionalInfo: reg.additionalInfo,
      mobile: reg.mobile,
      whatsapp: reg.whatsapp,
      houseNumber: reg.houseNumber,
      roadName: reg.roadName,
      landmark: reg.landmark,
      cityVillage: reg.cityVillage,
      pincode: reg.pincode,
      district: reg.district,
      address: reg.address,
      nativeVillage: reg.nativeVillage,
      fatherFullName: reg.fatherFullName,
      motherFullName: reg.motherFullName,
      fatherInLawName: reg.fatherInLawName,
      motherInLawName: reg.motherInLawName,
      spouseName: reg.spouseName,
      brotherNames: reg.brotherNames,
      sisterNames: reg.sisterNames,
      childrenNames: reg.childrenNames,
    };

    try {
      // 1. Activate user via approveRegistration (backend handles isActive=true)
      try {
        await actor?.approveRegistration(reg.email);
      } catch {
        // Backend approval failed — still continue with localStorage
      }

      // 2. Build FamilyMember from full PendingRegistration data and add to backend
      if (actor) {
        try {
          const familyMember: FamilyMember = {
            id: reg.id,
            name: reg.name,
            firstName: reg.firstName,
            lastName: reg.lastName,
            gender: reg.gender,
            maritalStatus: reg.maritalStatus,
            motherName: reg.motherName,
            fatherName: reg.fatherName,
            husbandName: reg.husbandName,
            birthDate: reg.birthDate,
            birthTime: reg.birthTime,
            bloodGroup: reg.bloodGroup,
            marriageDate: reg.marriageDate,
            deathDate: reg.deathDate,
            isDeceased: reg.isDeceased,
            photoData: reg.photoData,
            education: reg.education,
            occupationType: reg.occupationType,
            occupation: reg.occupation,
            additionalInfo: reg.additionalInfo,
            mobile: reg.mobile,
            whatsapp: reg.whatsapp,
            houseNumber: reg.houseNumber,
            roadName: reg.roadName,
            landmark: reg.landmark,
            cityVillage: reg.cityVillage,
            pincode: reg.pincode,
            district: reg.district,
            address: reg.address,
            nativeVillage: reg.nativeVillage,
            village: reg.nativeVillage,
            fatherFullName: reg.fatherFullName,
            motherFullName: reg.motherFullName,
            fatherInLawName: reg.fatherInLawName,
            motherInLawName: reg.motherInLawName,
            spouseName: reg.spouseName,
            brotherNames: reg.brotherNames,
            sisterNames: reg.sisterNames,
            childrenNames: reg.childrenNames,
            fatherId: "",
            motherId: "",
            spouseIds: [],
            childrenIds: [],
            brotherIds: [],
            sisterIds: [],
            fatherInLawId: "",
            motherInLawId: "",
            createdAt: BigInt(Date.now()),
            createdBy: "admin",
          };
          await actor.addFamilyMember(familyMember);
        } catch {
          // FamilyMember creation failed — save to localStorage as fallback
        }
      }

      // 3. Always save to localStorage for fallback display and admin panel modal
      localStore.approveRegistration(reg.email);
      // Always save full member data so admin panel can display it
      localStore.saveApprovedFamilyMember(memberDataForLocal);

      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRegistrations"] });
      queryClient.invalidateQueries({ queryKey: ["patriarchId"] });
      refetch();
      toast.success(`${reg.name} यांची नोंदणी मंजूर केली आणि वंशावळीत जोडले!`);
    } catch {
      // Even if everything fails, save to localStorage
      localStore.approveRegistration(reg.email);
      localStore.saveApprovedFamilyMember(memberDataForLocal);
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
      refetch();
      toast.success(
        `${reg.name} यांची नोंदणी मंजूर केली! (वंशावळ स्थानिक मेमरीत जोडले)`,
      );
    } finally {
      setApprovingEmail(null);
    }
  };

  const handleRejectBackend = async (reg: BackendPendingRegistration) => {
    setApprovingEmail(reg.email);
    try {
      await actor?.rejectRegistration(reg.email);
      localStore.rejectRegistration(reg.email);
      queryClient.invalidateQueries({ queryKey: ["pendingRegistrations"] });
      refetch();
      toast.info(`${reg.name} — नाकारलेले / Rejected`);
    } catch (err) {
      toast.error(
        `नाकारण्यात अयशस्वी / Failed to reject: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setApprovingEmail(null);
    }
  };

  // Handle localStorage-only (old) registrations
  const handleApproveLocal = async (reg: (typeof localOnlyRegs)[0]) => {
    setApprovingEmail(reg.email);
    try {
      // Mark as approved in localStorage (primary source of truth)
      localStore.approveRegistration(reg.email);

      // Get full member data and save as approved family member for tree display
      const memberData = localStore.getMemberData(reg.email);
      if (memberData) {
        localStore.saveApprovedFamilyMember(memberData);
        localStore.removeMemberData(reg.email);

        // Try backend calls but don't fail if they error (backend requires principal-based auth)
        try {
          await actor?.adminToggleUserActive(reg.email, true);
        } catch {
          // ignore — localStorage approval is sufficient
        }

        if (actor) {
          try {
            const familyMember: FamilyMember = {
              id: memberData.id || reg.id,
              name: memberData.name,
              firstName: memberData.firstName,
              lastName: memberData.lastName,
              gender: memberData.gender,
              maritalStatus: memberData.maritalStatus,
              motherName: memberData.motherName,
              fatherName: memberData.fatherName,
              husbandName: memberData.husbandName,
              birthDate: memberData.birthDate,
              birthTime: memberData.birthTime,
              bloodGroup: memberData.bloodGroup,
              marriageDate: memberData.marriageDate,
              deathDate: memberData.deathDate,
              isDeceased: memberData.isDeceased,
              photoData: memberData.photoData,
              education: memberData.education,
              occupationType: memberData.occupationType,
              occupation: memberData.occupation,
              additionalInfo: memberData.additionalInfo,
              mobile: memberData.mobile,
              whatsapp: memberData.whatsapp,
              houseNumber: memberData.houseNumber,
              roadName: memberData.roadName,
              landmark: memberData.landmark,
              cityVillage: memberData.cityVillage,
              pincode: memberData.pincode,
              district: memberData.district,
              address: memberData.address,
              nativeVillage: memberData.nativeVillage,
              village: memberData.nativeVillage,
              fatherFullName: memberData.fatherFullName,
              motherFullName: memberData.motherFullName,
              fatherInLawName: memberData.fatherInLawName,
              motherInLawName: memberData.motherInLawName,
              spouseName: memberData.spouseName,
              brotherNames: memberData.brotherNames,
              sisterNames: memberData.sisterNames,
              childrenNames: memberData.childrenNames,
              fatherId: "",
              motherId: "",
              spouseIds: [],
              childrenIds: [],
              brotherIds: [],
              sisterIds: [],
              fatherInLawId: "",
              motherInLawId: "",
              createdAt: BigInt(Date.now()),
              createdBy: "admin",
            };
            await actor.addFamilyMember(familyMember);
          } catch {
            // ignore — member will show from localStorage in FamilyTreePage
          }
        }
      } else {
        // No full data — just try backend activation
        try {
          await actor?.adminToggleUserActive(reg.email, true);
        } catch {
          // ignore
        }
      }

      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRegistrations"] });
      refetch();
      toast.success(`${reg.name} यांची नोंदणी मंजूर केली आणि वंशावळीत जोडले!`);
    } finally {
      setApprovingEmail(null);
    }
  };

  const handleRejectLocal = (reg: (typeof localOnlyRegs)[0]) => {
    localStore.rejectRegistration(reg.email);
    queryClient.invalidateQueries({ queryKey: ["pendingRegistrations"] });
    refetch();
    toast.info(`${reg.name} — नाकारलेले / Rejected`);
  };

  const totalCount = backendRegs.length + localOnlyRegs.length;

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="admin.pending.loading_state">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div
        className="flex flex-col items-center py-12 text-center"
        data-ocid="admin.pending.empty_state"
      >
        <CheckCircle2 className="h-10 w-10 text-green-400 mb-3" />
        <p className="font-display text-base font-semibold text-foreground">
          कोणतीही प्रलंबित नोंदणी नाही
        </p>
        <p className="font-ui text-sm text-muted-foreground mt-1">
          No pending registrations awaiting approval
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="font-ui text-sm text-amber-800">
            <span className="font-semibold">{totalCount}</span> नवीन सदस्य ऍडमिन
            मंजुरीची प्रतीक्षा करत आहेत / members awaiting your approval
          </p>
        </div>
        <p className="font-ui text-xs text-amber-600 flex items-center gap-1 whitespace-nowrap">
          <Database className="h-3 w-3" />
          Backend
        </p>
      </div>

      <div className="space-y-3">
        {/* Backend registrations (primary) */}
        {backendRegs.map((reg, idx) => (
          <motion.div
            key={reg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            data-ocid={`admin.pending.item.${idx + 1}`}
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron/20 text-saffron font-display font-bold text-sm flex-shrink-0">
                  {reg.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-ui text-sm font-semibold text-foreground truncate">
                    {reg.name}
                  </p>
                  <p className="font-ui text-xs text-muted-foreground truncate">
                    {reg.email}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {reg.mobile && (
                      <p className="font-ui text-xs text-muted-foreground">
                        📱 {reg.mobile}
                      </p>
                    )}
                    {reg.nativeVillage && (
                      <p className="font-ui text-xs text-muted-foreground">
                        📍 {reg.nativeVillage}
                      </p>
                    )}
                    {reg.bloodGroup && reg.bloodGroup !== "माहित नाही" && (
                      <p className="font-ui text-xs text-muted-foreground">
                        🩸 {reg.bloodGroup}
                      </p>
                    )}
                  </div>
                  <p className="font-ui text-xs text-muted-foreground">
                    नोंदणी:{" "}
                    {new Date(Number(reg.registeredAt)).toLocaleDateString(
                      "mr-IN",
                    )}
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-ui text-xs flex-shrink-0">
                <Clock className="h-3 w-3 mr-1" />
                प्रलंबित
              </Badge>
            </div>

            {reg.education && (
              <p className="font-ui text-xs text-muted-foreground mt-2">
                🎓 {reg.education} · {reg.occupationType}
              </p>
            )}

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => handleApproveBackend(reg)}
                disabled={approvingEmail === reg.email}
                data-ocid={`admin.pending.approve_button.${idx + 1}`}
                className="bg-green-600 hover:bg-green-700 text-white font-ui text-xs h-8 flex-1"
              >
                {approvingEmail === reg.email ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                मंजूर करा / Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRejectBackend(reg)}
                disabled={approvingEmail === reg.email}
                data-ocid={`admin.pending.reject_button.${idx + 1}`}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 font-ui text-xs h-8 flex-1"
              >
                <XCircle className="h-3 w-3 mr-1" />
                नाकारा / Reject
              </Button>
            </div>
          </motion.div>
        ))}

        {/* LocalStorage-only registrations (backward compat) */}
        {localOnlyRegs.map((reg, idx) => (
          <motion.div
            key={reg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (backendRegs.length + idx) * 0.05 }}
            data-ocid={`admin.pending.item.${backendRegs.length + idx + 1}`}
            className="p-4 rounded-xl border border-border bg-secondary/30 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground font-display font-bold text-sm flex-shrink-0">
                  {reg.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-ui text-sm font-semibold text-foreground truncate">
                    {reg.name}
                  </p>
                  <p className="font-ui text-xs text-muted-foreground truncate">
                    {reg.email}
                  </p>
                  <p className="font-ui text-xs text-muted-foreground">
                    नोंदणी:{" "}
                    {new Date(reg.registeredAt).toLocaleDateString("mr-IN")}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="font-ui text-xs flex-shrink-0"
              >
                <Database className="h-3 w-3 mr-1" />
                Local
              </Badge>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => handleApproveLocal(reg)}
                disabled={approvingEmail === reg.email}
                data-ocid={`admin.pending.approve_button.${backendRegs.length + idx + 1}`}
                className="bg-green-600 hover:bg-green-700 text-white font-ui text-xs h-8 flex-1"
              >
                {approvingEmail === reg.email ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                मंजूर करा / Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRejectLocal(reg)}
                disabled={approvingEmail === reg.email}
                data-ocid={`admin.pending.reject_button.${backendRegs.length + idx + 1}`}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 font-ui text-xs h-8 flex-1"
              >
                <XCircle className="h-3 w-3 mr-1" />
                नाकारा / Reject
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Users Tab ──────────────────────────────────────────────────────

function UsersTab() {
  const { t } = useLanguage();
  const { data: users = [], isLoading } = useAllUsers();
  const toggleMutation = useToggleUserActive();
  const { actor } = useActor();
  const [deletedEmails, setDeletedEmails] = useState<Set<string>>(new Set());
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(
    null,
  );

  // Use localStorage registrations as fallback when backend returns empty
  const localRegs = localStore.getAllRegistrations();
  const displayUsers: UserProfile[] =
    users.length > 0
      ? users
      : [
          // Always include admin
          {
            id: "admin-default",
            name: "Admin",
            email: "admin@vatavriksha.com",
            role: UserRole.admin,
            isActive: true,
            isVerified: true,
            passwordHash: "Admin@123",
            createdAt: BigInt(0),
          } as UserProfile,
          // Then all registrations from localStorage
          ...localRegs.map(
            (r): UserProfile => ({
              id: r.id,
              name: r.name,
              email: r.email,
              role: UserRole.user,
              isActive: r.status === "approved",
              isVerified: false,
              passwordHash: "",
              createdAt: BigInt(r.registeredAt),
            }),
          ),
        ];

  // Filter out deleted users from display
  const filteredDisplayUsers = displayUsers.filter(
    (u) => !deletedEmails.has(u.email),
  );

  // Helper: get password for display (from localStorage)
  const getUserPassword = (user: UserProfile): string => {
    if (user.email === "admin@vatavriksha.com") return "Admin@123";
    // Check pending member data first
    const memberData = localStore.getMemberData(user.email);
    if (memberData?.passwordHash) return memberData.passwordHash;
    // Check approved family members (data moved here after approval)
    const approvedMembers = localStore.getApprovedFamilyMembers();
    const approvedMember = approvedMembers.find((m) => m.email === user.email);
    if (approvedMember?.passwordHash) return approvedMember.passwordHash;
    // Also check passwordHash from UserProfile (if backend returned it)
    if (user.passwordHash) return user.passwordHash;
    return "—";
  };

  const PROTECTED_EMAILS = [
    "admin@vatavriksha.com",
    "ganesh.abhangrao@vatavriksha.com",
  ];

  const handleDelete = (user: UserProfile) => {
    if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
      toast.error(
        "हे खाते कायमस्वरूपी संरक्षित आहे आणि हटवता येणार नाही. / This account is permanently protected and cannot be deleted.",
      );
      return;
    }
    const confirmed = window.confirm(
      `"${user.name}" हे खाते कायमचे डिलीट करायचे आहे का?\nAre you sure you want to permanently delete "${user.name}"?`,
    );
    if (!confirmed) return;

    const email = user.email;
    const userId = user.id;

    // 1. Remove from pending registrations
    const regs = localStore.getAllRegistrations();
    const updatedRegs = regs.filter((r) => r.email !== email);
    localStorage.setItem(
      "vatavriksha_pending_registrations",
      JSON.stringify(updatedRegs),
    );

    // 2. Remove from approved emails list
    const approvedEmailsArr = JSON.parse(
      localStorage.getItem("vatavriksha_approved_emails") || "[]",
    ) as string[];
    localStorage.setItem(
      "vatavriksha_approved_emails",
      JSON.stringify(approvedEmailsArr.filter((e: string) => e !== email)),
    );

    // 3. Remove member data record
    localStore.removeMemberData(email);

    // 4. Remove from approved members (vatavriksha_approved_members)
    try {
      const approvedMembers = JSON.parse(
        localStorage.getItem("vatavriksha_approved_members") || "[]",
      ) as { email?: string }[];
      localStorage.setItem(
        "vatavriksha_approved_members",
        JSON.stringify(approvedMembers.filter((m) => m.email !== email)),
      );
    } catch {
      /* ignore */
    }

    // 5. Remove from approved family members (vatavriksha_approved_family_members)
    try {
      const approvedFm = JSON.parse(
        localStorage.getItem("vatavriksha_approved_family_members") || "[]",
      ) as { email?: string }[];
      localStorage.setItem(
        "vatavriksha_approved_family_members",
        JSON.stringify(approvedFm.filter((m) => m.email !== email)),
      );
    } catch {
      /* ignore */
    }

    // 6. Remove from family tree members and unlink from all relationships
    try {
      const treeMembers = JSON.parse(
        localStorage.getItem("vatavriksha_family_tree_members") || "[]",
      ) as {
        id: string;
        email?: string;
        fatherId?: string;
        motherId?: string;
        fatherInLawId?: string;
        motherInLawId?: string;
        spouseIds?: string[];
        childrenIds?: string[];
        brotherIds?: string[];
        sisterIds?: string[];
      }[];
      // Filter out the deleted member
      const filtered = treeMembers.filter(
        (m) => m.id !== userId && m.email !== email,
      );
      // Unlink from all remaining members' relationship arrays
      const unlinked = filtered.map((m) => ({
        ...m,
        fatherId:
          m.fatherId === userId || m.fatherId === email
            ? undefined
            : m.fatherId,
        motherId:
          m.motherId === userId || m.motherId === email
            ? undefined
            : m.motherId,
        fatherInLawId:
          m.fatherInLawId === userId || m.fatherInLawId === email
            ? undefined
            : m.fatherInLawId,
        motherInLawId:
          m.motherInLawId === userId || m.motherInLawId === email
            ? undefined
            : m.motherInLawId,
        spouseIds: (m.spouseIds || []).filter(
          (id) => id !== userId && id !== email,
        ),
        childrenIds: (m.childrenIds || []).filter(
          (id) => id !== userId && id !== email,
        ),
        brotherIds: (m.brotherIds || []).filter(
          (id) => id !== userId && id !== email,
        ),
        sisterIds: (m.sisterIds || []).filter(
          (id) => id !== userId && id !== email,
        ),
      }));
      localStorage.setItem(
        "vatavriksha_family_tree_members",
        JSON.stringify(unlinked),
      );
    } catch {
      /* ignore */
    }

    // 7. Remove photo keys
    localStorage.removeItem(`vatavriksha_photo_${email}`);
    localStorage.removeItem(`vatavriksha_photo_${userId}`);

    // 8. Force logout if this is the current session user
    const sessionEmail = localStorage.getItem("vatavriksha_user_email");
    if (sessionEmail === email) {
      localStorage.removeItem("vatavriksha_user_email");
    }

    // 9. Try backend delete (ignore failure)
    try {
      const actorAny = actor as unknown as Record<
        string,
        (email: string) => Promise<unknown>
      >;
      if (typeof actorAny?.deleteUser === "function") {
        actorAny.deleteUser(email).catch(() => {});
      }
    } catch {
      /* ignore */
    }

    // 10. Update local display state
    setDeletedEmails((prev) => new Set([...prev, email]));

    toast.success(`${user.name} — डिलीट झाले / Deleted`);
  };

  const handleToggle = async (user: UserProfile) => {
    try {
      await toggleMutation.mutateAsync({
        email: user.email,
        isActive: !user.isActive,
      });
      toast.success(
        `${user.name} — ${!user.isActive ? t("activeStatus") : t("inactiveStatus")}`,
      );
    } catch {
      // If backend fails, update localStorage status
      if (user.role !== "admin") {
        const regs = localStore.getAllRegistrations();
        const updated = regs.map((r) =>
          r.email === user.email
            ? {
                ...r,
                status: (!user.isActive ? "approved" : "rejected") as
                  | "approved"
                  | "rejected",
              }
            : r,
        );
        localStorage.setItem(
          "vatavriksha_pending_registrations",
          JSON.stringify(updated),
        );
        toast.success(
          `${user.name} — ${!user.isActive ? t("activeStatus") : t("inactiveStatus")}`,
        );
      } else {
        toast.error("स्थिती बदलण्यात अयशस्वी / Failed to toggle status");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="admin.users.loading_state">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (filteredDisplayUsers.length === 0) {
    return (
      <div
        className="flex flex-col items-center py-12 text-center"
        data-ocid="admin.users.empty_state"
      >
        <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="font-ui text-sm text-muted-foreground">{t("noUsers")}</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border border-border"
      data-ocid="admin.users.table"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50">
            <TableHead className="font-ui text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12">
              अ.क्र.
            </TableHead>
            <TableHead className="font-ui text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              नाव / Name
            </TableHead>
            <TableHead className="font-ui text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              ईमेल / Email
            </TableHead>
            <TableHead className="font-ui text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
              पासवर्ड / Password
            </TableHead>
            <TableHead className="font-ui text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
              भूमिका / Role
            </TableHead>
            <TableHead className="font-ui text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              स्थिती
            </TableHead>
            <TableHead className="font-ui text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">
              क्रिया
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDisplayUsers.map((user, idx) => (
            <TableRow
              key={user.id}
              data-ocid={`admin.users.row.${idx + 1}`}
              className="hover:bg-secondary/30 transition-colors"
            >
              <TableCell className="font-ui text-sm font-bold text-muted-foreground py-3 w-12">
                {idx + 1}
              </TableCell>
              <TableCell className="font-ui text-sm font-medium text-foreground py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron/20 text-saffron font-display font-bold text-xs flex-shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMember(user)}
                    className="truncate max-w-[120px] text-left hover:text-saffron hover:underline underline-offset-2 transition-colors cursor-pointer font-inherit"
                    data-ocid={`admin.users.name_button.${idx + 1}`}
                  >
                    {user.name}
                  </button>
                </div>
              </TableCell>
              <TableCell className="font-ui text-xs text-muted-foreground py-3 max-w-[160px]">
                <span className="truncate block">{user.email}</span>
              </TableCell>
              <TableCell className="font-ui text-xs text-muted-foreground py-3 hidden md:table-cell">
                <span className="font-mono bg-secondary/60 px-2 py-0.5 rounded text-xs">
                  {getUserPassword(user)}
                </span>
              </TableCell>
              <TableCell className="py-3 hidden sm:table-cell">
                <Badge
                  variant="outline"
                  className={`font-ui text-xs ${
                    user.role === "admin"
                      ? "border-saffron/40 text-saffron bg-saffron/5"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="py-3">
                <Badge
                  className={`font-ui text-xs ${
                    user.isActive
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                  }`}
                >
                  {user.isActive ? t("activeStatus") : t("inactiveStatus")}
                </Badge>
              </TableCell>
              <TableCell className="py-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(user)}
                    disabled={toggleMutation.isPending || user.role === "admin"}
                    data-ocid={`admin.users.toggle_button.${idx + 1}`}
                    className="font-ui text-xs h-7 border-border hover:border-saffron/50 hover:text-saffron"
                  >
                    {t("toggleActive")}
                  </Button>
                  {user.role !== "admin" &&
                    ![
                      "admin@vatavriksha.com",
                      "ganesh.abhangrao@vatavriksha.com",
                    ].includes(user.email.toLowerCase()) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(user)}
                        data-ocid={`admin.users.delete_button.${idx + 1}`}
                        className="font-ui text-xs h-7 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        डिलीट / Delete
                      </Button>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedMember && (
        <AdminMemberEditModal
          user={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}

// ── List Generator Tab ────────────────────────────────────────────

type ListType =
  | "all"
  | "mobile"
  | "address"
  | "village"
  | "bloodgroup"
  | "deceased";

type TFunc = (key: TranslationKey) => string;

interface ListColumn {
  key: string;
  label: string;
  getValue: (m: FamilyMember, idx: number) => string;
}

function getListConfig(
  type: ListType,
  t: TFunc,
): {
  columns: ListColumn[];
  getData: (members: FamilyMember[]) => FamilyMember[];
} {
  const baseColumns: ListColumn[] = [
    { key: "idx", label: t("serialNo"), getValue: (_, i) => String(i + 1) },
  ];

  switch (type) {
    case "all":
      return {
        columns: [
          ...baseColumns,
          { key: "name", label: "नाव / Name", getValue: (m) => m.name },
          { key: "gender", label: t("gender"), getValue: (m) => m.gender },
          {
            key: "bloodGroup",
            label: t("bloodGroup"),
            getValue: (m) => m.bloodGroup || "–",
          },
          {
            key: "nativeVillage",
            label: t("nativeVillage"),
            getValue: (m) => m.nativeVillage || m.village || "–",
          },
          {
            key: "occupation",
            label: t("occupation"),
            getValue: (m) => m.occupation || "–",
          },
          {
            key: "mobile",
            label: t("mobile"),
            getValue: (m) => m.mobile || "–",
          },
        ],
        getData: (members) => members,
      };
    case "mobile":
      return {
        columns: [
          ...baseColumns,
          { key: "name", label: "नाव / Name", getValue: (m) => m.name },
          {
            key: "mobile",
            label: t("mobile"),
            getValue: (m) => m.mobile || "–",
          },
          {
            key: "whatsapp",
            label: "WhatsApp",
            getValue: (m) => m.whatsapp || "–",
          },
        ],
        getData: (members) => members,
      };
    case "address":
      return {
        columns: [
          ...baseColumns,
          { key: "name", label: "नाव / Name", getValue: (m) => m.name },
          {
            key: "address",
            label: t("address"),
            getValue: (m) => m.address || "–",
          },
          {
            key: "nativeVillage",
            label: t("nativeVillage"),
            getValue: (m) => m.nativeVillage || m.village || "–",
          },
        ],
        getData: (members) => members,
      };
    case "village":
      return {
        columns: [
          ...baseColumns,
          {
            key: "nativeVillage",
            label: t("nativeVillage"),
            getValue: (m) => m.nativeVillage || m.village || "–",
          },
          { key: "name", label: "नाव / Name", getValue: (m) => m.name },
          {
            key: "mobile",
            label: t("mobile"),
            getValue: (m) => m.mobile || "–",
          },
        ],
        getData: (members) =>
          [...members].sort((a, b) =>
            (a.nativeVillage || a.village || "").localeCompare(
              b.nativeVillage || b.village || "",
            ),
          ),
      };
    case "bloodgroup":
      return {
        columns: [
          ...baseColumns,
          {
            key: "bloodGroup",
            label: t("bloodGroup"),
            getValue: (m) => m.bloodGroup || "–",
          },
          { key: "name", label: "नाव / Name", getValue: (m) => m.name },
        ],
        getData: (members) =>
          [...members].sort((a, b) =>
            (a.bloodGroup || "").localeCompare(b.bloodGroup || ""),
          ),
      };
    case "deceased":
      return {
        columns: [
          ...baseColumns,
          { key: "name", label: "नाव / Name", getValue: (m) => m.name },
          {
            key: "birthDate",
            label: t("birthDate"),
            getValue: (m) => m.birthDate || "–",
          },
          {
            key: "deathDate",
            label: t("deathDate"),
            getValue: (m) => m.deathDate || "–",
          },
        ],
        getData: (members) => members.filter((m) => m.isDeceased),
      };
  }
}

const ALL_FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "नाव / Name" },
  { key: "gender", label: "लिंग / Gender" },
  { key: "birthDate", label: "जन्म तारीख / Birth Date" },
  { key: "birthTime", label: "जन्म वेळ / Birth Time" },
  { key: "bloodGroup", label: "रक्तगट / Blood Group" },
  { key: "maritalStatus", label: "वैवाहिक स्थिती / Marital Status" },
  { key: "spouseName", label: "पती/पत्नीचे नाव / Spouse Name" },
  { key: "marriageDate", label: "विवाह तारीख / Marriage Date" },
  { key: "isDeceased", label: "मृत्यू / Deceased" },
  { key: "deathDate", label: "मृत्यू तारीख / Death Date" },
  { key: "fatherName", label: "वडिलांचे नाव / Father Name" },
  { key: "motherName", label: "आईचे नाव / Mother Name" },
  { key: "fatherFullName", label: "वडिलांचे पूर्ण नाव / Father Full Name" },
  { key: "motherFullName", label: "आईचे पूर्ण नाव / Mother Full Name" },
  { key: "fatherInLawName", label: "सासरे / Father-in-law" },
  { key: "motherInLawName", label: "सासू / Mother-in-law" },
  { key: "brotherNames", label: "भावांची नावे / Brother Names" },
  { key: "sisterNames", label: "बहिणींची नावे / Sister Names" },
  { key: "childrenNames", label: "मुलांची नावे / Children Names" },
  { key: "education", label: "शिक्षण / Education" },
  { key: "occupation", label: "व्यवसाय / Occupation" },
  { key: "occupationType", label: "व्यवसायाचा प्रकार / Occupation Type" },
  { key: "mobile", label: "मोबाइल / Mobile" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "address", label: "पत्ता / Address" },
  { key: "houseNumber", label: "घर क्र. / House No." },
  { key: "roadName", label: "रस्त्याचे नाव / Road Name" },
  { key: "landmark", label: "खूण / Landmark" },
  { key: "cityVillage", label: "शहर/गाव / City/Village" },
  { key: "nativeVillage", label: "मूळ गाव / Native Village" },
  { key: "village", label: "गाव / Village" },
  { key: "district", label: "जिल्हा / District" },
  { key: "pincode", label: "पिनकोड / Pincode" },
  { key: "additionalInfo", label: "अतिरिक्त माहिती / Additional Info" },
];

const ALL_COLUMNS_FOR_FULL_LIST: ListColumn[] = [
  { key: "idx", label: "क्र.", getValue: (_, i) => String(i + 1) },
  { key: "name", label: "नाव / Name", getValue: (m) => m.name },
  { key: "gender", label: "लिंग / Gender", getValue: (m) => m.gender || "–" },
  {
    key: "birthDate",
    label: "जन्म तारीख / Birth Date",
    getValue: (m) => formatDateDMY((m as any).birthDate),
  },
  {
    key: "birthTime",
    label: "जन्म वेळ / Birth Time",
    getValue: (m) => formatTimeAMPM((m as any).birthTime),
  },
  {
    key: "bloodGroup",
    label: "रक्तगट / Blood Group",
    getValue: (m) => m.bloodGroup || "–",
  },
  {
    key: "maritalStatus",
    label: "वैवाहिक स्थिती / Marital Status",
    getValue: (m) => (m as any).maritalStatus || "–",
  },
  {
    key: "spouseName",
    label: "पती/पत्नीचे नाव / Spouse Name",
    getValue: (m) => (m as any).spouseName || "–",
  },
  {
    key: "marriageDate",
    label: "विवाह तारीख / Marriage Date",
    getValue: (m) => formatDateDMY((m as any).marriageDate),
  },
  {
    key: "isDeceased",
    label: "मृत्यू / Deceased",
    getValue: (m) => (m.isDeceased ? "होय" : "नाही"),
  },
  {
    key: "deathDate",
    label: "मृत्यू तारीख / Death Date",
    getValue: (m) => formatDateDMY(m.deathDate),
  },
  {
    key: "fatherName",
    label: "वडिलांचे नाव / Father Name",
    getValue: (m) => (m as any).fatherName || "–",
  },
  {
    key: "motherName",
    label: "आईचे नाव / Mother Name",
    getValue: (m) => (m as any).motherName || "–",
  },
  {
    key: "fatherFullName",
    label: "वडिलांचे पूर्ण नाव / Father Full Name",
    getValue: (m) => (m as any).fatherFullName || "–",
  },
  {
    key: "motherFullName",
    label: "आईचे पूर्ण नाव / Mother Full Name",
    getValue: (m) => (m as any).motherFullName || "–",
  },
  {
    key: "fatherInLawName",
    label: "सासरे / Father-in-law",
    getValue: (m) => (m as any).fatherInLawName || "–",
  },
  {
    key: "motherInLawName",
    label: "सासू / Mother-in-law",
    getValue: (m) => (m as any).motherInLawName || "–",
  },
  {
    key: "brotherNames",
    label: "भावांची नावे / Brother Names",
    getValue: (m) =>
      Array.isArray((m as any).brotherNames)
        ? ((m as any).brotherNames as string[]).join(", ")
        : (m as any).brotherNames || "–",
  },
  {
    key: "sisterNames",
    label: "बहिणींची नावे / Sister Names",
    getValue: (m) =>
      Array.isArray((m as any).sisterNames)
        ? ((m as any).sisterNames as string[]).join(", ")
        : (m as any).sisterNames || "–",
  },
  {
    key: "childrenNames",
    label: "मुलांची नावे / Children Names",
    getValue: (m) => formatChildrenNames((m as any).childrenNames),
  },
  {
    key: "education",
    label: "शिक्षण / Education",
    getValue: (m) => (m as any).education || "–",
  },
  {
    key: "occupation",
    label: "व्यवसाय / Occupation",
    getValue: (m) => m.occupation || "–",
  },
  {
    key: "occupationType",
    label: "व्यवसायाचा प्रकार / Occupation Type",
    getValue: (m) => (m as any).occupationType || "–",
  },
  { key: "mobile", label: "मोबाइल / Mobile", getValue: (m) => m.mobile || "–" },
  { key: "whatsapp", label: "WhatsApp", getValue: (m) => m.whatsapp || "–" },
  {
    key: "address",
    label: "पत्ता / Address",
    getValue: (m) => m.address || "–",
  },
  {
    key: "houseNumber",
    label: "घर क्र. / House No.",
    getValue: (m) => (m as any).houseNumber || "–",
  },
  {
    key: "roadName",
    label: "रस्त्याचे नाव / Road Name",
    getValue: (m) => (m as any).roadName || "–",
  },
  {
    key: "landmark",
    label: "खूण / Landmark",
    getValue: (m) => (m as any).landmark || "–",
  },
  {
    key: "cityVillage",
    label: "शहर/गाव / City/Village",
    getValue: (m) => (m as any).cityVillage || "–",
  },
  {
    key: "nativeVillage",
    label: "मूळ गाव / Native Village",
    getValue: (m) => m.nativeVillage || m.village || "–",
  },
  { key: "village", label: "गाव / Village", getValue: (m) => m.village || "–" },
  {
    key: "district",
    label: "जिल्हा / District",
    getValue: (m) => (m as any).district || "–",
  },
  {
    key: "pincode",
    label: "पिनकोड / Pincode",
    getValue: (m) => (m as any).pincode || "–",
  },
  {
    key: "additionalInfo",
    label: "अतिरिक्त माहिती / Additional Info",
    getValue: (m) => (m as any).additionalInfo || "–",
  },
];

function ListGeneratorTab() {
  const { t } = useLanguage();
  const { data: members = [], isLoading } = useAllFamilyMembers();
  const [listType, setListType] = useState<ListType>("all");
  const [generated, setGenerated] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(["name", "gender", "bloodGroup", "occupation", "mobile"]),
  );
  const tableRef = useRef<HTMLDivElement>(null);

  const { columns: baseColumns, getData } = getListConfig(listType, t);
  const activeColumns =
    listType === "all"
      ? ALL_COLUMNS_FOR_FULL_LIST.filter(
          (c) => c.key === "idx" || selectedFields.has(c.key),
        )
      : baseColumns;
  const columns = activeColumns;
  const listData = getData(members);

  const listTypeOptions: { value: ListType; label: string }[] = [
    { value: "all", label: t("fullMemberList") },
    { value: "mobile", label: t("mobileList") },
    { value: "address", label: t("addressList") },
    { value: "village", label: t("villageList") },
    { value: "bloodgroup", label: t("bloodGroupList") },
    { value: "deceased", label: t("deceasedList") },
  ];

  const handleGenerate = () => {
    setGenerated(true);
  };

  const handlePrint = () => {
    if (!tableRef.current) return;
    const printContent = tableRef.current.innerHTML;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>वटवृक्ष – यादी</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; color: #333; }
            table { border-collapse: collapse; width: 100%; font-size: 13px; }
            th { background: #f97316; color: white; padding: 8px 12px; text-align: left; }
            td { padding: 6px 12px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) { background: #fafafa; }
          </style>
        </head>
        <body>
          <h2>वटवृक्ष – अभंगराव घराणे – ${listTypeOptions.find((o) => o.value === listType)?.label ?? ""}</h2>
          ${printContent}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleExportExcel = () => {
    if (listData.length === 0) return;
    const header = columns.map((c) => c.label);
    const rows = listData.map((m, i) => columns.map((c) => c.getValue(m, i)));
    const allRows = [header, ...rows];
    const csvContent = allRows
      .map((row) =>
        row
          .map((cell) => {
            const val = String(cell ?? "").replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(","),
      )
      .join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vatavriksha-yadee.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel (CSV) फाइल डाउनलोड झाली / File downloaded");
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label className="font-ui text-xs text-muted-foreground uppercase tracking-wide">
            {t("listType")}
          </Label>
          <Select
            value={listType}
            onValueChange={(v) => {
              setListType(v as ListType);
              setGenerated(false);
            }}
          >
            <SelectTrigger
              data-ocid="admin.listgen.type_select"
              className="font-ui text-sm max-w-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {listTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isLoading}
          data-ocid="admin.listgen.generate_button"
          className="bg-saffron hover:bg-saffron-deep text-white font-ui"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <List className="h-4 w-4 mr-2" />
          )}
          {t("generateList")}
        </Button>
      </div>

      {/* Field selector for full member list */}
      {listType === "all" && (
        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-ui text-sm font-semibold text-foreground">
              प्रदर्शित करायची क्षेत्रे निवडा / Select fields to display
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                data-ocid="admin.listgen.field_select_all_button"
                className="font-ui text-xs h-7"
                onClick={() =>
                  setSelectedFields(new Set(ALL_FIELDS.map((f) => f.key)))
                }
              >
                सर्व निवडा / Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-ocid="admin.listgen.field_deselect_all_button"
                className="font-ui text-xs h-7"
                onClick={() => setSelectedFields(new Set())}
              >
                सर्व काढा / Deselect All
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {ALL_FIELDS.map((field, i) => (
              <label
                key={field.key}
                htmlFor={`field-checkbox-${field.key}`}
                data-ocid={`admin.listgen.field.checkbox.${i + 1}`}
                className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-secondary/50 transition-colors"
              >
                <Checkbox
                  id={`field-checkbox-${field.key}`}
                  checked={selectedFields.has(field.key)}
                  onCheckedChange={(checked) => {
                    setSelectedFields((prev) => {
                      const next = new Set(prev);
                      if (checked) next.add(field.key);
                      else next.delete(field.key);
                      return next;
                    });
                  }}
                  className="shrink-0"
                />
                <span className="font-ui text-xs text-foreground leading-tight">
                  {field.label}
                </span>
              </label>
            ))}
          </div>
          <p className="font-ui text-xs text-muted-foreground">
            {selectedFields.size} क्षेत्रे निवडली / {selectedFields.size} fields
            selected
          </p>
        </div>
      )}

      {/* Generated table */}
      {generated && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {/* Action buttons */}
          <div className="flex items-center gap-2 justify-between">
            <p className="font-ui text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {listData.length}
              </span>{" "}
              {t("membersFound")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={listData.length === 0}
                data-ocid="admin.listgen.print_button"
                className="font-ui text-xs border-border hover:border-saffron/50"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                {t("printList")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={listData.length === 0}
                data-ocid="admin.listgen.export_excel_button"
                className="font-ui text-xs border-border hover:border-green-600/50 text-green-700"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export to Excel
              </Button>
            </div>
          </div>

          {/* Empty state */}
          {listData.length === 0 ? (
            <div
              className="flex flex-col items-center py-12 text-center border border-border rounded-xl"
              data-ocid="admin.listgen.results.empty_state"
            >
              <List className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-ui text-sm text-muted-foreground">
                {t("noMembersFound")}
              </p>
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-xl border border-border"
              data-ocid="admin.listgen.table"
              ref={tableRef}
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-saffron/10">
                      {columns.map((col) => (
                        <TableHead
                          key={col.key}
                          className="font-ui text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap"
                        >
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listData.map((member, idx) => (
                      <TableRow
                        key={member.id}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        {columns.map((col) => (
                          <TableCell
                            key={col.key}
                            className="font-ui text-sm text-foreground py-2.5 whitespace-nowrap"
                          >
                            {col.getValue(member, idx)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Placeholder if not generated yet */}
      {!generated && (
        <div className="flex flex-col items-center py-12 text-center border border-dashed border-border rounded-xl text-muted-foreground">
          <List className="h-10 w-10 mb-3 opacity-30" />
          <p className="font-ui text-sm">
            यादी प्रकार निवडा आणि &quot;{t("generateList")}&quot; दाबा
          </p>
        </div>
      )}
    </div>
  );
}

// ── Gallery Category config ───────────────────────────────────────

const GALLERY_CATEGORIES = [
  { key: "wedding", mr: "लग्न", en: "Wedding" },
  { key: "engagement", mr: "साखरपुडा", en: "Engagement" },
  { key: "birthday", mr: "वाढदिवस", en: "Birthday" },
  { key: "trip", mr: "ट्रिप", en: "Trip" },
  { key: "socialEvent", mr: "सामाजिक कार्यक्रम", en: "Social Events" },
  { key: "pandharpur", mr: "पंढरपूर ठिकाणे", en: "Pandharpur Places" },
];

// ── Admin Gallery Tab ─────────────────────────────────────────────

function AdminGalleryTab() {
  const { language } = useLanguage();
  // Use useGalleryPhotos which merges backend + localStorage (all photos)
  const { data: allPhotos = [], isLoading } = useGalleryPhotos();
  const approveMutation = useApproveGalleryPhoto();
  const deleteMutation = useDeleteGalleryPhoto();
  const updateCategoryMutation = useUpdateGalleryPhotoCategory();

  const handleEnable = (photo: GalleryPhoto) => {
    // Use mutate (not mutateAsync) — localStorage-first, never throws
    approveMutation.mutate(photo.id);
    toast.success("फोटो सक्षम केला / Photo enabled");
  };

  const handleDisable = (photo: GalleryPhoto) => {
    // Use mutate (not mutateAsync) — localStorage-first, never throws
    deleteMutation.mutate(photo.id);
    toast.success("फोटो अक्षम केला / Photo disabled");
  };

  const handleCategoryChange = (photo: GalleryPhoto, newCategory: string) => {
    // Use mutate (not mutateAsync) — localStorage-first, never throws
    updateCategoryMutation.mutate({ photoId: photo.id, newCategory });
    toast.success("श्रेणी बदलली / Category updated");
  };

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        data-ocid="admin.gallery.loading_state"
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (allPhotos.length === 0) {
    return (
      <div
        className="flex flex-col items-center py-12 text-center"
        data-ocid="admin.gallery.empty_state"
      >
        <Camera className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="font-ui text-sm text-muted-foreground">
          {language === "mr" ? "कोणतेही फोटो नाहीत" : "No photos found"}
        </p>
      </div>
    );
  }

  const enabledCount = allPhotos.filter(
    (p) => p.approvedStatus === "approved",
  ).length;
  const disabledCount = allPhotos.length - enabledCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <p className="font-ui text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {allPhotos.length}
          </span>{" "}
          {language === "mr" ? "एकूण फोटो" : "total photos"}
        </p>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800 border-green-200 font-ui text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {enabledCount} {language === "mr" ? "सक्षम" : "enabled"}
          </Badge>
          {disabledCount > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200 font-ui text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              {disabledCount} {language === "mr" ? "अक्षम" : "disabled"}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {allPhotos.map((photo, idx) => {
          const isEnabled = photo.approvedStatus === "approved";
          return (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              data-ocid={`admin.gallery.item.${idx + 1}`}
              className={`rounded-xl border bg-card shadow-sm overflow-hidden transition-opacity ${isEnabled ? "border-border" : "border-red-200 opacity-70"}`}
            >
              {/* Status ribbon */}
              <div
                className={`px-3 py-1.5 flex items-center justify-between ${isEnabled ? "bg-green-50" : "bg-red-50"}`}
              >
                <Badge
                  className={`font-ui text-xs ${isEnabled ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}`}
                >
                  {isEnabled
                    ? language === "mr"
                      ? "सक्षम (दिसत आहे)"
                      : "Enabled (visible)"
                    : language === "mr"
                      ? "अक्षम (लपवलेले)"
                      : "Disabled (hidden)"}
                </Badge>
                <span className="font-ui text-xs text-muted-foreground">
                  {photo.uploaderName}
                </span>
              </div>

              {/* Thumbnail */}
              <div className="aspect-video bg-secondary overflow-hidden">
                {photo.photoData ? (
                  <img
                    src={photo.photoData}
                    alt={photo.caption || "Photo"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  {photo.caption && (
                    <p className="font-ui text-sm font-medium text-foreground line-clamp-1">
                      {photo.caption}
                    </p>
                  )}
                  <p className="font-ui text-xs text-muted-foreground">
                    {photo.uploadedBy} ·{" "}
                    {new Date(Number(photo.createdAt)).toLocaleDateString(
                      "mr-IN",
                    )}
                  </p>
                </div>

                {/* Category change */}
                <div className="space-y-1">
                  <Label className="font-ui text-xs text-muted-foreground">
                    {language === "mr" ? "श्रेणी बदला" : "Change Category"}
                  </Label>
                  <Select
                    value={photo.category}
                    onValueChange={(v) => handleCategoryChange(photo, v)}
                    disabled={updateCategoryMutation.isPending}
                  >
                    <SelectTrigger
                      data-ocid={`admin.gallery.category_select.${idx + 1}`}
                      className="font-ui text-xs h-8"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GALLERY_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.key} value={cat.key}>
                          {language === "mr" ? cat.mr : cat.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Enable / Disable toggle */}
                <div className="flex gap-2">
                  {isEnabled ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDisable(photo)}
                      disabled={deleteMutation.isPending}
                      data-ocid={`admin.gallery.disable_button.${idx + 1}`}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50 font-ui text-xs h-8"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {language === "mr" ? "अक्षम करा" : "Disable"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleEnable(photo)}
                      disabled={approveMutation.isPending}
                      data-ocid={`admin.gallery.enable_button.${idx + 1}`}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-ui text-xs h-8"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {language === "mr" ? "सक्षम करा" : "Enable"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Hero Photo Tab ────────────────────────────────────────────────

const HERO_PHOTO_KEY = "vatavriksha_hero_photo";

function HeroPhotoTab() {
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem(HERO_PHOTO_KEY);
    } catch {
      return null;
    }
  });
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayPhoto =
    previewPhoto ??
    currentPhoto ??
    "/assets/generated/patriarch-placeholder.dim_400x500.jpg";
  const isCustomPhoto = !!(previewPhoto ?? currentPhoto);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > 2 * 1024 * 1024) {
      setError(
        "फोटो 2 MB पेक्षा जास्त आहे. कृपया लहान फोटो निवडा. / Photo exceeds 2 MB. Please select a smaller photo.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreviewPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!previewPhoto) return;
    setIsSaving(true);
    try {
      localStorage.setItem(HERO_PHOTO_KEY, previewPhoto);
      setCurrentPhoto(previewPhoto);
      setPreviewPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("मुखपृष्ठ फोटो जतन झाला! / Hero photo saved!");
    } catch {
      toast.error("फोटो जतन करण्यात अयशस्वी / Failed to save photo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = () => {
    localStorage.removeItem(HERO_PHOTO_KEY);
    setCurrentPhoto(null);
    setPreviewPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success(
      "फोटो काढला. मूळ फोटो परत आला. / Photo removed. Original restored.",
    );
  };

  const handleCancel = () => {
    setPreviewPhoto(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Info note */}
      <Alert className="border-blue-200 bg-blue-50">
        <ImageIcon className="h-4 w-4 text-blue-600" />
        <AlertDescription className="font-ui text-sm text-blue-800">
          मुखपृष्ठावरील श्री गणेश सावळाराम अभंगराव यांचा मुख्य फोटो येथून बदलता येईल. /
          Change the main patriarch photo shown on the Home page.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photo Preview */}
        <div className="space-y-3">
          <Label className="font-ui text-sm font-semibold text-foreground">
            {previewPhoto
              ? "नवीन फोटो प्रीव्यू / New Photo Preview"
              : "सध्याचा फोटो / Current Photo"}
          </Label>
          <div
            className="relative overflow-hidden rounded-xl border-2 border-dashed border-saffron/40 bg-secondary/30"
            style={{ aspectRatio: "4/5", maxHeight: "360px" }}
          >
            <img
              src={displayPhoto}
              alt="श्री गणेश सावळाराम अभंगराव"
              className="w-full h-full object-cover rounded-xl"
            />
            {previewPhoto && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-green-600 text-white font-ui text-xs">
                  नवीन / New
                </Badge>
              </div>
            )}
            {isCustomPhoto && !previewPhoto && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-saffron text-white font-ui text-xs">
                  कस्टम / Custom
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Upload Controls */}
        <div className="space-y-5">
          {/* File upload area */}
          <div className="space-y-2">
            <Label className="font-ui text-sm font-semibold text-foreground">
              नवीन फोटो अपलोड करा / Upload New Photo
            </Label>
            <label
              htmlFor="hero-photo-input"
              className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-saffron/60 hover:bg-saffron/5 transition-colors"
              data-ocid="admin.herophoto.dropzone"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron/10">
                <Camera className="h-6 w-6 text-saffron" />
              </div>
              <div className="text-center">
                <p className="font-ui text-sm font-medium text-foreground">
                  फोटो निवडण्यासाठी क्लिक करा
                </p>
                <p className="font-ui text-xs text-muted-foreground mt-1">
                  Click to select a photo
                </p>
              </div>
              <input
                id="hero-photo-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                data-ocid="admin.herophoto.upload_button"
              />
            </label>
            {/* Size note */}
            <p className="font-ui text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
              फोटो 2 MB पेक्षा जास्त नसावा / Photo must not exceed 2 MB
            </p>
          </div>

          {/* Error state */}
          {error && (
            <Alert
              className="border-destructive/40 bg-destructive/5"
              data-ocid="admin.herophoto.error_state"
            >
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="font-ui text-sm text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {previewPhoto && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  data-ocid="admin.herophoto.save_button"
                  className="flex-1 bg-saffron hover:bg-saffron-deep text-white font-ui"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  जतन करा / Save
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  data-ocid="admin.herophoto.cancel_button"
                  className="font-ui border-border hover:border-saffron/50"
                >
                  रद्द करा / Cancel
                </Button>
              </motion.div>
            )}

            {currentPhoto && !previewPhoto && (
              <Button
                variant="outline"
                onClick={handleRemove}
                data-ocid="admin.herophoto.delete_button"
                className="w-full font-ui border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4 mr-2" />
                फोटो काढा / Remove Custom Photo
              </Button>
            )}
          </div>

          {/* Status info */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
            <p className="font-ui text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              स्थिती / Status
            </p>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${isCustomPhoto ? "bg-green-500" : "bg-amber-400"}`}
              />
              <p className="font-ui text-sm text-foreground">
                {isCustomPhoto
                  ? "कस्टम फोटो वापरत आहे / Using custom photo"
                  : "डीफॉल्ट फोटो वापरत आहे / Using default photo"}
              </p>
            </div>
            <p className="font-ui text-xs text-muted-foreground">
              हा फोटो फक्त या device वर localStorage मध्ये साठवला जातो. / This
              photo is stored in localStorage on this device only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Backup Tab ─────────────────────────────────────────────────────

function BackupTab() {
  const { t } = useLanguage();
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const { refetch: fetchUsers } = useAllUsersForBackup();
  const { refetch: fetchTree } = useAllFamilyMembersForBackup();
  const { refetch: fetchGallery } = useAllGalleryPhotosForBackup();

  const downloadJSON = (data: unknown, filename: string) => {
    const json = JSON.stringify(
      data,
      (_key, value) => (typeof value === "bigint" ? value.toString() : value),
      2,
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await fetchUsers();
      if (data) {
        downloadJSON(data, `vatavriksha-users-${Date.now()}.json`);
        toast.success(t("downloadSuccess"));
      }
    } catch {
      toast.error("डाउनलोड अयशस्वी / Download failed");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDownloadTree = async () => {
    setLoadingTree(true);
    try {
      const { data } = await fetchTree();
      if (data) {
        downloadJSON(data, `vatavriksha-tree-${Date.now()}.json`);
        toast.success(t("downloadSuccess"));
      }
    } catch {
      toast.error("डाउनलोड अयशस्वी / Download failed");
    } finally {
      setLoadingTree(false);
    }
  };

  const handleDownloadGallery = async () => {
    setLoadingGallery(true);
    try {
      const { data } = await fetchGallery();
      if (data) {
        // Exclude photoData to keep file small
        const sanitized = data.map((p) => ({
          ...p,
          photoData: "[image_data_excluded]",
        }));
        downloadJSON(sanitized, `vatavriksha-gallery-${Date.now()}.json`);
        toast.success(t("downloadSuccess"));
      }
    } catch {
      toast.error("डाउनलोड अयशस्वी / Download failed");
    } finally {
      setLoadingGallery(false);
    }
  };

  const backupActions = [
    {
      label: t("downloadUsers"),
      description: "सर्व सदस्यांची माहिती JSON फॉर्मेट मध्ये",
      icon: Users,
      loading: loadingUsers,
      onClick: handleDownloadUsers,
      ocid: "admin.backup.users_button",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: t("downloadFamilyTree"),
      description: "संपूर्ण वंशावळ JSON फॉर्मेट मध्ये",
      icon: TreePine,
      loading: loadingTree,
      onClick: handleDownloadTree,
      ocid: "admin.backup.tree_button",
      color: "text-saffron",
      bg: "bg-saffron/10",
    },
    {
      label: t("downloadGallery"),
      description: "गॅलरी माहिती JSON फॉर्मेट मध्ये (फोटो वगळून)",
      icon: Camera,
      loading: loadingGallery,
      onClick: handleDownloadGallery,
      ocid: "admin.backup.gallery_button",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Info note */}
      <Alert className="border-amber-200 bg-amber-50">
        <Database className="h-4 w-4 text-amber-600" />
        <AlertDescription className="font-ui text-sm text-amber-800">
          {t("backupNote")}
        </AlertDescription>
      </Alert>

      {/* Download buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {backupActions.map((action, idx) => (
          <motion.div
            key={action.ocid}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.bg}`}
            >
              <action.icon className={`h-6 w-6 ${action.color}`} />
            </div>
            <div>
              <p className="font-ui text-sm font-semibold text-foreground">
                {action.label}
              </p>
              <p className="font-ui text-xs text-muted-foreground mt-1">
                {action.description}
              </p>
            </div>
            <Button
              onClick={action.onClick}
              disabled={action.loading}
              data-ocid={action.ocid}
              className="w-full bg-saffron hover:bg-saffron-deep text-white font-ui text-sm"
            >
              {action.loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {action.loading ? "डाउनलोड होत आहे..." : "डाउनलोड"}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────────────

export function AdminPage() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");

  return (
    <main className="min-h-screen heritage-bg py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="container mx-auto max-w-5xl"
        data-ocid="admin.panel"
      >
        {/* Header */}
        <div className="bg-card border border-border rounded-2xl shadow-heritage-lg overflow-hidden mb-6">
          <div className="hero-gradient px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  {t("adminPanel")}
                </h1>
                <p className="font-body text-white/80 text-sm mt-0.5">
                  {t("adminWelcome")}{" "}
                  <span className="font-semibold text-white">
                    {currentUser?.name ?? "Admin"}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="saffron-divider" />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList
            className="bg-card border border-border shadow-sm p-1 h-auto rounded-xl w-full grid grid-cols-4 sm:grid-cols-7"
            data-ocid="admin.tabs"
          >
            <TabsTrigger
              value="dashboard"
              data-ocid="admin.dashboard_tab"
              className="font-ui text-xs py-2.5 rounded-lg data-[state=active]:bg-saffron data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              {t("adminDashboard")}
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              data-ocid="admin.pending_tab"
              className="font-ui text-xs py-2.5 rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-sm relative"
            >
              नवीन नोंदणी
            </TabsTrigger>
            <TabsTrigger
              value="users"
              data-ocid="admin.users_tab"
              className="font-ui text-xs py-2.5 rounded-lg data-[state=active]:bg-saffron data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              {t("adminUsers")}
            </TabsTrigger>
            <TabsTrigger
              value="listgen"
              data-ocid="admin.listgen_tab"
              className="font-ui text-xs py-2.5 rounded-lg data-[state=active]:bg-saffron data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              {t("listGenerator")}
            </TabsTrigger>
            <TabsTrigger
              value="gallery"
              data-ocid="admin.gallery_tab"
              className="font-ui text-xs py-2.5 rounded-lg data-[state=active]:bg-saffron data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              {t("galleryTab")}
            </TabsTrigger>
            <TabsTrigger
              value="herophoto"
              data-ocid="admin.herophoto_tab"
              className="font-ui text-xs py-2.5 rounded-lg data-[state=active]:bg-saffron data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              मुखपृष्ठ फोटो
            </TabsTrigger>
            <TabsTrigger
              value="backup"
              data-ocid="admin.backup_tab"
              className="font-ui text-xs py-2.5 rounded-lg data-[state=active]:bg-saffron data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              {t("backupTab")}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="dashboard"
            className="bg-card border border-border rounded-2xl shadow-sm p-6"
          >
            <DashboardTab onTabChange={setActiveTab} />
          </TabsContent>

          <TabsContent
            value="pending"
            className="bg-card border border-amber-200 rounded-2xl shadow-sm p-6"
          >
            <div className="mb-4">
              <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                नवीन नोंदणी – मंजुरी प्रतीक्षा
              </h2>
              <p className="font-ui text-sm text-muted-foreground mt-1">
                New member registrations awaiting admin approval
              </p>
            </div>
            <PendingRegistrationsTab />
          </TabsContent>

          <TabsContent
            value="users"
            className="bg-card border border-border rounded-2xl shadow-sm p-6"
          >
            <UsersTab />
          </TabsContent>

          <TabsContent
            value="listgen"
            className="bg-card border border-border rounded-2xl shadow-sm p-6"
          >
            <ListGeneratorTab />
          </TabsContent>

          <TabsContent
            value="gallery"
            className="bg-card border border-border rounded-2xl shadow-sm p-6"
          >
            <AdminGalleryTab />
          </TabsContent>

          <TabsContent
            value="herophoto"
            className="bg-card border border-border rounded-2xl shadow-sm p-6"
          >
            <div className="mb-4">
              <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-saffron" />
                मुखपृष्ठ फोटो / Hero Photo
              </h2>
              <p className="font-ui text-sm text-muted-foreground mt-1">
                मुखपृष्ठावरील मुख्य फोटो बदला / Change the main photo on the home
                page
              </p>
            </div>
            <HeroPhotoTab />
          </TabsContent>

          <TabsContent
            value="backup"
            className="bg-card border border-border rounded-2xl shadow-sm p-6"
          >
            <BackupTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  );
}
