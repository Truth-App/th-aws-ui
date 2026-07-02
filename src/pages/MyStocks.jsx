import AdminPageLayout from "../components/AdminPageLayout";
import ComingSoon from "../components/ComingSoon";

const MyStocks = () => (
  <AdminPageLayout activeFeature="my-stocks">
    <ComingSoon
      title="My Stocks"
      description="Stock levels and inventory overview will be available here."
    />
  </AdminPageLayout>
);

export default MyStocks;
