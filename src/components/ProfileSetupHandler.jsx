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

const ProfileSetupHandler = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const setupHandledRef = useRef(false);

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
    const runPostLoginSetup = async () => {
      if (
        !isAuthenticated ||
        authStatus !== "succeeded" ||
        usersStatus !== "succeeded" ||
        setupHandledRef.current ||
        !authUser?.email
      ) {
        return;
      }

      setupHandledRef.current = true;

      // Do not auto-create incomplete Google users (missing pincode burns DynamoDB sequence IDs).
      // New users complete required fields on /profile/edit, then createUser runs with validation.
      const matchedUser = findUserByEmail(users, authUser.email);
      const wantsPostLoginSetup = consumePostLoginSetup();
      const needsFirstTimeProfile = !matchedUser;

      const shouldOpenSetup =
        (needsFirstTimeProfile || wantsPostLoginSetup) &&
        !hasSkippedProfileSetup(authUser.id) &&
        canShowEditProfile(matchedUser) &&
        location.pathname !== "/profile/edit";

      if (shouldOpenSetup) {
        navigate("/profile/edit?setup=1", { replace: true });
      }
    };

    runPostLoginSetup();
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

  return children;
};

export default ProfileSetupHandler;
