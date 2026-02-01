"use client";
import { Eye, EyeClosed, X } from "lucide-react";
import { startTransition, useState } from "react";
import { toast } from "sonner";
import { SCHEMA_user } from "@/app/lib/schemas";
import { useRouter } from "next/navigation";
import { Api_Admin_User } from "@/app/lib/services/user";
import Spanning from "@/app/components/spanning";

type Props = {
  setClose: () => void;
  token: string;
};

function AdminCreateUser({ setClose, token }: Props) {
  const [formData, setFormData] = useState({
    email: "",
    fullname: "",
    password: "",
    role: "USER",
  });
  const inputs = [
    {
      id: 1,
      name: "email",
      type: "email",
      placeholder: "E-mail",
      disabled: false,
    },
    {
      id: 2,
      name: "fullname",
      type: "text",
      placeholder: "Họ và tên",
      disabled: false,
    },

    {
      id: 4,
      name: "password",
      type: "password",
      placeholder: "Mật khẩu",
      disabled: false,
    },
  ];
  const [loading, setLoading] = useState<boolean>(false);
  const [isShow, setIsShow] = useState<string>("password");
  const [errors, setErrors] = useState<{
    [key: string]: string[] | undefined;
  }>({});
  const router = useRouter();

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    const result = SCHEMA_user.safeParse(formData);
    if (formData["role"]) {
      formData["role"] = formData["role"].toLowerCase();
    }
    if (!result.success) {
      setLoading(false);
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      console.log(result.error.flatten().fieldErrors);
      toast.warning("Thông tin bạn nhập chưa hợp lệ!");
      return;
    }
    try {
      const res = await Api_Admin_User(token, formData);
      console.log(res);
      toast.success("Tạo người dùng thành công!");
      startTransition(() => router.refresh());
    } catch (error: any) {
      console.log(error);
      toast.error(error.response.data.message || "Đã có lỗi xảy ra!");
    } finally {
      setLoading(false);
      setClose();
    }
  };

  return (
    <div>
      <div className="flex justify-between ">
        <h2 className="text-xl font-bold ">Thêm người dùng</h2>
        <X
          size={35}
          color="#afacac"
          strokeWidth={0.5}
          onClick={() => setClose()}
          className="hover:cursor-pointer"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 ">
        {inputs.map((input) => (
          <div key={input.id} className="relative">
            <input
              type={input?.type === "password" ? isShow : input.type}
              name={input.name}
              placeholder={input.placeholder}
              value={formData[input.name as keyof typeof formData]}
              className="h-[50px] pl-2 pt-4 border border-[#8e8e8e] rounded-md w-full text-[#3c3c3c] text-[16px]"
              onChange={(e) => handleChange(input.name, e.target.value)}
              disabled={input.disabled}
            />
            <p className="absolute top-1 left-2 text-[#8e8e8e] text-[12px]">
              {input.name}
            </p>

            {input?.type === "password" && (
              <div className="absolute top-[50%] right-3 -translate-y-[50%] transform">
                {isShow === "password" ? (
                  <span
                    className="cursor-pointer"
                    onClick={() => setIsShow("text")}
                  >
                    <EyeClosed />
                  </span>
                ) : (
                  <span
                    className="cursor-pointer"
                    onClick={() => setIsShow("password")}
                  >
                    <Eye />
                  </span>
                )}
              </div>
            )}

            {errors[input.name] && (
              <p className="text-red-500 text-sm mt-1">
                {errors[input.name]?.[0]}
              </p>
            )}
          </div>
        ))}
        <div className="relative">
          <select
            value={formData.role}
            onChange={(e) => handleChange("role", e.target.value || "user")}
            className="h-[50px] pl-2 pt-4 border border-[#8e8e8e] rounded-md w-full text-[#3c3c3c] text-[16px]"
          >
            <option value="user">USER</option>
            <option value="admin">ADMIN</option>
          </select>
          <p className="absolute top-1 left-2 text-[#8e8e8e] text-[12px]">
            Chọn Roles
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-5 gap-2 items-center  ">
        <div className="text-[#3c3c3c] hover:cursor-pointer" onClick={setClose}>
          {"Hủy"}
        </div>
        <button
          className="bg-[#3c3c3c] text-white p-3 rounded-md hover:cursor-pointer"
          onClick={handleSubmit}
        >
          {loading ? <Spanning /> : "Tạo người dùng"}
        </button>
      </div>
    </div>
  );
}

export default AdminCreateUser;
