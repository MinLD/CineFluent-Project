"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { RotateCcw, Keyboard, ArrowRight } from "lucide-react";
import { I_Subtitle } from "@/app/lib/types/video";
import { BulbFilled } from "@ant-design/icons";

interface DictationModalProps {
  subtitle: I_Subtitle;
  onClose: () => void;
  onReplay: () => void;
  onNext: () => void;
}

export function DictationModal({
  subtitle,
  onClose,
  onReplay,
  onNext,
}: DictationModalProps) {
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Tự động focus vào ô nhập liệu khi mở modal
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 2. Tách câu tiếng Anh thành các từ để xử lý giao diện
  // Ví dụ: "Hello world" -> ["Hello", "world"]
  const words = useMemo(() => {
    if (!subtitle.content_en) return [];
    return subtitle.content_en.trim().split(/\s+/);
  }, [subtitle.content_en]);

  // 3. Xử lý khi người dùng nhập liệu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  // 4. Portal logic
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-[50] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="bg-[#1a1a1a] w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col relative mx-4">
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2 text-blue-500">
            <Keyboard className="w-5 h-5" />
            <span className="font-bold tracking-wide text-sm">
              CHẾ ĐỘ NGHE CHÉP
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:cursor-pointer transition-colors text-sm font-medium"
          >
            Bỏ qua (Esc)
          </button>
        </div>

        {/* --- CONTENT --- */}
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          {/* Nghĩa Tiếng Việt */}
          <div className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-4">
            NGHĨA TIẾNG VIỆT
          </div>
          <h3 className="text-white text-xl md:text-2xl font-medium text-center mb-10 leading-relaxed px-4">
            "{subtitle.content_vi || "..."}"
          </h3>

          {/* Khu vực Hiển thị Từ & Feedback (Placeholder) */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-6 mb-10 w-full px-8 select-none">
            {words.map((word, wordIndex) => {
              // Logic so sánh từ người dùng nhập với từ gốc
              const inputValues = userInput.split(" ");
              const userWord = inputValues[wordIndex] || "";

              const isCurrentWord = wordIndex === inputValues.length - 1; // Từ đang gõ
              const isPastWord = wordIndex < inputValues.length - 1; // Từ đã gõ xong (đã bấm Space)

              // Chuẩn hóa chuỗi để so sánh (bỏ dấu câu, lowercase)
              const targetClean = word.toLowerCase().replace(/[.,!?;:"]/g, "");
              const userClean = userWord
                .toLowerCase()
                .replace(/[.,!?;:"]/g, "");

              // Kiểm tra Đúng/Sai
              const isCorrect = isPastWord && userClean === targetClean;
              const isWrong = isPastWord && userClean !== targetClean;

              return (
                <div
                  key={wordIndex}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex gap-1">
                    {/* CASE 1: Đã gõ xong và ĐÚNG -> Hiện từ màu xanh */}
                    {isCorrect ? (
                      <span className="text-green-400 text-xl font-medium animate-fade-in">
                        {word}
                      </span>
                    ) : /* CASE 2: Đã gõ xong mà SAI -> Hiện từ người dùng nhập (gạch ngang đỏ) */
                    isWrong ? (
                      <span className="text-red-400 text-xl font-medium animate-fade-in line-through decoration-red-500/50">
                        {userWord || "..."}
                      </span>
                    ) : (
                      /* CASE 3: Chưa gõ hoặc Đang gõ -> Hiện các dấu chấm tròn (ẩn từ gốc) */
                      word.split("").map((char, charIndex) => {
                        const isTyped =
                          isCurrentWord && charIndex < userWord.length;
                        return (
                          <div
                            key={charIndex}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              isTyped ? "bg-blue-500 scale-125" : "bg-gray-600"
                            }`}
                          ></div>
                        );
                      })
                    )}
                  </div>

                  {/* Đường kẻ dưới chân để định hình từ */}
                  {!isCorrect && !isWrong && (
                    <div
                      className={`h-0.5 w-full rounded-full mt-1 transition-colors ${
                        isCurrentWord ? "bg-blue-500/50" : "bg-gray-700"
                      }`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ô Nhập liệu Chính */}
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              // Ngăn không cho sự kiện phím lan ra ngoài làm Video Player bắt nhầm (Play/Pause)
              e.stopPropagation();
            }}
            placeholder="Nghe và gõ lại tại đây..."
            className="w-full bg-[#2a2a2a] text-white text-lg px-6 py-4 rounded-xl border border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600 text-center"
            spellCheck={false}
          />

          {/* Mẹo hướng dẫn */}
          <div className="mt-3 text-gray-500 text-sm italic flex items-center gap-2">
            <span>
              <BulbFilled />
            </span>
            <span>Mẹo: Nhấn phím cách (Space) để kiểm tra từng từ.</span>
            <span className="text-green-500 font-bold mx-1">Xanh: Đúng</span>
            <span>|</span>
            <span className="text-red-500 font-bold mx-1">Đỏ: Sai</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-6 mt-6">
            <button
              onClick={onReplay}
              className="hover:cursor-pointer flex flex-col items-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center group-hover:border-white group-hover:bg-white/10 transition-all">
                <RotateCcw className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 tracking-wider group-hover:text-gray-300">
                NGHE LẠI
              </span>
            </button>

            <button
              onClick={onNext}
              className="hover:cursor-pointer flex flex-col items-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full border border-blue-600 bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:text-white" />
              </div>
              <span className="text-[10px] font-bold text-blue-500 tracking-wider group-hover:text-blue-300">
                TIẾP TỤC
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
