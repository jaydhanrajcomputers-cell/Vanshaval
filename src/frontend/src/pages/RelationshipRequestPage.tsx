import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  GitBranch,
  Loader2,
  Search,
  TreePine,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { FamilyMember, RelationshipRequest } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  useAllFamilyMembers,
  useMyRelationshipRequests,
  useSubmitRelationshipRequest,
} from "../hooks/useQueries";

// ── Types ─────────────────────────────────────────────────────────

interface PendingMemberData {
  name: string;
  email: string;
  gender?: string;
  nativeVillage?: string;
  bloodGroup?: string;
}

const RELATION_TYPES = [
  { value: "son", labelKey: "son" as const },
  { value: "daughter", labelKey: "daughter" as const },
  { value: "father", labelKey: "fatherRelation" as const },
  { value: "mother", labelKey: "motherRelation" as const },
  { value: "spouse", labelKey: "spouseRelation" as const },
  { value: "brother", labelKey: "brotherRelation" as const },
  { value: "sister", labelKey: "sisterRelation" as const },
  { value: "fatherInLaw", labelKey: "fatherInLawRelation" as const },
  { value: "motherInLaw", labelKey: "motherInLawRelation" as const },
] as const;

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  if (status === "pending") {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-ui text-xs">
        <Clock className="h-3 w-3 mr-1" />
        {t("requestStatusPending")}
      </Badge>
    );
  }
  if (status === "approved") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 font-ui text-xs">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {t("requestStatusApproved")}
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 border-red-200 font-ui text-xs">
      <XCircle className="h-3 w-3 mr-1" />
      {t("requestStatusRejected")}
    </Badge>
  );
}

// ── Component ─────────────────────────────────────────────────────

