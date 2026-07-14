import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EditUserProfile from "../components/UserManagement";
import { fetchUsers } from "../store/slices/usersSlice";

const EditProfile = () => {
  const dispatch = useDispatch();
  const { status: usersStatus } = useSelector((state) => state.users);

  useEffect(() => {
    if (usersStatus === "idle") {
      dispatch(fetchUsers());
    }
  }, [dispatch, usersStatus]);

  if (usersStatus === "loading" || usersStatus === "idle") {
    return (
      <>
        <Navbar />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "70vh",
          }}
        >
          <CircularProgress sx={{ color: "#165d46" }} />
        </Box>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div
        style={{
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
          minHeight: "70vh",
        }}
      >
        <EditUserProfile profileMode />
      </div>
      <Footer />
    </>
  );
};

export default EditProfile;
