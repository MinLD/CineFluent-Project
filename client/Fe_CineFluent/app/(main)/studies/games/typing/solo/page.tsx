import SoloTypingGame from "@/app/components/game/typing";

export const metadata = {
  title: "Solo Typing Game | CineFluent",
  description: "Luyện gõ chữ tiếng Anh một mình qua các nội dung hấp dẫn.",
};

export default function SoloTypingPage() {
  return (
    <div className="min-h-screen bg-[#020617] pt-10">
      <SoloTypingGame />
    </div>
  );
}
