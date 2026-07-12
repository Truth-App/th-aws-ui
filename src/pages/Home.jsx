import Navbar from "../components/Navbar";
import CustomCard from "../components/CustomCard";
import CartFloater from "../components/CartFloater";
import { useState } from "react";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <>
      <Navbar showSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <CustomCard searchTerm={searchTerm} />
      <CartFloater />
    </>
  );
};

export default Home;
