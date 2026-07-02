import AdminPageLayout from "../components/AdminPageLayout";
import ComingSoon from "../components/ComingSoon";

const OrderFulfillment = () => (
  <AdminPageLayout activeFeature="order-fulfillment">
    <ComingSoon
      title="Order Fulfillment"
      description="Order fulfillment tracking will be available here."
    />
  </AdminPageLayout>
);

export default OrderFulfillment;
