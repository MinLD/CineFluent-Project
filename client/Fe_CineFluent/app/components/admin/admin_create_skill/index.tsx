"use client";
import { X } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { SCHEMA_skill, SHCEMA_categories } from "@/app/lib/schemas";
import { useRouter } from "next/navigation";
import Spanning from "@/app/components/spanning";
import Image from "next/image";
import {
  createCategoryAction,
  createSkillAction,
} from "@/app/lib/actions/categories";

type Props = {
  setClose: () => void;
  token: string;
  category_id?: string;
};

function AdminCreateSkill({ setClose, token, category_id }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: category_id || "",
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
      let result;
      if (image) {
        // Client-side validation
        result = SCHEMA_skill.safeParse({
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id,
          avatar: image,
        });
      } else {
        const TextSchema = SCHEMA_skill.omit({ avatar: true });
        result = TextSchema.safeParse({
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id,
          avatar: undefined,
        });
      }

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setErrors(fieldErrors);
        console.log("Validation errors:", fieldErrors);
        toast.warning("Vui lòng kiểm tra lại thông tin nhập vào");
        console.log(result.error.flatten().fieldErrors);
        return { success: false };
      }
      // Prepare FormData for Server Action
      const dataForm_new = new FormData();
      dataForm_new.append("name", formData.name);
      dataForm_new.append("description", formData.description);
      dataForm_new.append("category_id", formData.category_id);
      if (image) {
        dataForm_new.append("avatar", image);
      }
      dataForm_new.append("token", token);

      // ✅ Call Server Action
      const actionResult = await createSkillAction(prevState, dataForm_new);
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
        <h2 className="text-xl font-bold ">Thêm kỹ năng</h2>
        <X
          size={35}
          color="#afacac"
          strokeWidth={0.5}
          onClick={() => setClose()}
          className="hover:cursor-pointer"
        />
      </div>

      <form action={formAction} className="mt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ">
          <div className="space-y-2">
            {inputs.map((input) => (
              <div key={input.id}>
                <div className="relative">
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
          </div>

          <div className="relative h-full">
            <textarea
              name={"description"}
              placeholder={"Mô tả danh mục"}
              value={formData["description" as keyof typeof formData]}
              className="h-[108px] pl-2 pt-4 border border-[#8e8e8e] rounded-md w-full text-[#3c3c3c] text-[16px]"
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={isPending}
            />
            <p className="absolute top-1 left-2 text-[#8e8e8e] text-[12px]">
              {"description"}
            </p>
          </div>
          {image && (
            <div className="col-span-2">
              <Image
                width={100}
                height={100}
                src={image ? URL.createObjectURL(image) : ""}
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
            {isPending ? <Spanning /> : "Tạo kỹ năng"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminCreateSkill;
