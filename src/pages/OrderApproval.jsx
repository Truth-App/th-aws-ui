import AdminPageLayout from "../components/AdminPageLayout";
import ComingSoon from "../components/ComingSoon";

const OrderApproval = () => (
  <AdminPageLayout activeFeature="order-approval">
    <ComingSoon
      title="Order Approval"
      description="Order approval workflow will be available here."
    />
  </AdminPageLayout>
);

export default OrderApproval;
