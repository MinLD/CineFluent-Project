import { axiosClient } from "@/app/lib/services/api_client";

const Api_Login = (email: string, password: string) => {
  return axiosClient.post("/auth/login", {
    email: email,
    password: password,
  });
};
const Api_Refresh_Token = (refresh_token: string) => {
  console.log("Đang gọi Api_Refresh_Token với token:", refresh_token);
  return axiosClient.post(
    "/auth/refresh",
    {},
    {
      headers: {
        Authorization: `Bearer ${refresh_token}`,
      },
    }
  );
};
const Api_Logout = (token: string) => {
  return axiosClient.post(
    "/auth/logout",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
const Api_GoogleLogin = (credential: string) => {
  return axiosClient.post("/auth/google-login", {
    credential: credential,
  });
};
export { Api_Login, Api_Refresh_Token, Api_Logout, Api_GoogleLogin };
