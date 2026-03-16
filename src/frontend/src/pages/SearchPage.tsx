import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Briefcase,
  Calendar,
  Cross,
  Droplets,
  Heart,
  LogIn,
  MapPin,
  Phone,
  Search,
  TreePine,
  User,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { FamilyMember } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useAllFamilyMembers } from "../hooks/useQueries";
import type { TranslationKey } from "../i18n/translations";

// ── Helpers ──────────────────────────────────────────────────────

type TFunc = (key: TranslationKey) => string;

function genderLabel(gender: string, t: TFunc): string {
  if (gender === "male") return t("male");
  if (gender === "female") return t("female");
  return t("other");
}

function maritalLabel(status: string, t: TFunc): string {
  if (status === "married") return t("married");
  if (status === "unmarried") return t("unmarried");
  if (status === "widowed") return t("widowed");
  if (status === "divorced") return t("divorced");
  return status;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "–";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("mr-IN");
  } catch {
    return dateStr;
  }
}

// ── Member Detail Dialog ──────────────────────────────────────────

interface MemberDetailDialogProps {
  member: FamilyMember | null;
  onClose: () => void;
}

function MemberDetailDialog({ member, onClose }: MemberDetailDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-ocid="search.member_detail.dialog"
        className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron/20 text-saffron font-bold text-base flex-shrink-0">
              {member?.name?.charAt(0) ?? "?"}
            </div>
            <span>{member?.name ?? ""}</span>
            {member?.isDeceased && (
              <Badge className="bg-gray-100 text-gray-600 border-gray-200 font-ui text-xs ml-1">
                <Cross className="h-3 w-3 mr-1" />
                {t("deceased")}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {member && (
          <div className="space-y-4 pt-2">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-3">
              <DetailField
                icon={<User className="h-4 w-4" />}
                label={t("gender")}
                value={genderLabel(member.gender, t)}
              />
              <DetailField
                icon={<Droplets className="h-4 w-4" />}
                label={t("bloodGroup")}
                value={member.bloodGroup || "–"}
              />
              <DetailField
                icon={<Heart className="h-4 w-4" />}
                label={t("maritalStatus")}
                value={maritalLabel(member.maritalStatus, t)}
              />
              <DetailField
                icon={<Calendar className="h-4 w-4" />}
                label={t("birthDate")}
                value={formatDate(member.birthDate)}
              />
              {member.marriageDate && (
                <DetailField
                  icon={<Calendar className="h-4 w-4" />}
                  label={t("marriageDate")}
                  value={formatDate(member.marriageDate)}
                />
              )}
              {member.isDeceased && member.deathDate && (
                <DetailField
                  icon={<Calendar className="h-4 w-4" />}
                  label={t("deathDate")}
                  value={formatDate(member.deathDate)}
                />
              )}
            </div>

            {/* Location */}
            <div className="border-t border-border pt-3 grid grid-cols-2 gap-3">
              <DetailField
                icon={<MapPin className="h-4 w-4" />}
                label={t("village")}
                value={member.village || member.nativeVillage || "–"}
              />
              {member.nativeVillage &&
                member.nativeVillage !== member.village && (
                  <DetailField
                    icon={<MapPin className="h-4 w-4" />}
                    label={t("nativeVillage")}
                    value={member.nativeVillage}
                  />
                )}
              {member.address && (
                <div className="col-span-2">
                  <DetailField
                    icon={<MapPin className="h-4 w-4" />}
                    label={t("address")}
                    value={member.address}
                  />
                </div>
              )}
            </div>

            {/* Professional */}
            <div className="border-t border-border pt-3 grid grid-cols-2 gap-3">
              {member.occupation && (
                <DetailField
                  icon={<Briefcase className="h-4 w-4" />}
                  label={t("occupation")}
                  value={member.occupation}
                />
              )}
              {member.education && (
                <DetailField
                  icon={<BookOpen className="h-4 w-4" />}
                  label={t("education")}
                  value={member.education}
                />
              )}
            </div>

            {/* Contact */}
            {(member.mobile || member.whatsapp) && (
              <div className="border-t border-border pt-3 grid grid-cols-2 gap-3">
                {member.mobile && (
                  <DetailField
                    icon={<Phone className="h-4 w-4" />}
                    label={t("mobile")}
                    value={member.mobile}
                  />
                )}
                {member.whatsapp && (
                  <DetailField
                    icon={<Phone className="h-4 w-4" />}
                    label="WhatsApp"
                    value={member.whatsapp}
                  />
                )}
              </div>
            )}

            {/* Additional Info */}
            {member.additionalInfo && (
              <div className="border-t border-border pt-3">
                <p className="font-ui text-xs text-muted-foreground mb-1">
                  अतिरिक्त माहिती
                </p>
                <p className="font-body text-sm text-foreground leading-relaxed">
                  {member.additionalInfo}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="search.member_detail.close_button"
            className="font-ui text-sm"
          >
            <X className="h-4 w-4 mr-1.5" />
            बंद करा / Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-saffron/70">{icon}</span>
        <span className="font-ui text-xs">{label}</span>
      </div>
      <p className="font-body text-sm text-foreground pl-5">{value}</p>
    </div>
  );
}

// ── Member Card ───────────────────────────────────────────────────

interface MemberCardProps {
  member: FamilyMember;
  index: number;
  onClick: () => void;
}

function MemberCard({ member, index, onClick }: MemberCardProps) {
  const { t } = useLanguage();

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      data-ocid={`search.results.item.${index + 1}`}
      className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-saffron/50 hover:shadow-md transition-all group cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron/15 text-saffron font-display font-bold text-sm flex-shrink-0 group-hover:bg-saffron/25 transition-colors">
          {member.name?.charAt(0) ?? "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-display text-base font-semibold text-foreground truncate leading-tight">
              {member.name}
            </h3>
            {member.isDeceased && (
              <Badge className="bg-gray-100 text-gray-500 border-gray-200 font-ui text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                {t("deceased")}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            {/* Gender badge */}
            <Badge
              variant="outline"
              className={`font-ui text-[10px] px-1.5 py-0 h-4 ${
                member.gender === "male"
                  ? "border-blue-200 text-blue-600 bg-blue-50"
                  : member.gender === "female"
                    ? "border-pink-200 text-pink-600 bg-pink-50"
                    : "border-purple-200 text-purple-600 bg-purple-50"
              }`}
            >
              {genderLabel(member.gender, t)}
            </Badge>

            {/* Blood group */}
            {member.bloodGroup && (
              <span className="flex items-center gap-0.5 font-ui text-[11px] text-red-600">
                <Droplets className="h-3 w-3" />
                {member.bloodGroup}
              </span>
            )}

            {/* Village */}
            {(member.village || member.nativeVillage) && (
              <span className="flex items-center gap-0.5 font-ui text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {member.village || member.nativeVillage}
              </span>
            )}
          </div>

          {/* Marital status */}
          {member.maritalStatus && (
            <p className="font-ui text-[11px] text-muted-foreground mt-1">
              {maritalLabel(member.maritalStatus, t)}
            </p>
          )}
        </div>

        <div className="text-muted-foreground/30 group-hover:text-saffron/60 transition-colors flex-shrink-0">
          <Search className="h-4 w-4" />
        </div>
      </div>
    </motion.button>
  );
}

// ── Main SearchPage ───────────────────────────────────────────────

export function SearchPage() {
  const { t } = useLanguage();
  const { isLoggedIn } = useAuth();
  const { data: members = [], isLoading } = useAllFamilyMembers();

  // Filter state
  const [nameFilter, setNameFilter] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all");
  const [villageFilter, setVillageFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [maritalFilter, setMaritalFilter] = useState("all");
  const [deceasedOnly, setDeceasedOnly] = useState(false);

  // Detail dialog state
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null,
  );

  // Filtered results (local, no backend calls)
  const filtered = useMemo(() => {
    return members.filter((m) => {
      // Name filter
      if (
        nameFilter &&
        !m.name.toLowerCase().includes(nameFilter.toLowerCase())
      ) {
        return false;
      }
      // Blood group filter
      if (bloodGroupFilter !== "all" && m.bloodGroup !== bloodGroupFilter) {
        return false;
      }
      // Village filter
      if (villageFilter) {
        const vSearch = villageFilter.toLowerCase();
        const inVillage = m.village?.toLowerCase().includes(vSearch) ?? false;
        const inNative =
          m.nativeVillage?.toLowerCase().includes(vSearch) ?? false;
        if (!inVillage && !inNative) return false;
      }
      // Gender filter
      if (genderFilter !== "all" && m.gender !== genderFilter) {
        return false;
      }
      // Marital status filter
      if (maritalFilter !== "all" && m.maritalStatus !== maritalFilter) {
        return false;
      }
      // Deceased only
      if (deceasedOnly && !m.isDeceased) {
        return false;
      }
      return true;
    });
  }, [
    members,
    nameFilter,
    bloodGroupFilter,
    villageFilter,
    genderFilter,
    maritalFilter,
    deceasedOnly,
  ]);

  const hasFilters =
    nameFilter ||
    bloodGroupFilter !== "all" ||
    villageFilter ||
    genderFilter !== "all" ||
    maritalFilter !== "all" ||
    deceasedOnly;

  const clearFilters = () => {
    setNameFilter("");
    setBloodGroupFilter("all");
    setVillageFilter("");
    setGenderFilter("all");
    setMaritalFilter("all");
    setDeceasedOnly(false);
  };

  // If not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen heritage-bg py-12 px-4">
        <div className="container mx-auto max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl shadow-heritage-lg p-12"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-saffron/15 mx-auto mb-5">
              <TreePine className="h-8 w-8 text-saffron" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              {t("searchTitle")}
            </h2>
            <p className="font-body text-muted-foreground mb-8">
              {t("loginToSearch")}
            </p>
            <Link to="/login">
              <Button
                className="bg-saffron hover:bg-saffron-deep text-white font-ui"
                data-ocid="search.login_button"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t("login")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen heritage-bg py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="container mx-auto max-w-6xl"
      >
        {/* Page Header */}
        <div className="bg-card border border-border rounded-2xl shadow-heritage-lg overflow-hidden mb-6">
          <div className="hero-gradient px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">
                <Search className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  {t("searchTitle")}
                </h1>
                <p className="font-body text-white/80 text-sm mt-0.5">
                  {t("searchSubtitle")}
                </p>
              </div>
            </div>
          </div>
          <div className="saffron-divider" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* ── Filters Sidebar ── */}
          <aside className="space-y-4">
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-foreground">
                  फिल्टर / Filters
                </h2>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    data-ocid="search.clear_button"
                    className="flex items-center gap-1 text-xs font-ui text-saffron hover:text-saffron-deep transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t("clearFilters")}
                  </button>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="font-ui text-xs text-muted-foreground uppercase tracking-wide">
                  नाव / Name
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    data-ocid="search.name_input"
                    className="pl-9 font-ui text-sm h-9"
                  />
                </div>
              </div>

              {/* Village */}
              <div className="space-y-1.5">
                <Label className="font-ui text-xs text-muted-foreground uppercase tracking-wide">
                  गाव / Village
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={villageFilter}
                    onChange={(e) => setVillageFilter(e.target.value)}
                    placeholder={t("villagePlaceholder")}
                    data-ocid="search.village_input"
                    className="pl-9 font-ui text-sm h-9"
                  />
                </div>
              </div>

              {/* Blood Group */}
              <div className="space-y-1.5">
                <Label className="font-ui text-xs text-muted-foreground uppercase tracking-wide">
                  रक्तगट / Blood Group
                </Label>
                <Select
                  value={bloodGroupFilter}
                  onValueChange={setBloodGroupFilter}
                >
                  <SelectTrigger
                    data-ocid="search.bloodgroup_select"
                    className="font-ui text-sm h-9"
                  >
                    <SelectValue placeholder={t("allBloodGroups")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allBloodGroups")}</SelectItem>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <Label className="font-ui text-xs text-muted-foreground uppercase tracking-wide">
                  लिंग / Gender
                </Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger
                    data-ocid="search.gender_select"
                    className="font-ui text-sm h-9"
                  >
                    <SelectValue placeholder={t("allGenders")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allGenders")}</SelectItem>
                    <SelectItem value="male">{t("male")}</SelectItem>
                    <SelectItem value="female">{t("female")}</SelectItem>
                    <SelectItem value="other">{t("other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Marital Status */}
              <div className="space-y-1.5">
                <Label className="font-ui text-xs text-muted-foreground uppercase tracking-wide">
                  वैवाहिक स्थिती / Marital Status
                </Label>
                <Select value={maritalFilter} onValueChange={setMaritalFilter}>
                  <SelectTrigger
                    data-ocid="search.marital_select"
                    className="font-ui text-sm h-9"
                  >
                    <SelectValue placeholder={t("allMaritalStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allMaritalStatus")}</SelectItem>
                    <SelectItem value="married">{t("married")}</SelectItem>
                    <SelectItem value="unmarried">{t("unmarried")}</SelectItem>
                    <SelectItem value="widowed">{t("widowed")}</SelectItem>
                    <SelectItem value="divorced">{t("divorced")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Deceased Only */}
              <div className="flex items-center justify-between py-1">
                <Label className="font-ui text-sm text-foreground cursor-pointer">
                  {t("deceasedOnly")}
                </Label>
                <Switch
                  checked={deceasedOnly}
                  onCheckedChange={setDeceasedOnly}
                  data-ocid="search.deceased_switch"
                  className="data-[state=checked]:bg-saffron"
                />
              </div>
            </div>
          </aside>

          {/* ── Results ── */}
          <section>
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="font-ui text-sm text-muted-foreground">
                <span className="font-semibold text-foreground text-base">
                  {isLoading ? "..." : filtered.length}
                </span>{" "}
                {t("membersFound")}
              </p>
              {hasFilters && (
                <Badge
                  variant="outline"
                  className="font-ui text-xs border-saffron/40 text-saffron bg-saffron/5"
                >
                  फिल्टर सक्रिय / Filters Active
                </Badge>
              )}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                data-ocid="search.results.loading_state"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-16 text-center bg-card border border-border rounded-2xl shadow-sm"
                data-ocid="search.results.empty_state"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                  <Users className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="font-display text-base font-semibold text-foreground mb-1">
                  {hasFilters ? "कोणतेही सदस्य सापडले नाही" : "सदस्य अद्याप नाहीत"}
                </p>
                <p className="font-body text-sm text-muted-foreground max-w-xs">
                  {hasFilters
                    ? "फिल्टर बदलून पुन्हा शोधा / Try changing filters"
                    : "वंशावळ सदस्य जोडल्यानंतर येथे दिसतील / Members will appear after adding to family tree"}
                </p>
                {hasFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-4 font-ui text-sm border-saffron/40 text-saffron hover:bg-saffron/10"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    {t("clearFilters")}
                  </Button>
                )}
              </motion.div>
            )}

            {/* Results grid */}
            {!isLoading && filtered.length > 0 && (
              <AnimatePresence>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((member, idx) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      index={idx}
                      onClick={() => setSelectedMember(member)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </section>
        </div>
      </motion.div>

      {/* Detail Dialog */}
      <MemberDetailDialog
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </main>
  );
}
