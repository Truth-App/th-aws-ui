
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import { categories } from "../constants/products";

// Color palette for category avatars
const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#95E1D3", "#C7CEEA"];

const getInitials = (text) => {
  return text
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const CategoryCarousel = ({ selectedCategory, onCategorySelect }) => {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
        padding: "8px 0",
        boxSizing: "border-box",
      }}
    >
      {categories.map((category, index) => (
        <div
          key={category}
          onClick={() => onCategorySelect(selectedCategory === category ? null : category)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            minWidth: "60px",
            cursor: "pointer",
            opacity: selectedCategory === category ? 1 : 0.7,
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              backgroundColor: colors[index % colors.length],
              fontWeight: 700,
              fontSize: "13px",
              border: selectedCategory === category ? "2px solid #165d46" : "none",
              boxShadow: selectedCategory === category ? "0 0 12px rgba(22, 93, 70, 0.3)" : "none",
            }}
          >
            {getInitials(category)}
          </Avatar>
          <Typography
            variant="caption"
            sx={{
              fontSize: "11px",
              fontWeight: selectedCategory === category ? 700 : 500,
              color: "#165d46",
              textAlign: "center",
              maxWidth: "60px",
              lineHeight: "1.2",
              wordBreak: "break-word",
            }}
          >
            {category}
          </Typography>
        </div>
      ))}
    </div>
  );
};

export default CategoryCarousel;