"use client";

import { useAuth } from "@/app/lib/hooks/useAuth";
import {
  Plus,
  Trash2,
  Edit,
  List,
  ChevronLeft,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import Link from "next/link";

interface TypingMap {
  id: number;
  name: string;
  thumbnail_url: string;
  description: string;
  total_chapters: number;
}

interface TypingStage {
  id: number;
  map_id: number;
  chapter_number: number;
  content: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export default function TypingGameManagement() {
  const { token } = useAuth();
  const [maps, setMaps] = useState<TypingMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<TypingMap | null>(null);
  const [stages, setStages] = useState<TypingStage[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [view, setView] = useState<"maps" | "stages">("maps");

  // AI states
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Form states
  const [isEditingMap, setIsEditingMap] = useState(false);
  const [editMapData, setEditMapData] = useState<Partial<TypingMap>>({});
  const [isEditingStage, setIsEditingStage] = useState(false);
  const [editStageData, setEditStageData] = useState<Partial<TypingStage>>({});
  const [saving, setSaving] = useState(false);

  const fetchMaps = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${FeApiProxyUrl}/typing-game/maps`);
      const data = await res.json();
      if (data.code === 200) setMaps(data.data);
    } catch (e) {
      toast.error("Lỗi khi tải danh sách map");
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async (mapId: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${FeApiProxyUrl}/typing-game/maps/${mapId}/stages`,
      );
      const data = await res.json();
      if (data.code === 200) setStages(data.data);
    } catch (e) {
      toast.error("Lỗi khi tải danh sách stage");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaps();
  }, []);

  const handleCreateOrUpdateMap = async () => {
    if (!editMapData.name) {
      toast.error("Vui lòng nhập tên Map");
      return;
    }
    setSaving(true);
    const method = editMapData.id ? "PUT" : "POST";
    const url = editMapData.id
      ? `${FeApiProxyUrl}/typing-game/admin/maps/${editMapData.id}`
      : `${FeApiProxyUrl}/typing-game/admin/maps`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editMapData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          editMapData.id ? "Cập nhật map thành công" : "Tạo map thành công",
        );
        setIsEditingMap(false);
        setEditMapData({});
        fetchMaps();
      } else {
        toast.error(data.message || "Lỗi khi lưu map");
      }
    } catch (e) {
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMap = async (id: number) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa Map này không? Tất cả các chương liên quan cũng sẽ bị xóa.",
      )
    )
      return;
    try {
      const res = await fetch(`${FeApiProxyUrl}/typing-game/admin/maps/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Xóa map thành công");
        fetchMaps();
      }
    } catch (e) {
      toast.error("Lỗi khi xóa map");
    }
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return toast.error("Vui lòng nhập chủ đề!");

    setIsGenerating(true);
    try {
      const res = await fetch(
        `${FeApiProxyUrl}/typing-game/admin/generate-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ topic: aiTopic }),
        },
      );
      const data = await res.json();
      if (data.code === 201) {
        toast.success("AI đã tạo map thành công!");
        setShowAiModal(false);
        setAiTopic("");
        fetchMaps();
      } else {
        toast.error(data.message || "Lỗi khi tạo map AI");
      }
    } catch (e) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateOrUpdateStage = async () => {
    if (!editStageData.content) {
      toast.error("Vui lòng nhập nội dung chương");
      return;
    }
    setSaving(true);
    const method = editStageData.id ? "PUT" : "POST";
    const url = editStageData.id
      ? `${FeApiProxyUrl}/typing-game/admin/stages/${editStageData.id}`
      : `${FeApiProxyUrl}/typing-game/admin/stages`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...editStageData, map_id: selectedMap?.id }),
      });
      if (res.ok) {
        toast.success(
          editStageData.id
            ? "Cập nhật chương thành công"
            : "Thêm chương thành công",
        );
        setIsEditingStage(false);
        setEditStageData({});
        if (selectedMap) fetchStages(selectedMap.id);
      }
    } catch (e) {
      toast.error("Lỗi khi lưu chương");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStage = async (id: number) => {
    if (!confirm("Xóa chương này?")) return;
    try {
      const res = await fetch(
        `${FeApiProxyUrl}/typing-game/admin/stages/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        toast.success("Xóa chương thành công");
        if (selectedMap) fetchStages(selectedMap.id);
      }
    } catch (e) {
      toast.error("Lỗi khi xóa chương");
    }
  };

  if (view === "stages" && selectedMap) {
    return (
      <div className="p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
        <button
          onClick={() => setView("maps")}
          className="flex items-center gap-2 text-slate-500 hover:text-sky-600 mb-6 transition-all font-bold group"
        >
          <div className="p-1 bg-slate-100 rounded-lg group-hover:bg-sky-100">
            <ChevronLeft className="w-5 h-5" />
          </div>
          Quay lại danh sách Map
        </button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">
              Quản lý chương
            </h2>
            <p className="text-slate-500 mt-1">
              Bản đồ:{" "}
              <span className="text-sky-600 font-bold">{selectedMap.name}</span>
            </p>
          </div>
          <button
            onClick={() => {
              setIsEditingStage(true);
              setEditStageData({
                chapter_number: stages.length + 1,
                difficulty: "Medium",
              });
            }}
            className="flex items-center gap-2 bg-sky-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-sky-500 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Thêm Chương mới
          </button>
        </div>

        {isEditingStage && (
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
              <div className="w-2 h-8 bg-sky-500 rounded-full" />
              {editStageData.id ? "Chỉnh sửa" : "Thêm mới"} Chương
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                  Số chương (Chapter No.)
                </label>
                <input
                  type="number"
                  value={editStageData.chapter_number || ""}
                  onChange={(e) =>
                    setEditStageData({
                      ...editStageData,
                      chapter_number: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-2xl outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                  Độ khó
                </label>
                <select
                  value={editStageData.difficulty || "Medium"}
                  onChange={(e) =>
                    setEditStageData({
                      ...editStageData,
                      difficulty: e.target.value as any,
                    })
                  }
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-2xl outline-none transition-all font-medium"
                >
                  <option value="Easy">Dễ (Hợp cho Beginner)</option>
                  <option value="Medium">Vừa (Hợp cho Intermediate)</option>
                  <option value="Hard">Khó (Đoạn văn dài, phức tạp)</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                  Nội dung (Content để gõ)
                </label>
                <textarea
                  placeholder="Nhập nội dung văn bản mà người dùng sẽ gõ..."
                  value={editStageData.content || ""}
                  onChange={(e) =>
                    setEditStageData({
                      ...editStageData,
                      content: e.target.value,
                    })
                  }
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-2xl outline-none transition-all min-h-[160px] font-medium resize-none shadow-inner"
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleCreateOrUpdateStage}
                disabled={saving}
                className="bg-black text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Lưu Chương
              </button>
              <button
                onClick={() => setIsEditingStage(false)}
                className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Chương
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Cấp độ
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Nội dung
                </th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {stages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <List className="w-12 h-12 opacity-20" />
                      <p className="font-bold">
                        Bản đồ này chưa có chương nào.
                      </p>
                      <p className="text-sm">
                        Hãy bấm "Thêm Chương mới" để bắt đầu.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                stages.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center font-black text-sm">
                          {s.chapter_number}
                        </div>
                        <span className="font-bold text-slate-700">
                          Chương {s.chapter_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          s.difficulty === "Easy"
                            ? "bg-emerald-100 text-emerald-700"
                            : s.difficulty === "Hard"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {s.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-5 max-w-sm">
                      <p className="text-slate-500 text-sm italic line-clamp-2">
                        "{s.content}"
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setIsEditingStage(true);
                          setEditStageData(s);
                        }}
                        className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-600 rounded-xl transition-all shadow-sm"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteStage(s.id)}
                        className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-600 rounded-xl transition-all shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
            Typing Game Admin
          </h1>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Quản lý hệ thống bản đồ luyện gõ chữ
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAiModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-[20px] font-black flex items-center gap-3 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-2xl hover:-translate-y-1 active:scale-95 shadow-purple-500/20"
          >
            <Sparkles size={24} /> Tạo bằng AI
          </button>
          <button
            onClick={() => {
              setIsEditingMap(true);
              setEditMapData({ total_chapters: 5 });
            }}
            className="bg-black text-white px-8 py-4 rounded-[20px] font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-2xl hover:-translate-y-1 active:scale-95"
          >
            <Plus size={24} /> Tạo Bản đồ mới
          </button>
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border-2 border-purple-100 rounded-[40px] p-10 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">
                  AI Generator
                </h3>
                <p className="text-slate-500 font-medium italic">
                  Tự động soạn kịch bản game
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Chủ đề Map (Ví dụ: Pirates, Space...)
                </label>
                <input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Nhập chủ đề bạn muốn..."
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-purple-500 rounded-3xl px-6 py-5 text-slate-900 font-bold outline-none transition-all shadow-inner"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAiModal(false)}
                  disabled={isGenerating}
                  className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-3xl font-black hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  HỦY
                </button>
                <button
                  onClick={handleAiGenerate}
                  disabled={isGenerating || !aiTopic.trim()}
                  className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-2 hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 shadow-xl shadow-purple-600/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      ĐANG TẠO...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      BẮT ĐẦU TẠO
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditingMap && (
        <div className="bg-white p-10 rounded-[40px] border-4 border-slate-50 shadow-2xl mb-12 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-sky-100 text-sky-600 rounded-2xl">
              <Edit size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">
              {editMapData.id ? "Cập nhật" : "Thiết lập"} Bản đồ
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Tên Bản đồ (Story Title)
              </label>
              <input
                type="text"
                value={editMapData.name || ""}
                onChange={(e) =>
                  setEditMapData({ ...editMapData, name: e.target.value })
                }
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-3xl outline-none transition-all font-bold text-lg"
                placeholder="Ví dụ: Alice ở xứ sở diệu kỳ"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Thumbnail URL (Image)
              </label>
              <input
                type="text"
                value={editMapData.thumbnail_url || ""}
                onChange={(e) =>
                  setEditMapData({
                    ...editMapData,
                    thumbnail_url: e.target.value,
                  })
                }
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-3xl outline-none transition-all font-bold"
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Mô tả ngắn
              </label>
              <textarea
                value={editMapData.description || ""}
                onChange={(e) =>
                  setEditMapData({
                    ...editMapData,
                    description: e.target.value,
                  })
                }
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-3xl outline-none transition-all font-medium resize-none h-[120px]"
                placeholder="Tóm tắt ngắn gọn về câu chuyện này..."
              />
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  Tổng số chương
                </label>
                <input
                  type="number"
                  value={editMapData.total_chapters || 5}
                  onChange={(e) =>
                    setEditMapData({
                      ...editMapData,
                      total_chapters: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-3xl outline-none transition-all font-black text-xl"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleCreateOrUpdateMap}
                  disabled={saving}
                  className="flex-1 bg-sky-600 text-white px-10 py-5 rounded-[24px] font-black text-lg hover:bg-sky-500 transition-all shadow-xl shadow-sky-600/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Lưu và Đóng
                </button>
                <button
                  onClick={() => setIsEditingMap(false)}
                  className="bg-slate-100 text-slate-500 px-10 py-5 rounded-[24px] font-black hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
          <p className="font-bold text-slate-400">Đang chuẩn bị dữ liệu...</p>
        </div>
      ) : maps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 rounded-[48px] bg-slate-50 border-4 border-dashed border-slate-100">
          <img
            src="https://illustrations.popsy.co/slate/game-boy.svg"
            alt="Empty"
            className="w-64 h-64 opacity-50 mb-8"
          />
          <h3 className="text-2xl font-black text-slate-700 mb-2">
            Chưa có màn chơi nào được thiết lập
          </h3>
          <p className="text-slate-400 max-w-sm text-center">
            Bấm "Tạo Bản đồ mới" để bắt đầu xây dựng nội dung game cho người
            học.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {maps.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-[40px] border-2 border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:border-sky-100 transition-all duration-500 group flex flex-col"
            >
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                {m.thumbnail_url ? (
                  <img
                    src={m.thumbnail_url}
                    alt={m.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <img
                      src="https://illustrations.popsy.co/slate/abstract-shapes.svg"
                      className="w-24 opacity-20"
                    />
                  </div>
                )}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <div className="bg-white/90 backdrop-blur-md text-slate-900 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                    Typing Solo
                  </div>
                </div>
                <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-xl text-white px-5 py-2 rounded-2xl text-xs font-black shadow-2xl">
                  {m.total_chapters} Chapters
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-sky-600 transition-colors">
                  {m.name}
                </h3>
                <p className="text-slate-500 font-medium line-clamp-2 mb-8 text-sm leading-relaxed">
                  {m.description || "Chưa có mô tả chi tiết cho bản đồ này."}
                </p>

                <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-slate-50">
                  <button
                    onClick={() => {
                      setSelectedMap(m);
                      setView("stages");
                      fetchStages(m.id);
                    }}
                    className="w-full bg-slate-100 hover:bg-sky-600 text-slate-700 hover:text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <List size={20} /> Danh sách chương
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditMapData(m);
                        setIsEditingMap(true);
                      }}
                      className="flex-1 bg-white border-2 border-slate-100 text-slate-500 hover:text-blue-600 hover:border-blue-600 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Edit size={18} /> Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteMap(m.id)}
                      className="flex-1 bg-white border-2 border-slate-100 text-slate-500 hover:text-rose-600 hover:border-rose-600 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