export function RelationshipRequestPage() {
  const { t } = useLanguage();
  const { currentUser, isLoggedIn } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null,
  );
  const [relationType, setRelationType] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const pendingMember = useMemo<PendingMemberData | null>(() => {
    try {
      const raw = localStorage.getItem("vatavriksha_pending_member");
      if (raw) return JSON.parse(raw) as PendingMemberData;
    } catch {
      // ignore
    }
    return null;
  }, []);

  const displayName = currentUser?.name ?? pendingMember?.name ?? "—";
  const displayEmail = currentUser?.email ?? pendingMember?.email ?? "—";

  const { data: allMembers = [], isLoading: membersLoading } =
    useAllFamilyMembers();
  const { data: myRequests = [], isLoading: requestsLoading } =
    useMyRelationshipRequests(currentUser?.email ?? "");

  const submitMutation = useSubmitRelationshipRequest();

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return allMembers.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return allMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.nativeVillage.toLowerCase().includes(q),
    );
  }, [allMembers, searchQuery]);

  const getMemberName = (id: string) => {
    return allMembers.find((m) => m.id === id)?.name ?? id;
  };

  const handleSubmit = async () => {
    if (!selectedMember) {
      toast.error("कृपया सदस्य निवडा / Please select a member");
      return;
    }
    if (!relationType) {
      toast.error("कृपया नाते निवडा / Please select relation type");
      return;
    }

    const request: RelationshipRequest = {
      id: crypto.randomUUID(),
      fromUserId: currentUser?.email ?? displayEmail,
      fromMemberName: displayName,
      toMemberId: selectedMember.id,
      relationType,
      status: "pending",
      note: "",
      createdAt: BigInt(Date.now()),
    };

    try {
      await submitMutation.mutateAsync(request);
      setSubmitted(true);
      // Clear pending member data
      localStorage.removeItem("vatavriksha_pending_member");
      toast.success(t("requestSubmitted"));
    } catch {
      toast.error("विनंती सादर करण्यात अयशस्वी / Failed to submit request");
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen heritage-bg flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-heritage-lg border border-border p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            लॉगिन आवश्यक आहे
          </h2>
          <p className="font-body text-muted-foreground mb-6">
            ही सेवा वापरण्यासाठी कृपया लॉगिन करा.
          </p>
          <Button
            asChild
            className="bg-saffron hover:bg-saffron-deep text-white"
          >
            <Link to="/login" data-ocid="relationship.login_link">
              लॉगिन करा
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen heritage-bg py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="container mx-auto max-w-2xl space-y-6"
        data-ocid="relationship.panel"
      >
        {/* Page Header */}
        <div className="bg-card border border-border rounded-2xl shadow-heritage-lg overflow-hidden">
          <div className="hero-gradient px-8 pt-8 pb-6 text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <GitBranch className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              {t("relationshipRequestTitle")}
            </h1>
            <p className="font-body text-white/80 mt-1 text-sm">
              वंशावळ जोडणी विनंती सादर करा
            </p>
          </div>
          <div className="saffron-divider" />

          <div className="px-8 py-6">
            {/* User Info */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron/20">
                <TreePine className="h-5 w-5 text-saffron" />
              </div>
              <div>
                <p className="font-ui text-sm font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="font-ui text-xs text-muted-foreground">
                  {displayEmail}
                </p>
              </div>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Alert
                  data-ocid="relationship.success_state"
                  className="border-green-500/30 bg-green-50 text-green-800 mb-4"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="font-ui text-sm text-green-800">
                    <strong>{t("requestSubmitted")}</strong>
                    <br />
                    {t("requestPendingNote")}
                  </AlertDescription>
                </Alert>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    asChild
                    variant="outline"
                    className="border-border font-ui"
                    data-ocid="relationship.view_requests_link"
                  >
                    <a href="#my-requests">{t("myRequests")} ↓</a>
                  </Button>
                  <Button
                    asChild
                    className="bg-saffron hover:bg-saffron-deep text-white font-ui"
                    data-ocid="relationship.home_link"
                  >
                    <Link to="/">मुख्यपृष्ठ</Link>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-5">
                {/* Step 1: Select Member */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-saffron text-white text-xs font-bold font-ui">
                      1
                    </div>
                    <Label className="font-ui text-sm font-semibold text-foreground">
                      {t("selectRelativeMember")}
                    </Label>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="नाव किंवा गाव शोधा / Search by name or village"
                      data-ocid="relationship.search_input"
                      className="pl-9 font-ui text-sm"
                    />
                  </div>

                  {/* Member List */}
                  {membersLoading ? (
                    <div
                      className="space-y-2"
                      data-ocid="relationship.loading_state"
                    >
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-8 text-center"
                      data-ocid="relationship.empty_state"
                    >
                      <TreePine className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="font-ui text-sm text-muted-foreground">
                        कोणतेही सदस्य सापडले नाही / No members found
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-border p-2 bg-background">
                      {filteredMembers.map((member, idx) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setSelectedMember(member)}
                          data-ocid={`relationship.member.item.${idx + 1}`}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                            selectedMember?.id === member.id
                              ? "bg-saffron/10 border border-saffron/30"
                              : "hover:bg-secondary border border-transparent"
                          }`}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-saffron/20 text-saffron font-display font-bold text-sm flex-shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-ui text-sm font-medium text-foreground truncate">
                              {member.name}
                            </p>
                            {member.nativeVillage && (
                              <p className="font-ui text-xs text-muted-foreground truncate">
                                {member.nativeVillage}
                              </p>
                            )}
                          </div>
                          {selectedMember?.id === member.id && (
                            <CheckCircle2 className="h-4 w-4 text-saffron ml-auto flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedMember && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-saffron/10 border border-saffron/20">
                      <CheckCircle2 className="h-4 w-4 text-saffron flex-shrink-0" />
                      <p className="font-ui text-sm text-saffron font-medium">
                        निवडले: {selectedMember.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Step 2: Select Relation Type */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-saffron text-white text-xs font-bold font-ui">
                      2
                    </div>
                    <Label
                      htmlFor="relation-type"
                      className="font-ui text-sm font-semibold text-foreground"
                    >
                      {t("selectRelationType")}
                      {selectedMember && (
                        <span className="font-normal text-muted-foreground ml-1">
                          ({selectedMember.name} यांच्याशी)
                        </span>
                      )}
                    </Label>
                  </div>

                  <Select value={relationType} onValueChange={setRelationType}>
                    <SelectTrigger
                      id="relation-type"
                      data-ocid="relationship.relation_type_select"
                      className="font-ui text-sm"
                    >
                      <SelectValue placeholder={t("selectRelationType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATION_TYPES.map((rt) => (
                        <SelectItem key={rt.value} value={rt.value}>
                          {t(rt.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit */}
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    submitMutation.isPending || !selectedMember || !relationType
                  }
                  data-ocid="relationship.submit_button"
                  className="w-full bg-saffron hover:bg-saffron-deep text-white font-ui font-semibold py-2.5"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      सादर होत आहे...
                    </>
                  ) : (
                    t("submitRequest")
                  )}
                </Button>

                {submitMutation.isError && (
                  <Alert
                    variant="destructive"
                    data-ocid="relationship.error_state"
                    className="border-destructive/30 bg-destructive/10"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-ui text-sm">
                      विनंती सादर करण्यात अयशस्वी. पुन्हा प्रयत्न करा.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Skip option */}
                <div className="text-center">
                  <p className="font-ui text-xs text-muted-foreground">
                    नंतर करायचे असल्यास —{" "}
                    <Link
                      to="/"
                      className="text-saffron hover:text-saffron-deep underline underline-offset-2"
                      data-ocid="relationship.skip_link"
                    >
                      मुख्यपृष्ठावर जा
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* My Requests Section */}
        <div
          id="my-requests"
          className="bg-card border border-border rounded-2xl shadow-heritage-lg overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Clock className="h-4 w-4 text-saffron" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t("myRequests")}
            </h2>
          </div>

          <div className="p-6">
            {requestsLoading ? (
              <div
                className="space-y-3"
                data-ocid="relationship.requests_loading_state"
              >
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : myRequests.length === 0 ? (
              <div
                className="flex flex-col items-center py-8 text-center"
                data-ocid="relationship.requests_empty_state"
              >
                <GitBranch className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="font-ui text-sm text-muted-foreground">
                  अद्याप कोणत्याही विनंत्या नाहीत
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req, idx) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    data-ocid={`relationship.request.item.${idx + 1}`}
                    className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-secondary/50"
                  >
                    <div className="min-w-0">
                      <p className="font-ui text-sm font-medium text-foreground truncate">
                        {getMemberName(req.toMemberId)}
                      </p>
                      <p className="font-ui text-xs text-muted-foreground">
                        {req.relationType} •{" "}
                        {new Date(Number(req.createdAt)).toLocaleDateString(
                          "mr-IN",
                        )}
                      </p>
                      {req.note && req.status === "rejected" && (
                        <p className="font-ui text-xs text-destructive mt-1">
                          कारण: {req.note}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={req.status} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
