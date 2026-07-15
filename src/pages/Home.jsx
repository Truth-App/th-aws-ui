import { useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import Navbar from "../components/Navbar";
import CustomCard from "../components/CustomCard";
import CartFloater from "../components/CartFloater";

const Home = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff1f6",
      }}
    >
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} showSearchInNavbar={!isMobile} />
      <CustomCard
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showInlineSearch={isMobile}
      />
      <CartFloater />
    </div>
  );
};

export default Home;