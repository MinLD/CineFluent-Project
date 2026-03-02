"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Volume2, BookOpen, Bookmark, Loader2 } from "lucide-react";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { saveFlashcardAction } from "@/app/lib/actions/flashcards";
import { toast } from "sonner";

interface QuickDictionaryModalProps {
  word: string;
  context: string;
  videoId: number;
  onClose: () => void;
}

interface DictionaryResult {
  word: string;
  ipa: string;
  pos: string;
  definition_vi: string;
  example_en: string;
  example_vi: string;
}

export function QuickDictionaryModal({
  word,
  context,
  videoId,
  onClose,
}: QuickDictionaryModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDefinition = async () => {
      // Bắt buộc đăng nhập mới được tra từ
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${FeApiProxyUrl}/learning/quick-dictionary`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ word, context }),
          },
        );

        const data = await response.json();
        console.log(data);
        if (data.code === 200) {
          setResult(data.data);
        } else {
          setError(data.message || "Không tìm thấy định nghĩa.");
        }
      } catch (err) {
        setError("Lỗi kết nối.");
      } finally {
        setLoading(false);
      }
    };

    fetchDefinition();
  }, [word, context]);

  // Portal logic
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="absolute inset-0 z-[50] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#18181b] border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-sky-400">
            <BookOpen className="w-5 h-5" />
            <span className="font-bold text-sm uppercase tracking-wide">
              Tra từ nhanh
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors hover:cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 min-h-[240px] flex flex-col justify-center">
          {!token ? (
            <div className="flex flex-col items-center gap-6 text-center py-4">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                <Bookmark className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold text-lg">
                  Yêu cầu đăng nhập
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed px-4">
                  Bạn cần đăng nhập để sử dụng tính năng tra từ nhanh và lưu từ
                  vựng vào kho cá nhân.
                </p>
              </div>
              <Link
                href="/login"
                className="px-8 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition-all active:scale-95"
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Đang tra từ...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-400">
              <p>{error}</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Word & IPA */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {result?.word || ""}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm font-mono">
                      /{result?.ipa}/
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300 italic">
                      {result?.pos || ""}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const utterance = new SpeechSynthesisUtterance(
                      result?.word || "",
                    );
                    utterance.lang = "en-US";
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(utterance);
                  }}
                  className="hover:cursor-pointer p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Definition */}
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <p className="text-sky-400 font-medium text-lg leading-relaxed">
                  {result?.definition_vi || ""}
                </p>
              </div>

              {/* Example */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Ngữ cảnh
                </p>
                <p className="text-slate-300 italic text-sm">
                  "{result?.example_en || ""}"
                </p>
                <p className="text-slate-400 text-sm">
                  "{result?.example_vi || ""}"
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {token && (
          <div className="p-4 border-t border-slate-700 bg-slate-900/30">
            <button
              onClick={async () => {
                if (!result) return;
                if (!token) {
                  toast.error("Vui lòng đăng nhập để lưu từ vựng!");
                  return;
                }
                setSaving(true);
                try {
                  const formData = new FormData();
                  formData.append("token", token);
                  formData.append("video_id", videoId.toString());
                  formData.append("word", result.word);
                  formData.append("context_sentence", context);
                  formData.append("ipa", result.ipa || "");
                  formData.append("pos", result.pos || "");
                  formData.append("definition_vi", result.definition_vi || "");
                  formData.append("example_en", result.example_en || "");
                  formData.append("example_vi", result.example_vi || "");

                  const data = await saveFlashcardAction(null, formData);

                  if (data.success) {
                    toast.success(data.message);
                    onClose();
                  } else {
                    toast.error(data.error || "Lỗi khi lưu");
                  }
                } catch (e) {
                  toast.error("Không thể kết nối đến server");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !result || !token}
              className={`w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-bold transition-all shadow-lg ${
                saving || !result || !token
                  ? "bg-slate-600 cursor-not-allowed opacity-50 shadow-none"
                  : "bg-sky-600 hover:bg-sky-500 hover:cursor-pointer active:scale-95 shadow-sky-500/20"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
              {!token
                ? "Yêu cầu đăng nhập"
                : saving
                  ? "Đang lưu..."
                  : "Lưu vào Kho từ vựng"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
