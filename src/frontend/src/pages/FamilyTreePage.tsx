import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  Home,
  Minus,
  Plus,
  RotateCcw,
  TreePine,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FamilyMember } from "../backend.d";
import type { RelationshipRole } from "../components/family-tree/AddByEmailDialog";
import { AddByEmailDialog } from "../components/family-tree/AddByEmailDialog";
import { FamilyTreeNode } from "../components/family-tree/FamilyTreeNode";
import { MemberDetailPanel } from "../components/family-tree/MemberDetailPanel";
import { MemberFormModal } from "../components/family-tree/MemberFormModal";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  useAllFamilyMembers,
  usePatriarchId,
  useUpdateFamilyMember,
} from "../hooks/useQueries";
import type { TranslationKey } from "../i18n/translations";
import { localStore } from "../utils/localStore";
import type { LocalFamilyMember } from "../utils/localStore";

// ── Utility helpers ──────────────────────────────────────────────
function findMember(members: FamilyMember[], id: string): FamilyMember | null {
  if (!id) return null;
  return members.find((m) => m.id === id) ?? null;
}

// ── Connector lines ──────────────────────────────────────────────
function VConnector({ height = 32 }: { height?: number }) {
  return (
    <div
      className="w-px bg-gray-400 mx-auto"
      style={{ height: `${height}px` }}
    />
  );
}

function HConnector({ width = 32 }: { width?: number }) {
  return (
    <div
      className="h-px bg-gray-400 self-center shrink-0"
      style={{ width: `${width}px` }}
    />
  );
}

// ── Parents Couple Block ─────────────────────────────────────────
// Renders two nodes (e.g. father+mother) with a + badge between them
// and a horizontal bar + vertical drop connector below
interface ParentsCoupleBlockProps {
  leftNode: React.ReactNode;
  rightNode: React.ReactNode;
  plusColor?: string;
  plusBorderColor?: string;
  hasLeftOrRight: boolean;
}

