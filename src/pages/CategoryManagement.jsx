import AdminPageLayout from "../components/AdminPageLayout";
import CategoryManagementPanel from "../components/CategoryManagement";

const CategoryManagement = () => (
  <AdminPageLayout activeFeature="categories">
    <CategoryManagementPanel />
  </AdminPageLayout>
);

export default CategoryManagement;
