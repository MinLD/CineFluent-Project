import { axiosClient } from "@/app/lib/services/api_client";
import { I_FormUser } from "@/app/lib/types/users";

const Api_Register = (username: string, email: string, password: string) => {
  return axiosClient.post("/users/", {
    username: username,
    email: email,
    password: password,
  });
};
const Api_Admin_States_Users = (token?: string) => {
  return axiosClient.get("/users/stats", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
const Api_Profile_User = (userId: string, token?: string) => {
  if (token) {
    console.log("Đang chạy Api_Profile_User từ SERVER (SSR)");
    return axiosClient.get(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  console.log("Đang chạy Api_Profile_User từ CLIENT (CSR)");
  return axiosClient.get(`/users/${userId}`);
};
const Api_Users = (token?: string, page = 1, per_page = 5) => {
  return axiosClient.get(`/users?page=${page}&per_page=${per_page}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
const Api_Admin_User = (token?: string, data?: I_FormUser) => {
  return axiosClient.post(`/users/admin`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const Api_Search_User = (keyword: string, token?: string) => {
  return axiosClient.get(`/users/search?keyword=${keyword}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const Api_Delete_User = (userId: string, token?: string) => {
  return axiosClient.delete(`/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const Api_Update_Profile = (token: string, data: I_FormUser) => {
  return axiosClient.put(`/users/profile`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};
export {
  Api_Register,
  Api_Profile_User,
  Api_Users,
  Api_Admin_User,
  Api_Search_User,
  Api_Delete_User,
  Api_Admin_States_Users,
  Api_Update_Profile,
};
