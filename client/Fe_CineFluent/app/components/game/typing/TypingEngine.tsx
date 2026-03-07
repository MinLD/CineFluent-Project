"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface Props {
  text: string;
  onComplete: (stats: { wpm: number; accuracy: number }) => void;
  onProgress?: (progress: number, wpm: number) => void;
}

export default function TypingEngine({ text, onComplete, onProgress }: Props) {
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [mistakes, setMistakes] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [lastSpokenIndex, setLastSpokenIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const chars = text.split("");

  const calculateStats = useCallback(() => {
    if (!startTime) return;
    const now = Date.now();
    const timeInMinutes = (now - startTime) / 60000;

    // WPM = (all typed characters / 5) / time in minutes
    // Using 5 as average word length
    const currentWpm = Math.round(
      userInput.length / 5 / (timeInMinutes || 0.01),
    );
    setWpm(currentWpm > 0 ? currentWpm : 0);

    // Accuracy Calculation
    const currentAccuracy = Math.max(
      0,
      Math.round(
        ((userInput.length - mistakes) / (userInput.length || 1)) * 100,
      ),
    );
    setAccuracy(currentAccuracy);
  }, [userInput.length, mistakes, startTime]);

  useEffect(() => {
    if (userInput.length > 0 && !startTime) {
      setStartTime(Date.now());
    }

    if (userInput.length > 0 && userInput.length <= text.length) {
      calculateStats();
    }

    // Broadcast progress
    if (onProgress && userInput.length <= text.length) {
      const currentProgress =
        (userInput.length / Math.max(1, text.length)) * 100;
      onProgress(currentProgress, wpm);
    }

    if (userInput.length === text.length && text.length > 0 && !isFinished) {
      setIsFinished(true);
      const finalTime = (Date.now() - (startTime || Date.now())) / 60000;
      const finalWpm = Math.round(userInput.length / 5 / (finalTime || 0.01));

      // Delay a bit for visual feedback
      setTimeout(() => {
        onComplete({ wpm: finalWpm, accuracy });
      }, 500);
    }
  }, [
    userInput,
    text.length,
    calculateStats,
    onComplete,
    startTime,
    isFinished,
    accuracy,
  ]);

  const speakWord = (word: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Stop current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 1.05;
    utterance.volume = 1.0;

    // Essential for some browsers to choose a voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Prefer Google US English if available
      const enVoice =
        voices.find(
          (v) => v.name.includes("Google") && v.lang.startsWith("en"),
        ) || voices.find((v) => v.lang.startsWith("en"));
      if (enVoice) utterance.voice = enVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleKeyDown = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isFinished) return;

    if (value.length <= text.length) {
      // Word completion audio logic
      if (value.length > userInput.length) {
        const lastCharTyped = value[value.length - 1];
        // Trigger on space or if it's the very last character of the text
        const isSpaceOrEnd =
          lastCharTyped === " " || value.length === text.length;

        if (isSpaceOrEnd) {
          const wordsTarget = text.split(" ");
          const wordsTyped = value.trim().split(" ");
          const currentWordIndex = wordsTyped.length - 1;

          if (currentWordIndex > lastSpokenIndex) {
            const targetWord = wordsTarget[currentWordIndex];
            const typedWord = wordsTyped[currentWordIndex];

            if (targetWord === typedWord) {
              speakWord(targetWord);
              setLastSpokenIndex(currentWordIndex);
            }
          }
        }
      }

      if (value.length > userInput.length) {
        const lastTypedChar = value[value.length - 1];
        const targetChar = text[value.length - 1];

        if (lastTypedChar !== targetChar) {
          setMistakes((prev) => prev + 1);
        }
      }
      setUserInput(value);
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    focusInput();
    const handleClick = () => {
      focusInput();
      // "Warm up" speech synthesis on first click
      if (window.speechSynthesis) {
        const warmUp = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(warmUp);
      }
    };
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto" onClick={focusInput}>
      {/* Hidden Input */}
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={handleKeyDown}
        className="absolute opacity-0 pointer-events-none"
        autoFocus
      />

      {/* Stats Dashboard */}
      <div className="flex justify-center items-center gap-8 mb-4 bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/5 shadow-xl">
        <div className="text-center relative group">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2 px-4 py-1 bg-white/5 rounded-full">
            Speed
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white font-mono tracking-tighter">
              {wpm}
            </span>
            <span className="text-slate-500 font-bold text-xs uppercase">
              WPM
            </span>
          </div>
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-sky-500/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-sky-500"
              animate={{ width: `${Math.min(wpm * 1.5, 100)}%` }}
            />
          </div>
        </div>

        <div className="w-[1px] h-16 bg-white/10" />

        <div className="text-center relative">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2 px-4 py-1 bg-white/5 rounded-full">
            Accuracy
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">
              {accuracy}
            </span>
            <span className="text-slate-500 font-bold text-xs uppercase">
              %
            </span>
          </div>
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-emerald-500/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500"
              animate={{ width: `${accuracy}%` }}
            />
          </div>
        </div>
      </div>

      {/* Typing Engine Visuals */}
      <div className="relative">
        {/* Decorative elements */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-sky-500/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/20 blur-[100px] rounded-full" />

        <div className="bg-slate-950/40 backdrop-blur-3xl p-4 rounded-[32px] border-2 border-white/5 shadow-[0_32px_128px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden min-h-[120px] flex items-center">
          <div className="flex flex-wrap text-xl md:text-2xl font-black leading-[1.4] tracking-tight font-mono select-none">
            {chars.map((char, index) => {
              let state = "idle"; // idle, correct, wrong
              let isCurrent = index === userInput.length;

              if (index < userInput.length) {
                state = userInput[index] === char ? "correct" : "wrong";
              }

              return (
                <motion.span
                  key={index}
                  initial={false}
                  animate={{
                    color:
                      state === "correct"
                        ? "#10b981"
                        : state === "wrong"
                          ? "#f43f5e"
                          : "#334155",
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  className={`relative px-[0.05em] transition-colors duration-150 ${state === "wrong" ? "bg-rose-500/10 rounded-lg shadow-[0_0_20px_rgba(244,63,94,0.2)]" : ""}`}
                >
                  {char === " " ? "\u00A0" : char}
                  {isCurrent && (
                    <motion.div
                      layoutId="cursor"
                      className="absolute bottom-0 left-0 w-full h-1.5 bg-sky-400 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-3 text-slate-500 font-bold bg-white/5 px-6 py-3 rounded-2xl border border-white/5 backdrop-blur-sm">
          {!startTime ? (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
              Sẵn sàng? Bắt đầu gõ để khởi hành!
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Gõ hết đoạn văn này để qua chương tiếp theo
            </>
          )}
        </div>
      </div>
    </div>
  );
}
