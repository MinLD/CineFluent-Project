"use client";

import { Eye, EyeClosed, X } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import Spanning from "@/app/components/spanning";
import { createUserAction } from "@/app/lib/actions/users";
import { SCHEMA_user } from "@/app/lib/schemas";

type Props = {
  setClose: () => void;
};

function AdminCreateUser({ setClose }: Props) {
  const [formData, setFormData] = useState({
    email: "",
    fullname: "",
    password: "",
    role: "user",
  });
  const [errors, setErrors] = useState<{
    [key: string]: string[] | undefined;
  }>({});
  const [isShow, setIsShow] = useState("password");
  const router = useRouter();

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
      placeholder: "Ho va ten",
      disabled: false,
    },
    {
      id: 3,
      name: "password",
      type: "password",
      placeholder: "Mat khau",
      disabled: false,
    },
  ] as const;

  const [, formAction, isPending] = useActionState(
    async (prevState: any, submittedForm: FormData) => {
      setErrors({});

      const userData = {
        email: String(submittedForm.get("email") || "").trim(),
        fullname: String(submittedForm.get("fullname") || "").trim(),
        password: String(submittedForm.get("password") || "").trim(),
        role: String(submittedForm.get("role") || "user").toLowerCase(),
      };

      const result = SCHEMA_user.safeParse(userData);

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setErrors(fieldErrors);
        toast.warning("Thong tin ban nhap chua hop le!");
        return { success: false };
      }

      const dataForm = new FormData();
      dataForm.append("email", userData.email);
      dataForm.append("fullname", userData.fullname);
      dataForm.append("password", userData.password);
      dataForm.append("role", userData.role);

      const actionResult = await createUserAction(prevState, dataForm);

      if (actionResult.success) {
        toast.success(actionResult.message || "Tao nguoi dung thanh cong!");
        router.refresh();
        setClose();
      } else {
        toast.error(actionResult.error || "Da co loi xay ra!");
      }

      return actionResult;
    },
    null
  );

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Them nguoi dung</h2>
        <X
          size={35}
          color="#afacac"
          strokeWidth={0.5}
          onClick={setClose}
          className="hover:cursor-pointer"
        />
      </div>

      <form action={formAction} className="mt-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {inputs.map((input) => (
            <div key={input.id} className="relative">
              <input
                type={input.type === "password" ? isShow : input.type}
                name={input.name}
                placeholder={input.placeholder}
                value={formData[input.name]}
                className="h-[50px] w-full rounded-md border border-[#8e8e8e] pl-2 pt-4 text-[16px] text-[#3c3c3c]"
                onChange={(e) => handleChange(input.name, e.target.value)}
                disabled={input.disabled || isPending}
              />
              <p className="absolute left-2 top-1 text-[12px] text-[#8e8e8e]">
                {input.name}
              </p>

              {input.type === "password" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
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
                <p className="mt-1 text-sm text-red-500">
                  {errors[input.name]?.[0]}
                </p>
              )}
            </div>
          ))}

          <div className="relative">
            <select
              name="role"
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value || "user")}
              className="h-[50px] w-full rounded-md border border-[#8e8e8e] pl-2 pt-4 text-[16px] text-[#3c3c3c]"
              disabled={isPending}
            >
              <option value="user">USER</option>
              <option value="admin">ADMIN</option>
            </select>
            <p className="absolute left-2 top-1 text-[12px] text-[#8e8e8e]">
              Chon role
            </p>

            {errors.role && (
              <p className="mt-1 text-sm text-red-500">{errors.role?.[0]}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <div className="cursor-pointer text-[#3c3c3c]" onClick={setClose}>
            Huy
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-[#3c3c3c] p-3 text-white hover:cursor-pointer disabled:bg-gray-400"
          >
            {isPending ? <Spanning /> : "Tao nguoi dung"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminCreateUser;
