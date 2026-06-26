import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchCurrentUser } from "../store/slices/userSlice";

/**
 * Dispatches fetchCurrentUser once on mount so Amplify can resolve any active
 * Cognito session (including post-OAuth redirect ?code= params) before the
 * rest of the app renders protected routes.
 */
const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return children;
};

export default AuthInitializer;
