import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";

const AdminPlaceholder = ({ title, description }) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Card
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e8efeb",
      }}
    >
      <CardContent style={{ padding: isMobile ? "8px 12px" : "16px" }}>
        <Typography variant="h6" style={{ fontWeight: 700, color: "#165d46" }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" style={{ marginTop: "8px" }}>
          {description}
        </Typography>
        <Typography style={{ marginTop: "2em", textAlign: "center", color: "#6f7378" }}>
          Coming soon.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AdminPlaceholder;
