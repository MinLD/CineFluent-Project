import { Lock, Smartphone } from "lucide-react";

export default function SecurityTab() {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Đổi mật khẩu */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lock size={20} className="text-gray-500" /> Đổi mật khẩu
        </h3>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Mật khẩu hiện tại"
            className="input-field"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="password"
              placeholder="Mật khẩu mới"
              className="input-field"
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              className="input-field"
            />
          </div>
          <button className="btn-secondary">Cập nhật mật khẩu</button>
        </div>
      </div>

      {/* 2FA */}
      <div className="pt-6 border-t border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Smartphone size={20} className="text-gray-500" /> Xác thực 2 lớp
          (2FA)
        </h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600">
            Tăng cường bảo mật bằng mã OTP.
          </p>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
            Kích hoạt
          </button>
        </div>
      </div>
    </div>
  );
}
