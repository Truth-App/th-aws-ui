import AdminPageLayout from "../components/AdminPageLayout";
import ComingSoon from "../components/ComingSoon";

const MyEarning = () => (
  <AdminPageLayout activeFeature="my-earnings">
    <ComingSoon
      title="My Earnings Summary"
      description="Your earnings summary will be available here."
    />
  </AdminPageLayout>
);

export default MyEarning;
