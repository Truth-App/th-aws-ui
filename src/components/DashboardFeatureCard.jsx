import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";

const DashboardFeatureCard = () => {
    const features = ["Manage Product Catalog", "User Management", "View Orders", "Earnings Summary"]
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
            {features.map((feature, index) => (
                <Button
                    key={index}
                    onClick={() => {
                        
                    }}
                    size="small"
                    variant="contained"
                    style={{width: "100%", margin: "5px 0", backgroundColor: index === 0 ? "#165d46" : "transparent", color: index === 0 ? "#fff" : "#165d46", border: "1px solid #165d46", boxShadow: index === 0 ? undefined : "none", textTransform: "none", fontWeight: "bolder" }}
                >
                    {feature}
                </Button>
            ))}
        </CardContent>
    </Card>
    </>
}

export default DashboardFeatureCard;