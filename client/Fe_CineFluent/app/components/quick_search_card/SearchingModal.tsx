"use client";

import { Modal, Button, ConfigProvider, theme } from "antd";
import { Loader2, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import Logo from "@/app/components/logo";

interface SearchingModalProps {
  open: boolean;
  timer: number;
  onCancel: () => void;
}

const tips = [
  "Đang kết nối với hệ thống...",
  "Đang tìm kiếm Mentor phù hợp...",
  "Đang kiểm tra trạng thái online...",
  "Chuẩn bị kết nối...",
];

export default function SearchingModal({
  open,
  timer,
  onCancel,
}: SearchingModalProps) {
  const [tipIndex, setTipIndex] = useState(0);

  // Cycle through tips every 3 seconds
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [open]);

  // Helper format hh:mm
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <Modal
        open={open}
        footer={null}
        closable={false}
        centered
        maskClosable={false}
        width={420}
        className="searching-modal"
        modalRender={(modal) => (
          <div className="bg-transparent shadow-none p-0 overflow-hidden flex justify-center items-center">
            {React.cloneElement(modal as any, {
              style: {
                background: "transparent",
                boxShadow: "none",
                padding: 0,
              },
            })}
            <div
              className="relative overflow-hidden rounded-3xl bg-white shadow-2xl w-full max-w-[420px]"
              style={{ pointerEvents: "auto" }}
            >
              {/* Background Accents - BLUE THEME */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-cyan-500 to-indigo-500"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-100 rounded-full blur-3xl opacity-50"></div>

              <div className="relative flex flex-col items-center justify-center p-8 pt-10">
                {/* --- Pulsing Animation with Logo --- */}
                <div className="relative mb-8">
                  {/* Ripple Rings */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-blue-500 opacity-20"
                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-20"
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.5,
                    }}
                  />

                  {/* Center Content: Logo or Loader */}
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 shadow-inner p-4">
                    <div className="absolute inset-0 rounded-full bg-white opacity-40 blur-sm"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <div className="scale-75 mb-2">
                        <Logo />
                      </div>
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* --- Status Text --- */}
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent mb-2">
                  Đang tìm Mentor
                </h3>

                {/* Rotating Tips */}
                <div className="h-6 mb-6 w-full text-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={tipIndex}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-gray-500 text-sm font-medium"
                    >
                      {tips[tipIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* --- Timer --- */}
                <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-blue-50 border border-blue-100 shadow-sm mb-8">
                  <Clock size={18} className="text-blue-600" />
                  <span className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
                    {formatTime(timer)}
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                </div>

                {/* --- Cancel Button --- */}
                <Button
                  type="text"
                  size="large"
                  icon={<X size={18} />}
                  onClick={onCancel}
                  className="w-full flex items-center justify-center font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all h-12"
                >
                  Hủy tìm kiếm
                </Button>
              </div>
            </div>
          </div>
        )}
      >
        {/* Empty children because content is in modalRender */}
      </Modal>
    </ConfigProvider>
  );
}
