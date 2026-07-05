import AdminPageLayout from "../components/AdminPageLayout";
import OrdersManagementPanel from "../components/OrdersManagement";

const ViewOrders = () => (
  <AdminPageLayout activeFeature="view-orders">
    <OrdersManagementPanel
      title="View Orders"
      description="View all orders and open detailed tracking."
      showStatusTimelineFilter
    />
  </AdminPageLayout>
);

export default ViewOrders;
