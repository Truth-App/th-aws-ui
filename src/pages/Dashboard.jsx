import { useState } from "react";
import Navbar from "../components/Navbar";
import DashboardFeatureCard from "../components/DashboardFeatureCard";
import DashboardFeatureDetail from "../components/DashboardFeatureDetail";
import CategoryManagement from "../components/CategoryManagement";
import UserManagement from "../components/UserManagement";
import InventoryManagement from "../components/InventoryManagement";
import useMediaQuery from "@mui/material/useMediaQuery";

const Dashboard = () => {
    const isTablet = useMediaQuery("(max-width:900px)");
    const [activeFeature, setActiveFeature] = useState("Manage Product Catalog");

    const renderFeatureDetail = () => {
        if (activeFeature === "Category Management") return <CategoryManagement />;
        if (activeFeature === "User Management") return <UserManagement />;
        if (activeFeature === "Inventory Management") return <InventoryManagement />;
        return <DashboardFeatureDetail />;
    };

    return <>
    <Navbar />
    <div style={{display:"flex", flexDirection:isTablet ? "column" : "row", height:isTablet ? "auto" : "80vh", fontSize:isTablet ? "1em" : "1.5em", marginTop:"1em", gap:"1em", padding:isTablet ? "0 0.75em" : "0 1.5em", overflowX:"hidden"}}>
         <div style={{ flex: isTablet ? "1 1 auto" : "0 0 20%", display: "flex", minWidth: 0}}>
    <DashboardFeatureCard activeFeature={activeFeature} onFeatureSelect={setActiveFeature} />
  </div>
  <div style={{ flex: "1", display: "flex", minWidth: 0, minHeight: isTablet ? "70vh" : 0}}>
    {renderFeatureDetail()}
  </div>

    </div>
    </>
}

export default Dashboard;