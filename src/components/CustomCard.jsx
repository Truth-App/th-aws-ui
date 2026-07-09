import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import ProductCard from "./ProductCard";
import CategoryCarousel from "./CategoryCarousel";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../store/slices/productSlice";
import { fetchCategories } from "../store/slices/categorySlice";
import useMediaQuery from "@mui/material/useMediaQuery";

const CustomCard = () => {
  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const { items: products, status, error } = useSelector((state) => state.products);
  const { items: categoryItems, status: categoryStatus } = useSelector((state) => state.categories);
  const [searchTerm, setSearchTerm] = useState("");
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
        borderRadius: "16px",
        padding: isMobile ? "0.25em 0.5em 0.75em" : "0.35em 1em 1em",
        margin: isMobile ? "0.75em" : "1.5em",
        overflowY: "auto",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
    >
      <CardContent sx={{ p: 1, pt: 0, '&:last-child': { pb: 1 } }}>
        {status === "loading" && <Typography>Loading products...</Typography>}
        {status === "failed" && <Typography color="error">{error}</Typography>}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginTop: "1em",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <TextField
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            style={{ flex: 1, width: "100%" }}
            id="outlined-basic"
            label="Search groceries by name or description"
            variant="outlined"
          />
        </div>
        {!selectedCategory && (
          <div
            style={{
              marginTop: "1em",
              backgroundColor: "#fafbf9",
              padding: 0,
              borderRadius: "8px",
            }}
          >
            <CategoryCarousel
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              items={homeCategories}
              useDivisionThemes
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
            <Typography variant="body2" style={{ color: "#165d46", fontWeight: 600 }}>
              {selectedCategory}
            </Typography>
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            marginTop: "1.5em",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          {filteredProducts.map((product) => (
            <div style={{ flex: isMobile ? "1 1 calc(33.33% - 16px)" : isTablet ? "1 1 calc(33.33% - 16px)" : "0 0 240px", display: "flex", minWidth: 0 }} key={product.id}>
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