function ParentsCoupleBlock({
  leftNode,
  rightNode,
  plusColor = "text-gray-500",
  plusBorderColor = "border-gray-400",
  hasLeftOrRight,
}: ParentsCoupleBlockProps) {
  if (!hasLeftOrRight) return null;
  return (
    <div className="flex flex-col items-center">
      {/* The two parent nodes side by side with + badge */}
      <div className="flex items-end gap-1">
        {leftNode}
        {/* + badge between parents */}
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${plusBorderColor} bg-white ${plusColor} font-bold text-xs mb-10 shrink-0`}
        >
          +
        </div>
        {rightNode}
      </div>
      {/* Vertical connector line down */}
      <VConnector height={28} />
    </div>
  );
}

// ── Tree Layout ──────────────────────────────────────────────────
interface TreeLayoutProps {
  center: FamilyMember;
  members: FamilyMember[];
  isAdmin: boolean;
  isLoggedIn: boolean;
  onSingleClick: (member: FamilyMember) => void;
  onDoubleClick: (member: FamilyMember) => void;
  onEmptySlotClick: (role: RelationshipRole) => void;
  onRemove: (role: RelationshipRole, memberId: string) => void;
}

function TreeLayout({
  center,
  members,
  isAdmin,
  isLoggedIn,
  onSingleClick,
  onDoubleClick,
  onEmptySlotClick,
  onRemove,
}: TreeLayoutProps) {
  // Derive all relatives
  const father = findMember(members, center.fatherId);
  const mother = findMember(members, center.motherId);
  const spouses = center.spouseIds
    .map((id) => findMember(members, id))
    .filter(Boolean) as FamilyMember[];
  const children = center.childrenIds
    .map((id) => findMember(members, id))
    .filter(Boolean) as FamilyMember[];
  const brothers = center.brotherIds
    .map((id) => findMember(members, id))
    .filter(Boolean) as FamilyMember[];
  const sisters = center.sisterIds
    .map((id) => findMember(members, id))
    .filter(Boolean) as FamilyMember[];

  // Spouse's parents from center's fatherInLawId/motherInLawId
  const fatherInLaw = findMember(members, center.fatherInLawId);
  const motherInLaw = findMember(members, center.motherInLawId);

  const hasSpouse = spouses.length > 0;
  const hasBrothers = brothers.length > 0;
  const hasSisters = sisters.length > 0;
  const hasChildren = children.length > 0;
  const hasParents = father !== null || mother !== null;
  const hasInLaws = fatherInLaw !== null || motherInLaw !== null;

  // Show parents row if there's any parent or any in-law (or admin)
  const showParentsRow = hasParents || hasInLaws || isAdmin;
  const showInLawsBlock = hasInLaws || (isAdmin && (hasSpouse || isAdmin));

  // Show children row if there are children or admin
  const showChildrenRow = hasChildren || isAdmin;

  // Total child count for connector bar width calculation
  const childCount = children.length + (isAdmin ? 1 : 0);

  return (
    <div
      className="flex flex-col items-center py-8 px-6 select-none"
      style={{ minWidth: "820px" }}
    >
      {/* ── ROW 1: Parents ── */}
      {showParentsRow && (
        <div className="flex items-end justify-center gap-28 w-full">
          {/* Center person's parents block (father + mother) */}
          <ParentsCoupleBlock
            hasLeftOrRight={hasParents || isAdmin}
            plusColor="text-gray-600"
            plusBorderColor="border-gray-400"
            leftNode={
              <FamilyTreeNode
                member={father}
                nodeRole="father"
                isAdmin={isAdmin}
                isUserLoggedIn={isLoggedIn}
                onSingleClick={onSingleClick}
                onDoubleClick={onDoubleClick}
                onEmptyClick={() => onEmptySlotClick("father")}
                onRemove={
                  isAdmin && father
                    ? () => onRemove("father", father.id)
                    : undefined
                }
                animationDelay={0.1}
                ocid="family-tree.father.card"
              />
            }
            rightNode={
              <FamilyTreeNode
                member={mother}
                nodeRole="mother"
                isAdmin={isAdmin}
                isUserLoggedIn={isLoggedIn}
                onSingleClick={onSingleClick}
                onDoubleClick={onDoubleClick}
                onEmptyClick={() => onEmptySlotClick("mother")}
                onRemove={
                  isAdmin && mother
                    ? () => onRemove("mother", mother.id)
                    : undefined
                }
                animationDelay={0.15}
                ocid="family-tree.mother.card"
              />
            }
          />

          {/* Spouse's parents block (father-in-law + mother-in-law) */}
          {showInLawsBlock && (
            <ParentsCoupleBlock
              hasLeftOrRight={showInLawsBlock}
              plusColor="text-sky-500"
              plusBorderColor="border-sky-400"
              leftNode={
                <FamilyTreeNode
                  member={fatherInLaw}
                  nodeRole="fatherInLaw"
                  isAdmin={isAdmin}
                  isUserLoggedIn={isLoggedIn}
                  onSingleClick={onSingleClick}
                  onDoubleClick={onDoubleClick}
                  onEmptyClick={() => onEmptySlotClick("fatherInLaw")}
                  onRemove={
                    isAdmin && fatherInLaw
                      ? () => onRemove("fatherInLaw", fatherInLaw.id)
                      : undefined
                  }
                  animationDelay={0.2}
                  ocid="family-tree.fatherinlaw.card"
                />
              }
              rightNode={
                <FamilyTreeNode
                  member={motherInLaw}
                  nodeRole="motherInLaw"
                  isAdmin={isAdmin}
                  isUserLoggedIn={isLoggedIn}
                  onSingleClick={onSingleClick}
                  onDoubleClick={onDoubleClick}
                  onEmptyClick={() => onEmptySlotClick("motherInLaw")}
                  onRemove={
                    isAdmin && motherInLaw
                      ? () => onRemove("motherInLaw", motherInLaw.id)
                      : undefined
                  }
                  animationDelay={0.25}
                  ocid="family-tree.motherinlaw.card"
                />
              }
            />
          )}
        </div>
      )}

      {/* ── ROW 2: Brothers — Center [+] Spouse — Sisters ── */}
      <div className="flex items-center">
        {/* Brothers (left side of center) */}
        {(hasBrothers || isAdmin) && (
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              {brothers.map((b, i) => (
                <FamilyTreeNode
                  key={b.id}
                  member={b}
                  nodeRole="brother"
                  isAdmin={isAdmin}
                  isUserLoggedIn={isLoggedIn}
                  onSingleClick={onSingleClick}
                  onDoubleClick={onDoubleClick}
                  onRemove={
                    isAdmin ? () => onRemove("brother", b.id) : undefined
                  }
                  animationDelay={0.2 + i * 0.05}
                  ocid={`family-tree.brother.item.${i + 1}`}
                />
              ))}
              {/* Admin empty slot for adding more brothers */}
              {isAdmin && (
                <FamilyTreeNode
                  member={null}
                  nodeRole="brother"
                  isAdmin={isAdmin}
                  onEmptyClick={() => onEmptySlotClick("brother")}
                  animationDelay={0.25 + brothers.length * 0.05}
                  ocid="family-tree.brother.open_modal_button"
                />
              )}
            </div>
            {/* Horizontal line connecting brothers to center */}
            <HConnector width={28} />
          </div>
        )}

        {/* CENTER PERSON */}
        <FamilyTreeNode
          member={center}
          nodeRole="center"
          isAdmin={isAdmin}
          isUserLoggedIn={isLoggedIn}
          onSingleClick={onSingleClick}
          onDoubleClick={onDoubleClick}
          animationDelay={0}
          ocid="family-tree.center.card"
        />

        {/* + connector badge between center and spouse */}
        {(hasSpouse || isAdmin) && (
          <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-orange-400 bg-orange-50 text-orange-500 font-bold text-sm mx-2 shrink-0">
            +
          </div>
        )}

        {/* SPOUSE */}
        {(hasSpouse || isAdmin) && (
          <div className="flex items-center gap-3">
            {spouses.length > 0 ? (
              spouses.map((sp, i) => (
                <FamilyTreeNode
                  key={sp.id}
                  member={sp}
                  nodeRole="spouse"
                  isAdmin={isAdmin}
                  isUserLoggedIn={isLoggedIn}
                  onSingleClick={onSingleClick}
                  onDoubleClick={onDoubleClick}
                  onRemove={
                    isAdmin ? () => onRemove("spouse", sp.id) : undefined
                  }
                  animationDelay={0.15 + i * 0.08}
                  ocid={`family-tree.spouse.item.${i + 1}`}
                />
              ))
            ) : (
              <FamilyTreeNode
                member={null}
                nodeRole="spouse"
                isAdmin={isAdmin}
                onEmptyClick={() => onEmptySlotClick("spouse")}
                animationDelay={0.15}
                ocid="family-tree.spouse.open_modal_button"
              />
            )}
          </div>
        )}

        {/* Sisters (right of spouse) */}
        {(hasSisters || isAdmin) && (
          <div className="flex items-center">
            {/* Horizontal line from spouse to sisters */}
            <HConnector width={28} />
            <div className="flex items-center gap-3">
              {sisters.map((s, i) => (
                <FamilyTreeNode
                  key={s.id}
                  member={s}
                  nodeRole="sister"
                  isAdmin={isAdmin}
                  isUserLoggedIn={isLoggedIn}
                  onSingleClick={onSingleClick}
                  onDoubleClick={onDoubleClick}
                  onRemove={
                    isAdmin ? () => onRemove("sister", s.id) : undefined
                  }
                  animationDelay={0.25 + i * 0.05}
                  ocid={`family-tree.sister.item.${i + 1}`}
                />
              ))}
              {/* Admin empty slot for adding more sisters */}
              {isAdmin && (
                <FamilyTreeNode
                  member={null}
                  nodeRole="sister"
                  isAdmin={isAdmin}
                  onEmptyClick={() => onEmptySlotClick("sister")}
                  animationDelay={0.3 + sisters.length * 0.05}
                  ocid="family-tree.sister.open_modal_button"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── ROW 3: Children with T-connector ── */}
      {showChildrenRow && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical stem from center couple down */}
          <VConnector height={28} />

          {/* Horizontal bar connecting all children (only if >1 child) */}
          {childCount > 1 && (
            <div
              className="relative flex items-center justify-center"
              style={{ width: `${childCount * 96}px`, maxWidth: "600px" }}
            >
              <div className="absolute h-px bg-gray-400 left-[10%] right-[10%]" />
            </div>
          )}

          {/* Children nodes — each with a small vertical drop from the bar */}
          <div className="flex items-start gap-4 justify-center flex-wrap">
            {children.map((child, i) => (
              <div key={child.id} className="flex flex-col items-center">
                {childCount > 1 && <VConnector height={14} />}
                <FamilyTreeNode
                  member={child}
                  nodeRole="child"
                  isAdmin={isAdmin}
                  isUserLoggedIn={isLoggedIn}
                  onSingleClick={onSingleClick}
                  onDoubleClick={onDoubleClick}
                  onRemove={
                    isAdmin ? () => onRemove("child", child.id) : undefined
                  }
                  animationDelay={0.35 + i * 0.07}
                  ocid={`family-tree.child.item.${i + 1}`}
                />
              </div>
            ))}
            {/* Admin empty slot for adding more children */}
            {isAdmin && (
              <div className="flex flex-col items-center">
                {childCount > 1 && <VConnector height={14} />}
                <FamilyTreeNode
                  member={null}
                  nodeRole="child"
                  isAdmin={isAdmin}
                  onEmptyClick={() => onEmptySlotClick("child")}
                  animationDelay={0.35 + children.length * 0.07}
                  ocid="family-tree.child.open_modal_button"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export function FamilyTreePage() {
  const { t } = useLanguage();
  const { isAdmin, isLoggedIn } = useAuth();
  const { data: backendMembers = [], isLoading } = useAllFamilyMembers();
  const { data: patriarchId = "" } = usePatriarchId();
  const updateMember = useUpdateFamilyMember();

  // localTreeRefresh: trigger to re-read localStorage when it changes
  const [localTreeRefresh, setLocalTreeRefresh] = useState(0);

  // Refresh local tree whenever localTreeRefresh changes (on mount and after mutations)
  const [localTreeMembers, setLocalTreeMembers] = useState<LocalFamilyMember[]>(
    () => localStore.getFamilyTreeMembers(),
  );
  // Also track approved members as state so they react to updates
  const [approvedFamilyMembers, setApprovedFamilyMembers] = useState(() =>
    localStore.getApprovedFamilyMembers(),
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: localTreeRefresh is an intentional counter trigger
  useEffect(() => {
    setLocalTreeMembers(localStore.getFamilyTreeMembers());
    setApprovedFamilyMembers(localStore.getApprovedFamilyMembers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTreeRefresh]);

  // Also refresh approvedFamilyMembers when localTreeMembers changes (picks up profile updates)
  // biome-ignore lint/correctness/useExhaustiveDependencies: localTreeMembers change is the trigger
  useEffect(() => {
    setApprovedFamilyMembers(localStore.getApprovedFamilyMembers());
  }, [localTreeMembers]);

  // Helper to refresh local state after any mutation
  const refreshLocalTree = useCallback(() => {
    setLocalTreeRefresh((n) => n + 1);
  }, []);

  // Convert a LocalFamilyMember to FamilyMember (re-attach photo from separate storage)
  const toFamilyMember = useCallback((m: LocalFamilyMember): FamilyMember => {
    // Re-read photo: try member's own photoData, then id key, then email key, then member data
    const memberEmail = m.email || "";
    const photoData =
      m.photoData ||
      localStore.getPhotoByIdOrEmail(m.id) ||
      (memberEmail ? localStore.getPhotoByIdOrEmail(memberEmail) : "") ||
      localStore.getMemberData(memberEmail || m.id)?.photoData ||
      localStore
        .getApprovedFamilyMembers()
        .find((a) => a.id === m.id || (memberEmail && a.email === memberEmail))
        ?.photoData ||
      "";
    return {
      id: m.id,
      name: m.name,
      firstName: m.firstName,
      lastName: m.lastName,
      gender: m.gender,
      maritalStatus: m.maritalStatus,
      motherName: m.motherName,
      fatherName: m.fatherName,
      husbandName: m.husbandName,
      birthDate: m.birthDate,
      birthTime: m.birthTime,
      bloodGroup: m.bloodGroup,
      marriageDate: m.marriageDate,
      deathDate: m.deathDate,
      isDeceased: m.isDeceased,
      photoData,
      education: m.education,
      occupationType: m.occupationType,
      occupation: m.occupation,
      additionalInfo: m.additionalInfo,
      mobile: m.mobile,
      whatsapp: m.whatsapp,
      houseNumber: m.houseNumber,
      roadName: m.roadName,
      landmark: m.landmark,
      cityVillage: m.cityVillage,
      pincode: m.pincode,
      district: m.district,
      address: m.address,
      nativeVillage: m.nativeVillage,
      village: m.nativeVillage,
      fatherFullName: m.fatherFullName,
      motherFullName: m.motherFullName,
      fatherInLawName: m.fatherInLawName,
      motherInLawName: m.motherInLawName,
      spouseName: m.spouseName,
      brotherNames: m.brotherNames,
      sisterNames: m.sisterNames,
      childrenNames: m.childrenNames,
      fatherId: m.fatherId || "",
      motherId: m.motherId || "",
      spouseIds: m.spouseIds || [],
      childrenIds: m.childrenIds || [],
      brotherIds: m.brotherIds || [],
      sisterIds: m.sisterIds || [],
      fatherInLawId: m.fatherInLawId || "",
      motherInLawId: m.motherInLawId || "",
      createdAt: BigInt(m.createdAt || 0),
      createdBy: m.createdBy || "admin",
    };
  }, []);

  // Merge: backend members + localStorage tree members (which have relationship data)
  // Priority: localTreeMembers override backendMembers for same id (so admin edits persist)
  const members: FamilyMember[] = useMemo(() => {
    const backendMemberIds = new Set(backendMembers.map((m) => m.id));

    // Backend members: use localTree version if available (has updated relationship data)
    const mergedBackend = backendMembers.map((bm) => {
      const localVer = localTreeMembers.find((lm) => lm.id === bm.id);
      // Photo: check all sources — backend, localTree, approved, id-key, email-key
      // For patriarch, also check the hardcoded email key
      const localEmail =
        localVer?.email ||
        (bm.id === "patriarch-1" ? "ganesh.abhangrao@vatavriksha.com" : "");
      const approvedMatch = approvedFamilyMembers.find(
        (a) => a.id === bm.id || (localEmail && a.email === localEmail),
      );
      const photoData =
        bm.photoData ||
        localVer?.photoData ||
        approvedMatch?.photoData ||
        localStore.getPhotoByIdOrEmail(bm.id) ||
        (localEmail ? localStore.getPhotoByIdOrEmail(localEmail) : "") ||
        "";

      if (localVer) {
        return {
          ...bm,
          fatherId: localVer.fatherId || bm.fatherId,
          motherId: localVer.motherId || bm.motherId,
          spouseIds: localVer.spouseIds?.length
            ? localVer.spouseIds
            : bm.spouseIds,
          childrenIds: localVer.childrenIds?.length
            ? localVer.childrenIds
            : bm.childrenIds,
          brotherIds: localVer.brotherIds?.length
            ? localVer.brotherIds
            : bm.brotherIds,
          sisterIds: localVer.sisterIds?.length
            ? localVer.sisterIds
            : bm.sisterIds,
          fatherInLawId: localVer.fatherInLawId || bm.fatherInLawId,
          motherInLawId: localVer.motherInLawId || bm.motherInLawId,
          photoData,
        };
      }
      return { ...bm, photoData };
    });

    // LocalTree-only members (not in backend)
    const localOnlyMembers = localTreeMembers.filter(
      (m) => !backendMemberIds.has(m.id),
    );

    // Also include approved members not yet in localTree or backend
    const localTreeIds = new Set(localTreeMembers.map((m) => m.id));
    const approvedOnlyMembers = approvedFamilyMembers.filter(
      (m) => !backendMemberIds.has(m.id) && !localTreeIds.has(m.id),
    );

    const approvedConverted: FamilyMember[] = approvedOnlyMembers.map((m) => ({
      id: m.id,
      name: m.name,
      firstName: m.firstName || "",
      lastName: m.lastName || "",
      gender: m.gender || "",
      maritalStatus: m.maritalStatus || "",
      motherName: m.motherName || "",
      fatherName: m.fatherName || "",
      husbandName: m.husbandName || "",
      birthDate: m.birthDate || "",
      birthTime: m.birthTime || "",
      bloodGroup: m.bloodGroup || "",
      marriageDate: m.marriageDate || "",
      deathDate: m.deathDate || "",
      isDeceased: m.isDeceased || false,
      photoData: m.photoData || "",
      education: m.education || "",
      occupationType: m.occupationType || "",
      occupation: m.occupation || "",
      additionalInfo: m.additionalInfo || "",
      mobile: m.mobile || "",
      whatsapp: m.whatsapp || "",
      houseNumber: m.houseNumber || "",
      roadName: m.roadName || "",
      landmark: m.landmark || "",
      cityVillage: m.cityVillage || "",
      pincode: m.pincode || "",
      district: m.district || "",
      address: m.address || "",
      nativeVillage: m.nativeVillage || "",
      village: m.nativeVillage || "",
      fatherFullName: m.fatherFullName || "",
      motherFullName: m.motherFullName || "",
      fatherInLawName: m.fatherInLawName || "",
      motherInLawName: m.motherInLawName || "",
      spouseName: m.spouseName || "",
      brotherNames: m.brotherNames || "",
      sisterNames: m.sisterNames || "",
      childrenNames: m.childrenNames || "",
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
    }));

    return [
      ...mergedBackend,
      ...localOnlyMembers.map(toFamilyMember),
      ...approvedConverted,
    ];
  }, [backendMembers, localTreeMembers, approvedFamilyMembers, toFamilyMember]);

  const [centerId, setCenterId] = useState<string>("");
  const [breadcrumb, setBreadcrumb] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null,
  );
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // AddByEmailDialog state
  const [addEmailDialogOpen, setAddEmailDialogOpen] = useState(false);
  const [addEmailRole, setAddEmailRole] = useState<RelationshipRole>("child");

  // Zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve current center
  const resolvedCenterId = centerId || patriarchId;
  const center =
    members.length > 0 ? findMember(members, resolvedCenterId) : null;
  const patriarch =
    members.length > 0 ? findMember(members, patriarchId) : null;

  // Spouse for in-law operations
  const firstSpouse = center
    ? (center.spouseIds
        .map((id) => findMember(members, id))
        .filter(Boolean)[0] ?? null)
    : null;

  // ── Navigation ────────────────────────────────────────────────
  const focusOnMember = useCallback(
    (member: FamilyMember) => {
      if (member.id === resolvedCenterId) return;
      const currentCenter = center;
      if (currentCenter) {
        setBreadcrumb((prev) => {
          const alreadyAt = prev.findIndex((b) => b.id === member.id);
          if (alreadyAt >= 0) return prev.slice(0, alreadyAt);
          return [...prev, currentCenter];
        });
      }
      setCenterId(member.id);
      setShowDetailPanel(false);
    },
    [center, resolvedCenterId],
  );

  const backToRoot = useCallback(() => {
    setCenterId(patriarchId);
    setBreadcrumb([]);
    setShowDetailPanel(false);
  }, [patriarchId]);

  const navigateBreadcrumb = useCallback(
    (member: FamilyMember, index: number) => {
      setCenterId(member.id);
      setBreadcrumb((prev) => prev.slice(0, index));
      setShowDetailPanel(false);
    },
    [],
  );

  // ── Node interactions ────────────────────────────────────────
  const handleSingleClick = useCallback((member: FamilyMember) => {
    setSelectedMember(member);
    setShowDetailPanel(true);
  }, []);

  const handleDoubleClick = useCallback(
    (member: FamilyMember) => {
      focusOnMember(member);
    },
    [focusOnMember],
  );

  // Admin: empty slot clicked → open AddByEmailDialog
  const handleEmptySlotClick = useCallback((role: RelationshipRole) => {
    setAddEmailRole(role);
    setAddEmailDialogOpen(true);
  }, []);

  // Admin: remove/unlink a member from a relationship slot
  const handleRemove = useCallback(
    async (role: RelationshipRole, memberId: string) => {
      if (!center) return;
      const updated: FamilyMember = { ...center };
      // Also update the reverse side of the relationship
      const removedMember = findMember(members, memberId);

      switch (role) {
        case "father":
          updated.fatherId = "";
          // Reverse: remove center from father's childrenIds
          if (removedMember) {
            updateMember.mutate({
              ...removedMember,
              childrenIds: removedMember.childrenIds.filter(
                (id) => id !== center.id,
              ),
            });
          }
          break;
        case "mother":
          updated.motherId = "";
          // Reverse: remove center from mother's childrenIds
          if (removedMember) {
            updateMember.mutate({
              ...removedMember,
              childrenIds: removedMember.childrenIds.filter(
                (id) => id !== center.id,
              ),
            });
          }
          break;
        case "spouse":
          updated.spouseIds = updated.spouseIds.filter((id) => id !== memberId);
          // Reverse: remove center from spouse's spouseIds
          if (removedMember) {
            updateMember.mutate({
              ...removedMember,
              spouseIds: removedMember.spouseIds.filter(
                (id) => id !== center.id,
              ),
            });
          }
          break;
        case "child":
          updated.childrenIds = updated.childrenIds.filter(
            (id) => id !== memberId,
          );
          // Reverse: remove center from child's fatherId/motherId
          if (removedMember) {
            updateMember.mutate({
              ...removedMember,
              fatherId:
                removedMember.fatherId === center.id
                  ? ""
                  : removedMember.fatherId,
              motherId:
                removedMember.motherId === center.id
                  ? ""
                  : removedMember.motherId,
            });
          }
          break;
        case "brother":
          updated.brotherIds = updated.brotherIds.filter(
            (id) => id !== memberId,
          );
          // Reverse: remove center from brother's brotherIds/sisterIds
          if (removedMember) {
            updateMember.mutate({
              ...removedMember,
              brotherIds: removedMember.brotherIds.filter(
                (id) => id !== center.id,
              ),
              sisterIds: removedMember.sisterIds.filter(
                (id) => id !== center.id,
              ),
            });
          }
          // Also remove from shared parents' childrenIds
          if (center.fatherId) {
            const sharedFather = members.find((m) => m.id === center.fatherId);
            if (sharedFather?.childrenIds.includes(memberId)) {
              updateMember.mutate({
                ...sharedFather!,
                childrenIds: sharedFather.childrenIds.filter(
                  (id) => id !== memberId,
                ),
              });
            }
          }
          if (center.motherId) {
            const sharedMother = members.find((m) => m.id === center.motherId);
            if (sharedMother?.childrenIds.includes(memberId)) {
              updateMember.mutate({
                ...sharedMother!,
                childrenIds: sharedMother.childrenIds.filter(
                  (id) => id !== memberId,
                ),
              });
            }
          }
          break;
        case "sister":
          updated.sisterIds = updated.sisterIds.filter((id) => id !== memberId);
          // Reverse: remove center from sister's sisterIds/brotherIds
          if (removedMember) {
            updateMember.mutate({
              ...removedMember,
              brotherIds: removedMember.brotherIds.filter(
                (id) => id !== center.id,
              ),
              sisterIds: removedMember.sisterIds.filter(
                (id) => id !== center.id,
              ),
            });
          }
          // Also remove from shared parents' childrenIds
          if (center.fatherId) {
            const sharedFather = members.find((m) => m.id === center.fatherId);
            if (sharedFather?.childrenIds.includes(memberId)) {
              updateMember.mutate({
                ...sharedFather!,
                childrenIds: sharedFather.childrenIds.filter(
                  (id) => id !== memberId,
                ),
              });
            }
          }
          if (center.motherId) {
            const sharedMother = members.find((m) => m.id === center.motherId);
            if (sharedMother?.childrenIds.includes(memberId)) {
              updateMember.mutate({
                ...sharedMother!,
                childrenIds: sharedMother.childrenIds.filter(
                  (id) => id !== memberId,
                ),
              });
            }
          }
          break;
        case "fatherInLaw":
          updated.fatherInLawId = "";
          // Reverse: if spouse exists, remove fatherId from spouse
          if (removedMember && firstSpouse) {
            updateMember.mutate({
              ...firstSpouse,
              fatherId:
                firstSpouse.fatherId === memberId ? "" : firstSpouse.fatherId,
            });
          }
          break;
        case "motherInLaw":
          updated.motherInLawId = "";
          // Reverse: if spouse exists, remove motherId from spouse
          if (removedMember && firstSpouse) {
            updateMember.mutate({
              ...firstSpouse,
              motherId:
                firstSpouse.motherId === memberId ? "" : firstSpouse.motherId,
            });
          }
          break;
      }

      try {
        await updateMember.mutateAsync(updated);
        refreshLocalTree();
      } catch (err) {
        console.error("Failed to remove member from relationship:", err);
        refreshLocalTree(); // Still refresh to show current state
      }
    },
    [center, members, firstSpouse, updateMember, refreshLocalTree],
  );

  const handleEdit = useCallback((member: FamilyMember) => {
    setEditingMember(member);
    setShowAddModal(true);
    setShowDetailPanel(false);
  }, []);

  // ── Zoom & Pan ───────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.4, Math.min(2, z + delta)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { x: pan.x, y: pan.y };
    },
    [pan],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // ── Loading State ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <main
        className="min-h-screen heritage-bg flex flex-col"
        data-ocid="family-tree.page"
      >
        <TreeToolbar
          t={t}
          zoom={zoom}
          memberCount={0}
          isAdmin={isAdmin}
          onZoomIn={() => setZoom((z) => Math.min(2, z + 0.2))}
          onZoomOut={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          onReset={resetView}
          onBackToRoot={backToRoot}
          onAddMember={() => setShowAddModal(true)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div
            className="text-center space-y-6"
            data-ocid="family-tree.loading_state"
          >
            <div className="flex items-center justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-full" />
              ))}
            </div>
            <Skeleton className="w-48 h-4 mx-auto" />
            <p className="font-ui text-sm text-muted-foreground">
              {t("loading")}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Empty / No patriarch ─────────────────────────────────────
  if (members.length === 0 || !center) {
    return (
      <main
        className="min-h-screen heritage-bg flex flex-col"
        data-ocid="family-tree.page"
      >
        <TreeToolbar
          t={t}
          zoom={zoom}
          memberCount={0}
          isAdmin={isAdmin}
          onZoomIn={() => setZoom((z) => Math.min(2, z + 0.2))}
          onZoomOut={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          onReset={resetView}
          onBackToRoot={backToRoot}
          onAddMember={() => setShowAddModal(true)}
        />
        <div
          className="flex-1 flex items-center justify-center"
          data-ocid="family-tree.empty_state"
        >
          <div className="text-center space-y-4 p-8">
            <div className="h-24 w-24 rounded-full bg-saffron/10 flex items-center justify-center mx-auto">
              <TreePine className="h-12 w-12 text-saffron/60" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {t("noMembersFound")}
            </h2>
            <p className="font-body text-muted-foreground text-base max-w-sm mx-auto">
              वंशावळ सुरू करण्यासाठी पहिला सदस्य जोडा.
            </p>
            {isAdmin && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-saffron hover:bg-saffron-deep text-white font-ui"
                data-ocid="family-tree.add_member.open_modal_button"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addMember")}
              </Button>
            )}
          </div>
        </div>

        <MemberFormModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          editMember={editingMember}
          allMembers={members}
        />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen heritage-bg flex flex-col overflow-hidden"
      data-ocid="family-tree.page"
    >
      {/* ── Toolbar ── */}
      <TreeToolbar
        t={t}
        zoom={zoom}
        memberCount={members.length}
        isAdmin={isAdmin}
        onZoomIn={() => setZoom((z) => Math.min(2, z + 0.2))}
        onZoomOut={() => setZoom((z) => Math.max(0.4, z - 0.2))}
        onReset={resetView}
        onBackToRoot={backToRoot}
        onAddMember={() => {
          setEditingMember(null);
          setShowAddModal(true);
        }}
      />

      {/* ── Breadcrumb ── */}
      {(breadcrumb.length > 0 || center) && (
        <nav className="border-b border-border bg-cream/80 backdrop-blur-sm px-4 py-2 flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={backToRoot}
            className="flex items-center gap-1 text-xs font-ui text-muted-foreground hover:text-saffron transition-colors shrink-0"
            data-ocid="family-tree.breadcrumb.link"
          >
            <Home className="h-3.5 w-3.5" />
            <span>{patriarch?.name ?? t("backToRoot")}</span>
          </button>
          {breadcrumb.map((b, i) => (
            <span key={b.id} className="flex items-center gap-1 shrink-0">
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <button
                type="button"
                onClick={() => navigateBreadcrumb(b, i)}
                className="text-xs font-ui text-muted-foreground hover:text-saffron transition-colors"
              >
                {b.name}
              </button>
            </span>
          ))}
          {center && center.id !== patriarchId && (
            <span className="flex items-center gap-1 shrink-0">
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-xs font-ui text-saffron font-semibold">
                {center.name}
              </span>
            </span>
          )}
        </nav>
      )}

      {/* ── Admin hint ── */}
      {isAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5">
          <p className="font-ui text-[11px] text-amber-700 text-center">
            <strong>Admin मोड:</strong> रिकाम्या वर्तुळावर क्लिक करा → ईमेलने सदस्य
            जोडा &nbsp;|&nbsp; × बटण → नाते काढा &nbsp;|&nbsp; दोनदा क्लिक → केंद्र
            बदला
          </p>
        </div>
      )}

      {/* ── User hint ── */}
      {!isAdmin && isLoggedIn && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-1.5">
          <p className="font-ui text-[11px] text-blue-600 text-center">
            एकदा क्लिक → सदस्याची माहिती पाहा &nbsp;|&nbsp; दोनदा क्लिक → त्या
            व्यक्तीला केंद्रात आणा
          </p>
        </div>
      )}

      {/* ── Tree Canvas ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative select-none cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ minHeight: "calc(100vh - 200px)" }}
      >
        {/* Background parchment texture */}
        <div className="absolute inset-0 tree-canvas-bg" />

        {/* Transformable tree content */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging.current ? "none" : "transform 0.1s ease-out",
          }}
        >
          <TreeLayout
            center={center}
            members={members}
            isAdmin={isAdmin}
            isLoggedIn={isLoggedIn}
            onSingleClick={handleSingleClick}
            onDoubleClick={handleDoubleClick}
            onEmptySlotClick={handleEmptySlotClick}
            onRemove={handleRemove}
          />
        </div>

        {/* Mobile hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none md:hidden">
          <span className="font-ui text-xs text-muted-foreground/60 bg-white/70 px-3 py-1 rounded-full backdrop-blur-sm">
            स्क्रोल करा किंवा ड्रॅग करा
          </span>
        </div>
      </div>

      {/* ── Mobile compact view ── */}
      <div className="md:hidden border-t border-border bg-card/90 backdrop-blur-sm px-4 py-3">
        <p className="font-ui text-xs text-muted-foreground text-center">
          केंद्रीय: <strong className="text-foreground">{center.name}</strong>
          &nbsp;·&nbsp;
          {t("children")}: {center.childrenIds.length}
          &nbsp;·&nbsp;
          {t("spouse")}: {center.spouseIds.length}
        </p>
      </div>

      {/* ── Detail Panel ── */}
      <MemberDetailPanel
        member={showDetailPanel ? selectedMember : null}
        isAdmin={isAdmin}
        onClose={() => setShowDetailPanel(false)}
        onFocusTree={(m) => {
          focusOnMember(m);
          setShowDetailPanel(false);
        }}
        onEdit={handleEdit}
        allMembers={members}
      />

      {/* ── Add/Edit Modal (full form for creating new members) ── */}
      <MemberFormModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingMember(null);
          refreshLocalTree();
        }}
        editMember={editingMember}
        allMembers={members}
      />

      {/* ── Add by Email Dialog (link existing member to tree slot) ── */}
      {center && (
        <AddByEmailDialog
          open={addEmailDialogOpen}
          onClose={() => {
            setAddEmailDialogOpen(false);
            refreshLocalTree();
          }}
          role={addEmailRole}
          centerMember={center}
          allMembers={members}
          spouseMember={firstSpouse}
        />
      )}
    </main>
  );
}

// ── Toolbar Component ─────────────────────────────────────────────
interface TreeToolbarProps {
  t: (key: TranslationKey) => string;
  zoom: number;
  memberCount: number;
  isAdmin: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onBackToRoot: () => void;
  onAddMember: () => void;
}

function TreeToolbar({
  t,
  zoom,
  memberCount,
  isAdmin: _isAdmin,
  onZoomIn,
  onZoomOut,
  onReset,
  onBackToRoot,
  onAddMember: _onAddMember,
}: TreeToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border bg-cream/95 backdrop-blur-sm shadow-xs"
    >
      <div className="container mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        {/* Title */}
        <div className="flex items-center gap-2 mr-auto">
          <div className="h-7 w-7 rounded-full bg-saffron/15 flex items-center justify-center">
            <TreePine className="h-4 w-4 text-saffron" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-foreground leading-none">
              {t("familyTreeTitle")}
            </h1>
            <p className="font-ui text-[10px] text-muted-foreground leading-none mt-0.5">
              {t("familyTreeSubtitle")}
            </p>
          </div>

          {memberCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-ui text-muted-foreground bg-secondary px-2 py-0.5 rounded-full ml-2">
              <Users className="h-3 w-3" />
              {memberCount}
            </span>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-white/70 border border-border rounded-lg p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={onZoomOut}
            title={t("zoomOut")}
            data-ocid="family-tree.zoom_out.button"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="font-mono text-xs text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={onZoomIn}
            title={t("zoomIn")}
            data-ocid="family-tree.zoom_in.button"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="font-ui text-xs h-8 gap-1.5 border-border hover:border-saffron hover:text-saffron"
          onClick={onReset}
          title={t("resetView")}
          data-ocid="family-tree.reset_view.button"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("resetView")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="font-ui text-xs h-8 gap-1.5 border-border hover:border-saffron hover:text-saffron"
          onClick={onBackToRoot}
          data-ocid="family-tree.back_to_root.button"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("backToRoot")}</span>
        </Button>

        {/* सदस्य जोडा button removed — admin can add members via empty circle slots in tree */}
      </div>
    </motion.div>
  );
}
