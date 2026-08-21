import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
  ImageUploadSection,
  ReferenceNumberFields,
  StatusToggle,
  UserFormFields,
} from "./UserFormSections";
import { shouldShowSupportedPincodes } from "./userManagementUtils";

const UserViewDialog = ({
  open,
  user,
  users = [],
  currentDbUserRole = "",
  isMobile = false,
  onClose,
}) => {
  const canViewSupportedPincodes = shouldShowSupportedPincodes(
    currentDbUserRole,
    user?.role || "",
  );

  return (
    <Dialog open={open} onClose={onClose} scroll="paper" maxWidth="lg" fullWidth>
      <DialogTitle>View User</DialogTitle>
      <DialogContent dividers>
        {user && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1em",
              width: "100%",
              maxWidth: "100%",
            }}
          >
            <UserFormFields
              user={user}
              onChange={() => {}}
              onPrivilegeToggle={() => {}}
              onAddSupportedPincode={() => {}}
              onRemoveSupportedPincode={() => {}}
              showSupportedPincodes={canViewSupportedPincodes}
              disabled
              isMobile={isMobile}
              profileMode={false}
              extendedUserForm
              allUsers={users}
              currentUserId={user?.id || user?.userId}
            />
            <ReferenceNumberFields
              user={user}
              onChange={() => {}}
              profileMode
              showDiscountRate
              disabled
              roleDisabled
            />
            <StatusToggle status={user.status} onChange={() => {}} disabled />
            <ImageUploadSection imageKeys={user.imageKeys || []} disabled />
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserViewDialog;
