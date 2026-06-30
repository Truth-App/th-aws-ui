import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchAuthSession } from "aws-amplify/auth";
import { fetchCurrentUser } from "../store/slices/userSlice";
import { markPostLoginSetup } from "../helpers/profileHelpers";

const isOAuthCallback = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("code") || params.has("error");
};

const cleanOAuthParamsFromUrl = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
};

/**
 * Resolves Cognito session on load, including completing the Google OAuth redirect
 * when the app returns with ?code= on the same origin that started sign-in.
 */
const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isOAuthCallback()) {
          await fetchAuthSession();
          cleanOAuthParamsFromUrl();
          markPostLoginSetup();
        }
      } catch (error) {
        console.error("OAuth callback failed:", error);
      } finally {
        dispatch(fetchCurrentUser());
      }
    };

    initializeAuth();
  }, [dispatch]);

  return children;
};

export default AuthInitializer;
