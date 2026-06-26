import Navbar from "./Navbar";
import DashboardFeatureCard from "./DashboardFeatureCard";
import useMediaQuery from "@mui/material/useMediaQuery";

const AdminPageLayout = ({ activeFeature, children }) => {
  const isTablet = useMediaQuery("(max-width:900px)");

  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          flexDirection: isTablet ? "column" : "row",
          height: isTablet ? "auto" : "80vh",
          fontSize: isTablet ? "1em" : "1.5em",
          marginTop: "1em",
          gap: "1em",
          padding: isTablet ? "0 0.75em" : "0 1.5em",
          overflowX: "hidden",
        }}
      >
        <div style={{ flex: isTablet ? "1 1 auto" : "0 0 20%", display: "flex", minWidth: 0 }}>
          <DashboardFeatureCard activeFeature={activeFeature} />
        </div>
        <div style={{ flex: "1", display: "flex", minWidth: 0, minHeight: isTablet ? "70vh" : 0 }}>
          {children}
        </div>
      </div>
    </>
  );
};

export default AdminPageLayout;
