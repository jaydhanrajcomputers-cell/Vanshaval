import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { PendingMemberData } from "../utils/localStore";
import { localStore } from "../utils/localStore";

interface ChildEntry {
  id: string;
  name: string;
  gender: string;
}
interface NameEntry {
  id: string;
  name: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

function display(val: string | undefined): string {
  return val?.trim() ? val.trim() : "—";
}

function parseBrotherSisterNames(val: string): NameEntry[] {
  if (!val?.trim()) return [];
  return val
    .split(",")
    .map((n) => ({ id: crypto.randomUUID(), name: n.trim() }))
    .filter((n) => n.name);
}

function parseChildrenNames(val: string): ChildEntry[] {
  if (!val?.trim()) return [];
  // Try JSON array first (legacy format)
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) {
      return parsed
        .map((p: { name?: string; gender?: string }) => ({
          id: crypto.randomUUID(),
          name: p.name ?? "",
          gender: p.gender ?? "",
        }))
        .filter((c) => c.name);
    }
  } catch {
    /* not JSON */
  }
  // Parse "Name (M)" or "Name (F)" format
  return val
    .split(",")
    .map((entry) => {
      const trimmed = entry.trim();
      const match = trimmed.match(/^(.+?)\s*\((M|F|male|female|पुरुष|स्त्री)\)$/i);
      if (match) {
        const g = match[2].toLowerCase();
        const gender =
          g === "f" || g === "female" || g === "स्त्री" ? "female" : "male";
        return { id: crypto.randomUUID(), name: match[1].trim(), gender };
      }
      return { id: crypto.randomUUID(), name: trimmed, gender: "" };
    })
    .filter((c) => c.name);
}

function serializeChildren(children: ChildEntry[]): string {
  return children
    .filter((c) => c.name.trim())
    .map((c) => {
      const gLabel =
        c.gender === "male" || c.gender === "पुरुष"
          ? "M"
          : c.gender === "female" || c.gender === "स्त्री"
            ? "F"
            : "";
      return gLabel ? `${c.name} (${gLabel})` : c.name;
    })
    .join(", ");
}

