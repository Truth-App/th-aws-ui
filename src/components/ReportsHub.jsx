import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import OrdersPincodeReport from "./OrdersPincodeReport";
import SalesPincodeReport from "./SalesPincodeReport";
import OnboardingUsersReport from "./OnboardingUsersReport";
import ProductsSoldReport from "./ProductsSoldReport";

const REPORT_TABS = [
  { id: "orders", label: "Orders" },
  { id: "sales", label: "Sales" },
  { id: "customers", label: "Customers" },
  { id: "products", label: "Products Sold" },
];

const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} style={{ width: "100%" }}>
    {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
  </div>
);

const ReportsHub = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = useMemo(() => {
    const tabParam = (searchParams.get("tab") || "orders").toLowerCase();
    const index = REPORT_TABS.findIndex((tab) => tab.id === tabParam);
    return index >= 0 ? index : 0;
  }, [searchParams]);

  const [tabIndex, setTabIndex] = useState(initialTab);

  const handleTabChange = (_event, nextIndex) => {
    setTabIndex(nextIndex);
    setSearchParams({ tab: REPORT_TABS[nextIndex].id });
  };

  return (
    <Card
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        border: "none",
        boxShadow: "none",
        backgroundColor: "#ffffff",
      }}
    >
      <CardContent style={{ padding: isMobile ? "12px" : "16px" }}>
        <Typography variant="h6" style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: "0.25em" }}>
          Reports
        </Typography>
        <Typography variant="body2" color="text.secondary" style={{ marginBottom: "1em" }}>
          Orders and sales by pincode, customer onboarding by role, and products sold by category.
        </Typography>

        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{
            borderBottom: "1px solid #e8e8e8",
            mb: 1,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 44,
            },
            "& .Mui-selected": {
              color: "#0c831f",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#0c831f",
            },
          }}
        >
          {REPORT_TABS.map((tab) => (
            <Tab key={tab.id} label={tab.label} />
          ))}
        </Tabs>

        <TabPanel value={tabIndex} index={0}>
          <OrdersPincodeReport embedded />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <SalesPincodeReport embedded />
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <OnboardingUsersReport embedded />
        </TabPanel>
        <TabPanel value={tabIndex} index={3}>
          <ProductsSoldReport embedded />
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default ReportsHub;
