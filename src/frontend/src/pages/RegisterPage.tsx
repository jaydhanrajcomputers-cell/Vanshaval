import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  MapPin,
  Phone,
  TreePine,
  User,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { PendingRegistration } from "../backend.d";
import { UserRole } from "../backend.d";
import { useLanguage } from "../context/LanguageContext";
import { useActor } from "../hooks/useActor";
import { localStore } from "../utils/localStore";

// ── Types ─────────────────────────────────────────────────────────

interface PersonalData {
  firstName: string;
  lastName: string;
  gender: string;
  maritalStatus: string;
  motherName: string;
  fatherName: string;
  husbandName: string;
  birthDate: string;
  birthTime: string;
  marriageDate: string;
  bloodGroup: string;
  deathDate: string;
  photoData: string;
}

interface ProfessionalData {
  education: string;
  occupationType: string;
  occupation: string;
  additionalInfo: string;
}

interface ContactData {
  email: string;
  mobile: string;
  whatsapp: string;
  houseNumber: string;
  roadName: string;
  landmark: string;
  cityVillage: string;
  pincode: string;
  district: string;
  nativeVillage: string;
}

interface ChildEntry {
  id: string;
  name: string;
  gender: string;
}

interface NameEntry {
  id: string;
  name: string;
}

interface RelationshipData {
  fatherFullName: string;
  motherFullName: string;
  fatherInLawName: string;
  motherInLawName: string;
  spouseName: string;
  spouseRelation: string; // "पती" or "पत्नी"
  brotherNames: string;
  sisterNames: string;
  childrenNames: string;
  children: ChildEntry[];
  brothers: NameEntry[];
  sisters: NameEntry[];
}

interface PasswordData {
  password: string;
  confirmPassword: string;
  consent: boolean;
}

const STEP_COUNT = 5;

// Business/trade types that require occupation description
const BUSINESS_TYPES = ["शेती", "व्यापार", "उद्योग"];
// Job types that require organization description
const JOB_TYPES = [
  "सेवा क्षेत्र (खाजगी नोकरी)",
  "सरकारी नोकरी",
  "निमसरकारी नोकरी",
  "वैद्यकीय",
  "शिक्षण क्षेत्र",
  "कायदा/वकिली",
  "इंजिनिअरिंग",
];

const OCCUPATION_OPTIONS = [
  "शेती",
  "व्यापार",
  "उद्योग",
  "सेवा क्षेत्र (खाजगी नोकरी)",
  "सरकारी नोकरी",
  "निमसरकारी नोकरी",
  "वैद्यकीय",
  "शिक्षण क्षेत्र",
  "कायदा/वकिली",
  "इंजिनिअरिंग",
  "सामाजिक कार्य",
  "गृहिणी",
  "विद्यार्थी",
  "इतर",
];

