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
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = "vatavriksha_user_email";

const makeAdminProfile = (): UserProfile => ({
  id: "admin-1",
  name: "Admin",
  email: "admin@vatavriksha.com",
  passwordHash: "Admin@123",
  role: UserRole.admin,
  isActive: true,
  isVerified: true,
  createdAt: BigInt(0),
});

const makeGaneshProfile = (): UserProfile => ({
  id: "ganesh-focal-1",
  name: "गणेश सावलाराम अभंगराव",
  email: "ganesh.abhangrao@vatavriksha.com",
  passwordHash: "Ganeshdada@1982",
  role: UserRole.user,
  isActive: true,
  isVerified: true,
  createdAt: BigInt(0),
});

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clear: iiLogout } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const actorRef = useRef(actor);
  actorRef.current = actor;

  const loadUserByEmail = useCallback(
    async (email: string): Promise<UserProfile | null> => {
      const lc = email.toLowerCase();
      if (lc === "ganesh.abhangrao@vatavriksha.com") {
        const p = makeGaneshProfile();
        setCurrentUser(p);
        return p;
      }
      if (lc === "admin@vatavriksha.com") {
        const p = makeAdminProfile();
        setCurrentUser(p);
        return p;
      }

      const currentActor = actorRef.current;
      if (currentActor) {
        try {
          const profile = await currentActor.getUserProfileByEmail(email);
          if (profile) {
            let isActive = profile.isActive;
            try {
              isActive = await currentActor.isUserActive(email);
            } catch {
              /* ignore */
            }
            if (!isActive) {
              try {
                const approvedEmails: string[] = JSON.parse(
                  localStorage.getItem("vatavriksha_approved_emails") ?? "[]",
                );
                if (approvedEmails.includes(email)) isActive = true;
              } catch {
                /* ignore */
              }
            }
            if (isActive) {
              const p = { ...profile, isActive: true };
              setCurrentUser(p);
              return p;
            }
          }
        } catch {
          /* fall through */
        }
      }

      try {
        const approvedEmails: string[] = JSON.parse(
          localStorage.getItem("vatavriksha_approved_emails") ?? "[]",
        );
        if (approvedEmails.includes(email)) {
          const allRegs: Array<{ email: string; name?: string }> = JSON.parse(
            localStorage.getItem("vatavriksha_pending_registrations") ?? "[]",
          );
          const reg = allRegs.find((r) => r.email === email);
          const p: UserProfile = {
            id: email,
            name: reg?.name ?? email.split("@")[0],
            email,
            passwordHash: "",
            role: UserRole.user,
            isActive: true,
            isVerified: true,
            createdAt: BigInt(0),
          };
          setCurrentUser(p);
          return p;
        }
      } catch {
        /* ignore */
      }
      return null;
    },
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    const lc = stored.toLowerCase();
    // For hardcoded accounts, resolve immediately without async
    if (lc === "admin@vatavriksha.com") {
      setCurrentUser(makeAdminProfile());
      setIsLoading(false);
      return;
    }
    if (lc === "ganesh.abhangrao@vatavriksha.com") {
      setCurrentUser(makeGaneshProfile());
      setIsLoading(false);
      return;
    }
    // For regular users, async load
    loadUserByEmail(stored).finally(() => setIsLoading(false));
  }, []);

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

  const login = useCallback(
    async (email: string, password: string): Promise<UserProfile> => {
      const currentActor = actorRef.current;
      const lc = email.toLowerCase();

      if (
        lc === "ganesh.abhangrao@vatavriksha.com" &&
        password === "Ganeshdada@1982"
      ) {
        const p = makeGaneshProfile();
        setCurrentUser(p);
        const GANESH_EMAIL = "ganesh.abhangrao@vatavriksha.com";
        const existingApproved = localStore.getApprovedFamilyMembers();
        const existingMemberData = localStore.getMemberData(GANESH_EMAIL);
        if (
          !existingApproved.find((m) => m.email === GANESH_EMAIL) &&
          !existingMemberData
        ) {
          localStore.saveApprovedFamilyMember({
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
          });
        }
        localStorage.setItem(SESSION_KEY, email);
        return p;
      }

      if (lc === "admin@vatavriksha.com" && password === "Admin@123") {
        const p = makeAdminProfile();
        setCurrentUser(p);
        localStorage.setItem(SESSION_KEY, email);
        return p;
      }

      if (currentActor) {
        try {
          const profile = await currentActor.loginWithPassword(email, password);
          if (profile) {
            let isActive = profile.isActive;
            try {
              isActive = await currentActor.isUserActive(email);
            } catch {
              /* ignore */
            }
            if (!isActive) {
              try {
                const approvedEmails: string[] = JSON.parse(
                  localStorage.getItem("vatavriksha_approved_emails") ?? "[]",
                );
                if (approvedEmails.includes(email)) isActive = true;
              } catch {
                /* ignore */
              }
            }
            if (!isActive) throw new Error("PENDING_APPROVAL");
            const p = { ...profile, isActive: true };
            setCurrentUser(p);
            localStorage.setItem(SESSION_KEY, email);
            return p;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === "PENDING_APPROVAL") throw err;
        }
      }

      const allRegsRaw =
        localStorage.getItem("vatavriksha_pending_registrations") ?? "[]";
      let allRegs: Array<{ email: string; status: string; name?: string }> = [];
      try {
        allRegs = JSON.parse(allRegsRaw);
      } catch {
        /* ignore */
      }
      const reg = allRegs.find((r) => r.email === email);
      if (!reg) throw new Error("User not found");

      let storedPassword = "";
      try {
        const memberDataMap = JSON.parse(
          localStorage.getItem("vatavriksha_pending_member_data") ?? "{}",
        ) as Record<string, { passwordHash?: string }>;
        storedPassword = memberDataMap[email]?.passwordHash ?? "";
      } catch {
        /* ignore */
      }
      if (storedPassword && storedPassword !== password)
        throw new Error("Invalid password");

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
      if (!isApproved) throw new Error("PENDING_APPROVAL");

      const p: UserProfile = {
        id: reg.email,
        name: reg.name ?? email.split("@")[0],
        email: reg.email,
        passwordHash: password,
        role: UserRole.user,
        isActive: true,
        isVerified: true,
        createdAt: BigInt(0),
      };
      setCurrentUser(p);
      localStorage.setItem(SESSION_KEY, email);
      return p;
    },
    [],
  );

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
        isActive: false,
        isVerified: false,
        createdAt: BigInt(Date.now()),
      };
      await currentActor.registerUser(newProfile);
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) await loadUserByEmail(stored);
  }, [loadUserByEmail]);

  const isAdmin = currentUser?.role === UserRole.admin;
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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
