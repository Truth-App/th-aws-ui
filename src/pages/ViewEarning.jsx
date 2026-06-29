import AdminPageLayout from "../components/AdminPageLayout";
import ComingSoon from "../components/ComingSoon";

const ViewEarning = () => (
  <AdminPageLayout activeFeature="view-earnings">
    <ComingSoon
      title="View Earnings Summary"
      description="Admin earnings overview will be available here."
    />
  </AdminPageLayout>
);

export default ViewEarning;
