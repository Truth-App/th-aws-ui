import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createUser, getUsers, updateUser, activateDeactivateUser } from "../../api/users";
import { ADMIN_ROLE } from "../../constants/roles";
import {
  getDashboardHomePath,
  getDefaultPrivilegeIdsByRole,
  getUserRoleFromList,
} from "../../constants/dashboardFeatures";
import { markProfileSetupSkipped } from "../../helpers/profileHelpers";
import {
  ImageUploadSection,
  ReferenceNumberFields,
  StatusToggle,
  UserFormFields,
} from "./UserFormSections";
import {
  CLEARED_BANK_DETAILS,
  INITIAL_USER_FORM,
  findUserByReferenceNumber,
  getAssignedRoleFromReferenceUser,
  getDefaultDiscountRateByRole,
  mapProfileUserToForm,
  mapReferenceNumberFromUserId,
  normalizeUserStatus,
  shouldShowSupportedPincodes,
} from "./userManagementUtils";
import {
  buildUserSavePayload,
  getPresignedUrl,
  uploadFileToS3,
  validateUserForm,
} from "./userFormActions";

const UserEditProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSetupFlow = searchParams.get("setup") === "1";
  const isMobile = useMediaQuery("(max-width:600px)");
  const authUser = useSelector((state) => state.user.user);
  const fileInputRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("idle");
  const [dialogMode, setDialogMode] = useState("create");
  const [editingUserId, setEditingUserId] = useState(null);
  const [user, setUser] = useState(INITIAL_USER_FORM);
  const [profileUserFilter, setProfileUserFilter] = useState("");
  const [selectedReferenceUserId, setSelectedReferenceUserId] = useState(null);
  const [savedReferenceNumber, setSavedReferenceNumber] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const loadUsers = async () => {
    setStatus("loading");
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
      setStatus("succeeded");
      return Array.isArray(data) ? data : [];
    } catch {
      setUsers([]);
      setStatus("failed");
      return [];
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect -- load users on mount */
  useEffect(() => {
    loadUsers();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect -- hydrate profile form when users list loads */
  useEffect(() => {
    if (status === "idle" || status === "loading") return;

    const profileEmail = (authUser?.email || "").trim().toLowerCase();
    if (!profileEmail) return;

    if (status === "succeeded") {
      const matchedUser = users.find(
        (item) => (item.email || "").trim().toLowerCase() === profileEmail,
      );

      if (matchedUser) {
        setDialogMode("edit");
        setEditingUserId(matchedUser.id);
        const savedRef = matchedUser.referencenumber  || "";
        const refUser = findUserByReferenceNumber(users, savedRef);
        setSelectedReferenceUserId(refUser?.id || null);
        setSavedReferenceNumber(savedRef);
        setUser(mapProfileUserToForm(matchedUser));
        return;
      }
    }

    const nameParts = (authUser?.name || "").trim().split(/\s+/).filter(Boolean);
    setDialogMode("create");
    setEditingUserId(null);
    setSavedReferenceNumber("");
    setUser({
      ...INITIAL_USER_FORM,
      email: authUser?.email || "",
      firstname: nameParts[0] || "",
      lastname: nameParts.slice(1).join(" "),
      role: "Customer",
    });
  }, [status, users, authUser]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const profileReady = status === "succeeded" || status === "failed";

  const currentDbUserRole = useMemo(() => {
    const profileEmail = (authUser?.email || "").trim().toLowerCase();
    if (!profileEmail) return "";
    const matchedUser = users.find(
      (item) => (item.email || "").trim().toLowerCase() === profileEmail,
    );
    return matchedUser?.role || "";
  }, [authUser?.email, users]);

  const canManageSupportedPincodes = shouldShowSupportedPincodes(currentDbUserRole, user.role);
  const isCurrentUserAdmin = currentDbUserRole === ADMIN_ROLE;
  const canEditReferenceAndRole = isCurrentUserAdmin;
  const canManageUserStatus = isCurrentUserAdmin;
  const hasReferenceNumber = Boolean(String(user.referencenumber || "").trim());
  const isStatusLockedByReference = hasReferenceNumber && !isCurrentUserAdmin;
  const isProfileInactive =
    dialogMode === "edit" &&
    normalizeUserStatus(user.status) === "Inactive" &&
    !isCurrentUserAdmin;

  const handleOnChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === "status") {
      if (!canManageUserStatus) return;
      setUser((prev) => ({
        ...prev,
        status: checked ? "Active" : "Inactive",
      }));
      return;
    }
    if (name === "referencenumber") {
      const referencedUser = findUserByReferenceNumber(users, value);
      const assignedRole = getAssignedRoleFromReferenceUser(referencedUser);
      setSelectedReferenceUserId(referencedUser?.id || null);
      const hasSavedRef = Boolean(String(savedReferenceNumber || "").trim());
      if (!isCurrentUserAdmin && hasSavedRef) return;

      const hasReference = Boolean(String(value || "").trim());
      setUser((prev) => ({
        ...prev,
        referencenumber: value,
        role: assignedRole,
        privileges: getDefaultPrivilegeIdsByRole(assignedRole),
        discountrate: getDefaultDiscountRateByRole(assignedRole),
        ...CLEARED_BANK_DETAILS,
        ...(shouldShowSupportedPincodes(currentDbUserRole, assignedRole)
          ? {}
          : { supportedpincodes: [] }),
        // Entering a reference number disables (Inactive) the account until admin activates.
        status: hasReference ? "Inactive" : prev.status,
      }));
      return;
    }
    if (name === "role") {
      if (!isCurrentUserAdmin && Boolean(String(savedReferenceNumber || "").trim())) {
        return;
      }
      setUser((prev) => ({
        ...prev,
        role: value,
        privileges: getDefaultPrivilegeIdsByRole(value),
        discountrate: getDefaultDiscountRateByRole(value),
        ...CLEARED_BANK_DETAILS,
        ...(shouldShowSupportedPincodes(currentDbUserRole, value)
          ? {}
          : { supportedpincodes: [] }),
      }));
      return;
    }
    if (name === "discountrate") {
      if (value === "") {
        setUser((prev) => ({ ...prev, discountrate: "" }));
        return;
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return;
      setUser((prev) => ({
        ...prev,
        discountrate: Math.min(100, Math.max(0, parsed)),
      }));
      return;
    }
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSupportedPincode = (pincode) => {
    setUser((prev) => {
      const existing = prev.supportedpincodes || [];
      if (existing.includes(pincode)) return prev;
      return { ...prev, supportedpincodes: [...existing, pincode] };
    });
  };

  const handleRemoveSupportedPincode = (pincode) => {
    setUser((prev) => ({
      ...prev,
      supportedpincodes: (prev.supportedpincodes || []).filter((item) => item !== pincode),
    }));
  };

  const handlePrivilegeToggle = (featureId) => {
    setUser((prev) => {
      const currentPrivileges = prev.privileges || [];
      const nextPrivileges = currentPrivileges.includes(featureId)
        ? currentPrivileges.filter((id) => id !== featureId)
        : [...currentPrivileges, featureId];
      return { ...prev, privileges: nextPrivileges };
    });
  };

  const handleReferenceUserSelect = (selectedUser) => {
    const assignedRole = getAssignedRoleFromReferenceUser(selectedUser);
    const nextReferenceNumber = mapReferenceNumberFromUserId(selectedUser);
    const hasSavedRef = Boolean(String(savedReferenceNumber || "").trim());
    if (!isCurrentUserAdmin && hasSavedRef) return;

    setSelectedReferenceUserId(selectedUser.id);
    setUser((prev) => ({
      ...prev,
      referencenumber: nextReferenceNumber,
      role: assignedRole,
      privileges: getDefaultPrivilegeIdsByRole(assignedRole),
      discountrate: getDefaultDiscountRateByRole(assignedRole),
      ...CLEARED_BANK_DETAILS,
      ...(shouldShowSupportedPincodes(currentDbUserRole, assignedRole)
        ? {}
        : { supportedpincodes: [] }),
      status: nextReferenceNumber.trim() ? "Inactive" : prev.status,
    }));
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxFileSize = 10 * 1024 * 1024;
    for (const file of files) {
      if (file.size > maxFileSize) {
        toast.error(`File ${file.name} is too large. Max 10MB allowed.`);
        return;
      }
    }

    setUploadingFiles(true);
    const uploadedKeys = [...(user.imageKeys || [])];

    try {
      for (const file of files) {
        toast.info(`Uploading ${file.name}...`);
        const presignedData = await getPresignedUrl(file.name);
        await uploadFileToS3(file, presignedData.url);
        uploadedKeys.push(presignedData.key);
      }

      setUser((prev) => ({
        ...prev,
        imageKeys: uploadedKeys,
      }));

      toast.success(`Successfully uploaded ${files.length} file(s)`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      toast.error(`Upload failed: ${err?.message || "Please try again."}`);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setUser((prev) => ({
      ...prev,
      imageKeys: prev.imageKeys.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSaveUser = async () => {
    if (isProfileInactive) {
      toast.error("Your account is Inactive. Please contact administration to make it Active.");
      return;
    }
    if (!validateUserForm({ user, canManageSupportedPincodes, requireDiscountRate: false })) {
      return;
    }

    try {
      const isEditMode = dialogMode === "edit" && editingUserId !== null;
      const existingUser = users.find((item) => item.id === editingUserId);
      const modifiedBy = authUser?.email || authUser?.name || currentDbUserRole || "Unknown";

      const { payload, nextStatus, previousStatus } = buildUserSavePayload({
        user,
        canManageSupportedPincodes,
        isProfileMode: true,
        isEditMode,
        isCurrentUserAdmin,
        existingUser,
        modifiedBy,
      });

      if (isEditMode) {
        await updateUser(editingUserId, payload);
        if (nextStatus !== previousStatus) {
          await activateDeactivateUser(editingUserId, { status: nextStatus });
        }
      } else {
        await createUser(payload);
        const refreshedAfterCreate = await loadUsers();
        if (nextStatus === "Inactive") {
          const createdUser = refreshedAfterCreate.find(
            (item) =>
              (item.email || "").trim().toLowerCase() ===
              (user.email || "").trim().toLowerCase(),
          );
          if (createdUser?.id) {
            await activateDeactivateUser(createdUser.id, { status: "Inactive" });
          }
        }
      }

      toast.success(isEditMode ? "User updated successfully" : "User added successfully");
      const refreshedUsers = await loadUsers();
      setSavedReferenceNumber(user.referencenumber?.trim() || "");
      if (!isEditMode) {
        setDialogMode("edit");
      }

      if (isSetupFlow) {
        const role = getUserRoleFromList(refreshedUsers, authUser?.email);
        navigate(getDashboardHomePath(role, user.privileges || []));
      }
    } catch (err) {
      toast.error(err?.message || "Unable to save user");
    }
  };

  const handleSkipProfile = () => {
    if (authUser?.id) {
      markProfileSetupSkipped(authUser.id);
    }
    navigate("/");
  };

  return (
    <>
      <ToastContainer
        position={isMobile ? "top-center" : "top-right"}
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      <Card
        style={{
          height: "100%",
          width: "100%",
          overflowY: "visible",
          overflowX: "hidden",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          border: "1px solid var(--brand-border)",
        }}
      >
        <CardContent style={{ padding: isMobile ? "8px 12px" : "16px" }}>
          <Typography
            variant="h6"
            style={{ fontWeight: 700, color: "var(--brand-primary-strong)", marginBottom: "0.5em" }}
          >
            {isSetupFlow ? "Complete Your Profile" : "Edit Profile"}
          </Typography>
          <Typography variant="body2" color="text.secondary" style={{ marginBottom: "1em" }}>
            {isSetupFlow
              ? "We saved your Google name and email. Add the remaining details now or skip and complete later."
              : "Update your account details."}
          </Typography>

          {status === "loading" && <Typography style={{ marginTop: "1em" }}>Loading profile...</Typography>}
          {status === "failed" && (
            <Typography color="warning.main" style={{ marginTop: "1em" }}>
              Could not load your saved profile. You can still update your details below.
            </Typography>
          )}

          {profileReady && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1em",
                maxWidth: "100%",
                width: "100%",
              }}
            >
              {isProfileInactive && (
                <Typography
                  variant="body2"
                  color="error"
                  style={{
                    padding: "0.75em 1em",
                    border: "1px solid #f5c2c7",
                    backgroundColor: "#f8d7da",
                    borderRadius: "4px",
                  }}
                >
                  Your account is Inactive. Please contact administration to make it Active.
                </Typography>
              )}
              <UserFormFields
                user={user}
                onChange={handleOnChange}
                onPrivilegeToggle={handlePrivilegeToggle}
                onAddSupportedPincode={handleAddSupportedPincode}
                onRemoveSupportedPincode={handleRemoveSupportedPincode}
                showSupportedPincodes={canManageSupportedPincodes}
                disabled={isProfileInactive}
                isMobile={isMobile}
                profileMode
                extendedUserForm
                allUsers={users}
                currentUserId={user.userid}
              />
              <ReferenceNumberFields
                user={user}
                users={users}
                filter={profileUserFilter}
                onFilterChange={setProfileUserFilter}
                selectedReferenceUserId={selectedReferenceUserId}
                onSelectUser={handleReferenceUserSelect}
                onChange={handleOnChange}
                profileMode
                disabled={isProfileInactive}
                roleDisabled={!canEditReferenceAndRole || isProfileInactive}
                canEditReferenceNumber={
                  !isProfileInactive && (canEditReferenceAndRole || dialogMode === "create")
                }
                savedReferenceNumber={savedReferenceNumber}
              />
              <StatusToggle
                status={user.status}
                onChange={handleOnChange}
                disabled={
                  isProfileInactive || !canManageUserStatus || isStatusLockedByReference
                }
              />
              <ImageUploadSection
                imageKeys={user.imageKeys || []}
                disabled={isProfileInactive}
                fileInputRef={fileInputRef}
                uploadingFiles={uploadingFiles}
                onFileUpload={handleFileUpload}
                onRemoveFile={handleRemoveFile}
              />
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Button
                  onClick={handleSaveUser}
                  disabled={uploadingFiles || isProfileInactive}
                  variant="contained"
                  style={{
                    backgroundColor: "var(--brand-primary-strong)",
                    textTransform: "none",
                    fontWeight: "bolder",
                  }}
                >
                  Save Profile
                </Button>
                {isSetupFlow && (
                  <Button
                    onClick={handleSkipProfile}
                    disabled={uploadingFiles || isProfileInactive}
                    variant="outlined"
                    style={{
                      textTransform: "none",
                      fontWeight: "bolder",
                      borderColor: "var(--brand-primary-strong)",
                      color: "var(--brand-primary-strong)",
                    }}
                  >
                    Skip for now
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default UserEditProfile;
