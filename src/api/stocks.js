import { fetchAuthSession } from "aws-amplify/auth";
import { STOCKS_API_URL } from "../constants/api";

export const getStocks = async () => {
  const session = await fetchAuthSession();
  const accessToken = session.tokens?.accessToken?.toString() || "";

  const response = await fetch(STOCKS_API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stocks. Status: ${response.status}`);
  }

  return await response.json();
};
