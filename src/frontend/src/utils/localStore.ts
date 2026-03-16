// localStore.ts — localStorage-based pending registrations store
// Used because the backend uses principal-based auth which fails for anonymous callers.
// Admin approvals are stored in the admin's browser localStorage.

export interface PendingRegistration {
  id: string;
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  bloodGroup: string;
  gender: string;
  birthDate: string;
  address: string;
  nativeVillage: string;
  education: string;
  occupation: string;
  occupationType: string;
  maritalStatus: string;
  registeredAt: number; // timestamp
  status: "pending" | "approved" | "rejected";
}

// Full FamilyMember-compatible data saved at registration time
export interface PendingMemberData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  gender: string;
  maritalStatus: string;
  motherName: string;
  fatherName: string;
  husbandName: string;
  birthDate: string;
  birthTime: string;
  bloodGroup: string;
  marriageDate: string;
  deathDate: string;
  isDeceased: boolean;
  photoData: string;
  education: string;
  occupationType: string;
  occupation: string;
  additionalInfo: string;
  mobile: string;
  whatsapp: string;
  houseNumber: string;
  roadName: string;
  landmark: string;
  cityVillage: string;
  pincode: string;
  district: string;
  address: string;
  nativeVillage: string;
  fatherFullName: string;
  motherFullName: string;
  fatherInLawName: string;
  motherInLawName: string;
  spouseName: string;
  brotherNames: string;
  sisterNames: string;
  childrenNames: string;
  passwordHash?: string;
}

const PENDING_KEY = "vatavriksha_pending_registrations";
const APPROVED_KEY = "vatavriksha_approved_emails";
const MEMBER_DATA_KEY = "vatavriksha_pending_member_data";
const APPROVED_MEMBERS_KEY = "vatavriksha_approved_members";
const FAMILY_TREE_KEY = "vatavriksha_family_tree_members";
const GALLERY_PHOTOS_KEY = "vatavriksha_gallery_photos";
const PHOTO_PREFIX = "vatavriksha_photo_"; // Per-user photo key to avoid quota issues

function getAllRegistrations(): PendingRegistration[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingRegistration[];
  } catch {
    return [];
  }
}

function saveAll(regs: PendingRegistration[]): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(regs));
}

