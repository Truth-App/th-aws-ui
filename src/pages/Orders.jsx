import AdminPageLayout from "../components/AdminPageLayout";
import OrdersManagementPanel from "../components/OrdersManagement";

const Orders = () => (
  <AdminPageLayout activeFeature="orders">
    <OrdersManagementPanel />
  </AdminPageLayout>
);

export default Orders;
