import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { FamilyMember } from "../../backend.d";
import { useLanguage } from "../../context/LanguageContext";
import {
  useAddFamilyMember,
  useUpdateFamilyMember,
} from "../../hooks/useQueries";

interface MemberFormModalProps {
  open: boolean;
  onClose: () => void;
  editMember?: FamilyMember | null;
  defaultRelation?: {
    type: "father" | "mother" | "spouse" | "child" | "brother" | "sister";
    ofMemberId: string;
  } | null;
  allMembers: FamilyMember[];
}

const EMPTY_MEMBER: Omit<FamilyMember, "id" | "createdBy" | "createdAt"> = {
  name: "",
  firstName: "",
  lastName: "",
  gender: "male",
  birthDate: "",
  birthTime: "",
  deathDate: "",
  isDeceased: false,
  bloodGroup: "",
  village: "",
  nativeVillage: "",
  occupation: "",
  occupationType: "",
  education: "",
  additionalInfo: "",
  address: "",
  houseNumber: "",
  roadName: "",
  landmark: "",
  cityVillage: "",
  pincode: "",
  district: "",
  mobile: "",
  whatsapp: "",
  maritalStatus: "",
  marriageDate: "",
  motherName: "",
  fatherName: "",
  husbandName: "",
  fatherFullName: "",
  motherFullName: "",
  fatherInLawName: "",
  motherInLawName: "",
  spouseName: "",
  brotherNames: "",
  sisterNames: "",
  childrenNames: "",
  photoData: "",
  fatherId: "",
  motherId: "",
  fatherInLawId: "",
  motherInLawId: "",
  spouseIds: [],
  childrenIds: [],
  brotherIds: [],
  sisterIds: [],
};

