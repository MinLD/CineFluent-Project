"use client";

import { X } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { toast } from "sonner";
import { SHCEMA_categories } from "@/app/lib/schemas";
import { useRouter } from "next/navigation";
import Spanning from "@/app/components/spanning";
import Image from "next/image";
import { I_category } from "@/app/lib/types/categories";
import { updateCategoryAction } from "@/app/lib/actions/categories";

type Props = {
  setClose: () => void;
  token: string;
  category: I_category;
};
function AdminUpdateCategories({ setClose, token, category }: Props) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    avatar: category?.avatar?.secure_url || "",
  });
  const initData = useRef({ ...formData });
  const router = useRouter();
  const [image, setImage] = useState<File | null>();
  const [errors, setErrors] = useState<{
    [key: string]: string[] | undefined;
  }>({});

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, form: FormData) => {
      let result;

      if (image) {
        result = SHCEMA_categories.safeParse({
          name: formData.name,
          description: formData.description,
          avatar: image,
        });
      } else {
        const TextSchema = SHCEMA_categories.omit({ avatar: true });

        result = TextSchema.safeParse({
          name: formData.name,
          description: formData.description,
          avatar: undefined,
        });
      }

      console.log("Validation Result:", result.success);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setErrors(fieldErrors);
        toast.warning("Thông tin bạn nhập chưa hợp lệ!");
        return { success: false };
      }

      // Check if data changed
      const update_data = new FormData();
      let isUpdate = false;

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "avatar") return;
        if (value !== (initData.current as any)[key]) {
          update_data.append(key, value);
          isUpdate = true;
        }
      });

      if (formData.avatar !== initData.current.avatar && image) {
        update_data.append("avatar", image);
        isUpdate = true;
      }

      if (!isUpdate) {
        toast.warning("Bạn chưa thay đổi thông tin danh mục!");
        return { success: false };
      }

      // Prepare FormData for server action
      update_data.append("categoryId", category.id);
      update_data.append("token", token);

      update_data.forEach((value, key) => {
        console.log(`${key}:`, value);
      });

      // ✅ Call Server Action
      const actionResult = await updateCategoryAction(prevState, update_data);

      if (actionResult.success) {
        toast.success(actionResult.message);
        router.refresh();
        setClose();
      } else {
        toast.error(actionResult.error);
      }

      return actionResult;
    },
    null
  );

  const inputs = [
    {
      id: 1,
      name: "name",
      type: "text",
      placeholder: "Tên danh mục",
      disabled: false,
    },
    {
      id: 2,
      name: "description",
      type: "",
      placeholder: "Mô tả danh mục",
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
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      avatar: previewUrl,
    }));
  };

  return (
    <div>
      <div className="flex justify-between ">
        <h2 className="text-xl font-bold ">Chỉnh sửa danh mục</h2>
        <X
          size={35}
          color="#afacac"
          strokeWidth={0.5}
          onClick={() => setClose()}
          className="hover:cursor-pointer"
        />
      </div>

      {/* ✅ Form with server action */}
      <form action={formAction} className="mt-5">
        {/* LAYOUT CHÍNH: CHIA 2 CỘT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                name="name"
                placeholder="Tên danh mục"
                value={formData.name}
                className="h-[50px] pl-2 pt-4 border border-[#8e8e8e] rounded-md w-full text-[#3c3c3c] text-[16px]"
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={isPending}
              />
              <p className="absolute top-1 left-2 text-[#8e8e8e] text-[12px]">
                Name
              </p>
              {errors["name"] && (
                <p className="text-red-500 text-sm mt-1">
                  {errors["name"]?.[0]}
                </p>
              )}
            </div>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleChangeFile}
                className="h-[50px] pl-2 pt-4 border border-[#8e8e8e] rounded-md w-full text-[#3c3c3c] text-[16px]"
                disabled={isPending}
              />
              <p className="absolute top-1 left-2 text-[#8e8e8e] text-[12px]">
                Hình ảnh danh mục
              </p>
              {errors["avatar"] && (
                <p className="text-red-500 text-sm mt-1">
                  {errors["avatar"]?.[0]}
                </p>
              )}
            </div>
          </div>

          <div className="relative h-full">
            <textarea
              name="description"
              placeholder="Mô tả danh mục"
              value={formData.description}
              className="h-full w-full p-2 pt-6 border border-[#8e8e8e] rounded-md text-[#3c3c3c] text-[16px] resize-none"
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={isPending}
            />
            <p className="absolute top-2 left-2 text-[#8e8e8e] text-[12px]">
              Description
            </p>
            {errors["description"] && (
              <p className="text-red-500 text-sm mt-1 absolute -bottom-6 left-0">
                {errors["description"]?.[0]}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          {formData.avatar && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Xem trước hình ảnh: </p>
              <div className="relative w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
                <Image
                  fill
                  src={formData.avatar}
                  alt="image preview"
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 items-center">
            <div
              className="text-[#3c3c3c] hover:cursor-pointer px-4 py-2"
              onClick={setClose}
            >
              Hủy
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="bg-[#3c3c3c] text-white px-4 py-2 rounded-md hover:cursor-pointer disabled:bg-gray-400 min-w-[150px] flex justify-center"
            >
              {isPending ? <Spanning /> : "Cập nhật danh mục"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminUpdateCategories;
