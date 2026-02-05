"use client";

import React from "react";
import { motion } from "framer-motion";

interface SubtitleDisplayProps {
  content: string;
}

const SubtitleDisplay: React.FC<SubtitleDisplayProps> = ({ content }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent"
    >
      <p className="text-white text-center text-xl md:text-2xl font-semibold drop-shadow-lg leading-relaxed">
        {content}
      </p>
    </motion.div>
  );
};

export default SubtitleDisplay;
