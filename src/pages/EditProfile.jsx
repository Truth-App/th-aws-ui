import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import EditUserProfile from "../components/UserManagement";
import { fetchUsers } from "../store/slices/usersSlice";
import { canShowEditProfile, findUserByEmail } from "../helpers/profileHelpers";

const EditProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.user.user);
  const { items: users, status: usersStatus } = useSelector((state) => state.users);

  useEffect(() => {
    if (usersStatus === "idle") {
      dispatch(fetchUsers());
    }
  }, [dispatch, usersStatus]);

  const matchedUser = useMemo(
    () => findUserByEmail(users, authUser?.email),
    [users, authUser?.email],
  );

  const showEditProfile = useMemo(
    () => canShowEditProfile(matchedUser),
    [matchedUser],
  );

  useEffect(() => {
    if (usersStatus === "succeeded" && matchedUser && !showEditProfile) {
      navigate("/", { replace: true });
    }
  }, [usersStatus, matchedUser, showEditProfile, navigate]);

  if (usersStatus === "loading" || usersStatus === "idle") {
    return (
      <>
        <Navbar />
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", minHeight: "70vh" }} />
      </>
    );
  }

  if (usersStatus === "succeeded" && matchedUser && !showEditProfile) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", minHeight: "70vh" }} />
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
    </>
  );
};

export default EditProfile;
