import axios from "axios";
import { ENV } from "../config/env.config.js";

export const getPayPalAccessToken = async () => {
  const auth = Buffer.from(
    `${ENV.PAYPAL_CLIENT_ID}:${ENV.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await axios({
    url: ENV.PAY_BASE_URL + "/v1/oauth2/token",
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    data: "grant_type=client_credentials",
  });
  //console.log(response.data);
  return response.data.access_token;
};

export const paypalApi = axios.create({
  baseURL: "https://api-m.sandbox.paypal.com",
});
//getPayPalAccessToken();
