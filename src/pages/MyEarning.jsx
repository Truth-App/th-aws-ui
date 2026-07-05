import AdminPageLayout from "../components/AdminPageLayout";
import ComingSoon from "../components/ComingSoon";

const MyEarning = () => (
  <AdminPageLayout activeFeature="my-earnings">
    <ComingSoon
      title="My Earnings Summary"
      description="Please use View Earnings Summary to load earnings."
    />
  </AdminPageLayout>
);

export default MyEarning;
