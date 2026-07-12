import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { categories as defaultCategories } from "../constants/products";
import { S3_BASE_URL } from "../constants/api";

const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#95E1D3", "#C7CEEA"];

const blinkitPastels = [
  "#F1F5FF",
  "#F3EEFF",
  "#ECFDF5",
  "#FFF7ED",
  "#FEF3C7",
  "#FCE7F3",
  "#E0F2FE",
  "#F0FDF4",
  "#FFF1F2",
  "#F5F3FF",
  "#ECFEFF",
  "#FEF9C3",
];

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

const CategoryCarousel = ({
  selectedCategory,
  onCategorySelect,
  items,
  avatarVariant = "rounded",
  useDivisionThemes = false,
  variant = "default",
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const categoryItems = (items ?? defaultCategories).map(normalizeCategory);
  const isBlinkit = variant === "blinkit" || useDivisionThemes;

  if (isBlinkit) {
    const columns = isMobile ? 4 : isTablet ? 6 : 10;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: isMobile ? "10px 8px" : "14px 12px",
          width: "100%",
          padding: isMobile ? "4px 0 8px" : "8px 0 12px",
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
        }}
      >
        {categoryItems.map((category, index) => {
          const isSelected = selectedCategory === category.title;
          const tileBg = blinkitPastels[index % blinkitPastels.length];

          return (
            <div
              key={category.title}
              onClick={() => onCategorySelect(selectedCategory === category.title ? null : category.title)}
              aria-label={category.title}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCategorySelect(selectedCategory === category.title ? null : category.title);
                }
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: isMobile ? "6px" : "8px",
                cursor: "pointer",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: isMobile ? "12px" : "16px",
                  backgroundColor: tileBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: isMobile ? "8px" : "10px",
                  boxSizing: "border-box",
                  border: isSelected ? "2px solid #0c831f" : "2px solid transparent",
                  boxShadow: isSelected ? "0 0 0 1px rgba(12, 131, 31, 0.12)" : "none",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <Avatar
                  variant="rounded"
                  src={category.imageKey ? `${S3_BASE_URL}/${category.imageKey}` : undefined}
                  imgProps={{ style: { objectFit: "contain" } }}
                  sx={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "transparent",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: isMobile ? "12px" : "15px",
                    color: "#4b5563",
                    "& img": {
                      objectFit: "contain",
                    },
                  }}
                >
                  {!category.imageKey && getInitials(category.title)}
                </Avatar>
              </div>
              <Typography
                variant="caption"
                sx={{
                  fontSize: isMobile ? "0.65rem" : "0.72rem",
                  fontWeight: isSelected ? 700 : 600,
                  color: isSelected ? "#0c831f" : "#1f1f1f",
                  textAlign: "center",
                  lineHeight: 1.25,
                  wordBreak: "break-word",
                  width: "100%",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  minHeight: isMobile ? "2em" : "2.2em",
                }}
              >
                {category.title}
              </Typography>
            </div>
          );
        })}
      </div>
    );
  }

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
            padding: 0,
          }}
        >
          <Avatar
            variant={avatarVariant}
            src={category.imageKey ? `${S3_BASE_URL}/${category.imageKey}` : undefined}
            sx={{
              width: isMobile ? "100%" : 108,
              height: isMobile ? "auto" : 108,
              aspectRatio: "1 / 1",
              backgroundColor: colors[index % colors.length],
              fontWeight: 700,
              fontSize: "15px",
              borderRadius: avatarVariant === "rounded" ? "10px" : "50%",
              border: selectedCategory === category.title ? "2px solid #165d46" : "none",
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
              color: "#000000",
              textAlign: "center",
              maxWidth: isMobile ? "100%" : "122px",
              lineHeight: "1.2",
              wordBreak: "break-word",
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
