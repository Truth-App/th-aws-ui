import { useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import Navbar from "../components/Navbar";
import CustomCard from "../components/CustomCard";
import CartFloater from "../components/CartFloater";
import Footer from "../components/Footer";

const Home = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryResetKey, setCategoryResetKey] = useState(0);

  const handleLogoClick = () => {
    setSearchTerm("");
    setCategoryResetKey((previous) => previous + 1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff1f6",
      }}
    >
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showSearchInNavbar={!isMobile}
        onLogoClick={handleLogoClick}
      />
      <CustomCard
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showInlineSearch={isMobile}
        resetKey={categoryResetKey}
      />
      <Footer />
      <CartFloater />
    </div>
  );
};

export default Home;