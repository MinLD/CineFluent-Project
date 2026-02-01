"use-client";
import { Calendar, Lock, Mail, Phone, Save, User } from "lucide-react";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ComponentType, SVGProps, useState } from "react";
import InputBox from "@/app/components/input_box";
import { updateUserProfileAction } from "@/app/lib/actions/users";
import { toast } from "sonner"; // Assuming sonner is used for notifications
import _ from "lodash"; // Helper for object comparison if needed, or simple JS

type FormData = {
  email: string;
  fullname?: string;
  phone?: string;
  bio?: string;
  date_of_birth?: string;
  social_links?: string;
};

type Form = {
  label: string;
  type: string;
  name: keyof FormData; // Stronger typing
  placeholder?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const UserInformation = () => {
  const { profile_user, updateAuth, token } = useAuth(); // Assuming updateAuth or similar exists for optimistic updates
  const user = profile_user;
  const [isLoading, setIsLoading] = useState(false);

  const data: Form[] = [
    {
      label: "Họ và tên",
      type: "text",
      name: "fullname",
      placeholder: "Nhập tên đầy đủ của bạn",
      icon: User,
    },
    {
      label: "Số điện thoại",
      type: "text",
      name: "phone",
      placeholder: "Nhập số điện thoại của bạn",
      icon: Phone,
    },
    {
      label: "Ngày sinh",
      type: "date",
      name: "date_of_birth",
      placeholder: "Nhập ngày sinh của bạn",
      icon: Calendar,
    },
  ];

  const validationSchema = Yup.object({
    fullname: Yup.string()
      .min(5, "Họ và tên đầy đủ phải có ít nhất 5 ký tự")
      .required("Bắt buộc"),
    email: Yup.string().email("Email không hợp lệ").required("Bắt buộc"),
    phone: Yup.string().matches(
      /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
      "Số điện thoại không hợp lệ"
    ),
    date_of_birth: Yup.string(), // Provide loose validation for date string
    bio: Yup.string().max(500, "Mô tả tối đa 500 ký tự"),
    social_links: Yup.string().url("Phải là đường dẫn hợp lệ"),
  });

  const formik = useFormik({
    initialValues: {
      fullname: user?.profile?.fullname || "",
      email: user?.email || "",
      phone: user?.profile?.phone || "",
      bio: user?.profile?.bio || "",
      date_of_birth: user?.profile?.date_of_birth
        ? new Date(user.profile.date_of_birth).toISOString().split("T")[0]
        : "", // Format date for input type="date"
      social_links: user?.profile?.social_links || "",
    },
    enableReinitialize: true, // Important: Allows form to reset if user prop updates from server
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        // 1. Calculate changed fields (Dirty Check)
        const changedData: Partial<FormData> = {};

        // Explicitly check keys expected to change
        Object.keys(values).forEach((key) => {
          const k = key as keyof FormData;
          // Simple loose equality check. For stricter check, consider types.
          if (values[k] != formik.initialValues[k]) {
            // @ts-ignore
            changedData[k] = values[k];
          }
        });

        // 2. If no changes, stop
        if (Object.keys(changedData).length === 0) {
          toast.info("Không có thay đổi nào để cập nhật.");
          setIsLoading(false);
          return;
        }

        console.log("Dữ liệu thay đổi cần gửi đi:", changedData);

        const formData = new FormData();
        if (token) {
          formData.append("token", token);
        }

        Object.keys(changedData).forEach((key) => {
          // @ts-ignore
          formData.append(key, changedData[key]);
        });

        const res = await updateUserProfileAction(formData);

        if (res.success) {
          toast.success("Cập nhật thông tin thành công!");
          if (updateAuth && res.data && user) {
            // Construct the new profile user object correctly
            const updatedUser = {
              ...user,
              profile: { ...user.profile, ...res.data },
            };
            // @ts-ignore
            updateAuth({ profile_user: updatedUser });
          }
        } else {
          toast.error(res.error || "Cập nhật thất bại.");
        }
      } catch (error) {
        console.error("Update failed", error);
        toast.error("Có lỗi xảy ra khi cập nhật hồ sơ.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className=" p-2">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <User className="text-blue-600" size={24} />
          Thông tin cơ bản
        </h3>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((item) => (
            <div key={item.name}>
              <InputBox
                key={item.name}
                label={item.label}
                type={item.type}
                name={item.name}
                placeholder={item.placeholder}
                icon={item.icon}
                Formik={formik}
                id={item.name}
              />
            </div>
          ))}

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email{" "}
              <span className="text-xs font-normal text-gray-500">
                (Không thể thay đổi)
              </span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="text"
                name="email"
                value={formik.values.email}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed focus:outline-none"
                disabled
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Thông tin bổ sung
          </h3>

          {/* Bio Field */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Giới thiệu bản thân
            </label>
            <div className="relative">
              <textarea
                name="bio"
                rows={4}
                value={formik.values.bio}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Viết đôi dòng về bản thân bạn..."
                className={`w-full p-4 border rounded-xl outline-none transition-all duration-200 resize-none ${
                  formik.touched.bio && formik.errors.bio
                    ? "border-red-300 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
              />
              {formik.touched.bio && formik.errors.bio && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  *{formik.errors.bio}
                </p>
              )}
            </div>
          </div>

          {/* Social Link (Example) */}
          {/* <div className="mb-6"> ...add social inputs similarly... </div> */}
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-gray-100">
          {/* Only show/enable button if form is dirty (changed) */}
          <button
            type="submit"
            disabled={isLoading || !formik.dirty}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all duration-200
                ${
                  isLoading || !formik.dirty
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-blue-700 text-white hover:opacity-90 hover:scale-[1.02] active:scale-95"
                }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={18} /> Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