export function ProfilePage() {
  const { currentUser } = useAuth();
  const email = currentUser?.email ?? "";

  const approved = localStore.getApprovedFamilyMembers();
  const approvedMember = approved.find((m) => m.email === email) ?? null;
  const pendingMember = localStore.getMemberData(email);
  // For focal person (Ganesh), create blank profile if missing in localStore
  const GANESH_EMAIL = "ganesh.abhangrao@vatavriksha.com";
  let ganeshFallback: PendingMemberData | null = null;
  if (
    email.toLowerCase() === GANESH_EMAIL &&
    !approvedMember &&
    !pendingMember
  ) {
    ganeshFallback = {
      id: "ganesh-focal-1",
      email: GANESH_EMAIL,
      firstName: "गणेश",
      lastName: "अभंगराव",
      name: "गणेश सावलाराम अभंगराव",
      gender: "पुरुष",
      maritalStatus: "",
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
      occupationType: "",
      occupation: "",
      additionalInfo: "",
      mobile: "",
      whatsapp: "",
      houseNumber: "",
      roadName: "",
      landmark: "",
      cityVillage: "पंढरपूर",
      pincode: "",
      district: "सोलापूर",
      address: "",
      nativeVillage: "",
      fatherFullName: "",
      motherFullName: "",
      fatherInLawName: "",
      motherInLawName: "",
      spouseName: "",
      brotherNames: "",
      sisterNames: "",
      childrenNames: "",
      passwordHash: "Ganeshdada@1982",
    };
    // Save to localStore so subsequent visits also work
    localStore.saveApprovedFamilyMember(ganeshFallback);
  }
  const initialMember: PendingMemberData | null =
    approvedMember ?? pendingMember ?? ganeshFallback;

  const initialPhoto =
    localStorage.getItem(`vatavriksha_photo_${email}`) ??
    initialMember?.photoData ??
    "";

  const [member, setMember] = useState<PendingMemberData | null>(initialMember);
  const [photo, setPhoto] = useState<string>(initialPhoto);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<PendingMemberData | null>(null);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic arrays for siblings and children in edit mode
  const [editBrothers, setEditBrothers] = useState<NameEntry[]>([]);
  const [editSisters, setEditSisters] = useState<NameEntry[]>([]);
  const [editChildren, setEditChildren] = useState<ChildEntry[]>([]);

  const isFemale = (editData ?? member)?.gender === "स्त्री";
  const isMarried = (editData ?? member)?.maritalStatus === "विवाहित";

  function handleEditStart() {
    setEditData(member ? { ...member } : null);
    setEditBrothers(parseBrotherSisterNames(member?.brotherNames ?? ""));
    setEditSisters(parseBrotherSisterNames(member?.sisterNames ?? ""));
    setEditChildren(parseChildrenNames(member?.childrenNames ?? ""));
    setIsEditing(true);
  }

  function handleCancel() {
    setEditData(null);
    setEditBrothers([]);
    setEditSisters([]);
    setEditChildren([]);
    setIsEditing(false);
    setPhotoError("");
  }

  function handleSave() {
    if (!editData) return;
    const brotherNamesStr = editBrothers
      .map((b) => b.name)
      .filter(Boolean)
      .join(", ");
    const sisterNamesStr = editSisters
      .map((s) => s.name)
      .filter(Boolean)
      .join(", ");
    const childrenNamesStr = serializeChildren(editChildren);
    const updatedData: PendingMemberData = {
      ...editData,
      brotherNames: brotherNamesStr,
      sisterNames: sisterNamesStr,
      childrenNames: childrenNamesStr,
    };
    localStore.saveApprovedFamilyMember(updatedData);
    localStore.saveMemberData(updatedData);
    // Sync profile changes to family tree node
    const treeMembers = localStore.getFamilyTreeMembers();
    const matchingTreeMember = treeMembers.find(
      (m) =>
        (m.email && m.email.toLowerCase() === email.toLowerCase()) ||
        m.id === (member?.id ?? ""),
    );
    if (matchingTreeMember) {
      localStore.saveFamilyTreeMember({
        ...matchingTreeMember,
        name: updatedData.name || matchingTreeMember.name,
        firstName: updatedData.firstName || matchingTreeMember.firstName,
        lastName: updatedData.lastName || matchingTreeMember.lastName,
        email: email,
        mobile: updatedData.mobile || matchingTreeMember.mobile,
        whatsapp: updatedData.whatsapp || matchingTreeMember.whatsapp,
        address: updatedData.address || matchingTreeMember.address,
        education: updatedData.education || matchingTreeMember.education,
        occupation: updatedData.occupation || matchingTreeMember.occupation,
        occupationType:
          updatedData.occupationType || matchingTreeMember.occupationType,
        bloodGroup: updatedData.bloodGroup || matchingTreeMember.bloodGroup,
        birthDate: updatedData.birthDate || matchingTreeMember.birthDate,
        deathDate: updatedData.deathDate || matchingTreeMember.deathDate,
        isDeceased: updatedData.isDeceased ?? matchingTreeMember.isDeceased,
        spouseName: updatedData.spouseName || matchingTreeMember.spouseName,
        brotherNames:
          updatedData.brotherNames || matchingTreeMember.brotherNames,
        sisterNames: updatedData.sisterNames || matchingTreeMember.sisterNames,
        childrenNames:
          updatedData.childrenNames || matchingTreeMember.childrenNames,
      });
    }
    setMember(updatedData);
    setEditData(null);
    setEditBrothers([]);
    setEditSisters([]);
    setEditChildren([]);
    setIsEditing(false);
    toast.success("माहिती अद्यतनित झाली / Profile updated successfully");
  }

  function handleFieldChange(field: keyof PendingMemberData, value: string) {
    setEditData((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    if (file.size > 1024 * 1024) {
      setPhotoError(
        "फोटो 1MB पेक्षा मोठा आहे. कृपया https://www.reduceimages.com/ येथून फोटो लहान करा / Photo exceeds 1MB. Please reduce at https://www.reduceimages.com/",
      );
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPhoto(base64);
      localStorage.setItem(`vatavriksha_photo_${email}`, base64);
      if (member) {
        const updated = { ...member, photoData: base64 };
        localStore.saveApprovedFamilyMember(updated);
        localStore.saveMemberData(updated);
        setMember(updated);
      }
      // Also sync photo to family tree node
      const treeMembers2 = localStore.getFamilyTreeMembers();
      const treeMatch = treeMembers2.find(
        (m) =>
          (m.email && m.email.toLowerCase() === email.toLowerCase()) ||
          m.id === (member?.id ?? ""),
      );
      if (treeMatch) {
        localStore.saveFamilyTreeMember({
          ...treeMatch,
          email: email,
          photoData: base64,
        });
      }
      toast.success("फोटो अद्यतनित झाला / Photo updated successfully");
    };
    reader.readAsDataURL(file);
  }

  // Brothers handlers
  function addBrother() {
    setEditBrothers((p) => [...p, { id: crypto.randomUUID(), name: "" }]);
  }
  function updateBrother(idx: number, val: string) {
    setEditBrothers((p) => {
      const updated = [...p];
      updated[idx] = { ...updated[idx], name: val };
      return updated;
    });
  }
  function removeBrother(idx: number) {
    setEditBrothers((p) => p.filter((_, i) => i !== idx));
  }

  // Sisters handlers
  function addSister() {
    setEditSisters((p) => [...p, { id: crypto.randomUUID(), name: "" }]);
  }
  function updateSister(idx: number, val: string) {
    setEditSisters((p) => {
      const updated = [...p];
      updated[idx] = { ...updated[idx], name: val };
      return updated;
    });
  }
  function removeSister(idx: number) {
    setEditSisters((p) => p.filter((_, i) => i !== idx));
  }

  // Children handlers
  function addChild() {
    setEditChildren((p) => [
      ...p,
      { id: crypto.randomUUID(), name: "", gender: "" },
    ]);
  }
  function updateChild(idx: number, field: "name" | "gender", val: string) {
    setEditChildren((p) => {
      const updated = [...p];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  }
  function removeChild(idx: number) {
    setEditChildren((p) => p.filter((_, i) => i !== idx));
  }

  const displayName = member
    ? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.name
    : (currentUser?.name ?? "");

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/40 to-cream py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            माझे प्रोफाइल
          </h1>
          <p className="text-muted-foreground text-sm font-ui mt-1">
            My Profile
          </p>
        </motion.div>

        {!member ? (
          <Card className="shadow-card border-border">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground font-ui">
                प्रोफाइल माहिती उपलब्ध नाही. कृपया नोंदणी पूर्ण करा.
              </p>
              <p className="text-muted-foreground font-ui text-sm mt-1">
                Profile data not found. Please complete registration.
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6"
          >
            {/* ── Left Panel: Photo ── */}
            <div className="flex flex-col items-center gap-4">
              <Card className="w-full shadow-card border-border overflow-hidden">
                <div className="bg-gradient-to-b from-saffron/10 to-amber-50/60 px-6 py-8 flex flex-col items-center gap-4">
                  {/* Profile Photo Circle */}
                  <div className="relative">
                    <div
                      className="w-40 h-40 rounded-full overflow-hidden border-4 shadow-lg"
                      style={{ borderColor: "oklch(var(--saffron))" }}
                    >
                      {photo ? (
                        <img
                          src={photo}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-saffron/20">
                          <span className="font-display text-4xl font-bold text-saffron">
                            {initials}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name & Email */}
                  <div className="text-center">
                    <h2 className="font-display text-xl font-bold text-foreground">
                      {displayName}
                    </h2>
                    <p className="text-sm text-muted-foreground font-ui mt-0.5">
                      {email}
                    </p>
                    {member.maritalStatus && (
                      <span className="inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full bg-saffron/15 text-saffron-deep font-ui">
                        {member.maritalStatus}
                      </span>
                    )}
                  </div>

                  {/* Change Photo Button */}
                  <div className="w-full">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full font-ui text-xs border-saffron text-saffron hover:bg-saffron hover:text-white transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      data-ocid="profile.photo_upload_button"
                    >
                      📷 फोटो बदला / Change Photo
                    </Button>
                    {photoError && (
                      <p className="text-xs text-destructive mt-2 text-center leading-relaxed">
                        {photoError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      फोटो 1MB पेक्षा कमी असावा
                    </p>
                  </div>
                </div>
              </Card>

              {/* Info card below photo */}
              <Card className="w-full shadow-card border-border">
                <CardContent className="py-4 px-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-ui text-muted-foreground">
                      रक्तगट:
                    </span>
                    <span className="text-sm font-semibold text-saffron-deep">
                      {display(member.bloodGroup)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-ui text-muted-foreground">
                      लिंग:
                    </span>
                    <span className="text-sm font-ui text-foreground">
                      {display(member.gender)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-ui text-muted-foreground">
                      जन्म:
                    </span>
                    <span className="text-sm font-ui text-foreground">
                      {formatDate(member.birthDate)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Right Panel: Info Tabs ── */}
            <div>
              <Card className="shadow-card border-border h-full">
                <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      सदस्य माहिती
                    </h3>
                    <p className="text-xs text-muted-foreground font-ui">
                      Member Information
                    </p>
                  </div>
                  {!isEditing ? (
                    <Button
                      size="sm"
                      className="font-ui text-xs bg-saffron hover:bg-saffron-deep text-white"
                      onClick={handleEditStart}
                      data-ocid="profile.edit_button"
                    >
                      ✏️ संपादन करा / Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-ui text-xs border-border hover:bg-muted"
                        onClick={handleCancel}
                        data-ocid="profile.cancel_button"
                      >
                        रद्द करा / Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="font-ui text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleSave}
                        data-ocid="profile.save_button"
                      >
                        💾 जतन करा / Save
                      </Button>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <Tabs defaultValue="personal">
                    <TabsList className="w-full grid grid-cols-4 mb-4 h-auto">
                      <TabsTrigger
                        value="personal"
                        className="text-xs font-ui py-2"
                        data-ocid="profile.personal_tab"
                      >
                        A. वैयक्तिक
                      </TabsTrigger>
                      <TabsTrigger
                        value="professional"
                        className="text-xs font-ui py-2"
                        data-ocid="profile.professional_tab"
                      >
                        B. व्यावसायिक
                      </TabsTrigger>
                      <TabsTrigger
                        value="contact"
                        className="text-xs font-ui py-2"
                        data-ocid="profile.contact_tab"
                      >
                        C. संपर्क
                      </TabsTrigger>
                      <TabsTrigger
                        value="relationship"
                        className="text-xs font-ui py-2"
                        data-ocid="profile.relationship_tab"
                      >
                        D. नातेसंबंध
                      </TabsTrigger>
                    </TabsList>

                    {/* ── A. Personal ── */}
                    <TabsContent value="personal" className="space-y-3 mt-0">
                      {isEditing && editData ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              पहिले नाव / First Name *
                            </Label>
                            <Input
                              value={editData.firstName}
                              onChange={(e) =>
                                handleFieldChange("firstName", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              आडनाव / Last Name *
                            </Label>
                            <Input
                              value={editData.lastName}
                              onChange={(e) =>
                                handleFieldChange("lastName", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              वैवाहिक स्थिती *
                            </Label>
                            <Select
                              value={editData.maritalStatus}
                              onValueChange={(v) =>
                                handleFieldChange("maritalStatus", v)
                              }
                            >
                              <SelectTrigger className="font-ui text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="विवाहित">
                                  विवाहित / Married
                                </SelectItem>
                                <SelectItem value="अविवाहित">
                                  अविवाहित / Unmarried
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">लिंग *</Label>
                            <Select
                              value={editData.gender}
                              onValueChange={(v) =>
                                handleFieldChange("gender", v)
                              }
                            >
                              <SelectTrigger className="font-ui text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="पुरुष">पुरुष / Male</SelectItem>
                                <SelectItem value="स्त्री">
                                  स्त्री / Female
                                </SelectItem>
                                <SelectItem value="इतर">इतर / Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">आईचे नाव *</Label>
                            <Input
                              value={editData.motherName}
                              onChange={(e) =>
                                handleFieldChange("motherName", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              वडिलांचे नाव *
                            </Label>
                            <Input
                              value={editData.fatherName}
                              onChange={(e) =>
                                handleFieldChange("fatherName", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              जन्म तारीख *
                            </Label>
                            <Input
                              type="date"
                              value={editData.birthDate}
                              onChange={(e) =>
                                handleFieldChange("birthDate", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">जन्म वेळ</Label>
                            <Input
                              type="time"
                              value={editData.birthTime}
                              onChange={(e) =>
                                handleFieldChange("birthTime", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          {editData?.maritalStatus === "विवाहित" && (
                            <div className="space-y-1">
                              <Label className="text-xs font-ui">
                                लग्नाची तारीख *
                              </Label>
                              <Input
                                type="date"
                                value={editData.marriageDate}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "marriageDate",
                                    e.target.value,
                                  )
                                }
                                className="font-ui text-sm"
                              />
                            </div>
                          )}
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              रक्तगट (ऐच्छिक)
                            </Label>
                            <Select
                              value={editData.bloodGroup}
                              onValueChange={(v) =>
                                handleFieldChange("bloodGroup", v)
                              }
                            >
                              <SelectTrigger className="font-ui text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  "माहित नाही",
                                  "A+",
                                  "B+",
                                  "O+",
                                  "AB+",
                                  "A-",
                                  "B-",
                                  "O-",
                                  "AB-",
                                ].map((g) => (
                                  <SelectItem key={g} value={g}>
                                    {g}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">मृत्यू तारीख</Label>
                            <Input
                              type="date"
                              value={editData.deathDate}
                              onChange={(e) =>
                                handleFieldChange("deathDate", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              कृपया गैरसमज करून घेऊ नका
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InfoRow label="संपूर्ण नाव" value={displayName} />
                          <InfoRow
                            label="लिंग / Gender"
                            value={display(member.gender)}
                          />
                          <InfoRow
                            label="वैवाहिक स्थिती"
                            value={display(member.maritalStatus)}
                          />
                          <InfoRow
                            label="आईचे नाव"
                            value={display(member.motherName)}
                          />
                          <InfoRow
                            label="वडिलांचे नाव"
                            value={display(member.fatherName)}
                          />
                          <InfoRow
                            label="जन्म तारीख"
                            value={formatDate(member.birthDate)}
                          />
                          <InfoRow
                            label="जन्म वेळ"
                            value={display(member.birthTime)}
                          />
                          {member.maritalStatus === "विवाहित" && (
                            <InfoRow
                              label="लग्नाची तारीख"
                              value={formatDate(member.marriageDate)}
                            />
                          )}
                          <InfoRow
                            label="रक्तगट"
                            value={display(member.bloodGroup)}
                          />
                          {member.deathDate && (
                            <InfoRow
                              label="मृत्यू तारीख"
                              value={formatDate(member.deathDate)}
                            />
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* ── B. Professional ── */}
                    <TabsContent
                      value="professional"
                      className="space-y-3 mt-0"
                    >
                      {isEditing && editData ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">शिक्षण *</Label>
                            <Input
                              value={editData.education}
                              onChange={(e) =>
                                handleFieldChange("education", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              व्यवसाय / नोकरीचे क्षेत्र *
                            </Label>
                            <Select
                              value={editData.occupationType}
                              onValueChange={(v) =>
                                handleFieldChange("occupationType", v)
                              }
                            >
                              <SelectTrigger className="font-ui text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  "शेती",
                                  "व्यवसाय",
                                  "नोकरी",
                                  "डॉक्टर",
                                  "वकील",
                                  "शिक्षक",
                                  "अभियंता",
                                  "इतर",
                                ].map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              व्यवसाय / संस्था माहिती *
                            </Label>
                            <Textarea
                              value={editData.occupation}
                              onChange={(e) =>
                                handleFieldChange("occupation", e.target.value)
                              }
                              className="font-ui text-sm"
                              rows={3}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <InfoRow
                            label="शिक्षण"
                            value={display(member.education)}
                          />
                          <InfoRow
                            label="व्यवसाय / क्षेत्र"
                            value={display(member.occupationType)}
                          />
                          <InfoRow
                            label="व्यवसाय / संस्था माहिती"
                            value={display(member.occupation)}
                          />
                        </div>
                      )}
                    </TabsContent>

                    {/* ── C. Contact ── */}
                    <TabsContent value="contact" className="space-y-3 mt-0">
                      {isEditing && editData ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {!isFemale && (
                            <div className="space-y-1">
                              <Label className="text-xs font-ui">
                                मोबाईल नंबर *
                              </Label>
                              <Input
                                value={editData.mobile}
                                onChange={(e) =>
                                  handleFieldChange("mobile", e.target.value)
                                }
                                className="font-ui text-sm"
                              />
                            </div>
                          )}
                          {isFemale && (
                            <div className="space-y-1">
                              <Label className="text-xs font-ui">
                                मोबाईल नंबर (ऐच्छिक)
                              </Label>
                              <Input
                                value={editData.mobile}
                                onChange={(e) =>
                                  handleFieldChange("mobile", e.target.value)
                                }
                                className="font-ui text-sm"
                              />
                            </div>
                          )}
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              व्हॉट्सॲप नंबर *
                            </Label>
                            <Input
                              value={editData.whatsapp}
                              onChange={(e) =>
                                handleFieldChange("whatsapp", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs font-ui">
                              ई-मेल (बदलता येणार नाही)
                            </Label>
                            <Input
                              value={email}
                              readOnly
                              className="font-ui text-sm bg-muted cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">घर नंबर *</Label>
                            <Input
                              value={editData.houseNumber}
                              onChange={(e) =>
                                handleFieldChange("houseNumber", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              रोडचे नाव *
                            </Label>
                            <Input
                              value={editData.roadName}
                              onChange={(e) =>
                                handleFieldChange("roadName", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              जवळची खूण *
                            </Label>
                            <Input
                              value={editData.landmark}
                              onChange={(e) =>
                                handleFieldChange("landmark", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">
                              शहर / गाव *
                            </Label>
                            <Input
                              value={editData.cityVillage}
                              onChange={(e) =>
                                handleFieldChange("cityVillage", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">पिनकोड *</Label>
                            <Input
                              value={editData.pincode}
                              onChange={(e) =>
                                handleFieldChange("pincode", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-ui">जिल्हा *</Label>
                            <Input
                              value={editData.district}
                              onChange={(e) =>
                                handleFieldChange("district", e.target.value)
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs font-ui">मूळ गाव</Label>
                            <Input
                              value={editData.nativeVillage}
                              onChange={(e) =>
                                handleFieldChange(
                                  "nativeVillage",
                                  e.target.value,
                                )
                              }
                              className="font-ui text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InfoRow
                            label="मोबाईल नंबर"
                            value={display(member.mobile)}
                          />
                          <InfoRow
                            label="व्हॉट्सॲप"
                            value={display(member.whatsapp)}
                          />
                          <InfoRow label="ई-मेल" value={email} />
                          <InfoRow
                            label="घर नंबर"
                            value={display(member.houseNumber)}
                          />
                          <InfoRow
                            label="रोडचे नाव"
                            value={display(member.roadName)}
                          />
                          <InfoRow
                            label="जवळची खूण"
                            value={display(member.landmark)}
                          />
                          <InfoRow
                            label="शहर / गाव"
                            value={display(member.cityVillage)}
                          />
                          <InfoRow
                            label="पिनकोड"
                            value={display(member.pincode)}
                          />
                          <InfoRow
                            label="जिल्हा"
                            value={display(member.district)}
                          />
                          <InfoRow
                            label="मूळ गाव"
                            value={display(member.nativeVillage)}
                          />
                        </div>
                      )}
                    </TabsContent>

                    {/* ── D. Relationship ── */}
                    <TabsContent
                      value="relationship"
                      className="space-y-3 mt-0"
                    >
                      {/* Important notice */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 font-ui leading-relaxed">
                        ⚠️ ही माहिती फक्त प्रदर्शनासाठी आहे. वंशावळ layout फक्त Admin
                        नियंत्रित करतो.
                        <br />
                        <span className="text-amber-700">
                          This info is for display only. Family tree layout is
                          managed by Admin only.
                        </span>
                      </div>

                      {isEditing && editData ? (
                        <div className="space-y-4">
                          {/* Married-only fields */}
                          {isMarried && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs font-ui">
                                  सासर्यांचे नाव व आडनाव *
                                </Label>
                                <Input
                                  value={editData.fatherInLawName}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "fatherInLawName",
                                      e.target.value,
                                    )
                                  }
                                  className="font-ui text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-ui">
                                  सासूचे नाव व आडनाव *
                                </Label>
                                <Input
                                  value={editData.motherInLawName}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "motherInLawName",
                                      e.target.value,
                                    )
                                  }
                                  className="font-ui text-sm"
                                />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <Label className="text-xs font-ui">
                                  {editData.gender === "स्त्री"
                                    ? "पतीचे"
                                    : "पत्नीचे"}{" "}
                                  नाव (जोडीदार)
                                </Label>
                                <Input
                                  value={editData.spouseName}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "spouseName",
                                      e.target.value,
                                    )
                                  }
                                  className="font-ui text-sm"
                                />
                              </div>
                            </div>
                          )}

                          {/* Brothers — + button style */}
                          <div className="space-y-2">
                            <Label className="font-ui text-sm font-medium text-foreground">
                              भावाचे नाव व आडनाव / Brother's Name(s)
                            </Label>
                            {editBrothers.map((brother, idx) => (
                              <div
                                key={brother.id}
                                className="flex items-center gap-2"
                                data-ocid={`profile.brothers.item.${idx + 1}`}
                              >
                                <Input
                                  value={brother.name}
                                  onChange={(e) =>
                                    updateBrother(idx, e.target.value)
                                  }
                                  placeholder={`भावाचे नाव ${idx + 1}`}
                                  className="font-ui text-sm flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeBrother(idx)}
                                  className="text-destructive hover:text-destructive/80 p-1"
                                  aria-label="Remove brother"
                                  data-ocid={`profile.brothers.delete_button.${idx + 1}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addBrother}
                              data-ocid="profile.brothers.add_button"
                              className="font-ui text-xs border-saffron/30 text-saffron hover:bg-saffron/5 w-full"
                            >
                              + भाऊ जोडा / Add Brother
                            </Button>
                          </div>

                          {/* Sisters — + button style */}
                          <div className="space-y-2">
                            <Label className="font-ui text-sm font-medium text-foreground">
                              बहिणीचे नाव व आडनाव / Sister's Name(s)
                            </Label>
                            {editSisters.map((sister, idx) => (
                              <div
                                key={sister.id}
                                className="flex items-center gap-2"
                                data-ocid={`profile.sisters.item.${idx + 1}`}
                              >
                                <Input
                                  value={sister.name}
                                  onChange={(e) =>
                                    updateSister(idx, e.target.value)
                                  }
                                  placeholder={`बहिणीचे नाव ${idx + 1}`}
                                  className="font-ui text-sm flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSister(idx)}
                                  className="text-destructive hover:text-destructive/80 p-1"
                                  aria-label="Remove sister"
                                  data-ocid={`profile.sisters.delete_button.${idx + 1}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addSister}
                              data-ocid="profile.sisters.add_button"
                              className="font-ui text-xs border-saffron/30 text-saffron hover:bg-saffron/5 w-full"
                            >
                              + बहीण जोडा / Add Sister
                            </Button>
                          </div>

                          {/* Children — visible for all users */}
                          {
                            <div className="space-y-2">
                              <Label className="font-ui text-sm font-medium text-foreground">
                                मुलांचे नावे / Children's Names
                              </Label>
                              {editChildren.map((child, idx) => (
                                <div
                                  key={child.id}
                                  className="flex items-center gap-2"
                                  data-ocid={`profile.children.item.${idx + 1}`}
                                >
                                  <Input
                                    value={child.name}
                                    onChange={(e) =>
                                      updateChild(idx, "name", e.target.value)
                                    }
                                    placeholder={`मुलाचे नाव ${idx + 1}`}
                                    className="font-ui text-sm flex-1"
                                  />
                                  <Select
                                    value={child.gender}
                                    onValueChange={(v) =>
                                      updateChild(idx, "gender", v)
                                    }
                                  >
                                    <SelectTrigger
                                      className="font-ui text-sm w-28 shrink-0"
                                      data-ocid="profile.children.gender_select"
                                    >
                                      <SelectValue placeholder="लिंग" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="male">
                                        पुरुष (M)
                                      </SelectItem>
                                      <SelectItem value="female">
                                        स्त्री (F)
                                      </SelectItem>
                                      <SelectItem value="other">इतर</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <button
                                    type="button"
                                    onClick={() => removeChild(idx)}
                                    className="text-destructive hover:text-destructive/80 p-1"
                                    aria-label="Remove child"
                                    data-ocid={`profile.children.delete_button.${idx + 1}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addChild}
                                data-ocid="profile.children.add_button"
                                className="font-ui text-xs border-saffron/30 text-saffron hover:bg-saffron/5 w-full"
                              >
                                + मूल जोडा / Add Child
                              </Button>
                            </div>
                          }
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {member.maritalStatus === "विवाहित" && (
                            <>
                              <InfoRow
                                label="सासर्यांचे नाव"
                                value={display(member.fatherInLawName)}
                              />
                              <InfoRow
                                label="सासूचे नाव"
                                value={display(member.motherInLawName)}
                              />
                              <InfoRow
                                label={
                                  member.gender === "स्त्री"
                                    ? "पतीचे नाव"
                                    : "पत्नीचे नाव"
                                }
                                value={display(member.spouseName)}
                              />
                            </>
                          )}
                          <InfoRow
                            label="भावाचे नाव"
                            value={display(member.brotherNames)}
                          />
                          <InfoRow
                            label="बहिणीचे नाव"
                            value={display(member.sisterNames)}
                          />
                          <InfoRow
                            label="मुलांचे नावे"
                            value={display(member.childrenNames)}
                          />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs font-ui text-muted-foreground">{label}</span>
      <span className="text-sm font-ui text-foreground font-medium">
        {value || "—"}
      </span>
    </div>
  );
}
