import { NavLink } from "react-router";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Popover from "@mui/material/Popover";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import { MdPerson, MdDashboard, MdLogout, MdLogin } from "react-icons/md";
import { signInWithRedirect } from "aws-amplify/auth";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser, fetchCurrentUser } from "../store/slices/userSlice";

const Navbar = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const [anchorEl, setAnchorEl] = useState(null);

  const dispatch = useDispatch();
  const { isAuthenticated, user, status } = useSelector((state) => state.user);
  const authResolving = status === 'idle' || status === 'loading';

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
      if (error.name === 'UserAlreadyAuthenticatedException') {
        dispatch(fetchCurrentUser());
      } else {
        throw error;
      }
    }
  };

  const handleLogout = () => {
    handleClose();
    dispatch(logoutUser());
  };

  const open = Boolean(anchorEl);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: "auto",
        borderBottom: "1.5px solid #dee6de",
        padding: 0,
        backgroundColor: "#f5f7f0",
        gap: 0,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: "600", fontSize: "1.5em", fontStyle: "bold" }}>
        <NavLink to="/" end
        style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 0 }}
        >
        <img src = "/thriftyhomelogo.png" alt="Logo" style={{ width: isMobile ? "150px" : isTablet ? "170px" : "190px", height: isMobile ? "48px" : isTablet ? "54px" : "60px", objectFit: "contain", verticalAlign: "middle" }} />
        <span style={{ fontSize: isMobile ? "0.75em" : "0.85em", fontWeight: 650, color: "inherit", whiteSpace: "nowrap", marginLeft: "-0.3em" }}>Thrifty Home</span>
        </NavLink>
      </div>
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
              <NavLink to="/dashboard" style={{ textDecoration: "none", color: "inherit" }} onClick={handleClose}>
                <MenuItem sx={{ fontFamily: "Montserrat, sans-serif", display: "flex", alignItems: "center", gap: "0.5em" }}>
                  <MdDashboard size={20} />
                  Dashboard
                </MenuItem>
              </NavLink>
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
