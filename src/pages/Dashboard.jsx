import AdminPageLayout from "../components/AdminPageLayout";
import DashboardFeatureDetail from "../components/DashboardFeatureDetail";

const Dashboard = () => (
  <AdminPageLayout activeFeature="products">
    <DashboardFeatureDetail />
  </AdminPageLayout>
);

export default Dashboard;
