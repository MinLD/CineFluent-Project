"use client";
import React, { useState, FormEvent } from "react";

// --- Mocked dependencies for demonstration ---
// In your real project, you would import these from your actual files.

// --- End Mocked dependencies ---

// --- Icons for Forgot Password Form ---
const MailIconForgot = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6 text-gray-400"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-16 h-16 text-emerald-500"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
// --- End Icons ---
type ForgotPasswordFormProps = {
  setIsLogin: (value: string) => void;
};
export default function ForgotPasswordForm({
  setIsLogin,
}: ForgotPasswordFormProps) {
  // --- State for Forgot Password ---
  const [stage, setStage] = useState<"request" | "verify" | "success">(
    "request"
  );
  setStage("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // --- End State ---

  // --- Submit handler for requesting OTP ---
  const handleRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    // try {
    //   const res = await ForgotPassword(email);
    //   if (res.status !== 200) {
    //     setError(res.data.message);
    //     return;
    //   }
    //   setStage("verify");
    // } catch (err: any) {
    //   console.log(err);
    //   setError(err.response.data.message || "An error occurred");
    // } finally {
    //   setIsLoading(false);
    // }
  };

  // --- Submit handler for resetting password with OTP ---
  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    // try {
    //   setIsLoading(true);
    //   const res = await ResetPassword(email, otp, newPassword);
    //   console.log(email, otp, newPassword);
    //   console.log(res);
    //   if (res.status !== 200) {
    //     toast.error(res.data.message);
    //     return;
    //   }
    //   setStage("success");
    //   toast.success("Đặt lại mật khẩu thành công!");
    // } catch (err: any) {
    //   if (err.response.data.code === 443) {
    //     toast.error("OTP không đúng!");
    //     return;
    //   }
    //   console.log(err);
    //   toast.error(err.response.data.message || "An error occurred");
    // } finally {
    //   setIsLoading(false);
    // }
  };

  return (
    <div className="min-h-auto  flex justify-center items-center py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-2">
        <div className=" py-2">
          {stage === "request" && (
            <>
              <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
                Quên mật khẩu?
              </h1>
              <p className="text-center text-gray-500 mb-6">
                Đừng lo lắng! Vui lòng nhập email của bạn để nhận mã xác thực.
              </p>
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <MailIconForgot />
                    </span>
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="nhapemail@example.com"
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-300 transition-all duration-300"
                  >
                    {isLoading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      "Gửi mã OTP"
                    )}
                  </button>
                </div>
              </form>
              <div className="mt-6 text-center">
                <a
                  href="/login"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Quay lại Đăng nhập
                </a>
              </div>
            </>
          )}
          {stage === "verify" && (
            <>
              <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
                Đặt lại mật khẩu
              </h1>
              <p className="text-center text-gray-500 mb-6">
                Một mã OTP đã được gửi đến{" "}
                <span className="font-semibold">{email}</span>. Vui lòng nhập mã
                và mật khẩu mới.
              </p>
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Mã OTP (6 chữ số)
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition tracking-[.5em] text-center"
                    placeholder="_ _ _ _ _ _"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Mật khẩu mới
                  </label>
                  <input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm-new-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    id="confirm-new-password"
                    name="confirmNewPassword"
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 text-center">{error}</p>
                )}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 transition-all duration-300"
                  >
                    {isLoading ? "Đang xử lý..." : "Xác nhận"}
                  </button>
                </div>
              </form>
              <div className="mt-6 text-center">
                <div
                  onClick={() => setIsLogin("login")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Quay lại Đăng nhập
                </div>
              </div>
            </>
          )}
          {stage === "success" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircleIcon />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Thành công!
              </h1>
              <p className="text-gray-500">
                Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập
                lại.
              </p>
              <div
                onClick={() => setIsLogin("login")}
                className="mt-6 inline-block w-full text-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-all duration-300"
              >
                Đi đến trang Đăng nhập
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
