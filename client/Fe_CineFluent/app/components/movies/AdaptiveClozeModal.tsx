"use client";

import { useEffect, useState, useMemo } from "react";
import { BrainCircuit, Loader2 } from "lucide-react";
import { getGrammarTagLabel } from "@/app/lib/constants/grammar";
import { I_Subtitle } from "@/app/lib/types/video";
import { BulbFilled } from "@ant-design/icons";

interface AdaptiveClozeModalProps {
  subtitle: I_Subtitle;
  targetTagId: number;
  onResult: (tagId: number, isCorrect: 1 | 0) => void;
}

export function AdaptiveClozeModal({
  subtitle,
  targetTagId,
  onResult,
}: AdaptiveClozeModalProps) {
  const { maskedSentence, correctWord, options } = useMemo(() => {
    // Nếu có dữ liệu đục lỗ thật từ AI nhúng trong VTT
    if (subtitle.cloze_data) {
      const { masked_text, target_word, distractors } = subtitle.cloze_data;
      
      // Trộn đáp án đúng vào list đáp án nhiễu
      const allOptions = [target_word, ...distractors]
        .map(w => w.trim())
        .filter((v, i, a) => a.indexOf(v) === i) // Uniq
        .sort(() => Math.random() - 0.5);

      return { 
        maskedSentence: masked_text, 
        correctWord: target_word, 
        options: allOptions 
      };
    }

    // Fallback: Nếu không có cloze_data (Sub chưa phân tích AI), trả về rỗng để không hiện lỗi
    return { maskedSentence: "", correctWord: "", options: [] };
  }, [subtitle]);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const handleSelect = (option: string) => {
    if (selectedWord || isEvaluating) return;
    
    setSelectedWord(option);
    setIsEvaluating(true);
    
    const isAnsCorrect = option === correctWord;
    
    // Giả lập thời gian suy nghĩ 1 chút
    setTimeout(() => {
      setIsEvaluating(false);
      setFeedback(isAnsCorrect ? "correct" : "wrong");
    }, 600);
  };

  const handleNext = () => {
    // Trả kết quả về cho Wrapper để bắn API
    onResult(targetTagId, feedback === "correct" ? 1 : 0);
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="bg-[#1a1c23] w-full max-w-xl rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.2)] border border-blue-500/20 overflow-hidden flex flex-col relative mx-4">
        {/* --- HEADER --- */}
        <div className="flex items-center justify-center p-4 border-b border-blue-500/10 bg-blue-500/5">
          <div className="flex items-center gap-2 text-blue-400">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
            <span className="font-bold tracking-widest text-sm">
              AI KNOWLEDGE TRACING
            </span>
          </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="p-8 flex flex-col items-center justify-center min-h-[250px]">
          {/* Debug Info */}
          <div className="bg-blue-900/40 text-blue-300 text-[10px] px-3 py-1 rounded-full mb-6 flex gap-2">
            <span>[TEST_MODE] AI nghi ngờ bạn quên: </span>
            <span className="font-bold">{getGrammarTagLabel(targetTagId)}</span>
          </div>

          {/* Câu bị đục lỗ */}
          <h3 className="text-white text-2xl font-medium text-center mb-8 leading-relaxed px-4">
            {maskedSentence}
          </h3>

          {/* Các lựa chọn */}
          <div className="grid grid-cols-2 gap-4 w-full px-4 mb-4">
            {options.map((option, idx) => {
              const isSelected = selectedWord === option;
              const isCorrectTarget = feedback && option === correctWord;
              const isWrongSelected = feedback === "wrong" && isSelected;
              
              let btnClass = "bg-[#2a2d36] border-white/10 text-white hover:bg-white/10 hover:border-blue-500/50";
              
              if (isEvaluating && isSelected) {
                btnClass = "bg-blue-600 border-blue-500 text-white animate-pulse";
              } else if (feedback) {
                if (isCorrectTarget) {
                  btnClass = "bg-green-600/90 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]";
                } else if (isWrongSelected) {
                  btnClass = "bg-red-600/90 border-red-500 text-white";
                } else {
                  btnClass = "bg-[#2a2d36] border-white/5 text-white/40 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  disabled={isEvaluating || feedback !== null}
                  className={`relative overflow-hidden py-4 px-6 rounded-xl border-2 font-medium text-lg transition-all duration-300 ${btnClass}`}
                >
                  {isEvaluating && isSelected ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/70" />
                  ) : (
                    option
                  )}
                </button>
              );
            })}
          </div>

          {/* Nghĩa TV */}
          <div className="mt-4 text-gray-500 text-[13px] text-center italic w-full">
            "{subtitle.content_vi || "..."}"
          </div>
        </div>
        
        {/* Footer */}
        {feedback && (
          <div className={`p-4 flex items-center justify-between border-t ${feedback === "correct" ? "bg-green-900/20 border-green-500/20" : "bg-red-900/20 border-red-500/20"}`}>
             <div className="flex items-center gap-2">
                <BulbFilled className={feedback === "correct" ? "text-green-400" : "text-red-400"} />
                <span className={`text-sm font-medium ${feedback === "correct" ? "text-green-400" : "text-red-400"}`}>
                  {feedback === "correct" ? "+20% Mastery" : "-15% Mastery"}
                </span>
             </div>
             <button
               onClick={handleNext}
               className="bg-white text-black px-6 py-2 rounded-lg font-bold text-sm tracking-wide hover:bg-gray-200 hover:scale-105 transition-all"
             >
               TIẾP TỤC
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
