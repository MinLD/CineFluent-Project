import { Crown } from "lucide-react";

export default function MembershipTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">
        Gói thành viên hiện tại
      </h3>

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown size={24} className="text-yellow-400 fill-yellow-400" />
            <span className="text-2xl font-bold tracking-tight">Gói FREE</span>
          </div>
          <p className="text-gray-300">
            Bạn đang sử dụng gói miễn phí. Nâng cấp để nhận ưu đãi.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-300">
            <li className="flex gap-2">✓ Phí giao dịch: 10%</li>
            <li className="flex gap-2">✓ Giới hạn 3 lượt ghép nhanh/ngày</li>
          </ul>
        </div>

        <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm text-center min-w-[200px]">
          <p className="text-sm font-medium text-gray-300 mb-1">Trạng thái</p>
          <p className="text-xl font-bold text-green-400 mb-4">
            Đang hoạt động
          </p>
          <button className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors">
            Nâng cấp VIP
          </button>
        </div>
      </div>
    </div>
  );
}
