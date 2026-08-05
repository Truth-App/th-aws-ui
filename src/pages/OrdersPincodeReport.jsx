import AdminPageLayout from "../components/AdminPageLayout";
import PincodeMappingTable from "../components/PincodeMappingTable";

const OrdersPincodeReportPage = () => (
  <AdminPageLayout activeFeature="orders-pincode-report">
    <PincodeMappingTable />
  </AdminPageLayout>
);

export default OrdersPincodeReportPage;
