import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Edit, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { FamilyMember } from "../../backend.d";
import { useLanguage } from "../../context/LanguageContext";

interface MemberDetailPanelProps {
  member: FamilyMember | null;
  isAdmin: boolean;
  onClose: () => void;
  onFocusTree: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  allMembers: FamilyMember[];
}

export function MemberDetailPanel({
  member,
  isAdmin,
  onClose,
  onFocusTree,
  onEdit,
}: MemberDetailPanelProps) {
  const { t, language } = useLanguage();
  const isMr = language === "mr";

  const genderLabel = (g: string) => {
    if (g === "male") return isMr ? "पुरुष" : "Male";
    if (g === "female") return isMr ? "स्त्री" : "Female";
    return isMr ? "इतर" : "Other";
  };

  const maritalLabel = (m: string) => {
    if (m === "married") return isMr ? "विवाहित" : "Married";
    if (m === "unmarried") return isMr ? "अविवाहित" : "Unmarried";
    if (m === "widowed") return isMr ? "विधुर/विधवा" : "Widowed";
    if (m === "divorced") return isMr ? "घटस्फोटित" : "Divorced";
    return m;
  };

  const fullAddress = member
    ? [
        member.houseNumber,
        member.roadName,
        member.landmark,
        member.cityVillage,
        member.pincode,
        member.district,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <AnimatePresence>
      {member && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l border-border shadow-heritage-lg z-50 flex flex-col"
            data-ocid="family-tree.member_detail.panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Photo */}
                {member.photoData ? (
                  <img
                    src={member.photoData}
                    alt={member.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-saffron/30 shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-saffron/20 flex items-center justify-center shrink-0">
                    <span className="text-saffron font-bold text-lg">
                      {(member.firstName ||
                        member.name ||
                        "?")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold text-foreground leading-snug truncate">
                    {member.firstName && member.lastName
                      ? `${member.firstName} ${member.lastName}`
                      : member.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {member.isDeceased && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-gray-200 text-gray-600"
                      >
                        {t("deceased")}
                      </Badge>
                    )}
                    {member.maritalStatus && (
                      <span className="text-xs text-muted-foreground font-ui">
                        {maritalLabel(member.maritalStatus)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                onClick={onClose}
                data-ocid="family-tree.member_detail.close_button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* ── A. वैयक्तिक माहिती ── */}
                <SectionHeader
                  mr="A. वैयक्तिक माहिती"
                  en="A. Personal Information"
                  isMr={isMr}
                />
                <div className="space-y-2">
                  {/* १. संपूर्ण नाव */}
                  <DetailRow
                    label={isMr ? "संपूर्ण नाव" : "Full Name"}
                    value={
                      member.firstName && member.lastName
                        ? `${member.firstName} ${member.lastName}`
                        : member.name || ""
                    }
                    isMr={isMr}
                  />
                  {/* २. लिंग */}
                  <DetailRow
                    label={isMr ? "लिंग" : "Gender"}
                    value={member.gender ? genderLabel(member.gender) : ""}
                    isMr={isMr}
                  />
                  {/* ३. वैवाहिक स्थिती */}
                  <DetailRow
                    label={isMr ? "वैवाहिक स्थिती" : "Marital Status"}
                    value={
                      member.maritalStatus
                        ? maritalLabel(member.maritalStatus)
                        : ""
                    }
                    isMr={isMr}
                  />
                  {/* ४. वडिलांचे नाव */}
                  <DetailRow
                    label={isMr ? "वडिलांचे नाव" : "Father's Name"}
                    value={member.fatherName || member.fatherFullName || ""}
                    isMr={isMr}
                  />
                  {/* ५. आईचे नाव */}
                  <DetailRow
                    label={isMr ? "आईचे नाव" : "Mother's Name"}
                    value={member.motherName || member.motherFullName || ""}
                    isMr={isMr}
                  />
                  {/* ६. जन्म तारीख */}
                  <DetailRow
                    label={isMr ? "जन्म तारीख" : "Birth Date"}
                    value={member.birthDate || ""}
                    isMr={isMr}
                  />
                  {/* ७. जन्म वेळ */}
                  <DetailRow
                    label={isMr ? "जन्म वेळ" : "Birth Time"}
                    value={member.birthTime || ""}
                    isMr={isMr}
                  />
                  {/* ८. लग्नाची तारीख (फक्त विवाहित असल्यास) */}
                  {(member.maritalStatus === "married" ||
                    member.marriageDate) && (
                    <DetailRow
                      label={isMr ? "लग्नाची तारीख" : "Marriage Date"}
                      value={member.marriageDate || ""}
                      isMr={isMr}
                    />
                  )}
                  {/* ९. रक्तगट */}
                  <DetailRow
                    label={isMr ? "रक्तगट" : "Blood Group"}
                    value={member.bloodGroup || ""}
                    isMr={isMr}
                  />
                </div>

                <Separator />

                {/* ── B. व्यावसायिक माहिती ── */}
                <SectionHeader
                  mr="B. व्यावसायिक माहिती"
                  en="B. Professional Information"
                  isMr={isMr}
                />
                <div className="space-y-2">
                  {/* १. शिक्षण */}
                  <DetailRow
                    label={isMr ? "शिक्षण" : "Education"}
                    value={member.education || ""}
                    isMr={isMr}
                  />
                  {/* २. व्यवसाय/नोकरीचे क्षेत्र */}
                  <DetailRow
                    label={isMr ? "व्यवसाय / नोकरीचे क्षेत्र" : "Occupation / Field"}
                    value={member.occupationType || member.occupation || ""}
                    isMr={isMr}
                  />
                  {/* ३. व्यवसायाबद्दल माहिती (if self-employed) */}
                  {(member.occupationType === "business" ||
                    (!member.occupationType && member.occupation)) && (
                    <DetailRowMultiline
                      label={isMr ? "व्यवसायाबद्दल माहिती" : "About Business"}
                      value={member.additionalInfo || ""}
                      isMr={isMr}
                    />
                  )}
                  {/* ४. संस्थेबद्दल माहिती (if job) */}
                  {member.occupationType === "job" && (
                    <DetailRowMultiline
                      label={isMr ? "संस्थेबद्दल माहिती" : "About Organisation"}
                      value={member.additionalInfo || ""}
                      isMr={isMr}
                    />
                  )}
                  {/* additionalInfo if occupationType not set */}
                  {!member.occupationType && member.additionalInfo && (
                    <DetailRowMultiline
                      label={isMr ? "अतिरिक्त माहिती" : "Additional Info"}
                      value={member.additionalInfo}
                      isMr={isMr}
                    />
                  )}
                </div>

                <Separator />

                {/* ── C. संपर्क आणि पत्ता ── */}
                <SectionHeader
                  mr="C. संपर्क आणि पत्ता"
                  en="C. Contact & Address"
                  isMr={isMr}
                />
                <div className="space-y-2">
                  {/* १. मोबाईल नंबर */}
                  <DetailRow
                    label={isMr ? "मोबाईल नंबर" : "Mobile Number"}
                    value={member.mobile || ""}
                    isMr={isMr}
                  />
                  {/* २. व्हॉट्सॲप नंबर */}
                  <DetailRow
                    label={isMr ? "व्हॉट्सॲप नंबर" : "WhatsApp Number"}
                    value={member.whatsapp || ""}
                    isMr={isMr}
                  />
                  {/* ३. ई-मेल आयडी */}
                  <DetailRow
                    label={isMr ? "ई-मेल आयडी" : "Email ID"}
                    value={member.id || ""}
                    isMr={isMr}
                  />
                  {/* ४. सध्याचा राहता पत्ता */}
                  <DetailRowMultiline
                    label={isMr ? "सध्याचा राहता पत्ता" : "Current Address"}
                    value={fullAddress}
                    isMr={isMr}
                  />
                  {/* ५. मूळ गाव */}
                  <DetailRow
                    label={isMr ? "मूळ गाव" : "Native Village"}
                    value={member.nativeVillage || member.village || ""}
                    isMr={isMr}
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Footer actions */}
            <div className="px-5 py-4 border-t border-border space-y-2 shrink-0">
              <Button
                className="w-full bg-saffron hover:bg-saffron-deep text-white font-ui text-sm"
                onClick={() => onFocusTree(member)}
                data-ocid="family-tree.member_detail.focus_button"
              >
                {t("focusOnTree")}
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="w-full font-ui text-sm border-saffron text-saffron hover:bg-saffron hover:text-white"
                  onClick={() => onEdit(member)}
                  data-ocid="family-tree.member_detail.edit_button"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t("editMember")}
                </Button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Section Header ────────────────────────────────────────────────
function SectionHeader({
  mr,
  en,
  isMr,
}: {
  mr: string;
  en: string;
  isMr: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-xs font-bold text-saffron uppercase tracking-wide">
        {isMr ? mr : en}
      </span>
      <div className="flex-1 h-px bg-saffron/20" />
    </div>
  );
}

// ── Detail Row (single line) ──────────────────────────────────────
function DetailRow({
  label,
  value,
  isMr: _isMr,
}: {
  label: string;
  value: string;
  isMr: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="font-ui text-[11px] text-muted-foreground w-32 shrink-0 pt-0.5 leading-snug">
        {label}
      </span>
      <span className="font-body text-sm text-foreground leading-snug flex-1 min-h-[1.25rem]">
        {value || (
          <span className="text-muted-foreground/40 italic text-xs">—</span>
        )}
      </span>
    </div>
  );
}

// ── Detail Row Multiline ──────────────────────────────────────────
function DetailRowMultiline({
  label,
  value,
  isMr: _isMr,
}: {
  label: string;
  value: string;
  isMr: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="font-ui text-[11px] text-muted-foreground w-32 shrink-0 pt-0.5 leading-snug">
        {label}
      </span>
      <span className="font-body text-sm text-foreground leading-snug flex-1 min-h-[1.25rem] whitespace-pre-wrap break-words">
        {value || (
          <span className="text-muted-foreground/40 italic text-xs">—</span>
        )}
      </span>
    </div>
  );
}
