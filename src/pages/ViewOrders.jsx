import AdminPageLayout from "../components/AdminPageLayout";
import AdminPlaceholder from "../components/AdminPlaceholder";

const ViewOrders = () => (
  <AdminPageLayout activeFeature="view-orders">
    <AdminPlaceholder
      title="View Orders"
      description="Admin order list and management will be available here."
    />
  </AdminPageLayout>
);

export default ViewOrders;
