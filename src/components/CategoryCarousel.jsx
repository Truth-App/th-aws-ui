
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { categories as defaultCategories } from "../constants/products";
import { S3_BASE_URL } from "../constants/api";

// Color palette for category avatars
const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#95E1D3", "#C7CEEA"];

const divisionThemes = {
  "Home Care": {
    borderColor: "#4aa3ff",
    labelColor: "#1f1f1f",
  },
  "Laundry Care": {
    borderColor: "#00acc1",
    labelColor: "#1f1f1f",
  },
  "Personal Care": {
    borderColor: "#d4af37",
    labelColor: "#1f1f1f",
  },
  "Wellness & Nutrition": {
    borderColor: "#1b5e20",
    labelColor: "#1f1f1f",
  },
  "Pain Relief": {
    borderColor: "#1976d2",
    labelColor: "#1f1f1f",
  },
  "Foods & Staples": {
    borderColor: "#2e7d32",
    labelColor: "#1f1f1f",
  },
  "Agri & Natural Products": {
    borderColor: "#2f5d3a",
    labelColor: "#1f1f1f",
  },
};

const categoryAliases = {
  "Home Cleaning Solutions": "Home Care",
  "Laundry Care": "Laundry Care",
  "Fragrance & Phenyl Collection": "Laundry Care",
  "Herbal Shampoos": "Personal Care",
  "Hair Oils": "Personal Care",
  "Hand Washes": "Personal Care",
  "Moisturizers": "Personal Care",
  "Herbal Soaps": "Personal Care",
  "Herbal Supplements": "Wellness & Nutrition",
  "Traditional Care": "Agri & Natural Products",
  "Herbal Beverages": "Foods & Staples",
};

const fallbackThemeColors = ["#4aa3ff", "#00acc1", "#d4af37", "#1b5e20", "#1976d2", "#2e7d32", "#2f5d3a"];

const getInitials = (text) => {
  return text
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const normalizeCategory = (item) => {
  if (typeof item === "string") {
    return { title: item, imageKey: "" };
  }
  return { title: item.title || "", imageKey: item.imageKey || item.imagekey || "" };
};

const CategoryCarousel = ({ selectedCategory, onCategorySelect, items, avatarVariant = "rounded", useDivisionThemes = false }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const categoryItems = (items ?? defaultCategories).map(normalizeCategory);

  const getCategoryTheme = (title, index) => {
    if (!useDivisionThemes) {
      return {
        backgroundColor: colors[index % colors.length],
        borderColor: "transparent",
        labelColor: "#000000",
      };
    }

    const normalizedTitle = categoryAliases[title] || title;
    const theme = divisionThemes[normalizedTitle];
    if (theme) {
      return {
        backgroundColor: "transparent",
        borderColor: theme.borderColor,
        labelColor: theme.labelColor,
      };
    }

    return {
      backgroundColor: "transparent",
      borderColor: fallbackThemeColors[index % fallbackThemeColors.length],
      labelColor: "#1f1f1f",
    };
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: isMobile ? "space-between" : "center",
        gap: isMobile ? "8px" : "10px",
        width: "100%",
        padding: "8px 0",
        boxSizing: "border-box",
        overflowX: "visible",
      }}
    >
      {categoryItems.map((category, index) => (
        <div
          key={category.title}
          onClick={() => onCategorySelect(selectedCategory === category.title ? null : category.title)}
          aria-label={category.title}
          role="button"
          tabIndex={0}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
            minWidth: isMobile ? "calc((100% - 24px) / 4)" : "122px",
            flex: isMobile ? "0 0 calc((100% - 24px) / 4)" : "0 0 auto",
            cursor: "pointer",
            padding: useDivisionThemes ? "6px 4px 8px" : 0,
            borderRadius: useDivisionThemes ? "14px" : 0,
            backgroundColor: "transparent",
            boxShadow: useDivisionThemes 
              ? selectedCategory === category.title
                ? `0 0 0 2px ${getCategoryTheme(category.title, index).borderColor}`
                : `0 0 0 1px ${getCategoryTheme(category.title, index).borderColor} inset`
              : "none",
            border: useDivisionThemes
              ? selectedCategory === category.title
                ? `2px solid ${getCategoryTheme(category.title, index).borderColor}`
                : `0.3px solid ${getCategoryTheme(category.title, index).borderColor}`
              : "none",
          }}
        >
          <Avatar
            variant={avatarVariant}
            src={category.imageKey ? `${S3_BASE_URL}/${category.imageKey}` : undefined}
            sx={{
              width: isMobile ? "100%" : 108,
              height: isMobile ? "auto" : 108,
              aspectRatio: "1 / 1",
              backgroundColor: useDivisionThemes ? "transparent" : colors[index % colors.length],
              fontWeight: 700,
              fontSize: "15px",
              borderRadius: avatarVariant === "rounded" ? "10px" : "50%",
              border: "none",
              boxShadow: "none",
            }}
          >
            {!category.imageKey && getInitials(category.title)}
          </Avatar>
          <Typography
            variant="caption"
            sx={{
              fontSize: "11px",
              fontWeight: 600,
              color: useDivisionThemes ? getCategoryTheme(category.title, index).labelColor : "#000000",
              textAlign: "center",
              maxWidth: isMobile ? "100%" : "122px",
              lineHeight: "1.2",
              wordBreak: "break-word",
              textShadow: useDivisionThemes ? "0 1px 2px rgba(0, 0, 0, 0.25)" : "none",
            }}
          >
            {category.title}
          </Typography>
        </div>
      ))}
    </div>
  );
};

export default CategoryCarousel;