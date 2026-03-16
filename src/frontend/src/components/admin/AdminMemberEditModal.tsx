import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../../backend.d";
import { localStore } from "../../utils/localStore";
import type { PendingMemberData } from "../../utils/localStore";

interface Props {
  user: UserProfile | null;
  onClose: () => void;
}

const BLOOD_GROUPS = [
  "माहित नाही",
  "A+",
  "B+",
  "O+",
  "AB+",
  "A-",
  "B-",
  "O-",
  "AB-",
];
const OCCUPATION_TYPES = ["व्यवसाय", "नोकरी", "शेती", "इतर"];

export default function AdminMemberEditModal({ user, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [memberData, setMemberData] = useState<PendingMemberData | null>(null);
  const [form, setForm] = useState<Partial<PendingMemberData>>({});
  const [brotherList, setBrotherList] = useState<string[]>([]);
  const [sisterList, setSisterList] = useState<string[]>([]);
  const [childrenList, setChildrenList] = useState<
    Array<{ name: string; gender: string }>
  >([]);

  useEffect(() => {
    if (!user) return;
    // Check pending data first, then approved members, then basic registration data
    let data = localStore.getMemberData(user.email);
    if (!data) {
      const approvedMembers = localStore.getApprovedFamilyMembers();
      data = approvedMembers.find((m) => m.email === user.email) || null;
    }
    // Fallback: build basic data from registration list (for old users)
    if (!data) {
      const regs = localStore.getAllRegistrations();
      const reg = regs.find((r) => r.email === user.email);
      if (reg) {
        data = {
          id: reg.id,
          email: reg.email,
          name: reg.name,
          firstName: reg.name,
          lastName: "",
          gender: reg.gender || "",
          maritalStatus: reg.maritalStatus || "",
          birthDate: reg.birthDate || "",
          birthTime: "",
          bloodGroup: reg.bloodGroup || "",
          marriageDate: "",
          deathDate: "",
          isDeceased: false,
          photoData: "",
          fatherName: "",
          motherName: "",
          husbandName: "",
          education: reg.education || "",
          occupationType: reg.occupationType || "",
          occupation: reg.occupation || "",
          additionalInfo: "",
          mobile: reg.mobile || "",
          whatsapp: reg.whatsapp || "",
          houseNumber: "",
          roadName: "",
          landmark: "",
          cityVillage: "",
          pincode: "",
          district: "",
          address: reg.address || "",
          nativeVillage: reg.nativeVillage || "",
          fatherFullName: "",
          motherFullName: "",
          fatherInLawName: "",
          motherInLawName: "",
          spouseName: "",
          brotherNames: "",
          sisterNames: "",
          childrenNames: "",
          passwordHash: "",
          registeredAt: reg.registeredAt,
          status: reg.status,
        } as PendingMemberData;
      }
    }
    if (data) {
      setMemberData(data);
      setForm({ ...data });
      // Parse list fields
      try {
        setBrotherList(data.brotherNames ? JSON.parse(data.brotherNames) : []);
      } catch {
        setBrotherList(
          data.brotherNames
            ? data.brotherNames.split(",").map((s) => s.trim())
            : [],
        );
      }
      try {
        setSisterList(data.sisterNames ? JSON.parse(data.sisterNames) : []);
      } catch {
        setSisterList(
          data.sisterNames
            ? data.sisterNames.split(",").map((s) => s.trim())
            : [],
        );
      }
      try {
        const parsed = data.childrenNames ? JSON.parse(data.childrenNames) : [];
        if (
          Array.isArray(parsed) &&
          parsed.length &&
          typeof parsed[0] === "object"
        )
          setChildrenList(parsed);
        else
          setChildrenList(parsed.map((n: string) => ({ name: n, gender: "" })));
      } catch {
        setChildrenList(
          data.childrenNames
            ? data.childrenNames
                .split(",")
                .map((s) => ({ name: s.trim(), gender: "" }))
            : [],
        );
      }
    } else {
      // No registration data — show basic info from UserProfile
      setMemberData(null);
      setForm({ firstName: user.name, email: user.email });
    }
  }, [user]);

  if (!user) return null;

  const f = (field: keyof PendingMemberData) => (form[field] as string) || "";
  const set = (field: keyof PendingMemberData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!user) return;
    const brotherNamesStr = JSON.stringify(brotherList.filter(Boolean));
    const sisterNamesStr = JSON.stringify(sisterList.filter(Boolean));
    const childrenNamesStr = JSON.stringify(childrenList.filter((c) => c.name));
    const updated: PendingMemberData = {
      ...(memberData || ({} as PendingMemberData)),
      ...form,
      brotherNames: brotherNamesStr,
      sisterNames: sisterNamesStr,
      childrenNames: childrenNamesStr,
      id: user.id,
      email: user.email,
      name:
        `${form.firstName || ""} ${form.lastName || ""}`.trim() || user.name,
    };
    localStore.saveMemberData(updated);
    // Also update approved family member if they exist there
    const approvedMembers = localStore.getApprovedFamilyMembers();
    if (approvedMembers.find((m) => m.email === user.email)) {
      localStore.saveApprovedFamilyMember(updated);
    }
    // Also update name in registrations list
    const regs = localStore.getAllRegistrations();
    const regIdx = regs.findIndex((r) => r.email === user.email);
    if (regIdx >= 0) {
      regs[regIdx].name = updated.name;
      localStorage.setItem(
        "vatavriksha_pending_registrations",
        JSON.stringify(regs),
      );
    }
    // Update family tree member name and photo
    const treeMembers = localStore.getFamilyTreeMembers();
    const treeIdx = treeMembers.findIndex(
      (m) => m.email === user.email || m.id === user.id,
    );
    if (treeIdx >= 0) {
      treeMembers[treeIdx].name = updated.name;
      if (updated.photoData) treeMembers[treeIdx].photoData = updated.photoData;
      localStorage.setItem(
        "vatavriksha_family_tree_members",
        JSON.stringify(treeMembers),
      );
    }
    toast.success("माहिती जतन केली / Information saved");
    setEditing(false);
    setMemberData(updated);
  };

  const isMarried = f("maritalStatus") === "विवाहित";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="presentation"
      data-ocid="admin.member_detail.modal"
    >
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-saffron/20 flex items-center justify-center text-saffron font-bold text-lg">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                {user.name}
              </h2>
              <p className="text-xs text-muted-foreground font-ui">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
                data-ocid="admin.member_detail.edit_button"
                className="font-ui text-xs gap-1 border-saffron/40 text-saffron hover:bg-saffron/10"
              >
                <Edit2 className="h-3.5 w-3.5" />
                संपादन / Edit
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  data-ocid="admin.member_detail.save_button"
                  className="font-ui text-xs gap-1 border-green-500/40 text-green-700 hover:bg-green-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  जतन करा / Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  data-ocid="admin.member_detail.cancel_button"
                  className="font-ui text-xs"
                >
                  रद्द करा
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              data-ocid="admin.member_detail.close_button"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {/* A. वैयक्तिक माहिती */}
          <Section title="A. वैयक्तिक माहिती (Personal Information)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="पहिले नाव"
                value={f("firstName")}
                editing={editing}
                onChange={(v) => set("firstName", v)}
              />
              <Field
                label="आडनाव"
                value={f("lastName")}
                editing={editing}
                onChange={(v) => set("lastName", v)}
              />
              <SelectField
                label="लिंग / Gender"
                value={f("gender")}
                options={["पुरुष", "स्त्री", "इतर"]}
                editing={editing}
                onChange={(v) => set("gender", v)}
              />
              <SelectField
                label="वैवाहिक स्थिती / Marital Status"
                value={f("maritalStatus")}
                options={["विवाहित", "अविवाहित"]}
                editing={editing}
                onChange={(v) => set("maritalStatus", v)}
              />
              <Field
                label="आईचे नाव"
                value={f("motherName")}
                editing={editing}
                onChange={(v) => set("motherName", v)}
              />
              <Field
                label="वडिलांचे नाव"
                value={f("fatherName")}
                editing={editing}
                onChange={(v) => set("fatherName", v)}
              />
              <Field
                label="जन्म तारीख"
                value={f("birthDate")}
                type="date"
                editing={editing}
                onChange={(v) => set("birthDate", v)}
              />
              <Field
                label="जन्म वेळ"
                value={f("birthTime")}
                editing={editing}
                onChange={(v) => set("birthTime", v)}
              />
              {isMarried && (
                <Field
                  label="लग्नाची तारीख"
                  value={f("marriageDate")}
                  type="date"
                  editing={editing}
                  onChange={(v) => set("marriageDate", v)}
                />
              )}
              <SelectField
                label="रक्तगट / Blood Group"
                value={f("bloodGroup") || "माहित नाही"}
                options={BLOOD_GROUPS}
                editing={editing}
                onChange={(v) => set("bloodGroup", v)}
              />
              <Field
                label="मृत्यू तारीख"
                value={f("deathDate")}
                type="date"
                editing={editing}
                onChange={(v) => set("deathDate", v)}
              />
            </div>
          </Section>

          {/* B. व्यावसायिक माहिती */}
          <Section title="B. व्यावसायिक माहिती (Professional Information)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="शिक्षण / Education"
                value={f("education")}
                editing={editing}
                onChange={(v) => set("education", v)}
              />
              <SelectField
                label="व्यवसाय / नोकरीचे क्षेत्र"
                value={f("occupationType")}
                options={OCCUPATION_TYPES}
                editing={editing}
                onChange={(v) => set("occupationType", v)}
              />
              <Field
                label="व्यवसाय / नोकरीचे नाव"
                value={f("occupation")}
                editing={editing}
                onChange={(v) => set("occupation", v)}
              />
            </div>
            <div className="mt-4">
              <TextareaField
                label="अधिक माहिती (व्यवसाय / संस्था)"
                value={f("additionalInfo")}
                editing={editing}
                onChange={(v) => set("additionalInfo", v)}
              />
            </div>
          </Section>

          {/* C. संपर्क आणि पत्ता */}
          <Section title="C. संपर्क आणि पत्ता (Contact & Address)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="मोबाईल नंबर"
                value={f("mobile")}
                editing={editing}
                onChange={(v) => set("mobile", v)}
              />
              <Field
                label="व्हॉट्सॲप नंबर"
                value={f("whatsapp")}
                editing={editing}
                onChange={(v) => set("whatsapp", v)}
              />
              <Field
                label="ई-मेल आयडी"
                value={f("email")}
                editing={false}
                onChange={() => {}}
              />
              <Field
                label="घर नंबर"
                value={f("houseNumber")}
                editing={editing}
                onChange={(v) => set("houseNumber", v)}
              />
              <Field
                label="रोडचे नाव"
                value={f("roadName")}
                editing={editing}
                onChange={(v) => set("roadName", v)}
              />
              <Field
                label="जवळची खूण"
                value={f("landmark")}
                editing={editing}
                onChange={(v) => set("landmark", v)}
              />
              <Field
                label="शहर / गाव"
                value={f("cityVillage")}
                editing={editing}
                onChange={(v) => set("cityVillage", v)}
              />
              <Field
                label="पिनकोड"
                value={f("pincode")}
                editing={editing}
                onChange={(v) => set("pincode", v)}
              />
              <Field
                label="जिल्हा"
                value={f("district")}
                editing={editing}
                onChange={(v) => set("district", v)}
              />
              <Field
                label="मूळ गाव"
                value={f("nativeVillage")}
                editing={editing}
                onChange={(v) => set("nativeVillage", v)}
              />
            </div>
          </Section>

          {/* D. नातेसंबंध */}
          <Section title="D. नातेसंबंधाची माहिती (Relationship Details)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isMarried && (
                <>
                  <Field
                    label="सासर्यांचे नाव"
                    value={f("fatherInLawName")}
                    editing={editing}
                    onChange={(v) => set("fatherInLawName", v)}
                  />
                  <Field
                    label="सासूचे नाव"
                    value={f("motherInLawName")}
                    editing={editing}
                    onChange={(v) => set("motherInLawName", v)}
                  />
                  <Field
                    label={f("gender") === "स्त्री" ? "पतीचे नाव" : "पत्नीचे नाव"}
                    value={f("spouseName")}
                    editing={editing}
                    onChange={(v) => set("spouseName", v)}
                  />
                </>
              )}
            </div>

            {/* Brothers */}
            <div className="mt-4">
              <Label className="font-ui text-sm font-medium text-foreground mb-2 block">
                भावाचे नाव
              </Label>
              {brotherList.map((b, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: list items have no stable id
                <div key={i} className="flex gap-2 mb-2">
                  {editing ? (
                    <>
                      <Input
                        value={b}
                        onChange={(e) => {
                          const l = [...brotherList];
                          l[i] = e.target.value;
                          setBrotherList(l);
                        }}
                        className="font-ui text-sm h-9 flex-1"
                        placeholder={`भाऊ ${i + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setBrotherList(brotherList.filter((_, j) => j !== i))
                        }
                        className="h-9 w-9 p-0 text-destructive"
                      >
                        ×
                      </Button>
                    </>
                  ) : (
                    <p className="font-ui text-sm text-foreground bg-secondary/30 rounded px-3 py-2 flex-1">
                      {b || "—"}
                    </p>
                  )}
                </div>
              ))}
              {editing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBrotherList([...brotherList, ""])}
                  className="font-ui text-xs mt-1"
                >
                  + भाऊ जोडा
                </Button>
              )}
            </div>

            {/* Sisters */}
            <div className="mt-4">
              <Label className="font-ui text-sm font-medium text-foreground mb-2 block">
                बहिणीचे नाव
              </Label>
              {sisterList.map((s, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: list items have no stable id
                <div key={i} className="flex gap-2 mb-2">
                  {editing ? (
                    <>
                      <Input
                        value={s}
                        onChange={(e) => {
                          const l = [...sisterList];
                          l[i] = e.target.value;
                          setSisterList(l);
                        }}
                        className="font-ui text-sm h-9 flex-1"
                        placeholder={`बहीण ${i + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setSisterList(sisterList.filter((_, j) => j !== i))
                        }
                        className="h-9 w-9 p-0 text-destructive"
                      >
                        ×
                      </Button>
                    </>
                  ) : (
                    <p className="font-ui text-sm text-foreground bg-secondary/30 rounded px-3 py-2 flex-1">
                      {s || "—"}
                    </p>
                  )}
                </div>
              ))}
              {editing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSisterList([...sisterList, ""])}
                  className="font-ui text-xs mt-1"
                >
                  + बहीण जोडा
                </Button>
              )}
            </div>

            {/* Children */}
            {isMarried && (
              <div className="mt-4">
                <Label className="font-ui text-sm font-medium text-foreground mb-2 block">
                  मुलांची नावे
                </Label>
                {childrenList.map((c, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: list items have no stable id
                  <div key={i} className="flex gap-2 mb-2">
                    {editing ? (
                      <>
                        <Input
                          value={c.name}
                          onChange={(e) => {
                            const l = [...childrenList];
                            l[i] = { ...l[i], name: e.target.value };
                            setChildrenList(l);
                          }}
                          className="font-ui text-sm h-9 flex-1"
                          placeholder={`मूल ${i + 1} - नाव`}
                        />
                        <select
                          value={c.gender}
                          onChange={(e) => {
                            const l = [...childrenList];
                            l[i] = { ...l[i], gender: e.target.value };
                            setChildrenList(l);
                          }}
                          className="font-ui text-sm h-9 border border-border rounded px-2 bg-background"
                        >
                          <option value="">लिंग</option>
                          <option value="पुरुष">पुरुष</option>
                          <option value="स्त्री">स्त्री</option>
                          <option value="इतर">इतर</option>
                        </select>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setChildrenList(
                              childrenList.filter((_, j) => j !== i),
                            )
                          }
                          className="h-9 w-9 p-0 text-destructive"
                        >
                          ×
                        </Button>
                      </>
                    ) : (
                      <p className="font-ui text-sm text-foreground bg-secondary/30 rounded px-3 py-2 flex-1">
                        {c.name} {c.gender ? `(${c.gender})` : ""}
                      </p>
                    )}
                  </div>
                ))}
                {editing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setChildrenList([
                        ...childrenList,
                        { name: "", gender: "" },
                      ])
                    }
                    className="font-ui text-xs mt-1"
                  >
                    + मूल जोडा
                  </Button>
                )}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

// ── Helper sub-components ─────────────────────────────────────────────────────

function Section({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-sm font-bold text-saffron border-b border-saffron/20 pb-1 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  editing,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label className="font-ui text-xs text-muted-foreground mb-1 block">
        {label}
      </Label>
      {editing ? (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-ui text-sm h-9"
        />
      ) : (
        <p className="font-ui text-sm text-foreground bg-secondary/30 rounded px-3 py-2 min-h-[36px]">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="font-ui text-xs text-muted-foreground mb-1 block">
        {label}
      </Label>
      {editing ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="font-ui text-sm h-9">
            <SelectValue placeholder="निवडा" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o} value={o} className="font-ui text-sm">
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="font-ui text-sm text-foreground bg-secondary/30 rounded px-3 py-2 min-h-[36px]">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function TextareaField({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="font-ui text-xs text-muted-foreground mb-1 block">
        {label}
      </Label>
      {editing ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-ui text-sm min-h-[80px]"
        />
      ) : (
        <p className="font-ui text-sm text-foreground bg-secondary/30 rounded px-3 py-2 min-h-[80px] whitespace-pre-wrap">
          {value || "—"}
        </p>
      )}
    </div>
  );
}
