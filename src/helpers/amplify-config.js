import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-south-2_54QzEQNXo",
      userPoolClientId: "32na2c13lt6cj43e0one083ejr",
      loginWith: {
        oauth: {
          domain: "ap-south-254qzeqnxo.auth.ap-south-2.amazoncognito.com",
          scopes: ["openid", "email", "profile"],
          redirectSignIn: ["https://d2n3ipabg4cniq.cloudfront.net"],
          redirectSignOut: ["https://d2n3ipabg4cniq.cloudfront.net"],
          responseType: "code",
        },
      },
    },
  },
});
