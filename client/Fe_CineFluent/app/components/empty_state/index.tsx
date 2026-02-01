import { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  colSpan: number;
};
function Empty_State({ icon: Icon, title, colSpan }: Props) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {<Icon className="w-12 h-12 text-gray-400" />}
          </div>

          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Chưa có {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm">
            Hiện tại hệ thống chưa ghi nhận {title}. Hãy bắt đầu bằng cách
            thêm một {title} mới nào đó.
          </p>
        </div>
      </td>
    </tr>
  );
}

export default Empty_State;
