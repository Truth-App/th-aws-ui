import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router";
import { DASHBOARD_FEATURES } from "../constants/dashboardFeatures";

const DashboardFeatureCard = ({ activeFeature = "products" }) => {
  const navigate = useNavigate();

  return (
    <Card
      style={{
        height: "100%",
        width: "100%",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e8efeb",
      }}
    >
      <CardContent>
        {DASHBOARD_FEATURES.map((feature) => {
          const isActive = activeFeature === feature.id;
          return (
            <Button
              key={feature.id}
              onClick={() => feature.path && navigate(feature.path)}
              size="small"
              variant="contained"
              style={{
                width: "100%",
                margin: "5px 0",
                backgroundColor: isActive ? "#165d46" : "transparent",
                color: isActive ? "#fff" : "#165d46",
                border: "1px solid #165d46",
                boxShadow: isActive ? undefined : "none",
                textTransform: "none",
                fontWeight: "bolder",
              }}
            >
              {feature.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DashboardFeatureCard;
