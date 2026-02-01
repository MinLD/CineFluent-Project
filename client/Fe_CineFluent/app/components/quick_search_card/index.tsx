"use client";

import { motion } from "framer-motion";
import { Zap, Loader2 } from "lucide-react";
import { useEffect, useState, useRef, useContext } from "react";
import { Select, Input, Form, ConfigProvider, theme } from "antd";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
// Import các Action và Context cần thiết
import {
  getAllCategoriesAction,
  getSkillsByCategoryAction,
} from "@/app/lib/actions/categories";
import { useSocket } from "@/app/lib/context/SocketContext";
import { AuthContext } from "@/app/lib/context/AuthContext";
// Import các Type
import { I_category, I_skill } from "@/app/lib/types/categories";
import SearchingModal from "./SearchingModal"; // Giữ nguyên component con này

const { Option } = Select;
type LogEntry = {
  id: number;
  message: string;
  timestamp: string;
};
export default function QuickSearchCard() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const addLog = (msg: string) => {
    const newLog: LogEntry = {
      id: Date.now(),
      message: msg,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // ==========================================
  // KHU VỰC 1: STATE & HOOKS (Sẽ code ở bước 1)
  // ==========================================

  // 1. Lấy socket toàn cục và thông tin user
  const { socket, isConnected } = useSocket();
  const auth = useContext(AuthContext);

  // 2. Chứa dữ liệu danh mục & kỹ năng tải từ server
  const [categories, setCategories] = useState<I_category[]>([]);
  const [skills, setSkills] = useState<I_skill[]>([]);

  // 4. Trạng thái Tìm kiếm (Quan trọng nhất)
  const [isSearching, setIsSearching] = useState(false); // true = đang hiện Modal
  const [timer, setTimer] = useState(0);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 5. Validation State (Enable/Disable Button)
  const [submittable, setSubmittable] = useState(false);
  const values = Form.useWatch([], form);

  useEffect(() => {
    form.validateFields({ validateOnly: true }).then(
      () => setSubmittable(true),
      () => setSubmittable(false),
    );
  }, [values, form]);

  // ==========================================
  // KHU VỰC 2: API DATA FETCHING (Sẽ code ở bước 2)
  // ==========================================

  // 1. Tự động tải Danh mục (Categories) khi mới vào trang
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getAllCategoriesAction();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  // 2. Hàm xử lý khi chọn Danh mục -> Tải Kỹ năng tương ứng
  const handleCategoryChange = async (categoryId: string) => {
    // Reset ô Skill và Budget cho sạch sẽ
    form.setFieldsValue({ skill_id: undefined });
    setSkills([]);

    try {
      const res = await getSkillsByCategoryAction(categoryId);
      if (res.success && res.data) {
        setSkills(res.data);
      } else {
        toast.error("Không có kỹ năng nào trong mục này");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ==========================================
  // KHU VỰC 3: TIMER LOGIC (Sẽ code ở bước 3)
  // ==========================================

  // Hàm bắt đầu đếm giờ
  const startTimer = () => {
    setTimer(0); // Reset về 0
    // Xóa timer cũ nếu có (đề phòng)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Tạo timer mới: Mỗi 1 giây (1000ms) tăng timer lên 1
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };
  // Hàm dừng đếm giờ
  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };
  // Quan trọng: Khi người dùng thoát trang, phải giết timer ngay
  useEffect(() => {
    return () => stopTimer();
  }, []);

  // ==========================================
  // KHU VỰC 4: SOCKET LOGIC (Sẽ code ở bước 4)
  // ==========================================

  const handleSearch = () => {
    if (!auth?.userId) {
      toast.error("Vui lòng đăng nhập để tìm kiếm mentor");
      router.push("/login");
      return;
    }
    if (!isConnected)
      return toast.error("Vui lòng kết nối internet để tìm kiếm mentor");

    // 2. Lấy dữ liệu từ Form
    const values = form.getFieldsValue();

    // (Validation đã được xử lý bởi Form rules & submittable state)

    // 3. Bật trạng thái tìm kiếm (Optimistic UI - Mở modal ngay)
    setIsSearching(true); // -> Modal hiện lên
    startTimer(); // -> Đồng hồ chạy

    // 4. Gửi yêu cầu lên Server (Emit)
    const payload = {
      student_id: auth?.userId,
      skill_id: values.skill_id,
      budget: Number(values.budget),
      topic: `Tìm Mentor dạy Skill ${values.skill_id}`,
      description: "Hỗ trợ tìm kiếm nhanh",
    };

    console.log("gửi data tìm kiếm", payload);
    socket?.emit("find_tutor", payload);
  };

  const handleCancel = () => {
    console.log("🛑 Hủy tìm kiếm...");
    setIsSearching(false); // Tắt Modal
    stopTimer(); // Dừng đồng hồ

    // Gửi lệnh hủy lên Server
    if (socket && auth?.userId) {
      socket.emit("cancel_request", { student_id: auth.userId });
    }
  };

  useEffect(() => {
    if (!socket) return;
    if (isConnected) {
      addLog("✅ Start listening via Global Socket...");
    }
    const onMatchSuccess = (data: any) => {
      console.log("ghép đôi thành công!", data);
      setIsSearching(false);
      stopTimer();
      toast.success("Đã tìm thấy Mentor!");
      // Chuyển hướng vào phòng học
      router.push(`/room/${data.room_id}`);
    };

    const onServerMessage = (msg: any) => {
      addLog(`📩 Server: ${msg.data}`);
      // 🔥 Temporary fix: Đóng modal nếu server_message chứa "không có mentor"
      if (msg.data && msg.data.toLowerCase().includes("không có mentor")) {
        console.log(
          "⚠️ Detected 'no mentor' in server_message, closing modal...",
        );
        setIsSearching(false);
        stopTimer();
        toast.error(msg.data, {
          id: "quick-search-error",
          duration: 3000,
        });
      }
    };
    const onNewRequest = (data: any) => {
      addLog(
        `🔥 CÓ KÈO MỚI! ID: ${data.request_id} - Topic: ${data.topic} - Giá: ${data.budget}`,
      );
    };
    const onError = (msg: any) => {
      console.log("🔥 onError (search_error) called!", msg);
      const errorMsg =
        msg.message || msg.data || "Có lỗi xảy ra, vui lòng thử lại!";
      addLog(`❌ Lỗi: ${errorMsg}`);

      setIsSearching(false);
      stopTimer();

      // 🔥 Dùng toast ID để chặn duplicate (hoạt động global cho tất cả instances)
      toast.error(errorMsg, {
        id: "quick-search-error", // Toast với cùng ID sẽ không hiện 2 lần
        duration: 3000,
      });
    };

    console.log("✅ Registering socket listeners...");
    socket.on("match_success", onMatchSuccess);
    socket.on("server_message", onServerMessage);
    socket.on("new_request_available", onNewRequest);
    socket.on("search_error", onError); // Backend: Không có mentor
    socket.on("error", onError); // 🔥 Backend: Số dư không đủ (dùng 'error')

    // 🔥 DEBUG: Catch-all listener để xem tất cả events
    socket.onAny((eventName: string, ...args: any[]) => {
      console.log(`🎯 ANY EVENT: "${eventName}"`, args);
    });

    console.log(
      "✅ Listeners registered: match_success, server_message, new_request_available, search_error, error",
    );

    // Cleanup listeners khi component unmount
    return () => {
      socket.off("server_message", onServerMessage);
      socket.off("new_request_available", onNewRequest);
      socket.off("match_success", onMatchSuccess);
      socket.off("search_error", onError);
      socket.off("error", onError); // 🔥 Cleanup 'error' listener
    };
  }, [socket, router, isConnected]); // ❌ Không thêm isSearching vào đây!

  // Animation variants (Giữ nguyên cho đẹp)
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 1, ease: "easeOut" } },
  };
  console.log("logds", logs);
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
        <div className="w-full max-w-[600px] rounded-2xl bg-white p-4 md:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative">
          {/* Header UI */}
          <div className="mb-6 sm:flex sm:items-center sm:justify-between space-x-6">
            <h2 className="text-xl font-bold text-gray-800">Tìm kiếm nhanh</h2>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-500">
                1,247 mentor đang online
              </span>
            </div>
          </div>

          <Form form={form} layout="vertical">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Select Category */}
              <Form.Item
                name="category_id"
                className="mb-0"
                rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  onChange={handleCategoryChange}
                  showSearch
                  optionFilterProp="children"
                  size="large"
                  allowClear
                >
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Select Skill */}
              <Form.Item
                name="skill_id"
                className="mb-0"
                rules={[{ required: true, message: "Vui lòng chọn kỹ năng!" }]}
              >
                <Select
                  placeholder="Chọn kỹ năng"
                  disabled={!skills.length}
                  showSearch
                  optionFilterProp="children"
                  size="large"
                  allowClear
                >
                  {skills.map((skill) => (
                    <Option key={skill.id} value={skill.id}>
                      {skill.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="budget"
              className="mb-6"
              rules={[
                { required: true, message: "Vui lòng nhập ngân sách!" },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (Number(value) <= 0)
                      return Promise.reject(new Error("Ngân sách phải > 0"));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                type="number"
                placeholder="Nhập mức ngân sách (Credit)"
                size="large"
              />
            </Form.Item>

            {/* Nút Tìm Kiếm */}
            <button
              onClick={handleSearch}
              type="button"
              disabled={!submittable || isSearching}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-3.5 text-base font-bold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:grayscale"
            >
              <Zap className="fill-current" size={20} />
              <span>Tìm kiếm nhanh</span>
            </button>
          </Form>

          {/* Modal tìm kiếm */}
          <SearchingModal
            open={isSearching}
            timer={timer}
            onCancel={handleCancel}
          />
        </div>
      </ConfigProvider>
    </motion.div>
  );
}
