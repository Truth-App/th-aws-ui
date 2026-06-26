import AdminPageLayout from "../components/AdminPageLayout";
import UserManagementPanel from "../components/UserManagement";

const UserManagement = () => (
  <AdminPageLayout activeFeature="users">
    <UserManagementPanel />
  </AdminPageLayout>
);

export default UserManagement;
