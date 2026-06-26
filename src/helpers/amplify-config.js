import { Amplify } from "aws-amplify";

const PROD_ORIGIN = "https://d2n3ipabg4cniq.cloudfront.net";
const LOCAL_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];
const currentOrigin = typeof window !== "undefined" ? window.location.origin : PROD_ORIGIN;

// Keep current origin first so Amplify picks the URL that initiated OAuth.
const redirectOrigins = Array.from(new Set([currentOrigin, ...LOCAL_ORIGINS, PROD_ORIGIN]));

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-south-2_54QzEQNXo",
      userPoolClientId: "32na2c13lt6cj43e0one083ejr",
      loginWith: {
        oauth: {
          domain: "ap-south-254qzeqnxo.auth.ap-south-2.amazoncognito.com",
          scopes: ["openid", "email", "profile"],
          redirectSignIn: redirectOrigins,
          redirectSignOut: redirectOrigins,
          responseType: "code",
        },
      },
    },
  },
});
