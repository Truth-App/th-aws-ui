import AdminPageLayout from "../components/AdminPageLayout";
import OrdersManagementPanel from "../components/OrdersManagement";

const Orders = () => (
  <AdminPageLayout activeFeature="orders">
    <OrdersManagementPanel
      showStatusTimelineFilter
      ordersApi="my-orders"
    />
  </AdminPageLayout>
);

export default Orders;
