import Navbar from "./Navbar";
import DashboardFeatureCard from "./DashboardFeatureCard";
import Footer from "./Footer";
import useMediaQuery from "@mui/material/useMediaQuery";

const AdminPageLayout = ({ activeFeature, children }) => {
  const isTablet = useMediaQuery("(max-width:900px)");

  return (
    <div
      style={{
        minHeight: "100dvh",
        height: isTablet ? "auto" : "100dvh",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <Navbar />
      <div
        style={{
          display: "flex",
          flexDirection: isTablet ? "column" : "row",
          flex: isTablet ? "0 0 auto" : 1,
          minHeight: isTablet ? "auto" : 0,
          fontSize: isTablet ? "1em" : "1.5em",
          marginTop: "1em",
          gap: "1em",
          padding: isTablet ? "0 0.75em" : "0 1.5em",
          overflowX: "hidden",
          overflowY: isTablet ? "visible" : "hidden",
        }}
      >
        <div
          style={{
            flex: isTablet ? "0 0 auto" : "0 0 20%",
            display: "flex",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <DashboardFeatureCard activeFeature={activeFeature} />
        </div>
        <div
          style={{
            flex: "1",
            display: "flex",
            minWidth: 0,
            minHeight: isTablet ? "auto" : 0,
            overflowY: isTablet ? "visible" : "hidden",
            overflowX: "hidden",
          }}
        >
          {children}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <Footer />
      </div>
    </div>
  );
};

export default AdminPageLayout;
