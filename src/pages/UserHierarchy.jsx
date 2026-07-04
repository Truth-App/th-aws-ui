import AdminPageLayout from "../components/AdminPageLayout";
import UserHierarchyPanel from "../components/UserHierarchy";

const UserHierarchy = () => (
  <AdminPageLayout activeFeature="user-hierarchy">
    <UserHierarchyPanel />
  </AdminPageLayout>
);

export default UserHierarchy;
