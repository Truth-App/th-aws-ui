import { NavLink, useNavigate } from "react-router";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState, useEffect, useMemo } from "react";
import Avatar from "@mui/material/Avatar";
import Popover from "@mui/material/Popover";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { MdPerson, MdDashboard, MdLogout, MdLogin, MdEdit, MdSearch } from "react-icons/md";
import { signInWithRedirect } from "aws-amplify/auth";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser, fetchCurrentUser } from "../store/slices/userSlice";
import { fetchUsers } from "../store/slices/usersSlice";
import {
  getDashboardHomePath,
  getUserPrivilegesFromList,
  hasDashboardAccess,
} from "../constants/dashboardFeatures";

const Navbar = ({ searchTerm = "", onSearchChange, showSearchInNavbar = false, onLogoClick }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const [anchorEl, setAnchorEl] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, status } = useSelector((state) => state.user);
  const { items: users, status: usersStatus } = useSelector((state) => state.users);
  const authResolving = status === 'idle' || status === 'loading';

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
            "Sign-in failed. Use the same URL you started from (for example http://localhost:5173)."
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: "auto",
        borderBottom: "1.5px solid #dee6de",
        padding: "0 8px",
        backgroundColor: "#ffffff",
        gap: "12px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontWeight: "600",
          fontSize: "1.5em",
          fontStyle: "bold",
          flexShrink: 0,
        }}
      >
          <NavLink to="/" end
          onClick={onLogoClick}
          style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 0 }}
          >
          <img src = "/thriftyhomelogo.png" alt="Logo" style={{ width: isMobile ? "150px" : isTablet ? "170px" : "190px", height: isMobile ? "48px" : isTablet ? "54px" : "60px", objectFit: "contain", verticalAlign: "middle" }} />
          </NavLink>
      </div>
      {showSearchInNavbar && (
        <div
          style={{
            flex: "1 1 auto",
            display: "flex",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          <TextField
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            size="small"
            placeholder="Search by name"
            variant="outlined"
            sx={{
              width: "100%",
              maxWidth: "760px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch size={18} color="#2b8c5a" />
                </InputAdornment>
              ),
            }}
          />
        </div>
      )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            width: "auto",
            gap: "1.5em",
            fontFamily: "Montserrat, sans-serif",
            fontWeight: "500",
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
        <button
          onClick={handleProfileClick}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            paddingRight: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {authResolving ? (
            <CircularProgress size={24} sx={{ color: "#165d46" }} />
          ) : (
            <Avatar
              src={user?.picture ?? undefined}
              sx={{ width: 36, height: 36, backgroundColor: "#165d46", cursor: "pointer" }}
            >
              {!user?.picture && <MdPerson size={20} color="white" />}
            </Avatar>
          )}
        </button>

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
                  sx={{ fontFamily: "Montserrat, sans-serif", fontSize: "0.8em", opacity: "1 !important", color: "#555" }}
                >
                  {user.name}
                </MenuItem>
              )}
              <Divider />
              {showDashboard && (
                <NavLink to={dashboardPath} style={{ textDecoration: "none", color: "inherit" }} onClick={handleClose}>
                  <MenuItem sx={{ fontFamily: "Montserrat, sans-serif", display: "flex", alignItems: "center", gap: "0.5em" }}>
                    <MdDashboard size={20} />
                    Dashboard
                  </MenuItem>
                </NavLink>
              )}
              <MenuItem
                onClick={handleEditProfileClick}
                sx={{ fontFamily: "Montserrat, sans-serif", display: "flex", alignItems: "center", gap: "0.5em" }}
              >
                <MdEdit size={20} />
                Edit Profile
              </MenuItem>
              <MenuItem
                onClick={handleLogout}
                sx={{ fontFamily: "Montserrat, sans-serif", display: "flex", alignItems: "center", gap: "0.5em", color: "#c0392b" }}
              >
                <MdLogout size={20} />
                Logout
              </MenuItem>
            </>
          ) : (
            <MenuItem
              onClick={handleLogin}
              sx={{ fontFamily: "Montserrat, sans-serif", display: "flex", alignItems: "center", gap: "0.5em" }}
            >
              <MdLogin size={20} />
              Sign in with Google
            </MenuItem>
          )}
        </Popover>
      </div>
    </div>
  );
};

export default Navbar;