export function MemberFormModal({
  open,
  onClose,
  editMember,
  allMembers,
}: MemberFormModalProps) {
  const { t } = useLanguage();
  const addMember = useAddFamilyMember();
  const updateMember = useUpdateFamilyMember();

  const [form, setForm] = useState({ ...EMPTY_MEMBER });
  const [spouseIdsText, setSpouseIdsText] = useState("");
  const [childrenIdsText, setChildrenIdsText] = useState("");
  const [brotherIdsText, setBrotherIdsText] = useState("");
  const [sisterIdsText, setSisterIdsText] = useState("");

  const isEditing = !!editMember;
  const isPending = addMember.isPending || updateMember.isPending;

  // Populate form when editing
  // biome-ignore lint/correctness/useExhaustiveDependencies: open triggers form reset intentionally
  useEffect(() => {
    if (editMember) {
      setForm({
        name: editMember.name,
        firstName: editMember.firstName ?? "",
        lastName: editMember.lastName ?? "",
        gender: editMember.gender,
        birthDate: editMember.birthDate,
        birthTime: editMember.birthTime ?? "",
        deathDate: editMember.deathDate,
        isDeceased: editMember.isDeceased,
        bloodGroup: editMember.bloodGroup,
        village: editMember.village,
        nativeVillage: editMember.nativeVillage ?? "",
        occupation: editMember.occupation,
        occupationType: editMember.occupationType ?? "",
        education: editMember.education,
        additionalInfo: editMember.additionalInfo,
        address: editMember.address ?? "",
        houseNumber: editMember.houseNumber ?? "",
        roadName: editMember.roadName ?? "",
        landmark: editMember.landmark ?? "",
        cityVillage: editMember.cityVillage ?? "",
        pincode: editMember.pincode ?? "",
        district: editMember.district ?? "",
        mobile: editMember.mobile ?? "",
        whatsapp: editMember.whatsapp ?? "",
        maritalStatus: editMember.maritalStatus ?? "",
        marriageDate: editMember.marriageDate ?? "",
        motherName: editMember.motherName ?? "",
        fatherName: editMember.fatherName ?? "",
        husbandName: editMember.husbandName ?? "",
        fatherFullName: editMember.fatherFullName ?? "",
        motherFullName: editMember.motherFullName ?? "",
        fatherInLawName: editMember.fatherInLawName ?? "",
        motherInLawName: editMember.motherInLawName ?? "",
        spouseName: editMember.spouseName ?? "",
        brotherNames: editMember.brotherNames ?? "",
        sisterNames: editMember.sisterNames ?? "",
        childrenNames: editMember.childrenNames ?? "",
        photoData: editMember.photoData ?? "",
        fatherId: editMember.fatherId,
        motherId: editMember.motherId,
        fatherInLawId: editMember.fatherInLawId ?? "",
        motherInLawId: editMember.motherInLawId ?? "",
        spouseIds: editMember.spouseIds,
        childrenIds: editMember.childrenIds,
        brotherIds: editMember.brotherIds,
        sisterIds: editMember.sisterIds,
      });
      setSpouseIdsText(editMember.spouseIds.join(", "));
      setChildrenIdsText(editMember.childrenIds.join(", "));
      setBrotherIdsText(editMember.brotherIds.join(", "));
      setSisterIdsText(editMember.sisterIds.join(", "));
    } else {
      setForm({ ...EMPTY_MEMBER });
      setSpouseIdsText("");
      setChildrenIdsText("");
      setBrotherIdsText("");
      setSisterIdsText("");
    }
  }, [editMember, open]);

  const parseIds = (text: string): string[] =>
    text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const member: FamilyMember = {
      ...form,
      id: editMember?.id ?? crypto.randomUUID(),
      spouseIds: parseIds(spouseIdsText),
      childrenIds: parseIds(childrenIdsText),
      brotherIds: parseIds(brotherIdsText),
      sisterIds: parseIds(sisterIdsText),
      createdBy: editMember?.createdBy ?? "admin",
      createdAt: editMember?.createdAt ?? BigInt(Date.now()),
    };

    try {
      if (isEditing) {
        await updateMember.mutateAsync(member);
      } else {
        await addMember.mutateAsync(member);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save member:", err);
    }
  };

  const field = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // Helper: find member by id for display in selects
  const memberOptions = allMembers.map((m) => ({ value: m.id, label: m.name }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden"
        data-ocid="family-tree.add_member.dialog"
      >
        <DialogHeader className="px-6 py-4 border-b border-border bg-secondary/30">
          <DialogTitle className="font-display text-lg text-foreground">
            {isEditing ? t("editMember") : t("addMember")}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <form
            id="member-form"
            onSubmit={handleSubmit}
            className="px-6 py-4 space-y-5"
          >
            {/* Section A: Personal */}
            <FormSection label="A. वैयक्तिक माहिती">
              <FormRow label={t("fullNameLabel") || "पूर्ण नाव"} required>
                <Input
                  value={form.name}
                  onChange={(e) => field("name", e.target.value)}
                  placeholder="पूर्ण नाव"
                  required
                  className="font-body"
                  data-ocid="family-tree.add_member.input"
                />
              </FormRow>

              <FormRow label={t("gender")}>
                <Select
                  value={form.gender}
                  onValueChange={(v) => field("gender", v)}
                >
                  <SelectTrigger className="font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t("male")}</SelectItem>
                    <SelectItem value="female">{t("female")}</SelectItem>
                    <SelectItem value="other">{t("other")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>

              <FormRow label={t("birthDate")}>
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => field("birthDate", e.target.value)}
                  className="font-body"
                />
              </FormRow>

              <FormRow label={t("bloodGroup")}>
                <Select
                  value={form.bloodGroup || "_none"}
                  onValueChange={(v) =>
                    field("bloodGroup", v === "_none" ? "" : v)
                  }
                >
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="निवडा" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">—</SelectItem>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </FormRow>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-deceased"
                  checked={form.isDeceased}
                  onCheckedChange={(v) => field("isDeceased", !!v)}
                />
                <Label
                  htmlFor="is-deceased"
                  className="font-ui text-sm cursor-pointer"
                >
                  {t("deceased")} (निधन झाले)
                </Label>
              </div>

              {form.isDeceased && (
                <FormRow label={t("deathDate")}>
                  <Input
                    type="date"
                    value={form.deathDate}
                    onChange={(e) => field("deathDate", e.target.value)}
                    className="font-body"
                  />
                </FormRow>
              )}
            </FormSection>

            <Separator />

            {/* Section B: Professional */}
            <FormSection label="B. व्यावसायिक माहिती">
              <FormRow label={t("village")}>
                <Input
                  value={form.village}
                  onChange={(e) => field("village", e.target.value)}
                  placeholder="मूळ गाव"
                  className="font-body"
                />
              </FormRow>
              <FormRow label={t("occupation")}>
                <Input
                  value={form.occupation}
                  onChange={(e) => field("occupation", e.target.value)}
                  placeholder="व्यवसाय / नोकरी"
                  className="font-body"
                />
              </FormRow>
              <FormRow label={t("education")}>
                <Input
                  value={form.education}
                  onChange={(e) => field("education", e.target.value)}
                  placeholder="शिक्षण"
                  className="font-body"
                />
              </FormRow>
              <FormRow label="अतिरिक्त माहिती">
                <Textarea
                  value={form.additionalInfo}
                  onChange={(e) => field("additionalInfo", e.target.value)}
                  placeholder="अतिरिक्त माहिती..."
                  rows={2}
                  className="font-body resize-none"
                />
              </FormRow>
            </FormSection>

            <Separator />

            {/* Section C: Relationships */}
            <FormSection label="C. नातेसंबंध">
              <p className="text-xs text-muted-foreground font-ui">
                IDs कॉमाने विभक्त करा (comma-separated)
              </p>

              <FormRow label={`${t("father")} ID`}>
                <Select
                  value={form.fatherId || "_none"}
                  onValueChange={(v) =>
                    field("fatherId", v === "_none" ? "" : v)
                  }
                >
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="वडील निवडा" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">—</SelectItem>
                    {memberOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>

              <FormRow label={`${t("mother")} ID`}>
                <Select
                  value={form.motherId || "_none"}
                  onValueChange={(v) =>
                    field("motherId", v === "_none" ? "" : v)
                  }
                >
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="आई निवडा" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">—</SelectItem>
                    {memberOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>

              <FormRow label={`${t("spouse")} IDs`}>
                <Input
                  value={spouseIdsText}
                  onChange={(e) => setSpouseIdsText(e.target.value)}
                  placeholder="id1, id2, ..."
                  className="font-body font-mono text-xs"
                />
              </FormRow>

              <FormRow label={`${t("children")} IDs`}>
                <Input
                  value={childrenIdsText}
                  onChange={(e) => setChildrenIdsText(e.target.value)}
                  placeholder="id1, id2, ..."
                  className="font-body font-mono text-xs"
                />
              </FormRow>

              <FormRow label={`${t("brothers")} IDs`}>
                <Input
                  value={brotherIdsText}
                  onChange={(e) => setBrotherIdsText(e.target.value)}
                  placeholder="id1, id2, ..."
                  className="font-body font-mono text-xs"
                />
              </FormRow>

              <FormRow label={`${t("sisters")} IDs`}>
                <Input
                  value={sisterIdsText}
                  onChange={(e) => setSisterIdsText(e.target.value)}
                  placeholder="id1, id2, ..."
                  className="font-body font-mono text-xs"
                />
              </FormRow>
            </FormSection>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="font-ui"
            data-ocid="family-tree.add_member.cancel_button"
          >
            रद्द करा
          </Button>
          <Button
            type="submit"
            form="member-form"
            disabled={isPending || !form.name.trim()}
            className="bg-saffron hover:bg-saffron-deep text-white font-ui"
            data-ocid="family-tree.add_member.submit_button"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "जतन होत आहे..." : isEditing ? "अपडेट करा" : "जोडा"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="font-ui text-xs font-semibold text-saffron uppercase tracking-wide">
        {label}
      </p>
      {children}
    </div>
  );
}

function FormRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
      <Label className="font-ui text-xs text-muted-foreground text-right pr-1 leading-snug">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
