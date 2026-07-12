import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import ProductCard from "./ProductCard";
import CategoryCarousel from "./CategoryCarousel";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../store/slices/productSlice";
import { fetchCategories } from "../store/slices/categorySlice";
import useMediaQuery from "@mui/material/useMediaQuery";

const CustomCard = ({ searchTerm = "" }) => {
  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const { items: products, status, error } = useSelector((state) => state.products);
  const { items: categoryItems, status: categoryStatus } = useSelector((state) => state.categories);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const homeCategories = (categoryItems || [])
    .filter((category) => category?.isActive !== false)
    .map((category) => ({
      title: category?.title || "",
      imageKey: category?.imageKey || category?.imagekey || "",
    }))
    .filter((category) => category.title);

  const filteredProducts = products.filter((product) => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const title = (product.title || "").toLowerCase();
    const description = (product.description || "").toLowerCase();
    const productCategory = product.category || "";

    if (normalizedSearchTerm) {
      const matchesSearch = title.includes(normalizedSearchTerm) || description.includes(normalizedSearchTerm);
      if (!matchesSearch) return false;
    }

    if (selectedCategory) {
      if (productCategory !== selectedCategory) return false;
    }

    return true;
  });

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProducts());
    }
  }, [dispatch, status]);

  useEffect(() => {
    if (categoryStatus === "idle") {
      dispatch(fetchCategories());
    }
  }, [dispatch, categoryStatus]);

  return (
    <Card
      variant="outlined"
      style={{
        minHeight: "70vh",
        borderRadius: "0",
        padding: isMobile ? "0.5em 0.75em 1em" : "0.75em 1.25em 1.25em",
        margin: isMobile ? "0" : "0",
        overflowY: "auto",
        boxShadow: "none",
        border: "none",
        backgroundColor: "#ffffff",
      }}
    >
      <CardContent sx={{ p: 0, "&:last-child": { pb: 1 } }}>
        {status === "loading" && <Typography>Loading products...</Typography>}
        {status === "failed" && <Typography color="error">{error}</Typography>}
        {!selectedCategory && (
          <div
            style={{
              marginTop: "0.5em",
              backgroundColor: "#ffffff",
              padding: 0,
            }}
          >
            <CategoryCarousel
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              items={homeCategories}
              variant="blinkit"
            />
          </div>
        )}
        {selectedCategory && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5em",
              marginTop: "0.75em",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                color: "#6f7378",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.875rem",
              }}
            >
              Home
            </button>
            <Typography variant="body2" style={{ color: "#6f7378" }}>
              &gt;
            </Typography>
            <Typography variant="body2" style={{ color: "#0c831f", fontWeight: 600 }}>
              {selectedCategory}
            </Typography>
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, minmax(0, 1fr))"
              : isTablet
                ? "repeat(3, minmax(0, 1fr))"
                : "repeat(auto-fill, minmax(180px, 1fr))",
            gap: isMobile ? "10px" : "14px",
            marginTop: "1.25em",
            width: "100%",
          }}
        >
          {filteredProducts.map((product) => (
            <div key={product.id} style={{ minWidth: 0, display: "flex" }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        {status === "succeeded" && filteredProducts.length === 0 && (
          <Typography sx={{ marginTop: "1.5em", textAlign: "center", color: "text.secondary" }}>
            No products match your search.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomCard;
