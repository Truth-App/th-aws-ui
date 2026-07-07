import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { fetchUsers } from "../store/slices/usersSlice";
import { createUser } from "../api/users";
import {
  buildGoogleUserPayload,
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

      let currentUsers = users;
      let matchedUser = findUserByEmail(currentUsers, authUser.email);

      if (!matchedUser) {
        try {
          await createUser(buildGoogleUserPayload(authUser));
          currentUsers = await dispatch(fetchUsers()).unwrap();
          matchedUser = findUserByEmail(currentUsers, authUser.email);
        } catch (error) {
          console.error("Failed to save Google user profile:", error);
        }
      }

      const shouldOpenSetup =
        consumePostLoginSetup() &&
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
