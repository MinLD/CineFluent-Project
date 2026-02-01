"use client";
import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white backdrop-blur-md"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Abstract Brand Logo Animation */}
        <div className="relative w-24 h-24 mb-8">
          {/* Outer Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-green-500 border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner Ring Reverse */}
          <motion.div
            className="absolute inset-4 rounded-full border-4 border-t-transparent border-r-green-500 border-b-transparent border-l-blue-500"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Central Pulse */}
          <motion.div
            className="absolute inset-0 m-auto w-4 h-4 bg-gradient-to-tr from-blue-600 to-green-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Loading Text */}
        <div className="flex gap-1">
          {["S", "K", "I", "L", "L", "  ", "T", "I", "M", "E"].map(
            (char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: index * 0.1,
                  repeatDelay: 1,
                }}
                className="font-pacifico text-xl text-blue-500 drop-shadow-[0_2px_2px_rgba(59,130,246,0.6)]"
              >
                {char}
              </motion.span>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
