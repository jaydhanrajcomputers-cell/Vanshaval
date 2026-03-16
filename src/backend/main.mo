import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type PatriarchInfo = {
    name : Text;
    title : Text;
    inspirationalMessage : Text;
  };

  type UserProfile = {
    id : Text;
    name : Text;
    email : Text;
    passwordHash : Text;
    role : AccessControl.UserRole;
    createdAt : Time.Time;
    isVerified : Bool;
    isActive : Bool;
  };

  type FamilyMember = {
    id : Text;
    name : Text;
    gender : Text;
    occupationType : Text;
    firstName : Text;
    lastName : Text;
    birthDate : Text;
    deathDate : Text;
    isDeceased : Bool;
    bloodGroup : Text;
    village : Text;
    occupation : Text;
    education : Text;
    additionalInfo : Text;
    fatherId : Text;
    motherId : Text;
    spouseIds : [Text];
    childrenIds : [Text];
    brotherIds : [Text];
    sisterIds : [Text];
    createdBy : Text;
    createdAt : Time.Time;
    mobile : Text;
    whatsapp : Text;
    address : Text;
    nativeVillage : Text;
    maritalStatus : Text;
    birthTime : Text;
    marriageDate : Text;
    fatherInLawId : Text;
    motherInLawId : Text;
    houseNumber : Text;
    roadName : Text;
    landmark : Text;
    cityVillage : Text;
    pincode : Text;
    district : Text;
    fatherName : Text;
    motherName : Text;
    husbandName : Text;
    fatherFullName : Text;
    motherFullName : Text;
    fatherInLawName : Text;
    motherInLawName : Text;
    spouseName : Text;
    brotherNames : Text;
    sisterNames : Text;
    childrenNames : Text;
    photoData : Text;
  };

  type RelationshipRequest = {
    id : Text;
    fromUserId : Text;
    fromMemberName : Text;
    toMemberId : Text;
    relationType : Text;
    status : Text;
    note : Text;
    createdAt : Time.Time;
  };

  type GalleryPhoto = {
    id : Text;
    uploadedBy : Text;
    uploaderName : Text;
    category : Text;
    caption : Text;
    photoData : Text;
    approvedStatus : Text;
    createdAt : Time.Time;
  };

  type PendingRegistration = {
    id : Text;
    name : Text;
    email : Text;
    mobile : Text;
    whatsapp : Text;
    bloodGroup : Text;
    gender : Text;
    birthDate : Text;
    address : Text;
    nativeVillage : Text;
    education : Text;
    occupation : Text;
    occupationType : Text;
    maritalStatus : Text;
    registeredAt : Time.Time;
    status : Text;
    firstName : Text;
    lastName : Text;
    motherName : Text;
    fatherName : Text;
    husbandName : Text;
    birthTime : Text;
    marriageDate : Text;
    deathDate : Text;
    isDeceased : Bool;
    photoData : Text;
    additionalInfo : Text;
    houseNumber : Text;
    roadName : Text;
    landmark : Text;
    cityVillage : Text;
    pincode : Text;
    district : Text;
    fatherFullName : Text;
    motherFullName : Text;
    fatherInLawName : Text;
    motherInLawName : Text;
    spouseName : Text;
    brotherNames : Text;
    sisterNames : Text;
    childrenNames : Text;
  };

  module UserProfile {
    public func compare(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      switch (Text.compare(profile1.name, profile2.name)) {
        case (#equal) { Text.compare(profile1.email, profile2.email) };
        case (order) { order };
      };
    };

    public func compareByEmail(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      Text.compare(profile1.email, profile2.email);
    };
  };

  let users = Map.empty<Text, UserProfile>();
  let familyMembers = Map.empty<Text, FamilyMember>();
  let relationshipRequests = Map.empty<Text, RelationshipRequest>();
  let pendingRegistrations = Map.empty<Text, PendingRegistration>();
  let principalToEmail = Map.empty<Principal, Text>();
  let galleryPhotos = Map.empty<Text, GalleryPhoto>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var patriarchInfo : PatriarchInfo = {
    name = "श्री गणेश सावळाराम अभंगराव";
    title = "माजी नगराध्यक्ष – पंढरपूर";
    inspirationalMessage = "कुटुंब हेच खरे धन आहे.";
  };

  users.add(
    "admin@vatavriksha.com",
    {
      id = "1";
      name = "Admin";
      email = "admin@vatavriksha.com";
      passwordHash = "Admin@123";
      role = #admin;
      createdAt = Time.now();
      isVerified = true;
      isActive = true;
    },
  );

  familyMembers.add(
    "patriarch-1",
    {
      id = "patriarch-1";
      name = "श्री गणेश सावळाराम अभंगराव";
      gender = "male";
      birthDate = "";
      deathDate = "";
      isDeceased = false;
      bloodGroup = "";
      village = "पंढरपूर";
      occupation = "";
      occupationType = "व्यवसाय";

      firstName = "गणेश";
      lastName = "अभंगराव";
      education = "";
      additionalInfo = "";
      fatherId = "";
      motherId = "";
      spouseIds = [];
      childrenIds = [];
      brotherIds = [];
      sisterIds = [];
      createdBy = "admin@vatavriksha.com";
      createdAt = Time.now();
      mobile = "";
      whatsapp = "";
      address = "";
      nativeVillage = "";
      maritalStatus = "married";
      birthTime = "";
      marriageDate = "";
      fatherInLawId = "";
      motherInLawId = "";
      houseNumber = "";
      roadName = "";
      landmark = "";
      cityVillage = "";
      pincode = "";
      district = "";
      fatherName = "";
      motherName = "";
      husbandName = "";
      fatherFullName = "";
      motherFullName = "";
      fatherInLawName = "";
      motherInLawName = "";
      spouseName = "";
      brotherNames = "";
      sisterNames = "";
      childrenNames = "";
      photoData = "";
    },
  );

  // --- CRITICAL: Public Functions (No Authentication Required) ---

  // PUBLIC: Store full registration data for admin review
  public func submitPendingRegistration(reg : PendingRegistration) : async () {
    pendingRegistrations.add(reg.id, reg);
  };

  // PUBLIC: Register new user (force isActive=false and role=#user)
  public func registerUser(profile : UserProfile) : async () {
    if (users.containsKey(profile.email)) {
      Runtime.trap("Email already taken");
    };

    // Force security settings as per specification
    let secureProfile = {
      profile with isActive = false;
      role = #user;
    };

    users.add(secureProfile.email, secureProfile);
  };

  // PUBLIC: Password check IS the authentication
  public func loginWithPassword(email : Text, providedPassword : Text) : async UserProfile {
    switch (users.get(email)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let storedPassword = profile.passwordHash;

        switch (Text.compare(providedPassword, storedPassword)) {
          case (#equal) { profile };
          case (#greater or #less) { Runtime.trap("Invalid password") };
        };
      };
    };
  };

  // PUBLIC: Needed for session restore
  public query func getUserProfileByEmail(email : Text) : async UserProfile {
    let profileOpt = users.get(email);
    switch (profileOpt) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
  };

  // PUBLIC: Check if user account is active
  public query func isUserActive(email : Text) : async Bool {
    switch (users.get(email)) {
      case (null) { false };
      case (?profile) { profile.isActive };
    };
  };

  // PUBLIC: Read patriarch info
  public query func getPatriarchInfo() : async PatriarchInfo {
    patriarchInfo;
  };

  // PUBLIC: Read all family members
  public query func getAllFamilyMembers() : async [FamilyMember] {
    familyMembers.values().toArray();
  };

  // PUBLIC: Read patriarch ID
  public query func getPatriarchId() : async Text {
    "patriarch-1";
  };

  // PUBLIC: Read family member by ID
  public query func getFamilyMember(id : Text) : async FamilyMember {
    if (id == "patriarch-1" and familyMembers.size() == 0) {
      return {
        id = "patriarch-1";
        name = "श्री गणेश सावळाराम अभंगराव";
        gender = "male";
        birthDate = "";
        deathDate = "";
        isDeceased = false;
        bloodGroup = "";
        village = "पंढरपूर";
        occupation = "";
        occupationType = "व्यवसाय";
        firstName = "गणेश";
        lastName = "अभंगराव";
        education = "";
        additionalInfo = "";
        fatherId = "";
        motherId = "";
        spouseIds = [];
        childrenIds = [];
        brotherIds = [];
        sisterIds = [];
        createdBy = "admin@vatavriksha.com";
        createdAt = Time.now();
        mobile = "";
        whatsapp = "";
        address = "";
        nativeVillage = "";
        maritalStatus = "married";
        birthTime = "";
        marriageDate = "";
        fatherInLawId = "";
        motherInLawId = "";
        houseNumber = "";
        roadName = "";
        landmark = "";
        cityVillage = "";
        pincode = "";
        district = "";
        fatherName = "";
        motherName = "";
        husbandName = "";
        fatherFullName = "";
        motherFullName = "";
        fatherInLawName = "";
        motherInLawName = "";
        spouseName = "";
        brotherNames = "";
        sisterNames = "";
        childrenNames = "";
        photoData = "";
      };
    };
    switch (familyMembers.get(id)) {
      case (null) { Runtime.trap("Family member not found") };
      case (?member) { member };
    };
  };

  // PUBLIC: Read approved gallery photos
  public query func getGalleryPhotos() : async [GalleryPhoto] {
    let photos = galleryPhotos.values().toArray();
    photos.filter(func(photo) { photo.approvedStatus == "approved" });
  };

  // PUBLIC: Read approved gallery photos by category
  public query func getGalleryPhotosByCategory(category : Text) : async [GalleryPhoto] {
    let photos = galleryPhotos.values().toArray();
    photos.filter(func(photo) { photo.category == category and photo.approvedStatus == "approved" });
  };

  // PUBLIC: Read approved gallery photo count
  public query func getGalleryPhotoCount() : async Nat {
    var count = 0;
    for ((_, photo) in galleryPhotos.entries()) {
      if (photo.approvedStatus == "approved") { count += 1 };
    };
    count;
  };

  // --- ADMIN-ONLY Functions (AccessControl.isAdmin check required) ---

  public query ({ caller }) func getPendingRegistrations() : async [PendingRegistration] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view pending registrations");
    };

    pendingRegistrations.values().toArray();
  };

  public shared ({ caller }) func approveRegistration(email : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can approve registrations");
    };

    switch (pendingRegistrations.get(email)) {
      case (null) { Runtime.trap("Pending registration not found") };
      case (?reg) {
        let updatedReg = {
          reg with status = "approved";
        };
        pendingRegistrations.add(email, updatedReg);
        switch (users.get(email)) {
          case (null) { Runtime.trap("User profile not found") };
          case (?profile) {
            let updatedProfile = {
              profile with isActive = true;
            };
            users.add(email, updatedProfile);
          };
        };
      };
    };
  };

  public shared ({ caller }) func rejectRegistration(email : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reject registrations");
    };

    switch (pendingRegistrations.get(email)) {
      case (null) { Runtime.trap("Pending registration not found") };
      case (?reg) {
        let updatedReg = {
          reg with status = "rejected";
        };
        pendingRegistrations.add(email, updatedReg);
      };
    };
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };

    users.values().toArray();
  };

  public shared ({ caller }) func adminToggleUserActive(email : Text, isActive : Bool) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update user status");
    };

    switch (users.get(email)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile = {
          profile with isActive = isActive
        };
        users.add(email, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func adminUpdateUserRole(email : Text, newRole : AccessControl.UserRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update roles");
    };

    switch (users.get(email)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile = {
          profile with role = newRole
        };
        users.add(email, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getRelationshipRequests() : async [RelationshipRequest] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all requests");
    };

    relationshipRequests.values().toArray();
  };

  public shared ({ caller }) func approveRelationshipRequest(requestId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can approve requests");
    };

    switch (relationshipRequests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) {
        let updatedRequest = {
          request with status = "approved"
        };
        relationshipRequests.add(requestId, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func rejectRelationshipRequest(requestId : Text, note : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reject requests");
    };

    switch (relationshipRequests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) {
        let updatedRequest = {
          request with status = "rejected";
          note;
        };
        relationshipRequests.add(requestId, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func addFamilyMember(member : FamilyMember) : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add family members");
    };

    familyMembers.add(member.id, member);
    member.id;
  };

  public shared ({ caller }) func updateFamilyMember(member : FamilyMember) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update family members");
    };

    if (not familyMembers.containsKey(member.id)) {
      Runtime.trap("Family member not found");
    };

    familyMembers.add(member.id, member);
  };

  public shared ({ caller }) func deleteFamilyMember(id : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete family members");
    };

    if (id == "patriarch-1") {
      Runtime.trap("Cannot delete patriarch");
    };

    if (not familyMembers.containsKey(id)) {
      Runtime.trap("Family member not found");
    };

    familyMembers.remove(id);
  };

  public shared ({ caller }) func adminUpdatePatriarchInfo(newInfo : PatriarchInfo) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update patriarch info");
    };

    patriarchInfo := newInfo;
  };

  public query ({ caller }) func getPendingGalleryPhotos() : async [GalleryPhoto] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view pending photos");
    };

    let photos = galleryPhotos.values().toArray();
    photos.filter(func(photo) { photo.approvedStatus == "pending" });
  };

  public shared ({ caller }) func approveGalleryPhoto(photoId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can approve photos");
    };

    switch (galleryPhotos.get(photoId)) {
      case (null) { Runtime.trap("Photo not found") };
      case (?photo) {
        let updatedPhoto = {
          photo with approvedStatus = "approved"
        };
        galleryPhotos.add(photoId, updatedPhoto);
      };
    };
  };

  public shared ({ caller }) func deleteGalleryPhoto(photoId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete photos");
    };

    if (not galleryPhotos.containsKey(photoId)) {
      Runtime.trap("Photo not found");
    };

    galleryPhotos.remove(photoId);
  };

  public shared ({ caller }) func updateGalleryPhotoCategory(photoId : Text, newCategory : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update photo category");
    };

    switch (galleryPhotos.get(photoId)) {
      case (null) { Runtime.trap("Photo not found") };
      case (?photo) {
        let updatedPhoto = {
          photo with category = newCategory
        };
        galleryPhotos.add(photoId, updatedPhoto);
      };
    };
  };

  public query ({ caller }) func getAllGalleryPhotosForBackup() : async [GalleryPhoto] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can backup gallery photos");
    };

    galleryPhotos.values().toArray();
  };

  public query ({ caller }) func getAllFamilyMembersForBackup() : async [FamilyMember] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can backup family members");
    };

    familyMembers.values().toArray();
  };

  public query ({ caller }) func getAllUsersForBackup() : async [UserProfile] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can backup users");
    };

    users.values().toArray();
  };

  // --- AUTHENTICATED USER Functions (AccessControl.hasPermission #user check) ---

  public shared ({ caller }) func submitRelationshipRequest(request : RelationshipRequest) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can submit requests");
    };

    relationshipRequests.add(request.id, request);
    request.id;
  };

  public query ({ caller }) func getMyRelationshipRequests(userId : Text) : async [RelationshipRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view requests");
    };

    let callerEmailOpt = principalToEmail.get(caller);
    let isOwnRequest = switch (callerEmailOpt) {
      case (null) { false };
      case (?callerEmail) { callerEmail == userId };
    };

    if (not isOwnRequest and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own requests");
    };

    let requests = relationshipRequests.values().toArray();
    requests.filter(func(request) { request.fromUserId == userId });
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };

    let callerEmailOpt = principalToEmail.get(caller);
    switch (callerEmailOpt) {
      case (null) {
        principalToEmail.add(caller, profile.email);
        users.add(profile.email, profile);
      };
      case (?callerEmail) {
        if (callerEmail != profile.email) {
          Runtime.trap("Unauthorized: Can only update your own profile");
        };
        users.add(profile.email, profile);
      };
    };
  };

  public shared ({ caller }) func updateUserProfile(updatedProfile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can update profiles");
    };

    let callerEmailOpt = principalToEmail.get(caller);
    switch (callerEmailOpt) {
      case (null) { Runtime.trap("User not found") };
      case (?callerEmail) {
        if (callerEmail != updatedProfile.email) {
          Runtime.trap("Unauthorized: Can only update your own profile");
        };
        users.add(updatedProfile.email, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };

    let emailOpt = principalToEmail.get(caller);
    switch (emailOpt) {
      case (null) { Runtime.trap("User not found") };
      case (?email) {
        switch (users.get(email)) {
          case (null) { Runtime.trap("User profile not found") };
          case (?profile) { profile };
        };
      };
    };
  };

  public query ({ caller }) func getUserProfile(userPrincipal : Principal) : async UserProfile {
    if (caller != userPrincipal and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    let emailOpt = principalToEmail.get(userPrincipal);
    switch (emailOpt) {
      case (null) { Runtime.trap("User not found") };
      case (?email) {
        switch (users.get(email)) {
          case (null) { Runtime.trap("User profile not found") };
          case (?profile) { profile };
        };
      };
    };
  };

  public shared ({ caller }) func addGalleryPhoto(photo : GalleryPhoto) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can upload photos");
    };

    galleryPhotos.add(photo.id, photo);
    photo.id;
  };
};
