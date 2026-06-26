import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";

const DashboardFeatureCard = ({ activeFeature, onFeatureSelect }) => {
    const features = [
        "Manage Product Catalog",
        "Category Management", 
        "User Management",
        "Inventory Management",       
        "View Orders", 
        "Earnings Summary"]
    return <>
    <Card
      style={{
        height: "100%",
        width: "100%",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e8efeb",
      }}
    >
        <CardContent>
            {features.map((feature) => {
                const isActive = activeFeature === feature;
                return (
                <Button
                    key={feature}
                    onClick={() => onFeatureSelect(feature)}
                    size="small"
                    variant="contained"
                    style={{width: "100%", margin: "5px 0", backgroundColor: isActive ? "#165d46" : "transparent", color: isActive ? "#fff" : "#165d46", border: "1px solid #165d46", boxShadow: isActive ? undefined : "none", textTransform: "none", fontWeight: "bolder" }}
                >
                    {feature}
                </Button>
            )})}
        </CardContent>
    </Card>
    </>
}

export default DashboardFeatureCard;