function getApprovedEmails(): string[] {
  try {
    const raw = localStorage.getItem(APPROVED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveApprovedEmails(emails: string[]): void {
  localStorage.setItem(APPROVED_KEY, JSON.stringify(emails));
}

function getAllMemberData(): Record<string, PendingMemberData> {
  try {
    const raw = localStorage.getItem(MEMBER_DATA_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PendingMemberData>;
  } catch {
    return {};
  }
}

function saveMemberData(data: Record<string, PendingMemberData>): void {
  // Strip photoData from member data record before saving to avoid quota issues
  // Photos are stored separately under PHOTO_PREFIX keys
  const stripped: Record<string, PendingMemberData> = {};
  for (const [k, v] of Object.entries(data)) {
    stripped[k] = { ...v, photoData: "" };
  }
  try {
    localStorage.setItem(MEMBER_DATA_KEY, JSON.stringify(stripped));
  } catch {
    // If still quota exceeded, clear old data and retry
    try {
      localStorage.removeItem(MEMBER_DATA_KEY);
      localStorage.setItem(MEMBER_DATA_KEY, JSON.stringify(stripped));
    } catch {
      // ignore
    }
  }
}

/** Save photo data separately to avoid polluting the main member data object */
function savePhotoData(email: string, photoData: string): void {
  if (!photoData) return;
  try {
    localStorage.setItem(`${PHOTO_PREFIX}${email}`, photoData);
  } catch {
    // Quota exceeded for photo — silently skip (photo is optional for tree)
  }
}

/** Get photo data for a given email */
function getPhotoData(email: string): string {
  try {
    return localStorage.getItem(`${PHOTO_PREFIX}${email}`) ?? "";
  } catch {
    return "";
  }
}

/** Remove photo data for a given email */
function removePhotoData(email: string): void {
  try {
    localStorage.removeItem(`${PHOTO_PREFIX}${email}`);
  } catch {
    // ignore
  }
}

/** Get photo by id or email — tries direct key then scans for substring match */
function getPhotoByIdOrEmail(idOrEmail: string): string {
  if (!idOrEmail) return "";
  try {
    // 1. Direct key lookup
    const direct = localStorage.getItem(`${PHOTO_PREFIX}${idOrEmail}`);
    if (direct) return direct;
    // 2. Scan all keys for substring match
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PHOTO_PREFIX) && key.includes(idOrEmail)) {
        const val = localStorage.getItem(key);
        if (val) return val;
      }
    }
  } catch {
    // ignore
  }
  return "";
}

export const localStore = {
  /** Save a new registration (status = pending) */
  addPendingRegistration(reg: PendingRegistration): void {
    const all = getAllRegistrations();
    // Avoid duplicates by email
    const existing = all.findIndex((r) => r.email === reg.email);
    if (existing >= 0) {
      all[existing] = reg;
    } else {
      all.push(reg);
    }
    saveAll(all);
  },

  /** Get only pending registrations */
  getPendingRegistrations(): PendingRegistration[] {
    return getAllRegistrations().filter((r) => r.status === "pending");
  },

  /** Get all registrations regardless of status */
  getAllRegistrations(): PendingRegistration[] {
    return getAllRegistrations();
  },

  /** Approve a registration by email */
  approveRegistration(email: string): void {
    const all = getAllRegistrations();
    const updated = all.map((r) =>
      r.email === email ? { ...r, status: "approved" as const } : r,
    );
    saveAll(updated);

    // Also add to approved emails list
    const approved = getApprovedEmails();
    if (!approved.includes(email)) {
      approved.push(email);
      saveApprovedEmails(approved);
    }
  },

  /** Remove a registration by email (used when duplicate detected after localStorage save) */
  removePendingRegistration(email: string): void {
    const all = getAllRegistrations();
    saveAll(all.filter((r) => r.email !== email));
    // Also clean up member data
    const memberData = getAllMemberData();
    delete memberData[email];
    saveMemberData(memberData);
    // Also clean up photo
    removePhotoData(email);
  },

  /** Reject a registration by email */
  rejectRegistration(email: string): void {
    const all = getAllRegistrations();
    const updated = all.map((r) =>
      r.email === email ? { ...r, status: "rejected" as const } : r,
    );
    saveAll(updated);

    // Remove from approved emails if present
    const approved = getApprovedEmails().filter((e) => e !== email);
    saveApprovedEmails(approved);
  },

  /** Check if email has been approved (either in localStorage or backend) */
  isEmailApproved(email: string): boolean {
    return getApprovedEmails().includes(email);
  },

  /** Get pending count for dashboard */
  getPendingCount(): number {
    return getAllRegistrations().filter((r) => r.status === "pending").length;
  },

  /** Save full member data keyed by email (for later FamilyMember creation on approval) */
  saveMemberData(data: PendingMemberData): void {
    // Save photo separately to avoid quota issues
    if (data.photoData) {
      savePhotoData(data.email, data.photoData);
    }
    const all = getAllMemberData();
    // Store without photoData in main object
    all[data.email] = { ...data, photoData: "" };
    saveMemberData(all);
  },

  /** Get full member data for a given email (photo loaded from separate key) */
  getMemberData(email: string): PendingMemberData | null {
    const all = getAllMemberData();
    const data = all[email] ?? null;
    if (!data) return null;
    // Re-attach photo from separate storage
    return { ...data, photoData: data.photoData || getPhotoData(email) };
  },

  /** Remove member data after it's been used */
  removeMemberData(email: string): void {
    const all = getAllMemberData();
    delete all[email];
    saveMemberData(all);
    // NOTE: photo (vatavriksha_photo_${email}) is intentionally kept for tree display
  },

  /** Save an approved member's full data for Family Tree display */
  saveApprovedFamilyMember(member: PendingMemberData): void {
    try {
      // Save photo separately, strip from main record to avoid quota issues
      if (member.photoData) {
        savePhotoData(member.email, member.photoData);
      }
      const raw = localStorage.getItem(APPROVED_MEMBERS_KEY);
      const members: PendingMemberData[] = raw ? JSON.parse(raw) : [];
      const idx = members.findIndex((m) => m.email === member.email);
      const memberWithoutPhoto = { ...member, photoData: "" };
      if (idx >= 0) {
        members[idx] = memberWithoutPhoto;
      } else {
        members.push(memberWithoutPhoto);
      }
      try {
        localStorage.setItem(APPROVED_MEMBERS_KEY, JSON.stringify(members));
      } catch {
        // Quota: clear and retry
        localStorage.removeItem(APPROVED_MEMBERS_KEY);
        localStorage.setItem(
          APPROVED_MEMBERS_KEY,
          JSON.stringify([memberWithoutPhoto]),
        );
      }
    } catch {
      // ignore
    }
  },

  /** Get all approved family members from localStorage (photo re-attached) */
  getApprovedFamilyMembers(): PendingMemberData[] {
    try {
      const raw = localStorage.getItem(APPROVED_MEMBERS_KEY);
      const members = raw ? (JSON.parse(raw) as PendingMemberData[]) : [];
      // Re-attach photos from separate storage
      return members.map((m) => ({
        ...m,
        photoData: m.photoData || getPhotoByIdOrEmail(m.email),
      }));
    } catch {
      return [];
    }
  },

  /** Remove an approved family member from localStorage by email */
  removeApprovedFamilyMember(email: string): void {
    try {
      const raw = localStorage.getItem(APPROVED_MEMBERS_KEY);
      const members: PendingMemberData[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(
        APPROVED_MEMBERS_KEY,
        JSON.stringify(members.filter((m) => m.email !== email)),
      );
    } catch {
      // ignore
    }
  },

  // ── Family Tree Members (localStorage-first for admin operations) ──

  /** Get all family tree members stored in localStorage (photo re-attached) */
  getFamilyTreeMembers(): LocalFamilyMember[] {
    try {
      const raw = localStorage.getItem(FAMILY_TREE_KEY);
      if (!raw) return [];
      const members = JSON.parse(raw) as LocalFamilyMember[];
      // Re-attach photos from separate storage — try id first, then email
      return members.map((m) => {
        if (m.photoData) return m;
        const byId = getPhotoData(m.id);
        if (byId) return { ...m, photoData: byId };
        const emailKey = m.email || "";
        if (emailKey) {
          const byEmail = getPhotoData(emailKey);
          if (byEmail) return { ...m, photoData: byEmail };
        }
        // Fallback: substring scan
        const scanned = getPhotoByIdOrEmail(m.id);
        return { ...m, photoData: scanned };
      });
    } catch {
      return [];
    }
  },

  /** Add or update a family member in localStorage (upsert by id) */
  saveFamilyTreeMember(member: LocalFamilyMember): void {
    try {
      // Save photo separately using BOTH email and id as keys so lookups always succeed
      const emailKey = member.email || "";
      if (member.photoData) {
        // Save under id key always
        savePhotoData(member.id, member.photoData);
        // Also save under email key if available
        if (emailKey) savePhotoData(emailKey, member.photoData);
      } else if (emailKey) {
        // Try to pull photo from email key if we have one but member has no photoData
        const existingPhoto = getPhotoData(emailKey);
        if (existingPhoto) {
          // Mirror photo under id key for future lookups
          savePhotoData(member.id, existingPhoto);
        }
      }
      const memberWithoutPhoto = { ...member, photoData: "" };
      const raw = localStorage.getItem(FAMILY_TREE_KEY);
      const members: LocalFamilyMember[] = raw ? JSON.parse(raw) : [];
      const idx = members.findIndex((m) => m.id === member.id);
      if (idx >= 0) {
        members[idx] = memberWithoutPhoto;
      } else {
        members.push(memberWithoutPhoto);
      }
      try {
        localStorage.setItem(FAMILY_TREE_KEY, JSON.stringify(members));
      } catch {
        // Quota: try to save without oldest entries
        localStorage.removeItem(FAMILY_TREE_KEY);
        localStorage.setItem(
          FAMILY_TREE_KEY,
          JSON.stringify([memberWithoutPhoto]),
        );
      }
    } catch {
      // ignore
    }
  },

  /** Update (alias for save) */
  updateFamilyTreeMember(member: LocalFamilyMember): void {
    localStore.saveFamilyTreeMember(member);
  },

  /** Remove a family tree member by id */
  deleteFamilyTreeMember(id: string): void {
    try {
      const members = localStore.getFamilyTreeMembers();
      localStorage.setItem(
        FAMILY_TREE_KEY,
        JSON.stringify(members.filter((m) => m.id !== id)),
      );
    } catch {
      // ignore
    }
  },

  // ── Gallery Photos (localStorage-first for photo upload) ──

  /** Get all gallery photos from localStorage */
  getGalleryPhotos(): LocalGalleryPhoto[] {
    try {
      const raw = localStorage.getItem(GALLERY_PHOTOS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as LocalGalleryPhoto[];
    } catch {
      return [];
    }
  },

  /** Add or update a gallery photo in localStorage (upsert by id) */
  saveGalleryPhoto(photo: LocalGalleryPhoto): void {
    try {
      const photos = localStore.getGalleryPhotos();
      const idx = photos.findIndex((p) => p.id === photo.id);
      if (idx >= 0) {
        photos[idx] = photo;
      } else {
        photos.push(photo);
      }
      localStorage.setItem(GALLERY_PHOTOS_KEY, JSON.stringify(photos));
    } catch {
      // ignore
    }
  },

  /** Update a photo's approvedStatus */
  updateGalleryPhotoStatus(photoId: string, status: string): void {
    try {
      const photos = localStore.getGalleryPhotos();
      const updated = photos.map((p) =>
        p.id === photoId ? { ...p, approvedStatus: status } : p,
      );
      localStorage.setItem(GALLERY_PHOTOS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  /** Update a photo's category */
  updateGalleryPhotoCategory(photoId: string, newCategory: string): void {
    try {
      const photos = localStore.getGalleryPhotos();
      const updated = photos.map((p) =>
        p.id === photoId ? { ...p, category: newCategory } : p,
      );
      localStorage.setItem(GALLERY_PHOTOS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  /** Delete a gallery photo from localStorage */
  deleteGalleryPhoto(photoId: string): void {
    try {
      const photos = localStore.getGalleryPhotos();
      localStorage.setItem(
        GALLERY_PHOTOS_KEY,
        JSON.stringify(photos.filter((p) => p.id !== photoId)),
      );
    } catch {
      // ignore
    }
  },

  /**
   * Get photo data by member id or email.
   * Tries direct key first, then scans all vatavriksha_photo_* keys for a substring match.
   */
  getPhotoByIdOrEmail(idOrEmail: string): string {
    return getPhotoByIdOrEmail(idOrEmail);
  },
};

// ── Minimal type interfaces for localStorage-stored data ─────────────────────
// These mirror the backend types but without bigint (localStorage uses number)

export interface LocalFamilyMember {
  id: string;
  email?: string; // optional email used as photo key
  name: string;
  firstName: string;
  lastName: string;
  gender: string;
  maritalStatus: string;
  motherName: string;
  fatherName: string;
  husbandName: string;
  birthDate: string;
  birthTime: string;
  bloodGroup: string;
  marriageDate: string;
  deathDate: string;
  isDeceased: boolean;
  photoData: string;
  education: string;
  occupationType: string;
  occupation: string;
  additionalInfo: string;
  mobile: string;
  whatsapp: string;
  houseNumber: string;
  roadName: string;
  landmark: string;
  cityVillage: string;
  pincode: string;
  district: string;
  address: string;
  nativeVillage: string;
  village: string;
  fatherFullName: string;
  motherFullName: string;
  fatherInLawName: string;
  motherInLawName: string;
  spouseName: string;
  brotherNames: string;
  sisterNames: string;
  childrenNames: string;
  fatherId: string;
  motherId: string;
  spouseIds: string[];
  childrenIds: string[];
  brotherIds: string[];
  sisterIds: string[];
  fatherInLawId: string;
  motherInLawId: string;
  createdAt: number; // stored as number (not bigint) in localStorage
  createdBy: string;
}

export interface LocalGalleryPhoto {
  id: string;
  photoData: string;
  approvedStatus: string;
  uploaderName: string;
  createdAt: number; // stored as number (not bigint) in localStorage
  caption: string;
  category: string;
  uploadedBy: string;
}