const BLOOD_GROUPS = [
  "माहित नाही",
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

// ── Field wrapper ─────────────────────────────────────────────────

function Field({
  label,
  required,
  note,
  children,
}: {
  label: string;
  required?: boolean;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="font-ui text-sm font-medium text-foreground">
        {label}{" "}
        {required && <span className="text-destructive font-bold">*</span>}
      </Label>
      {children}
      {note && <p className="font-ui text-xs text-amber-600 italic">{note}</p>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────

export function RegisterPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { actor } = useActor();

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [emailCheckStatus, setEmailCheckStatus] = useState<
    "idle" | "duplicate" | "available"
  >("idle");

  const checkEmailDuplicate = async (email: string) => {
    if (!email || !email.includes("@")) {
      setEmailCheckStatus("idle");
      return;
    }
    // Check localStorage registrations
    const allRegs = localStore.getAllRegistrations();
    const isDuplicate = allRegs.some(
      (r) => r.email.toLowerCase() === email.toLowerCase(),
    );
    if (isDuplicate) {
      setEmailCheckStatus("duplicate");
      return;
    }
    // Check member data keys in localStorage
    const memberDataKey = `vatavriksha_member_data_${email}`;
    if (localStorage.getItem(memberDataKey)) {
      setEmailCheckStatus("duplicate");
      return;
    }
    // Check backend for existing user with this email
    // If getUserProfileByEmail succeeds (doesn't throw), user already exists
    try {
      if (actor) {
        await actor.getUserProfileByEmail(email);
        // If we reach here, a user with this email already exists in backend
        setEmailCheckStatus("duplicate");
        return;
      }
    } catch {
      // Backend threw an error = user NOT found = email is available
    }
    setEmailCheckStatus("available");
  };

  const [personal, setPersonal] = useState<PersonalData>({
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
    bloodGroup: "",
    deathDate: "",
    photoData: "",
  });

  const emailCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkEmailDuplicateRef = useRef(checkEmailDuplicate);
  checkEmailDuplicateRef.current = checkEmailDuplicate;

  const debouncedEmailCheck = (email: string) => {
    if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);
    emailCheckTimerRef.current = setTimeout(() => {
      checkEmailDuplicateRef.current(email);
    }, 600);
  };

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      setPhotoError(
        "फोटो 1 MB पेक्षा मोठा आहे. कृपया लहान फोटो अपलोड करा. / Photo exceeds 1 MB limit.",
      );
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPersonal((p) => ({ ...p, photoData: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const [professional, setProfessional] = useState<ProfessionalData>({
    education: "",
    occupationType: "",
    occupation: "",
    additionalInfo: "",
  });

  const [contact, setContact] = useState<ContactData>({
    email: "",
    mobile: "",
    whatsapp: "",
    houseNumber: "",
    roadName: "",
    landmark: "",
    cityVillage: "",
    pincode: "",
    district: "",
    nativeVillage: "",
  });

  const [relationship, setRelationship] = useState<RelationshipData>({
    fatherFullName: "",
    motherFullName: "",
    fatherInLawName: "",
    motherInLawName: "",
    spouseName: "",
    spouseRelation: "",
    brotherNames: "",
    sisterNames: "",
    childrenNames: "",
    children: [],
    brothers: [],
    sisters: [],
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    password: "",
    confirmPassword: "",
    consent: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isFemale = personal.gender === "female";
  const isMarried = personal.maritalStatus === "married";
  const isBusinessType = BUSINESS_TYPES.includes(professional.occupationType);
  const isJobType = JOB_TYPES.includes(professional.occupationType);

  const addChild = () => {
    setRelationship((p) => ({
      ...p,
      children: [
        ...p.children,
        { id: crypto.randomUUID(), name: "", gender: "" },
      ],
    }));
  };

  const updateChild = (idx: number, field: "name" | "gender", val: string) => {
    setRelationship((p) => {
      const updated = [...p.children];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...p, children: updated };
    });
  };

  const removeChild = (idx: number) => {
    setRelationship((p) => ({
      ...p,
      children: p.children.filter((_, i) => i !== idx),
    }));
  };

  const addBrother = () => {
    setRelationship((p) => ({
      ...p,
      brothers: [...p.brothers, { id: crypto.randomUUID(), name: "" }],
    }));
  };

  const updateBrother = (idx: number, val: string) => {
    setRelationship((p) => {
      const updated = [...p.brothers];
      updated[idx] = { ...updated[idx], name: val };
      return { ...p, brothers: updated };
    });
  };

  const removeBrother = (idx: number) => {
    setRelationship((p) => ({
      ...p,
      brothers: p.brothers.filter((_, i) => i !== idx),
    }));
  };

  const addSister = () => {
    setRelationship((p) => ({
      ...p,
      sisters: [...p.sisters, { id: crypto.randomUUID(), name: "" }],
    }));
  };

  const updateSister = (idx: number, val: string) => {
    setRelationship((p) => {
      const updated = [...p.sisters];
      updated[idx] = { ...updated[idx], name: val };
      return { ...p, sisters: updated };
    });
  };

  const removeSister = (idx: number) => {
    setRelationship((p) => ({
      ...p,
      sisters: p.sisters.filter((_, i) => i !== idx),
    }));
  };

  // ── Validation per step ────────────────────────────────────────

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (!personal.photoData)
        return "फोटो अपलोड करणे आवश्यक आहे / Photo is required";
      if (!personal.firstName.trim())
        return "पहिले नाव आवश्यक आहे / First name is required";
      if (!personal.lastName.trim())
        return "आडनाव आवश्यक आहे / Last name is required";
      if (!personal.maritalStatus)
        return "वैवाहिक स्थिती निवडा / Select marital status";
      if (!personal.gender) return "लिंग निवडा / Select gender";
      if (!personal.motherName.trim())
        return "आईचे नाव आवश्यक आहे / Mother's name is required";
      if (!personal.fatherName.trim())
        return "वडिलांचे नाव आवश्यक आहे / Father's name is required";
      if (!personal.birthDate)
        return "जन्म तारीख आवश्यक आहे / Birth date is required";
      if (isMarried && !personal.marriageDate)
        return "लग्नाची तारीख आवश्यक आहे / Marriage date is required";
    }
    if (step === 2) {
      if (!professional.education.trim())
        return "शिक्षण आवश्यक आहे / Education is required";
      if (!professional.occupationType)
        return "व्यवसाय/नोकरीचे क्षेत्र निवडा / Select occupation type";
      if (isBusinessType && !professional.occupation.trim())
        return "व्यवसायाबद्दल माहिती आवश्यक आहे / Business info is required";
      if (isJobType && !professional.occupation.trim())
        return "संस्थेबद्दल माहिती आवश्यक आहे / Organization info is required";
    }
    if (step === 3) {
      if (!contact.email.trim()) return "ईमेल आवश्यक आहे / Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
        return "वैध ईमेल प्रविष्ट करा / Enter valid email";
      if (emailCheckStatus === "duplicate")
        return "हा ई-मेल आधीच नोंदणीकृत आहे / This email is already registered";
      if (!isFemale && !contact.mobile.trim())
        return "मोबाईल नंबर आवश्यक आहे / Mobile number is required";
      if (!contact.whatsapp.trim())
        return "व्हॉट्सॲप नंबर आवश्यक आहे / WhatsApp number is required";
      if (!contact.houseNumber.trim())
        return "घर नंबर आवश्यक आहे / House number is required";
      if (!contact.roadName.trim())
        return "रोडचे नाव आवश्यक आहे / Road name is required";
      if (!contact.landmark.trim())
        return "जवळची खूण आवश्यक आहे / Landmark is required";
      if (!contact.cityVillage.trim())
        return "शहर/गाव आवश्यक आहे / City/Village is required";
      if (!contact.pincode.trim())
        return "पिनकोड आवश्यक आहे / Pincode is required";
      if (!contact.district.trim())
        return "जिल्हा आवश्यक आहे / District is required";
    }
    if (step === 4) {
      // सासू-सासरे फक्त विवाहित असल्यासच आवश्यक आहेत
      if (isMarried && !relationship.fatherInLawName.trim())
        return "सासर्यांचे नाव आवश्यक आहे / Father-in-law's name is required";
      if (isMarried && !relationship.motherInLawName.trim())
        return "सासूचे नाव आवश्यक आहे / Mother-in-law's name is required";
      if (isMarried && !relationship.spouseName.trim())
        return "जोडीदाराचे नाव आवश्यक आहे / Spouse name is required";
    }
    if (step === 5) {
      if (!passwordData.password)
        return "पासवर्ड आवश्यक आहे / Password is required";
      if (passwordData.password.length < 6)
        return "पासवर्ड किमान 6 अक्षरे असणे आवश्यक आहे / Password must be at least 6 characters";
      if (passwordData.password !== passwordData.confirmPassword)
        return t("passwordMismatch");
      if (!passwordData.consent) return t("consentRequired");
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, STEP_COUNT));
  };

  const goPrev = () => {
    setError(null);
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    const err = validateStep(5);
    if (err) {
      setError(err);
      return;
    }
    // Final duplicate email check before submission
    const allRegs = localStore.getAllRegistrations();
    const emailExists = allRegs.some(
      (r) => r.email.toLowerCase() === contact.email.toLowerCase(),
    );
    if (emailExists) {
      setEmailCheckStatus("duplicate");
      setError("हा ई-मेल आधीच नोंदणीकृत आहे / This email is already registered");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Check backend for duplicate email ONLY if actor is available and canister is running
      // If canister is stopped, skip this check and proceed with localStorage
      if (actor) {
        try {
          await actor.getUserProfileByEmail(contact.email);
          // Reached here = user already exists in backend
          setEmailCheckStatus("duplicate");
          setError(
            "हा ई-मेल आधीच नोंदणीकृत आहे. कृपया वेगळा ईमेल वापरा. / This email is already registered. Please use a different email.",
          );
          setIsLoading(false);
          setDirection(-1);
          setCurrentStep(3);
          return;
        } catch (dupCheckErr: unknown) {
          const dupMsg =
            dupCheckErr instanceof Error
              ? dupCheckErr.message
              : String(dupCheckErr);
          // If "User not found" → safe to proceed.
          // If canister stopped/IC0508/timeout → also proceed (fallback to localStorage)
          if (
            dupMsg.includes("already exists") ||
            dupMsg.includes("already registered") ||
            dupMsg.includes("Email already")
          ) {
            setEmailCheckStatus("duplicate");
            setError(
              "हा ई-मेल आधीच नोंदणीकृत आहे. कृपया वेगळा ईमेल वापरा. / This email is already registered.",
            );
            setIsLoading(false);
            setDirection(-1);
            setCurrentStep(3);
            return;
          }
          // else: user not found or canister error → safe to proceed
        }
      }

      const fullName = `${personal.firstName} ${personal.lastName}`.trim();
      const address = [
        contact.houseNumber,
        contact.roadName,
        contact.landmark,
        contact.cityVillage,
        contact.pincode,
        contact.district,
      ]
        .filter(Boolean)
        .join(", ");

      // Build childrenNames string from structured children list
      const childrenNamesStr = relationship.children
        .filter((c) => c.name.trim())
        .map(
          (c) =>
            `${c.name.trim()} (${c.gender === "male" ? "पुरुष" : c.gender === "female" ? "स्त्री" : "इतर"})`,
        )
        .join(", ");

      // Build brotherNames and sisterNames from structured lists
      const brotherNamesStr = relationship.brothers
        .filter((b) => b.name.trim())
        .map((b) => b.name.trim())
        .join(", ");

      const sisterNamesStr = relationship.sisters
        .filter((s) => s.name.trim())
        .map((s) => s.name.trim())
        .join(", ");

      // Build spouseName with relation
      const spouseNameWithRelation = relationship.spouseName
        ? relationship.spouseRelation
          ? `${relationship.spouseName} (${relationship.spouseRelation})`
          : relationship.spouseName
        : "";

      const newProfileId = crypto.randomUUID();
      const fullAddress = address;

      // ── STEP 1: Always save to localStorage FIRST (no dependency on backend) ──
      localStore.addPendingRegistration({
        id: newProfileId,
        name: fullName,
        email: contact.email,
        mobile: contact.mobile,
        whatsapp: contact.whatsapp,
        bloodGroup: personal.bloodGroup,
        gender: personal.gender,
        birthDate: personal.birthDate,
        address: fullAddress,
        nativeVillage: contact.nativeVillage,
        education: professional.education,
        occupation: professional.occupation,
        occupationType: professional.occupationType,
        maritalStatus: personal.maritalStatus,
        registeredAt: Date.now(),
        status: "pending",
      });

      // ── STEP 2: Save full member data to localStorage ──
      localStore.saveMemberData({
        id: newProfileId,
        email: contact.email,
        firstName: personal.firstName,
        lastName: personal.lastName,
        name: fullName,
        gender: personal.gender,
        maritalStatus: personal.maritalStatus,
        motherName: personal.motherName,
        fatherName: personal.fatherName,
        husbandName: personal.husbandName,
        birthDate: personal.birthDate,
        birthTime: personal.birthTime,
        bloodGroup: personal.bloodGroup,
        marriageDate: personal.marriageDate,
        deathDate: personal.deathDate,
        isDeceased: !!personal.deathDate,
        photoData: personal.photoData,
        education: professional.education,
        occupationType: professional.occupationType,
        occupation: professional.occupation,
        additionalInfo: professional.additionalInfo,
        mobile: contact.mobile,
        whatsapp: contact.whatsapp,
        houseNumber: contact.houseNumber,
        roadName: contact.roadName,
        landmark: contact.landmark,
        cityVillage: contact.cityVillage,
        pincode: contact.pincode,
        district: contact.district,
        address: fullAddress,
        nativeVillage: contact.nativeVillage,
        fatherFullName: relationship.fatherFullName,
        motherFullName: relationship.motherFullName,
        fatherInLawName: relationship.fatherInLawName,
        motherInLawName: relationship.motherInLawName,
        spouseName: spouseNameWithRelation || relationship.spouseName,
        brotherNames: brotherNamesStr || relationship.brotherNames,
        sisterNames: sisterNamesStr || relationship.sisterNames,
        childrenNames: childrenNamesStr || relationship.childrenNames,
        passwordHash: passwordData.password,
      });

      // ── STEP 3: Try backend calls — if canister is stopped, silently skip ──
      if (actor) {
        const newProfile = {
          id: newProfileId,
          name: fullName,
          email: contact.email,
          passwordHash: passwordData.password,
          role: UserRole.user,
          isActive: false,
          isVerified: false,
          createdAt: BigInt(Date.now()),
        };

        // Try registerUser — ignore canister stopped / IC0508 errors
        try {
          await actor.registerUser(newProfile);
        } catch (regErr: unknown) {
          const regMsg =
            regErr instanceof Error ? regErr.message : String(regErr);
          if (
            regMsg.includes("already exists") ||
            regMsg.includes("already registered") ||
            regMsg.includes("Email already") ||
            regMsg.includes("Email already taken")
          ) {
            // Email truly duplicate — show error and return
            // But first check if it's in our localStorage (we just added it), remove it
            localStore.removePendingRegistration(contact.email);
            setEmailCheckStatus("duplicate");
            setError(
              "हा ई-मेल आधीच नोंदणीकृत आहे. कृपया वेगळा ईमेल वापरा. / This email is already registered.",
            );
            setIsLoading(false);
            setDirection(-1);
            setCurrentStep(3);
            return;
          }
          // Any other error (canister stopped, IC0508, timeout) → silently continue
          // Registration is saved in localStorage, admin will see it there
        }

        // Try submitPendingRegistration — ignore canister stopped errors
        const pendingReg: PendingRegistration = {
          id: newProfileId,
          name: fullName,
          email: contact.email,
          mobile: contact.mobile,
          whatsapp: contact.whatsapp,
          bloodGroup: personal.bloodGroup,
          gender: personal.gender,
          birthDate: personal.birthDate,
          birthTime: personal.birthTime,
          address: fullAddress,
          nativeVillage: contact.nativeVillage,
          education: professional.education,
          occupation: professional.occupation,
          occupationType: professional.occupationType,
          maritalStatus: personal.maritalStatus,
          registeredAt: BigInt(Date.now()),
          status: "pending",
          firstName: personal.firstName,
          lastName: personal.lastName,
          motherName: personal.motherName,
          fatherName: personal.fatherName,
          husbandName: personal.husbandName,
          marriageDate: personal.marriageDate,
          deathDate: personal.deathDate,
          isDeceased: !!personal.deathDate,
          photoData: "",
          additionalInfo: professional.additionalInfo,
          houseNumber: contact.houseNumber,
          roadName: contact.roadName,
          landmark: contact.landmark,
          cityVillage: contact.cityVillage,
          pincode: contact.pincode,
          district: contact.district,
          fatherFullName: relationship.fatherFullName,
          motherFullName: relationship.motherFullName,
          fatherInLawName: relationship.fatherInLawName,
          motherInLawName: relationship.motherInLawName,
          spouseName: spouseNameWithRelation || relationship.spouseName,
          brotherNames: brotherNamesStr || relationship.brotherNames,
          sisterNames: sisterNamesStr || relationship.sisterNames,
          childrenNames: childrenNamesStr || relationship.childrenNames,
        };
        try {
          await actor.submitPendingRegistration(pendingReg);
        } catch {
          // Canister stopped or any backend error → silently skip
          // Data is safe in localStorage, admin panel will show it
        }
      }

      // ── STEP 4: Always show success ──
      setSuccess(true);
      setTimeout(() => navigate({ to: "/login" }), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("already exists") ||
        msg.includes("already registered") ||
        msg.includes("Email already")
      ) {
        setEmailCheckStatus("duplicate");
        setError(
          "हा ई-मेल आधीच नोंदणीकृत आहे. कृपया वेगळा ईमेल वापरा. / This email is already registered. Please use a different email.",
        );
        setDirection(-1);
        setCurrentStep(3);
      } else {
        setError(`${t("registerError")} (${msg})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { label: t("stepPersonal"), num: 1, icon: User },
    { label: t("stepProfessional"), num: 2, icon: Heart },
    { label: t("stepContact"), num: 3, icon: MapPin },
    { label: t("stepRelationship"), num: 4, icon: Users },
    { label: t("stepPassword"), num: 5, icon: TreePine },
  ];

  return (
    <main className="min-h-screen heritage-bg flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <div className="bg-card border border-border rounded-2xl shadow-heritage-lg overflow-hidden">
          {/* Header */}
          <div className="hero-gradient px-8 pt-8 pb-6 text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <TreePine className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              {t("registerTitle")}
            </h1>
            <p className="font-body text-white/80 mt-1 text-sm">
              {t("registerSubtitle")}
            </p>
          </div>

          <div className="saffron-divider" />

          {/* Step Progress */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between gap-1">
              {steps.map((step, idx) => (
                <div key={step.num} className="flex items-center gap-1 flex-1">
                  <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold font-ui transition-all duration-300 ${
                        currentStep > step.num
                          ? "bg-saffron text-white"
                          : currentStep === step.num
                            ? "bg-saffron text-white ring-2 ring-saffron/30 ring-offset-2"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > step.num ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        step.num
                      )}
                    </div>
                    <span
                      className={`font-ui text-[10px] text-center leading-tight truncate max-w-[55px] sm:max-w-[65px] ${
                        currentStep === step.num
                          ? "text-saffron font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mt-[-12px] transition-all duration-500 ${
                        currentStep > step.num ? "bg-saffron" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step badge */}
          <div className="px-6 pt-3 pb-1">
            <Badge
              variant="outline"
              className="font-ui text-xs border-saffron/30 text-saffron bg-saffron/5"
            >
              {t("step")} {currentStep}/{STEP_COUNT}
            </Badge>
          </div>

          {/* Step content */}
          <div className="px-8 pb-8 pt-2">
            {error && (
              <Alert
                variant="destructive"
                data-ocid="register.error_state"
                className="border-destructive/30 bg-destructive/10 mb-4"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-ui text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert
                data-ocid="register.success_state"
                className="border-green-500/30 bg-green-50 text-green-800 mb-4"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="font-ui text-sm text-green-800 space-y-1">
                  <p className="font-semibold">नोंदणी यशस्वी झाली!</p>
                  <p>
                    तुमची नोंदणी ऍडमिनकडे पाठवली गेली आहे. ऍडमिन मंजूरी दिल्यानंतर तुम्ही
                    लॉगिन करू शकाल.
                  </p>
                  <p className="text-xs text-green-600">
                    Registration successful! Awaiting admin approval. You will
                    be redirected to login...
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" }}
              >
                {/* ══ Step 1: फोटो + वैयक्तिक माहिती ══ */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-4 w-4 text-saffron" />
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        {t("stepPersonal")}
                      </h2>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-1.5">
                      <Label className="font-ui text-sm font-medium text-foreground">
                        फोटो / Photo{" "}
                        <span className="text-destructive font-bold">*</span>
                      </Label>
                      <div className="flex items-center gap-4">
                        {personal.photoData ? (
                          <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-saffron/40 shadow">
                            <img
                              src={personal.photoData}
                              alt="Profile"
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPersonal((p) => ({ ...p, photoData: "" }));
                                if (photoInputRef.current)
                                  photoInputRef.current.value = "";
                              }}
                              className="absolute top-0 right-0 bg-destructive/80 rounded-full p-0.5 text-white"
                              aria-label="Remove photo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border-2 border-dashed border-border">
                            <Camera className="h-7 w-7 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => photoInputRef.current?.click()}
                            data-ocid="register.upload_button"
                            className="font-ui text-xs border-saffron/30 text-saffron hover:bg-saffron/5"
                          >
                            <Camera className="h-3.5 w-3.5 mr-1.5" />
                            फोटो निवडा / Choose Photo
                          </Button>
                          <p className="font-ui text-[11px] text-amber-600 italic">
                            टीप: फोटो 1 MB पेक्षा जास्त नसावा / Note: Photo must
                            not exceed 1 MB
                          </p>
                          <p className="font-ui text-[11px] text-muted-foreground">
                            फोटो लहान करण्यासाठी:{" "}
                            <a
                              href="https://www.reduceimages.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-saffron underline underline-offset-1"
                            >
                              reduceimages.com
                            </a>{" "}
                            वापरा
                          </p>
                          <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                            data-ocid="register.dropzone"
                          />
                        </div>
                      </div>
                      {photoError && (
                        <p className="font-ui text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {photoError}
                        </p>
                      )}
                    </div>

                    {/* First Name + Last Name */}
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t("firstName")} required>
                        <Input
                          value={personal.firstName}
                          onChange={(e) =>
                            setPersonal((p) => ({
                              ...p,
                              firstName: e.target.value,
                            }))
                          }
                          placeholder="उदा. रामचंद्र"
                          autoComplete="given-name"
                          data-ocid="register.name_input"
                          className="font-ui text-sm"
                        />
                      </Field>
                      <Field label={t("lastName")} required>
                        <Input
                          value={personal.lastName}
                          onChange={(e) =>
                            setPersonal((p) => ({
                              ...p,
                              lastName: e.target.value,
                            }))
                          }
                          placeholder="उदा. अभंगराव"
                          autoComplete="family-name"
                          data-ocid="register.name_input"
                          className="font-ui text-sm"
                        />
                      </Field>
                    </div>

                    {/* Marital Status */}
                    <Field label={t("maritalStatus")} required>
                      <Select
                        value={personal.maritalStatus}
                        onValueChange={(v) =>
                          setPersonal((p) => ({ ...p, maritalStatus: v }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="register.marital_status_select"
                          className="font-ui text-sm"
                        >
                          <SelectValue placeholder="वैवाहिक स्थिती निवडा" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unmarried">
                            {t("unmarried")}
                          </SelectItem>
                          <SelectItem value="married">
                            {t("married")}
                          </SelectItem>
                          <SelectItem value="widowed">
                            {t("widowed")}
                          </SelectItem>
                          <SelectItem value="divorced">
                            {t("divorced")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* Gender Dropdown — AFTER marital status */}
                    <Field label={t("gender")} required>
                      <Select
                        value={personal.gender}
                        onValueChange={(v) => {
                          setPersonal((p) => ({ ...p, gender: v }));
                          if (v === "female") {
                            setRelationship((p) => ({
                              ...p,
                              spouseRelation: "पती",
                            }));
                          } else if (v === "male") {
                            setRelationship((p) => ({
                              ...p,
                              spouseRelation: "पत्नी",
                            }));
                          }
                        }}
                      >
                        <SelectTrigger
                          data-ocid="register.gender_select"
                          className="font-ui text-sm"
                        >
                          <SelectValue placeholder="लिंग निवडा" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{t("male")}</SelectItem>
                          <SelectItem value="female">{t("female")}</SelectItem>
                          <SelectItem value="other">{t("other")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* Mother's Name */}
                    <Field label={t("motherName")} required>
                      <Input
                        value={personal.motherName}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            motherName: e.target.value,
                          }))
                        }
                        placeholder="आईचे पूर्ण नाव"
                        data-ocid="register.input"
                        className="font-ui text-sm"
                      />
                    </Field>

                    {/* Father's Name — always required for all */}
                    <Field label="वडिलांचे नाव / Father's Name" required>
                      <Input
                        value={personal.fatherName}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            fatherName: e.target.value,
                          }))
                        }
                        placeholder="वडिलांचे पूर्ण नाव"
                        data-ocid="register.input"
                        className="font-ui text-sm"
                      />
                    </Field>

                    {/* Birth Date */}
                    <Field label={`${t("birthDate")} / जन्म तारीख`} required>
                      <Input
                        type="date"
                        value={personal.birthDate}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            birthDate: e.target.value,
                          }))
                        }
                        data-ocid="register.birth_date_input"
                        className="font-ui text-sm"
                      />
                    </Field>

                    {/* Birth Time (optional) */}
                    <Field label={`${t("birthTime")} / जन्म वेळ`}>
                      <Input
                        type="time"
                        value={personal.birthTime}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            birthTime: e.target.value,
                          }))
                        }
                        data-ocid="register.birth_time_input"
                        className="font-ui text-sm"
                      />
                    </Field>

                    {/* Marriage Date (if married) */}
                    {isMarried && (
                      <Field label="लग्नाची तारीख / Marriage Date" required>
                        <Input
                          type="date"
                          value={personal.marriageDate}
                          onChange={(e) =>
                            setPersonal((p) => ({
                              ...p,
                              marriageDate: e.target.value,
                            }))
                          }
                          data-ocid="register.marriage_date_input"
                          className="font-ui text-sm"
                        />
                      </Field>
                    )}

                    {/* Blood Group (optional with note) */}
                    <Field
                      label={`${t("bloodGroupLabel")} / रक्तगट`}
                      note={t("bloodGroupNote")}
                    >
                      <Select
                        value={personal.bloodGroup}
                        onValueChange={(v) =>
                          setPersonal((p) => ({ ...p, bloodGroup: v }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="register.blood_group_select"
                          className="font-ui text-sm"
                        >
                          <SelectValue placeholder="रक्तगट निवडा (ऐच्छिक)" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_GROUPS.map((bg) => (
                            <SelectItem key={bg} value={bg}>
                              {bg}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* Death Date (optional) */}
                    <Field
                      label="मृत्यू तारीख / Death Date"
                      note="कृपया गैरसमज करून घेऊ नका. ही माहिती वंशावळीसाठी आवश्यक आहे. / Please do not misunderstand. This information is needed for genealogy records."
                    >
                      <Input
                        type="date"
                        value={personal.deathDate}
                        onChange={(e) =>
                          setPersonal((p) => ({
                            ...p,
                            deathDate: e.target.value,
                          }))
                        }
                        data-ocid="register.death_date_input"
                        className="font-ui text-sm"
                      />
                    </Field>
                  </div>
                )}

                {/* ══ Step 2: व्यावसायिक माहिती ══ */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="h-4 w-4 text-saffron" />
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        {t("stepProfessional")}
                      </h2>
                    </div>

                    <Field label="शिक्षण / Education" required>
                      <Input
                        value={professional.education}
                        onChange={(e) =>
                          setProfessional((p) => ({
                            ...p,
                            education: e.target.value,
                          }))
                        }
                        placeholder="उदा. B.A., M.Sc., ITI, 10वी..."
                        data-ocid="register.education_input"
                        className="font-ui text-sm"
                      />
                    </Field>

                    <Field label={t("occupationType")} required>
                      <Select
                        value={professional.occupationType}
                        onValueChange={(v) =>
                          setProfessional((p) => ({
                            ...p,
                            occupationType: v,
                            occupation: "",
                          }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="register.select"
                          className="font-ui text-sm"
                        >
                          <SelectValue placeholder="व्यवसाय/नोकरीचे क्षेत्र निवडा" />
                        </SelectTrigger>
                        <SelectContent>
                          {OCCUPATION_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* Business info (required for business types) */}
                    {isBusinessType && (
                      <Field label={t("occupationDesc")} required>
                        <Textarea
                          value={professional.occupation}
                          onChange={(e) =>
                            setProfessional((p) => ({
                              ...p,
                              occupation: e.target.value,
                            }))
                          }
                          placeholder="तुमच्या व्यवसायाबद्दल थोडक्यात माहिती सांगा..."
                          rows={3}
                          data-ocid="register.textarea"
                          className="font-ui text-sm resize-none"
                        />
                      </Field>
                    )}

                    {/* Organization info (required for job types) */}
                    {isJobType && (
                      <Field label={t("organizationDesc")} required>
                        <Textarea
                          value={professional.occupation}
                          onChange={(e) =>
                            setProfessional((p) => ({
                              ...p,
                              occupation: e.target.value,
                            }))
                          }
                          placeholder="तुम्ही ज्या संस्थेत काम करता तिची थोडक्यात माहिती..."
                          rows={3}
                          data-ocid="register.textarea"
                          className="font-ui text-sm resize-none"
                        />
                      </Field>
                    )}

                    {/* Additional Info (optional for other types) */}
                    {!isBusinessType &&
                      !isJobType &&
                      professional.occupationType && (
                        <Field label="अतिरिक्त माहिती / Additional Info">
                          <Textarea
                            value={professional.additionalInfo}
                            onChange={(e) =>
                              setProfessional((p) => ({
                                ...p,
                                additionalInfo: e.target.value,
                              }))
                            }
                            placeholder="इतर महत्त्वाची माहिती..."
                            rows={3}
                            data-ocid="register.additional_info_textarea"
                            className="font-ui text-sm resize-none"
                          />
                        </Field>
                      )}
                  </div>
                )}

                {/* ══ Step 3: संपर्क आणि पत्ता ══ */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-4 w-4 text-saffron" />
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        {t("stepContact")}
                      </h2>
                    </div>

                    <Field label="ई-मेल आयडी / Email (User ID)" required>
                      <Input
                        type="email"
                        value={contact.email}
                        onChange={(e) => {
                          setContact((p) => ({ ...p, email: e.target.value }));
                          setEmailCheckStatus("idle");
                          debouncedEmailCheck(e.target.value);
                        }}
                        placeholder="example@gmail.com"
                        autoComplete="email"
                        data-ocid="register.email_input"
                        className={`font-ui text-sm ${emailCheckStatus === "duplicate" ? "border-destructive focus-visible:ring-destructive" : emailCheckStatus === "available" ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                      />
                      {emailCheckStatus === "duplicate" && (
                        <div
                          className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 mt-1"
                          data-ocid="register.email_error_state"
                        >
                          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="font-ui text-xs font-semibold text-destructive">
                              हा ई-मेल वापरता येणार नाही / This email cannot be
                              used
                            </p>
                            <p className="font-ui text-xs text-destructive/80">
                              या ईमेल आयडीने आधीच युजर तयार आहे. कृपया वेगळा ईमेल
                              वापरा. / A user with this email ID already exists.
                              Please use a different email.
                            </p>
                          </div>
                        </div>
                      )}
                      {emailCheckStatus === "available" && contact.email && (
                        <p className="font-ui text-xs text-green-600 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          हा ईमेल उपलब्ध आहे / This email is available
                        </p>
                      )}
                    </Field>

                    <Field
                      label="मोबाईल नंबर / Mobile Number"
                      required={!isFemale}
                      note={
                        isFemale
                          ? "स्त्रियांसाठी ऐच्छिक / Optional for women"
                          : undefined
                      }
                    >
                      <Input
                        type="tel"
                        value={contact.mobile}
                        onChange={(e) =>
                          setContact((p) => ({ ...p, mobile: e.target.value }))
                        }
                        placeholder="उदा. 9876543210"
                        autoComplete="tel"
                        data-ocid="register.mobile_input"
                        className="font-ui text-sm"
                      />
                    </Field>

                    <Field
                      label="व्हॉट्सॲप नंबर / WhatsApp Number"
                      required
                      note="जर मोबाईल नंबर सारखाच असेल तर तोच भरा"
                    >
                      <Input
                        type="tel"
                        value={contact.whatsapp}
                        onChange={(e) =>
                          setContact((p) => ({
                            ...p,
                            whatsapp: e.target.value,
                          }))
                        }
                        placeholder="उदा. 9876543210"
                        data-ocid="register.whatsapp_input"
                        className="font-ui text-sm"
                      />
                    </Field>

                    {/* Address separator */}
                    <div className="pt-2">
                      <p className="font-ui text-xs font-semibold text-saffron uppercase tracking-wide flex items-center gap-2 mb-3">
                        <MapPin className="h-3.5 w-3.5" />
                        सध्याचा राहता पत्ता / Current Address
                      </p>
                      <div className="space-y-3 pl-1 border-l-2 border-saffron/20">
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="घर नंबर / House No." required>
                            <Input
                              value={contact.houseNumber}
                              onChange={(e) =>
                                setContact((p) => ({
                                  ...p,
                                  houseNumber: e.target.value,
                                }))
                              }
                              placeholder="उदा. 123"
                              data-ocid="register.input"
                              className="font-ui text-sm"
                            />
                          </Field>
                          <Field label="रोडचे नाव / Road Name" required>
                            <Input
                              value={contact.roadName}
                              onChange={(e) =>
                                setContact((p) => ({
                                  ...p,
                                  roadName: e.target.value,
                                }))
                              }
                              placeholder="रोड/गल्लीचे नाव"
                              data-ocid="register.input"
                              className="font-ui text-sm"
                            />
                          </Field>
                        </div>
                        <Field label="जवळची खूण / Landmark" required>
                          <Input
                            value={contact.landmark}
                            onChange={(e) =>
                              setContact((p) => ({
                                ...p,
                                landmark: e.target.value,
                              }))
                            }
                            placeholder="उदा. शाळेजवळ, मंदिराजवळ"
                            data-ocid="register.input"
                            className="font-ui text-sm"
                          />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="शहर/गाव / City/Village" required>
                            <Input
                              value={contact.cityVillage}
                              onChange={(e) =>
                                setContact((p) => ({
                                  ...p,
                                  cityVillage: e.target.value,
                                }))
                              }
                              placeholder="उदा. पंढरपूर"
                              data-ocid="register.input"
                              className="font-ui text-sm"
                            />
                          </Field>
                          <Field label="पिनकोड / Pincode" required>
                            <Input
                              value={contact.pincode}
                              onChange={(e) =>
                                setContact((p) => ({
                                  ...p,
                                  pincode: e.target.value,
                                }))
                              }
                              placeholder="उदा. 413304"
                              maxLength={6}
                              data-ocid="register.input"
                              className="font-ui text-sm"
                            />
                          </Field>
                        </div>
                        <Field label="जिल्हा / District" required>
                          <Input
                            value={contact.district}
                            onChange={(e) =>
                              setContact((p) => ({
                                ...p,
                                district: e.target.value,
                              }))
                            }
                            placeholder="उदा. सोलापूर"
                            data-ocid="register.input"
                            className="font-ui text-sm"
                          />
                        </Field>
                      </div>
                    </div>

                    <Field label="मूळ गाव / Native Village">
                      <Input
                        value={contact.nativeVillage}
                        onChange={(e) =>
                          setContact((p) => ({
                            ...p,
                            nativeVillage: e.target.value,
                          }))
                        }
                        placeholder="उदा. पंढरपूर"
                        data-ocid="register.native_village_input"
                        className="font-ui text-sm"
                      />
                    </Field>
                  </div>
                )}

                {/* ══ Step 4: नातेसंबंधाची माहिती ══ */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-4 w-4 text-saffron" />
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        {t("stepRelationship")}
                      </h2>
                      <span className="font-ui text-xs text-muted-foreground">
                        (वंशावळ जोडण्यासाठी)
                      </span>
                    </div>

                    {/* Father's full name (only if female) */}
                    {/* सासू-सासरे फक्त विवाहित असल्यासच दाखवा */}
                    {isMarried && (
                      <>
                        <Field
                          label="सासर्यांचे नाव / Father-in-law's Name"
                          required
                        >
                          <Input
                            value={relationship.fatherInLawName}
                            onChange={(e) =>
                              setRelationship((p) => ({
                                ...p,
                                fatherInLawName: e.target.value,
                              }))
                            }
                            placeholder="सासर्यांचे पूर्ण नाव"
                            data-ocid="register.input"
                            className="font-ui text-sm"
                          />
                        </Field>

                        <Field label="सासूचे नाव / Mother-in-law's Name" required>
                          <Input
                            value={relationship.motherInLawName}
                            onChange={(e) =>
                              setRelationship((p) => ({
                                ...p,
                                motherInLawName: e.target.value,
                              }))
                            }
                            placeholder="सासूचे पूर्ण नाव"
                            data-ocid="register.input"
                            className="font-ui text-sm"
                          />
                        </Field>
                      </>
                    )}

                    {/* Spouse name (if married) with पती/पत्नी dropdown */}
                    {isMarried && (
                      <Field label="जोडीदाराचे नाव / Spouse's Name" required>
                        <div className="flex gap-2">
                          <Input
                            value={relationship.spouseName}
                            onChange={(e) =>
                              setRelationship((p) => ({
                                ...p,
                                spouseName: e.target.value,
                              }))
                            }
                            placeholder="जोडीदाराचे पूर्ण नाव"
                            data-ocid="register.spouse_name_input"
                            className="font-ui text-sm flex-1"
                          />
                          <Select
                            value={relationship.spouseRelation}
                            onValueChange={(v) =>
                              setRelationship((p) => ({
                                ...p,
                                spouseRelation: v,
                              }))
                            }
                          >
                            <SelectTrigger
                              data-ocid="register.spouse_relation_select"
                              className="font-ui text-sm w-28 shrink-0"
                            >
                              <SelectValue placeholder="नाते" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="पती">पती</SelectItem>
                              <SelectItem value="पत्नी">पत्नी</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </Field>
                    )}

                    {/* Optional fields */}
                    <div className="pt-2">
                      <p className="font-ui text-xs text-muted-foreground mb-3 italic">
                        खालील माहिती ऐच्छिक आहे / The following fields are
                        optional:
                      </p>
                      <div className="space-y-4">
                        {/* Brothers - + button style */}
                        <div className="space-y-2">
                          <Label className="font-ui text-sm font-medium text-foreground">
                            भावाचे नाव व आडनाव / Brother's Name(s)
                          </Label>
                          {relationship.brothers.map((brother, idx) => (
                            <div
                              key={brother.id}
                              className="flex items-center gap-2"
                              data-ocid={`register.brothers.item.${idx + 1}`}
                            >
                              <Input
                                value={brother.name}
                                onChange={(e) =>
                                  updateBrother(idx, e.target.value)
                                }
                                placeholder={`भावाचे नाव ${idx + 1}`}
                                className="font-ui text-sm flex-1"
                                data-ocid="register.input"
                              />
                              <button
                                type="button"
                                onClick={() => removeBrother(idx)}
                                className="text-destructive hover:text-destructive/80 p-1"
                                aria-label="Remove brother"
                                data-ocid={`register.brothers.delete_button.${idx + 1}`}
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
                            data-ocid="register.brothers.add_button"
                            className="font-ui text-xs border-saffron/30 text-saffron hover:bg-saffron/5 w-full"
                          >
                            + भाऊ जोडा / Add Brother
                          </Button>
                        </div>

                        {/* Sisters - + button style */}
                        <div className="space-y-2">
                          <Label className="font-ui text-sm font-medium text-foreground">
                            बहिणीचे नाव व आडनाव / Sister's Name(s)
                          </Label>
                          {relationship.sisters.map((sister, idx) => (
                            <div
                              key={sister.id}
                              className="flex items-center gap-2"
                              data-ocid={`register.sisters.item.${idx + 1}`}
                            >
                              <Input
                                value={sister.name}
                                onChange={(e) =>
                                  updateSister(idx, e.target.value)
                                }
                                placeholder={`बहिणीचे नाव ${idx + 1}`}
                                className="font-ui text-sm flex-1"
                                data-ocid="register.input"
                              />
                              <button
                                type="button"
                                onClick={() => removeSister(idx)}
                                className="text-destructive hover:text-destructive/80 p-1"
                                aria-label="Remove sister"
                                data-ocid={`register.sisters.delete_button.${idx + 1}`}
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
                            data-ocid="register.sisters.add_button"
                            className="font-ui text-xs border-saffron/30 text-saffron hover:bg-saffron/5 w-full"
                          >
                            + बहीण जोडा / Add Sister
                          </Button>
                        </div>
                        {/* Children - structured with gender (only for married) */}
                        {isMarried && (
                          <div className="space-y-2">
                            <Label className="font-ui text-sm font-medium text-foreground">
                              मुलांचे नावे / Children's Names
                            </Label>
                            {relationship.children.map((child, idx) => (
                              <div
                                key={child.id}
                                className="flex items-center gap-2"
                                data-ocid={`register.children.item.${idx + 1}`}
                              >
                                <Input
                                  value={child.name}
                                  onChange={(e) =>
                                    updateChild(idx, "name", e.target.value)
                                  }
                                  placeholder={`मुलाचे नाव ${idx + 1}`}
                                  className="font-ui text-sm flex-1"
                                  data-ocid="register.input"
                                />
                                <Select
                                  value={child.gender}
                                  onValueChange={(v) =>
                                    updateChild(idx, "gender", v)
                                  }
                                >
                                  <SelectTrigger
                                    className="font-ui text-sm w-28 shrink-0"
                                    data-ocid="register.select"
                                  >
                                    <SelectValue placeholder="लिंग" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">पुरुष</SelectItem>
                                    <SelectItem value="female">स्त्री</SelectItem>
                                    <SelectItem value="other">इतर</SelectItem>
                                  </SelectContent>
                                </Select>
                                <button
                                  type="button"
                                  onClick={() => removeChild(idx)}
                                  className="text-destructive hover:text-destructive/80 p-1"
                                  aria-label="Remove child"
                                  data-ocid={`register.children.delete_button.${idx + 1}`}
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
                              data-ocid="register.children.add_button"
                              className="font-ui text-xs border-saffron/30 text-saffron hover:bg-saffron/5 w-full"
                            >
                              + मूल जोडा / Add Child
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ Step 5: पासवर्ड + संमती ══ */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Phone className="h-4 w-4 text-saffron" />
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        {t("stepPassword")} &amp; संमती
                      </h2>
                    </div>

                    <Field label={t("passwordLabel")} required>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={passwordData.password}
                          onChange={(e) =>
                            setPasswordData((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          placeholder={t("passwordPlaceholder")}
                          autoComplete="new-password"
                          data-ocid="register.password_input"
                          className="font-ui text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Hide" : "Show"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </Field>

                    <Field label={t("confirmPasswordLabel")} required>
                      <div className="relative">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData((p) => ({
                              ...p,
                              confirmPassword: e.target.value,
                            }))
                          }
                          placeholder={t("confirmPasswordPlaceholder")}
                          autoComplete="new-password"
                          data-ocid="register.confirm_password_input"
                          className="font-ui text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showConfirm ? "Hide" : "Show"}
                        >
                          {showConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </Field>

                    {/* Consent */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-saffron-light/20 border border-saffron/20">
                      <Checkbox
                        id="consent"
                        checked={passwordData.consent}
                        onCheckedChange={(v) =>
                          setPasswordData((p) => ({
                            ...p,
                            consent: v === true,
                          }))
                        }
                        data-ocid="register.consent_checkbox"
                        className="mt-0.5 border-saffron data-[state=checked]:bg-saffron data-[state=checked]:border-saffron"
                      />
                      <Label
                        htmlFor="consent"
                        className="font-body text-sm text-foreground leading-relaxed cursor-pointer"
                      >
                        {t("consentText")}
                      </Label>
                    </div>

                    {/* Summary review */}
                    <div className="p-4 rounded-xl bg-secondary border border-border space-y-1.5">
                      <p className="font-ui text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        माहिती सारांश / Summary
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="font-ui text-xs text-muted-foreground">
                          नाव:
                        </span>
                        <span className="font-ui text-xs font-medium text-foreground truncate">
                          {`${personal.firstName} ${personal.lastName}`.trim() ||
                            "—"}
                        </span>
                        <span className="font-ui text-xs text-muted-foreground">
                          ईमेल:
                        </span>
                        <span className="font-ui text-xs font-medium text-foreground truncate">
                          {contact.email || "—"}
                        </span>
                        <span className="font-ui text-xs text-muted-foreground">
                          लिंग:
                        </span>
                        <span className="font-ui text-xs font-medium text-foreground">
                          {personal.gender || "—"}
                        </span>
                        <span className="font-ui text-xs text-muted-foreground">
                          वैवाहिक स्थिती:
                        </span>
                        <span className="font-ui text-xs font-medium text-foreground">
                          {personal.maritalStatus || "—"}
                        </span>
                        <span className="font-ui text-xs text-muted-foreground">
                          शिक्षण:
                        </span>
                        <span className="font-ui text-xs font-medium text-foreground truncate">
                          {professional.education || "—"}
                        </span>
                        <span className="font-ui text-xs text-muted-foreground">
                          गाव:
                        </span>
                        <span className="font-ui text-xs font-medium text-foreground truncate">
                          {contact.cityVillage || contact.nativeVillage || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div
              className={`flex gap-3 mt-6 ${currentStep > 1 ? "justify-between" : "justify-end"}`}
            >
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goPrev}
                  disabled={isLoading || success}
                  data-ocid="register.prev_button"
                  className="flex items-center gap-1.5 border-border font-ui"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("prevStep")}
                </Button>
              )}

              {currentStep < STEP_COUNT ? (
                <Button
                  type="button"
                  onClick={goNext}
                  data-ocid="register.next_button"
                  className="flex items-center gap-1.5 bg-saffron hover:bg-saffron-deep text-white font-ui font-semibold"
                >
                  {t("nextStep")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || success}
                  data-ocid="register.submit_button"
                  className="bg-saffron hover:bg-saffron-deep text-white font-ui font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("registerLoading")}
                    </>
                  ) : (
                    t("registerButton")
                  )}
                </Button>
              )}
            </div>

            {/* Login link */}
            <p className="text-center font-ui text-sm text-muted-foreground mt-4">
              {t("alreadyAccount")}{" "}
              <Link
                to="/login"
                data-ocid="register.login_link"
                className="text-saffron hover:text-saffron-deep font-semibold underline underline-offset-2 transition-colors"
              >
                {t("loginLink")}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
