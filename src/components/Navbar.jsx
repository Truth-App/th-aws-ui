import { NavLink, useNavigate } from "react-router";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState, useEffect, useMemo } from "react";
import Avatar from "@mui/material/Avatar";
import Popover from "@mui/material/Popover";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import InputBase from "@mui/material/InputBase";
import {
  MdPerson,
  MdDashboard,
  MdLogout,
  MdLogin,
  MdEdit,
  MdSearch,
} from "react-icons/md";
import { signInWithRedirect } from "aws-amplify/auth";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser, fetchCurrentUser } from "../store/slices/userSlice";
import { fetchUsers } from "../store/slices/usersSlice";
import {
  getDashboardHomePath,
  getUserPrivilegesFromList,
  hasDashboardAccess,
} from "../constants/dashboardFeatures";

const Navbar = ({ showSearch = false, searchTerm = "", onSearchChange }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const [anchorEl, setAnchorEl] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, status } = useSelector((state) => state.user);
  const { items: users, status: usersStatus } = useSelector((state) => state.users);
  const authResolving = status === "idle" || status === "loading";

  useEffect(() => {
    if (isAuthenticated && usersStatus === "idle") {
      dispatch(fetchUsers());
    }
  }, [dispatch, isAuthenticated, usersStatus]);

  const userPrivileges = useMemo(
    () => getUserPrivilegesFromList(users, user?.email),
    [users, user?.email],
  );

  const showDashboard = hasDashboardAccess(userPrivileges);
  const dashboardPath = getDashboardHomePath("", userPrivileges);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = async () => {
    handleClose();
    try {
      await signInWithRedirect({ provider: "Google" });
    } catch (error) {
      if (error.name === "UserAlreadyAuthenticatedException") {
        dispatch(fetchCurrentUser());
      } else {
        console.error("Google sign-in failed:", error);
        alert(
          error.message ||
            "Sign-in failed. Use the same URL you started from (for example http://localhost:5173).",
        );
      }
    }
  };

  const handleLogout = () => {
    handleClose();
    dispatch(logoutUser());
  };

  const handleEditProfileClick = () => {
    handleClose();
    navigate("/profile/edit");
  };

  const open = Boolean(anchorEl);

  const searchField = showSearch ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flex: 1,
        minWidth: 0,
        maxWidth: isMobile ? "100%" : isTablet ? "420px" : "560px",
        width: isMobile ? "100%" : "auto",
        height: isMobile ? "42px" : "46px",
        padding: "0 14px",
        borderRadius: "12px",
        backgroundColor: "#f8f8f8",
        border: "1px solid #e8e8e8",
        boxSizing: "border-box",
      }}
    >
      <MdSearch size={20} color="#868686" style={{ flexShrink: 0 }} />
      <InputBase
        value={searchTerm}
        onChange={(e) => onSearchChange?.(e.target.value)}
        placeholder='Search "products"'
        fullWidth
        sx={{
          fontSize: isMobile ? "0.85rem" : "0.9rem",
          color: "#1a1a1a",
          "& input::placeholder": {
            color: "#9a9a9a",
            opacity: 1,
          },
        }}
      />
    </div>
  ) : null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1200,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #eeeeee",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between",
          gap: isMobile ? "10px" : "16px",
          padding: isMobile ? "10px 12px 12px" : "10px 20px",
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: isMobile ? "10px" : "18px",
            minWidth: 0,
            width: isMobile ? "100%" : "auto",
          }}
        >
          <NavLink
            to="/"
            end
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            <img
              src="/thriftyhomelogo.png"
              alt="Thrifty Home"
              style={{
                width: isMobile ? "42px" : "52px",
                height: isMobile ? "42px" : "52px",
                objectFit: "contain",
              }}
            />
            {!isMobile && (
              <span
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  whiteSpace: "nowrap",
                }}
              >
                Thrifty Home
              </span>
            )}
          </NavLink>

          {isMobile && (
            <button
              onClick={handleProfileClick}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              {authResolving ? (
                <CircularProgress size={22} sx={{ color: "#0c831f" }} />
              ) : isAuthenticated ? (
                <Avatar
                  src={user?.picture ?? undefined}
                  sx={{ width: 32, height: 32, backgroundColor: "#0c831f", cursor: "pointer" }}
                >
                  {!user?.picture && <MdPerson size={18} color="white" />}
                </Avatar>
              ) : (
                <span
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#1a1a1a",
                  }}
                >
                  Login
                </span>
              )}
            </button>
          )}
        </div>

        {!isMobile && searchField}

        {isMobile && searchField}

        {!isMobile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexShrink: 0,
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            {authResolving ? (
              <CircularProgress size={24} sx={{ color: "#0c831f" }} />
            ) : isAuthenticated ? (
              <button
                onClick={handleProfileClick}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Avatar
                  src={user?.picture ?? undefined}
                  sx={{ width: 36, height: 36, backgroundColor: "#0c831f", cursor: "pointer" }}
                >
                  {!user?.picture && <MdPerson size={20} color="white" />}
                </Avatar>
              </button>
            ) : (
              <button
                onClick={handleProfileClick}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 4px",
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#1a1a1a",
                }}
              >
                Login
              </button>
            )}
          </div>
        )}
      </div>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {isAuthenticated ? (
          <>
            {user?.name && (
              <MenuItem
                disabled
                sx={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "0.8em",
                  opacity: "1 !important",
                  color: "#555",
                }}
              >
                {user.name}
              </MenuItem>
            )}
            <Divider />
            {showDashboard && (
              <NavLink to={dashboardPath} style={{ textDecoration: "none", color: "inherit" }} onClick={handleClose}>
                <MenuItem
                  sx={{
                    fontFamily: "Montserrat, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5em",
                  }}
                >
                  <MdDashboard size={20} />
                  Dashboard
                </MenuItem>
              </NavLink>
            )}
            <MenuItem
              onClick={handleEditProfileClick}
              sx={{
                fontFamily: "Montserrat, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "0.5em",
              }}
            >
              <MdEdit size={20} />
              Edit Profile
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{
                fontFamily: "Montserrat, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "0.5em",
                color: "#c0392b",
              }}
            >
              <MdLogout size={20} />
              Logout
            </MenuItem>
          </>
        ) : (
          <MenuItem
            onClick={handleLogin}
            sx={{
              fontFamily: "Montserrat, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "0.5em",
            }}
          >
            <MdLogin size={20} />
            Sign in with Google
          </MenuItem>
        )}
      </Popover>
    </div>
  );
};

export default Navbar;
