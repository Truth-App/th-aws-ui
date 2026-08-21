import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { activateDeactivateUser, getUsers } from "../../api/users";
import { ADMIN_ROLE } from "../../constants/roles";
import UserList from "./UserList";
import UserEditDialog from "./UserEditDialog";
import UserViewDialog from "./UserViewDialog";
import {
  getUserApiId,
  mapUserToForm,
  normalizeUserStatus,
} from "./userManagementUtils";

const UserManagement = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const authUser = useSelector((state) => state.user.user);

  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("create");
  const [editingUser, setEditingUser] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

  const loadUsers = async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
      setStatus("succeeded");
      return Array.isArray(data) ? data : [];
    } catch (err) {
      setUsers([]);
      setStatus("failed");
      setError(err?.message || "Unable to load users");
      return [];
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect -- load users on mount */
  useEffect(() => {
    loadUsers();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const currentDbUserRole = useMemo(() => {
    const profileEmail = (authUser?.email || "").trim().toLowerCase();
    if (!profileEmail) return "";
    const matchedUser = users.find(
      (item) => (item.email || "").trim().toLowerCase() === profileEmail,
    );
    return matchedUser?.role || "";
  }, [authUser?.email, users]);

  const canManageUserStatus = currentDbUserRole === ADMIN_ROLE;

  const handleOpenEdit = (selectedUser) => {
    setEditMode("edit");
    setEditingUser(selectedUser);
    setEditOpen(true);
  };

  const handleOpenView = (selectedUser) => {
    setViewingUser(mapUserToForm(selectedUser));
    setViewOpen(true);
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setViewingUser(null);
  };

  const handleToggleUserStatus = async (item) => {
    if (!canManageUserStatus) {
      toast.error("Only administrator can change user status");
      return;
    }

    const apiUserId = getUserApiId(item);
    if (!apiUserId) {
      toast.error("Unable to update status: user id is missing");
      return;
    }

    const currentStatus = normalizeUserStatus(item.status);
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";

    try {
      await activateDeactivateUser(apiUserId, { status: nextStatus });
      toast.success(`User set to ${nextStatus}`);
      await loadUsers();
    } catch (err) {
      toast.error(err?.message || "Unable to update user status");
    }
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

      <UserList
        users={users}
        status={status}
        error={error}
        isMobile={isMobile}
        canManageUserStatus={canManageUserStatus}
        onEdit={handleOpenEdit}
        onView={handleOpenView}
        onStatusToggle={handleToggleUserStatus}
      />

      <UserEditDialog
        open={editOpen}
        mode={editMode}
        userId={editingUser?.id || null}
        initialUser={editingUser}
        users={users}
        currentDbUserRole={currentDbUserRole}
        isMobile={isMobile}
        onClose={() => {
          setEditOpen(false);
          setEditingUser(null);
        }}
        onSaved={loadUsers}
      />

      <UserViewDialog
        open={viewOpen}
        user={viewingUser}
        users={users}
        currentDbUserRole={currentDbUserRole}
        isMobile={isMobile}
        onClose={handleCloseView}
      />
    </>
  );
};

export default UserManagement;
