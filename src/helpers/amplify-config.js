import { Amplify } from "aws-amplify";

const PRODUCTION_ORIGIN = "https://d2n3ipabg4cniq.cloudfront.net";

const getRedirectUrls = () => {
  const urls = new Set([PRODUCTION_ORIGIN]);

  if (typeof window !== "undefined") {
    urls.add(window.location.origin);
  }

  if (import.meta.env.DEV) {
    [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5173",
    ].forEach((url) => urls.add(url));
  }

  return [...urls];
};

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-south-2_54QzEQNXo",
      userPoolClientId: "32na2c13lt6cj43e0one083ejr",
      loginWith: {
        oauth: {
          domain: "ap-south-254qzeqnxo.auth.ap-south-2.amazoncognito.com",
          scopes: ["openid", "email", "profile"],
          redirectSignIn: getRedirectUrls(),
          redirectSignOut: getRedirectUrls(),
          responseType: "code",
        },
      },
    },
  },
});
