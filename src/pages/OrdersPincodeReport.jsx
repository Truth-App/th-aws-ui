import AdminPageLayout from "../components/AdminPageLayout";
import OrdersPincodeReport from "../components/OrdersPincodeReport";

const OrdersPincodeReportPage = () => (
  <AdminPageLayout activeFeature="orders-pincode-report">
    <OrdersPincodeReport />
  </AdminPageLayout>
);

export default OrdersPincodeReportPage;
