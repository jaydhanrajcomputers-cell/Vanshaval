import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PatriarchInfo {
    title: string;
    inspirationalMessage: string;
    name: string;
}
export interface GalleryPhoto {
    id: string;
    photoData: string;
    approvedStatus: string;
    uploaderName: string;
    createdAt: Time;
    caption: string;
    category: string;
    uploadedBy: string;
}
export type Time = bigint;
export interface RelationshipRequest {
    id: string;
    status: string;
    relationType: string;
    note: string;
    createdAt: Time;
    toMemberId: string;
    fromUserId: string;
    fromMemberName: string;
}
export interface FamilyMember {
    id: string;
    occupation: string;
    photoData: string;
    additionalInfo: string;
    roadName: string;
    fatherId: string;
    spouseIds: Array<string>;
    houseNumber: string;
    childrenNames: string;
    marriageDate: string;
    fatherFullName: string;
    deathDate: string;
    birthDate: string;
    birthTime: string;
    motherInLawName: string;
    isDeceased: boolean;
    brotherIds: Array<string>;
    motherInLawId: string;
    name: string;
    createdAt: Time;
    createdBy: string;
    motherFullName: string;
    education: string;
    whatsapp: string;
    nativeVillage: string;
    motherName: string;
    husbandName: string;
    district: string;
    fatherInLawName: string;
    fatherName: string;
    sisterNames: string;
    bloodGroup: string;
    address: string;
    village: string;
    gender: string;
    occupationType: string;
    landmark: string;
    sisterIds: Array<string>;
    cityVillage: string;
    mobile: string;
    fatherInLawId: string;
    pincode: string;
    spouseName: string;
    lastName: string;
    childrenIds: Array<string>;
    maritalStatus: string;
    brotherNames: string;
    motherId: string;
    firstName: string;
}
export interface PendingRegistration {
    id: string;
    occupation: string;
    status: string;
    photoData: string;
    additionalInfo: string;
    roadName: string;
    houseNumber: string;
    childrenNames: string;
    marriageDate: string;
    fatherFullName: string;
    deathDate: string;
    birthDate: string;
    birthTime: string;
    motherInLawName: string;
    isDeceased: boolean;
    name: string;
    motherFullName: string;
    education: string;
    whatsapp: string;
    nativeVillage: string;
    motherName: string;
    husbandName: string;
    email: string;
    district: string;
    fatherInLawName: string;
    fatherName: string;
    sisterNames: string;
    bloodGroup: string;
    address: string;
    gender: string;
    occupationType: string;
    landmark: string;
    cityVillage: string;
    mobile: string;
    pincode: string;
    spouseName: string;
    registeredAt: Time;
    lastName: string;
    maritalStatus: string;
    brotherNames: string;
    firstName: string;
}
export interface UserProfile {
    id: string;
    name: string;
    createdAt: Time;
    role: UserRole;
    isActive: boolean;
    email: string;
    isVerified: boolean;
    passwordHash: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFamilyMember(member: FamilyMember): Promise<string>;
    addGalleryPhoto(photo: GalleryPhoto): Promise<string>;
    adminToggleUserActive(email: string, isActive: boolean): Promise<void>;
    adminUpdatePatriarchInfo(newInfo: PatriarchInfo): Promise<void>;
    adminUpdateUserRole(email: string, newRole: UserRole): Promise<void>;
    approveGalleryPhoto(photoId: string): Promise<void>;
    approveRegistration(email: string): Promise<void>;
    approveRelationshipRequest(requestId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteFamilyMember(id: string): Promise<void>;
    deleteGalleryPhoto(photoId: string): Promise<void>;
    getAllFamilyMembers(): Promise<Array<FamilyMember>>;
    getAllFamilyMembersForBackup(): Promise<Array<FamilyMember>>;
    getAllGalleryPhotosForBackup(): Promise<Array<GalleryPhoto>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getAllUsersForBackup(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    getFamilyMember(id: string): Promise<FamilyMember>;
    getGalleryPhotoCount(): Promise<bigint>;
    getGalleryPhotos(): Promise<Array<GalleryPhoto>>;
    getGalleryPhotosByCategory(category: string): Promise<Array<GalleryPhoto>>;
    getMyRelationshipRequests(userId: string): Promise<Array<RelationshipRequest>>;
    getPatriarchId(): Promise<string>;
    getPatriarchInfo(): Promise<PatriarchInfo>;
    getPendingGalleryPhotos(): Promise<Array<GalleryPhoto>>;
    getPendingRegistrations(): Promise<Array<PendingRegistration>>;
    getRelationshipRequests(): Promise<Array<RelationshipRequest>>;
    getUserProfile(userPrincipal: Principal): Promise<UserProfile>;
    getUserProfileByEmail(email: string): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    isUserActive(email: string): Promise<boolean>;
    loginWithPassword(email: string, providedPassword: string): Promise<UserProfile>;
    registerUser(profile: UserProfile): Promise<void>;
    rejectRegistration(email: string): Promise<void>;
    rejectRelationshipRequest(requestId: string, note: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitPendingRegistration(reg: PendingRegistration): Promise<void>;
    submitRelationshipRequest(request: RelationshipRequest): Promise<string>;
    updateFamilyMember(member: FamilyMember): Promise<void>;
    updateGalleryPhotoCategory(photoId: string, newCategory: string): Promise<void>;
    updateUserProfile(updatedProfile: UserProfile): Promise<void>;
}
