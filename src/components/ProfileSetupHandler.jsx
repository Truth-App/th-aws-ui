import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { fetchUsers } from "../store/slices/usersSlice";
import {
  canShowEditProfile,
  consumePostLoginSetup,
  findUserByEmail,
  hasSkippedProfileSetup,
} from "../helpers/profileHelpers";

const POST_LOGIN_SETUP_KEY = "th_post_login_setup";

const peekPostLoginSetup = () => {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(POST_LOGIN_SETUP_KEY) === "1";
};

/** New / incomplete Google profiles should complete Edit Profile before using the app. */
const isProfileIncomplete = (user) => {
  if (!user) return true;
  const pincode = String(user.pincode ?? "").trim();
  const mobile = String(user.mobile ?? "").trim();
  const aadhar = String(user.aadharnumber ?? user.aadharNumber ?? "").trim();
  const address = String(user.address ?? "").trim();
  return (
    !/^\d{6}$/.test(pincode) ||
    !/^\d{10}$/.test(mobile) ||
    !/^\d{12}$/.test(aadhar) ||
    !address
  );
};

const ProfileSetupHandler = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const navigatedRef = useRef(false);

  const { isAuthenticated, user: authUser, status: authStatus } = useSelector(
    (state) => state.user,
  );
  const { items: users, status: usersStatus } = useSelector((state) => state.users);

  useEffect(() => {
    if (isAuthenticated && usersStatus === "idle") {
      dispatch(fetchUsers());
    }
  }, [dispatch, isAuthenticated, usersStatus]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      authStatus !== "succeeded" ||
      usersStatus !== "succeeded" ||
      !authUser?.email ||
      location.pathname === "/profile/edit"
    ) {
      return;
    }

    // Avoid navigating twice in the same session after a successful redirect.
    if (navigatedRef.current) return;

    const matchedUser = findUserByEmail(users, authUser.email);
    const skipped = hasSkippedProfileSetup(authUser.id);
    const wantsPostLoginSetup = peekPostLoginSetup();
    const needsProfile =
      !matchedUser || isProfileIncomplete(matchedUser) || wantsPostLoginSetup;

    const shouldOpenSetup =
      needsProfile &&
      !skipped &&
      canShowEditProfile(matchedUser);

    if (!shouldOpenSetup) {
      // Clear one-shot flag if we decided not to open (e.g. canshoweditprofile=false).
      if (wantsPostLoginSetup) consumePostLoginSetup();
      return;
    }

    navigatedRef.current = true;
    consumePostLoginSetup();
    navigate("/profile/edit?setup=1", { replace: true });
  }, [
    authStatus,
    authUser,
    dispatch,
    isAuthenticated,
    location.pathname,
    navigate,
    users,
    usersStatus,
  ]);

  // Allow redirect again after logout → next Google login.
  useEffect(() => {
    if (!isAuthenticated) {
      navigatedRef.current = false;
    }
  }, [isAuthenticated]);

  return children;
};

export default ProfileSetupHandler;
