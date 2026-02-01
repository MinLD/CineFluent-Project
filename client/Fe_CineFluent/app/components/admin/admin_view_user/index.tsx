"use client";
import { X } from "lucide-react";
import { useActionState, useRef, useState, startTransition } from "react";
import { toast } from "sonner";
import { SCHEMA_user_update } from "@/app/lib/schemas";
import { Ty_User } from "@/app/lib/types/users";
import Spanning from "@/app/components/spanning";
import Image from "next/image";
import { updateUserAction } from "@/app/lib/actions/users";

type Props = {
  setClose: () => void;
  token: string;
  user: Ty_User;
};

function AdminViewUser({ setClose, token, user }: Props) {
  const [formData, setFormData] = useState({
    email: user.email ?? "",
    fullname: user.profile?.fullname ?? "",
    phone: user.profile?.phone ?? "",
    avatar: user.profile?.avatar_url ?? "",
    date_of_birth: user.profile?.date_of_birth
      ? user.profile.date_of_birth.slice(0, 10)
      : "",
    english_level: user.profile?.english_level || "Beginner",
    total_points: user.profile?.total_points || 0,
    streak_days: user.profile?.streak_days || 0,
    role: user.roles[0]?.name || "user",
  });
  const initialData = useRef({ ...formData });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{
    [key: string]: string[] | undefined;
  }>({});

  const [state, formAction, isPending] = useActionState(
    async (prev: any, formDataObj: FormData) => {
      const result = await updateUserAction(prev, formDataObj);
      if (result.success) {
        toast.success(result.message);
        setClose();
      } else {
        toast.error(result.error);
      }
      return result;
    },
    null,
  );
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
      id: 3,
      name: "phone",
      type: "text",
      placeholder: "Số điện thoại",
      disabled: false,
    },

    {
      id: 4,
      name: "date_of_birth",
      type: "date",
      placeholder: "Ngày sinh",
      disabled: false,
    },

    {
      id: 5,
      name: "total_points",
      type: "number",
      placeholder: "Total Points",
      disabled: false,
    },
    {
      id: 6,
      name: "streak_days",
      type: "number",
      placeholder: "Streak Days",
      disabled: false,
    },
  ];

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    if (!file) return;
    setAvatarFile(file);
    const prevewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      avatar: prevewUrl,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const result = SCHEMA_user_update.safeParse(formData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      toast.warning("Thông tin người dùng chưa hợp lệ!");
      return;
    }

    let hasChange = false;
    const changeData = new FormData();

    Array.from(Object.entries(formData)).forEach(([key, value]) => {
      if (key === "avatar") return;
      if (
        String(formData[key as keyof typeof formData]) !==
        String(initialData.current[key as keyof typeof formData])
      ) {
        changeData.append(key, value as string);
        hasChange = true;
      }
    });

    if (avatarFile) {
      changeData.append("avatar", avatarFile);
      hasChange = true;
    }

    if (!hasChange) {
      toast.warning("Thông tin người dùng chưa thay đổi");
      return;
    }

    changeData.append("token", token);
    changeData.append("userId", user.id);
    Array.from(changeData.entries()).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });

    startTransition(() => {
      formAction(changeData);
    });
  };

  return (
    <div>
      <div className="flex justify-between ">
        <h2 className="text-xl font-bold ">Thông tin người dùng</h2>
        <X
          size={35}
          color="#afacac"
          strokeWidth={0.5}
          onClick={() => setClose()}
          className="hover:cursor-pointer"
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 ">
          {inputs.map((input) => (
            <div key={input.id} className="relative">
              <input
                id={input.name}
                type={input.type}
                name={input.name}
                placeholder={input.placeholder}
                value={formData[input.name as keyof typeof formData] ?? ""}
                className="h-[50px] pl-2 pt-4 border border-[#8e8e8e] rounded-md w-full text-[#3c3c3c] text-[16px]"
                onChange={(e) => handleChange(input.name, e.target.value)}
                disabled={input.disabled || isPending}
              />

              <p className="absolute top-1 left-2 text-[#8e8e8e] text-[12px]">
                {input.name}
              </p>

              {errors[input.name] && (
                <p className="text-red-500 text-sm mt-1">
                  {errors[input.name]?.[0]}
                </p>
              )}
            </div>
          ))}
          <div className="relative">
            <select
              value={formData.english_level}
              onChange={(e) => handleChange("english_level", e.target.value)}
              className="h-[50px] pl-2 pt-4 border border-[#8e8e8e] rounded-md w-full text-[#3c3c3c] text-[16px]"
              disabled={isPending}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <p className="absolute top-1 left-2 text-[#8e8e8e] text-[12px]">
              English Level
            </p>
          </div>
          <div className="relative">
            <select
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="h-[50px] pl-2 pt-4 border border-[#8e8e8e] rounded-md w-full text-[#3c3c3c] text-[16px]"
              disabled={isPending}
            >
              <option value="user">USER</option>
              <option value="admin">ADMIN</option>
            </select>
            <p className="absolute top-1 left-2 text-[#8e8e8e] text-[12px]">
              vai trò
            </p>
          </div>

          <div className="relative flex items-center gap-4">
            <div className="w-full">
              <input
                type="file"
                accept="image/*"
                onChange={handleChangeFile}
                className="h-[50px] pl-2 pt-4 border border-[#8e8e8e] rounded-md w-full text-[#3c3c3c] text-[16px]"
                disabled={isPending}
              />
              <p className="absolute top-1 left-2 text-[#8e8e8e] text-[12px]">
                avatar
              </p>
            </div>

            {formData.avatar ? (
              <div className="relative w-[50px] h-[50px] border rounded-md overflow-hidden shrink-0">
                <Image
                  alt="Avatar preview"
                  src={formData.avatar}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-[50px] h-[50px] bg-gray-200 rounded-md shrink-0"></div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-5 gap-2 items-center  ">
          <div
            className="text-[#3c3c3c] hover:cursor-pointer"
            onClick={setClose}
          >
            Hủy
          </div>
          <button
            type="submit"
            className="bg-[#3c3c3c] text-white p-3 rounded-md hover:cursor-pointer disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? <Spanning /> : "Cập nhật người dùng"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminViewUser;
