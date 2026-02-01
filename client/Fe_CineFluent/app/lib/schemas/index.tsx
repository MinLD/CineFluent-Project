import { z } from "zod";

const SCHEMA_user = z.object({
  fullname: z
    .string()
    .trim()
    .min(4, "Họ tên phải từ 4 ký tự")
    .max(20, "Họ tên không quá 20 ký tự")
    .regex(/^[\p{L} ]+$/u, "Họ tên chứa ký tự không hợp lệ"),

  email: z.string().trim().email("Email không hợp lệ"),

  password: z
    .string()
    .trim()
    .min(8, "Mật khẩu phải từ 8 ký tự")
    .max(20, "Mật khẩu không quá 20 ký tự"),

  role: z.enum(["user", "seller", "employer", "admin"], {
    invalid_type_error: "Vui lòng chọn một vai trò hợp lệ",
  }),
  date_of_birth: z.string().optional(),
  wallet_balance: z.coerce.number().optional(),
});
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const SCHEMA_user_update = SCHEMA_user.partial();
const SHCEMA_categories = z.object({
  name: z
    .string()
    .trim()
    .min(4, "Tên danh mục phải từ 4 ký tự")
    .max(20, "Tên danh mục không quá 20 ký tự"),

  description: z
    .string()
    .trim()
    .min(10, "Mô tả danh mục phải từ 10 ký tự")
    .max(50, "Mô tả danh mục không quá 50 ký tự"),
  avatar: z
    .any()
    .refine((file) => file, "Vui lòng chọn ảnh đại diện") // Bắt buộc chọn
    .refine(
      (file) => file?.size <= MAX_FILE_SIZE,
      `Kích thước ảnh tối đa là 10MB.`,
    )
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Chỉ hỗ trợ định dạng .jpg, .jpeg, .png và .webp",
    ),
});
const SCHEMA_categories_update = SHCEMA_categories.partial();

const SCHEMA_skill = z.object({
  name: z
    .string()
    .trim()
    .min(4, "Tên kỹ năng phải từ 4 ký tự")
    .max(20, "Tên kỹ năng không quá 20 ký tự"),
  description: z
    .string()
    .trim()
    .min(10, "Mô tả kỹ năng phải từ 10 ký tự")
    .max(50, "Mô tả kỹ năng không quá 50 ký tự"),
  category_id: z.string().trim().min(1, "Vui lòng chọn danh mục"),
  avatar: z
    .any()
    .refine((file) => file, "Vui lòng chọn ảnh đại diện") // Bắt buộc chọn
    .refine(
      (file) => file?.size <= MAX_FILE_SIZE,
      `Kích thước ảnh tối đa là 10MB.`,
    )
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Chỉ hỗ trợ định dạng .jpg, .jpeg, .png và .webp",
    ),
});
const SCHEMA_skill_update = SCHEMA_skill.partial();
const SHCHEMA_SkillUser = z.object({
  category_id: z.coerce
    .string({ required_error: "Vui lòng chọn danh mục" })
    .min(1, "Vui lòng chọn danh mục"),
  skill_id: z.coerce
    .string({ required_error: "Vui lòng chọn kỹ năng" })
    .min(1, "Vui lòng chọn kỹ năng"),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"], {
    required_error: "Vui lòng chọn trình độ",
  }),
});
export type SkillFormValues = z.infer<typeof SHCHEMA_SkillUser>;
const SHCHEMA_SkillUserUpdate = SHCHEMA_SkillUser.partial();
export {
  SCHEMA_user,
  SCHEMA_user_update,
  SHCEMA_categories,
  SCHEMA_categories_update,
  SCHEMA_skill,
  SCHEMA_skill_update,
  SHCHEMA_SkillUser,
  SHCHEMA_SkillUserUpdate,
};
