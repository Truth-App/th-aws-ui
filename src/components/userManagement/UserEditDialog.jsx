import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createUser, updateUser, activateDeactivateUser } from "../../api/users";
import { ADMIN_ROLE } from "../../constants/roles";
import { getDefaultPrivilegeIdsByRole } from "../../constants/dashboardFeatures";
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
  shouldShowSupportedPincodes,
} from "./userManagementUtils";
import {
  buildUserSavePayload,
  getPresignedUrl,
  uploadFileToS3,
  validateUserForm,
} from "./userFormActions";

const UserEditDialog = ({
  open,
  mode = "create",
  userId = null,
  initialUser = null,
  users = [],
  currentDbUserRole = "",
  isMobile = false,
  onClose,
  onSaved,
}) => {
  const authUser = useSelector((state) => state.user.user);
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(INITIAL_USER_FORM);
  const [editingUserId, setEditingUserId] = useState(null);
  const [savedReferenceNumber, setSavedReferenceNumber] = useState("");
  const [selectedReferenceUserId, setSelectedReferenceUserId] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const isCurrentUserAdmin = currentDbUserRole === ADMIN_ROLE;
  const canEditReferenceAndRole = isCurrentUserAdmin;
  const canManageUserStatus = isCurrentUserAdmin;
  const canManageSupportedPincodes = shouldShowSupportedPincodes(currentDbUserRole, user.role);
  const hasReferenceNumber = Boolean(String(user.referencenumber || "").trim());
  const isStatusLockedByReference = hasReferenceNumber && !isCurrentUserAdmin;

  /* eslint-disable react-hooks/set-state-in-effect -- hydrate dialog form when opened */
  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialUser) {
      setEditingUserId(userId || initialUser.id);
      const savedRef = initialUser.referencenumber || "";
      const refUser = findUserByReferenceNumber(users, savedRef);
      setSelectedReferenceUserId(refUser?.id || null);
      setSavedReferenceNumber(savedRef);
      setUser(mapProfileUserToForm(initialUser));
    } else {
      setEditingUserId(null);
      setSelectedReferenceUserId(null);
      setSavedReferenceNumber("");
      setUser(INITIAL_USER_FORM);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open, mode, userId, initialUser, users]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  const handleClose = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose?.();
  };

  const handleSaveUser = async () => {
    if (
      !validateUserForm({
        user,
        canManageSupportedPincodes,
        requireDiscountRate: mode === "edit",
      })
    ) {
      return;
    }

    try {
      const isEditMode = mode === "edit" && editingUserId !== null;
      const existingUser = users.find((item) => item.id === editingUserId);
      const modifiedBy = authUser?.email || authUser?.name || currentDbUserRole || "Unknown";

      const { payload, nextStatus, previousStatus } = buildUserSavePayload({
        user,
        canManageSupportedPincodes,
        isProfileMode: false,
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
      }

      toast.success(isEditMode ? "User updated successfully" : "User added successfully");
      await onSaved?.();
      handleClose();
    } catch (err) {
      toast.error(err?.message || "Unable to save user");
    }
  };

  const dialogMaxWidth = mode === "edit" ? "lg" : "md";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      scroll="paper"
      maxWidth={dialogMaxWidth}
      fullWidth={mode === "edit"}
    >
      <DialogTitle>{mode === "edit" ? "Update User" : "Add User"}</DialogTitle>
      <DialogContent dividers>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1em",
            width: "100%",
            maxWidth: mode === "edit" ? "100%" : isMobile ? "100%" : "720px",
          }}
        >
          <UserFormFields
            user={user}
            onChange={handleOnChange}
            onPrivilegeToggle={handlePrivilegeToggle}
            onAddSupportedPincode={handleAddSupportedPincode}
            onRemoveSupportedPincode={handleRemoveSupportedPincode}
            showSupportedPincodes={canManageSupportedPincodes}
            isMobile={isMobile}
            profileMode={false}
            extendedUserForm={mode === "edit"}
            allUsers={users}
            currentUserId={editingUserId || user.userid}
          />
          {mode === "edit" && (
            <ReferenceNumberFields
              user={user}
              users={users}
              filter=""
              onFilterChange={() => {}}
              selectedReferenceUserId={selectedReferenceUserId}
              onSelectUser={handleReferenceUserSelect}
              onChange={handleOnChange}
              profileMode
              showDiscountRate
              roleDisabled={!canEditReferenceAndRole}
              canEditReferenceNumber={canEditReferenceAndRole}
              savedReferenceNumber={savedReferenceNumber}
            />
          )}
          <StatusToggle
            status={user.status}
            onChange={handleOnChange}
            disabled={!canManageUserStatus || isStatusLockedByReference}
          />
          <ImageUploadSection
            imageKeys={user.imageKeys || []}
            fileInputRef={fileInputRef}
            uploadingFiles={uploadingFiles}
            onFileUpload={handleFileUpload}
            onRemoveFile={handleRemoveFile}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSaveUser} disabled={uploadingFiles}>
          {mode === "edit" ? "Update user" : "Add user"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserEditDialog;
