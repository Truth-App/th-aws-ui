import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import ProductCard from "./ProductCard";
import CategoryCarousel from "./CategoryCarousel";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../store/slices/productSlice";
import { fetchCategories } from "../store/slices/categorySlice";
import { MdSearch, MdArrowBack } from "react-icons/md";
import "./Storefront.css";

const CustomCard = ({ searchTerm = "", onSearchChange, showInlineSearch = false, resetKey = 0 }) => {
  const dispatch = useDispatch();
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

  useEffect(() => {
    setSelectedCategory(null);
  }, [resetKey]);

  return (
    <main className="storefront-shell">
      {showInlineSearch && (
        <section className="storefront-search-panel">
          <TextField
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            size="small"
            fullWidth
            placeholder="Search by name"
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch size={18} color="var(--brand-primary-strong)" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                backgroundColor: "#f1f3f4",
                "& fieldset": {
                  border: "none",
                },
                "&:hover fieldset": {
                  border: "none",
                },
                "&.Mui-focused fieldset": {
                  border: "none",
                },
              },
            }}
          />
        </section>
      )}

      {selectedCategory ? (
        <div className="storefront-selected-category-wrap">
          <button
            type="button"
            className="storefront-clear-category"
            onClick={() => setSelectedCategory(null)}
          >
            <MdArrowBack size={16} style={{ marginRight: "6px", verticalAlign: "text-bottom" }} />
            Back
          </button>
        </div>
      ) : (
        <section className="storefront-category-panel">
          <div className="storefront-section-head">
            <h2>Shop by Category</h2>
          </div>
          <CategoryCarousel
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            items={homeCategories}
            useDivisionThemes
          />
        </section>
      )}

      <section className="storefront-products-panel">
        <div className="storefront-section-head">
          <h2>{selectedCategory ? selectedCategory : "Products"}</h2>
        </div>

        {status === "loading" && <Typography>Loading products...</Typography>}
        {status === "failed" && <Typography color="error">{error}</Typography>}

        <div className="storefront-product-grid">
          {filteredProducts.map((product) => (
            <div className="storefront-product-cell" key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {status === "succeeded" && filteredProducts.length === 0 && (
          <Typography sx={{ marginTop: "1.5em", textAlign: "center", color: "text.secondary" }}>
            No products match your search.
          </Typography>
        )}
      </section>
    </main>
  );
};

export default CustomCard;
