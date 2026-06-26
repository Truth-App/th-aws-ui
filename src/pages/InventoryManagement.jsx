import AdminPageLayout from "../components/AdminPageLayout";
import InventoryManagementPanel from "../components/InventoryManagement";

const InventoryManagement = () => (
  <AdminPageLayout activeFeature="inventory">
    <InventoryManagementPanel />
  </AdminPageLayout>
);

export default InventoryManagement;
