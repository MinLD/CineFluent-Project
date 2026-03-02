"use client";

import { useState } from "react";
import TypingGameSelection from "./TypingGameSelection";
import TypingGamePlay from "./TypingGamePlay";
import { motion, AnimatePresence } from "framer-motion";

interface TypingMap {
  id: number;
  name: string;
  thumbnail_url: string;
  total_chapters: number;
}

export default function SoloTypingGame() {
  const [selectedMap, setSelectedMap] = useState<TypingMap | null>(null);

  return (
    <div className="bg-[#020617] text-white overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!selectedMap ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)", scale: 1.1 }}
            transition={{ duration: 0.8 }}
          >
            <TypingGameSelection onSelectMap={setSelectedMap} />
          </motion.div>
        ) : (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              duration: 0.6,
            }}
          >
            <TypingGamePlay
              map={selectedMap}
              onExit={() => setSelectedMap(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
