import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MdMenu, MdClose } from "react-icons/md";
import Navbar from "./Navbar";
import DashboardFeatureCard from "./DashboardFeatureCard";
import Footer from "./Footer";

const AdminPageLayout = ({ activeFeature, children }) => {
  const isTablet = useMediaQuery("(max-width:900px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            flex: sidebarOpen ? (isTablet ? "0 0 auto" : "0 0 20%") : "0 0 auto",
            display: "flex",
            flexDirection: isTablet ? "column" : "row",
            alignItems: isTablet ? "stretch" : "flex-start",
            gap: "0.5em",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Tooltip title={sidebarOpen ? "Hide menu" : "Show menu"}>
            <IconButton
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              aria-expanded={sidebarOpen}
              size="small"
              style={{
                color: "var(--brand-primary-strong)",
                border: "1px solid var(--brand-border)",
                backgroundColor: "#fff",
                flexShrink: 0,
                alignSelf: isTablet ? "flex-start" : "flex-start",
              }}
            >
              {sidebarOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
            </IconButton>
          </Tooltip>

          {sidebarOpen && (
            <div
              style={{
                flex: 1,
                display: "flex",
                minWidth: 0,
                width: "100%",
                overflow: "hidden",
              }}
            >
              <DashboardFeatureCard activeFeature={activeFeature} />
            </div>
          )}
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
