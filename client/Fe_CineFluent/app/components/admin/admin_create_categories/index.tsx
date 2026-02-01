"use client";
import { X } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { SHCEMA_categories } from "@/app/lib/schemas";
import { useRouter } from "next/navigation";
import Spanning from "@/app/components/spanning";
import Image from "next/image";
import { createCategoryAction } from "@/app/lib/actions/categories";

type Props = {
  setClose: () => void;
  token: string;
};

/**
 * ✅ Next 16: Refactored with useActionState + Server Actions
 *
 * Benefits:
 * - No manual loading state (auto-managed)
 * - Credentials handled server-side
 * - Auto cache invalidation
 * - Cleaner form handling
 */
function AdminCreateCategories({ setClose, token }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    avatar: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<{
    [key: string]: string[] | undefined;
  }>({});
  const router = useRouter();

  // ✅ useActionState: Auto-manages loading state
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, form: FormData) => {
      // Client-side validation
      const result = SHCEMA_categories.safeParse({
        name: formData.name,
        description: formData.description,
        avatar: image,
      });

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setErrors(fieldErrors);
        console.log("Validation errors:", fieldErrors);
        toast.warning("Vui lòng kiểm tra lại thông tin nhập vào");
        console.log(result.error.flatten().fieldErrors);
        return { success: false };
      }

      // Build FormData
      const dataForm = new FormData();
      dataForm.append("name", formData.name);
      dataForm.append("description", formData.description);
      if (image) {
        dataForm.append("avatar", image);
      }
      dataForm.append("token", token);

      // ✅ Call Server Action
      const actionResult = await createCategoryAction(prevState, dataForm);
      console.log(actionResult);

      if (actionResult.success) {
        toast.success(actionResult.data.message);
        router.refresh();
        setClose();
      } else {
        console.log(actionResult.error);
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
      type: "text",
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
      image: previewUrl,
    }));
  };

  return (
    <div>
      <div className="flex justify-between ">
        <h2 className="text-xl font-bold ">Thêm danh mục</h2>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ">
          {inputs.map((input) => (
            <div key={input.id} className="relative">
              <input
                type={input?.type}
                name={input.name}
                placeholder={input.placeholder}
                value={formData[input.name as keyof typeof formData]}
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
              <p className="text-red-500 text-sm mt-1 flex flex-col">
                {errors["avatar"].map((err, idx) => (
                  <span key={idx}>{err}</span>
                ))}
              </p>
            )}
            <p className="text-[#8e8e8e] text-[12px] mt-1">
              {image ? image.name : "Chọn hình ảnh"}
            </p>
          </div>
          {formData.avatar && (
            <div className="col-span-2">
              <Image
                width={100}
                height={100}
                src={formData.avatar}
                alt="image"
                className="w-25 h-25 object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end mt-5 gap-2 items-center  ">
          <div
            className="text-[#3c3c3c] hover:cursor-pointer"
            onClick={setClose}
          >
            {"Hủy"}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#3c3c3c] text-white p-3 rounded-md hover:cursor-pointer disabled:bg-gray-400"
          >
            {isPending ? <Spanning /> : "Tạo danh mục"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminCreateCategories;
