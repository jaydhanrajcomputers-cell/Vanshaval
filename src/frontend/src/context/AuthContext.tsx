import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { UserProfile } from "../backend.d";
import { UserRole } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { localStore } from "../utils/localStore";

interface AuthContextValue {
  currentUser: UserProfile | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "vatavriksha_user_email";

// Inner component that has access to useActor (must be inside QueryClientProvider)
function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clear: iiLogout } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  // Track actor ref so we can use latest actor in callbacks
  const actorRef = useRef(actor);
  actorRef.current = actor;

  const loadUserByEmail = useCallback(async (email: string) => {
    // Ganesh focal person: permanent protected account
    if (email.toLowerCase() === "ganesh.abhangrao@vatavriksha.com") {
      const ganeshProfile: UserProfile = {
        id: "ganesh-focal-1",
        name: "गणेश सावलाराम अभंगराव",
        email: "ganesh.abhangrao@vatavriksha.com",
        passwordHash: "Ganeshdada@1982",
        role: UserRole.user,
        isActive: true,
        isVerified: true,
        createdAt: BigInt(0),
      };
      setCurrentUser(ganeshProfile);
      return ganeshProfile;
    }

    if (email.toLowerCase() === "admin@vatavriksha.com") {
      const adminProfile: UserProfile = {
        id: "admin-1",
        name: "Admin",
        email: "admin@vatavriksha.com",
        passwordHash: "Admin@123",
        role: UserRole.admin,
        isActive: true,
        isVerified: true,
        createdAt: BigInt(0),
      };
      setCurrentUser(adminProfile);
      return adminProfile;
    }

    const currentActor = actorRef.current;

    // Try backend
    if (currentActor) {
      try {
        const profile = await currentActor.getUserProfileByEmail(email);
        if (profile) {
          let isActive = profile.isActive;
          try {
            isActive = await currentActor.isUserActive(email);
          } catch {
            isActive = profile.isActive;
          }

          // Fallback: check localStorage approved emails list
          if (!isActive) {
            try {
              const approvedEmails: string[] = JSON.parse(
                localStorage.getItem("vatavriksha_approved_emails") ?? "[]",
              );
              if (approvedEmails.includes(email)) {
                isActive = true;
              }
            } catch {
              // ignore
            }
          }

          if (isActive) {
            const activeProfile = { ...profile, isActive: true };
            setCurrentUser(activeProfile);
            return activeProfile;
          }
        }
      } catch {
        // Backend failed — fall through to localStorage
      }
    }

    // Fallback: check localStorage approvals
    try {
      const approvedEmails: string[] = JSON.parse(
        localStorage.getItem("vatavriksha_approved_emails") ?? "[]",
      );
      if (approvedEmails.includes(email)) {
        const allRegs: Array<{ email: string; name?: string }> = JSON.parse(
          localStorage.getItem("vatavriksha_pending_registrations") ?? "[]",
        );
        const reg = allRegs.find((r) => r.email === email);
        const localProfile: UserProfile = {
          id: email,
          name: reg?.name ?? email.split("@")[0],
          email,
          passwordHash: "",
          role: UserRole.user,
          isActive: true,
          isVerified: true,
          createdAt: BigInt(0),
        };
        setCurrentUser(localProfile);
        return localProfile;
      }
    } catch {
      // ignore
    }

    return null;
  }, []);

  // Restore session immediately on mount - don't wait for actor
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      loadUserByEmail(stored).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []); // intentionally run once on mount only

  // When actor becomes available, refresh regular user data from backend
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadUserByEmail uses actorRef.current internally
  useEffect(() => {
    if (!actor) return;
    const stored = localStorage.getItem(SESSION_KEY);
    if (
      stored &&
      stored.toLowerCase() !== "admin@vatavriksha.com" &&
      stored.toLowerCase() !== "ganesh.abhangrao@vatavriksha.com"
    ) {
      loadUserByEmail(stored);
    }
  }, [actor]);

  const login = useCallback(async (email: string, password: string) => {
    const currentActor = actorRef.current;

    // ── Ganesh focal person: permanent protected account ──
    if (
      email.toLowerCase() === "ganesh.abhangrao@vatavriksha.com" &&
      password === "Ganeshdada@1982"
    ) {
      const ganeshProfile: UserProfile = {
        id: "ganesh-focal-1",
        name: "गणेश सावलाराम अभंगराव",
        email: "ganesh.abhangrao@vatavriksha.com",
        passwordHash: "Ganeshdada@1982",
        role: UserRole.user,
        isActive: true,
        isVerified: true,
        createdAt: BigInt(0),
      };
      setCurrentUser(ganeshProfile);
      // Ensure Ganesh always has a PendingMemberData profile in localStore
      // so ProfilePage can display it even if he never went through registration
      const GANESH_EMAIL = "ganesh.abhangrao@vatavriksha.com";
      const existingApproved = localStore.getApprovedFamilyMembers();
      const existingMemberData = localStore.getMemberData(GANESH_EMAIL);
      if (
        !existingApproved.find((m) => m.email === GANESH_EMAIL) &&
        !existingMemberData
      ) {
        const blankProfile = {
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
        localStore.saveApprovedFamilyMember(blankProfile);
      }
      localStorage.setItem(SESSION_KEY, email);
      return;
    }

    // ── Admin shortcut: hardcoded fallback so admin can always log in ──
    if (
      email.toLowerCase() === "admin@vatavriksha.com" &&
      password === "Admin@123"
    ) {
      const adminProfile: UserProfile = {
        id: "admin-1",
        name: "Admin",
        email: "admin@vatavriksha.com",
        passwordHash: "Admin@123",
        role: UserRole.admin,
        isActive: true,
        isVerified: true,
        createdAt: BigInt(0),
      };
      setCurrentUser(adminProfile);
      localStorage.setItem(SESSION_KEY, email);
      return;
    }

    // ── Regular user: try backend first ──
    if (currentActor) {
      try {
        const profile = await currentActor.loginWithPassword(email, password);
        if (profile) {
          // Check if active
          let isActive = profile.isActive;

          // Try backend isUserActive
          try {
            isActive = await currentActor.isUserActive(email);
          } catch {
            isActive = profile.isActive;
          }

          // Fallback: check localStorage approved emails list
          if (!isActive) {
            try {
              const approvedEmails: string[] = JSON.parse(
                localStorage.getItem("vatavriksha_approved_emails") ?? "[]",
              );
              if (approvedEmails.includes(email)) {
                isActive = true;
              }
            } catch {
              // ignore
            }
          }

          if (!isActive) {
            throw new Error("PENDING_APPROVAL");
          }

          const activeProfile = { ...profile, isActive: true };
          setCurrentUser(activeProfile);
          localStorage.setItem(SESSION_KEY, email);
          return;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "PENDING_APPROVAL") throw err;
        // Backend failed — fall through to localStorage check
      }
    }

    // ── Fallback: check localStorage registrations ──
    const allRegsRaw =
      localStorage.getItem("vatavriksha_pending_registrations") ?? "[]";
    let allRegs: Array<{ email: string; status: string; name?: string }> = [];
    try {
      allRegs = JSON.parse(allRegsRaw);
    } catch {
      /* ignore */
    }

    const reg = allRegs.find((r) => r.email === email);
    if (!reg) {
      throw new Error("User not found");
    }

    // Check stored password hash from localStorage member data
    let storedPassword = "";
    try {
      const memberDataMap = JSON.parse(
        localStorage.getItem("vatavriksha_pending_member_data") ?? "{}",
      ) as Record<string, { passwordHash?: string }>;
      storedPassword = memberDataMap[email]?.passwordHash ?? "";
    } catch {
      /* ignore */
    }

    if (storedPassword && storedPassword !== password) {
      throw new Error("Invalid password");
    }

    // Check if approved
    let approvedEmails: string[] = [];
    try {
      approvedEmails = JSON.parse(
        localStorage.getItem("vatavriksha_approved_emails") ?? "[]",
      );
    } catch {
      /* ignore */
    }

    const isApproved =
      reg.status === "approved" || approvedEmails.includes(email);
    if (!isApproved) {
      throw new Error("PENDING_APPROVAL");
    }

    // Build profile from localStorage data
    const localProfile: UserProfile = {
      id: reg.email,
      name: reg.name ?? email.split("@")[0],
      email: reg.email,
      passwordHash: password,
      role: UserRole.user,
      isActive: true,
      isVerified: true,
      createdAt: BigInt(0),
    };
    setCurrentUser(localProfile);
    localStorage.setItem(SESSION_KEY, email);
  }, []);

  const logout = useCallback(async () => {
    await iiLogout();
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    queryClient.clear();
  }, [iiLogout, queryClient]);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const currentActor = actorRef.current;
      if (!currentActor) throw new Error("Actor not ready");
      const newProfile: UserProfile = {
        id: crypto.randomUUID(),
        name,
        email,
        passwordHash: password,
        role: UserRole.user,
        isActive: false, // Requires admin approval
        isVerified: false,
        createdAt: BigInt(Date.now()),
      };
      await currentActor.registerUser(newProfile);
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      await loadUserByEmail(stored);
    }
  }, [loadUserByEmail]);

  const isAdmin = currentUser?.role === "admin";
  const isLoggedIn = currentUser !== null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isLoggedIn,
        isLoading,
        login,
        logout,
        register,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
