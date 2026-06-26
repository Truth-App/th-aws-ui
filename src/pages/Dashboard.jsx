import Navbar from "../components/Navbar";
import DashboardFeatureCard from "../components/DashboardFeatureCard";
import DashboardFeatureDetail from "../components/DashboardFeatureDetail";
import useMediaQuery from "@mui/material/useMediaQuery";
const Dashboard = ()=>{
    const isTablet = useMediaQuery("(max-width:900px)");
    return <>
    <Navbar />
    <div style={{display:"flex", flexDirection:isTablet ? "column" : "row", height:isTablet ? "auto" : "80vh", fontSize:isTablet ? "1em" : "1.5em", marginTop:"1em", gap:"1em", padding:isTablet ? "0 0.75em" : "0 1.5em", overflowX:"hidden"}}>
         <div style={{ flex: isTablet ? "1 1 auto" : "0 0 20%", display: "flex", minWidth: 0}}>
    <DashboardFeatureCard />
  </div>
  <div style={{ flex: "1", display: "flex", minWidth: 0, minHeight: isTablet ? "70vh" : 0}}>
    <DashboardFeatureDetail />
  </div>

    </div>
    </>
}

export default Dashboard;