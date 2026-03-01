import { z } from "zod";

export const SCHEMA_video_import = z
  .object({
    source_type: z.enum(["youtube", "drive"]),
    url: z.string().optional(), // Used for YouTube
    drive_id: z.string().optional(), // Used for Drive
    level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
  })
  .refine(
    (data) => {
      if (data.source_type === "youtube" && !data.url) return false;
      if (data.source_type === "drive" && !data.drive_id) return false;
      return true;
    },
    {
      message: "Vui lòng nhập thông tin video",
      path: ["url"],
    },
  );
