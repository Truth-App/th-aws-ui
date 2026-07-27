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
        backgroundColor: "#e4f2ff",
        backgroundImage:
          "radial-gradient(circle at 8% 10%, rgba(72, 149, 255, 0.16) 0, rgba(72, 149, 255, 0) 34%), radial-gradient(circle at 88% 12%, rgba(37, 99, 235, 0.16) 0, rgba(37, 99, 235, 0) 36%), radial-gradient(circle at 52% -8%, rgba(96, 165, 250, 0.18) 0, rgba(96, 165, 250, 0) 32%), linear-gradient(180deg, #f6fbff 0%, #eaf5ff 52%, #dcebff 100%)",
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